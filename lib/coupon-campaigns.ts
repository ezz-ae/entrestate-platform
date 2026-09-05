/**
 * COUPON CAMPAIGNS — the rows behind lib/business/coupons.ts.
 *
 * The owner: "the coupons and codes are our marketing system in general —
 * coupon numbers to the coupon sites at 20/40/60, big vouchers sold on the
 * gift sites, ad credit on Meta for Realtors and the landing builder as the
 * bait." Three tables on the shared schema, beside the credit ledger
 * (lib/account-credit.ts) they post into:
 *
 *   entrestate_coupon_campaigns  the batch: kind, source, amount, scope,
 *                                ceiling, window, status. Never deleted —
 *                                'ended' is how a campaign stops.
 *   entrestate_coupon_codes      a code and its ceiling: a coupon's ONE
 *                                shared code with the campaign's ceiling; a
 *                                voucher batch's MANY codes with a ceiling
 *                                of one each.
 *   entrestate_coupon_claims     the landings — one per (code, account); for
 *                                a coupon also one per (campaign, human), so
 *                                the same person on a second account does not
 *                                land it twice. A voucher was paid for, so it
 *                                is one per CODE and nothing else.
 *
 * A claim and its grant are one transaction (withTransaction): a claim
 * without its credit cannot exist. The ceiling is counted inside that
 * transaction with the code row locked (FOR UPDATE), so two people typing
 * the last coupon at once do not both land it. An 'ads' campaign posts no
 * grant: its amount becomes a REQUEST on the account's Ads Coin wallet —
 * createRequest, the same door the top-up form uses — and moves only when a
 * person approves it in the finance screen. This module never imports
 * postTransfer or decideRequest; the guard holds it to that.
 *
 * The desk that mints campaigns is /ctrl/coupons — staff-gated, vendor host
 * only; app/ctrl/coupons/actions.ts is the only writer of campaigns.
 */
import { randomUUID } from 'node:crypto'
import { query, runWithDefaultSchema, withTransaction, ensureOnce } from '@/lib/db'
import { aedToFils, filsToAed } from '@/lib/freehold/wallet'
import { createRequest } from '@/lib/freehold/wallet-db'
import { ensureAccountWallet } from '@/lib/account-wallet'
import { ensureCreditTables, fingerprintOf, type Human } from '@/lib/account-credit'
import type { BusinessAccount } from '@/lib/terminal-account'
import {
  amountAllowed, campaignOpen, couponCodeAllowed, isCreditScope, mintCouponCode, mintVoucherCode, normalizeCode,
  scopeLabel, VOUCHER_BATCH_MAX,
  type Campaign, type CampaignKind, type CampaignRefusal, type CampaignStatus, type CreditScope,
} from '@/lib/business/coupons'

const ensureTables = () =>
  ensureOnce('entrestate-coupons', () =>
    runWithDefaultSchema(async () => {
      await ensureCreditTables()
      await query(`
        CREATE TABLE IF NOT EXISTS entrestate_coupon_campaigns (
          id              text PRIMARY KEY,
          kind            text NOT NULL CHECK (kind IN ('coupon', 'voucher')),
          name            text NOT NULL,
          source          text NOT NULL DEFAULT '',
          amount          bigint NOT NULL CHECK (amount > 0),
          scope           text NOT NULL DEFAULT 'bills',
          max_redemptions integer,
          valid_from      timestamptz NOT NULL DEFAULT now(),
          valid_until     timestamptz,
          status          text NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'paused', 'ended')),
          created_by      text NOT NULL DEFAULT '',
          created_at      timestamptz NOT NULL DEFAULT now()
        )
      `)
      await query(`
        CREATE TABLE IF NOT EXISTS entrestate_coupon_codes (
          code         text PRIMARY KEY,
          campaign_id  text NOT NULL REFERENCES entrestate_coupon_campaigns(id),
          max_uses     integer,
          created_at   timestamptz NOT NULL DEFAULT now()
        )
      `)
      await query(`CREATE INDEX IF NOT EXISTS entrestate_coupon_codes_campaign ON entrestate_coupon_codes (campaign_id)`)
      await query(`
        CREATE TABLE IF NOT EXISTS entrestate_coupon_claims (
          id           text PRIMARY KEY,
          campaign_id  text NOT NULL REFERENCES entrestate_coupon_campaigns(id),
          code         text NOT NULL REFERENCES entrestate_coupon_codes(code),
          account_id   text NOT NULL REFERENCES entrestate_accounts(id),
          fingerprint  text NOT NULL,
          address      text NOT NULL,
          claimed_at   timestamptz NOT NULL DEFAULT now(),
          UNIQUE (code, account_id)
        )
      `)
      await query(`CREATE INDEX IF NOT EXISTS entrestate_coupon_claims_campaign ON entrestate_coupon_claims (campaign_id, claimed_at DESC)`)
      await query(`CREATE INDEX IF NOT EXISTS entrestate_coupon_claims_human ON entrestate_coupon_claims (campaign_id, fingerprint)`)
      await query(`CREATE INDEX IF NOT EXISTS entrestate_coupon_claims_address ON entrestate_coupon_claims (campaign_id, address)`)
    }),
  )

type CampaignRow = {
  id: string; kind: CampaignKind; name: string; source: string; amount: string; scope: string
  max_redemptions: number | null; valid_from: string; valid_until: string | null; status: CampaignStatus
}

const toCampaign = (r: CampaignRow): Campaign => ({
  id: r.id,
  kind: r.kind,
  name: r.name,
  source: r.source,
  amountFils: Number(r.amount),
  scope: isCreditScope(r.scope) ? r.scope : 'bills',
  maxRedemptions: r.max_redemptions === null ? null : Number(r.max_redemptions),
  validFrom: r.valid_from,
  validUntil: r.valid_until,
  status: r.status,
})

/* ── the desk: minting ──────────────────────────────────────────────────── */

export interface NewCampaign {
  kind: CampaignKind
  name: string
  source: string
  amountAed: number
  scope: CreditScope
  /** Coupon: the ceiling on landings (null = none). Voucher: the batch size. */
  count: number | null
  /** Coupon only: the code the desk chose; empty mints one. */
  code?: string
  validUntil?: string | null
  createdBy: string
}

export type MintOutcome =
  | { ok: true; campaign: Campaign; codes: string[] }
  | { ok: false; reason: 'bad_amount' | 'bad_scope' | 'bad_code' | 'code_taken' | 'bad_count' | 'name_required' | 'failed' }

/**
 * Mint a campaign and its code(s). A coupon gets ONE code with the
 * campaign's ceiling; a voucher batch gets `count` codes with a ceiling of
 * one each. All rows land in one transaction.
 */
export async function mintCampaign(input: NewCampaign): Promise<MintOutcome> {
  const name = input.name.trim()
  if (!name) return { ok: false, reason: 'name_required' }
  if (!amountAllowed(input.kind, input.amountAed)) return { ok: false, reason: 'bad_amount' }
  if (!isCreditScope(input.scope)) return { ok: false, reason: 'bad_scope' }
  const count = input.count === null ? null : Math.floor(Number(input.count))
  if (input.kind === 'voucher' && (count === null || !(count >= 1 && count <= VOUCHER_BATCH_MAX))) return { ok: false, reason: 'bad_count' }
  if (input.kind === 'coupon' && count !== null && !(count >= 1 && count <= 1_000_000)) return { ok: false, reason: 'bad_count' }

  let codes: string[] = []
  if (input.kind === 'coupon') {
    const chosen = normalizeCode(input.code ?? '')
    if (chosen && !couponCodeAllowed(chosen)) return { ok: false, reason: 'bad_code' }
    codes = [chosen || mintCouponCode(input.amountAed)]
  } else {
    const seen = new Set<string>()
    while (seen.size < (count ?? 0)) seen.add(mintVoucherCode(input.amountAed))
    codes = [...seen]
  }

  const id = `cc_${randomUUID()}`
  const validUntil = input.validUntil ? new Date(input.validUntil) : null
  if (validUntil && !Number.isFinite(validUntil.getTime())) return { ok: false, reason: 'failed' }

  try {
    await ensureTables()
    const taken = await runWithDefaultSchema(() =>
      query<{ code: string }>(`SELECT code FROM entrestate_coupon_codes WHERE code = ANY($1::text[])`, [codes]))
    if (taken.length > 0 && input.kind === 'coupon') return { ok: false, reason: 'code_taken' }
    // A minted voucher that collides (8 letters of 32 — a lottery) is simply re-minted.
    if (taken.length > 0) {
      const gone = new Set(taken.map((t) => t.code))
      codes = codes.filter((c) => !gone.has(c))
      while (codes.length < (count ?? 0)) { const c = mintVoucherCode(input.amountAed); if (!gone.has(c) && !codes.includes(c)) codes.push(c) }
    }

    const row = await runWithDefaultSchema(() =>
      withTransaction(async (tx) => {
        const rows = await tx<CampaignRow>(
          `INSERT INTO entrestate_coupon_campaigns (id, kind, name, source, amount, scope, max_redemptions, valid_until, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, kind, name, source, amount::text, scope, max_redemptions, valid_from::text, valid_until::text, status`,
          [id, input.kind, name, input.source.trim(), aedToFils(input.amountAed), input.scope,
            input.kind === 'coupon' ? count : codes.length, validUntil, input.createdBy])
        for (const code of codes) {
          await tx(
            `INSERT INTO entrestate_coupon_codes (code, campaign_id, max_uses) VALUES ($1, $2, $3)`,
            [code, id, input.kind === 'coupon' ? count : 1])
        }
        return rows[0]
      }))
    return { ok: true, campaign: toCampaign(row), codes }
  } catch (err) {
    console.error('[coupon-campaigns] mint failed', err)
    return { ok: false, reason: 'failed' }
  }
}

/** Pause, resume or end a campaign. Ending is final; nothing is deleted. */
export async function setCampaignStatus(id: string, status: CampaignStatus): Promise<boolean> {
  try {
    await ensureTables()
    const rows = await runWithDefaultSchema(() =>
      query<{ id: string }>(
        `UPDATE entrestate_coupon_campaigns SET status = $2 WHERE id = $1 AND status <> 'ended' RETURNING id`,
        [id, status]))
    return rows.length > 0
  } catch (err) {
    console.error('[coupon-campaigns] status failed', err)
    return false
  }
}

/* ── the desk: reading ──────────────────────────────────────────────────── */

export interface CampaignLine extends Campaign {
  amountAed: string
  scopeLabel: string
  /** The coupon's one code; a voucher batch shows its size instead. */
  code: string | null
  codeCount: number
  redeemed: number
  /** What has landed through it, in AED — the campaign's cost so far. */
  landedAed: string
}

export async function listCampaigns(): Promise<CampaignLine[]> {
  try {
    await ensureTables()
    const rows = await runWithDefaultSchema(() =>
      query<CampaignRow & { code_count: string; redeemed: string; first_code: string | null }>(
        `SELECT c.id, c.kind, c.name, c.source, c.amount::text, c.scope, c.max_redemptions,
                c.valid_from::text, c.valid_until::text, c.status,
                (SELECT count(*)::text FROM entrestate_coupon_codes k WHERE k.campaign_id = c.id) AS code_count,
                (SELECT count(*)::text FROM entrestate_coupon_claims l WHERE l.campaign_id = c.id) AS redeemed,
                (SELECT k.code FROM entrestate_coupon_codes k WHERE k.campaign_id = c.id ORDER BY k.code LIMIT 1) AS first_code
           FROM entrestate_coupon_campaigns c
          ORDER BY c.created_at DESC`))
    return rows.map((r) => {
      const c = toCampaign(r)
      const redeemed = Number(r.redeemed)
      return {
        ...c,
        amountAed: filsToAed(c.amountFils),
        scopeLabel: scopeLabel(c.scope),
        code: c.kind === 'coupon' ? r.first_code : null,
        codeCount: Number(r.code_count),
        redeemed,
        landedAed: filsToAed(redeemed * c.amountFils),
      }
    })
  } catch (err) {
    console.error('[coupon-campaigns] list failed', err)
    return []
  }
}

export interface CampaignDetail extends CampaignLine {
  codes: Array<{ code: string; used: number; maxUses: number | null }>
  claims: Array<{ code: string; account: string; claimedAt: string }>
}

/** One campaign with its codes (a voucher batch's list, to hand to the gift site) and its landings. */
export async function readCampaign(id: string): Promise<CampaignDetail | null> {
  const line = (await listCampaigns()).find((c) => c.id === id)
  if (!line) return null
  try {
    const [codes, claims] = await runWithDefaultSchema(() => Promise.all([
      query<{ code: string; used: string; max_uses: number | null }>(
        `SELECT k.code, k.max_uses, (SELECT count(*)::text FROM entrestate_coupon_claims l WHERE l.code = k.code) AS used
           FROM entrestate_coupon_codes k WHERE k.campaign_id = $1 ORDER BY k.created_at, k.code`, [id]),
      query<{ code: string; email: string | null; account_id: string; claimed_at: string }>(
        `SELECT l.code, a.email, l.account_id, l.claimed_at::text
           FROM entrestate_coupon_claims l JOIN entrestate_accounts a ON a.id = l.account_id
          WHERE l.campaign_id = $1 ORDER BY l.claimed_at DESC LIMIT 200`, [id]),
    ]))
    return {
      ...line,
      codes: codes.map((k) => ({ code: k.code, used: Number(k.used), maxUses: k.max_uses === null ? null : Number(k.max_uses) })),
      claims: claims.map((l) => ({ code: l.code, account: l.email ?? l.account_id, claimedAt: l.claimed_at })),
    }
  } catch (err) {
    console.error('[coupon-campaigns] read failed', err)
    return null
  }
}

/* ── redeeming ──────────────────────────────────────────────────────────── */

export type CampaignRedeemOutcome =
  | { ok: true; campaign: Campaign; amountAed: string; scope: CreditScope; adsRequestId: string | null; already: boolean }
  | { ok: false; reason: 'unknown_code' | 'already_claimed' | 'human_already' | CampaignRefusal | 'failed' }

/**
 * Redeem a coupon or a voucher code for this account. The code row is
 * locked for the length of the transaction so the ceiling holds under two
 * hands; the claim and the grant land together or not at all. A coupon is
 * once per account and once per human; a voucher is once per code.
 */
export async function redeemCampaignCode(account: BusinessAccount, raw: string, human: Human): Promise<CampaignRedeemOutcome> {
  const code = normalizeCode(raw)
  if (!code) return { ok: false, reason: 'unknown_code' }
  const fp = fingerprintOf(human)
  const address = human.address.trim()
  try {
    await ensureTables()
    const result = await runWithDefaultSchema(() =>
      withTransaction(async (tx) => {
        const codeRows = await tx<{ code: string; campaign_id: string; max_uses: number | null }>(
          `SELECT code, campaign_id, max_uses FROM entrestate_coupon_codes WHERE code = $1 FOR UPDATE`, [code])
        const k = codeRows[0]
        if (!k) return { kind: 'unknown' as const }
        const cRows = await tx<CampaignRow>(
          `SELECT id, kind, name, source, amount::text, scope, max_redemptions, valid_from::text, valid_until::text, status
             FROM entrestate_coupon_campaigns WHERE id = $1`, [k.campaign_id])
        if (!cRows[0]) return { kind: 'unknown' as const }
        const campaign = toCampaign(cRows[0])

        const mine = await tx<{ id: string }>(
          `SELECT id FROM entrestate_coupon_claims WHERE code = $1 AND account_id = $2`, [code, account.id])
        if (mine[0]) return { kind: 'already_mine' as const, campaign }

        if (campaign.kind === 'coupon') {
          const human_ = await tx<{ n: string }>(
            `SELECT count(*)::text AS n FROM entrestate_coupon_claims
              WHERE campaign_id = $1 AND (account_id = $2 OR fingerprint = $3 OR address = $4)`,
            [campaign.id, account.id, fp, address])
          if (Number(human_[0]?.n ?? 0) > 0) return { kind: 'human_already' as const, campaign }
        }

        const used = await tx<{ n: string }>(`SELECT count(*)::text AS n FROM entrestate_coupon_claims WHERE code = $1`, [code])
        const usedN = Number(used[0]?.n ?? 0)
        if (k.max_uses !== null && usedN >= Number(k.max_uses)) return { kind: 'refused' as const, reason: 'used_up' as const, campaign }
        const landed = await tx<{ n: string }>(`SELECT count(*)::text AS n FROM entrestate_coupon_claims WHERE campaign_id = $1`, [campaign.id])
        const open = campaignOpen(campaign, Number(landed[0]?.n ?? 0), new Date())
        if (!open.ok) return { kind: 'refused' as const, reason: open.reason, campaign }

        const id = `cl_${randomUUID()}`
        await tx(
          `INSERT INTO entrestate_coupon_claims (id, campaign_id, code, account_id, fingerprint, address)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, campaign.id, code, account.id, fp, address])
        if (campaign.scope !== 'ads') {
          const where = campaign.scope === 'bills' ? 'your account' : scopeLabel(campaign.scope)
          await tx(
            `INSERT INTO entrestate_credit_postings (id, account_id, kind, amount, reference, memo, scope)
             VALUES ($1, $2, 'grant', $3, $4, $5, $6)
             ON CONFLICT (reference) DO NOTHING`,
            [`cp_${randomUUID()}`, account.id, campaign.amountFils, `coupon:${id}`, `${code} — AED ${filsToAed(campaign.amountFils)} on ${where}`, campaign.scope])
        }
        return { kind: 'claimed' as const, id, campaign }
      }))

    if (result.kind === 'unknown') return { ok: false, reason: 'unknown_code' }
    if (result.kind === 'human_already') return { ok: false, reason: 'human_already' }
    if (result.kind === 'refused') return { ok: false, reason: result.reason }
    const { campaign } = result
    const amountAed = filsToAed(campaign.amountFils)
    if (result.kind === 'already_mine') return { ok: true, campaign, amountAed, scope: campaign.scope, adsRequestId: null, already: true }

    // Ad credit: a REQUEST on the Ads Coin wallet, pending a person.
    let adsRequestId: string | null = null
    if (campaign.scope === 'ads') {
      const wallet = await ensureAccountWallet(account)
      if (wallet) {
        const req = await runWithDefaultSchema(() =>
          createRequest({
            id: `wr_${randomUUID()}`,
            walletId: wallet.id,
            amount: campaign.amountFils,
            reason: `Coupon ${code}: ad credit for ${account.email ?? account.id} (${campaign.name})`,
            requestedBy: `coupon:${result.id}`,
          }))
        adsRequestId = req?.id ?? null
      }
    }
    return { ok: true, campaign, amountAed, scope: campaign.scope, adsRequestId, already: false }
  } catch (err) {
    console.error('[coupon-campaigns] redeem failed', err)
    return { ok: false, reason: 'failed' }
  }
}
