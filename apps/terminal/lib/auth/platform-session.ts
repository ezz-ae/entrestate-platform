import "server-only"
import { cookies } from "next/headers"

/**
 * WHO IS THIS, according to the rest of Entrestate.
 *
 * The Terminal authenticates with Neon Auth; the platform authenticates with
 * its own session store. That is two registrations for one person, and it
 * shows up exactly where it hurts: somebody signs up on entrestate.com,
 * arrives here for the market data their account already includes, and the
 * Terminal has never heard of them.
 *
 * The platform's identity cookie is scoped to `.entrestate.com`, so it is
 * already on this request. This forwards it to the platform and takes its
 * answer.
 *
 * WHY AN HTTP CALL AND NOT A DATABASE READ. The first version of this file
 * queried the platform's session table directly. It returned null in
 * production against a session that provably existed — this app is a separate
 * Vercel project with its own database wiring (it carries two Neon
 * integrations), so the table was simply not reachable from here. Chasing
 * which role or branch was the wrong fix: a product that reaches into another
 * product's tables is coupled to its schema, its migrations and its database
 * role, and breaks silently when any of the three moves. Identity is a
 * question, so it gets asked.
 *
 * WHAT IT COSTS. One request, only when Neon Auth has no session of its own,
 * with a hard 2s ceiling. A render must never wait on another service, so the
 * timeout is the point: past it, this returns null and the Terminal shows
 * exactly what it shows today.
 *
 * Fails to null on ANY error by construction — no cookie, a slow platform, a
 * non-200, malformed JSON. That silence is the safety property: this can
 * never sign a visitor out, and it can never break a render.
 */

/** The platform's identity cookie, set on `.entrestate.com` by lib/auth.ts. */
const PLATFORM_COOKIE = "freehold_site_session"

/** Where the platform answers. Overridable for previews and local work. */
const PLATFORM_ORIGIN =
  process.env.PLATFORM_ORIGIN?.replace(/\/+$/, "") || "https://entrestate.com"

/** A render may not hang on another service, however briefly. */
const TIMEOUT_MS = 2000

export interface PlatformIdentity {
  id: string
  name: string | null
  email: string
  /** Kept so callers that gate on role see the same shape Neon Auth gives
   *  them. The platform never returns a role here, so it is always null — a
   *  platform identity cannot inherit admin in the Terminal. */
  role: string | null
}

export async function getPlatformIdentity(): Promise<PlatformIdentity | null> {
  try {
    const store = await cookies()
    const token = store.get(PLATFORM_COOKIE)?.value
    if (!token) return null

    const res = await fetch(`${PLATFORM_ORIGIN}/api/auth/whoami`, {
      // Forward ONLY the platform cookie. Sending the whole cookie header
      // would hand another origin every cookie this browser holds for us.
      headers: { cookie: `${PLATFORM_COOKIE}=${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return null

    const data = (await res.json()) as { user?: { name?: string; email?: string } }
    const email = data?.user?.email
    if (!email) return null

    return {
      id: email,
      name: data.user?.name ?? null,
      email,
      role: null,
    }
  } catch {
    // See the header: silence here is the whole safety property.
    return null
  }
}
