/**
 * THE EVERYDAY DOOR INTO A WORKSPACE — the Entrestate account, and nothing else.
 *
 * Runs on the tenant host (mahmoud.entrestate.com/api/wl/recognise) — and on
 * the vendor's own host, where it asks the vendor's list instead (see
 * recogniseAtVendor: the finance screen and /ctrl had no way in). The Neon
 * session cookie lives on `.entrestate.com`, so it is readable here, and that
 * is the whole trick: a person who is signed in to Entrestate anywhere is
 * already identified on every workspace host. This route asks one question —
 * does this workspace list that person, as owner or on its team? — and if so
 * mints the workspace session cookie (host-only, tenant-fenced by proxy.ts)
 * and sends them where they were going.
 *
 * Before this route, the only ways in were a password typed on /server (a
 * second account, the thing the owner ruled out) or a claim token minted on
 * the apex (three hops: Terminal → /me → "Open the workspace" → here). Now
 * proxy.ts sends every unauthenticated internal-page request on a tenant host
 * straight here first, so the common case — an owner or a team member who is
 * signed in to Entrestate — never sees a sign-in screen at all.
 *
 * PUBLIC by the /api/wl/ prefix, and self-defending:
 *   · no Neon session → /server?door=signed_out — the screen offers the one
 *     button there is, "Continue with Entrestate".
 *   · a Neon session this workspace does not list → /server?door=stranger, so
 *     the screen can say "you are signed in, but not here" instead of asking
 *     for a password nobody has.
 *   · too many attempts → /server?door=slow_down.
 *   The `door` marker is what stops /server from bouncing straight back here:
 *   the screen auto-tries this door only when it arrived with no verdict.
 *   · `next` is a relative path only; anything else lands on the home.
 *   · rate-limited per identity so a loop cannot hammer the tenant store.
 */
import { NextRequest, NextResponse } from 'next/server'
import { SAAS_TENANCY, tenantSubdomainFromHost } from '@/lib/tenancy/config'
import { signSession, SESSION_COOKIE } from '@/lib/freehold/auth-edge'
import { recogniseInWorkspace, recogniseAtVendor, safeRelativePath, WORKSPACE_SESSION_TTL_MS } from '@/lib/tenancy/account-workspace'
import { getTerminalUser } from '@/lib/terminal-session'
import { checkRateLimit } from '@/lib/freehold/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!SAAS_TENANCY) return new NextResponse(null, { status: 404 })

  const signIn = req.nextUrl.clone()
  signIn.pathname = '/server'
  signIn.search = ''

  // A tenant host asks its workspace; any other host under tenancy is the
  // vendor's own, and asks the vendor's list (recogniseAtVendor).
  const hostTenant = tenantSubdomainFromHost(req.headers.get('host'))

  const refuse = (door: 'signed_out' | 'stranger' | 'slow_down') => {
    signIn.searchParams.set('door', door)
    return NextResponse.redirect(signIn)
  }

  const user = await getTerminalUser().catch(() => null)
  if (!user) return refuse('signed_out')

  const limit = await checkRateLimit(`ws-recognise:${user.id}`, { limit: 60, windowSec: 300 })
  if (!limit.ok) return refuse('slow_down')

  const session = hostTenant
    ? await recogniseInWorkspace({ subdomain: hostTenant, user }).catch(() => null)
    : await recogniseAtVendor(user).catch(() => null)
  if (!session) return refuse('stranger')

  // Where they were going, on this host — or their role's home.
  const next = safeRelativePath(req.nextUrl.searchParams.get('next')) ?? session.home ?? '/freehold-intelligence'
  const dest = new URL(next, req.nextUrl.origin)

  const res = NextResponse.redirect(dest)
  res.cookies.set(SESSION_COOKIE, await signSession(session, WORKSPACE_SESSION_TTL_MS), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: WORKSPACE_SESSION_TTL_MS / 1000,
  })
  return res
}
