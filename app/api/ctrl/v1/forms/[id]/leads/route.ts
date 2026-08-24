import { NextRequest, NextResponse } from 'next/server'
import { ctrlQuery, ensureCtrlSchema } from '@/lib/ctrl/db'
import { tenantByToken } from '@/lib/ctrl/tenants'
import { billLead } from '@/lib/ctrl/wallet'
import { ingestTenantLeads } from '@/lib/ctrl/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One form's leads — WHERE THE MONEY ACTUALLY MOVES.
 *
 * Each poll does three things in order:
 *
 *   1. INGEST: pull anything new from Meta for this form, price it at arrival,
 *      hold it.
 *   2. BILL: walk the held leads OLDEST FIRST and debit the wallet for each
 *      until it cannot cover the next one. Oldest first because a queue that
 *      let the newest lead jump would quietly starve the oldest forever.
 *   3. SERVE: return only DELIVERED leads. A held lead does not exist to the
 *      partner — that is the whole prepaid contract: money first, lead after,
 *      and the balance the partner watches falls exactly when a lead lands.
 *
 * Idempotent end to end: billing is transactional per lead with a unique debit
 * ref, and the partner deduplicates on lead id anyway.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const tenant = await tenantByToken(bearer)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: formId } = await ctx.params
  await ensureCtrlSchema()

  // The form must be THIS partner's — a valid token for partner A must never
  // pull partner B's people.
  const owned = await ctrlQuery(
    `SELECT 1 FROM ctrl_mappings WHERE tenant_id = $1 AND kind = 'form' AND ref_id = $2`,
    [tenant.id, formId],
  )
  if (!owned.rows.length) return NextResponse.json({ error: 'Unknown form' }, { status: 404 })

  await ingestTenantLeads(tenant.id, formId).catch((e) => console.error('[ctrl/leads] ingest failed', e))

  // MARKETPLACE MODE BUYS NOTHING HERE. When the partner buys lead by lead, the
  // ONLY door money moves through is the storefront's buy button — this poll
  // just serves what they already own. Auto mode keeps the original contract:
  // bill oldest-first until the balance runs out.
  if (tenant.deliveryMode === 'auto') {
    const held = await ctrlQuery(
      `SELECT id FROM ctrl_leads
        WHERE tenant_id = $1 AND form_id = $2 AND state = 'held'
        ORDER BY created_time ASC`,
      [tenant.id, formId],
    )
    for (const row of held.rows) {
      // First failure = balance exhausted; stop rather than skip, so delivery
      // order stays arrival order.
      if (!(await billLead(tenant.id, row.id))) break
    }
  }

  const sinceRaw = Number(req.nextUrl.searchParams.get('since'))
  const since = Number.isFinite(sinceRaw) && sinceRaw > 0 ? Math.floor(sinceRaw) : 0

  const delivered = await ctrlQuery(
    `SELECT id, form_id, created_time::text AS created, price_fils::text AS price, field_data
       FROM ctrl_leads
      WHERE tenant_id = $1 AND form_id = $2 AND state = 'delivered'
        AND ($3 = 0 OR created_time >= to_timestamp($3))
      ORDER BY created_time ASC
      LIMIT 500`,
    [tenant.id, formId, since],
  )

  return NextResponse.json({
    leads: delivered.rows.map((l) => ({
      id: l.id,
      formId: l.form_id,
      createdTime: l.created,
      priceFils: Number(l.price) || 0,
      fieldData: Array.isArray(l.field_data) ? l.field_data : [],
    })),
  })
}
