import { NextResponse } from 'next/server'
import { SAAS_TENANCY } from '@/lib/tenancy/config'

/**
 * THE DOOR THAT REMEMBERS WHICH PRODUCT WAS BEING BOUGHT.
 *
 * /business/meta-for-realtors sends its buyers to /signup?plan=realtor, and
 * the sign-up form honours that: it tells the realtor story and submits
 * plan: 'realtor', which provisioning stamps on the tenant row. That works
 * for somebody already signed in.
 *
 * A STRANGER took a different route and lost the plan on the way. There is
 * one place an Entrestate account is born and it is the Terminal, so
 * /signup redirects a stranger there — to a constant, `?next=/me`, carrying
 * nothing. They come back through the Terminal's /me, click "Create the
 * workspace", land on /business/account and create a workspace with no brand
 * at all, so lib/tenancy/account-workspace.ts applies plan 'account'. Then
 * lib/freehold/credit-identity.ts has no credit identity for that plan and
 * /api/freehold/credits/topup answers 403 "This account is not funded by
 * credits". The realtor cannot buy the tokens the page just sold them.
 *
 * So the plan is written down before the round trip and read on the way back.
 * A cookie rather than a redirect parameter because the Terminal's `next`
 * accepts relative paths only (its open-redirect guard) and cannot carry us
 * anything: this is the only piece of state that survives the hop.
 *
 * Host-only, httpOnly, SameSite=Lax and thirty minutes. Lax is what makes it
 * work — the browser sends it on the top-level GET navigation back from
 * terminal.entrestate.com — and thirty minutes is long enough for a sign-up
 * and short enough that an abandoned attempt does not colour a workspace
 * created next week. It holds one word, and the only word it may hold is
 * 'realtor'.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** The cookie the round trip carries the plan in. Read by /signup and /business/account. */
export const SIGNUP_PLAN_COOKIE = 'es_signup_plan'
const TERMINAL_SIGNUP = 'https://terminal.entrestate.com/signup?next=%2Fme'

export async function GET(request: Request) {
  if (!SAAS_TENANCY) return NextResponse.redirect(new URL('/', request.url))

  const plan = new URL(request.url).searchParams.get('plan')
  const response = NextResponse.redirect(TERMINAL_SIGNUP, { status: 307 })

  // Only 'realtor' is remembered. Anything else is the default door and needs
  // no memory — and an unvalidated value in a cookie is a value somebody else
  // gets to choose.
  if (plan === 'realtor') {
    response.cookies.set(SIGNUP_PLAN_COOKIE, 'realtor', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 30 * 60,
    })
  }

  return response
}
