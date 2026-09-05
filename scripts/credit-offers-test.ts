/**
 * CREDIT, NOT DISCOUNTS — the owner's school, locked.
 *
 * "You will have a hundred ways to take money afterwards; the idea is that
 * you use VALUE. 'Try me' is bad. 'Buy me and get a gift' is bad. 50–60% off
 * is the worst. Cashback is respect. 'Take these, spend them on me' — that
 * is the school." "Forget free — free never sells again." "The credit must
 * FEEL like money — if he feels it is points, or any such talk, it will not
 * work." "The code is issued once per human — device, network, email,
 * everything." "If he pays the full-system subscription he finds the whole
 * 500 taken off; an app he cannot pay in full from us." "We will not tell
 * him the percentage — he will find it deducted."
 *
 * What this file keeps:
 *   · the offers are credit — an amount in AED on the account; the welcome
 *     is 500; the annual split is 90 back / 30 of it ads;
 *   · the invoice rule: the AED 999 subscription takes all AED 500; an app
 *     is never paid in full; nothing goes negative; the cap is a house
 *     number that no screen prints;
 *   · the ledger never touches the money core's writers; the ads part is a
 *     REQUEST; a grant and its claim are one transaction; retries post once;
 *   · once per human: the code is minted per account, and issue and redeem
 *     both refuse a second landing by account, device+network or address;
 *   · the words: no trial, no days, no "free", no "points", no "coins", no
 *     percentage on a selling surface; the credit is said as AED.
 *
 * Pure — no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  OFFERS, OFFER_IDS, ANNUAL_CASHBACK, annualCashback, applyCredit, CREDIT_CAP_PCT, mintCode, offerOfCode, offerByCode,
} from '../lib/business/offers'
import { FULL_SYSTEM, WELCOME_CREDIT_AED } from '../lib/business/full-system'
import { fingerprintOf } from '../lib/account-credit'
import { DICTIONARIES } from '../lib/i18n/dictionaries'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

console.log('\n── the offers are credit, in AED ──')
{
  check('three offers, each a credit', OFFERS.length === 3 && OFFER_IDS.join(',') === 'welcome,six_month_meta,annual_cashback')
  const welcome = OFFERS.find((o) => o.id === 'welcome')!
  check('the welcome credit is AED 500, all of it for bills, none of it ads',
    welcome.systemAed === 500 && welcome.adsAed === 0 && WELCOME_CREDIT_AED === 500)
  const six = OFFERS.find((o) => o.id === 'six_month_meta')!
  check('the six-month offer is AED 1,000 of ad credit, on the six-month plan',
    six.adsAed === 1000 && six.systemAed === 0 && six.requires === 'six_month_plan')
  check('the annual split is 90 back, 30 of it ads', ANNUAL_CASHBACK.backPct === 90 && ANNUAL_CASHBACK.adsPct === 30)
  const a = annualCashback(FULL_SYSTEM.yearlyAed)
  check('…and on the year that is AED 8,629.20 back, AED 2,876.40 of it ads',
    a.systemAed + a.adsAed === Math.round(FULL_SYSTEM.yearlyAed * 0.9 * 100) / 100 && a.adsAed === Math.round(FULL_SYSTEM.yearlyAed * 0.3 * 100) / 100,
    JSON.stringify(a))
  check('every offer has a family code in upper case with no spaces', OFFERS.every((o) => /^[A-Z0-9]+$/.test(o.code)))
  check('no headline says a percentage of an invoice, a trial, or the banned word',
    OFFERS.every((o) => !/trial|free|points|coins|%\s*of (the|your) (bill|invoice)/i.test(o.headline)))
}

console.log('\n── the invoice rule ──')
{
  const aed = (n: number) => Math.round(n * 100)
  const sub = applyCredit(aed(500), { id: 'inv1', kind: 'subscription', totalFils: aed(999) })
  check('the AED 999 subscription takes the whole AED 500 — the owner\'s example',
    sub.appliedFils === aed(500) && sub.dueFils === aed(499) && sub.remainingFils === 0, JSON.stringify(sub))
  const app = applyCredit(aed(500), { id: 'inv2', kind: 'app', totalFils: aed(80) })
  check('an AED 80 app is never paid in full from credit — a share, and something is paid',
    app.appliedFils < aed(80) && app.appliedFils > 0 && app.dueFils > 0 && app.remainingFils === aed(500) - app.appliedFils, JSON.stringify(app))
  check('every cap is a share, between 50 and 60', Object.values(CREDIT_CAP_PCT).every((p) => p >= 50 && p <= 60))
  const big = applyCredit(aed(10_000), { id: 'inv3', kind: 'subscription', totalFils: aed(999) })
  check('a big balance still takes only the share; the rest waits for the next bill',
    big.appliedFils === aed(500) && big.remainingFils === aed(9_500), JSON.stringify(big))
  const zero = applyCredit(aed(500), { id: 'inv4', kind: 'other', totalFils: 0 })
  check('an invoice of nothing takes nothing', zero.appliedFils === 0 && zero.dueFils === 0 && zero.remainingFils === aed(500))
  const neg = applyCredit(-5, { id: 'inv5', kind: 'app', totalFils: -100 })
  check('nothing goes negative', neg.appliedFils === 0 && neg.dueFils === 0 && neg.remainingFils === 0)
  const small = applyCredit(aed(20), { id: 'inv6', kind: 'app', totalFils: aed(80) })
  check('a balance smaller than the cap is what is taken', small.appliedFils === aed(20) && small.remainingFils === 0)
}

console.log('\n── the code, once per human ──')
{
  const welcome = OFFERS.find((o) => o.id === 'welcome')!
  const code = mintCode(welcome, () => 0.5)
  check('a minted code is the family name and four letters', /^WELCOME500-[A-Z2-9]{4}$/.test(code), code)
  const suffixes = [0, 0.25, 0.5, 0.75, 0.999].map((r) => mintCode(welcome, () => r).split('-')[1])
  check('the suffix alphabet has no 0, O, 1 or I — nothing to misread over the phone', suffixes.every((s) => !/[01OI]/.test(s)), suffixes.join(','))
  check('a code is read back to its offer, whatever the case and spacing', offerOfCode(' welcome500-7k3m ')?.id === 'welcome' && offerOfCode('nonsense') === null)
  check('the family name alone is the offer too', offerByCode('welcome-500')?.id === 'welcome')
  const fp1 = fingerprintOf({ userAgent: 'Mozilla/5.0 (Macintosh)', address: '10.0.0.1' })
  const fp2 = fingerprintOf({ userAgent: 'Mozilla/5.0 (Macintosh)', address: '10.0.0.2' })
  check('the fingerprint is device + network, hashed, short, and different across networks', fp1 !== fp2 && fp1.length === 32 && !/Mozilla|10\.0/.test(fp1))

  const ledger = stripComments(read('lib/account-credit.ts'))
  check('issue refuses a second code for the same human on another account',
    /account_id <> \$2 AND \(fingerprint = \$3 OR address = \$4\)/.test(ledger))
  check('redeem refuses a second landing by device+network or address',
    /WHERE offer_id = \$1 AND \(fingerprint = \$2 OR address = \$3\)/.test(ledger))
  check('a code belongs to one account and one offer', /UNIQUE \(account_id, offer_id\)/.test(ledger) && /code\s+text PRIMARY KEY/.test(ledger))
  check('a claim and its grant are one transaction on one connection (withTransaction, not two pooled queries)',
    /await withTransaction\(async \(tx\) => \{[\s\S]*?INSERT INTO entrestate_offer_claims[\s\S]*?INSERT INTO entrestate_credit_postings[\s\S]*?\}\)/.test(ledger) && !/query\('BEGIN'\)/.test(ledger))
  check('a retried grant or application posts once — reference is UNIQUE and conflicts do nothing',
    /reference\s+text NOT NULL UNIQUE/.test(ledger) && (ledger.match(/ON CONFLICT \(reference\) DO NOTHING/g) ?? []).length === 2)
  check('the balance is grants minus applications, never below zero', /CASE WHEN kind = 'grant' THEN amount ELSE -amount END/.test(ledger) && /Math\.max\(0, Number/.test(ledger))
}

console.log('\n── the money core is not touched ──')
{
  const ledger = stripComments(read('lib/account-credit.ts'))
  check('the ledger never imports the coin movers', !/postTransfer|decideRequest/.test(ledger))
  check('the ads part of an offer is a REQUEST on the account wallet — pending a person', /createRequest\(\{/.test(ledger) && /ensureAccountWallet\(account\)/.test(ledger))
  check('credit is never paid out and never converted', !/payout|withdraw|convert/i.test(ledger))
  const actions = stripComments(read('app/business/account/actions.ts'))
  check('redemption is session-gated, rate-limited, and carries the human', /getTerminalUser\(\)/.test(actions) && /checkRateLimit\(`redeem:/.test(actions) && /redeemCode\(account, code, human\)/.test(actions))
}

console.log('\n── the words: money, never points; credit, never a trial ──')
{
  const page = stripComments(read('app/business/account/page.tsx'))
  check('the account page shows the balance as AED', /AED \{credit\.balanceAed\}/.test(page))
  check('…with a statement beneath it', /credit\.recent\.map/.test(page) && /"\+" : "−"/.test(page))
  check('…and the code with one Redeem button', /defaultValue=\{credit\.waiting\[0\]\.code\}/.test(page) && />\s*Redeem\s*</.test(page))
  check('the welcome code is minted when the account is seen, once per human', /issueOfferCode\(account, 'welcome', await humanFromHeaders\(\)\)/.test(page))
  const credit = page.slice(page.indexOf('THE BALANCE'), page.indexOf('THE WORKSPACE'))
  check('the balance block never says points, coins, cashback, real money, or a percentage',
    !/points|coins?\b|cashback|real money|\d+\s?%/i.test(credit))

  const surfaces = [
    'app/business/page.tsx', 'app/business/pricing/page.tsx', 'app/business/getting-started/page.tsx',
    'app/business/lead-machine/page.tsx', 'app/business/leadformer/page.tsx', 'app/business/how-it-works/page.tsx',
    'app/business/security/page.tsx', 'app/business/landing-pages/page.tsx', 'app/business/contact/page.tsx',
    'app/business/platform/analytics/page.tsx', 'components/business/shell.tsx', 'lib/business/nav.ts', 'lib/business/full-system.ts',
    'scripts/build-onepager.ts',
  ]
  for (const rel of surfaces) {
    const src = stripComments(read(rel))
    check(`${rel}: no trial, no 14 days, no banned word`, !/14-day|14 days|\btrial\b|\bfree\b/i.test(src),
      (src.match(/.{0,40}(14-day|14 days|\btrial\b|\bfree\b).{0,40}/i) ?? [''])[0])
  }
  check('the offer module prints no cap on a screen — CREDIT_CAP_PCT is read by applyCredit only',
    !surfaces.some((rel) => /CREDIT_CAP_PCT/.test(read(rel))))
  for (const [lang, dict] of Object.entries(DICTIONARIES)) {
    const note = String((dict as Record<string, string>)['wl.signup.trialNote'] ?? '')
    check(`${lang}: the sign-up note is the credit in AED, never days`, note.includes('{credit}') && !/\{days\}/.test(note) && !/trial|free|مجان|бесплат/i.test(note), note)
  }
}

if (failures > 0) {
  console.error(`\n${failures} credit rule(s) broken.`)
  process.exit(1)
}
console.log('\nTake these, spend them on me — credit in AED, once per human, off the bills, never the money core.\n')
