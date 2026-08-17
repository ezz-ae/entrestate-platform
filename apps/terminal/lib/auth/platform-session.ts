import "server-only"
import { createHash } from "node:crypto"
import { cookies } from "next/headers"
import { Prisma } from "@prisma/client"
import { dbQuery } from "@/lib/db"

/**
 * WHO IS THIS, according to the rest of Entrestate.
 *
 * The Terminal authenticates with Neon Auth; the platform authenticates with
 * its own session table. That is two registrations for one person, and it
 * shows up exactly where it hurts most: somebody signs up on entrestate.com,
 * arrives here to use the market data their account already includes, and the
 * Terminal has never heard of them.
 *
 * The platform's identity cookie is scoped to `.entrestate.com` (lib/auth.ts),
 * so it is already sitting on this request. This reads it — nothing more. It
 * is a lookup, never a login: no cookie is written, no session refreshed, no
 * Neon Auth state touched.
 *
 * WHY THIS IS SAFE TO CONSULT. The cookie is an opaque 32-byte random token,
 * stored only as a SHA-256 hash, matched against a row that carries its own
 * expiry. It cannot be forged without the platform's table, and it grants
 * nothing here beyond a name and an email — every authority in this product is
 * scoped to a workspace, which lives behind a different cookie the proxy
 * fences to a single host.
 *
 * WHY IT IS A FALLBACK AND NOT THE PRIMARY. Neon Auth stays first so that
 * everyone signed in today keeps their session exactly as it is. This only
 * answers when Neon Auth has no opinion, which is precisely the case this
 * exists for: the platform customer who has never signed in *here*.
 *
 * Fails to null on ANY error, by construction. A database blip, a schema that
 * has not been provisioned, a malformed cookie — each returns the same answer
 * the Terminal gives today, which is "nobody". This must never be able to sign
 * a visitor out or break a render.
 */

/** The platform's identity cookie. Named in lib/auth.ts as SESSION_COOKIE. */
const PLATFORM_COOKIE = "freehold_site_session"

/** Matches lib/auth.ts hashToken — the token is stored hashed, never raw. */
const hashToken = (value: string) => createHash("sha256").update(value).digest("hex")

export interface PlatformIdentity {
  id: string
  name: string | null
  email: string
  /** Carried through so callers that gate on role (isAdminUser) see the same
   *  shape Neon Auth gives them. The platform mints this as 'broker' — the
   *  lowest — so a platform identity can never inherit admin here. */
  role: string | null
}

export async function getPlatformIdentity(): Promise<PlatformIdentity | null> {
  try {
    const store = await cookies()
    const token = store.get(PLATFORM_COOKIE)?.value
    if (!token) return null

    // Schema-qualified on purpose: the platform's users and sessions live in
    // the shared control-plane schema, and this app's search_path is its own.
    const rows = await dbQuery<{ id: string; name: string | null; email: string; role: string | null }>(Prisma.sql`
      SELECT u.id, u.name, u.email, u.role
      FROM entrestate_app.freehold_site_user_sessions s
      JOIN entrestate_app.freehold_site_users u ON u.id = s.user_id
      WHERE s.token_hash = ${hashToken(token)}
        AND s.expires_at > now()
      LIMIT 1
    `)

    const row = rows[0]
    return row?.email
      ? { id: row.id, name: row.name ?? null, email: row.email, role: row.role ?? null }
      : null
  } catch {
    // See the header: silence here is the whole safety property.
    return null
  }
}
