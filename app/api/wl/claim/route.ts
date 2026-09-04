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
import { runWithDefaultSchema, query } from '@/lib/db'
import { upsertUserProfile } from '@/lib/data'
import { createSession, buildSessionCookie } from '@/lib/auth'
import { getTerminalUser } from '@/lib/terminal-session'
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
  //
  // ── EXCEPT WHEN THE PERSON IS ALREADY KNOWN ─────────────────────────────
  // The block below was written for the password sign-up path, where the
  // workspace owner had no identity anywhere else and the apex needed one to
  // say hello. That path is gone. Every workspace is now born from a Neon
  // session, and a Neon session is ALREADY the apex identity — getTerminalUser()
  // reads it on entrestate.com and maps it to entrestate_accounts. Minting a
  // freehold_site_users row on top of that is a second record for the same
  // human, which is the exact thing the owner ruled out: "مينفعش يكون في
  // حسابين". So when the request carries a Neon session, this step is skipped.
  //
  // The Neon cookie lives on `.entrestate.com` and this route runs on a tenant
  // host beneath it, so the read works here. Pre-existing tenants whose owner
  // came through the old path and holds no Neon session keep the old
  // behaviour: they still get the platform identity, because for them it is
  // still the only one.
  const alreadyKnown = await getTerminalUser().catch(() => null)
  if (alreadyKnown) return res

  try {
    await runWithDefaultSchema(async () => {
      // NEVER overwrite an identity that already exists. upsertUserProfile's
      // ON CONFLICT (email) rewrites `role`, so creating a workspace would
      // have silently demoted an existing platform admin to 'broker' — the
      // account would keep working and quietly lose its standing, which is the
      // worst shape a permissions bug can take. Existing identity wins; this
      // path only ever ADDS a person the platform has not met.
      const [existing] = await query<{ id: string }>(
        `SELECT id FROM freehold_site_users WHERE lower(email) = lower($1) LIMIT 1`,
        [user.email],
      )
      const profile = existing ?? await upsertUserProfile({
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
