/**
 * ONE ACCOUNT, ONE DOOR — locked.
 *
 * The owner's ruling, twice: "مينفعش يكون في حسابين — حساب واحد ويترتب صح",
 * and then, after the first merge, "I still see you struggle to merge both
 * accounts, the server and the terminal." He was right. After the first
 * merge a workspace was BORN from the Entrestate account, but living in it
 * still took a second session that only a claim token minted on the apex
 * could start — three hops for the owner, and for a team member no way in at
 * all except a password on /server, which is the second account by another
 * name.
 *
 * This is the shape now, and this file keeps it:
 *
 *   · The Entrestate account (the Terminal's Neon session, cookie on
 *     .entrestate.com) is readable on every workspace host.
 *   · /api/wl/recognise turns it into the workspace session when the
 *     workspace lists the person — as owner (saas_tenants.owner_email) or on
 *     its team (freehold_site_users, NO password consulted).
 *   · proxy.ts sends every unauthenticated internal-page request on a tenant
 *     host to that door first, so the owner and the team never see a sign-in
 *     screen on their own workspace.
 *   · /server on a tenant host has no password form. It is the door's face:
 *     it asks the door itself, and shows the door's verdict when refused.
 *   · The apex and the client's deployment keep their password sign-in.
 *   · A team member is added on the Team page by email, with no password —
 *     a membership is a fact about the team, not a credential.
 *
 * Pure — reads source and runs the path sanitiser. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { safeRelativePath } from '../lib/tenancy/account-workspace'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

const MODULE = 'lib/tenancy/account-workspace.ts'
const DOOR = 'app/api/wl/recognise/route.ts'
const PROXY = 'proxy.ts'
const SIGNIN = 'app/server/page.tsx'
const AUTH_DB = 'lib/freehold/auth-db.ts'
const TEAM = 'app/api/freehold/team/route.ts'
const CLAIM = 'app/api/wl/claim/route.ts'

console.log('\n── recognition: owner first, then the team, and nothing else ──')
{
  const mod = stripComments(read(MODULE))
  const body = mod.split('export async function recogniseInWorkspace(')[1]?.split('\nexport ')[0] ?? ''
  check('recogniseInWorkspace exists and is the one place standing is decided', body.length > 0)
  check('it starts from the proved email — an unverified session is a stranger',
    /const email = provedEmail\(input\.user\)/.test(body) && /if \(!email\) return null/.test(body))
  check('a suspended workspace opens for nobody', /status === 'suspended'\) return null/.test(body))
  check('the owner match is positive and null-safe: `owner && owner === email`',
    /if \(owner && owner === email\)/.test(body))
  check('…and the owner gets the founder\'s standing', /role: 'ceo'/.test(body))
  check('the team is asked through memberSessionByEmail, in the tenant\'s own schema',
    /runWithSchema\(tenant\.schemaName, \(\) => memberSessionByEmail\(email\)\)/.test(body))
  check('a member carries the tenant claim, like the owner',
    /return \{ \.\.\.member, tenant: tenant\.subdomain \}/.test(body))
  check('no third source of standing — no password, no platform identity, no invite code',
    !/password|freehold_site_users|invite|verifyPassword|authenticateFromDB/.test(body))
  check('enterWorkspace is built on it, so the apex door and the host door agree',
    /export async function enterWorkspace[\s\S]{0,400}recogniseInWorkspace\(input\)/.test(mod))
}

console.log('\n── a membership is not a credential ──')
{
  const auth = stripComments(read(AUTH_DB))
  const member = auth.split('export async function memberSessionByEmail(')[1]?.split('\nexport ')[0] ?? ''
  check('memberSessionByEmail exists', member.length > 0)
  check('it never consults the password', !/verifyPassword|password/.test(member))
  check('suspended and banned still refuse', /suspended \|\| u\.banned\) return null/.test(member))
  check('it builds the session through the same builder as the password door',
    /return toSessionUser\(u\)/.test(member)
      && /export async function authenticateFromDB[\s\S]*?return toSessionUser\(u\)/.test(auth))
  check('the password door still checks the password',
    /export async function authenticateFromDB[\s\S]*?verifyPassword\(password, u\.password_hash\)/.test(auth))
  check('one SELECT for both doors', (auth.match(/FROM freehold_site_users/g) ?? []).length === 1)

  const team = stripComments(read(TEAM))
  check('the Team page adds a member with name, email and role — and no password',
    /upsertUserProfile\(\{ id: `user_\$\{randomUUID\(\)\}`, name, email, role \}\)/.test(team) && !/password/.test(team))
}

console.log('\n── the door on the host ──')
{
  const door = stripComments(read(DOOR))
  check('dormant without tenancy', /if \(!SAAS_TENANCY\) return new NextResponse\(null, \{ status: 404 \}\)/.test(door))
  check('only on a tenant host', /tenantSubdomainFromHost\(req\.headers\.get\('host'\)\)/.test(door) && /if \(!hostTenant\)/.test(door))
  check('identity comes from the Neon session and nowhere else',
    /getTerminalUser\(\)/.test(door) && !/password|searchParams\.get\('email'\)|body/.test(door))
  check('standing is decided by recogniseInWorkspace', /recogniseInWorkspace\(\{ subdomain: hostTenant, user \}\)/.test(door))
  check('three verdicts, each named, so the screen can answer instead of guessing',
    /refuse\('signed_out'\)/.test(door) && /refuse\('stranger'\)/.test(door) && /refuse\('slow_down'\)/.test(door))
  check('…carried as ?door= on /server', /searchParams\.set\('door', door\)/.test(door) && /signIn\.pathname = '\/server'/.test(door))
  check('rate-limited per identity', /checkRateLimit\(`ws-recognise:\$\{user\.id\}`/.test(door))
  check('the cookie is the workspace session: httpOnly, path=/, same TTL as the claim door',
    /httpOnly: true/.test(door) && /path: '\/'/.test(door) && /WORKSPACE_SESSION_TTL_MS/.test(door))
  check('the claim door shares that TTL', /WORKSPACE_SESSION_TTL_MS/.test(stripComments(read(CLAIM))))
  check('`next` passes through the sanitiser', /safeRelativePath\(req\.nextUrl\.searchParams\.get\('next'\)\)/.test(door))
  check('the redirect is built on this host\'s origin', /new URL\(next, req\.nextUrl\.origin\)/.test(door))
}

console.log('\n── the sanitiser keeps `next` on this host ──')
{
  check('a path is kept, query included', safeRelativePath('/freehold-intelligence/crm?tab=hot') === '/freehold-intelligence/crm?tab=hot')
  check('an absolute URL is refused', safeRelativePath('https://evil.example/') === null)
  check('a protocol-relative URL is refused', safeRelativePath('//evil.example/x') === null)
  check('the backslash trick is refused', safeRelativePath('/\\evil.example') === null)
  check('header-splitting characters are refused', safeRelativePath('/ok\r\nSet-Cookie: x') === null)
  check('empty and missing become null, never "/"', safeRelativePath('') === null && safeRelativePath(null) === null && safeRelativePath(undefined) === null)
  check('surrounding whitespace is trimmed', safeRelativePath('  /me ') === '/me')
}

console.log('\n── the wall sends people to the door, not to a form ──')
{
  const proxy = stripComments(read(PROXY))
  const gate = proxy.split('if (isInternalPage) {')[1]?.split('// ── Apex short landing slugs')[0] ?? ''
  check('the page gate resolves the tenant host once', /const hostTenant = tenantSubdomainFromHost\(hostname\)/.test(gate))
  check('without a session on a tenant host → /api/wl/recognise, carrying where they were going',
    /url\.pathname = '\/api\/wl\/recognise'/.test(gate) && /searchParams\.set\('next', `\$\{pathname\}\$\{request\.nextUrl\.search\}`\)/.test(gate))
  check('…never for the white-label demo, which keeps its activation gate', /if \(hostTenant && !WHITE_LABEL\)/.test(gate))
  check('elsewhere the previous rule stands (/activate or /server)', /WHITE_LABEL \? '\/activate' : '\/server'/.test(gate))
  check('a session fenced to another tenant takes the same road', /!== hostTenant\) return withoutSession\(\)/.test(gate))
  check('the API wall is untouched: no session is still a 401, never a redirect',
    /Authentication required\./.test(proxy) && !/api\/wl\/recognise[\s\S]{0,200}status: 401/.test(proxy))
}

console.log('\n── /server on a tenant host is the door\'s face ──')
{
  const page = stripComments(read(SIGNIN))
  check('the host is resolved to unknown | tenant | other, and nothing renders before it is known',
    /useState<'unknown' \| 'tenant' \| 'other'>\('unknown'\)/.test(page) && /host === 'tenant' \?/.test(page) && /host === 'other' \?/.test(page))
  check('a tenant host renders EntrestateDoor and no password input',
    /<EntrestateDoor door=\{door\} \/>/.test(page))
  const doorFace = page.split('function EntrestateDoor(')[1] ?? ''
  check('the door face has no password field and no email field', !/type=\{show|type="password"|type="email"|autoComplete/.test(doorFace))
  check('with no verdict yet it asks the door itself', /if \(door !== null\) return/.test(doorFace) && /window\.location\.replace\('\/api\/wl\/recognise'\)/.test(doorFace))
  check('the Continue button goes to the Terminal sign-in and comes back through the door',
    /https:\/\/terminal\.\$\{TENANT_BASE_DOMAIN\}\/login\?next=\$\{encodeURIComponent\(back\)\}/.test(doorFace)
      && /\/api\/wl\/recognise`/.test(doorFace))
  check('the stranger verdict is answered, not re-asked', /door === 'stranger'/.test(doorFace) && /t\('login\.strangerBody'\)/.test(doorFace))
  check('the slow-down verdict is answered', /t\('login\.slowDown'\)/.test(doorFace))
  check('the apex still has its password form for the vendor\'s own staff', /<form onSubmit=\{handleSubmit\}/.test(page))

  const dict = read('lib/i18n/dictionaries.ts')
  for (const key of ['doorChecking', 'doorTitle', 'doorBody', 'continueWithEntrestate', 'strangerTitle', 'strangerBody', 'tryAgain', 'useAnotherAccount', 'slowDown']) {
    check(`login.${key} exists in all three languages`, (dict.match(new RegExp(`'login\\.${key}'`, 'g')) ?? []).length === 3)
  }
  const doorCopy = [...dict.matchAll(/'login\.(door\w+|stranger\w+|continueWithEntrestate|slowDown)':\s*'([^']*)'/g)].map((m) => m[2]).join(' ')
  check('the door\'s copy never says the banned word', !/\bfree\b/i.test(doorCopy) && !/مجان/.test(doorCopy) && !/бесплат/i.test(doorCopy))
  check('the door\'s copy never asks for a password', !/password|كلمة المرور|парол/i.test(doorCopy))
}

if (failures > 0) {
  console.error(`\n${failures} one-door rule(s) broken.`)
  process.exit(1)
}
console.log('\nOne account. On every workspace host it is recognised, never re-asked.\n')
