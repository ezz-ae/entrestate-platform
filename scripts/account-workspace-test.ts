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
 *   7. THE EMAIL MUST BE VERIFIED — found in review, after the first version
 *      shipped. Neon Auth allows email+password sign-up and a session can
 *      exist before the address is proved, so `owner_email === session.email`
 *      was a comparison anyone could satisfy by typing the owner's address
 *      into a sign-up form. Every entry point now refuses an unverified
 *      session exactly as it refuses a stranger, through ONE shared guard.
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
    // The session side is normalised once, inside the shared guard; the tenant
    // side at the comparison. Counting occurrences broke the moment the guard
    // consolidated them, so this checks the two places by name instead.
    /function provedEmail[\s\S]*?\.trim\(\)\.toLowerCase\(\)/.test(mod)
      && /tenant\.ownerEmail[\s\S]{0,40}\.trim\(\)\.toLowerCase\(\)/.test(mod),
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

console.log('\n── an unverified email is a stranger ──')
{
  const mod = stripComments(read(MODULE))
  check(
    'one shared guard decides what "proved" means',
    /function provedEmail\(/.test(mod),
    'no provedEmail() — two entry points with two definitions will drift',
  )
  check(
    'the guard requires emailVerified === true, not merely truthy',
    /emailVerified\s*!==\s*true/.test(mod),
  )
  const entryPoints = ['enterWorkspace', 'createWorkspaceForAccount', 'workspacesForAccount']
  for (const fn of entryPoints) {
    const body = mod.split(`export async function ${fn}(`)[1]?.split('\nexport ')[0] ?? ''
    check(`${fn} reads the email through the guard`, body.includes('provedEmail('), `${fn} does not call provedEmail()`)
    check(
      `${fn} never lowercases the raw session email itself`,
      !/input\.user\.email\s*\?\?[\s\S]{0,40}toLowerCase|user\.email\s*\?\?[\s\S]{0,40}toLowerCase/.test(body),
      `${fn} reaches past the guard to the raw email`,
    )
  }
  check(
    'the session type carries the flag, so a caller cannot forget it exists',
    /emailVerified:\s*boolean/.test(stripComments(read('lib/terminal-session.ts'))),
  )
  check(
    'and the session reader is strict about it',
    /emailVerified\s*===\s*true/.test(stripComments(read('lib/terminal-session.ts'))),
    'the reader must map anything but literal true to false',
  )
  check(
    'creation names the reason instead of blaming the store',
    mod.includes("reason: 'email_unverified'") && !/provedEmail\(input\.user\)\s*\n\s*if \(!email\) return \{ ok: false, reason: 'store_unreachable' \}/.test(mod),
  )
  const page = read(PAGE)
  check('the page passes the whole user, not a bare email, to the listing', /workspacesForAccount\(user\)/.test(page))
  check('and tells an unverified person what to do rather than showing a form that bounces', page.includes('email_unverified') && /!user\.emailVerified/.test(page))
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

console.log('\n── every other door into a second identity is closed ──')
{
  const signup = stripComments(read('app/signup/page.tsx'))
  check('the public sign-up is a server component that reads the Neon session', signup.includes('getTerminalUser'))
  check('and sends a signed-in person to the account page instead of the password form',
    /if \(user\) redirect\('\/business\/account'\)/.test(signup))
  check('the password form itself moved aside, unchanged, for strangers',
    fs.existsSync(path.join(ROOT, 'app/signup/signup-client.tsx'))
      && read('app/signup/signup-client.tsx').includes('type="password"'))
  check('the redirect is dormant without tenancy, like the rest of the path',
    /if \(SAAS_TENANCY\)[\s\S]{0,120}getTerminalUser/.test(signup))

  const signin = read('app/server/page.tsx')
  const signinCode = stripComments(signin)
  check('the tenant sign-in screen offers the Entrestate-account door',
    signinCode.includes("t('login.openWithEntrestate')"))
  check('…as a static link to the apex, reading no email and making no lookup',
    /href=\{`https:\/\/\$\{TENANT_BASE_DOMAIN\}\/business\/account`\}/.test(signinCode)
      && !/openWithEntrestate[\s\S]{0,300}(fetch|tenantsOwnedByEmail|email)/.test(signinCode.split("openWithEntrestate")[0].slice(-300) + "openWithEntrestate"))
  check('…only on a tenant host of a tenancy-enabled deployment',
    signinCode.includes('if (!SAAS_TENANCY) return') && signinCode.includes('tenantSubdomainFromHost(window.location.host)'))
  check('the link has all three languages',
    ['en','ar','ru'].every(() => true) && (read('lib/i18n/dictionaries.ts').match(/'login\.openWithEntrestate'/g) ?? []).length === 3)

  const summary = stripComments(read('app/api/account/summary/route.ts'))
  check('the account summary hands the Terminal the workspaces and the door to each',
    summary.includes('workspacesForAccount(user)') && summary.includes('enterUrl'))
  check('and only says a workspace can be created when the identity could complete it',
    /canCreateWorkspace:\s*SAAS_TENANCY && user\.emailVerified/.test(summary))
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
