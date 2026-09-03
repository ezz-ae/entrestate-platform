/**
 * "Open my workspace" — the apex half of the one-account door.
 *
 * The account page on entrestate.com lists the workspaces the signed-in
 * account owns; this is the link under each one. It reads the shared Neon
 * session, proves the caller owns the workspace they named, mints the same
 * short-lived claim token self-serve signup uses, and redirects to
 * /api/wl/claim ON THE TENANT HOST, where the real session cookie is set.
 *
 * PUBLIC ON THE WALL, self-defending — the same posture as
 * /api/account/summary: a Terminal caller correctly lacks the workspace
 * cookie proxy.ts would otherwise demand, so this handler does its own
 * authentication (getTerminalUser) and fails closed.
 *
 * REDIRECT, NEVER A BODY. The claim URL carries a signed token that opens a
 * workspace. It goes into a Location header and nowhere else — not into JSON a
 * page could cache, not into an error message, not into a log line.
 *
 * Every refusal is the same 404 redirect back to the account page. Whether a
 * given subdomain exists, and who owns it, is not something this endpoint
 * tells a person typing guesses into the query string — see the header of
 * lib/tenancy/account-workspace.ts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { SAAS_TENANCY } from '@/lib/tenancy/config'
import { getTerminalUser } from '@/lib/terminal-session'
import { enterWorkspace } from '@/lib/tenancy/account-workspace'
import { checkRateLimit } from '@/lib/freehold/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!SAAS_TENANCY) return new NextResponse(null, { status: 404 })

  const back = new URL('/business/account', req.nextUrl.origin)

  const user = await getTerminalUser()
  if (!user) {
    // Not signed in on the Terminal. The account page is the place that
    // explains that in words and offers the sign-in.
    return NextResponse.redirect(back)
  }

  // A signed-in account guessing subdomains is still a scripted enumeration if
  // it runs in a loop. Cheap ceiling, keyed by the identity rather than the IP
  // because the identity is the thing we have already verified.
  const limit = await checkRateLimit(`ws-enter:${user.id}`, { limit: 30, windowSec: 300 })
  if (!limit.ok) {
    back.searchParams.set('workspace', 'slow_down')
    return NextResponse.redirect(back)
  }

  const subdomain = (req.nextUrl.searchParams.get('sub') ?? '').trim().toLowerCase()
  if (!subdomain) {
    back.searchParams.set('workspace', 'not_found')
    return NextResponse.redirect(back)
  }

  const result = await enterWorkspace({ subdomain, user }).catch(() => null)
  if (!result || !result.ok) {
    back.searchParams.set('workspace', 'not_found')
    return NextResponse.redirect(back)
  }

  return NextResponse.redirect(result.claimUrl)
}
