/**
 * AN ADS TOKEN IS NOT A JOB, AND AN EXPIRED TERM IS NOT A COLLEAGUE — locked.
 *
 * lib/freehold/sales-employment.ts is the payroll canTakeCalls() always needed:
 * "employed" used to be a boolean every caller invented for itself. Three rules
 * hold it honest, each with the failure it answers to:
 *
 *   1. `ad_hourly` buys forms, never a phone. A token holder goes offline the
 *      moment the model steps off the Note, so one that could dial would drop a
 *      live call mid-sentence.
 *   2. An expired term is a row in a table, not a colleague — and an
 *      unparseable end date counts as expired, because the fail-closed
 *      direction is the one that does not ring a stranger.
 *   3. Reads fail closed to an EMPTY roster: no roster, no calls. The opposite
 *      default puts a model on the phone because a query timed out.
 *
 * Pure: the rows and the instant are injected, so no database is touched.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  EMPLOYMENT_TERMS, CALLING_TERMS, termAllowsCalls, isExpired, rosterFrom,
  stillTraining, notHired, type Employment,
} from '../lib/freehold/sales-employment'
import { SALES_TEAM, READINESS_THRESHOLD, getMember } from '../lib/freehold/visual-sales-team'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const AT = new Date('2026-09-01T07:00:00Z')
const row = (memberId: string, over: Partial<Employment> = {}): Employment => ({
  memberId, term: 'monthly', startedAt: '2026-08-01T00:00:00Z', endsAt: null, trainedLevel: 95, ...over,
})

console.log('\n── rule 1: the ads token buys forms, never a phone ──')
{
  check('every term is accounted for', EMPLOYMENT_TERMS.length === 4 && EMPLOYMENT_TERMS.includes('ad_hourly'))
  check('ad_hourly is not a calling term', termAllowsCalls('ad_hourly') === false)
  check('the three paid terms are', (['weekly', 'monthly', 'yearly'] as const).every(termAllowsCalls))
  check('CALLING_TERMS excludes it', !CALLING_TERMS.includes('ad_hourly'))

  const r = rosterFrom([row('sara', { term: 'ad_hourly' }), row('saeed')], AT)
  check('an ads-only hire is not employed', !r.employed.includes('sara'), r.employed.join(','))
  check('…while a monthly hire is', r.employed.includes('saeed'))
  check('but their training is still remembered', r.trained?.sara === 95)
}

console.log('\n── rule 2: an expired term is not a colleague ──')
{
  check('an open-ended term never expires', isExpired({ endsAt: null }, AT) === false)
  check('a future end date is live', isExpired({ endsAt: '2026-12-01T00:00:00Z' }, AT) === false)
  check('a past end date is expired', isExpired({ endsAt: '2026-08-01T00:00:00Z' }, AT) === true)
  check('an unparseable date is treated as expired (fail closed)',
    isExpired({ endsAt: 'not-a-date' }, AT) === true)
  check('the exact instant counts as ended', isExpired({ endsAt: AT.toISOString() }, AT) === true)

  const r = rosterFrom([row('sara', { endsAt: '2026-08-15T00:00:00Z' }), row('wael')], AT)
  check('an expired hire is not on the roster', !r.employed.includes('sara') && r.employed.includes('wael'))
}

console.log('\n── the roster is the shape assignCaller asks for ──')
{
  const r = rosterFrom([row('sara', { trainedLevel: 91 }), row('saeed', { trainedLevel: 0 })], AT)
  check('employed ids are listed', r.employed.includes('sara') && r.employed.includes('saeed'))
  check('a recorded level is used', r.trained?.sara === 91)
  check('a zero level falls back to the catalogue baseline',
    r.trained?.saeed === getMember('saeed')!.baseLevel, String(r.trained?.saeed))
  check('an empty payroll is an empty roster', rosterFrom([], AT).employed.length === 0)
}

console.log('\n── the operator’s two lists ──')
{
  const rows = [
    row('sara', { trainedLevel: READINESS_THRESHOLD - 1 }),
    row('saeed', { trainedLevel: 95 }),
    row('wael', { term: 'ad_hourly', trainedLevel: 10 }),
  ]
  const training = stillTraining(rows, AT)
  check('an under-trained paid hire is on the keep-teaching list', training.includes('sara'))
  check('a trained one is not', !training.includes('saeed'))
  check('an ads-only hire is not (they were never going to call)', !training.includes('wael'))

  const never = notHired(rows)
  check('never-hired members are listed', never.includes('hessa') && never.includes('closer'))
  check('…and hired ones are not', !never.includes('sara'))
  check('with nobody hired, the whole catalogue is unhired', notHired([]).length === SALES_TEAM.length)
}

console.log('\n── rule 3: reads fail closed ──')
{
  const src = readFileSync(join(process.cwd(), 'lib/freehold/sales-employment.ts'), 'utf8')
  check('listEmployment catches and returns an empty roster',
    /export async function listEmployment[\s\S]*?catch[\s\S]*?return \[\]/.test(src))
  check('the term column is constrained in the schema',
    /CHECK \(term IN \('weekly','monthly','yearly','ad_hourly'\)\)/.test(src))
  check('trained_level is constrained to 0..100',
    /CHECK \(trained_level BETWEEN 0 AND 100\)/.test(src))
  check('ending employment deletes the row rather than flagging it',
    /DELETE FROM \$\{TABLE\} WHERE member_id/.test(src))
}

if (failures) { console.error(`\n${failures} employment guard(s) broken.`); process.exit(1) }
console.log('\nPaying for a member is hiring them; an ads token never was.\n')
