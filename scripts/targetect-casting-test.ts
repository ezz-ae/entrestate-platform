/**
 * A PERSON IS BOUGHT ONCE — locked.
 *
 * Target casting exists because the same buyer sits in four of an account's ad
 * sets, all four bid for him, and the account pays the raised price to reach
 * one person four times. lib/targetect/casting.ts is the decision that ends
 * that, and every rule it makes is the kind that reverts quietly: an exclusion
 * list that stops being complete, a budget split that starves a set below the
 * learning threshold, a missing input filled with a default that looks like a
 * measurement. None of those throw. All of them are asserted here.
 *
 * Pure — no network, no database, no clock. Runs in `pnpm guards`.
 */
import { castAudiences, castScore, type CastCandidate } from '../lib/targetect/casting'
import { dailyBudgetToLearn, armsThatCanLearn } from '../lib/freehold/learning-phase'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const show = (a: unknown) => JSON.stringify(a)

const cand = (over: Partial<CastCandidate> & { id: string }): CastCandidate => ({
  name: over.id, reach: 200_000, recognition: 0.6, opportunity: 0.6, ...over,
})

/** A round-ish setup: cost 10 AED/event ⇒ a set needs ~72 AED/day to learn. */
const COST = 10
const FLOOR = Math.ceil(dailyBudgetToLearn(COST))

console.log('\n── the order is two numbers multiplied, and it is deterministic ──')
{
  check('the score is recognition × opportunity',
    castScore(cand({ id: 'a', recognition: 0.5, opportunity: 0.4 })) === 0.2)
  check('a perfect audience with nowhere to run scores zero, not high',
    castScore(cand({ id: 'a', recognition: 1, opportunity: 0 })) === 0)
  check('…and a reachable crowd nobody recognises scores zero too',
    castScore(cand({ id: 'a', recognition: 0, opportunity: 1 })) === 0)

  const input = {
    candidates: [
      cand({ id: 'crowd', recognition: 0.2, opportunity: 0.9 }),
      cand({ id: 'known', recognition: 0.9, opportunity: 0.8 }),
      cand({ id: 'middle', recognition: 0.6, opportunity: 0.6 }),
    ],
    dailyBudgetAed: FLOOR * 3,
    costPerEventAed: COST,
  }
  const plan = castAudiences(input)
  check('the strongest part is cast first',
    plan.cast.map((c) => c.id).join(',') === 'known,middle,crowd', show(plan.cast.map((c) => c.id)))

  const again = castAudiences(input)
  check('the same input casts the same plan, every time', show(again) === show(plan))

  // Ties must not depend on the order they arrived in.
  const tied = castAudiences({
    candidates: [
      cand({ id: 'b', recognition: 0.4, opportunity: 0.9 }),
      cand({ id: 'a', recognition: 0.6, opportunity: 0.6 }),
    ],
    dailyBudgetAed: FLOOR * 2,
    costPerEventAed: COST,
  })
  check('a tie on score breaks on recognition — the one we are surer of leads',
    tied.cast[0]?.id === 'a', show(tied.cast.map((c) => c.id)))
}

console.log('\n── the exclusion list is the product ──')
{
  const plan = castAudiences({
    candidates: [cand({ id: 'a', recognition: 0.9 }), cand({ id: 'b', recognition: 0.7 }), cand({ id: 'c', recognition: 0.5 })],
    dailyBudgetAed: FLOOR * 3,
    costPerEventAed: COST,
  })
  check('three parts were cast', plan.cast.length === 3, show(plan.cast.length))
  check('the first part excludes nobody — there is nobody above it',
    plan.cast[0].excludes.length === 0, show(plan.cast[0].excludes))
  const complete = plan.cast.every((slot, i) =>
    slot.excludes.length === i &&
    slot.excludes.every((id, j) => id === plan.cast[j].id))
  check('every part excludes exactly the parts cast above it — so a person in two sets is bought in one',
    complete, show(plan.cast.map((c) => ({ id: c.id, excludes: c.excludes }))))
  check('the order is 1..n with no gaps',
    plan.cast.every((c, i) => c.order === i + 1), show(plan.cast.map((c) => c.order)))
}

console.log('\n── nothing is cast into starvation ──')
{
  const budget = FLOOR * 2 + 40 // room for two parts and change, never three
  const plan = castAudiences({
    candidates: ['a', 'b', 'c', 'd'].map((id) => cand({ id })),
    dailyBudgetAed: budget,
    costPerEventAed: COST,
  })
  check('capacity is what the budget can carry, not what was asked for',
    plan.capacity === armsThatCanLearn(budget, COST) && plan.cast.length === plan.capacity,
    `${plan.capacity} / ${plan.cast.length}`)
  check('every cast part gets at least the learning floor',
    plan.cast.every((c) => c.dailyAed >= plan.perSetFloorAed), show(plan.cast.map((c) => c.dailyAed)))
  check('the budget adds up exactly — no dirham invented, none lost',
    plan.cast.reduce((s, c) => s + c.dailyAed, 0) === Math.floor(budget),
    show(plan.cast.reduce((s, c) => s + c.dailyAed, 0)))
  const spare = plan.held.filter((h) => h.reason === 'noBudgetLeft')
  check('what did not fit is HELD with a reason, never dropped in silence',
    spare.length === 4 - plan.cast.length && plan.held.length === spare.length, show(plan.held))

  // The awkward window: a budget that clears the exact learning figure for two
  // parts but not the whole-dirham one. Counting capacity against the exact
  // figure casts a part that is then paid a dirham under the line — silently,
  // and only for budgets inside a range nobody would think to try.
  for (const budget of [FLOOR * 2 - 1, FLOOR * 2, FLOOR * 2 + 1, FLOOR * 3 - 1]) {
    const tight = castAudiences({
      candidates: ['a', 'b', 'c'].map((id) => cand({ id })),
      dailyBudgetAed: budget,
      costPerEventAed: COST,
    })
    check(`at AED ${budget}/day every cast part still clears the floor`,
      tight.cast.every((c) => c.dailyAed >= tight.perSetFloorAed),
      show(tight.cast.map((c) => c.dailyAed)))
    check(`…and the split still adds up to AED ${budget}`,
      tight.cast.length === 0 || tight.cast.reduce((s, c) => s + c.dailyAed, 0) === budget,
      show(tight.cast.map((c) => c.dailyAed)))
  }
}

console.log('\n── a missing input is never a default ──')
{
  const noCost = castAudiences({
    candidates: [cand({ id: 'a' })],
    dailyBudgetAed: 1000,
    costPerEventAed: null,
  })
  check('with no cost per event nothing is cast at all', noCost.cast.length === 0, show(noCost.cast))
  check('…and the reason says which input is missing',
    noCost.held.every((h) => h.reason === 'unknownCost'), show(noCost.held))
  check('…and no floor is invented for it', noCost.perSetFloorAed === 0 && noCost.capacity === 0)

  const plan = castAudiences({
    candidates: [
      cand({ id: 'noReach', reach: null }),
      cand({ id: 'unknownPeople', recognition: 0 }),
      cand({ id: 'nowhereToRun', opportunity: 0 }),
      cand({ id: 'good' }),
    ],
    dailyBudgetAed: FLOOR * 4,
    costPerEventAed: COST,
  })
  const reasons = Object.fromEntries(plan.held.map((h) => [h.id, h.reason]))
  check('a set the platform will not size is held, not guessed at',
    reasons.noReach === 'unknownReach', show(reasons))
  check('a set we do not recognise is refused, not ranked low',
    reasons.unknownPeople === 'noRecognition', show(reasons))
  check('a set with nowhere to run is refused too',
    reasons.nowhereToRun === 'noOpportunity', show(reasons))
  check('and the one that earned a part got it',
    plan.cast.length === 1 && plan.cast[0].id === 'good', show(plan.cast))
}

console.log('\n── an empty account is a plan with nothing in it, not a crash ──')
{
  const empty = castAudiences({ candidates: [], dailyBudgetAed: 500, costPerEventAed: COST })
  check('no candidates casts nothing and holds nothing',
    empty.cast.length === 0 && empty.held.length === 0)
  const broke = castAudiences({ candidates: [cand({ id: 'a' })], dailyBudgetAed: 0, costPerEventAed: COST })
  check('no budget casts nothing, and says the budget is why',
    broke.cast.length === 0 && broke.held[0]?.reason === 'noBudgetLeft', show(broke.held))
}

if (failures > 0) {
  console.error(`\n${failures} casting rule(s) broken.\n`)
  process.exit(1)
}
console.log('\nEvery part is cast once, excludes the ones above it, and can afford to learn.\n')
