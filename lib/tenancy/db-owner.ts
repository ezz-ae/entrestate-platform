/**
 * WHOSE DATABASE IS THIS — asked before the app writes a single row.
 *
 * This repository is a fork of a client's live deployment and still carries
 * every one of its table names. That is not a defect: the two products are the
 * same software. It does mean the ONLY thing separating "our data" from "a
 * client's live business" is which connection string an environment variable
 * happens to hold — and a variable is one careless paste away from pointing at
 * the wrong one.
 *
 * The cost of that paste is not abstract. The client's database is running
 * more than ten live campaigns; leads arrive in it today, real money bought
 * them, and a fork writing into it would be writing into somebody's revenue.
 *
 * So the deployment DECLARES who it is, the database REMEMBERS who it belongs
 * to, and a mismatch refuses to start.
 *
 * ── THE RULE THAT MAKES THIS SAFE ──────────────────────────────────────────
 * WE NEVER WRITE A MARKER INTO A DATABASE THAT ALREADY HAS SOMEBODY'S DATA.
 *
 * Claiming an unclaimed-but-populated database is exactly the mistake this
 * module exists to prevent: the client's database predates the marker, so it
 * has app tables full of rows and no owner row. Writing ours there would be
 * the fork adopting the client's data with a shrug. Instead:
 *
 *   · marker present, matches      → run.
 *   · marker present, differs      → REFUSE. Someone else owns this.
 *   · marker absent, database EMPTY of our tables → claim it and run. A fresh
 *     database is the only kind we may adopt.
 *   · marker absent, database POPULATED → REFUSE, loudly, without writing.
 *     This is the client's database, or one whose history we cannot see.
 *
 * Fails CLOSED in every direction, including on an unreadable database: a
 * connection we cannot interrogate is not one we may write to.
 */

// unguardedQuery, not query: lib/db.ts now asks this module whether the
// database may be touched before it hands out a connection, so reading the
// marker through the ordinary door would ask the question in order to answer
// it. This is the only caller of that door.
import { unguardedQuery, assertDatabaseConfigured } from '@/lib/db'

/**
 * Who this deployment is, from the environment. Not NEXT_PUBLIC: it is a
 * server-side safety property and a browser has no business reading it.
 * Empty means the check is dormant — the same convention as
 * NEXT_PUBLIC_TENANT_BASE_DOMAIN, so an existing deployment that has not set
 * it behaves exactly as before.
 */
export const DB_OWNER = (process.env.DB_OWNER || '').trim().toLowerCase()

/** Table holding the single owner row. Deliberately not prefixed with any
 *  product name: it is about the database, not about an app inside it. */
const TABLE = 'deployment_owner'

/**
 * Tables whose presence WITH ROWS proves a database is already somebody's
 * working system. Chosen because they only ever fill up in a real deployment:
 * a lead is a person who enquired, a user is somebody who signed in, a project
 * is inventory somebody loaded.
 */
const POPULATED_MARKERS = ['freehold_site_leads', 'freehold_site_users', 'freehold_site_projects'] as const

export type OwnerVerdict =
  | { ok: true; reason: 'dormant' | 'matches' | 'claimed' }
  | { ok: false; reason: 'mismatch' | 'populated' | 'unreadable'; found: string | null; detail: string }

/** Pure: given what was read, decide. Split out so the decision is testable
 *  without a database, which is the only way this gets tested at all. */
export function decideOwner(params: {
  declared: string
  marker: string | null
  populated: boolean
}): OwnerVerdict {
  const { declared, marker, populated } = params
  if (!declared) return { ok: true, reason: 'dormant' }
  if (marker) {
    return marker === declared
      ? { ok: true, reason: 'matches' }
      : {
          ok: false, reason: 'mismatch', found: marker,
          detail: `This database belongs to "${marker}" and this deployment is "${declared}". `
            + `Refusing to start rather than write into somebody else's system.`,
        }
  }
  if (populated) {
    return {
      ok: false, reason: 'populated', found: null,
      detail: `This database has no owner marker but already holds data. `
        + `A populated database is somebody's working system — very likely the client's, `
        + `which runs live campaigns — so "${declared}" will not adopt it. `
        + `Point DATABASE_URL at this deployment's own database, or set the owner row by hand if you are certain.`,
    }
  }
  return { ok: true, reason: 'claimed' }
}

async function readMarker(): Promise<string | null> {
  await unguardedQuery(`CREATE TABLE IF NOT EXISTS ${TABLE} (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    owner text NOT NULL,
    claimed_at timestamptz NOT NULL DEFAULT now()
  )`)
  const rows = await unguardedQuery<{ owner: string }>(`SELECT owner FROM ${TABLE} WHERE id = 1`)
  return rows[0]?.owner ?? null
}

async function looksPopulated(): Promise<boolean> {
  for (const t of POPULATED_MARKERS) {
    const [present] = await unguardedQuery<{ ok: boolean }>(`SELECT to_regclass($1) IS NOT NULL AS ok`, [t])
    if (!present?.ok) continue
    const [row] = await unguardedQuery<{ n: string }>(`SELECT count(*)::text AS n FROM ${t} LIMIT 1`)
    if (Number(row?.n ?? 0) > 0) return true
  }
  return false
}

let cached: OwnerVerdict | null = null

/**
 * Check, once per process. Returns the verdict rather than throwing so a
 * caller can render it — a deployment pointed at the wrong database should say
 * so in plain words, not 500 with a stack trace.
 */
export async function checkDatabaseOwner(): Promise<OwnerVerdict> {
  if (cached) return cached
  if (!DB_OWNER) { cached = { ok: true, reason: 'dormant' }; return cached }
  try {
    assertDatabaseConfigured('the database-owner check')
    const marker = await readMarker()
    const populated = marker ? false : await looksPopulated()
    const verdict = decideOwner({ declared: DB_OWNER, marker, populated })
    // Claim ONLY a database that is both unmarked and empty.
    if (verdict.ok && verdict.reason === 'claimed') {
      await unguardedQuery(
        `INSERT INTO ${TABLE} (id, owner) VALUES (1, $1) ON CONFLICT (id) DO NOTHING`,
        [DB_OWNER],
      )
    }
    cached = verdict
    return verdict
  } catch (e) {
    // A database we cannot interrogate is not one we may write to — but this
    // verdict is NOT cached. Now that lib/db.ts gates every connection on this
    // answer, caching a momentary outage would turn one unreachable second into
    // a dead process until somebody redeployed. Fail closed for this call, ask
    // again on the next one.
    return {
      ok: false, reason: 'unreadable', found: null,
      detail: `Could not verify which deployment owns this database: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

/** Throwing form, for callers that would rather fail than branch. */
export async function assertDatabaseOwner(): Promise<void> {
  const v = await checkDatabaseOwner()
  if (!v.ok) throw new Error(`[db-owner] ${v.detail}`)
}
