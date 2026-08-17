/**
 * Who the server thinks you are — so the browser can agree with it.
 *
 * The Terminal's chrome resolves its session in the BROWSER, through Neon
 * Auth. The platform's identity cookie is httpOnly, which is what keeps it
 * safe and also what makes it invisible to that code — so a customer who
 * signed up on entrestate.com was recognised by every server render here and
 * still saw "Sign in" in the header. One account, two opinions, on the same
 * page.
 *
 * This is the one place the server states its answer out loud. It returns a
 * name and an email and nothing else: no token, no role, nothing that could
 * grant anything. Everything this product authorises is scoped to a workspace
 * behind a different cookie, so knowing a visitor's name is not a permission.
 *
 * Answers 200 with `{ user: null }` rather than 401 when nobody is signed in —
 * "no session" is the normal case on a free product, not a failure, and a 401
 * would put errors in every visitor's console.
 */
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user?.email) return NextResponse.json({ user: null })
    return NextResponse.json({
      user: { name: user.name ?? user.email, email: user.email },
    })
  } catch {
    // Same posture as the identity lookup itself: silence degrades to the
    // signed-out chrome the Terminal already shows, never to a broken header.
    return NextResponse.json({ user: null })
  }
}
