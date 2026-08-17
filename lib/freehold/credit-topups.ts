/**
 * BUYING TOKENS — the request half of the realtor money path.
 *
 * Meta for Realtors is sold as "tokens as you run ads, no monthly fee", and a
 * realtor's account opens at exactly 0 (lib/tenancy/onboard.ts). Until this
 * module existed there was no way to put tokens INTO it: the only credit
 * sources were a closed deal (a company/CRM path a realtor never walks) and a
 * management-only manual allocation. A product that bills in tokens sold no
 * tokens.
 *
 * The shape is a REQUEST, not a charge. onboard.ts already states the intended
 * rule — an account is "topped up only when a human confirms a payment" — so a
 * realtor asks for a pack, a person confirms the money arrived, and only then
 * does the ledger move. No card is taken here and no payment provider is
 * called; when one is wired later it confirms the same request row, and every
 * screen below it keeps working unchanged.
 *
 * Two rules this file exists to keep:
 *
 *  1. A confirmed top-up writes ledger type 'allocation', never a new type.
 *     BALANCE_SUM in credits-db.ts scores unknown types as ELSE 0, so a
 *     'topup' type would take the customer's money and add nothing to their
 *     balance. The ledger's `reference` (`topup:<id>`) is what marks it.
 *  2. Confirmation is idempotent at the DATABASE. Money moves once per
 *     request row: the row is locked and re-checked inside the transaction,
 *     and the ledger insert is guarded by the (broker, type, reference)
 *     unique index — so a double-clicked Confirm cannot pay twice.
 */
import { query, withTransaction, ensureOnce } from '@/lib/db'
import { ensureCreditsSchema } from '@/lib/freehold/credits-db'
import { isValidCreditAmount, packForCredits } from '@/lib/freehold/credits-shared'

export type TopupStatus = 'pending' | 'confirmed' | 'rejected'

export interface TopupRequest {
  id: string
  broker_id: string
  credits: number
  /** AED asked for, frozen at request time — a later price change must never
   *  rewrite what a customer was quoted. */
  aed: number
  status: TopupStatus
  requested_by: string | null
  note: string | null
  decided_by: string | null
  decided_at: string | null
  created_at: string
}

async function ensureTopupSchema(): Promise<void> {
  await ensureOnce('credit_topup_requests', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS credit_topup_requests (
        id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        broker_id    TEXT NOT NULL,
        credits      INTEGER NOT NULL,
        aed          INTEGER NOT NULL,
        status       TEXT NOT NULL DEFAULT 'pending',
        requested_by TEXT,
        note         TEXT,
        decided_by   TEXT,
        decided_at   TIMESTAMPTZ,
        created_at   TIMESTAMPTZ DEFAULT now()
      )
    `)
    await query(`CREATE INDEX IF NOT EXISTS idx_topup_broker ON credit_topup_requests(broker_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_topup_status ON credit_topup_requests(status)`)
  })
}

const SELECT = `id, broker_id, credits, aed, status, requested_by, note,
                decided_by, decided_at::text, created_at::text`

/**
 * Ask for a pack. Only the published packs are accepted: a free-typed amount
 * would let the browser name its own price, and the quote a customer sees has
 * to be the quote the vendor confirms.
 */
export async function createTopupRequest(
  brokerId: string,
  credits: number,
  requestedBy: string,
): Promise<{ ok: true; request: TopupRequest } | { ok: false; reason: 'invalid' | 'error' }> {
  if (!brokerId || !isValidCreditAmount(credits)) return { ok: false, reason: 'invalid' }
  const pack = packForCredits(credits)
  if (!pack) return { ok: false, reason: 'invalid' }
  try {
    await ensureTopupSchema()
    const rows = await query<TopupRequest>(
      `INSERT INTO credit_topup_requests (broker_id, credits, aed, requested_by)
       VALUES ($1, $2, $3, $4) RETURNING ${SELECT}`,
      [brokerId, pack.credits, pack.aed, requestedBy || null],
    )
    return rows[0] ? { ok: true, request: rows[0] } : { ok: false, reason: 'error' }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/** One account's requests, newest first. Fails soft: a listing is not money. */
export async function listTopupRequests(brokerId: string, limit = 20): Promise<TopupRequest[]> {
  if (!brokerId) return []
  try {
    await ensureTopupSchema()
    return await query<TopupRequest>(
      `SELECT ${SELECT} FROM credit_topup_requests
       WHERE broker_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [brokerId, limit],
    )
  } catch {
    return []
  }
}

/** Everything still waiting on a human, oldest first — the vendor's queue. */
export async function listPendingTopups(limit = 100): Promise<TopupRequest[]> {
  try {
    await ensureTopupSchema()
    return await query<TopupRequest>(
      `SELECT ${SELECT} FROM credit_topup_requests
       WHERE status = 'pending' ORDER BY created_at ASC LIMIT $1`,
      [limit],
    )
  } catch {
    return []
  }
}

/**
 * Confirm that the money arrived: move the tokens, once.
 *
 * `already` is a SUCCESS, not a failure — a retried confirmation must read as
 * "this is paid", never as an error that invites a third click.
 */
export async function confirmTopupRequest(
  id: string,
  decidedBy: string,
): Promise<
  | { ok: true; credits: number; already?: true }
  | { ok: false; reason: 'not_found' | 'not_pending' | 'self_deal' | 'error' }
> {
  if (!id) return { ok: false, reason: 'not_found' }
  try {
    await ensureTopupSchema()
    await ensureCreditsSchema()
    return await withTransaction(async (q) => {
      // Lock the REQUEST row first: it is the thing being spent exactly once.
      const [req] = await q<TopupRequest>(
        `SELECT ${SELECT} FROM credit_topup_requests WHERE id = $1 FOR UPDATE`,
        [id],
      )
      if (!req) return { ok: false as const, reason: 'not_found' as const }
      if (req.status === 'confirmed') {
        return { ok: true as const, credits: req.credits, already: true as const }
      }
      if (req.status !== 'pending') return { ok: false as const, reason: 'not_pending' as const }

      // NOBODY CONFIRMS THEIR OWN MONEY.
      //
      // The route's role gate is not enough on a realtor tenant: that workspace
      // is one person and they sign in as 'ceo', which is on the management
      // list — so the paying customer WAS the approver. Walked live, a realtor
      // requested a pack and confirmed it in the next call, minting 75 tokens
      // for free; unbounded, it is the whole product for nothing.
      //
      // The refusal lives HERE, in the transaction that moves the money, so no
      // route, script or future webhook can reach the ledger around it.
      if (decidedBy && decidedBy.trim().toLowerCase() === req.broker_id.trim().toLowerCase()) {
        return { ok: false as const, reason: 'self_deal' as const }
      }

      const reference = `topup:${req.id}`
      // Quota column and ledger row are the same fact, in one transaction —
      // the reason allocateCredits() wraps them together.
      await q(
        `INSERT INTO broker_credit_accounts (broker_id, tier, allocated)
         VALUES ($1, 'Starter', $2)
         ON CONFLICT (broker_id) DO UPDATE SET
           allocated = broker_credit_accounts.allocated + $2,
           updated_at = now()`,
        [req.broker_id, req.credits],
      )
      // Type 'allocation' on purpose — see the header. The reference is what
      // says this allocation was bought rather than granted.
      await q(
        `INSERT INTO credit_ledger (broker_id, type, amount, note, reference, meta, created_by)
         SELECT $1, 'allocation', $2, $3, $4, $5::jsonb, $6
         WHERE NOT EXISTS (
           SELECT 1 FROM credit_ledger
           WHERE broker_id = $1 AND type = 'allocation' AND reference = $4
         )`,
        [
          req.broker_id,
          req.credits,
          `Token top-up confirmed — AED ${req.aed}`,
          reference,
          JSON.stringify({ topup_id: req.id, aed: req.aed }),
          decidedBy || null,
        ],
      )
      await q(
        `UPDATE credit_topup_requests
         SET status = 'confirmed', decided_by = $2, decided_at = now()
         WHERE id = $1`,
        [id, decidedBy || null],
      )
      return { ok: true as const, credits: req.credits }
    })
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/** Turn a request down. Never touches the ledger. */
export async function rejectTopupRequest(
  id: string,
  decidedBy: string,
  note?: string,
): Promise<{ ok: boolean; reason?: 'not_found' | 'error' }> {
  if (!id) return { ok: false, reason: 'not_found' }
  try {
    await ensureTopupSchema()
    const rows = await query<{ id: string }>(
      `UPDATE credit_topup_requests
       SET status = 'rejected', decided_by = $2, decided_at = now(), note = COALESCE($3, note)
       WHERE id = $1 AND status = 'pending' RETURNING id`,
      [id, decidedBy || null, note ?? null],
    )
    return rows[0] ? { ok: true } : { ok: false, reason: 'not_found' }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
