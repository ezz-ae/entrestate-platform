/**
 * THE VENDOR'S TILL — see who is waiting to buy tokens, and confirm the money.
 *
 * This endpoint exists because the tenant-side confirm cannot be used for the
 * product it was built for. A realtor workspace is ONE person signing in as
 * 'ceo', so the management role list made the paying customer their own
 * approver; the ledger transaction now refuses a confirmation from the account
 * it credits (credit-topups.ts). Correct — and it leaves nobody inside a
 * realtor tenant who may confirm, which is the point: Entrestate confirms that
 * Entrestate was paid.
 *
 * Requests live in each tenant's own schema, and the vendor has no login
 * inside a customer's workspace, so this walks the tenants from the control
 * plane and reads each schema in turn — gated by WL_ADMIN_SECRET on the
 * x-wl-admin header, the same convention as /api/wl/tenants and /api/wl/keys.
 *
 * When a payment provider is wired, its webhook calls the same confirm with
 * the same self-deal refusal underneath it, and nothing here has to change.
 */
import { NextRequest, NextResponse } from 'next/server'
import { SAAS_TENANCY } from '@/lib/tenancy/config'
import { wlAdminSecret } from '@/lib/whitelabel/config'
import { listTenants } from '@/lib/tenancy/store'
import { schemaNameForSubdomain } from '@/lib/tenancy/config'
import { runWithSchema } from '@/lib/db'
import { listPendingTopups, confirmTopupRequest, rejectTopupRequest, type TopupRequest } from '@/lib/freehold/credit-topups'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Who is allowed to move money: the vendor's own secret, nothing else. */
function authorize(req: NextRequest): boolean {
  if (!SAAS_TENANCY) return false
  const secret = wlAdminSecret()
  if (!secret) return false
  const provided = req.headers.get('x-wl-admin')?.trim() || ''
  return provided.length > 0 && provided === secret
}

/** The queue, across every tenant. */
export async function GET(req: NextRequest) {
  if (!authorize(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenants = await listTenants().catch(() => [])
  const pending: Array<TopupRequest & { tenant: string; company: string }> = []
  for (const t of tenants) {
    // One tenant's unreadable schema must not hide every other tenant's queue.
    const rows = await runWithSchema(schemaNameForSubdomain(t.subdomain), () =>
      listPendingTopups(50),
    ).catch(() => [] as TopupRequest[])
    for (const r of rows) pending.push({ ...r, tenant: t.subdomain, company: t.company })
  }
  pending.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
  return NextResponse.json({ pending, count: pending.length })
}

/** Confirm (or decline) one request, inside the tenant that owns it. */
export async function POST(req: NextRequest) {
  if (!authorize(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as {
    tenant?: string; id?: string; action?: 'confirm' | 'reject'; note?: string; decidedBy?: string
  }
  const tenant = String(body.tenant ?? '').trim().toLowerCase()
  const id = String(body.id ?? '').trim()
  if (!tenant || !id || (body.action !== 'confirm' && body.action !== 'reject')) {
    return NextResponse.json(
      { error: 'tenant, id and action (confirm|reject) are required' },
      { status: 400 },
    )
  }
  // Recorded on the ledger row as who approved it. Defaults to a name that
  // says WHICH desk moved the money rather than leaving the audit blank.
  const decidedBy = String(body.decidedBy ?? '').trim() || 'entrestate-vendor'
  const schema = schemaNameForSubdomain(tenant)

  if (body.action === 'reject') {
    const result = await runWithSchema(schema, () => rejectTopupRequest(id, decidedBy, body.note))
      .catch(() => ({ ok: false as const, reason: 'error' as const }))
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason === 'not_found' ? 'No pending request with that id.' : 'Could not update that request.' },
        { status: result.reason === 'not_found' ? 404 : 500 },
      )
    }
    return NextResponse.json({ ok: true, status: 'rejected', tenant, id })
  }

  const result = await runWithSchema(schema, () => confirmTopupRequest(id, decidedBy))
    .catch(() => ({ ok: false as const, reason: 'error' as const }))
  if (!result.ok) {
    const status =
      result.reason === 'not_found' ? 404
      : result.reason === 'not_pending' ? 409
      : result.reason === 'self_deal' ? 403
      : 500
    return NextResponse.json(
      {
        error:
          result.reason === 'not_found' ? 'No request with that id in that tenant.'
          : result.reason === 'not_pending' ? 'That request was already decided.'
          : result.reason === 'self_deal' ? 'That approver is the account being credited.'
          : 'Could not confirm the top-up. Nothing was credited.',
      },
      { status },
    )
  }
  return NextResponse.json({
    ok: true, status: 'confirmed', tenant, id,
    credits: result.credits, already: result.already ?? false,
  })
}
