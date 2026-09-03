/**
 * PHASE 5 OF THE ACCOUNT FOUNDATION — one account, and it can OPEN the door.
 *
 * The failure this phase exists for, in the owner's words: "i can login to the
 * terminal but i cant see the things built for the business account and cant
 * login to it and we cant offer 2 accounts". Every earlier phase made the
 * business site RECOGNISE the Terminal identity; none of them let that
 * identity into the workspace it owns, because the only route to a workspace
 * ran through a signup form that asks for a second password.
 *
 * This suite pins the security boundary of the fix, because the fix hands out
 * a credential. Six rules, and every one of them is a way the door could be
 * left open:
 *
 *   1. Ownership is checked against saas_tenants.owner_email, and a NULL
 *      owner matches NOBODY. Tenants predate that column; treating null as
 *      "unclaimed" would hand a stranger a live brokerage.
 *   2. A suspended workspace does not open.
 *   3. Every refusal is `not_found` — never a message that separates "does
 *      not exist" from "not yours", which would turn the endpoint into a
 *      directory of who runs what.
 *   4. The claim URL travels in a REDIRECT. It carries a signed token; a
 *      response body or a log line is a place it must never appear.
 *   5. The owner row is written with NO password hash. That is what "one
 *      account" means — there is no second password, so there is nothing to
 *      guess at the tenant's own sign-in form.
 *   6. Freehold's session is untouched. `fh_session` is a live client's
 *      cookie; this module reads a Neon session and mints a claim token, and
 *      it must never reach for the client's.
 *
 * Pure — reads source. Runs in `pnpm guards`.
 */
import fs from 'node:fs'
import path from 'node:path'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
/** Comments explain the rules; only real code may satisfy them. */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const MODULE = 'lib/tenancy/account-workspace.ts'
const ROUTE = 'app/api/account/workspace/enter/route.ts'
const ACTIONS = 'app/business/account/actions.ts'
const PAGE = 'app/business/account/page.tsx'

console.log('\n── ownership is proved, and an unknown owner proves nothing ──')
{
  const mod = stripComments(read(MODULE))

  check(
    'entry compares the session email to the tenant\'s owner_email',
    /owner\s*!==\s*email/.test(mod) || /owner\s*===\s*email/.test(mod),
    'no comparison of tenant owner against the session email',
  )
  check(
    'an empty/unknown owner is refused explicitly, not by falling through a comparison',
    /if\s*\(\s*!owner\s*\|\|/.test(mod),
    'no `if (!owner || …)` guard — a null owner must lose on its own line',
  )
  check(
    'the owner is lowercased on both sides before comparing',
    (mod.match(/\.trim\(\)\.toLowerCase\(\)/g) ?? []).length >= 3,
  )
  check('a suspended workspace does not open', /status\s*===\s*'suspended'/.test(mod))
  check(
    'the email must look like an email before it is used as a key',
    mod.includes("includes('@')"),
  )
}

console.log('\n── every refusal says the same thing ──')
{
  const mod = stripComments(read(MODULE))
  const reasons = mod.match(/reason:\s*'([a-z_]+)'/g) ?? []
  const enterReasons = reasons.filter((r) => r.includes('not_found'))
  check(
    'enterWorkspace returns only `not_found`',
    enterReasons.length >= 3,
    `refusal reasons found: ${reasons.join(', ') || 'none'}`,
  )
  check(
    'no refusal distinguishes "not yours" from "does not exist"',
    !/not_yours|forbidden|not_owner|403/.test(mod),
  )

  const route = stripComments(read(ROUTE))
  check(
    'the route collapses every failure to the same redirect flag',
    (route.match(/workspace',\s*'not_found'/g) ?? []).length >= 2,
  )
}

console.log('\n── the claim URL is a credential: redirect only ──')
{
  const route = stripComments(read(ROUTE))
  check('success is a redirect to the claim URL', route.includes('NextResponse.redirect(result.claimUrl)'))
  check(
    'the claim URL is never put in a JSON body',
    !/NextResponse\.json[\s\S]*claimUrl/.test(route),
  )
  check(
    'the claim URL is never logged',
    !/console\.[a-z]+\([^)]*claimUrl/.test(route) && !/console\.[a-z]+\([^)]*claimUrl/.test(stripComments(read(ACTIONS))),
  )
  check('the handler authenticates itself with the shared Neon session', route.includes('getTerminalUser'))
  check('and fails closed when there is none', /if\s*\(\s*!user\s*\)/.test(route))
  check('subdomain enumeration has a ceiling', route.includes('checkRateLimit'))

  const proxy = read('proxy.ts')
  check('the wall lets it authenticate itself, like /api/account/summary',
    proxy.includes('"/api/account/workspace/enter"'))
}

console.log('\n── one account means no second password ──')
{
  const mod = stripComments(read(MODULE))
  check(
    'the workspace owner is created with a null password hash',
    /password_hash:\s*null/.test(mod),
    'the owner row must carry no password — the Neon session is the only door',
  )
  check(
    'this module never hashes a password',
    !mod.includes('hashPassword'),
  )
  check(
    'and never asks for one',
    !/password:\s*(input|String|body)/.test(mod),
  )
  const actions = stripComments(read(ACTIONS))
  check(
    'the create form collects no password field',
    !/get\('password'\)|get\("password"\)/.test(actions),
  )
  const page = read(PAGE)
  check(
    'and the form on the page has no password input',
    !/name="password"/.test(page),
  )
}

console.log('\n── the client\'s session is not touched ──')
{
  const mod = read(MODULE)
  const route = read(ROUTE)
  check(
    'account-workspace never reads or writes fh_session',
    !stripComments(mod).includes('fh_session') && !stripComments(mod).includes('SESSION_COOKIE'),
  )
  check(
    'the enter route sets no cookie of its own',
    !/cookies\.set/.test(stripComments(route)),
    'the tenant host\'s claim endpoint is the only place a workspace cookie is minted',
  )
  check(
    'the token is minted with the platform\'s existing signSession, not a new scheme',
    stripComments(mod).includes('signSession') && stripComments(mod).includes('CLAIM_TOKEN_TTL_MS'),
  )
}

console.log('\n── the account page can actually reach it ──')
{
  const page = read(PAGE)
  check('the page lists the workspaces this account owns', page.includes('workspacesForAccount'))
  check('each row links at the enter route', page.includes('/api/account/workspace/enter?sub='))
  check('the create form posts to the server action', page.includes('action={createWorkspace}'))
  check('the block is dormant when tenancy is off', page.includes('SAAS_TENANCY ?'))
  check(
    'the banned word never appears on this surface',
    !/\bfree\b/i.test(page.replace(/freehold/gi, '')),
    'the included layer is NAMED, never sold as the banned word',
  )
}

console.log('\n── the foundation doc records the phase ──')
{
  const foundation = read('docs/ACCOUNT-FOUNDATION.md')
  check(
    'phase 5 names the module that delivers it',
    foundation.includes('lib/tenancy/account-workspace.ts'),
  )
}

if (failures > 0) {
  console.error(`\n${failures} account-workspace rule(s) broken.`)
  process.exit(1)
}
console.log('\nOne account, one password, and the workspace opens with it.\n')
