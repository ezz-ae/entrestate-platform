import { Pool, type PoolClient, type QueryResultRow } from "pg"
import { AsyncLocalStorage } from "node:async_hooks"
import { SAAS_TENANCY, tenantSubdomainFromHost } from "@/lib/tenancy/config"

const rawConnectionString =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
const schema = process.env.DB_SCHEMA || "public"

/** The non-tenant schema — control plane, shared catalogue, Freehold itself. */
export const DEFAULT_SCHEMA = schema

/**
 * WHOSE DATABASE IS THIS — enforced here because here is where connections are
 * handed out.
 *
 * lib/tenancy/db-owner.ts decides the question and has since it was written. It
 * was never asked: nothing called it, so a deployment could be pointed at the
 * client's live database and the only thing that would happen is that it would
 * work. A lock nobody turns is a comment.
 *
 * acquireClient() is the one place every read and write passes through, so the
 * question is asked once there, before the first connection is used for
 * anything. Unset DB_OWNER leaves it dormant — no query, no cost, no change —
 * which is exactly how the client's deployment runs.
 */
const DB_OWNER_DECLARED = (process.env.DB_OWNER || "").trim().toLowerCase()

let ownerGate: Promise<void> | null = null

async function assertDatabaseIsOurs(): Promise<void> {
  if (!DB_OWNER_DECLARED) return
  if (!ownerGate) {
    // Imported lazily: db-owner reads the database through this module, and a
    // top-level import would make the cycle load-bearing at module-eval time.
    ownerGate = import("@/lib/tenancy/db-owner").then((m) => m.assertDatabaseOwner())
    // A database that was briefly unreachable must not wedge the process for
    // the rest of its life. Forget a failed gate so the next connection asks
    // again; a real mismatch is re-decided from db-owner's own cache and costs
    // nothing, while a blip gets a second chance.
    ownerGate.catch(() => { ownerGate = null })
  }
  return ownerGate
}

// Two env vars name the same thing and `||` picks a winner without saying so.
// If a deploy carries a stale NEON_DATABASE_URL next to a freshly corrected
// DATABASE_URL, every read and write lands in the old database while
// /api/health still reports db: true — health only proves *a* connection
// opened, never which one — so the corrected DATABASE_URL looks applied and
// isn't.
//
// This warns rather than throws, deliberately. Setting both is a documented,
// supported configuration (.env.example calls NEON_DATABASE_URL an optional
// alias; docs/WHITE-LABEL.md has the operator set one and seed with the other),
// so refusing to start would break working deployments. A strict string compare
// also cannot tell a real disagreement from the same database reached two ways
// — a -pooler host beside the direct host, or one URL carrying ?sslmode= and
// the other not — and those must not be fatal. Once per process, at first use.
let connectionSourceWarned = false
function warnOnAmbiguousConnectionSource(): void {
  if (connectionSourceWarned) return
  const neon = process.env.NEON_DATABASE_URL
  const database = process.env.DATABASE_URL
  if (neon && database && neon !== database) {
    connectionSourceWarned = true
    // The values are credentials; name the variables, never their contents.
    console.warn(
      "[db] NEON_DATABASE_URL and DATABASE_URL are both set to different values. " +
      "NEON_DATABASE_URL wins; DATABASE_URL is ignored. If that is not what you " +
      "intended, unset one — /api/health cannot tell you which database you reached.",
    )
  }
}

/**
 * SESSION MODE ONLY — this pool must never speak to a transaction-mode pooler.
 *
 * Every query here runs on a connection whose search_path was set ONCE per
 * checkout (acquireClient, below) and then trusted: "re-points search_path
 * only on mismatch". That is a session-level contract. Neon's `-pooler` host
 * is PgBouncer in transaction mode, where a session-level SET lives only as
 * long as the statement's transaction — the next statement from the same
 * client may land on a backend last used by ANOTHER request, carrying THAT
 * request's search_path.
 *
 * It happened. 2026-09-05 05:55: a tenant claim (/api/account/workspace/enter)
 * pinned a backend to "t_mahmoud, entrestate_app"; 05:56:24, a request on
 * entrestate.com — schema pinned to the default by runWithDefaultSchema — ran
 * CREATE TABLE IF NOT EXISTS entrestate_accounts and INSERTed the account on
 * that backend, and both landed in t_mahmoud. The vendor's tables appeared
 * inside a customer's schema, and the mirror of that — a customer's query
 * reading the shared schema, or another tenant's — is the same bug with the
 * roles swapped. Schema isolation cannot rest on a pooler that forgets.
 *
 * So the pooled hostname is rewritten to the direct one, whatever the env
 * says: the same endpoint, the same credentials, session semantics. The pool
 * is kept small (POOL_MAX) because direct connections are counted against
 * the compute's max_connections and every warm function instance holds its
 * own pool. scripts/db-session-pool-test.ts holds both.
 */
export function sessionModeConnectionString(raw: string): string {
  return raw.replace(/-pooler(\.[a-z0-9.-]*neon\.tech)/i, "$1")
}

/**
 * Connections per function instance. Neon's smallest compute allows ~112
 * direct connections; ten warm instances at five each leave room. Idle
 * connections are released after thirty seconds so a quiet instance does
 * not sit on five of them.
 */
export const POOL_MAX = 5
const POOL_IDLE_MS = 30_000

const getConnectionString = () => {
  warnOnAmbiguousConnectionSource()
  if (!rawConnectionString) {
    throw new Error("Missing NEON_DATABASE_URL or DATABASE_URL environment variable")
  }
  const direct = sessionModeConnectionString(rawConnectionString)
  return direct.includes("sslmode=")
    ? direct.replace(/sslmode=[^&]+/, "sslmode=verify-full")
    : `${direct}${direct.includes("?") ? "&" : "?"}sslmode=verify-full`
}

const globalForPool = globalThis as unknown as { pgPool?: Pool }

// Last search_path each pooled connection was set to. Connections are reused
// across requests (and therefore across tenants), so every checkout compares
// the connection's recorded schema with the one the current request needs and
// re-points search_path only on mismatch — the common same-schema case costs
// nothing extra.
const clientSchema = new WeakMap<object, string>()

function getPool(): Pool {
  if (globalForPool.pgPool) return globalForPool.pgPool

  const pool = new Pool({
    connectionString: getConnectionString(),
    max: POOL_MAX,
    idleTimeoutMillis: POOL_IDLE_MS,
  })

  pool.on('connect', (client) => {
    // This is safe because 'schema' is from a trusted environment variable
    client.query(`SET search_path TO '${schema}'`)
    clientSchema.set(client, schema)
  })

  // Required now that the pool outlives the request. pg's Pool is an
  // EventEmitter and emits 'error' when an IDLE client dies — Neon closing an
  // idle connection, a network reset, an admin disconnect. An 'error' emission
  // with no listener is an uncaught exception, which takes the process down.
  // The pool discards the dead client and opens a fresh one on the next
  // checkout, so logging is the whole job here.
  pool.on('error', (err) => {
    console.error('[db] idle client error', err)
  })

  // The memo must never be environment-gated. getPool() runs on every single
  // checkout (see acquireClient), so gating it to non-production means the
  // cache above never hits in production: each query builds a throwaway Pool,
  // pays a fresh TLS handshake, and abandons it — nothing in lib/ or app/ ever
  // calls pool.end(), so the discarded pools hold their sockets until the
  // process dies. The dev-only guard looks like the familiar Next HMR idiom
  // (memoise on globalThis so hot reload doesn't leak pools), which is exactly
  // why someone will try to put it back; that idiom caches in dev *as well as*
  // production, not instead of it. This hurts most when the database is shared
  // with another product, because the churn and the connection slots it burns
  // are spent on someone else's compute.
  globalForPool.pgPool = pool
  return pool
}

// ── Tenant schema resolution ─────────────────────────────────────────────────
//
// Schema-per-tenant: on a tenant host ({sub}.TENANT_BASE_DOMAIN) every query
// in this module runs with search_path "tenant_schema, DEFAULT_SCHEMA", so
// business SQL resolves to the tenant's own tables first — isolation is
// enforced here, once, not in ~760 call sites. The DEFAULT_SCHEMA fallback
// exists for read-only platform content that is deliberately NOT provisioned
// per tenant (area/developer profiles, blog): those tables only exist in the
// shared schema, so tenant reads fall through to them and platform updates
// reach every tenant instantly. Unqualified CREATE TABLE and any table that
// DOES exist tenant-side always bind to the tenant schema (first in path),
// so tenant business tables shadow shared ones from the moment they are
// created. Resolution order:
//
//   1. An explicit runWithSchema()/runWithDefaultSchema() scope (provisioning,
//      control-plane modules, scripts).
//   2. The request's Host header (via next/headers) → saas_tenants lookup,
//      cached. Unknown or suspended tenant hosts THROW — a tenant host must
//      never silently fall through to the shared schema.
//   3. No tenancy / no request scope / non-tenant host → DEFAULT_SCHEMA:
//      behaves exactly as before this module knew about tenants.

/** Postgres identifier the tenancy layer generates: t_ + [a-z0-9_]. */
const SAFE_SCHEMA = /^[a-z0-9_]{1,63}$/

class TenantResolutionError extends Error {
  constructor(message: string) { super(message); this.name = 'TenantResolutionError' }
}

const schemaContext = new AsyncLocalStorage<{ schema: string }>()

function assertValidSchemaName(name: string): void {
  if (!SAFE_SCHEMA.test(name)) {
    throw new TenantResolutionError(`Invalid schema name "${name}".`)
  }
}

/** Run `fn` with every lib/db query pinned to `schemaName` (tenant provisioning, cross-tenant ops). */
export function runWithSchema<T>(schemaName: string, fn: () => Promise<T>): Promise<T> {
  assertValidSchemaName(schemaName)
  return schemaContext.run({ schema: schemaName }, fn)
}

/** Run `fn` pinned to the shared/default schema (control-plane tables), regardless of request host. */
export function runWithDefaultSchema<T>(fn: () => Promise<T>): Promise<T> {
  return schemaContext.run({ schema: DEFAULT_SCHEMA }, fn)
}

// next/headers is imported lazily so this module keeps working under plain
// tsx scripts (seeders, generators) that run outside a Next server.
let headersImport: Promise<typeof import("next/headers")> | null = null

async function getRequestHost(): Promise<string | null> {
  try {
    if (!headersImport) headersImport = import("next/headers")
    const { headers } = await headersImport
    return (await headers()).get("host")
  } catch (err) {
    // Next signals "make this route dynamic" by throwing from headers()
    // during static prerender — that control flow must keep propagating.
    const digest = (err as { digest?: string } | null)?.digest
    if (typeof digest === "string" &&
        (digest.startsWith("DYNAMIC_SERVER_USAGE") || digest.startsWith("NEXT_PRERENDER_INTERRUPTED"))) {
      throw err
    }
    // Outside any request scope (script, build, background work): no host.
    return null
  }
}

// Host → tenant schema cache. Small TTL so suspensions propagate quickly;
// short negative TTL so a burst of requests for a nonexistent subdomain
// doesn't hammer the control-plane table.
interface TenantCacheEntry { schema: string | null; suspended: boolean; expires: number }
const tenantCache = new Map<string, TenantCacheEntry>()
const TENANT_CACHE_TTL_MS = 60_000
const TENANT_NEGATIVE_TTL_MS = 10_000

async function lookupTenantSchema(subdomain: string): Promise<TenantCacheEntry> {
  const cached = tenantCache.get(subdomain)
  if (cached && cached.expires > Date.now()) return cached

  let entry: TenantCacheEntry
  try {
    const rows = await rawQuery<{ schema_name: string; status: string }>(
      DEFAULT_SCHEMA,
      `SELECT schema_name, status FROM saas_tenants WHERE subdomain = $1 LIMIT 1`,
      [subdomain],
    )
    const row = rows[0]
    entry = row
      ? {
          schema: SAFE_SCHEMA.test(row.schema_name) ? row.schema_name : null,
          suspended: row.status === 'suspended',
          expires: Date.now() + TENANT_CACHE_TTL_MS,
        }
      : { schema: null, suspended: false, expires: Date.now() + TENANT_NEGATIVE_TTL_MS }
  } catch {
    // STALE BEATS STRANGER — the same rule getTenantBySubdomain keeps.
    //
    // "Unreachable" was being written into the cache as "no such tenant", so a
    // momentary control-plane error took every live tenant to a 500 for the
    // negative TTL. Observed: a DROP SCHEMA on an unrelated throwaway tenant
    // held locks for a few seconds and two real workspaces went down with it.
    //
    // A subdomain this instance has ALREADY resolved keeps its schema through
    // the error; only a tenant we have never seen falls through to the honest
    // "unknown", where failing closed is still right. The expiry is short so
    // the next request re-reads rather than pinning a stale answer.
    if (cached?.schema) {
      entry = { ...cached, expires: Date.now() + TENANT_NEGATIVE_TTL_MS }
    } else {
      // Control-plane table missing or unreachable ⇒ treat as unknown tenant.
      // Callers on tenant hosts fail closed; non-tenant hosts never get here.
      entry = { schema: null, suspended: false, expires: Date.now() + TENANT_NEGATIVE_TTL_MS }
    }
  }
  tenantCache.set(subdomain, entry)
  if (tenantCache.size > 5000) {
    const now = Date.now()
    for (const [k, v] of tenantCache) if (v.expires <= now) tenantCache.delete(k)
  }
  return entry
}

/** Drop a cached host→schema mapping (used right after provisioning a tenant). */
export function invalidateTenantSchemaCache(subdomain?: string): void {
  if (subdomain) tenantCache.delete(subdomain)
  else tenantCache.clear()
}

/**
 * The schema the current call must run in. Exported so cross-cutting stores
 * (ensureOnce below, per-schema caches) can key their state correctly.
 */
export async function resolveActiveSchema(): Promise<string> {
  const ctx = schemaContext.getStore()
  if (ctx) return ctx.schema
  if (!SAAS_TENANCY) return DEFAULT_SCHEMA
  const sub = tenantSubdomainFromHost(await getRequestHost())
  if (!sub) return DEFAULT_SCHEMA
  const entry = await lookupTenantSchema(sub)
  if (!entry.schema) {
    throw new TenantResolutionError(`No tenant is provisioned for "${sub}".`)
  }
  if (entry.suspended) {
    throw new TenantResolutionError(`Tenant "${sub}" is suspended.`)
  }
  return entry.schema
}

/**
 * Check out a connection with search_path pointed at `schemaName`. ALL reads
 * and writes in this module go through here — never pool.query() directly —
 * so a connection can never carry one tenant's search_path into another
 * tenant's (or the shared schema's) query.
 */
async function acquireClient(schemaName: string, skipOwnerGate = false): Promise<PoolClient> {
  assertValidSchemaName(schemaName)
  // Before anything is read or written, settle whose database this is. The
  // ownership check's own queries pass skipOwnerGate — they are the one caller
  // that must reach the database before the question has an answer.
  if (!skipOwnerGate) await assertDatabaseIsOurs()
  // Tenant schemas resolve "tenant first, shared fallback"; the default
  // schema stays exactly itself.
  const searchPath = schemaName === DEFAULT_SCHEMA ? DEFAULT_SCHEMA : `${schemaName}, ${DEFAULT_SCHEMA}`
  const client = await getPool().connect()
  if (clientSchema.get(client) !== searchPath) {
    try {
      // set_config is parameterised — the schema name never enters SQL text.
      await client.query(`SELECT set_config('search_path', $1, false)`, [searchPath])
      clientSchema.set(client, searchPath)
    } catch (err) {
      client.release()
      throw err
    }
  }
  return client
}

async function rawQuery<T extends QueryResultRow = QueryResultRow>(
  schemaName: string,
  text: string,
  params: unknown[] = [],
  skipOwnerGate = false,
): Promise<T[]> {
  const client = await acquireClient(schemaName, skipOwnerGate)
  try {
    const result = await client.query<T>(text, params)
    return result.rows
  } finally {
    client.release()
  }
}

/**
 * The empty-array fallback below is load-bearing and dangerous, so it says so
 * out loud exactly once per process.
 *
 * `next build` renders pages that read the database, on machines and in CI runs
 * that have no database. Throwing there would mean no build without a live
 * connection, so an unconfigured `query()` returns no rows instead.
 *
 * The cost is that "the database is not configured" and "the table is empty"
 * are the SAME VALUE to every caller in this app. That has already been paid
 * once here: lookupTenantSchema cached an unreachable control plane as "no such
 * tenant" and took two live workspaces down. It nearly happened again in a
 * maintenance script, which read zero tenants from a shell with no env and
 * reported "nothing to do" — a sentence one edit away from being destructive.
 *
 * So: keep the fallback, and make its silence impossible. Anything that must
 * not mistake the two calls assertDatabaseConfigured() first.
 */
let missingConnectionWarned = false
function warnOnMissingConnection(): void {
  if (missingConnectionWarned) return
  missingConnectionWarned = true
  console.warn(
    "[db] No NEON_DATABASE_URL or DATABASE_URL — every query returns zero rows. " +
    "This is the build-time fallback. If you are not building, nothing you read " +
    "is real: an empty result here means UNCONFIGURED, not empty.",
  )
}

/**
 * Refuse to continue when there is no database.
 *
 * For maintenance scripts and any caller whose next step depends on a read
 * being TRUE rather than merely returning. `query()` cannot do this itself —
 * see above — so the callers that cannot afford the ambiguity opt in.
 */
export function assertDatabaseConfigured(who = 'this operation'): void {
  if (rawConnectionString) return
  throw new Error(
    `No NEON_DATABASE_URL or DATABASE_URL — ${who} would read zero rows from ` +
    `a database it never opened. Set one, or run with \`set -a; . ./.env.local; set +a\`.`,
  )
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  if (!rawConnectionString) { warnOnMissingConnection(); return [] as T[] }
  return rawQuery<T>(await resolveActiveSchema(), text, params)
}

/**
 * The ownership check's own connection — and nothing else's.
 *
 * lib/tenancy/db-owner.ts has to read the database in order to decide whether
 * this deployment may read the database. Routed through query() that is an
 * infinite regress, so it gets a door that skips the gate. It also runs in
 * DEFAULT_SCHEMA rather than resolving the request's tenant: ownership is a
 * property of the database, not of a schema inside it, and resolveActiveSchema
 * would itself query.
 *
 * If a second caller ever appears here, the honest question is why it needs to
 * touch a database whose owner is still undecided.
 */
export async function unguardedQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  if (!rawConnectionString) { warnOnMissingConnection(); return [] as T[] }
  return rawQuery<T>(DEFAULT_SCHEMA, text, params, true)
}

/** A single-connection query bound to an open transaction. */
export type TxQuery = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) => Promise<T[]>

/**
 * Run `fn` inside a single BEGIN/COMMIT transaction on one pooled connection,
 * so `SELECT ... FOR UPDATE` row locks hold for the whole callback. Rolls back
 * (and rethrows) on any error. Throws if no database is configured — callers
 * that must stay non-fatal should wrap this in their own try/catch.
 * The whole transaction runs in the current tenant's schema.
 */
export async function withTransaction<T>(fn: (q: TxQuery) => Promise<T>): Promise<T> {
  if (!rawConnectionString) {
    throw new Error("Missing NEON_DATABASE_URL or DATABASE_URL environment variable")
  }
  const client = await acquireClient(await resolveActiveSchema())
  const scoped: TxQuery = async (text, params = []) => (await client.query(text, params)).rows as never
  try {
    await client.query("BEGIN")
    const out = await fn(scoped)
    await client.query("COMMIT")
    return out
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// ── Per-schema one-time setup ────────────────────────────────────────────────
//
// The app creates its tables lazily (CREATE TABLE IF NOT EXISTS on first use)
// and memoises that per module. A module-level `let ensured = false` is wrong
// under schema-per-tenant: the first tenant a warm process touches would mark
// the DDL "done" for every other tenant. ensureOnce() keys the memo by
// (active schema, caller key) instead — same lazy behaviour, correct per
// tenant. A failed attempt is forgotten so the next call retries.

const ensurePromises = new Map<string, Promise<void>>()

export async function ensureOnce(key: string, fn: () => Promise<void>): Promise<void> {
  const activeSchema = await resolveActiveSchema()
  const memoKey = `${activeSchema}:${key}`
  let p = ensurePromises.get(memoKey)
  if (!p) {
    p = fn()
    ensurePromises.set(memoKey, p)
    p.catch(() => ensurePromises.delete(memoKey))
  }
  return p
}
