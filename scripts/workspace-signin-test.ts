/**
 * SIGNING IN FROM THE VENDOR HOST — locked.
 *
 * THE DEFECT. entrestate.com's header links to /server
 * (components/business/shell.tsx). That endpoint called authenticateFromDB,
 * which reads `freehold_site_users` under the AMBIENT search_path — on the
 * apex, the shared schema. A customer's password does not live there: it is
 * written into their TENANT schema by lib/tenancy/onboard.ts, while the
 * identity app/api/wl/claim/route.ts creates in the shared schema deliberately
 * carries NO password_hash, and verifyPassword returns false on a null hash
 * (lib/freehold/auth-db.ts:20-21).
 *
 * So a paying customer typing correct credentials on the marketing site was
 * told "Incorrect email or password" — and nothing on the page could say which
 * host to try instead, because no table recorded who owned a workspace. It
 * failed closed, which is why it was invisible: no error, no log, no alert.
 * Just a customer who could not get in.
 *
 * WHAT IS ASSERTED HERE, and why each one is a rule rather than a preference:
 *
 *  1. The cross-tenant search NEVER runs on a tenant host. On {a}.host it
 *     would authenticate an email against tenant B's schema — the exact
 *     boundary proxy.ts:150 and :241 exist to hold. The host check must sit
 *     BEFORE the search, not inside it.
 *  2. An empty or malformed email matches nothing. createTenant stores an
 *     absent owner as NULL rather than '', and the lookup refuses a blank —
 *     either alone would do, and both are cheap.
 *  3. Every failure says the same sentence. A different message for "no such
 *     workspace" turns sign-in into a way to ask whether somebody is a
 *     customer.
 *  4. Success on the vendor host does NOT set a session cookie. A cookie set
 *     there belongs to the vendor host; the workspace needs a host-only one on
 *     the customer's subdomain. The handoff token is what crosses.
 *  5. The handoff is short-lived and names ONE tenant, so it carries no
 *     authority anywhere else.
 *
 * Pure — reads source text, no database, no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const login = read('app/api/server/login/route.ts')
const store = read('lib/tenancy/store.ts')
// The password sign-up path was removed on 2026-09-04; the owner is now
// written by createWorkspaceForAccount() from a verified Neon session.
const onboard = read('lib/tenancy/account-workspace.ts')
const client = read('lib/freehold/session.ts')
const page = read('app/server/page.tsx')

console.log('\n── the workspace an email opens is recorded at all ──')
{
  check('saas_tenants carries an owner_email column',
    /owner_email\s+text/.test(store) && /ADD COLUMN IF NOT EXISTS owner_email/.test(store))
  check('…and workspace creation writes it, from the proved session email', /ownerEmail: email/.test(onboard) && /provedEmail\(input\.user\)/.test(onboard))
  check('…and it is selected back out', /SELECT_COLS = `[^`]*owner_email/.test(store))
  // Nullable on purpose: tenants created before the column existed have no
  // owner and no honest way to invent one.
  check('the column is nullable — an unknown owner is not an invented one',
    !/owner_email\s+text\s+NOT NULL/.test(store))
  check('an absent owner is stored as NULL, never as an empty string',
    /\.trim\(\)\.toLowerCase\(\) \|\| null/.test(store))
}

console.log('\n── the lookup cannot be made to match everything ──')
{
  // Sliced to the NEXT export, not to end-of-file: a window that runs past the
  // function can satisfy a check against a later function's code, which is a
  // guard that passes for the wrong reason.
  const start = store.indexOf('export async function tenantsOwnedByEmail')
  const fn = start < 0 ? '' : store.slice(start, store.indexOf('\nexport ', start + 10))
  check('tenantsOwnedByEmail exists', fn.length > 0)
  check('a blank or address-less email returns nothing before any query runs',
    /if \(!email \|\| !email\.includes\('@'\)\) return \[\]/.test(fn))
  check('the lookup lowercases both sides', /lower\(owner_email\) = \$1/.test(fn) && /toLowerCase\(\)/.test(fn))
  check('a suspended workspace is not offered', /status <> 'suspended'/.test(fn))
  // Fails CLOSED, unlike the brand lookup below it which serves stale data
  // rather than take a live site down. This one decides who gets signed in.
  check('an unreadable control plane returns no workspaces, not a guess',
    /catch \(err\) \{[\s\S]*?return \[\]/.test(fn) && !/catch \(err\) \{[\s\S]*?return rows/.test(fn))
  check('it returns a LIST — one person can own two brokerages',
    /Promise<SaasTenant\[\]>/.test(fn))
}

console.log('\n── the cross-tenant search never runs on a tenant host ──')
{
  const hostIdx = login.indexOf('const hostTenant = tenantSubdomainFromHost')
  const searchIdx = login.indexOf('findWorkspaceSignIn(email, password, req)')
  check('the host is resolved before the search is reached',
    hostIdx > 0 && searchIdx > hostIdx, `host@${hostIdx} search@${searchIdx}`)
  check('the search is gated on there being NO tenant host',
    /if \(!hostTenant && SAAS_TENANCY\) \{[\s\S]{0,200}?findWorkspaceSignIn/.test(login))
  // The single most important line in the file. On a tenant host this must be
  // unreachable, or one tenant's host authenticates against another's schema.
  check('there is exactly one call site for the search',
    (login.match(/findWorkspaceSignIn\(/g) ?? []).length === 2, // declaration + call
    String((login.match(/findWorkspaceSignIn\(/g) ?? []).length))
}

console.log('\n── the password is checked inside the workspace, every time ──')
{
  const fn = login.slice(login.indexOf('async function findWorkspaceSignIn'))
  check('each candidate is authenticated INSIDE its own schema',
    /runWithSchema\(tenant\.schemaName, \(\) => authenticateFromDB\(email, password\)\)/.test(fn))
  check('a tenant that fails is skipped, not trusted', /if \(!inside\) continue/.test(fn))
  check('one unreachable schema does not deny the others',
    /\.catch\(\(\) => null\)/.test(fn))
  // No password, no redirect. The whole no-enumeration property rests here.
  const redirectIdx = fn.indexOf('return `${proto}')
  const authIdx = fn.indexOf('runWithSchema')
  check('nothing is returned before a password has verified',
    authIdx > 0 && redirectIdx > authIdx, `auth@${authIdx} redirect@${redirectIdx}`)
}

console.log('\n── an attacker learns nothing from trying ──')
{
  const messages = [...login.matchAll(/error: '([^']+)'/g)].map((m) => m[1])
  const creds = messages.filter((m) => /password|email/i.test(m))
  check('every credential failure says the same sentence',
    new Set(creds).size <= 1, creds.join(' | '))
  check('…and it is the generic one',
    creds.every((m) => m === 'Incorrect email or password'), creds.join(' | '))
  // A 404 for "no such workspace" and a 401 for "wrong password" would answer
  // the question the sentence refuses to.
  check('no status distinguishes a missing workspace from a wrong password',
    !/status: 404/.test(login), 'a 404 appeared in the sign-in path')
}

console.log('\n── the handoff carries no authority of its own ──')
{
  const fn = login.slice(login.indexOf('async function findWorkspaceSignIn'))
  check('the handoff token is short-lived',
    /HANDOFF_TTL_MS = 2 \* 60 \* 1000/.test(login))
  check('…and names exactly one tenant',
    /signSession\(\{ \.\.\.inside, tenant: tenant\.subdomain \}, HANDOFF_TTL_MS\)/.test(fn))
  // THE ONE THAT MATTERS. A Set-Cookie here would be a vendor-host cookie
  // pretending to be a workspace session, and the proxy fence would reject it
  // on the host it is actually for.
  check('no cookie is set on the vendor-host success path',
    !/cookies\.set/.test(fn), 'a cookie is set inside the handoff path')
  check('it hands off to the claim route signup already uses',
    /\/api\/wl\/claim\?token=/.test(fn))
}

console.log('\n── the client actually follows it ──')
{
  // A handoff the caller reads as a failure ships this whole fix invisibly:
  // the endpoint does the right thing and the page still says "incorrect".
  const lstart = client.indexOf('export async function login')
  const loginFn = lstart < 0 ? '' : client.slice(lstart, client.indexOf('\nexport ', lstart + 10))
  check('login() distinguishes a handoff from a rejection',
    /kind: 'handoff'/.test(loginFn) && /kind: 'rejected'/.test(loginFn))
  // The order matters: the redirect must be read BEFORE the user, and a body
  // carrying neither must fall to rejected rather than to an undefined user
  // the caller then treats as success.
  const redirectAt = loginFn.indexOf("data.redirect")
  const userAt = loginFn.indexOf('if (data.user)')
  const rejectAt = loginFn.lastIndexOf("kind: 'rejected'")
  check('a 200 naming neither a user nor a redirect is REJECTED, not assumed',
    redirectAt > 0 && userAt > redirectAt && rejectAt > userAt,
    `redirect@${redirectAt} user@${userAt} reject@${rejectAt}`)
  check('the sign-in page navigates on a handoff',
    /result\.kind === 'handoff'/.test(page) && /window\.location\.href = result\.redirect/.test(page))
  // router.replace would keep the vendor origin and never reach their host.
  check('…with a full navigation, because it crosses an origin',
    !/router\.replace\(result\.redirect\)/.test(page))
}

if (failures > 0) {
  console.error(`\n${failures} workspace sign-in rule(s) broken.`)
  process.exit(1)
}
console.log('\nA customer with correct credentials reaches their workspace, and nobody else learns it exists.\n')
