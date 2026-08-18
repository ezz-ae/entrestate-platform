/**
 * SaaS tenant control plane — the registry behind {sub}.TENANT_BASE_DOMAIN.
 *
 * One row per tenant in `saas_tenants`, which lives in the DEFAULT (shared)
 * schema; every function here pins itself there explicitly with
 * runWithDefaultSchema, so the control plane stays reachable and consistent
 * no matter which tenant host the current request came in on.
 *
 * Creating a tenant creates its Postgres schema in the same transaction.
 * Filling that schema (tables + shared-catalogue copy) is provisioning's job
 * (see the tenant DDL generator), layered on top of this module.
 */

import { randomUUID } from 'node:crypto'
import { ensureOnce, query, runWithDefaultSchema, withTransaction, invalidateTenantSchemaCache } from '@/lib/db'
import { schemaNameForSubdomain } from './config'
import { isValidTenantSubdomain, RESERVED_SUBDOMAINS, SUBDOMAIN_RE } from './reserved'

/** Trial length granted to a self-served tenant. */
export const TRIAL_DAYS = 14

/** Max decoded logo size stored on the tenant row (same cap as the WL demo). */
export const TENANT_LOGO_MAX_BYTES = 256 * 1024

const DEFAULT_ACCENT = '#D4AF37'

export type TenantStatus = 'trial' | 'active' | 'suspended'

/**
 * What kind of workspace this tenant is. 'company' is the full brokerage
 * instance; 'realtor' is a one-person workspace on the SAME rails (own
 * schema, own catalogue copy) whose few-clicks feel comes from surface
 * gating, not from a different tenancy shape.
 */
export type TenantPlan = 'company' | 'realtor'

export interface SaasTenant {
  id: string
  subdomain: string
  schemaName: string
  company: string
  product: string
  accent: string
  logo: string
  plan: TenantPlan
  status: TenantStatus
  trialEndsAt: string | null
  createdAt: string
  /** The person who signed up. NULL on tenants created before this existed —
   *  read it as "unknown", never as "ownerless". */
  ownerEmail: string | null
}

interface TenantRow {
  id: string
  subdomain: string
  schema_name: string
  company: string
  product: string
  accent: string
  logo: string
  plan: string
  status: string
  trial_ends_at: string | null
  created_at: string
  owner_email: string | null
}

const SELECT_COLS = `id, subdomain, schema_name, company, product, accent, logo, plan, status, trial_ends_at, created_at, owner_email`

// Brand resolution hits this on every request of a tenant host — cache found
// tenants briefly. Misses are not cached (signup availability must stay live).
const bySubdomainCache = new Map<string, { tenant: SaasTenant; expires: number }>()
const BY_SUBDOMAIN_TTL_MS = 15_000

const mapTenant = (r: TenantRow): SaasTenant => ({
  id: r.id,
  subdomain: r.subdomain,
  schemaName: r.schema_name,
  company: r.company,
  product: r.product,
  accent: r.accent,
  logo: r.logo,
  // Unknown values collapse to 'company' (the full surface set is the safe
  // default — gating only ever REMOVES surfaces for 'realtor').
  plan: r.plan === 'realtor' ? 'realtor' : 'company',
  status: (['trial', 'active', 'suspended'].includes(r.status) ? r.status : 'suspended') as TenantStatus,
  trialEndsAt: r.trial_ends_at,
  createdAt: r.created_at,
  // NULL means "we do not know", not "nobody". Tenants created before this
  // column existed carry null and must not be treated as ownerless.
  ownerEmail: r.owner_email,
})

/**
 * Run the control-plane DDL. Exported for maintenance scripts, which reach
 * saas_tenants directly and would otherwise 42703 on a column added after the
 * database last served a request.
 */
export async function ensureTenantStore(): Promise<void> {
  return runWithDefaultSchema(ensure)
}

async function ensure(): Promise<void> {
  await ensureOnce('saas_tenants', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS saas_tenants (
        id            text PRIMARY KEY,
        subdomain     text NOT NULL UNIQUE,
        schema_name   text NOT NULL UNIQUE,
        company       text NOT NULL,
        product       text NOT NULL DEFAULT 'Lead Machine',
        accent        text NOT NULL DEFAULT '${DEFAULT_ACCENT}',
        logo          text NOT NULL DEFAULT '',
        plan          text NOT NULL DEFAULT 'company',
        status        text NOT NULL DEFAULT 'trial',
        trial_ends_at timestamptz,
        created_at    timestamptz NOT NULL DEFAULT now(),
        last_seen_at  timestamptz,
        owner_email   text
      )
    `)
    // Existing deployments already carry the table — grow it in place. The
    // default makes every pre-existing tenant a 'company' (full surface set).
    await query(`ALTER TABLE saas_tenants ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'company'`)
    // WHO OWNS THIS WORKSPACE. Added because nothing could answer it.
    //
    // The owner's real password lives in the TENANT schema (lib/tenancy/
    // onboard.ts writes it there); the identity created in the shared schema
    // by app/api/wl/claim/route.ts deliberately has no password_hash. So a
    // customer signing in at entrestate.com hit authenticateFromDB against the
    // shared schema, verifyPassword returned false on a null hash, and they
    // were told "Incorrect email or password" while holding correct
    // credentials — with nothing anywhere able to say which host to try
    // instead, because this table had no column naming a person.
    //
    // Nullable, and it must stay nullable: tenants created before this column
    // existed have no owner recorded and no safe way to invent one. Readers
    // must treat NULL as "unknown", never as "no owner".
    await query(`ALTER TABLE saas_tenants ADD COLUMN IF NOT EXISTS owner_email text`)
    // Lookup is by lowercased email on the sign-in path, so the index has to
    // match that expression or it is never used.
    try {
      await query(`CREATE INDEX IF NOT EXISTS saas_tenants_owner_email_idx ON saas_tenants (lower(owner_email))`)
    } catch { /* index creation is an optimisation, never a reason to fail startup */ }
  // Self-heal: this table's ON CONFLICT target needs a real unique index.
  // Tables created before the UNIQUE was declared never gained one, which
  // makes every upsert fail with 42P10 (the bug that broke project create).
  try {
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS saas_tenants_subdomain_uidx ON saas_tenants (subdomain)`)
  } catch { /* duplicates present — leave the data alone, surface nothing */ }
  })
}

export type CreateTenantResult =
  | { ok: true; tenant: SaasTenant }
  | { ok: false; reason: 'invalid_subdomain' | 'reserved' | 'taken' }

/**
 * Why a subdomain cannot be claimed, or null when it is free. Used by the
 * signup availability check and re-checked inside createTenant.
 */
export async function subdomainUnavailableReason(
  raw: string,
): Promise<'invalid_subdomain' | 'reserved' | 'taken' | null> {
  const sub = raw.trim().toLowerCase()
  if (!SUBDOMAIN_RE.test(sub)) return 'invalid_subdomain'
  if (RESERVED_SUBDOMAINS.has(sub)) return 'reserved'
  return runWithDefaultSchema(async () => {
    await ensure()
    const rows = await query<{ id: string }>(`SELECT id FROM saas_tenants WHERE subdomain = $1 LIMIT 1`, [sub])
    return rows.length > 0 ? 'taken' : null
  })
}

/**
 * Create a tenant row AND its (empty) Postgres schema, atomically. The unique
 * constraint on subdomain is the arbiter under concurrent claims.
 */
export async function createTenant(input: {
  subdomain: string
  company: string
  product?: string
  accent?: string
  logo?: string
  plan?: TenantPlan
  /** The person signing up. Recorded so "where is my workspace" has an answer. */
  ownerEmail?: string
}): Promise<CreateTenantResult> {
  const sub = input.subdomain.trim().toLowerCase()
  if (!SUBDOMAIN_RE.test(sub)) return { ok: false, reason: 'invalid_subdomain' }
  if (!isValidTenantSubdomain(sub)) return { ok: false, reason: 'reserved' }

  const id = randomUUID()
  const schemaName = schemaNameForSubdomain(sub)
  const company = input.company.trim().slice(0, 40) || 'Your Company'
  // "{Company} Lead Machine" is the default identity — the word "Intelligence"
  // is deliberately NOT the default (overused; brokers can still type it).
  const product = (input.product ?? '').trim().slice(0, 24) || 'Lead Machine'
  const accent = /^#[0-9a-fA-F]{6}$/.test(input.accent ?? '') ? (input.accent as string) : DEFAULT_ACCENT
  const logo = (input.logo ?? '').startsWith('data:image/') ? (input.logo as string) : ''
  const plan: TenantPlan = input.plan === 'realtor' ? 'realtor' : 'company'
  // Lowercased at the boundary so the stored value and every lookup agree.
  // An absent owner is stored as NULL, never as '' — an empty string would
  // match an empty lookup and hand a stranger somebody's workspace.
  const ownerEmail = (input.ownerEmail ?? '').trim().toLowerCase() || null

  return runWithDefaultSchema(async () => {
    await ensure()
    return withTransaction(async (q) => {
      const rows = await q<TenantRow>(
        `INSERT INTO saas_tenants (id, subdomain, schema_name, company, product, accent, logo, plan, status, trial_ends_at, owner_email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'trial', now() + make_interval(days => $9), $10)
         ON CONFLICT (subdomain) DO NOTHING
         RETURNING ${SELECT_COLS}`,
        [id, sub, schemaName, company, product, accent, logo, plan, TRIAL_DAYS, ownerEmail],
      )
      const row = rows[0]
      if (!row) return { ok: false, reason: 'taken' } as const
      // schemaName is derived from the validated subdomain grammar
      // (^t_[a-z0-9_]+$), so it is safe to embed as a quoted identifier.
      await q(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)
      invalidateTenantSchemaCache(sub)
      bySubdomainCache.delete(sub)
      return { ok: true, tenant: mapTenant(row) } as const
    })
  })
}

/** Fetch a tenant by subdomain (brand resolution, signup checks). */
/**
 * Every workspace this email owns.
 *
 * THE ONLY LOOKUP THAT WORKS FROM A HOST THAT IS NOT THEIRS. A customer stands
 * on entrestate.com and types the credentials they use every day; their
 * password lives in a schema this request has not opened and cannot name.
 * Before this existed, the answer was "Incorrect email or password".
 *
 * Returns a LIST, not one row, and that is deliberate: one person can own more
 * than one brokerage workspace, and silently picking the first would sign them
 * into whichever the database happened to return first.
 *
 * DELIBERATELY NOT CACHED. `bySubdomainCache` above exists because brand
 * resolution runs on every request of a tenant host; this runs once per
 * sign-in attempt. Caching it would mean a workspace created a moment ago is
 * invisible to the person who just created it, to save a query nobody makes
 * twice.
 *
 * THE CALLER OWES A PASSWORD CHECK. This function proves nothing about who is
 * asking — it maps an email to workspaces, and an attacker can type any email.
 * Nothing it returns may reach a response body, a redirect, or an error
 * message before a password has verified against that tenant's own schema, or
 * this becomes an endpoint that confirms which brokerages a person runs.
 */
export async function tenantsOwnedByEmail(rawEmail: string): Promise<SaasTenant[]> {
  const email = rawEmail.trim().toLowerCase()
  // An empty lookup must never match the tenants whose owner is unknown.
  // createTenant stores an absent owner as NULL for the same reason, but a
  // guard on each side of the comparison costs nothing and this is the side
  // an attacker controls.
  if (!email || !email.includes('@')) return []
  try {
    return await runWithDefaultSchema(async () => {
      await ensure()
      const rows = await query<TenantRow>(
        `SELECT ${SELECT_COLS} FROM saas_tenants
          WHERE lower(owner_email) = $1 AND status <> 'suspended'
          ORDER BY created_at ASC`,
        [email],
      )
      return rows.map(mapTenant)
    })
  } catch (err) {
    // Fail CLOSED, unlike getTenantBySubdomain below. That one serves stale
    // brand data rather than take a live site down; this one decides whether
    // somebody gets signed in, and an unreadable control plane is not a reason
    // to guess. The caller renders the ordinary "incorrect email or password".
    console.error('[tenancy] owner lookup failed — sign-in will fall through', err)
    return []
  }
}

export async function getTenantBySubdomain(raw: string): Promise<SaasTenant | null> {
  const sub = raw.trim().toLowerCase()
  if (!SUBDOMAIN_RE.test(sub)) return null
  const cached = bySubdomainCache.get(sub)
  if (cached && cached.expires > Date.now()) return cached.tenant
  try {
    return await runWithDefaultSchema(async () => {
      await ensure()
      const rows = await query<TenantRow>(
        `SELECT ${SELECT_COLS} FROM saas_tenants WHERE subdomain = $1 LIMIT 1`,
        [sub],
      )
      if (!rows[0]) return null
      const tenant = mapTenant(rows[0])
      bySubdomainCache.set(sub, { tenant, expires: Date.now() + BY_SUBDOMAIN_TTL_MS })
      return tenant
    })
  } catch (err) {
    // Stale beats stranger. Brand/plan resolution rides this on every request
    // of a tenant host, and callers degrade null to the vendor's STATIC brand
    // — so a transient DB error (cold pool, blip) was randomly dressing a
    // tenant's workspace in the wrong company and the full nav. A tenant we
    // have EVER resolved in this instance keeps resolving from the expired
    // cache entry while the error lasts; only tenants never seen here still
    // surface the failure to the caller.
    if (cached) {
      console.error('[tenancy] tenant lookup failed — serving stale cache for', sub, err)
      return cached.tenant
    }
    throw err
  }
}

/** All tenants, newest first — for the vendor's admin surface. */
export async function listTenants(): Promise<SaasTenant[]> {
  return runWithDefaultSchema(async () => {
    await ensure()
    const rows = await query<TenantRow>(
      `SELECT ${SELECT_COLS} FROM saas_tenants ORDER BY created_at DESC LIMIT 500`,
    )
    return rows.map(mapTenant)
  })
}

/**
 * Can the control plane answer at all right now?
 *
 * The difference between "this subdomain is not a tenant" and "I cannot see
 * tenants at the moment" is the difference between a correct 404 and telling a
 * paying customer their workspace does not exist. A cold lambda served exactly
 * that: two lookups in a row came back empty for a tenant that plainly exists,
 * and the 404 boundary believed them.
 *
 * A deployment with zero tenant rows is not a state this platform reaches in
 * normal life, so "the table answered and holds somebody" is the cheapest
 * honest proof that an empty answer for one subdomain means what it says. Runs
 * only on the path that is about to refuse, so it costs nothing elsewhere.
 */
export async function controlPlaneHasTenants(): Promise<boolean> {
  try {
    return await runWithDefaultSchema(async () => {
      await ensure()
      const rows = await query<{ n: string }>(`SELECT count(*)::text AS n FROM saas_tenants`)
      return Number(rows[0]?.n ?? 0) > 0
    })
  } catch {
    return false
  }
}
