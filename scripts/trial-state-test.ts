/**
 * THE TRIAL, READ CORRECTLY — locked.
 *
 * `trial_ends_at` was written from the day this product had tenants and read
 * by nothing: a grep for the column across app/, lib/ and components/ found it
 * named only in the file that writes it. Every 14-day trial was therefore
 * permanent, and nobody — customer or vendor — was ever told one was running.
 *
 * lib/tenancy/trial.ts is the reading. It deliberately does not enforce (the
 * reasons are in its header), which makes the correctness of the READING the
 * whole product: a wrong answer here becomes a wrong sentence on a customer's
 * screen or a wrong row in a sales list, with nothing downstream to catch it.
 *
 * The three that would actually hurt, and are asserted hardest:
 *
 *  1. A CONVERTED CUSTOMER TOLD THEIR TRIAL IS ENDING. `status` beats the
 *     date. A tenant that converted keeps whatever timestamp was in the row,
 *     so reading the date first would put an expiry banner on a paying
 *     account.
 *  2. AN UNREADABLE DATE READ AS EXPIRED. Everything malformed lands on
 *     'unknown', which renders nothing. Guessing 'expired' means telling a
 *     paying customer their access is over because of a parse failure.
 *  3. "0 DAYS LEFT" ON A WORKSPACE THAT STILL WORKS. Remaining time ceils, so
 *     six hours reads as 1 day; elapsed time floors, so forty minutes ago
 *     reads as 0 days ago, not 1.
 *
 * Pure — every instant is passed in. Runs in `pnpm guards`.
 */
import {
  trialState, trialIsWorthSaying, trialsToChase, TRIAL_STATES, ENDING_SOON_DAYS,
} from '../lib/tenancy/trial'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const NOW = new Date('2026-08-19T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const at = (deltaMs: number) => new Date(NOW.getTime() + deltaMs).toISOString()
/** A tenant on trial, ending `days` from NOW. */
const trial = (endsAt: string | null) => ({ status: 'trial' as const, trialEndsAt: endsAt })

console.log('\n── a converted customer is never told their trial is ending ──')
{
  // The row keeps whatever timestamp it had. Reading the date before the
  // status would put an expiry banner on a paying account.
  const converted = { status: 'active' as const, trialEndsAt: at(-30 * DAY) }
  check('an active tenant with a long-expired date is NOT on trial',
    trialState(converted, NOW).kind === 'notOnTrial', trialState(converted, NOW).kind)
  check('…and an active tenant with a date still in the future is not either',
    trialState({ status: 'active', trialEndsAt: at(5 * DAY) }, NOW).kind === 'notOnTrial')
  // A suspended tenant has a different conversation to have.
  check('a suspended tenant is not a trial conversation',
    trialState({ status: 'suspended', trialEndsAt: at(2 * DAY) }, NOW).kind === 'notOnTrial')
  check('neither is worth saying anything about',
    !trialIsWorthSaying(trialState(converted, NOW)))
}

console.log('\n── nothing unreadable is ever called expired ──')
{
  check('a null date is unknown, not expired',
    trialState(trial(null), NOW).kind === 'unknown', trialState(trial(null), NOW).kind)
  check('an empty string is unknown', trialState(trial(''), NOW).kind === 'unknown')
  check('junk is unknown', trialState(trial('not a date'), NOW).kind === 'unknown')
  check('a half-written timestamp is unknown', trialState(trial('2026-13-45T99:00:00Z'), NOW).kind === 'unknown')
  const bad = trialState(trial(at(2 * DAY)), new Date('nonsense'))
  check('an unreadable CLOCK is unknown too — not expired',
    bad.kind === 'unknown', bad.kind)
  // Unknown renders nothing, which is exactly what today looks like. Anything
  // else would be a new sentence appearing on screens from a parse failure.
  check('unknown says nothing to anybody', !trialIsWorthSaying(trialState(trial(null), NOW)))
  check('every kind produced is an enumerated one',
    ([trial(null), trial('x'), trial(at(DAY)), trial(at(-DAY))] as const)
      .every((t) => (TRIAL_STATES as readonly string[]).includes(trialState(t, NOW).kind)))
}

console.log('\n── the number on the screen is the number a person would say ──')
{
  // Six hours left is "1 day left". "0 days left" on a workspace that still
  // works is the number a customer screenshots and sends to support.
  const soon = trialState(trial(at(6 * 60 * 60 * 1000)), NOW)
  check('six hours remaining reads as 1 day left', soon.daysLeft === 1, String(soon.daysLeft))
  check('…and never as 0 while the trial is still running',
    soon.kind !== 'expired' && soon.daysLeft > 0)
  const oneMinute = trialState(trial(at(60 * 1000)), NOW)
  check('one minute remaining still reads as 1 day left', oneMinute.daysLeft === 1, String(oneMinute.daysLeft))

  // Elapsed floors, for the opposite reason: overstating how long somebody has
  // been lapsed makes the sales note wrong in the direction that reads as
  // neglect.
  const justEnded = trialState(trial(at(-40 * 60 * 1000)), NOW)
  check('ended forty minutes ago reads as 0 days ago', justEnded.daysSince === 0, String(justEnded.daysSince))
  check('…and is expired', justEnded.kind === 'expired')
  const weekAgo = trialState(trial(at(-7 * DAY)), NOW)
  check('ended a week ago reads as 7 days ago', weekAgo.daysSince === 7, String(weekAgo.daysSince))
  check('an expired trial never reports days LEFT', weekAgo.daysLeft === 0, String(weekAgo.daysLeft))
}

console.log('\n── the warning arrives while it can still be acted on ──')
{
  check(`a trial ${ENDING_SOON_DAYS + 4} days out is quiet`,
    trialState(trial(at((ENDING_SOON_DAYS + 4) * DAY)), NOW).kind === 'active')
  check(`…and one exactly ${ENDING_SOON_DAYS} days out is ending soon`,
    trialState(trial(at(ENDING_SOON_DAYS * DAY)), NOW).kind === 'endingSoon')
  check('a fresh 14-day trial says nothing on day one',
    !trialIsWorthSaying(trialState(trial(at(14 * DAY)), NOW)))
  check('…and an ending-soon one does', trialIsWorthSaying(trialState(trial(at(2 * DAY)), NOW)))
  check('…as does an expired one', trialIsWorthSaying(trialState(trial(at(-DAY)), NOW)))
  // The boundary itself: the instant it ends is expired, not "1 day left".
  check('the exact end instant is expired, not still running',
    trialState(trial(NOW.toISOString()), NOW).kind === 'expired')
}

console.log('\n── the chase list is the size of today’s job ──')
{
  const tenants = [
    { id: 'fresh', ...trial(at(12 * DAY)) },
    { id: 'lapsed-long', ...trial(at(-20 * DAY)) },
    { id: 'ending-tomorrow', ...trial(at(1 * DAY)) },
    { id: 'converted', status: 'active' as const, trialEndsAt: at(-40 * DAY) },
    { id: 'lapsed-short', ...trial(at(-2 * DAY)) },
    { id: 'ending-in-three', ...trial(at(3 * DAY)) },
    { id: 'no-date', ...trial(null) },
  ]
  const chase = trialsToChase(tenants, NOW)
  const ids = chase.map((r) => r.tenant.id)

  // Dropped, not sorted to the bottom — the length of the list has to be the
  // number of conversations owed, or nobody trusts it twice.
  check('a fresh trial, a converted customer and an unknown date are not on the list',
    !ids.includes('fresh') && !ids.includes('converted') && !ids.includes('no-date'), ids.join(', '))
  check('expired come before ending-soon',
    ids.indexOf('lapsed-long') < ids.indexOf('ending-tomorrow'), ids.join(', '))
  check('longest-lapsed first — the most overdue conversation',
    ids.indexOf('lapsed-long') < ids.indexOf('lapsed-short'), ids.join(', '))
  check('soonest-ending first among the rest',
    ids.indexOf('ending-tomorrow') < ids.indexOf('ending-in-three'), ids.join(', '))
  check('exactly the four worth chasing', ids.length === 4, `${ids.length}: ${ids.join(', ')}`)
  check('an empty roster is an empty list, not a crash', trialsToChase([], NOW).length === 0)
}

if (failures > 0) {
  console.error(`\n${failures} trial-state rule(s) broken.`)
  process.exit(1)
}
console.log('\nA trial that is ending can be seen, and a paying customer is never told theirs is.\n')
