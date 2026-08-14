/**
 * Tenant schema provisioning — what happens right after createTenant().
 *
 * Philosophy: the app already creates its tables lazily (ensureOnce-keyed
 * CREATE TABLE IF NOT EXISTS on first use), so a fresh tenant schema fills
 * itself as the tenant works. Provisioning therefore only does the part lazy
 * DDL cannot: seed the tenant's PRIVATE copy of the shared market catalogue,
 * so their very first screen shows a live inventory they can edit and import
 * into without ever touching the shared rows.
 *
 * Read-only platform content (area profiles, developer profiles, blog) is NOT
 * copied — tenant requests read it from the shared schema via the search_path
 * fallback, so platform updates propagate to every tenant instantly. The line:
 * content tenants can WRITE is copied (private); content they only READ is
 * shared (fallback).
 */

import { query, runWithDefaultSchema, withTransaction, DEFAULT_SCHEMA } from '@/lib/db'

/** Catalogue tables a tenant gets a private, editable copy of at signup. */
const CATALOG_COPY_TABLES = [
  'freehold_site_projects',
  'freehold_site_project_profiles',
]

const SAFE_IDENT = /^[a-z0-9_]{1,63}$/

/**
 * Copy the shared catalogue into `schemaName`. Idempotent: tables that already
 * hold tenant rows are left untouched; catalogue tables missing from the shared
 * schema (e.g. an unseeded fresh database) are skipped. An existing but EMPTY
 * tenant table is treated as un-provisioned and copied into — see the guard
 * below for why existence alone cannot mean "done".
 * Runs pinned to the default schema so it can see both sides.
 */
export async function provisionTenantSchema(schemaName: string): Promise<void> {
  if (!SAFE_IDENT.test(schemaName) || !SAFE_IDENT.test(DEFAULT_SCHEMA)) return
  await runWithDefaultSchema(async () => {
    for (const table of CATALOG_COPY_TABLES) {
      if (!SAFE_IDENT.test(table)) continue
      const [src] = await query<{ reg: string | null }>(
        `SELECT to_regclass($1)::text AS reg`,
        [`${DEFAULT_SCHEMA}.${table}`],
      )
      if (!src?.reg) continue // shared side not seeded — nothing to copy
      const [dst] = await query<{ reg: string | null }>(
        `SELECT to_regclass($1)::text AS reg`,
        [`${schemaName}.${table}`],
      )
      // The destination EXISTING is not proof it was provisioned. The app's
      // lazy DDL (ensureProjectsTable in lib/data.ts, and the equivalent in
      // lib/freehold/project-profile.ts) creates these tables empty on the
      // tenant's first page view, so a request that beats provisioning leaves a
      // real but empty table here. Skipping on existence would then skip it
      // forever — there is no re-provision route, since POST /api/wl/tenants
      // 400s on "taken" before it ever calls back in — and the tenant would
      // live out its trial on a blank catalogue. So the guard is EMPTINESS, not
      // existence: rows present means the tenant has data of their own, which
      // we never clobber.
      const dstExists = Boolean(dst?.reg)
      // Identifiers are validated against SAFE_IDENT above, so quoting them
      // into DDL is safe. The whole copy runs in one transaction because these
      // used to be separate autocommit statements — each query() checks out and
      // releases its own connection, so a timeout landing between the CREATE
      // and the INSERT left behind exactly the empty table the guard above now
      // has to clean up after.
      await withTransaction(async (q) => {
        if (dstExists) {
          const seeded = await q<{ one: number }>(
            `SELECT 1 AS one FROM "${schemaName}"."${table}" LIMIT 1`,
          )
          if (seeded.length) return // tenant's own rows — leave them alone
          // An empty destination is dropped and rebuilt rather than filled in
          // place: the shared table has grown columns through ALTER TABLE ADD
          // COLUMN over the years, so its physical column order no longer
          // matches the one a fresh CREATE TABLE produces, and `SELECT *`
          // copies positionally. Recreating with LIKE below restores that
          // guarantee. The DROP is inside the transaction, so a failure any
          // time after it rolls the table back into place.
          await q(`DROP TABLE IF EXISTS "${schemaName}"."${table}"`)
        }
        // LIKE INCLUDING ALL carries defaults, constraints and indexes.
        await q(`CREATE TABLE "${schemaName}"."${table}" (LIKE "${DEFAULT_SCHEMA}"."${table}" INCLUDING ALL)`)
        await q(`INSERT INTO "${schemaName}"."${table}" SELECT * FROM "${DEFAULT_SCHEMA}"."${table}"`)
      })
    }
  })
}
