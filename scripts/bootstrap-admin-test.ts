/**
 * THE FIRST-ADMIN DOOR CLOSES BEHIND ITSELF — locked.
 *
 * /api/auth/bootstrap-admin mints the first admin on a fresh deployment. Two
 * documents promised for a year that it "disables itself once an admin exists"
 * (docs/route-auth-matrix.md, DEPLOYMENT.md §5.1). The code never checked, and
 * the upsert behind it is:
 *
 *   ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role,
 *                                     password_hash = COALESCE(EXCLUDED..., ...)
 *
 * so a POST carrying an EXISTING owner's email replaced their password and set
 * their role to admin. Anyone holding CRM_ADMIN_SETUP_KEY — a long-lived
 * environment variable, not a one-time secret — could take over the owner's
 * account. Losing a password is what /api/auth/request-reset is for.
 *
 * The gate must also FAIL CLOSED. query() returns [] when no connection string
 * is configured (the build-time fallback), so a naive count reads "no admins"
 * on an unconfigured database and waves the bootstrap through — the exact
 * ambiguity of "an unreachable database and an empty one were the same value to
 * every caller". adminExists() calls assertDatabaseConfigured() first.
 *
 * Asserted by reading the source: this guard must not need a database.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const route = readFileSync(join(process.cwd(), 'app/api/auth/bootstrap-admin/route.ts'), 'utf8')
const auth = readFileSync(join(process.cwd(), 'lib/auth.ts'), 'utf8')

console.log('\n── the bootstrap refuses once an admin exists ──')
{
  check('the route imports adminExists', /import[\s\S]*?\badminExists\b[\s\S]*?from "@\/lib\/auth"/.test(route))
  check('the route awaits adminExists()', /await\s+adminExists\s*\(\s*\)/.test(route))
  check('it refuses with 409 (a conflict, not a bad request)', /status:\s*409/.test(route))

  // Order is the whole point: the check must happen BEFORE the upsert that
  // would rewrite an existing user's password.
  const iCheck = route.search(/await\s+adminExists\s*\(\s*\)/)
  const iUpsert = route.search(/upsertUserProfile\s*\(/)
  check('the check runs BEFORE the upsert that could rewrite a password',
    iCheck > -1 && iUpsert > -1 && iCheck < iUpsert, `check@${iCheck} upsert@${iUpsert}`)

  // The setup key is still required — the new gate adds to it, never replaces it.
  check('the setup key is still required', /setupKey\s*!==\s*expectedKey/.test(route))
  check('a missing setup key still disables the endpoint', /Admin bootstrap is disabled/.test(route))
}

console.log('\n── the gate fails closed on a database it cannot read ──')
{
  const fn = auth.slice(auth.indexOf('export async function adminExists'))
  check('adminExists exists in lib/auth.ts', fn.startsWith('export async function adminExists'))
  const body = fn.slice(0, fn.indexOf('\n}') + 2)
  check('it asserts the database is configured before reading',
    /assertDatabaseConfigured\s*\(/.test(body))
  check('the assert comes before the query (or [] would read as "no admins")',
    body.indexOf('assertDatabaseConfigured') < body.indexOf('query<'), body.replace(/\s+/g, ' ').slice(0, 120))
  check("it looks for role = 'admin'", /role\s*=\s*'admin'/.test(body))
  check('lib/auth.ts imports assertDatabaseConfigured',
    /import[\s\S]*?\bassertDatabaseConfigured\b[\s\S]*?from "@\/lib\/db"/.test(auth))
}

console.log('\n── the documents and the code now say the same thing ──')
{
  const matrix = readFileSync(join(process.cwd(), 'docs/route-auth-matrix.md'), 'utf8')
  check('route-auth-matrix still documents the refusal', /bootstrap-admin[\s\S]{0,200}refuse if admin exists/.test(matrix))
}

if (failures) { console.error(`\n${failures} bootstrap-admin guard(s) broken.`); process.exit(1) }
console.log('\nThe first-admin door opens once, and a setup key can no longer take an owner’s account.\n')
