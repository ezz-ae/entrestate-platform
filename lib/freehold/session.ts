'use client'

/**
 * Client session helpers. Authentication state now lives in a signed, httpOnly
 * cookie set by /api/server/login and enforced by middleware — the client can
 * never read or forge it. These helpers only talk to the auth API.
 */

export type { Role, SessionUser } from './session-types'
import type { SessionUser } from './session-types'

/**
 * The three things a sign-in attempt can be.
 *
 * `handoff` is the one that is not obvious. On the vendor host the endpoint
 * cannot mint the session a workspace needs — that cookie is host-only, on the
 * customer's own subdomain — so it returns a short-lived URL on that host
 * instead. The caller must NAVIGATE to it; treating it as a failure is how
 * this fix would ship invisibly.
 */
export type LoginResult =
  | { kind: 'user'; user: SessionUser }
  | { kind: 'handoff'; redirect: string }
  | { kind: 'rejected' }

/** Sign in. */
export async function login(
  email: string,
  password: string,
  remember: boolean,
): Promise<LoginResult> {
  try {
    const res = await fetch('/api/server/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember }),
    })
    if (!res.ok) return { kind: 'rejected' }
    const data = (await res.json()) as { user?: SessionUser; redirect?: string }
    if (data.redirect) return { kind: 'handoff', redirect: data.redirect }
    if (data.user) return { kind: 'user', user: data.user }
    // A 200 that names neither is a contract the server broke. Refusing is the
    // only safe reading: pretending it was a success signs nobody in and hides
    // the defect behind a redirect to a page that will bounce them back.
    return { kind: 'rejected' }
  } catch {
    return { kind: 'rejected' }
  }
}

/** Read the current session from the server (verified cookie). */
export async function fetchSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch('/api/server/me', { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { user: SessionUser | null }
    return data.user
  } catch {
    return null
  }
}

/** Sign out — clears the httpOnly cookie on the server. */
export async function clearSession(): Promise<void> {
  try {
    await fetch('/api/server/logout', { method: 'POST' })
  } catch {
    /* ignore network errors on logout */
  }
}
