/**
 * THE ACCOUNT'S CREDIT — the ledger behind lib/business/offers.ts.
 *
 * The owner's flow, verbatim: "On the landing page we tell him: start with
 * AED 500 of credit. He comes in, takes a code, and redeems it. The code is
 * issued ONCE per human — by device, by network, by email, by everything.
 * He has 500. If he pays the full-system subscription he finds the whole
 * 500 taken off and pays the rest. An app he cannot pay in full from us."
 *
 * Three tables on the shared schema, beside the account spine
 * (lib/terminal-account.ts):
 *
 *   entrestate_offer_codes      a code minted for ONE account and ONE offer,
 *                               with the fingerprint of the human it was
 *                               issued to (email is the account; device is
 *                               the user agent; network is the address).
 *   entrestate_offer_claims     the redemption — one per (account, offer),
 *                               and one per (offer, fingerprint) and
 *                               (offer, address): the same human on a second
 *                               account does not land it twice.
 *   entrestate_credit_postings  the credit's own book: 'grant' from a claim,
 *                               'apply' against an invoice. Balance is the
 *                               sum; nothing is ever edited or deleted.
 *
 * WHAT THIS IS NOT. It is not Ads Coin. Credit here is deducted from the
 * account's invoices (applyCredit) and never paid out; the money core
 * (lib/freehold/wallet*.ts) is not touched. The ONE bridge is the ads part
 * of an offer, which becomes a pending request on the account's Ads Coin
 * wallet — createRequest, the same door the top-up form uses — and moves
 * only when a person approves it in the finance screen. This module never
 * imports postTransfer or decideRequest; the guard holds it to that.
 *
 * IDEMPOTENT BY REFERENCE. A grant carries `claim:<id>`, an application
 * `invoice:<id>:<scope>`; a retried request posts nothing twice.
 *
 * POCKETS. Every posting carries a SCOPE (lib/business/coupons.ts): 'bills'
 * is the general credit — the house offers land here — and a campaign may
 * aim its credit at one pocket: 'pages' for the landing builder, 'app:<id>'
 * for one app. An invoice draws on its own pocket first, then the general
 * one (scopesForInvoice), so bait is spent where it was aimed. The balance a
 * screen shows is the sum of the pockets; the pockets are said beneath it.
 */
import { createHash, randomUUID } from 'node:crypto'
import { query, runWithDefaultSchema, withTransaction, ensureOnce } from '@/lib/db'
import { aedToFils, filsToAed } from '@/lib/freehold/wallet'
import { createRequest } from '@/lib/freehold/wallet-db'
import { ensureAccountWallet } from '@/lib/account-wallet'
import type { BusinessAccount } from '@/lib/terminal-account'
import {
  OFFERS, annualCashback, applyCredit, mintCode, offerOfCode,
  type Invoice, type Offer, type OfferId,
} from '@/lib/business/offers'
import { scopesForInvoice, splitAcrossScopes, scopeLabel, isCreditScope, type CreditScope } from '@/lib/business/coupons'
import { FULL_SYSTEM } from '@/lib/business/full-system'

const ensureTables = () =>
  ensureOnce('entrestate-credit', () =>
    runWithDefaultSchema(async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS entrestate_offer_codes (
          code        text PRIMARY KEY,
          account_id  text NOT NULL REFERENCES entrestate_accounts(id),
          offer_id    text NOT NULL,
          fingerprint text NOT NULL,
          address     text NOT NULL,
          issued_at   timestamptz NOT NULL DEFAULT now(),
          UNIQUE (account_id, offer_id)
        )
      `)
      await query(`
        CREATE TABLE IF NOT EXISTS entrestate_offer_claims (
          id          text PRIMARY KEY,
          account_id  text NOT NULL REFERENCES entrestate_accounts(id),
          offer_id    text NOT NULL,
          code        text NOT NULL,
          fingerprint text NOT NULL,
          address     text NOT NULL,
          claimed_at  timestamptz NOT NULL DEFAULT now(),
          UNIQUE (account_id, offer_id)
        )
      `)
      await query(`CREATE INDEX IF NOT EXISTS entrestate_offer_claims_human ON entrestate_offer_claims (offer_id, fingerprint)`)
      await query(`CREATE INDEX IF NOT EXISTS entrestate_offer_claims_address ON entrestate_offer_claims (offer_id, address)`)
      await query(`
        CREATE TABLE IF NOT EXISTS entrestate_credit_postings (
          id          text PRIMARY KEY,
          account_id  text NOT NULL REFERENCES entrestate_accounts(id),
          kind        text NOT NULL CHECK (kind IN ('grant', 'apply')),
          amount      bigint NOT NULL CHECK (amount > 0),
          reference   text NOT NULL UNIQUE,
          memo        text NOT NULL DEFAULT '',
          created_at  timestamptz NOT NULL DEFAULT now()
        )
      `)
      await query(`CREATE INDEX IF NOT EXISTS entrestate_credit_postings_account ON entrestate_credit_postings (account_id, created_at DESC)`)
      // The pocket a posting belongs to. Added after the ledger shipped, so
      // it is an ALTER with a default: every earlier posting is general credit.
      await query(`ALTER TABLE entrestate_credit_postings ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'bills'`)
    }),
  )

/** The ledger's tables, once per process — for lib/coupon-campaigns.ts, which posts grants here. */
export const ensureCreditTables = ensureTables

/** Who is at the keyboard, as far as a server can tell: the device and the network. */
export interface Human {
  /** The request's user agent. */
  userAgent: string
  /** The request's address (the first hop of x-forwarded-for, or the socket). */
  address: string
}

/** Device + network, hashed — stored, compared, never printed. */
export function fingerprintOf(human: Human): string {
  return createHash('sha256').update(`${human.userAgent.trim()}|${human.address.trim()}`).digest('hex').slice(0, 32)
}

/** What the account is on, for offers that require a plan. Filled in by the caller. */
export interface AccountStanding {
  plan?: 'six_month' | 'annual' | null
  annualPriceAed?: number
}

function eligible(offer: Offer, standing: AccountStanding): boolean {
  if (offer.requires === 'account') return true
  if (offer.requires === 'six_month_plan') return standing.plan === 'six_month'
  if (offer.requires === 'annual_plan') return standing.plan === 'annual'
  return false
}

function amountsFor(offer: Offer, standing: AccountStanding): { systemAed: number; adsAed: number } {
  if (offer.id === 'annual_cashback') return annualCashback(standing.annualPriceAed ?? FULL_SYSTEM.yearlyAed)
  return { systemAed: offer.systemAed, adsAed: offer.adsAed }
}

/* ── issuing ────────────────────────────────────────────────────────────── */

export type IssueOutcome =
  | { ok: true; code: string; offer: OfferId; fresh: boolean }
  | { ok: false; reason: 'not_eligible' | 'already_claimed' | 'human_already_has_one' | 'failed' }

/**
 * Mint the account's code for an offer, or hand back the one it already
 * has. Refused when this human — same device and network — was already
 * issued the offer on another account, or already redeemed it anywhere.
 */
export async function issueOfferCode(account: BusinessAccount, offerId: OfferId, human: Human, standing: AccountStanding = {}): Promise<IssueOutcome> {
  const offer = OFFERS.find((o) => o.id === offerId)
  if (!offer || !eligible(offer, standing)) return { ok: false, reason: 'not_eligible' }
  const fp = fingerprintOf(human)
  try {
    await ensureTables()
    return await runWithDefaultSchema(async () => {
      const mine = await query<{ code: string }>(
        `SELECT code FROM entrestate_offer_codes WHERE account_id = $1 AND offer_id = $2`, [account.id, offer.id])
      if (mine[0]) return { ok: true as const, code: mine[0].code, offer: offer.id, fresh: false }

      const redeemed = await query<{ n: string }>(
        `SELECT count(*)::text AS n FROM entrestate_offer_claims
          WHERE offer_id = $1 AND (account_id = $2 OR fingerprint = $3 OR address = $4)`,
        [offer.id, account.id, fp, human.address.trim()])
      if (Number(redeemed[0]?.n ?? 0) > 0) return { ok: false as const, reason: 'already_claimed' as const }

      const elsewhere = await query<{ n: string }>(
        `SELECT count(*)::text AS n FROM entrestate_offer_codes
          WHERE offer_id = $1 AND account_id <> $2 AND (fingerprint = $3 OR address = $4)`,
        [offer.id, account.id, fp, human.address.trim()])
      if (Number(elsewhere[0]?.n ?? 0) > 0) return { ok: false as const, reason: 'human_already_has_one' as const }

      // Mint until the code is unused — four characters of 32 is 1M codes; a
      // collision is a retry, never an error.
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = mintCode(offer)
        const rows = await query<{ code: string }>(
          `INSERT INTO entrestate_offer_codes (code, account_id, offer_id, fingerprint, address)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (code) DO NOTHING RETURNING code`,
          [code, account.id, offer.id, fp, human.address.trim()])
        if (rows[0]) return { ok: true as const, code: rows[0].code, offer: offer.id, fresh: true }
      }
      return { ok: false as const, reason: 'failed' as const }
    })
  } catch (err) {
    console.error('[account-credit] issue failed', err)
    return { ok: false, reason: 'failed' }
  }
}

/* ── redeeming ──────────────────────────────────────────────────────────── */

export type RedeemOutcome =
  | { ok: true; offer: OfferId; systemAed: string; adsAed: string; adsRequestId: string | null; already: boolean }
  | { ok: false; reason: 'unknown_code' | 'not_yours' | 'not_eligible' | 'already_claimed' | 'failed' }

/**
 * Redeem a code. The code must be this account's; the offer must not have
 * been redeemed by this account, this device+network, or this address; the
 * grant posts in the same transaction as the claim, so a claim without its
 * credit cannot exist. The ads part, if any, becomes a pending Ads Coin
 * request.
 */
export async function redeemCode(account: BusinessAccount, raw: string, human: Human, standing: AccountStanding = {}): Promise<RedeemOutcome> {
  const offer = offerOfCode(raw)
  if (!offer) return { ok: false, reason: 'unknown_code' }
  if (!eligible(offer, standing)) return { ok: false, reason: 'not_eligible' }
  const code = String(raw).trim().toUpperCase().replace(/\s+/g, '')
  const fp = fingerprintOf(human)
  const { systemAed, adsAed } = amountsFor(offer, standing)
  try {
    await ensureTables()
    const result = await runWithDefaultSchema(async () => {
      const owner = await query<{ account_id: string }>(`SELECT account_id FROM entrestate_offer_codes WHERE code = $1`, [code])
      if (!owner[0]) return { kind: 'unknown' as const }
      if (owner[0].account_id !== account.id) return { kind: 'not_yours' as const }

      const mine = await query<{ id: string }>(
        `SELECT id FROM entrestate_offer_claims WHERE account_id = $1 AND offer_id = $2`, [account.id, offer.id])
      if (mine[0]) return { kind: 'already_mine' as const }

      const human_ = await query<{ n: string }>(
        `SELECT count(*)::text AS n FROM entrestate_offer_claims
          WHERE offer_id = $1 AND (fingerprint = $2 OR address = $3)`,
        [offer.id, fp, human.address.trim()])
      if (Number(human_[0]?.n ?? 0) > 0) return { kind: 'already_human' as const }

      // The claim and its grant on ONE connection, in one transaction —
      // withTransaction rolls back on any error, so a claim without its
      // credit cannot exist.
      const id = `oc_${randomUUID()}`
      await withTransaction(async (tx) => {
        await tx(
          `INSERT INTO entrestate_offer_claims (id, account_id, offer_id, code, fingerprint, address)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, account.id, offer.id, code, fp, human.address.trim()])
        if (systemAed > 0) {
          await tx(
            `INSERT INTO entrestate_credit_postings (id, account_id, kind, amount, reference, memo, scope)
             VALUES ($1, $2, 'grant', $3, $4, $5, 'bills')
             ON CONFLICT (reference) DO NOTHING`,
            [`cp_${randomUUID()}`, account.id, aedToFils(systemAed), `claim:${id}`, `${offer.code} — ${offer.headline}`])
        }
      })
      return { kind: 'claimed' as const, id }
    })

    if (result.kind === 'unknown') return { ok: false, reason: 'unknown_code' }
    if (result.kind === 'not_yours') return { ok: false, reason: 'not_yours' }
    if (result.kind === 'already_human') return { ok: false, reason: 'already_claimed' }
    if (result.kind === 'already_mine') {
      return { ok: true, offer: offer.id, systemAed: systemAed.toFixed(2), adsAed: adsAed.toFixed(2), adsRequestId: null, already: true }
    }

    // The ads part: a REQUEST on the Ads Coin wallet, pending a person.
    let adsRequestId: string | null = null
    if (adsAed > 0) {
      const wallet = await ensureAccountWallet(account)
      if (wallet) {
        const req = await runWithDefaultSchema(() =>
          createRequest({
            id: `wr_${randomUUID()}`,
            walletId: wallet.id,
            amount: aedToFils(adsAed),
            reason: `Offer ${offer.code}: ad credit for ${account.email ?? account.id}`,
            requestedBy: `offer:${result.id}`,
          }))
        adsRequestId = req?.id ?? null
      }
    }
    return { ok: true, offer: offer.id, systemAed: systemAed.toFixed(2), adsAed: adsAed.toFixed(2), adsRequestId, already: false }
  } catch (err) {
    console.error('[account-credit] redeem failed', err)
    return { ok: false, reason: 'failed' }
  }
}

/* ── reading ────────────────────────────────────────────────────────────── */

/** The credit on the account now, per pocket, in fils — grants minus applications, never below zero. */
export async function creditPockets(account: BusinessAccount): Promise<Partial<Record<CreditScope, number>>> {
  try {
    await ensureTables()
    const rows = await runWithDefaultSchema(() =>
      query<{ scope: string; balance: string }>(
        `SELECT scope, COALESCE(SUM(CASE WHEN kind = 'grant' THEN amount ELSE -amount END), 0)::text AS balance
           FROM entrestate_credit_postings WHERE account_id = $1 GROUP BY scope`,
        [account.id]))
    const pockets: Partial<Record<CreditScope, number>> = {}
    for (const r of rows) {
      if (!isCreditScope(r.scope)) continue
      pockets[r.scope] = Math.max(0, Number(r.balance ?? 0))
    }
    return pockets
  } catch {
    return {}
  }
}

/** The credit on the account now, in fils — the pockets summed. */
export async function creditBalanceFils(account: BusinessAccount): Promise<number> {
  return sumPockets(await creditPockets(account))
}

const sumPockets = (pockets: Partial<Record<CreditScope, number>>): number =>
  (Object.values(pockets) as Array<number | undefined>).reduce<number>((sum, n) => sum + Math.max(0, Number(n ?? 0)), 0)

export interface CreditSummary {
  balanceAed: string
  /** The aimed pockets with something in them — "of it, AED 60 on Landing Pages". General credit is not listed; it is the rest. */
  pockets: Array<{ scope: CreditScope; label: string; amountAed: string }>
  /** The account's minted codes that are still unredeemed — the ones to show. */
  waiting: Array<{ offer: OfferId; code: string; headline: string }>
  claimed: OfferId[]
  recent: Array<{ kind: 'grant' | 'apply'; amountAed: string; memo: string; createdAt: string }>
}

/** What the account page shows: the balance, the codes waiting, which landed, the last movements. */
export async function readAccountCredit(account: BusinessAccount): Promise<CreditSummary> {
  const empty: CreditSummary = { balanceAed: '0.00', pockets: [], waiting: [], claimed: [], recent: [] }
  try {
    await ensureTables()
    const [pockets, codes, claims, recent] = await Promise.all([
      creditPockets(account),
      runWithDefaultSchema(() => query<{ code: string; offer_id: OfferId }>(`SELECT code, offer_id FROM entrestate_offer_codes WHERE account_id = $1`, [account.id])),
      runWithDefaultSchema(() => query<{ offer_id: OfferId }>(`SELECT offer_id FROM entrestate_offer_claims WHERE account_id = $1`, [account.id])),
      runWithDefaultSchema(() =>
        query<{ kind: 'grant' | 'apply'; amount: string; memo: string; created_at: string }>(
          `SELECT kind, amount::text, memo, created_at::text FROM entrestate_credit_postings
            WHERE account_id = $1 ORDER BY created_at DESC LIMIT 10`,
          [account.id])),
    ])
    const claimed = new Set(claims.map((c) => c.offer_id))
    const balance = sumPockets(pockets)
    return {
      balanceAed: filsToAed(balance),
      pockets: (Object.entries(pockets) as Array<[CreditScope, number]>)
        .filter(([scope, fils]) => scope !== 'bills' && fils > 0)
        .map(([scope, fils]) => ({ scope, label: scopeLabel(scope), amountAed: filsToAed(fils) })),
      waiting: codes
        .filter((c) => !claimed.has(c.offer_id))
        .map((c) => ({ offer: c.offer_id, code: c.code, headline: OFFERS.find((o) => o.id === c.offer_id)?.headline ?? '' })),
      claimed: [...claimed].filter((id): id is OfferId => OFFERS.some((o) => o.id === id)),
      recent: recent.map((r) => ({ kind: r.kind, amountAed: filsToAed(Number(r.amount)), memo: r.memo, createdAt: r.created_at })),
    }
  } catch {
    return empty
  }
}

/* ── applying ───────────────────────────────────────────────────────────── */

/**
 * Take the credit's share off an invoice and write it down. The share is
 * applyCredit's (the house cap); WHICH pocket pays is scopesForInvoice's —
 * the invoice's own pocket first, the general credit last. Idempotent by
 * invoice: billing may call this on every attempt, and an invoice that has
 * postings already is answered from them, never applied twice. Returns what
 * the invoice still owes.
 */
export async function applyCreditToInvoice(account: BusinessAccount, invoice: Invoice): Promise<{ appliedAed: string; dueAed: string; remainingAed: string }> {
  await ensureTables()
  const total = Math.max(0, Math.floor(invoice.totalFils))
  try {
    const done = await runWithDefaultSchema(() =>
      query<{ applied: string }>(
        `SELECT COALESCE(SUM(amount), 0)::text AS applied FROM entrestate_credit_postings
          WHERE account_id = $1 AND kind = 'apply' AND reference LIKE $2`,
        [account.id, `invoice:${invoice.id}:%`]))
    const already = Number(done[0]?.applied ?? 0)
    if (already > 0) {
      return { appliedAed: filsToAed(already), dueAed: filsToAed(Math.max(0, total - already)), remainingAed: filsToAed(await creditBalanceFils(account)) }
    }
  } catch (err) {
    console.error('[account-credit] apply lookup failed', err)
    return { appliedAed: '0.00', dueAed: filsToAed(total), remainingAed: '0.00' }
  }

  const pockets = await creditPockets(account)
  const scopes = scopesForInvoice(invoice)
  const usable = scopes.reduce((sum, scope) => sum + (pockets[scope] ?? 0), 0)
  const app = applyCredit(usable, invoice)
  if (app.appliedFils > 0) {
    const parts = splitAcrossScopes(app.appliedFils, pockets, scopes)
    try {
      await runWithDefaultSchema(() =>
        withTransaction(async (tx) => {
          for (const part of parts) {
            await tx(
              `INSERT INTO entrestate_credit_postings (id, account_id, kind, amount, reference, memo, scope)
               VALUES ($1, $2, 'apply', $3, $4, $5, $6)
               ON CONFLICT (reference) DO NOTHING`,
              [`cp_${randomUUID()}`, account.id, part.fils, `invoice:${invoice.id}:${part.scope}`, `Applied to ${invoice.kind} invoice ${invoice.id}`, part.scope])
          }
        }))
    } catch (err) {
      console.error('[account-credit] apply failed', err)
      // The invoice is still owed in full if the application did not write.
      return { appliedAed: '0.00', dueAed: filsToAed(total), remainingAed: filsToAed(usable) }
    }
  }
  const remaining = sumPockets(pockets) - app.appliedFils
  return { appliedAed: filsToAed(app.appliedFils), dueAed: filsToAed(app.dueFils), remainingAed: filsToAed(Math.max(0, remaining)) }
}
