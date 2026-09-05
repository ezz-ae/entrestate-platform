/**
 * THE FULL SYSTEM IS SOLD ON ONE PAGE, AT ONE PRICE, THROUGH ONE DOOR — locked.
 *
 * The owner's arrangement of the family: the account (/me on the Terminal)
 * is everything a person has and the apps install there; the server is the
 * FULL SYSTEM — the complete operation under a company's own name — and it is
 * sold on entrestate.com/business to the company that takes the whole of it.
 *
 * What this file keeps true:
 *
 *   · /business sells one thing. It no longer opens three product doors at
 *     once; the parts it lists come from the site's own map (PLATFORM), so a
 *     part cannot be promised that has no page.
 *   · The price is typed ONCE, in lib/business/full-system.ts. The home, the
 *     plans page and the printed one-pager read it — a door that quotes one
 *     number and a till that charges another is the worst kind of wrong.
 *   · The trial length is the same number the sign-up screen promises.
 *   · Every start button opens /signup, which provisions plan 'company'.
 *   · The team is told the truth: a member signs in with their own Entrestate
 *     account. The Team page's hint said "a default password is set on
 *     creation" for months while nothing ever set one.
 *   · The banned word appears on none of it.
 *
 * Pure — no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FULL_SYSTEM, FULL_SYSTEM_CTA, FULL_SYSTEM_PRICE_LINE, FULL_SYSTEM_PRICE_SHORT, FULL_SYSTEM_TRIAL_NOTE } from '../lib/business/full-system'
import { PLATFORM } from '../lib/business/nav'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

const BANNED = [/\bfree\b/i, /مجان/, /бесплат/i]
const saysBanned = (s: string) => BANNED.some((re) => re.test(s))

console.log('\n── the facts, typed once ──')
{
  check('the price line reads AED 999 / month · AED 9,588 / year',
    FULL_SYSTEM_PRICE_LINE === 'AED 999 / month · AED 9,588 / year', FULL_SYSTEM_PRICE_LINE)
  check('the short form agrees with it', FULL_SYSTEM_PRICE_SHORT === 'AED 999/month', FULL_SYSTEM_PRICE_SHORT)
  check('the yearly price is twelve months less the discount, not a typo',
    FULL_SYSTEM.yearlyAed < FULL_SYSTEM.monthlyAed * 12 && FULL_SYSTEM.yearlyAed > FULL_SYSTEM.monthlyAed * 9)
  check('the door is /signup, which provisions plan company', FULL_SYSTEM.startHref === '/signup')
  const signup = stripComments(read('app/signup/signup-client.tsx'))
  const promised = Number(/const TRIAL_DAYS = (\d+)/.exec(signup)?.[1])
  check('the trial length is the one the sign-up screen promises',
    promised === FULL_SYSTEM.trialDays, `${promised} vs ${FULL_SYSTEM.trialDays}`)
  check('…and sign-up provisions plan company by default', /plan: isRealtor \? 'realtor' : 'company'/.test(signup))
  check('the full system\'s address is where /me on the Terminal points',
    FULL_SYSTEM.url === 'https://entrestate.com/business', FULL_SYSTEM.url)
  check('the call to action is a benefit, not a term', FULL_SYSTEM_CTA === 'Start with your own address', FULL_SYSTEM_CTA)
  check('the trial note names the days and never the banned word',
    FULL_SYSTEM_TRIAL_NOTE.includes(`${FULL_SYSTEM.trialDays} days`) && !saysBanned(FULL_SYSTEM_TRIAL_NOTE), FULL_SYSTEM_TRIAL_NOTE)
}

console.log('\n── /business sells one thing ──')
{
  const home = stripComments(read('app/business/page.tsx'))
  check('the home reads the facts from lib/business/full-system', /from '@\/lib\/business\/full-system'/.test(home))
  check('every start button opens the one door',
    (home.match(/href=\{FULL_SYSTEM\.startHref\}/g) ?? []).length >= 2 && !/href="\/signup"/.test(home))
  check('…and says the one thing on it', (home.match(/\{FULL_SYSTEM_CTA\}/g) ?? []).length >= 2)
  check('the price is rendered from the constant, never retyped',
    /\{FULL_SYSTEM_PRICE_LINE\}/.test(home) && !/999|9,588/.test(home))
  check('the trial length is rendered from the constant, never retyped',
    /FULL_SYSTEM_TRIAL_NOTE/.test(home) && !/14-day|14 days/.test(home))
  // The owner: "we cannot tell them a month to learn — make an ad in five
  // minutes." The home's closing note says so, and never "stays off".
  check('the closing note promises the first ad in five minutes, not a wait',
    /first ad in five minutes/.test(home) && !/stays off/.test(home))
  check('the parts come from the site\'s own map', /PLATFORM\.map\(\(p\)/.test(home))
  check('every platform part has a page to open', PLATFORM.every((p) => p.href.startsWith('/business/platform/')))
  check('the three product doors are gone from the home — one thing at a time', !/PRODUCTS\[/.test(home))
  check('the team is told the one-account truth',
    /signs in with their own Entrestate account/.test(home) && /no password to hand out/i.test(home))
  check('the apps are pointed at the account, not sold here', /href="\/business\/account"/.test(home))
  check('the home never says the banned word', !saysBanned(home))
  check('the home sends the reader on to the plans page', /href="\/business\/pricing"/.test(home))
}

console.log('\n── the plans page and the one-pager quote the same line ──')
{
  const plans = stripComments(read('app/business/pricing/page.tsx'))
  check('the featured plan\'s price IS the constant', /price: FULL_SYSTEM_PRICE_LINE,/.test(plans))
  check('the plans page types no price of its own', !/AED 999|9,588/.test(plans))
  const onepager = stripComments(read('scripts/build-onepager.ts'))
  check('the printed one-pager reads the short form', /FULL_SYSTEM_PRICE_SHORT/.test(onepager) && !/AED 999/.test(onepager))
  const constants = stripComments(read('lib/business/full-system.ts'))
  check('the constants module is the only place the number is typed',
    (constants.match(/\b999\b/g) ?? []).length === 1 && /9_588/.test(constants))
}

console.log('\n── the Team page tells the truth about the door ──')
{
  const dict = read('lib/i18n/dictionaries/management.ts')
  for (const key of ['signInHint', 'passwordHint']) {
    check(`mgmt.team.admin.${key} exists in all three languages`,
      (dict.match(new RegExp(`'mgmt\\.team\\.admin\\.${key}'`, 'g')) ?? []).length === 3)
  }
  const hints = [...dict.matchAll(/'mgmt\.team\.admin\.(signInHint|passwordHint)':\s*'([^']*)'/g)].map((m) => m[2])
  check('no hint promises a default password — nothing ever set one', !hints.some((h) => /default password|كلمة مرور افتراضية|пароль по умолчанию/i.test(h)))
  const signIn = [...dict.matchAll(/'mgmt\.team\.admin\.signInHint':\s*'([^']*)'/g)].map((m) => m[1])
  check('the workspace hint names the Entrestate account in every language', signIn.length === 3 && signIn.every((h) => /Entrestate/.test(h)))
  check('no hint says the banned word', !hints.some(saysBanned))

  const admin = stripComments(read('app/freehold-intelligence/management/team/_team-admin.tsx'))
  check('the hint branches on tenancy: the workspace truth on a workspace, the standalone truth elsewhere',
    /t\(SAAS_TENANCY \? 'mgmt\.team\.admin\.signInHint' : 'mgmt\.team\.admin\.passwordHint'\)/.test(admin))
  const form = admin.split('function CreateMemberModal(')[1]?.split('\nfunction ')[0] ?? 'type="password"'
  check('the add-member form still asks for no password and sends none',
    !/type="password"|password:/i.test(form) && /JSON\.stringify\(\{ name: name\.trim\(\), email: email\.trim\(\), role \}\)/.test(form))
}

if (failures > 0) {
  console.error(`\n${failures} full-system rule(s) broken.`)
  process.exit(1)
}
console.log('\nOne page, one price, one door — and the team is told the truth about it.\n')
