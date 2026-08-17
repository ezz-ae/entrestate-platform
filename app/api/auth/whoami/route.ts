/**
 * The platform's answer to "who is this?", for the platform's own surfaces
 * and for the Decision Terminal.
 *
 * The Terminal runs as a separate Vercel project with its own database
 * connection, so it cannot reliably read the platform's session table — and it
 * should not want to. A product that reaches into another product's tables is
 * coupled to that product's schema, its migrations and its database role, and
 * breaks quietly when any of the three moves. Identity is a question, so it
 * gets an endpoint rather than a JOIN.
 *
 * Returns a name and an email and nothing else. No token, no role, no tenant —
 * every authority this platform grants is scoped to a workspace behind a
 * different cookie that proxy.ts fences to a single host, so knowing who
 * somebody is grants nothing on its own.
 *
 * 200 with `{ user: null }` when nobody is signed in. "Not signed in" is the
 * ordinary state of a free product, not an error, and a 401 here would put a
 * red line in the console of every anonymous visitor.
 */
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user?.email) return NextResponse.json({ user: null })
    return NextResponse.json({
      user: { name: user.name ?? user.email, email: user.email },
    })
  } catch {
    // An unreadable session is an anonymous visitor, never a broken page.
    return NextResponse.json({ user: null })
  }
}
