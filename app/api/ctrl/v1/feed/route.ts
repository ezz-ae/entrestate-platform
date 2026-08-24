import { NextRequest, NextResponse } from 'next/server'
import { ctrlQuery, ensureCtrlSchema } from '@/lib/ctrl/db'
import { tenantByToken } from '@/lib/ctrl/tenants'
import { balanceFils } from '@/lib/ctrl/wallet'
import { listCampaigns, getForm } from '@/lib/ctrl/meta'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * THE PARTNER'S FEED — the exact shape the client side (ORE's lib/partner
 * plane) documents, and the one place the two systems shake hands.
 *
 * WHAT NEVER LEAVES THIS HANDLER: our spend, our cost per lead, the margin.
 * A campaign's `spentFils` here is the SUM OF PRICES of leads actually
 * delivered to this partner — what THEY pay, computed from their own delivered
 * rows — not what Meta charged us. There is no code path from the cost columns
 * to this response.
 */
export async function GET(req: NextRequest) {
  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const tenant = await tenantByToken(bearer)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureCtrlSchema()

  // What this partner has actually been delivered, priced, grouped by form.
  const sums = await ctrlQuery(
    `SELECT form_id,
            COUNT(*) FILTER (WHERE state = 'delivered')::text AS delivered,
            COALESCE(SUM(price_fils) FILTER (WHERE state = 'delivered'), 0)::text AS paid
       FROM ctrl_leads WHERE tenant_id = $1 GROUP BY form_id`,
    [tenant.id],
  )
  const byForm = new Map<string, { delivered: number; paidFils: number }>(
    sums.rows.map((r) => [r.form_id, { delivered: Number(r.delivered) || 0, paidFils: Number(r.paid) || 0 }]),
  )

  const maps = await ctrlQuery(
    `SELECT kind, ref_id, name, campaign_ref, access FROM ctrl_mappings WHERE tenant_id = $1`,
    [tenant.id],
  )
  const campaignRefs = maps.rows.filter((m) => m.kind === 'campaign')
  const formRefs = maps.rows.filter((m) => m.kind === 'form')
  const assetRefs = maps.rows.filter((m) => m.kind === 'facebook_page' || m.kind === 'instagram')

  // Meta gives status/frequency/freshness; the MONEY comes from our rows.
  const metaCampaigns = new Map((await listCampaigns()).map((c) => [c.id, c]))
  const campaigns = campaignRefs.map((m) => {
    const meta = metaCampaigns.get(m.ref_id)
    const formsOfCampaign = formRefs.filter((f) => f.campaign_ref === m.ref_id)
    let spentFils = 0
    let leads = 0
    for (const f of formsOfCampaign) {
      const s = byForm.get(f.ref_id)
      if (s) { spentFils += s.paidFils; leads += s.delivered }
    }
    return {
      id: m.ref_id,
      name: m.name || meta?.name || m.ref_id,
      status: meta?.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
      spentFils,
      leads,
      frequency: meta?.frequency ?? null,
      dataThrough: meta?.dateStop ?? null,
    }
  })

  // Forms: name/status/questions live on Meta; the count a partner sees is what
  // was DELIVERED to them — a held lead does not exist yet, on purpose.
  const forms = []
  for (const m of formRefs) {
    const meta = await getForm(m.ref_id)
    forms.push({
      id: m.ref_id,
      name: m.name || meta?.name || m.ref_id,
      status: meta?.status ?? 'ACTIVE',
      leadsCount: byForm.get(m.ref_id)?.delivered ?? 0,
      createdTime: meta?.createdTime ?? null,
      questions: meta?.questions ?? [],
    })
  }

  return NextResponse.json({
    partner: { name: (process.env.PARTNER_DISPLAY_NAME ?? 'Entrestate').trim() },
    balanceFils: await balanceFils(tenant.id),
    // Self-serve top-up (Ziina) is deferred; balances are credited from the
    // /ctrl console for now, so there is no public top-up URL yet.
    topupUrl: null,
    campaigns,
    forms,
    assets: assetRefs.map((a) => ({
      kind: a.kind,
      id: a.ref_id,
      name: a.name || a.ref_id,
      access: a.access === 'read_write' || a.access === 'read' ? a.access : 'none',
    })),
  })
}
