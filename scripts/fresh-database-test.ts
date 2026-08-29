/**
 * THE PRODUCT RUNS ON AN EMPTY DATABASE — locked.
 *
 * Almost every table here provisions itself on first touch, which is what makes
 * "point the deployment at its own database and it works" true. Separating this
 * product from the client's live database produces exactly that: a fresh,
 * empty database. So the claim has to be true, and two tables made it false —
 * they arrived in the original deployment before the convention existed and had
 * simply always been there.
 *
 *   · freehold_comments_tasks — the comments route INSERTed into it unguarded.
 *     The first comment anyone left threw "relation does not exist".
 *   · freehold_site_area_profiles — the public route was guarded, and answered
 *     a 500 with source:'error'. An empty database is not an error, and a
 *     public endpoint that says it is teaches an operator to distrust a working
 *     deployment.
 *
 * A third is deliberately absent, and the guard asserts that too:
 * freehold_site_blog_posts already fails soft by design, and nothing in this
 * codebase writes a post, so creating it would add an empty relation nothing
 * could fill.
 *
 * Pure: source text. The shapes themselves were read from the live schema
 * rather than guessed — a column list invented from the SELECT that reads it is
 * how a "fix" produces a table the next INSERT rejects.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INHERITED_TABLES } from '../lib/freehold/ensure-inherited-tables'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const mod = readFileSync(join(process.cwd(), 'lib/freehold/ensure-inherited-tables.ts'), 'utf8')
const areas = readFileSync(join(process.cwd(), 'app/api/freehold/public/areas/route.ts'), 'utf8')
const comments = readFileSync(join(process.cwd(), 'app/api/freehold-intelligence/comments/route.ts'), 'utf8')
const data = readFileSync(join(process.cwd(), 'lib/data.ts'), 'utf8')

console.log('\n── every table this module claims, it creates ──')
{
  check('the list names the two that needed it', INHERITED_TABLES.length === 2)
  for (const t of INHERITED_TABLES) {
    check(`${t} has a CREATE TABLE IF NOT EXISTS`,
      new RegExp(`CREATE TABLE IF NOT EXISTS ${t}\\b`).test(mod))
  }
  check('every create is IF NOT EXISTS — this is a no-op on a database that has them',
    (mod.match(/CREATE TABLE/g) ?? []).length === (mod.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length)
  check('each runs behind ensureOnce, like the other hundred',
    (mod.match(/ensureOnce\(/g) ?? []).length === INHERITED_TABLES.length)
  check('it drops nothing and alters nothing', !/\bDROP\b|\bALTER\b|\bDELETE\b|\bTRUNCATE\b/.test(mod))
}

console.log('\n── the two failures it was written for ──')
{
  check('the comments route ensures before it inserts',
    comments.indexOf('ensureCommentsTasksTable()') > -1 &&
    comments.indexOf('ensureCommentsTasksTable()') < comments.indexOf('INSERT INTO freehold_comments_tasks'))
  check('the public areas route ensures before it selects',
    areas.indexOf('ensureAreaProfilesTable()') > -1 &&
    areas.indexOf('ensureAreaProfilesTable()') < areas.indexOf('FROM freehold_site_area_profiles'))
}

console.log('\n── the one deliberately left out ──')
{
  check('the blog table is NOT created here',
    !/freehold_site_blog_posts/.test(mod.replace(/\/\*\*[\s\S]*?\*\//g, '')),
    'it appears outside the header comment')
  check('…and the module says why', /nothing in this codebase writes a post/.test(mod))
  check('the blog reads still fail soft', /a missing table is "no posts", never a 500/.test(data))
  check('the stale claim that an editor creates it is gone',
    !/created lazily by the editor/.test(data))
}

if (failures) { console.error(`\n${failures} fresh-database guard(s) broken.`); process.exit(1) }
console.log('\nAn empty database is a new deployment, not a broken one.\n')
