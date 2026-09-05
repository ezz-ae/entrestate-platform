/**
 * THE VENDOR'S OWN DOOR — locked.
 *
 * 2026-09-05: /ctrl/coupons — the desk that mints the marketing system —
 * bounced its own owner to /server, where the roster read "No results":
 * the vendor's workspace (entrestate_app.freehold_site_users) had zero
 * people, so nobody could open the control plane or the finance screen
 * that approves ad credit. The tenants had the everyday door (the Neon
 * account, recognised); the vendor had a password nobody held.
 *
 * What this file keeps:
 *   · recogniseAtVendor decides standing on the vendor host: the
 *     VENDOR_STAFF_EMAILS allowlist (owner-level) or the vendor's own roster
 *     in the DEFAULT schema; a session with no `tenant`, so the proxy fences
 *     it to non-tenant hosts;
 *   · the door refuses an unproved email exactly as a tenant's does;
 *   · /api/wl/recognise asks the vendor's list on a non-tenant host;
 *   · the proxy sends an unauthenticated vendor-host page through the door;
 *   · /ctrl sends a stranger through the door, never to a password form;
 *   · /server on the vendor host shows the door ALONE when it has spoken;
 *     the password screen is one quiet line away, and an empty roster is
 *     never shown;
 *   · the allowlist is documented; no password is generated anywhere.
 *
 * Pure — no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { vendorStaffEmails } from '../lib/tenancy/account-workspace'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

console.log('\n── the allowlist ──')
{
  const set = vendorStaffEmails(' Owner@Example.com, ops@example.com ,, not-an-email ')
  check('emails are lowercased, trimmed, and only emails count', set.size === 2 && set.has('owner@example.com') && set.has('ops@example.com') && !set.has('not-an-email'))
  check('unset means nobody', vendorStaffEmails(undefined).size === 0 && vendorStaffEmails('').size === 0)
}

console.log('\n── standing on the vendor host ──')
{
  const mod = stripComments(read('lib/tenancy/account-workspace.ts'))
  const body = mod.split('export async function recogniseAtVendor(')[1]?.split('\nexport ')[0] ?? ''
  check('recogniseAtVendor exists', body.length > 0)
  check('it accepts only a PROVED email — the same rule as a tenant\'s door', /const email = provedEmail\(user\)/.test(body) && /if \(!email\) return null/.test(body))
  check('the allowlist grants owner standing', /vendorStaffEmails\(\)\.has\(email\)/.test(body) && /role: 'ceo'/.test(body))
  check('otherwise the vendor\'s own roster, in the DEFAULT schema', /runWithDefaultSchema\(\(\) => memberSessionByEmail\(email\)\)/.test(body))
  check('the session carries no tenant — the proxy fences it to the vendor\'s hosts', !/tenant:/.test(body))
  check('no password is read, generated or compared anywhere in the door', !/password/i.test(body))
}

console.log('\n── the door on the host ──')
{
  const door = stripComments(read('app/api/wl/recognise/route.ts'))
  check('a non-tenant host asks the vendor\'s list', /: await recogniseAtVendor\(user\)/.test(door))
  check('a tenant host still asks its workspace', /recogniseInWorkspace\(\{ subdomain: hostTenant, user \}\)/.test(door))
  check('the vendor host is no longer bounced to /server before asking', !/if \(!hostTenant\) return NextResponse\.redirect\(signIn\)/.test(door))
}

console.log('\n── the wall, the desk, the sign-in screen ──')
{
  const proxy = stripComments(read('proxy.ts'))
  const gate = proxy.split('if (isInternalPage) {')[1] ?? ''
  check('an unauthenticated page on any host under tenancy goes through the door', /if \(SAAS_TENANCY && !WHITE_LABEL\) \{[\s\S]{0,120}url\.pathname = '\/api\/wl\/recognise'/.test(gate))
  const ctrl = stripComments(read('app/ctrl/layout.tsx'))
  check('/ctrl sends a stranger through the door, carrying /ctrl', /if \(!user\) redirect\('\/api\/wl\/recognise\?next=%2Fctrl'\)/.test(ctrl))
  check('…and still refuses a broker and a tenant host', /if \(!isAdminRole\(user\.role\)\) redirect\('\/server'\)/.test(ctrl) && /if \(await onTenantHost\(\)\) redirect\('\/'\)/.test(ctrl))
  const page = stripComments(read('app/server/page.tsx'))
  check('/server on the vendor host shows the door ALONE once it has spoken; the password screen is one quiet line away',
    /host === 'other' && SAAS_TENANCY && door !== null && !passwordDoor \?/.test(page) && /setPasswordDoor\(true\)/.test(page) && /<form onSubmit=\{handleSubmit\}/.test(page))
  check('an empty roster is not shown — the form is the screen then', /\{profiles\.length > 0 \? \(/.test(page))
  check('a stranger at the vendor\'s door is told whose list it is', /<EntrestateDoor door=\{door\} vendor \/>/.test(page) && /vendor \? t\('login\.vendorStrangerBody'\)/.test(page))
  const dict = read('lib/i18n/dictionaries.ts')
  check('the bridge line, the way back, and the vendor stranger line exist in all three languages',
    ['orPassword', 'backHome', 'vendorStrangerBody'].every((k) => (dict.match(new RegExp(`'login\\.${k}'`, 'g')) ?? []).length === 3))
  check('a wanderer has the way back to the public site', /href="\/business"[^>]*>\{t\('login\.backHome'\)\}/.test(page))
  const env = read('.env.example')
  check('the allowlist is documented, and documented as emails, not secrets', /VENDOR_STAFF_EMAILS=/.test(env) && /Emails, not secrets/.test(env))
}

if (failures > 0) {
  console.error(`\n${failures} vendor-door rule(s) broken.`)
  process.exit(1)
}
console.log('\nThe vendor is recognised at its own door — one account, no password, fenced to its own hosts.\n')
