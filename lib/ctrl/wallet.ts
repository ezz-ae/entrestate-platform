/**
 * The wallet — an append-only ledger, idempotent on `ref`.
 *
 * A balance is a SUM, never a stored number, so it cannot drift; and every
 * movement names the real-world thing that caused it (a Ziina intent, a Meta
 * lead), so a retry inserts nothing the second time. The debit is
 * transactional with the delivery mark: a lead is never marked delivered
 * without its money moving, and money never moves without the mark.
 */
import { ctrlQuery, ctrlTx, ensureCtrlSchema } from './db'

export async function balanceFils(tenantId: string): Promise<number> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT COALESCE(SUM(CASE WHEN kind = 'credit' THEN amount_fils ELSE -amount_fils END), 0)::text AS bal
       FROM ctrl_wallet_entries WHERE tenant_id = $1`,
    [tenantId],
  )
  return Number(r.rows[0]?.bal) || 0
}

/** Idempotent credit — `ref` is the Ziina intent id. Returns false when the
 *  ref was already credited (a refresh of the success page, a replay). */
export async function credit(tenantId: string, amountFils: number, ref: string, note: string): Promise<boolean> {
  if (!Number.isFinite(amountFils) || amountFils <= 0) return false
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `INSERT INTO ctrl_wallet_entries (tenant_id, kind, amount_fils, ref, note)
     VALUES ($1, 'credit', $2, $3, $4)
     ON CONFLICT (ref) DO NOTHING
     RETURNING id`,
    [tenantId, Math.round(amountFils), ref, note],
  )
  return r.rows.length > 0
}

/**
 * Bill one held lead and mark it delivered — one transaction, three checks:
 * the lead is still held (a concurrent request lost the race), the balance
 * covers the price (computed INSIDE the transaction), and the debit ref is
 * fresh. Any failure rolls the whole thing back and the lead stays held.
 */
export async function billLead(tenantId: string, leadId: string): Promise<boolean> {
  await ensureCtrlSchema()
  try {
    // One BEGIN/COMMIT on a single connection (ctrlTx → withTransaction), so the
    // SELECT ... FOR UPDATE row lock holds for the whole check-and-debit.
    return await ctrlTx(async (q) => {
      const lead = await q<{ price: string }>(
        `SELECT price_fils::text AS price FROM ctrl_leads
          WHERE id = $1 AND tenant_id = $2 AND state = 'held'
          FOR UPDATE`,
        [leadId, tenantId],
      )
      if (!lead.length) return false
      const price = Number(lead[0].price)

      const bal = await q<{ bal: string }>(
        `SELECT COALESCE(SUM(CASE WHEN kind = 'credit' THEN amount_fils ELSE -amount_fils END), 0)::text AS bal
           FROM ctrl_wallet_entries WHERE tenant_id = $1`,
        [tenantId],
      )
      if ((Number(bal[0]?.bal) || 0) < price) return false

      const debit = await q<{ id: string }>(
        `INSERT INTO ctrl_wallet_entries (tenant_id, kind, amount_fils, ref, note)
         VALUES ($1, 'debit', $2, $3, 'lead delivered')
         ON CONFLICT (ref) DO NOTHING
         RETURNING id`,
        [tenantId, price, `lead:${leadId}`],
      )
      if (!debit.length) return false

      await q(
        `UPDATE ctrl_leads SET state = 'delivered', delivered_at = now() WHERE id = $1`,
        [leadId],
      )
      return true
    })
  } catch (e) {
    // withTransaction already rolled back; the lead stays held.
    console.error('[ctrl/wallet] billLead failed', e)
    return false
  }
}

export interface LedgerEntry {
  kind: 'credit' | 'debit'
  amountFils: number
  ref: string
  note: string
  at: string
}

export async function ledger(tenantId: string, limit = 100): Promise<LedgerEntry[]> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT kind, amount_fils::text AS amount, ref, note, created_at::text AS at
       FROM ctrl_wallet_entries WHERE tenant_id = $1 ORDER BY id DESC LIMIT $2`,
    [tenantId, limit],
  )
  return r.rows.map((e) => ({
    kind: e.kind, amountFils: Number(e.amount) || 0, ref: e.ref, note: e.note, at: e.at,
  }))
}
