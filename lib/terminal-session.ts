import "server-only"
import { createNeonAuth } from "@neondatabase/auth/next/server"

/**
 * PHASE 1 OF THE ACCOUNT FOUNDATION — the business recognises the Terminal
 * account (docs/ACCOUNT-FOUNDATION.md).
 *
 * One person, one account, two doors: the Terminal signs people in through
 * Neon Auth and its session cookie lands on Domain=.entrestate.com, so every
 * request to entrestate.com already CARRIES the session. This module reads it
 * with the SAME library, the SAME base URL and the SAME cookie secret the
 * Terminal uses — @neondatabase/auth pinned to the Terminal's exact version
 * (0.2.0-beta.1), NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET aligned
 * across both Vercel projects by the owner. Verification is the library's,
 * not a re-implementation.
 *
 * WHAT THIS MODULE MUST NEVER DO:
 *   - Touch `freehold_site_session`. That cookie is the CLIENT's live
 *     sessions on his own product. Different auth system, different world;
 *     this module reads Neon Auth cookies only.
 *   - Throw into a page. No session, wrong secret, unreachable auth backend,
 *     misconfigured env — every failure is the same answer: null. A selling
 *     surface renders for the anonymous reader; recognition is a bonus,
 *     never a gate.
 */

const baseUrl = process.env.NEON_AUTH_BASE_URL
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET

/**
 * The shared cookie lives on `.entrestate.com`. The domain option matters
 * only if the library ever WRITES a cookie (a refresh): without it, a
 * host-only entrestate.com cookie would appear beside the shared one and
 * shadow it. On previews and localhost the apex cookie does not exist and
 * no domain is set.
 */
function sharedCookieDomain(): string | undefined {
  const host = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN ?? ""
  return host === "entrestate.com" ? ".entrestate.com" : undefined
}

const auth =
  baseUrl && cookieSecret && cookieSecret.length >= 32
    ? createNeonAuth({
        baseUrl,
        cookies: {
          secret: cookieSecret,
          ...(sharedCookieDomain() ? { domain: sharedCookieDomain() } : {}),
        },
      })
    : null

export type TerminalUser = {
  id: string
  email: string | null
  name: string | null
}

/**
 * The Terminal account on this request, or null. Null is the only failure
 * mode by design — see the module header.
 */
export async function getTerminalUser(): Promise<TerminalUser | null> {
  if (!auth) return null
  try {
    const { data } = await auth.getSession()
    const user = data?.user
    if (!user?.id) return null
    return {
      id: String(user.id),
      email: user.email ? String(user.email) : null,
      name: user.name ? String(user.name) : null,
    }
  } catch {
    // Includes the library's "Cookies can only be modified in a Server
    // Action" refresh attempt during render — same handling as the Terminal.
    return null
  }
}
