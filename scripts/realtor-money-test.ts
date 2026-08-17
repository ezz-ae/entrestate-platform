/**
 * THE REALTOR MONEY PATH — who pays, what a token costs, how long it lasts.
 *
 * Meta for Realtors is sold as "tokens as you run ads, no monthly fee". That
 * sentence is only true if three separate things hold at once, and each one of
 * them has already been wrong in this codebase:
 *
 *  1. WHO PAYS. The rule used to be `role === 'broker'`, inline in every launch
 *     route. A realtor owner signs up as role 'ceo' with no brokerId (see
 *     lib/tenancy/onboard.ts), so that test returned undefined for every single
 *     realtor: creditsToSpend 0, no reservation, a whole product running FREE.
 *     Plan is the authority, not role — and the identity is `brokerId ?? email`,
 *     the same string the ledger is keyed by everywhere else, because the
 *     account a launch is CHARGED to must be the account a balance screen READS.
 *
 *  2. WHAT IT COSTS. Packs, never a free-typed amount — a browser must not be
 *     able to name its own price, and the quote a customer sees is the quote the
 *     vendor confirms. TOKEN_PRICE_AED (the TILL, what a token costs to buy) and
 *     CREDIT_VALUE_AED (the METER, how fast a running campaign burns tokens) are
 *     two different facts that happen to be equal today. Nothing may derive one
 *     from the other, so this suite asserts the derivation each side actually
 *     uses and never that the two numbers match — the day a margin is priced,
 *     these checks must survive unchanged.
 *
 *  3. HOW LONG IT LASTS. Runway is the only honest way to show a token count to
 *     someone who thinks in campaigns, and it is the number the top-up screen
 *     leads with. Floor division, never a rounded-up promise.
 *
 * Pure — no model, no database, no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { creditAccountId } from '../lib/freehold/credit-identity'
import {
  TOKEN_PACKS, packForCredits, TOKEN_PRICE_AED, CREDIT_VALUE_AED,
  creditsForDailyBudget, daysOfRunway, isValidCreditAmount, readBalanceBody,
} from '../lib/freehold/credits-shared'
import type { Role } from '../lib/freehold/session-types'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

/** A session as the launch routes see it: role, email, and maybe a brokerId. */
const user = (role: Role, brokerId?: string) =>
  ({ role, email: `${role}@realtor.test`, brokerId })

console.log('\n── the realtor plan charges the person signed into it ──')
{
  // WHY: THE REGRESSION. A realtor owner is role 'ceo' with no brokerId; the old
  // role-only test returned undefined, so every realtor launch reserved 0 credits.
  check("a realtor 'ceo' with no brokerId pays from their EMAIL",
    creditAccountId(user('ceo'), 'realtor') === 'ceo@realtor.test',
    String(creditAccountId(user('ceo'), 'realtor')))

  // WHY: identity is one string everywhere — `brokerId ?? email`, so a realtor who
  // does carry a brokerId spends from the same account the ledger already knows.
  check('a realtor with a brokerId pays from the brokerId',
    creditAccountId(user('ceo', 'brk_9'), 'realtor') === 'brk_9',
    String(creditAccountId(user('ceo', 'brk_9'), 'realtor')))

  // WHY: a realtor workspace has exactly one payer — whoever is signed in — so no
  // role inside it can launch for free by wearing a management hat.
  const everyRole: Role[] = ['broker', 'team_leader', 'admin', 'sales_manager', 'director', 'ceo', 'marketing']
  check('…and EVERY role on the realtor plan resolves to an account, never undefined',
    everyRole.every((r) => creditAccountId(user(r), 'realtor') === `${r}@realtor.test`),
    everyRole.filter((r) => !creditAccountId(user(r), 'realtor')).join(', ') || 'none')
}

console.log('\n── the company plan is unchanged: the live product must not move ──')
{
  // WHY: a broker spending the house's money draws on their own allowance.
  check('a company broker still pays from brokerId',
    creditAccountId(user('broker', 'brk_1'), 'company') === 'brk_1',
    String(creditAccountId(user('broker', 'brk_1'), 'company')))
  check('…and falls back to email when the session has no brokerId',
    creditAccountId(user('broker'), 'company') === 'broker@realtor.test',
    String(creditAccountId(user('broker'), 'company')))

  // WHY: company staff spend the company's own funded ad budget, which the company
  // already paid Meta for directly — charging them credits too would double-bill.
  const staff: Role[] = ['ceo', 'admin', 'director', 'sales_manager']
  for (const role of staff) {
    check(`a company '${role}' is not credit-funded at all`,
      creditAccountId(user(role, 'brk_2'), 'company') === undefined,
      String(creditAccountId(user(role, 'brk_2'), 'company')))
  }
}

console.log('\n── a missing plan is the company plan, never a new charge ──')
{
  // WHY: a tenant lookup that failed must degrade to the behaviour that existed
  // before plans existed. Starting to charge someone on a failed read is the one
  // failure mode you cannot refund your way out of.
  check('plan undefined behaves exactly like the company plan',
    creditAccountId(user('ceo', 'brk_3'), undefined) === creditAccountId(user('ceo', 'brk_3'), 'company'),
    String(creditAccountId(user('ceo', 'brk_3'), undefined)))
  check('plan null behaves exactly like the company plan',
    creditAccountId(user('ceo', 'brk_3'), null) === creditAccountId(user('ceo', 'brk_3'), 'company'),
    String(creditAccountId(user('ceo', 'brk_3'), null)))
  check('…and a broker on a missing plan still pays, as they always did',
    creditAccountId(user('broker', 'brk_4'), null) === 'brk_4',
    String(creditAccountId(user('broker', 'brk_4'), null)))
  check('…and a manager on a missing plan still does not',
    creditAccountId(user('director', 'brk_4'), null) === undefined,
    String(creditAccountId(user('director', 'brk_4'), null)))
}

console.log('\n── the browser cannot name its own price ──')
{
  // WHY: the fixed ladder is what lets a request row freeze a quote the vendor will
  // honour. Every published pack must be buyable.
  check('every published pack is accepted',
    TOKEN_PACKS.every((p) => packForCredits(p.credits)?.credits === p.credits),
    TOKEN_PACKS.filter((p) => !packForCredits(p.credits)).map((p) => p.credits).join(', ') || 'none')

  // WHY: anything off the ladder is a price the customer invented. All of these
  // arrive as JSON from a browser, and all of them must be refused.
  const forged = [0, -1, -75, 74, 76, 75.5, 0.5, 999, 1_000_001, Number.MAX_SAFE_INTEGER]
  for (const credits of forged) {
    check(`${credits} is not a pack`, packForCredits(credits) === null,
      JSON.stringify(packForCredits(credits)))
  }
  // WHY: a value BETWEEN two packs is the interesting forgery — it looks plausible
  // in a request log and would otherwise be charged at whatever the client claimed.
  check('a value between two packs is refused', packForCredits(300) === null)
  check('NaN is not a pack', packForCredits(Number.NaN) === null)
}

console.log('\n── the quote a customer sees is the quote the vendor confirms ──')
{
  for (const pack of TOKEN_PACKS) {
    // WHY: one derivation. If a pack's aed were ever typed by hand, the checkout
    // screen and the vendor's confirmation would quote two different numbers.
    check(`pack of ${pack.credits} is priced at credits × TOKEN_PRICE_AED`,
      pack.aed === pack.credits * TOKEN_PRICE_AED,
      `${pack.aed} vs ${pack.credits * TOKEN_PRICE_AED}`)
    // WHY: a pack is a ledger movement like any other — whole, positive, in range.
    check(`…and ${pack.credits} credits is a legal ledger amount`,
      isValidCreditAmount(pack.credits), String(pack.credits))
  }
  check('the ladder is strictly ascending — a bigger pack always costs more',
    TOKEN_PACKS.every((p, i) => i === 0 || (p.credits > TOKEN_PACKS[i - 1].credits && p.aed > TOKEN_PACKS[i - 1].aed)))
}

console.log('\n── the till and the meter are independent numbers ──')
{
  // WHY: TOKEN_PRICE_AED is what a token COSTS; CREDIT_VALUE_AED is what a token
  // BURNS. They are equal today only because a token sold at the rate it burns is
  // the honest opening position. Nothing below compares the two, so every check
  // here still passes on the day the vendor prices a margin into the till.
  check('both constants are real, positive, finite numbers',
    Number.isFinite(TOKEN_PRICE_AED) && TOKEN_PRICE_AED > 0
    && Number.isFinite(CREDIT_VALUE_AED) && CREDIT_VALUE_AED > 0,
    `till ${TOKEN_PRICE_AED}, meter ${CREDIT_VALUE_AED}`)

  // WHY: the implied unit price of every pack IS the till, whatever the till is.
  check('every pack’s implied unit price is exactly the till',
    TOKEN_PACKS.every((p) => p.aed / p.credits === TOKEN_PRICE_AED),
    TOKEN_PACKS.map((p) => p.aed / p.credits).join(', '))

  // WHY: the arithmetic above cannot tell the two apart while they are equal, so
  // the independence is locked STRUCTURALLY, at the source. The pack ladder must
  // read the till and nothing else; the burn rate must read the meter and nothing
  // else. That is what survives a re-pricing — an equality assertion would not.
  const src = readFileSync(join(process.cwd(), 'lib/freehold/credits-shared.ts'), { encoding: 'utf8' })
  const ladder = src.slice(src.indexOf('export const TOKEN_PACKS'), src.indexOf('export type TokenPack'))
  check('the ladder derives its price from TOKEN_PRICE_AED', /TOKEN_PRICE_AED/.test(ladder))
  check('…and never reads CREDIT_VALUE_AED', !/CREDIT_VALUE_AED/.test(ladder),
    'the till is derived from the meter')

  const burn = src.slice(src.indexOf('export const creditsForDailyBudget'), src.indexOf('export const CYCLE_REFERENCE_PREFIX'))
  check('the burn rate divides by CREDIT_VALUE_AED', /CREDIT_VALUE_AED/.test(burn))
  check('…and never reads TOKEN_PRICE_AED', !/TOKEN_PRICE_AED/.test(burn),
    'the meter is derived from the till')
}

console.log('\n── runway is floored, never rounded up ──')
{
  // WHY: the marketing promises a minimum AED 50 daily budget, which the meter
  // charges at 5 tokens a day. The smallest pack must therefore be a fortnight of
  // the smallest campaign — 75 ÷ 5 = 15 days — and the top-up screen leads with it.
  check('the smallest pack funds 15 days of the smallest campaign',
    daysOfRunway(75, 50) === 15, String(daysOfRunway(75, 50)))
  // WHY: floor, not round. A part-funded day is not a day you can promise.
  check('a partial day is floored away', daysOfRunway(79, 50) === 15, String(daysOfRunway(79, 50)))
  check('…and 74 tokens is 14 days, not 15', daysOfRunway(74, 50) === 14, String(daysOfRunway(74, 50)))

  // WHY: "infinite days" is not a fact worth printing, so a budget that cannot
  // burn has no runway at all rather than a huge one.
  check('a NaN budget has no runway', daysOfRunway(75, Number.NaN) === null, String(daysOfRunway(75, Number.NaN)))
  check('an Infinity budget has no runway', daysOfRunway(75, Infinity) === null, String(daysOfRunway(75, Infinity)))
  check('a NaN balance has no runway', daysOfRunway(Number.NaN, 50) === null, String(daysOfRunway(Number.NaN, 50)))
  check('a negative balance has no runway', daysOfRunway(-5, 50) === null, String(daysOfRunway(-5, 50)))

  // WHY: an empty account is a FACT — zero days — not an unknown. Returning null
  // there would blank the number on the one screen whose whole job is to say
  // "you have nothing left"; that is the difference between a warning and a gap.
  check('a 0 balance is 0 days, not null', daysOfRunway(0, 50) === 0, String(daysOfRunway(0, 50)))

  // WHY: a budget of 0 cannot burn, so its runway is UNKNOWN, not generous. The
  // guard has to test the budget itself — creditsForDailyBudget floors at 1
  // (a funded campaign is never free), so a rate derived from a 0 budget is 1
  // token a day and the old `perDay <= 0` test could never fire. Read off the
  // derived rate alone, a zero budget printed "75 days" for a campaign that
  // cannot run: a confident number on a money screen, about nothing.
  check('a 0 budget has no runway to print', daysOfRunway(75, 0) === null, String(daysOfRunway(75, 0)))
  check('a negative budget has no runway either', daysOfRunway(75, -50) === null, String(daysOfRunway(75, -50)))
}

console.log('\n── a funded campaign is never free ──')
{
  // WHY: the reservation rate is one derivation shared by Meta and Google — AED 50
  // a day is 5 tokens a day on both, or the two routes charge different prices for
  // the same budget.
  check('AED 50/day reserves 5 credits', creditsForDailyBudget(50) === 5, String(creditsForDailyBudget(50)))
  check('AED 10/day reserves 1 credit', creditsForDailyBudget(10) === 1, String(creditsForDailyBudget(10)))
  check('AED 1000/day reserves 100 credits', creditsForDailyBudget(1000) === 100, String(creditsForDailyBudget(1000)))

  // WHY: 0 credits = no reservation = a free launch. That is exactly the bug this
  // whole suite exists for, so the floor of 1 holds even for a sub-rate budget.
  const budgets = [1, 4, 5, 9, 10, 49, 50, 51, 999, 100_000]
  check('no valid daily budget ever reserves 0 credits',
    budgets.every((b) => creditsForDailyBudget(b) >= 1),
    budgets.filter((b) => creditsForDailyBudget(b) < 1).join(', ') || 'none')
  check('…and every reservation is a legal ledger amount',
    budgets.every((b) => isValidCreditAmount(creditsForDailyBudget(b))),
    budgets.filter((b) => !isValidCreditAmount(creditsForDailyBudget(b))).join(', ') || 'none')

  // WHY: 0 for a malformed payload is fail-closed on purpose — the caller must
  // reject a non-numeric budget before this point, and a NaN charge must never
  // reach the ledger. A loud 0 is how that bug stays visible.
  check('a non-finite budget reserves 0 — never NaN',
    creditsForDailyBudget(Number.NaN) === 0 && creditsForDailyBudget(Infinity) === 0,
    `${creditsForDailyBudget(Number.NaN)}, ${creditsForDailyBudget(Infinity)}`)
}

console.log('\n── one reading of the balance body ──')
{
  // WHY: four screens invented four readings of one endpoint, and two tested the
  // WRAPPER for a number — false on every successful response. That pinned the
  // launcher's token panel at "failed": no cost line, no shortfall warning, and a
  // permanent "could not read your balance" on a read that had just succeeded.
  const wire = (balance: unknown) => ({ balance, brokerId: 'x@y.z' })
  const okRead = readBalanceBody(wire({ broker_id: 'x@y.z', tier: 'Starter', allocated: 0, balance: 42, total_spent: 8, cycle_start: '', cycle_end: '' }))
  check('the NESTED balance is the number', okRead.state === 'ok' && okRead.balance === 42, JSON.stringify(okRead))

  // WHY: "no account row yet" is an honest zero. Collapsing it into 'failed' hides
  // the one number a new realtor most needs to see before their first launch.
  check('a null account reads as empty, not failed', readBalanceBody(wire(null)).state === 'empty', JSON.stringify(readBalanceBody(wire(null))))

  // WHY: a failed read must NEVER become a zero on a money screen.
  check('a bare number wrapper is not trusted', readBalanceBody(wire(7)).state === 'failed', JSON.stringify(readBalanceBody(wire(7))))
  check('a body with no balance key fails', readBalanceBody({ error: 'nope' }).state === 'failed', JSON.stringify(readBalanceBody({ error: 'nope' })))
  check('a non-finite balance fails rather than rendering', readBalanceBody(wire({ balance: NaN })).state === 'failed', JSON.stringify(readBalanceBody(wire({ balance: NaN }))))
  check('null/undefined bodies fail', readBalanceBody(null).state === 'failed' && readBalanceBody(undefined).state === 'failed')
}

console.log('\n── every refusal after the reservation gives the money back ──')
{
  // WHY: five refusals in meta/launch returned AFTER the credits were reserved and
  // never released them — a realtor refused for an unpublished page or a lapsed
  // permit paid a full day's reservation for a campaign that never existed, and the
  // 400 invited a retry that charged again. Every post-reservation exit now goes
  // through refuse(), which refunds first. This reads the SOURCE because the leak
  // was structural: the shape of the file is the thing being locked.
  const src = readFileSync(new URL('../app/api/meta/launch/route.ts', import.meta.url), 'utf8')
  const lines = src.split('\n')
  const reserveAt = lines.findIndex((l) => l.includes('reserved = true'))
  const helperAt = lines.findIndex((l) => l.includes('async function refuse('))
  check('the refunding responder exists', helperAt > 0, String(helperAt))
  check('it is defined after the reservation it releases', helperAt > reserveAt, `${helperAt} vs ${reserveAt}`)

  // Every bare `return NextResponse.json` below the reservation is a suspect: it
  // exits a launch that never served without handing the credits back. The known
  // survivors are the SUCCESS returns, which must keep the money.
  // A return below the reservation is safe only if it REFUNDS within reach, or
  // explicitly says it keeps the money. "Any release somewhere above" is not a
  // rule — the first version of this check said that and passed a deliberately
  // reintroduced leak, because one release far up the file excused every return
  // below it. Silence is the failure mode being locked out.
  const KEEPS = /credits: settled/
  const RELEASES = /releaseReservation\(\)|refuse\(/
  const leaks = lines
    .map((l, i) => ({ l, i }))
    .filter(({ l, i }) => i > reserveAt && /return NextResponse\.json\(/.test(l))
    .filter(({ i }) => !lines.slice(Math.max(reserveAt, i - 12), i + 1).some((p) => RELEASES.test(p) || KEEPS.test(p)))
    .map(({ i }) => i + 1)

  check('no refusal below the reservation returns without releasing it', leaks.length === 0, `unreleased returns at lines: ${leaks.join(', ')}`)
}

console.log('\n── the monthly grant is a company entitlement ──')
{
  // WHY: the tier rollover reads only `tier`, which every insert hardcodes to
  // 'Starter', so a realtor account seeded "at exactly 0" was handed the Starter
  // quota every calendar month forever — a monthly allowance on a product sold
  // with no monthly fee. The opt-out column is what makes the stated rule real.
  const db = readFileSync(new URL('../lib/freehold/credits-db.ts', import.meta.url), 'utf8')
  check('accounts carry a monthly_grant flag', /ADD COLUMN IF NOT EXISTS monthly_grant BOOLEAN NOT NULL DEFAULT true/.test(db))
  check('…defaulting TRUE so no existing company account loses its allowance', /monthly_grant BOOLEAN NOT NULL DEFAULT true/.test(db))
  check('the rollover returns early for a pay-as-you-go account', /if \(!row\.monthly_grant\) return 0/.test(db))
  check('ensureCreditAccount can open one', /monthlyGrant\?: boolean/.test(db))

  const onboard = readFileSync(new URL('../lib/tenancy/onboard.ts', import.meta.url), 'utf8')
  check('a realtor signup opens a pay-as-you-go account', /ensureCreditAccount\(email, \{ monthlyGrant: false \}\)/.test(onboard))

  // WHY: the signup seed is deliberately non-fatal, so the account can instead be
  // born by self-heal inside the launch — which creates it with the company
  // default. Both launch routes must open it correctly before reserving.
  for (const [name, rel] of [['meta', '../app/api/meta/launch/route.ts'], ['google', '../app/api/google/campaigns/launch/route.ts']] as const) {
    const route = readFileSync(new URL(rel, import.meta.url), 'utf8')
    check(`${name} launch opens the account before the self-heal can`,
      /ensureCreditAccount\(brokerId, \{ monthlyGrant: tenantPlan !== 'realtor' \}\)/.test(route))
  }
}

console.log('\n── nobody confirms their own money ──')
{
  // WHY: walked live on production — a realtor requested a 75-token pack and
  // confirmed it in the very next call, minting the tokens for free. The route's
  // role gate could never catch it: a realtor workspace is ONE person signing in
  // as 'ceo', which is on the management list, so the paying customer was also
  // the approver. Unbounded, that is the entire product for nothing.
  const src = readFileSync(new URL('../lib/freehold/credit-topups.ts', import.meta.url), 'utf8')
  const lines = src.split('\n')
  const confirmAt = lines.findIndex((l) => l.includes('export async function confirmTopupRequest'))
  const selfDealAt = lines.findIndex((l) => /reason: 'self_deal'/.test(l))
  const ledgerAt = lines.findIndex((l) => /INSERT INTO credit_ledger/.test(l))
  check('confirmTopupRequest can refuse a self-deal', selfDealAt > confirmAt, `${selfDealAt} vs ${confirmAt}`)

  // WHY: the refusal has to sit INSIDE the money transaction, above the ledger
  // write — anywhere else (a route, a helper) and the next caller reaches the
  // ledger around it. A webhook will eventually call this same function.
  check('…before the ledger is written, inside the transaction',
    selfDealAt > 0 && ledgerAt > selfDealAt, `self_deal@${selfDealAt} ledger@${ledgerAt}`)
  check('…comparing the approver against the credited account',
    /decidedBy[\s\S]{0,120}req\.broker_id/.test(src))

  // WHY: with self-confirmation refused, nobody inside a realtor tenant may
  // approve — so a vendor-side path must exist or a realtor can never buy at all.
  const vendor = readFileSync(new URL('../app/api/wl/topups/route.ts', import.meta.url), 'utf8')
  check('a vendor-side till exists', /confirmTopupRequest/.test(vendor))
  check('…gated by the vendor secret, not a session role', /x-wl-admin/.test(vendor) && /wlAdminSecret/.test(vendor))
  check('…and reaches into the tenant that owns the request', /runWithSchema/.test(vendor) && /schemaNameForSubdomain/.test(vendor))
}

if (failures > 0) {
  console.error(`\n${failures} realtor money rule(s) broken.`)
  process.exit(1)
}
console.log('\nThe realtor pays, the price is the vendor’s, and the runway is floored.\n')
