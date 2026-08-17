/**
 * Claim endpoint — the tenant-host half of self-serve signup. PUBLIC by
 * prefix, self-defending: it only accepts a short-lived HMAC session token
 * (verifySession — same key and expiry rules as every platform session) and
 * only when the token's tenant claim matches THIS host's subdomain. It then
 * mints the real host-only session cookie and lands the owner on their home.
 *
 * Replay window equals the token TTL (2 minutes) on the one host it names —
 * the cookie it mints is no more powerful than the token itself.
 */
import { NextRequest, NextResponse } from 'next/server'
import { SAAS_TENANCY, tenantSubdomainFromHost } from '@/lib/tenancy/config'
import { signSession, verifySession, SESSION_COOKIE } from '@/lib/freehold/auth-edge'
import { runWithDefaultSchema } from '@/lib/db'
import { upsertUserProfile } from '@/lib/data'
import { createSession, buildSessionCookie } from '@/lib/auth'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  if (!SAAS_TENANCY) return new NextResponse(null, { status: 404 })

  const fallback = req.nextUrl.clone()
  fallback.pathname = '/server'
  fallback.search = ''

  const user = await verifySession(req.nextUrl.searchParams.get('token'))
  const hostTenant = tenantSubdomainFromHost(req.headers.get('host'))
  if (!user || !user.tenant || !hostTenant || user.tenant !== hostTenant) {
    // Invalid, expired, or aimed at another tenant — fall back to the
    // (tenant-branded) sign-in screen rather than erroring.
    return NextResponse.redirect(fallback)
  }

  const home = req.nextUrl.clone()
  home.pathname = user.home || '/freehold-intelligence'
  home.search = ''

  const res = NextResponse.redirect(home)
  res.cookies.set(SESSION_COOKIE, await signSession(user, SESSION_TTL_MS), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })

  // ── ONE REGISTRATION ────────────────────────────────────────────────────
  // The cookie above is the WORKSPACE session: host-only and fenced by
  // proxy.ts to the one subdomain it names, which is what keeps tenants
  // apart. It is therefore invisible on entrestate.com and on the Decision
  // Terminal — so a customer who had just signed up was a stranger on the
  // free surfaces their own account is supposed to include.
  //
  // So the same claim also mints the PLATFORM identity: a separate,
  // domain-scoped cookie (lib/auth.ts already scopes it to `.${BRAND.domain}`)
  // that carries no tenant claim and no workspace authority — proxy.ts reads
  // only fh_session, so this can never open a workspace door. It exists to
  // answer "who is this?" on the surfaces that are free to everyone.
  //
  // Written in the DEFAULT schema on purpose: this request is running on a
  // tenant host, so the ambient schema is that tenant's. The platform user
  // and its session belong to the control plane, shared by every surface.
  //
  // Best-effort by design. A failure here costs the free surfaces a name; it
  // must never cost the customer the workspace they just paid attention to.
  try {
    await runWithDefaultSchema(async () => {
      const profile = await upsertUserProfile({
        id: `user_${randomUUID()}`,
        name: user.name || user.email,
        email: user.email,
        // Lowest role on purpose. The platform identity is a person, not a
        // position: every authority this product grants is scoped to a
        // workspace, and mapPlatformUser already treats 'broker' as the
        // default for someone with no company standing.
        role: 'broker',
      })
      if (!profile?.id) return
      const { token } = await createSession(profile.id)
      res.cookies.set(buildSessionCookie(token))
    })
  } catch (err) {
    console.error('[wl/claim] platform identity not minted — workspace session is unaffected', err)
  }

  return res
}
