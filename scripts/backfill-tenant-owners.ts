/**
 * BACKFILL saas_tenants.owner_email FOR WORKSPACES CREATED BEFORE IT EXISTED.
 *
 * The column records who signed up, so entrestate.com can find the workspace a
 * customer's credentials open (app/api/server/login/route.ts). New signups
 * write it; every tenant created before it existed carries NULL, and for those
 * customers the sign-in fix does nothing at all — the lookup finds no
 * workspace and they get the same refusal they got before.
 *
 * The owner is recoverable: lib/tenancy/onboard.ts writes them into the
 * tenant's own schema at role 'ceo' with the password hash. So this reads each
 * tenant's users table and copies that address up into the control plane.
 *
 * WHAT IT REFUSES TO GUESS:
 *  · A schema with NO ceo is left NULL. There is no second-best candidate — an
 *    admin or a director is somebody the owner hired, and writing their address
 *    here would let them sign in as the workspace from the vendor host.
 *  · A schema with MORE THAN ONE ceo is left NULL and reported. Two owners is a
 *    real state (a co-founded brokerage) and picking one silently decides
 *    something this script has no standing to decide.
 *  · A tenant that ALREADY has an owner_email is never touched, even if the
 *    schema disagrees. The stored value came from the signup form; this one is
 *    inferred.
 *
 * DRY RUN BY DEFAULT. It prints what it would write and changes nothing.
 * Pass --write to apply. Reads and writes only saas_tenants.owner_email and
 * only where it is currently NULL.
 *
 *   npx tsx scripts/backfill-tenant-owners.ts
 *   npx tsx scripts/backfill-tenant-owners.ts --write
 */
import { query, runWithDefaultSchema, runWithSchema, assertDatabaseConfigured } from '../lib/db'
import { ensureTenantStore } from '../lib/tenancy/store'

const WRITE = process.argv.includes('--write')

interface Row { id: string; subdomain: string; schema_name: string; owner_email: string | null }

async function main() {
  // WITHOUT THIS, the first run of this script printed "0 tenant(s) in the
  // control plane. Nothing to do." from a shell with no env — query() returns
  // an empty array when no database is configured (lib/db.ts), so a broken
  // connection and an empty table are the same value. "Nothing to do" is one
  // edit away from being a destructive conclusion.
  assertDatabaseConfigured('the tenant-owner backfill')
  // The column may not exist yet on a database that has not served a request
  // since it was added — ensure() carries the ALTER.
  await ensureTenantStore()

  const tenants = await runWithDefaultSchema(() =>
    query<Row>(`SELECT id, subdomain, schema_name, owner_email FROM saas_tenants ORDER BY created_at ASC`),
  )

  console.log(`\n${tenants.length} tenant(s) in the control plane.`)
  const missing = tenants.filter((t) => !t.owner_email)
  console.log(`${tenants.length - missing.length} already have an owner recorded; ${missing.length} do not.\n`)
  if (missing.length === 0) { console.log('Nothing to do.\n'); return }

  let resolved = 0
  let refused = 0

  for (const t of missing) {
    let owners: string[] = []
    try {
      owners = await runWithSchema(t.schema_name, async () => {
        const rows = await query<{ email: string }>(
          `SELECT email FROM freehold_site_users WHERE role = 'ceo' AND email IS NOT NULL ORDER BY email ASC`,
        )
        return rows.map((r) => r.email.trim().toLowerCase()).filter(Boolean)
      })
    } catch (err) {
      // An unreadable schema is reported, never skipped in silence: it is the
      // same symptom as a workspace whose provisioning half-failed.
      console.log(`  ?  ${t.subdomain.padEnd(24)} schema unreadable — ${err instanceof Error ? err.message : String(err)}`)
      refused++
      continue
    }

    const unique = [...new Set(owners)]
    if (unique.length === 0) {
      console.log(`  –  ${t.subdomain.padEnd(24)} no ceo in ${t.schema_name} — left NULL`)
      refused++
      continue
    }
    if (unique.length > 1) {
      console.log(`  !  ${t.subdomain.padEnd(24)} ${unique.length} ceos (${unique.join(', ')}) — left NULL, decide by hand`)
      refused++
      continue
    }

    const email = unique[0]
    console.log(`  ${WRITE ? '→' : '·'}  ${t.subdomain.padEnd(24)} ${email}`)
    if (WRITE) {
      await runWithDefaultSchema(() =>
        // The `IS NULL` in the predicate, not just in the selection above: two
        // runs racing must not have the second overwrite the first.
        query(`UPDATE saas_tenants SET owner_email = $2 WHERE id = $1 AND owner_email IS NULL`, [t.id, email]),
      )
    }
    resolved++
  }

  console.log(`\n${resolved} resolvable, ${refused} left NULL.`)
  console.log(WRITE ? 'Written.\n' : 'Dry run — nothing written. Pass --write to apply.\n')
}

main().catch((err) => { console.error(err); process.exit(1) })
