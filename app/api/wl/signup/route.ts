/**
 * Self-serve workspace creation — the branded door, on the ONE identity.
 *
 * PUBLIC ON THE WALL (the /api/wl/ prefix is allowlisted) and self-defending,
 * as before: alive only when tenancy is enabled, strict input validation, and
 * DB-backed rate limits per IP and global so a scripted loop cannot
 * mass-provision schemas.
 *
 * WHAT CHANGED, AND WHY IT IS NOT A SMALLER VERSION OF THE OLD ROUTE:
 *
 * This route used to accept `adminName`, `adminEmail` and `password` and hand
 * them to signupTenant(), which hashed the password into the new tenant's
 * schema as the owner's login. Anyone could POST here — that is what public
 * means — and mint a password-owned workspace for any email they typed. That
 * was a second identity for the same person and, for any email they did not
 * own, a workspace nobody could ever prove was theirs.
 *
 * Identity now comes from the VERIFIED Neon session on the request and from
 * nowhere else. There is no password field to send: the body carries the
 * brand (subdomain, company, product, accent, logo, plan) and nothing about who
 * the person is. A request without a verified session is refused before the
 * rate limit is even spent. The function it calls is the same one the account
 * page's small form calls — one path, one definition of "owner".
 *
 * On success the browser is redirected to /api/wl/claim ON THE NEW TENANT HOST
 * with a short-lived HMAC token — unchanged, because cookies are host-only and
 * that endpoint is where the workspace session can actually be set.
 */
import { NextRequest, NextResponse } from 'next/server'
import { SAAS_TENANCY, TENANT_BASE_DOMAIN } from '@/lib/tenancy/config'
import { TENANT_LOGO_MAX_BYTES } from '@/lib/tenancy/store'
import { createWorkspaceForAccount, type WorkspaceBrand } from '@/lib/tenancy/account-workspace'
import { getTerminalUser } from '@/lib/terminal-session'
import { checkRateLimit } from '@/lib/freehold/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Decoded byte length of a base64 data: URL payload. */
function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return 0
  return Math.floor(((dataUrl.length - comma - 1) * 3) / 4)
}

export async function POST(req: NextRequest) {
  if (!SAAS_TENANCY) return NextResponse.json({ error: 'not_available' }, { status: 404 })

  // Identity first, before any budget is spent on the caller. `signed_out` and
  // `email_unverified` are distinct on purpose: the form says different things
  // for "sign in on the Terminal" and "confirm the email you signed in with".
  const user = await getTerminalUser()
  if (!user) return NextResponse.json({ error: 'signed_out' }, { status: 401 })
  if (!user.emailVerified) return NextResponse.json({ error: 'email_unverified' }, { status: 403 })

  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
  const [perIp, perUser, global] = await Promise.all([
    checkRateLimit(`wl-signup:${ip}`, { limit: 5, windowSec: 3600 }),
    // The identity is verified, so it is the better key: a person cannot
    // shed it by changing networks.
    checkRateLimit(`ws-create:${user.id}`, { limit: 5, windowSec: 3600 }),
    checkRateLimit('wl-signup:global', { limit: 50, windowSec: 3600 }),
  ])
  if (!perIp.ok || !perUser.ok || !global.ok) {
    const retry = Math.max(perIp.retryAfterSec, perUser.retryAfterSec, global.retryAfterSec)
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(retry) } },
    )
  }

  const body = (await req.json().catch(() => ({}))) as {
    subdomain?: string; company?: string; product?: string; accent?: string; logo?: string; plan?: string
  }
  const subdomain = String(body.subdomain ?? '').trim().toLowerCase()
  const company = String(body.company ?? '').trim()
  const logo = String(body.logo ?? '')
  // Public endpoint: fold anything that is not exactly 'realtor' back to the
  // full 'company' plan rather than erroring — the plan only gates surfaces.
  const plan: WorkspaceBrand['plan'] = body.plan === 'realtor' ? 'realtor' : 'company'

  if (!subdomain) return NextResponse.json({ error: 'subdomain_required' }, { status: 400 })
  if (!company) return NextResponse.json({ error: 'company_required' }, { status: 400 })
  if (logo && (!logo.startsWith('data:image/') || dataUrlBytes(logo) > TENANT_LOGO_MAX_BYTES)) {
    return NextResponse.json({ error: 'logo_too_large' }, { status: 400 })
  }

  const result = await createWorkspaceForAccount({
    subdomain,
    company,
    user,
    brand: {
      product: body.product ? String(body.product) : undefined,
      accent: body.accent ? String(body.accent) : undefined,
      logo,
      plan,
    },
  }).catch(() => null)

  if (!result) return NextResponse.json({ error: 'store_unreachable' }, { status: 502 })
  if (!result.ok) {
    const status = result.reason === 'email_unverified' ? 403 : result.reason === 'store_unreachable' ? 502 : 400
    return NextResponse.json({ error: result.reason }, { status })
  }

  // Land them on THEIR host. The claim URL is a credential (a signed token in
  // the query string) and this body is the one place it may appear, because
  // the browser consumes it immediately as a navigation. Preserve the port for
  // local dev; TENANT_BASE_DOMAIN itself never carries one.
  const reqHost = req.headers.get('host') || ''
  const port = reqHost.includes(':') ? `:${reqHost.split(':')[1]}` : ''
  const proto = req.nextUrl.protocol
  const claim = new URL(result.claimUrl)
  const redirect = `${proto}//${result.workspace.subdomain}.${TENANT_BASE_DOMAIN}${port}${claim.pathname}${claim.search}`

  return NextResponse.json({ ok: true, redirect })
}
