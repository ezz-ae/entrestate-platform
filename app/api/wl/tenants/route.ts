/**
 * Vendor endpoint to list and create SaaS tenants out-of-band.
 *
 * Gated by WL_ADMIN_SECRET via the x-wl-admin header (same convention as
 * /api/wl/keys) and only alive on a deployment with tenancy enabled
 * (NEXT_PUBLIC_TENANT_BASE_DOMAIN set). Fails closed when either is missing.
 * Self-serve signup gets its own public, rate-limited route later — this one
 * exists so the operator can provision and inspect tenants before that ships.
 */
import { NextRequest, NextResponse } from 'next/server'
import { SAAS_TENANCY } from '@/lib/tenancy/config'
import { wlAdminSecret } from '@/lib/whitelabel/config'
import { createTenant, listTenants } from '@/lib/tenancy/store'
import { trialState, trialsToChase } from '@/lib/tenancy/trial'
import { provisionTenantSchema } from '@/lib/tenancy/provision'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorize(req: NextRequest): boolean {
  if (!SAAS_TENANCY) return false
  const secret = wlAdminSecret()
  if (!secret) return false
  const provided = req.headers.get('x-wl-admin')?.trim() || ''
  return provided.length > 0 && provided === secret
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tenants = await listTenants().catch(() => [])

  // WHERE EACH TRIAL STANDS, and which ones are owed a conversation today.
  // trial_ends_at has been written since this product had tenants and read by
  // nothing, so a workspace could run months past its trial with nobody on
  // either side ever being told. `chase` is that list, already ordered:
  // longest-lapsed first, then soonest to end. Its LENGTH is the size of the
  // job — a tenant with nothing worth saying is dropped, not sorted last.
  const now = new Date()
  return NextResponse.json({
    tenants: tenants.map((t) => ({ ...t, trial: trialState(t, now) })),
    chase: trialsToChase(tenants, now).map(({ tenant, state }) => ({
      subdomain: tenant.subdomain,
      company: tenant.company,
      // The owner is the person to write to. Null on workspaces created before
      // saas_tenants carried the column — scripts/backfill-tenant-owners.ts
      // recovers those; until it runs, null means "unknown", not "nobody".
      ownerEmail: tenant.ownerEmail,
      plan: tenant.plan,
      ...state,
    })),
  })
}

export async function POST(req: NextRequest) {
  if (!authorize(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as {
    subdomain?: string; company?: string; product?: string; accent?: string; logo?: string
  }
  const subdomain = String(body.subdomain ?? '')
  const company = String(body.company ?? '')
  if (!subdomain.trim()) return NextResponse.json({ error: 'subdomain is required' }, { status: 400 })
  if (!company.trim()) return NextResponse.json({ error: 'company is required' }, { status: 400 })

  const result = await createTenant({
    subdomain,
    company,
    product: body.product ? String(body.product) : undefined,
    accent: body.accent ? String(body.accent) : undefined,
    logo: body.logo ? String(body.logo) : undefined,
  }).catch(() => null)

  if (!result) return NextResponse.json({ error: 'Could not reach the tenant store.' }, { status: 502 })
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 })

  // Seed the tenant's private catalogue copy. Non-fatal: lazy DDL covers the
  // rest, and provisioning is idempotent, so a retry can finish the job.
  const provisioned = await provisionTenantSchema(result.tenant.schemaName)
    .then(() => true)
    .catch(() => false)

  return NextResponse.json({ tenant: result.tenant, provisioned })
}
