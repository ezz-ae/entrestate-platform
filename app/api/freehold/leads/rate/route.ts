/**
 * ENGINE 06 — the Rate, on the wire.
 *
 *   GET  ?leadId=…      the rate, its reason, Engine 07's marks on the row,
 *                       and the ledger of every change and every ICI
 *                       evaluation — the evidence drawer for one lead.
 *   POST { leadId }     re-evaluate now (any signed-in user on a lead they
 *                       may see). Idempotent: same facts, same rate.
 *   POST { leadId, masterLead: true|false }
 *                       the human 10. Management only — the one rung no rule
 *                       may reach, so the route is where the role is checked.
 *
 * Brokers are scoped to their own leads on every verb, the same ownership
 * keys the CRM routes use.
 */
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/freehold/api-auth'
import { MANAGEMENT_ROLES } from '@/lib/freehold/session-types'
import { brokerOwnerKeys } from '@/lib/freehold/lead-access'
import { query } from '@/lib/db'
import { readLeadRate, recomputeLeadRate, setMasterLead } from '@/lib/freehold/lead-rate-db'
import { RATE_OPEN_CAP, RATE_WON, RATE_MASTER } from '@/lib/freehold/lead-rate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function mayTouch(user: { role: string; email: string; brokerId?: string }, leadId: string): Promise<boolean> {
  if (user.role !== 'broker') return true
  const keys = brokerOwnerKeys(user)
  const rows = await query<{ id: string }>(
    `SELECT id FROM freehold_site_leads WHERE id = $1 AND assigned_broker_id = ANY($2) LIMIT 1`,
    [leadId, keys],
  ).catch(() => [])
  return rows.length > 0
}

export async function GET(req: Request) {
  const auth = await requireSession()
  if ('res' in auth) return auth.res
  const leadId = new URL(req.url).searchParams.get('leadId')?.trim() ?? ''
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 })
  if (!(await mayTouch(auth.user, leadId))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const rate = await readLeadRate(leadId)
    if (!rate) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      ...rate,
      scale: { openCap: RATE_OPEN_CAP, won: RATE_WON, master: RATE_MASTER },
    })
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  }
}

export async function POST(req: Request) {
  const auth = await requireSession()
  if ('res' in auth) return auth.res
  const body = (await req.json().catch(() => ({}))) as { leadId?: string; masterLead?: boolean }
  const leadId = String(body.leadId ?? '').trim()
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 })
  if (!(await mayTouch(auth.user, leadId))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (typeof body.masterLead === 'boolean') {
    if (!MANAGEMENT_ROLES.includes(auth.user.role)) {
      return NextResponse.json({ error: 'Only management may mark a master lead' }, { status: 403 })
    }
    const out = await setMasterLead(leadId, body.masterLead, auth.user.email)
    if (!out) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true, rate: out.result.rate, reason: out.result.reason, changed: out.changed })
  }

  const out = await recomputeLeadRate(leadId, 'manual', { actor: auth.user.email })
  if (!out) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true, rate: out.result.rate, reason: out.result.reason, previous: out.previous, changed: out.changed })
}
