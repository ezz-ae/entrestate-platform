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
import { execSync } from 'node:child_process'
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
    /catch[\s\S]{0,800}ok: false, reason: 'unreadable'/.test(src))
  check('the populated check looks at tables that only fill in a real system',
    /freehold_site_leads[\s\S]{0,80}freehold_site_users[\s\S]{0,80}freehold_site_projects/.test(src))
  check('the owner variable is server-side only (a browser has no business reading it)',
    !/NEXT_PUBLIC_DB_OWNER/.test(src))
}

console.log('\n── and the lock is actually turned ──')
{
  // This module decided the question correctly from the day it was written and
  // nothing ever asked it. Every assertion below exists because "the code is
  // there" was, for a while, the whole of the separation.
  const db = readFileSync(join(process.cwd(), 'lib/db.ts'), 'utf8')
  const owner = readFileSync(join(process.cwd(), 'lib/tenancy/db-owner.ts'), 'utf8')

  check('lib/db.ts asks the question at all', /assertDatabaseIsOurs/.test(db))

  // acquireClient is the single door every read and write goes through, so the
  // gate belongs there and nowhere shallower.
  const acquire = db.slice(db.indexOf('async function acquireClient'))
  const gateAt = acquire.indexOf('await assertDatabaseIsOurs()')
  const connectAt = acquire.indexOf('getPool().connect()')
  check('the gate is inside acquireClient', gateAt > -1)
  check('…and runs before a connection is used', gateAt > -1 && connectAt > gateAt,
    `gate@${gateAt} connect@${connectAt}`)

  check('an undeclared deployment is untouched — no query, no cost',
    /if \(!DB_OWNER_DECLARED\) return/.test(db))
  check('the owner variable is read server-side only', !/NEXT_PUBLIC_DB_OWNER/.test(db))

  // A momentary outage must not become a permanent refusal now that every
  // connection depends on this answer.
  check('a failed gate is forgotten so the next connection retries',
    /ownerGate\.catch\(\(\) => \{ ownerGate = null \}\)/.test(db))
  check('an unreadable verdict is not cached',
    !/cached = \{[\s\S]{0,120}'unreadable'/.test(owner))

  // Asking the question through the ordinary door would ask it in order to
  // answer it.
  check('the check reads through unguardedQuery', /unguardedQuery/.test(owner))
  check('…and never through the gated query()', !/\bawait query[<(]/.test(owner))
  check('unguardedQuery runs in the default schema, not a tenant\'s',
    /unguardedQuery[\s\S]{0,400}rawQuery<T>\(DEFAULT_SCHEMA/.test(db))
}

console.log('\n── nothing else may use the ungated door ──')
{
  // One caller is a documented exception; two is a hole.
  // This file is excluded: naming the door in order to guard it is not using it.
  const out = execSync(
    "grep -rln 'unguardedQuery' --include='*.ts' --include='*.tsx' app lib scripts components || true",
    { encoding: 'utf8' },
  ).trim()
  const files = (out ? out.split('\n') : [])
    .filter(Boolean)
    .filter((f) => f !== 'scripts/db-owner-test.ts')
    .sort()
  check('only lib/db.ts and the owner check name it',
    files.join(',') === 'lib/db.ts,lib/tenancy/db-owner.ts', files.join(','))
}

if (failures) { console.error(`\n${failures} db-owner guard(s) broken.`); process.exit(1) }
console.log('\nA database with somebody else’s rows in it is somebody else’s database.\n')
