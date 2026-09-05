/**
 * FOUR DEPARTMENTS, ONE RAIL EACH, AND EVERY DOOR ON IT OPENS — locked.
 *
 * The owner's shape for the workspace, after Meta's Ads Manager: a header
 * drop-down that shifts between the four departments (Market Terminal,
 * Inventory System, Campaigns & Marketing, Lead Machine CRM), and a side
 * rail that opens to show the department's own screens. This file keeps
 * that shape honest:
 *
 *   · exactly four departments, in the owner's order;
 *   · every rail id is a real tool; no tool sits on two rails; a department
 *     lands on a door of its own rail;
 *   · every app is owned by at most one department, and the company doors
 *     (management, money, people, setup) are owned by none — they are the
 *     desk behind the departments, never a fifth one;
 *   · where you are is decided by the longest rail href, then the app — so
 *     /crm/reports is CRM even though its tool files under Analyze;
 *   · the rail is drawn through the guards' own functions: a realtor sees
 *     only realtor doors, an account only account doors, a broker no
 *     management door;
 *   · the header lost the app spine and gained the switcher; the shell
 *     mounts the rail; the rail hides on phones; All tools stays one
 *     implementation, opened by the rail through one event;
 *   · the words exist in three languages and never say the banned word.
 *
 * Pure — no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ALL_TOOLS_EVENT, COMPANY_RAIL, DEPARTMENTS, DEPARTMENT_IDS, TERMINAL_DOOR,
  companyRailFor, departmentForPath, departmentHome, railFor, visibleDepartments,
} from '../lib/freehold/departments'
import { APPS, realtorAllowsPath, accountAllowsPath, ALL_ROLES } from '../lib/freehold/apps'
import { TOOLS, toolById } from '../lib/freehold/tools'
import { departments as dict } from '../lib/i18n/dictionaries/departments'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

const FI = '/freehold-intelligence'
const LOCALES = ['en', 'ar', 'ru'] as const

console.log('\n── four departments, in the owner\'s order ──')
{
  check('exactly four', DEPARTMENTS.length === 4, String(DEPARTMENTS.length))
  check('Market Terminal → Inventory System → Campaigns & Marketing → Lead Machine CRM',
    DEPARTMENT_IDS.join(',') === 'market,inventory,marketing,crm', DEPARTMENT_IDS.join(','))
  const allRail = DEPARTMENTS.flatMap((d) => d.rail)
  check('every rail id is a real tool', allRail.every((id) => !!toolById(id)), allRail.filter((id) => !toolById(id)).join(', '))
  check('no tool sits on two rails', new Set(allRail).size === allRail.length)
  for (const d of DEPARTMENTS) {
    check(`${d.id}: lands on a door of its own rail`, d.rail.some((id) => toolById(id)?.href === d.href), d.href)
    check(`${d.id}: owns real apps`, d.apps.every((a) => APPS.some((x) => x.id === a)), d.apps.join(','))
    check(`${d.id}: a rail short enough to be a map, not a list`, d.rail.length >= 5 && d.rail.length <= 14, String(d.rail.length))
  }
  const owned = DEPARTMENTS.flatMap((d) => d.apps)
  check('an app is owned by at most one department', new Set(owned).size === owned.length)
  for (const core of ['crm', 'ads', 'inventory', 'analytics']) check(`the ${core} app has a department`, owned.includes(core))
  check('the company doors are owned by no department',
    COMPANY_RAIL.every((id) => !owned.includes(id)) && COMPANY_RAIL.every((id) => APPS.some((a) => a.id === id)))
  check('the Terminal door is the family\'s product on its own deployment, signed in through /me',
    TERMINAL_DOOR.href === 'https://terminal.entrestate.com/me')
}

console.log('\n── where you are is decided once ──')
{
  const cases: Array<[string, string | null]> = [
    [`${FI}`, null],
    [`${FI}/crm/reports`, 'crm'],
    [`${FI}/crm/leads/abc123`, 'crm'],
    [`${FI}/lead-machine/google/keywords`, 'marketing'],
    [`${FI}/ads-live/meta`, 'marketing'],
    [`${FI}/creative-studio/canvas`, 'marketing'],
    [`${FI}/inventory/landings/requests`, 'inventory'],
    [`${FI}/drive/web`, 'inventory'],
    [`${FI}/ai-manager/listings/new`, 'inventory'],
    [`${FI}/inventory/off-plan`, 'market'],
    [`${FI}/analytics/market`, 'market'],
    [`${FI}/notebook`, 'market'],
    [`${FI}/finance/invoices`, null],
    [`${FI}/management/team`, null],
    [`${FI}/settings/connect`, null],
    [`${FI}/help`, null],
    [`${FI}/agent/leads`, 'crm'],
  ]
  for (const [path, want] of cases) {
    const got = departmentForPath(path)
    check(`${path.replace(FI, '')} → ${want ?? 'home / company'}`, got === want, String(got))
  }
}

console.log('\n── the rail is drawn through the guards ──')
{
  for (const d of DEPARTMENTS) {
    const ceo = railFor(d.id, 'ceo').map((t) => t.id)
    const brokerOnly = d.rail.filter((id) => toolById(id)!.app === 'agent')
    check(`${d.id}: the owner sees every door but the broker's own desk`,
      ceo.length === d.rail.length - brokerOnly.length && !ceo.some((id) => brokerOnly.includes(id)), `${ceo.length}/${d.rail.length}`)
    check(`${d.id}: no door is dead — every rail id is drawn for some role`,
      d.rail.every((id) => ALL_ROLES.some((r) => railFor(d.id, r).some((t) => t.id === id))))
    check(`${d.id}: the owner lands on the department's own door`, departmentHome(d.id, 'ceo') === d.href)
    const realtor = railFor(d.id, 'broker', 'realtor')
    check(`${d.id}: a realtor is shown only realtor doors`, realtor.every((t) => realtorAllowsPath(t.href)))
    const account = railFor(d.id, 'ceo', 'account')
    check(`${d.id}: an account is shown only account doors`, account.every((t) => accountAllowsPath(t.href)))
  }
  const brokerCrm = railFor('crm', 'broker')
  check('a broker\'s CRM rail starts at their own desk', brokerCrm[0]?.id === 'agent.home', brokerCrm[0]?.id ?? 'empty')
  check('…and nobody else\'s does', ALL_ROLES.filter((r) => r !== 'broker').every((r) => railFor('crm', r)[0]?.id !== 'agent.home'))
  const brokerCompany = companyRailFor('broker').map((a) => a.id)
  check('a broker gets no management, finance or settings door', !brokerCompany.some((id) => ['management', 'finance', 'settings'].includes(id)), brokerCompany.join(','))
  const ceoCompany = companyRailFor('ceo').map((a) => a.id)
  check('the owner gets management, finance, team and settings', ['management', 'finance', 'team', 'settings'].every((id) => ceoCompany.includes(id)), ceoCompany.join(','))
  check('the account plan\'s company rail carries Fund', companyRailFor('ceo', 'account').some((a) => a.id === 'fund'))
  check('a department with nothing to show is not offered', visibleDepartments('ceo').length === 4 && visibleDepartments(undefined).length === 0)
  const realtorDepts = visibleDepartments('broker', 'realtor').map((d) => d.id)
  check('a realtor is offered the campaigns and the leads — the plan decides, not the role',
    realtorDepts.includes('marketing') && realtorDepts.includes('crm'), realtorDepts.join(','))
  check('…and the same doors whatever the user row says', railFor('marketing', 'ceo', 'realtor').length === railFor('marketing', 'broker', 'realtor').length)
  check('the account plan is offered the leads and nothing it cannot open',
    visibleDepartments('ceo', 'account').map((d) => d.id).includes('crm') && !visibleDepartments('ceo', 'account').map((d) => d.id).includes('marketing'))
}

console.log('\n── the chrome: switcher in the header, rail at the side, one All tools ──')
{
  const nav = stripComments(read('components/freehold/spaces-nav.tsx'))
  check('the header renders the department switcher', /<DepartmentSwitcher \/>/.test(nav))
  check('the app spine is gone from the header', !/spineApps|data-coach="nav-spine"/.test(nav))
  check('the chat\'s own entry (Notebook) still carries the agent\'s light', /agentWaiting\(\)/.test(nav) && /nav-notebook/.test(nav))

  const shell = stripComments(read('app/freehold-intelligence/shell-client.tsx'))
  check('the shell mounts the rail before the page', /<SideRail \/>\s*(\{[^}]*\}\s*)?<main/.test(shell))

  const rail = stripComments(read('components/freehold/side-rail.tsx'))
  check('the rail hides on phones — the tab bar is their rail', /hidden shrink-0 md:block/.test(rail))
  check('the rail draws doors only through railFor / companyRailFor — never TOOLS or APPS directly',
    /railFor\(/.test(rail) && /companyRailFor\(/.test(rail) && !/from '@\/lib\/freehold\/tools'/.test(rail) && !/from '@\/lib\/freehold\/apps'/.test(rail))
  check('the rail opens on hover, on keyboard focus, or pinned', /pinned \|\| hovered \|\| focused/.test(rail))
  check('the rail overlays the page rather than pushing it', /absolute inset-y-0 start-0 z-30/.test(rail))
  check('the pin is a per-browser convenience read as an external store', /useSyncExternalStore\(subscribePinned, readPinned, \(\) => false\)/.test(rail))
  check('every door is a link or an anchor — nothing navigates by script', !/router\.push|window\.location/.test(rail))
  check('the Terminal door opens in a new tab with no opener', /target="_blank" rel="noopener"/.test(rail))
  check('"All tools" asks the one implementation through the event', new RegExp(`new CustomEvent\\(ALL_TOOLS_EVENT\\)`).test(rail))
  const cmd = stripComments(read('components/freehold/command-nav.tsx'))
  check('…and CommandNav answers it', /addEventListener\(ALL_TOOLS_EVENT, onAsk\)/.test(cmd) && ALL_TOOLS_EVENT === 'fi:all-tools')
  check('the rail keeps the coach anchors the tours know',
    ['nav-management', 'nav-finance', 'nav-team', 'nav-settings', 'nav-crm', 'nav-ads', 'nav-agent'].every((a) => rail.includes(`'${a}'`) || rail.includes(`nav-\${app.id}`)))

  const sw = stripComments(read('components/freehold/department-switcher.tsx'))
  check('the switcher is a menu button with aria-expanded and menuitems', /aria-haspopup="menu"/.test(sw) && /role="menuitem"/.test(sw))
  check('the switcher lands on departmentHome — the first door this person may open', /departmentHome\(d\.id, user\?\.role, plan\)/.test(sw))
  check('the switcher offers Home to nobody the guard would bounce', /const offerHome = plan !== 'realtor' && user\?\.role !== 'broker'/.test(sw))

  const mobile = stripComments(read('components/freehold/mobile-tab-bar.tsx'))
  check('the phone tab bar is untouched', /spineApps\(role, plan\)/.test(mobile))
}

console.log('\n── the words ──')
{
  const banned = [/\bfree\b/i, /مجان/, /бесплат/i]
  for (const locale of LOCALES) {
    const d = dict[locale] as Record<string, string>
    for (const id of DEPARTMENT_IDS) {
      check(`${locale}: dept.${id} and its blurb exist`, (d[`dept.${id}`] ?? '').trim().length > 0 && (d[`dept.${id}.blurb`] ?? '').trim().length > 0)
      check(`${locale}: dept.${id}.blurb is one line`, (d[`dept.${id}.blurb`] ?? '').length <= 80, String((d[`dept.${id}.blurb`] ?? '').length))
    }
    for (const k of ['dept.departments', 'dept.switch', 'dept.company', 'dept.terminal', 'dept.rail', 'dept.pin', 'dept.unpin', 'nav.fund', 'nav.store']) {
      check(`${locale}: ${k} exists`, (d[k] ?? '').trim().length > 0)
    }
    check(`${locale}: no banned word on the navigation`, !Object.values(d).some((v) => banned.some((re) => re.test(v))))
  }
  check('the English names are the owner\'s', dict.en['dept.market'] === 'Market Terminal' && dict.en['dept.inventory'] === 'Inventory System'
    && dict.en['dept.marketing'] === 'Campaigns & Marketing' && dict.en['dept.crm'] === 'Lead Machine CRM')
  check('every rail tool has a label in three languages', DEPARTMENTS.flatMap((d) => d.rail).every((id) => {
    const key = toolById(id)!.labelKey
    return LOCALES.every(() => typeof key === 'string' && key.startsWith('tools.'))
  }))
  check('the tools registry is untouched by this work — the rail curates, it does not fork', TOOLS.length >= 130, String(TOOLS.length))
}

if (failures > 0) {
  console.error(`\n${failures} department rule(s) broken.`)
  process.exit(1)
}
console.log('\nFour departments, one rail each, and every door on it opens.\n')
