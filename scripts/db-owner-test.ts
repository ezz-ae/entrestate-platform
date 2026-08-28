/**
 * A FORK NEVER ADOPTS THE CLIENT'S LIVE DATABASE — locked.
 *
 * This repository is a fork of a client's deployment and carries every one of
 * its table names, because the two products are the same software. So the only
 * thing separating "our data" from "their live business" is which connection
 * string an environment variable holds — one careless paste from being wrong.
 *
 * That paste is not a hypothetical cost. The client's database is running more
 * than ten live campaigns; leads arrive in it today, real money bought them,
 * and a fork writing there would be writing into somebody's revenue.
 *
 * THE RULE: we never write a marker into a database that already has data.
 * Adopting an unclaimed-but-populated database IS the mistake — the client's
 * predates the marker, so it has full tables and no owner row, and claiming it
 * would be the fork shrugging and taking over. Only a database that is both
 * unmarked AND empty may be claimed.
 *
 * decideOwner() is split out pure precisely so this runs with no database.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { decideOwner } from '../lib/tenancy/db-owner'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

console.log('\n── the paste this exists to stop ──')
{
  // entrestate pointed at the client's live database: full tables, no marker.
  const v = decideOwner({ declared: 'entrestate', marker: null, populated: true })
  check('a populated, unclaimed database is REFUSED', !v.ok && v.reason === 'populated', v.reason)
  check('…and the refusal explains itself in plain words',
    !v.ok && /live campaigns/.test(v.detail))
  check('…and nothing about it reads as "claim it"', !v.ok)

  // The same database once it has been marked by its real owner.
  const owned = decideOwner({ declared: 'entrestate', marker: 'freehold', populated: true })
  check('a database owned by somebody else is REFUSED', !owned.ok && owned.reason === 'mismatch')
  check('…and names who it found', !owned.ok && owned.found === 'freehold',
    owned.ok ? 'allowed' : String(owned.found))
}

console.log('\n── the only database we may adopt is a fresh one ──')
{
  const fresh = decideOwner({ declared: 'entrestate', marker: null, populated: false })
  check('unmarked AND empty is claimed', fresh.ok && fresh.reason === 'claimed', fresh.reason)
  const mine = decideOwner({ declared: 'entrestate', marker: 'entrestate', populated: true })
  check('our own database keeps working once it fills up', mine.ok && mine.reason === 'matches')
}

console.log('\n── it is dormant until a deployment declares itself ──')
{
  // Same convention as NEXT_PUBLIC_TENANT_BASE_DOMAIN: an existing deployment
  // that has not set the variable behaves exactly as it did before.
  for (const [marker, populated] of [[null, true], ['freehold', true], [null, false]] as const) {
    const v = decideOwner({ declared: '', marker, populated })
    check(`no declaration → dormant (marker=${marker}, populated=${populated})`,
      v.ok && v.reason === 'dormant', v.reason)
  }
}

console.log('\n── the module cannot write its way into someone else’s data ──')
{
  const src = readFileSync(join(process.cwd(), 'lib/tenancy/db-owner.ts'), 'utf8')
  // The claim INSERT must be reachable only from the 'claimed' verdict.
  check('the marker is written only after a claimed verdict',
    /verdict\.ok && verdict\.reason === 'claimed'[\s\S]{0,200}INSERT INTO/.test(src))
  check('there is exactly one INSERT in the module',
    (src.match(/INSERT INTO/g) ?? []).length === 1)
  check('it never updates or deletes anything', !/\bUPDATE\b|\bDELETE\b|\bDROP\b/.test(src))
  check('an unreadable database fails closed rather than open',
    /catch[\s\S]{0,200}ok: false, reason: 'unreadable'/.test(src))
  check('the populated check looks at tables that only fill in a real system',
    /freehold_site_leads[\s\S]{0,80}freehold_site_users[\s\S]{0,80}freehold_site_projects/.test(src))
  check('the owner variable is server-side only (a browser has no business reading it)',
    !/NEXT_PUBLIC_DB_OWNER/.test(src))
}

if (failures) { console.error(`\n${failures} db-owner guard(s) broken.`); process.exit(1) }
console.log('\nA database with somebody else’s rows in it is somebody else’s database.\n')
