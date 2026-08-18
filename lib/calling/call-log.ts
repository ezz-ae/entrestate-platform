/**
 * A row for every call this system placed.
 *
 * A call costs money and reaches a person, so it leaves a record that does not
 * depend on the provider's dashboard staying available or the tenant keeping
 * that provider. The row names the lead, the template, the number it came
 * from and the human who triggered it — the four things anyone asks about
 * after a complaint.
 *
 * Per-tenant by construction: the table lives in whichever schema the request
 * resolved to.
 */

import { ensureOnce, query } from '@/lib/db'
import type { CallStatus } from './provider'

const ensureTable = async (): Promise<void> => {
  await ensureOnce('freehold_calling_calls', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS freehold_calling_calls (
        call_id      text PRIMARY KEY,
        provider     text NOT NULL,
        lead_id      text NOT NULL,
        template_id  text NOT NULL,
        from_e164    text NOT NULL,
        to_e164      text NOT NULL,
        status       text NOT NULL,
        placed_by    text NOT NULL,
        placed_at    timestamptz NOT NULL DEFAULT now()
      )
    `)
    await query(`CREATE INDEX IF NOT EXISTS freehold_calling_calls_lead ON freehold_calling_calls (lead_id, placed_at DESC)`)
  })
}

export interface PlacedCallRow {
  callId: string
  provider: string
  leadId: string
  templateId: string
  fromE164: string
  toE164: string
  status: CallStatus
  placedBy: string
}

/**
 * Write the row. Never throws: the call has already been placed by the time
 * this runs, and a logging failure must not turn a successful call into an
 * error the broker retries — that would dial the lead twice.
 */
export async function recordPlacedCall(row: PlacedCallRow): Promise<void> {
  try {
    await ensureTable()
    await query(
      `INSERT INTO freehold_calling_calls
         (call_id, provider, lead_id, template_id, from_e164, to_e164, status, placed_by, placed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
       ON CONFLICT (call_id) DO UPDATE SET status = $7`,
      [row.callId, row.provider, row.leadId, row.templateId, row.fromE164, row.toE164, row.status, row.placedBy],
    )
  } catch (err) {
    console.error('[calling] could not record placed call', row.callId, err)
  }
}

/** Exact count. A count of rows already written is a fact, not an estimate. */
export async function countPlacedCalls(): Promise<number> {
  try {
    await ensureTable()
    const rows = await query<{ n: string }>(`SELECT count(*)::text AS n FROM freehold_calling_calls`)
    return Number(rows[0]?.n ?? 0)
  } catch {
    return 0
  }
}
