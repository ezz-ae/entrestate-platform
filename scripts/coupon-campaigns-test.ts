/**
 * COUPONS AND VOUCHERS — the marketing system, locked.
 *
 * The owner: "This system of coupons and codes is our marketing system in
 * general. Coupon numbers to the coupon sites at 20, 40, 60. Big vouchers
 * sold on the gift sites. Ad credit on Meta for Realtors, and it and the
 * landing builder as the bait." And the standing rules underneath: credit
 * must feel like money; nothing lands without a claim; no coin moves outside
 * the finance screen; the word "trial" is gone from every screen.
 *
 * What this file keeps:
 *   · a campaign is credit with a SCOPE — general, the landing builder, one
 *     app, or ad credit — and a scope is a pocket, spent narrow-first;
 *   · a coupon is one shared code, once per account and once per human,
 *     under a ceiling and a date; a voucher is one code, one landing;
 *   · the code grammar cannot collide with a house offer, and reads aloud;
 *   · the claim and the grant are one transaction with the code row locked;
 *     an 'ads' campaign is a REQUEST, never a posting; the money core is
 *     never imported; an invoice is applied once, however often billing asks;
 *   · the desk lives under /ctrl, staff-gated AND fenced from tenant hosts;
 *   · the words: no trial, no free, no percentage on a screen.
 *
 * Pure — no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  SCOPE_CHOICES, isCreditScope, scopeLabel, COUPON_AED, VOUCHER_AED, VOUCHER_BATCH_MAX, amountAllowed,
  normalizeCode, mintVoucherCode, mintCouponCode, couponCodeAllowed, campaignOpen, scopesForInvoice, splitAcrossScopes,
} from '../lib/business/coupons'
import { OFFERS, applyCredit, offerOfCode } from '../lib/business/offers'
import { TOPUP_MIN_AED } from '../lib/account-wallet'
import { DICTIONARIES } from '../lib/i18n/dictionaries'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

console.log('\n── a campaign is credit with a scope ──')
{
  check('the desk offers the general pocket, the landing builder, Meta for Realtors, the page builder, and ad credit',
    SCOPE_CHOICES.join(',') === 'bills,pages,app:meta-for-realtors,app:web-designer,ads')
  check('every choice is a scope; a made-up app is not', SCOPE_CHOICES.every(isCreditScope) && !isCreditScope('app:nonsense') && !isCreditScope('coins'))
  check('a scope is said in a reader\'s words', scopeLabel('bills') === 'any bill' && scopeLabel('pages') === 'Landing Pages' && scopeLabel('app:meta-for-realtors') === 'Meta for Realtors' && scopeLabel('ads') === 'ad credit')
  check('the coupon ladder is the owner\'s 20 / 40 / 60', COUPON_AED.ladder.join(',') === '20,40,60')
  check('a coupon is AED 20–500; a voucher AED 100–10,000; nothing fractional',
    amountAllowed('coupon', 20) && amountAllowed('coupon', 500) && !amountAllowed('coupon', 19) && !amountAllowed('coupon', 501)
    && amountAllowed('voucher', 100) && amountAllowed('voucher', 10_000) && !amountAllowed('voucher', 99) && !amountAllowed('voucher', 40.5))
  check('the voucher floor is the account\'s own floor — "you cannot put less than AED 100"', VOUCHER_AED.min === TOPUP_MIN_AED && TOPUP_MIN_AED === 100)
  check('a batch is bounded', VOUCHER_BATCH_MAX === 500)
}

console.log('\n── the code ──')
{
  check('case and spacing are the reader\'s', normalizeCode('  v500-k7pm q2xd ') === 'V500-K7PMQ2XD')
  const v = mintVoucherCode(500, () => 0.5)
  check('a voucher code carries its amount and eight letters', /^V500-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(v), v)
  const c = mintCouponCode(40, () => 0.99)
  check('a minted coupon code is ENTRE40-XXXX', /^ENTRE40-[A-Z2-9]{4}$/.test(c), c)
  const letters = [0, 0.2, 0.4, 0.6, 0.8, 0.999].map((r) => mintVoucherCode(250, () => r).split('-').slice(1).join(''))
  check('no 0, O, 1 or I in a minted code — nothing to misread on a voucher', letters.every((s) => !/[01OI]/.test(s)), letters.join(','))
  check('a chosen coupon code: letters, digits, hyphens, 4–24', couponCodeAllowed('DXB40') && couponCodeAllowed('coupons-ae-sept') && !couponCodeAllowed('DX') && !couponCodeAllowed('a'.repeat(25)) && !couponCodeAllowed('dxb 40!'))
  check('…and never a house offer\'s family, so the redeem path cannot read it as one',
    OFFERS.every((o) => !couponCodeAllowed(`${o.code}-ZZZZ`) && !couponCodeAllowed(o.code)))
  check('…and never the voucher grammar', !couponCodeAllowed('V500-ABCD-EFGH'))
  check('a coupon code is not an offer code — the two ledgers never overlap', offerOfCode('DXB40') === null && offerOfCode('V500-ABCD-EFGH') === null && offerOfCode('ENTRE40-K7PM') === null)
}

console.log('\n── open, paused, ended, dated, used up ──')
{
  const now = new Date('2026-09-05T12:00:00Z')
  const base = { status: 'live' as const, validFrom: '2026-09-01T00:00:00Z', validUntil: null, maxRedemptions: null }
  check('a live campaign with no ceiling and no date is open', campaignOpen(base, 1_000, now).ok)
  check('paused refuses', !campaignOpen({ ...base, status: 'paused' }, 0, now).ok && (campaignOpen({ ...base, status: 'paused' }, 0, now) as { reason: string }).reason === 'paused')
  check('ended refuses', (campaignOpen({ ...base, status: 'ended' }, 0, now) as { reason: string }).reason === 'ended')
  check('not yet open refuses', (campaignOpen({ ...base, validFrom: '2026-10-01T00:00:00Z' }, 0, now) as { reason: string }).reason === 'not_yet')
  check('past its date refuses', (campaignOpen({ ...base, validUntil: '2026-09-05T11:59:59Z' }, 0, now) as { reason: string }).reason === 'expired')
  check('at the ceiling refuses; one under is open', (campaignOpen({ ...base, maxRedemptions: 100 }, 100, now) as { reason: string }).reason === 'used_up' && campaignOpen({ ...base, maxRedemptions: 100 }, 99, now).ok)
}

console.log('\n── pockets: bait is spent where it was aimed ──')
{
  const aed = (n: number) => n * 100
  check('an app invoice draws on its own pocket first, then the general one', scopesForInvoice({ kind: 'app', product: 'meta-for-realtors' }).join(',') === 'app:meta-for-realtors,bills')
  check('a pages invoice draws on the landing builder\'s pocket first', scopesForInvoice({ kind: 'pages' }).join(',') === 'pages,bills')
  check('a subscription draws on the general pocket only — never on an app\'s bait', scopesForInvoice({ kind: 'subscription' }).join(',') === 'bills')
  check('ad credit is never a pocket an invoice can draw on', !['subscription', 'app', 'pages', 'other'].some((k) => scopesForInvoice({ kind: k as 'app', product: 'x' }).includes('ads')))

  // AED 60 on Landing Pages (a coupon) and AED 500 general (the welcome).
  const pockets = { pages: aed(60), bills: aed(500) }
  const pagesInv = { id: 'p1', kind: 'pages' as const, totalFils: aed(100) }
  const scopes = scopesForInvoice(pagesInv)
  const usable = scopes.reduce((s, k) => s + (pockets[k as keyof typeof pockets] ?? 0), 0)
  const app = applyCredit(usable, pagesInv)
  const parts = splitAcrossScopes(app.appliedFils, pockets, scopes)
  check('an AED 100 pages bill takes its share (AED 60) — all of it from the Landing Pages pocket, none from the general',
    app.appliedFils === aed(60) && parts.length === 1 && parts[0].scope === 'pages' && parts[0].fils === aed(60), JSON.stringify({ app, parts }))
  const bigger = splitAcrossScopes(aed(90), { pages: aed(60), bills: aed(500) }, scopes)
  check('a bigger share drains the aimed pocket, then the general', bigger.length === 2 && bigger[0].scope === 'pages' && bigger[0].fils === aed(60) && bigger[1].scope === 'bills' && bigger[1].fils === aed(30))
  const sub = applyCredit(aed(500), { id: 's1', kind: 'subscription', totalFils: aed(999) })
  check('the subscription still takes the whole AED 500 welcome — the owner\'s example, untouched by pockets', sub.appliedFils === aed(500))
  check('a pocket that is empty pays nothing and is not listed', splitAcrossScopes(aed(10), { bills: aed(10) }, ['pages', 'bills']).map((p) => p.scope).join(',') === 'bills')
}

console.log('\n── the rows: one transaction, a locked code, never the money core ──')
{
  const rows = stripComments(read('lib/coupon-campaigns.ts'))
  check('the code row is locked for the length of the claim (FOR UPDATE)', /FROM entrestate_coupon_codes WHERE code = \$1 FOR UPDATE/.test(rows))
  check('the claim and the grant land in ONE withTransaction',
    /withTransaction\(async \(tx\) => \{[\s\S]*?INSERT INTO entrestate_coupon_claims[\s\S]*?INSERT INTO entrestate_credit_postings[\s\S]*?\}\)/.test(rows))
  check('the grant carries the campaign\'s scope into the ledger', /VALUES \(\$1, \$2, 'grant', \$3, \$4, \$5, \$6\)/.test(rows) && /campaign\.scope\]\)/.test(rows))
  check('an ads campaign posts no grant — it is a REQUEST on the Ads Coin wallet', /if \(campaign\.scope !== 'ads'\) \{/.test(rows) && /createRequest\(\{/.test(rows) && /ensureAccountWallet\(account\)/.test(rows))
  check('the rows never import the coin movers', !/postTransfer|decideRequest/.test(rows))
  check('a coupon is once per account and once per human; a voucher is once per code',
    /if \(campaign\.kind === 'coupon'\) \{[\s\S]*?fingerprint = \$3 OR address = \$4/.test(rows) && /UNIQUE \(code, account_id\)/.test(rows))
  check('a campaign is never deleted — ended is how it stops', !/DELETE FROM entrestate_coupon/.test(rows) && /status <> 'ended'/.test(rows))
  check('the minted codes are checked against the table before the batch lands', /WHERE code = ANY\(\$1::text\[\]\)/.test(rows))

  const ledger = stripComments(read('lib/account-credit.ts'))
  check('the ledger gained a scope column with a general default — every earlier posting is general credit',
    /ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'bills'/.test(ledger))
  check('a house offer\'s grant is general credit', /VALUES \(\$1, \$2, 'grant', \$3, \$4, \$5, 'bills'\)/.test(ledger))
  check('an invoice is applied ONCE, however often billing asks — answered from its own postings', /reference LIKE \$2/.test(ledger) && /`invoice:\$\{invoice\.id\}:%`/.test(ledger))
  check('…and each pocket\'s share is its own posting, in one transaction', /`invoice:\$\{invoice\.id\}:\$\{part\.scope\}`/.test(ledger) && /withTransaction\(async \(tx\) => \{[\s\S]*?for \(const part of parts\)/.test(ledger))
  check('the balance a screen shows is the pockets summed, never below zero', /creditPockets\(account\)/.test(ledger) && /Math\.max\(0, Number\(r\.balance/.test(ledger))
}

console.log('\n── the desk: staff only, vendor host only ──')
{
  const layout = stripComments(read('app/ctrl/layout.tsx'))
  check('/ctrl bounces a non-manager and a tenant host', /isAdminRole\(user\.role\)/.test(layout) && /if \(await onTenantHost\(\)\) redirect\('\/'\)/.test(layout))
  const gate = stripComments(read('lib/ctrl/vendor-gate.ts'))
  check('the gate reads the host — the proxy fences sessions to hosts, so the host is the truth', /tenantSubdomainFromHost\(h\.get\('host'\)\) !== null/.test(gate))
  const actions = stripComments(read('app/ctrl/coupons/actions.ts'))
  check('every desk action checks again — an action is reachable without its page', /isAdminRole\(user\.role\) \|\| \(await onTenantHost\(\)\)/.test(actions) && (actions.match(/await requireDesk\(\)/g) ?? []).length === 2)
  check('the desk never sets a balance — it mints campaigns and changes status, nothing else', /mintCampaign\(\{/.test(actions) && /setCampaignStatus\(id, status\)/.test(actions) && !/postings|UPDATE|INSERT/.test(actions))
  const home = read('app/ctrl/page.tsx')
  check('the desk is one link from the control plane\'s home', /href="\/ctrl\/coupons"/.test(home))
}

console.log('\n── the account: one box for any code ──')
{
  const page = read('app/business/account/page.tsx')
  check('a coupon or a voucher is typed in its own box, same action', /Have a coupon or a voucher\?/.test(page) && (page.match(/action=\{redeemOffer\}/g) ?? []).length === 2)
  check('the aimed pockets are said beneath the balance', /credit\.pockets\.map/.test(page) && /Of it,/.test(page))
  check('every refusal has words', ['used_up', 'expired', 'not_yet', 'paused', 'ended', 'landed_ads'].every((k) => new RegExp(`^\\s*${k}: "`, 'm').test(page)))
  const actions = stripComments(read('app/business/account/actions.ts'))
  check('the action reads the family first — an offer code to the offer ledger, anything else to the campaigns',
    /if \(offerOfCode\(code\)\) \{[\s\S]*?redeemCode\(account, code, human\)/.test(actions) && /redeemCampaignCode\(account, code, human\)/.test(actions))
}

console.log('\n── the words ──')
{
  const page = read('app/business/account/page.tsx')
  check('the account page never says Trial — a workspace is Starting, Active or Paused', !/\bTrial\b/.test(page) && /"Starting"/.test(page))
  for (const [lang, dict] of Object.entries(DICTIONARIES)) {
    const d = dict as Record<string, string>
    const values = Object.keys(d).filter((k) => k.startsWith('trial.')).map((k) => d[k]).join(' | ')
    check(`${lang}: the starting-period banner never says trial`, !/trial|تجرب|пробн/i.test(values), values)
  }
  for (const rel of ['app/ctrl/coupons/page.tsx', 'app/ctrl/coupons/[id]/page.tsx', 'lib/business/coupons.ts']) {
    const src = stripComments(read(rel))
    check(`${rel}: no free, no discount, no points, no coins`, !/\bfree\b|discount|\bpoints\b|\bcoins?\b/i.test(src), (src.match(/.{0,30}(\bfree\b|discount|\bpoints\b|\bcoins?\b).{0,30}/i) ?? [''])[0])
  }
}

if (failures > 0) {
  console.error(`\n${failures} coupon rule(s) broken.`)
  process.exit(1)
}
console.log('\nCoupons to the coupon sites, vouchers to the gift sites, bait on the apps — all of it credit, all of it off the bills.\n')
