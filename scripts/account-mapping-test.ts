/**
 * PHASE 2 OF THE ACCOUNT FOUNDATION — identity → business account, locked.
 *
 * The rule this phase exists for: ONE account. The Terminal's Google sign-in
 * is the identity; everything the business sells attaches to a row that
 * identity finds-or-creates on sight. The failure this prevents was live on
 * the store: every card pointed at /signup — a second identity for exactly
 * the person the shared session had just greeted by name.
 *
 * Pinned here:
 *   · The spine is the VENDOR's (entrestate_accounts, entrestate_account_apps)
 *     — never freehold_site_users, which is the client-workspace auth — and
 *     pinned to the shared schema, like /ctrl and for the same reason.
 *   · Find-or-create is racing-safe (unique neon_user_id + ON CONFLICT) and
 *     refreshes name/email — the strip keeps up with a renamed account.
 *   · A request is one row per (account, app), created once, never reopened
 *     by a second click — and leadership is emailed exactly when created.
 *   · The store's cards read the account's own state; the CTA opens the
 *     install flow, not /signup.
 *   · The words obey the standing bans (no "free"; the client's name never
 *     renders on a vendor surface).
 *
 * Pure — reads source. Runs in `pnpm guards`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { APP_REQUEST_STATUSES } from '../lib/terminal-account'
import { STORE } from '../lib/freehold/app-store'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

console.log('\n── the spine is the vendor\'s, on the shared schema ──')
{
  const mod = stripComments(read('lib/terminal-account.ts'))
  check('tables are entrestate_*, not freehold_*', mod.includes('entrestate_accounts') && mod.includes('entrestate_account_apps') && !mod.includes('freehold_site_users'))
  check('every statement runs through runWithDefaultSchema', (mod.match(/runWithDefaultSchema\(/g) ?? []).length >= 3)
  check('the identity key is unique', mod.includes('neon_user_id text NOT NULL UNIQUE'))
  check('find-or-create is one statement, racing-safe', mod.includes('ON CONFLICT (neon_user_id) DO UPDATE'))
  check('…and refreshes name and email on every visit', mod.includes("COALESCE(NULLIF($4, ''), entrestate_accounts.name)"))
  check('one request per (account, app)', mod.includes('UNIQUE (account_id, app_id)'))
  check('a second click never reopens a decided request', mod.includes('DO UPDATE SET account_id = entrestate_account_apps.account_id') && mod.includes('(xmax = 0) AS created'))
  check('request statuses are enumerable and the CHECK matches', APP_REQUEST_STATUSES.join(',') === 'requested,active,declined' && mod.includes("CHECK (status IN ('requested', 'active', 'declined'))"))
}

console.log('\n── the store sells onto the ONE account ──')
{
  const store = stripComments(read('app/business/store/page.tsx'))
  check('a signed-in visit lands on a row', store.includes('ensureBusinessAccount(terminalUser)'))
  check('the cards read the account\'s own state', store.includes('listAccountApps(account.id)') && store.includes('requested.get(product.id)'))
  check('the CTA opens the install flow, not /signup', store.includes('/business/store/start?app=${product.id}') && !store.includes('href="/signup"'))

  const start = stripComments(read('app/business/store/start/page.tsx'))
  check('an unknown app is a polite dead end, not a crash', start.includes("That app isn't in the catalog."))
  check('anonymous is sent to the Terminal\'s sign-in — no second identity', start.includes('${TERMINAL_URL}/login') && !start.includes('"/signup"'))
  check('a recorded request emails leadership exactly once', start.includes('request?.created') && start.includes('sendSystemEmail'))
  check('the flow states what happens next, in benefit words', start.includes('no second sign-up'))
  check('the catalog stays the single source', start.includes("from \"@/lib/freehold/app-store\"") && STORE.length > 0)
}

console.log('\n── the standing word rules hold on the new surfaces ──')
{
  for (const rel of ['lib/terminal-account.ts', 'app/business/store/start/page.tsx', 'app/business/store/page.tsx']) {
    const code = stripComments(read(rel)).replaceAll('"free"', '"__tier__"')
    check(`${rel} never says the banned word`, !/\bfree\b/i.test(code) && !code.includes('مجان'), rel)
    check(`${rel} never renders the client's name`, !/[Ff]reehold(?!_site|-intelligence)/.test(code.replace(/from ['"]@\/lib\/freehold\/[^'"]+['"]/g, '').replace(/freehold_site_\w+/g, '')), rel)
  }
}

console.log('\n── the ruling on the OS routes is on the record ──')
{
  const readme = read('docs/spec/README.md')
  check('the three routes are retired by the owner\'s ruling, with the connection named',
    readme.includes('RETIRED (by ruling)') && readme.includes('time-table'))
  const foundation = read('docs/ACCOUNT-FOUNDATION.md')
  check('phase 2 is marked delivered with its evidence', foundation.includes('Delivered 2026-08-31') && foundation.includes('entrestate_accounts'))
}

if (failures > 0) {
  console.error(`\n${failures} account-mapping rule(s) broken.`)
  process.exit(1)
}
console.log('\nOne identity, one account, and the store sells onto it.\n')
