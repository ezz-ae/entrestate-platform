/**
 * THE PERSONAL ACCOUNT PLAN MOUNTS THE EXISTING MODULES — it never rebuilds one,
 * and it never leaks the wrong surface. Locked.
 *
 * The company system had no shell for one person. The 'account' plan is that
 * shell: the account primitives (Fund + CRM + Integrations + Drive + Calendar +
 * Settings), where every module is the EXISTING full app, mounted by the same
 * registry the company/realtor plans read. Three rules keep it honest, and are
 * asserted so a later edit can't quietly break them:
 *
 *   1. THE ACCOUNT SEES EXACTLY ITS MODULE SET — visibleApps(role,'account') is
 *      the ACCOUNT_APP_IDS set, whatever the role (plan overrides the company
 *      role hierarchy, the same way 'realtor' does). Fund leads it.
 *   2. FUND IS ACCOUNT-ONLY — the money surface never appears for a company or
 *      realtor plan through role visibility. A company has the Finance desk; a
 *      realtor has Tokens.
 *   3. THE GUARD AND THE NAV AGREE — accountAllowsPath opens the home exactly
 *      and every mounted module, and CLOSES a company-only route (Finance,
 *      Management, Team). The bare hub home is allowed exactly, never as an open
 *      prefix that would unlock every sub-route under it.
 *
 * Pure — imports the registry, no DB, no network.
 */
import {
  visibleApps, spineApps, accountAllowsPath, ACCOUNT_HOME, ALL_ROLES,
} from '../lib/freehold/apps'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const EXPECTED = ['fund', 'crm', 'integrations', 'drive', 'calendar', 'settings']

console.log('\n── the account sees exactly its module set ──')
{
  const ids = visibleApps('ceo', 'account').map((a) => a.id)
  check('visibleApps(account) is exactly the account module set',
    ids.length === EXPECTED.length && EXPECTED.every((e) => ids.includes(e)),
    ids.join(', '))
  check('Fund leads the account spine (the money hook is first)',
    visibleApps('ceo', 'account')[0]?.id === 'fund', ids[0])
  // Plan overrides role: the surface is the same for any signed-in role.
  const asBroker = visibleApps('broker', 'account').map((a) => a.id).sort().join(',')
  const asCeo = visibleApps('ceo', 'account').map((a) => a.id).sort().join(',')
  check('plan overrides role — same account surface for every role', asBroker === asCeo, `${asBroker} vs ${asCeo}`)
  const spine = spineApps('ceo', 'account').map((a) => a.id)
  check('every account module rides the spine', EXPECTED.every((e) => spine.includes(e)), spine.join(', '))
}

console.log('\n── Fund is account-only, never on a company or realtor surface ──')
{
  for (const role of ALL_ROLES) {
    const co = visibleApps(role, 'company').map((a) => a.id)
    if (co.includes('fund')) { fail(`company/${role} must not see Fund`, co.join(', ')); break }
  }
  check('no company role sees Fund (they have the Finance desk)',
    ALL_ROLES.every((r) => !visibleApps(r, 'company').map((a) => a.id).includes('fund')))
  check('a realtor plan does not see Fund (it has Tokens)',
    !visibleApps('ceo', 'realtor').map((a) => a.id).includes('fund'))
}

console.log('\n── the guard opens the account, closes the company-only rooms ──')
{
  const allow = [
    ACCOUNT_HOME,
    '/freehold-intelligence/points', '/freehold-intelligence/crm', '/freehold-intelligence/crm/42',
    '/freehold-intelligence/integrations', '/freehold-intelligence/integrations/meta',
    '/freehold-intelligence/drive', '/freehold-intelligence/calendar',
    '/freehold-intelligence/settings', '/freehold-intelligence/settings/connect',
    '/freehold-intelligence/help',
  ]
  for (const p of allow) check(`opens ${p}`, accountAllowsPath(p) === true)

  const deny = [
    '/freehold-intelligence/finance', '/freehold-intelligence/management',
    '/freehold-intelligence/team', '/freehold-intelligence/analytics',
    '/freehold-intelligence/lead-machine',
  ]
  for (const p of deny) check(`closes ${p}`, accountAllowsPath(p) === false)

  // The home is allowed EXACTLY — proven by the deny list above still being
  // denied even though every one of them sits under the home path.
  check('the hub home is allowed exactly, not as an open prefix',
    accountAllowsPath(ACCOUNT_HOME) === true && accountAllowsPath('/freehold-intelligence/finance') === false)
}

if (failures) { console.error(`\n${failures} account-plan guard(s) broken.`); process.exit(1) }
console.log('\nThe account plan mounts the real modules, keeps Fund to itself, and its guard matches its nav.\n')
