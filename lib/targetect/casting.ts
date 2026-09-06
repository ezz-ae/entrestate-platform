/**
 * TARGET CASTING — who is bought, where, and who is bought only once.
 *
 * THE DISEASE. Ali is in the doctors set, the Golden Visa set, the lookalike
 * and the retargeting set. Four ad sets carry him, four ad sets bid for the
 * same impression, and the account pays the raised price to reach one person
 * four times. lib/meta/audience-overlap.ts already DETECTS this — it scores
 * which ad sets are competing with each other. Detecting it changes nothing on
 * its own: somebody still has to decide where each person belongs.
 *
 * THIS MODULE IS THAT DECISION, and it is what the product is named after.
 * Casting, as in casting a part: every candidate audience is given one role,
 * in one order, and every set cast below another EXCLUDES it. A person in two
 * sets is bought in the higher one and nowhere else. That single rule is the
 * whole "stop reaching Ali everywhere" — not a report about overlap, an
 * exclusion list the ad sets are actually built with.
 *
 * THE ORDER IS TWO NUMBERS MULTIPLIED, and both have to be earned:
 *
 *   RECOGNITION  0–1  How sure we are these are the people you meant, from
 *                     evidence the account owns — what they did on your pages,
 *                     your forms, your calls, your CRM.
 *   OPPORTUNITY  0–1  Whether they can actually be reached today: impressions
 *                     available, at a price worth paying, on a surface that
 *                     exists.
 *
 * Multiplied, never averaged. An average lets a set with a perfect recognition
 * score and nowhere to run outrank one you can actually buy — and it lets a
 * cheap, plentiful crowd inherit the rank of a person you know. Zero on either
 * side is not a low score; it is a refusal, and it is stated as one.
 *
 * NOTHING IS INVENTED WHEN AN INPUT IS MISSING. A set whose reach the platform
 * will not estimate is HELD, not guessed at. An unknown cost per event holds
 * the entire plan rather than casting against a default that looks like a
 * measurement — the same rule lib/freehold/audience-fit.ts runs on, and the
 * reason this product can put a number in front of somebody.
 *
 * EVERY CAST SET CAN LEARN. Meta needs ~50 results a week per ad set before it
 * stops guessing (lib/freehold/learning-phase.ts). Splitting a budget across
 * more sets than it can carry produces sets that each learn nothing and a
 * report full of noise, so capacity is computed first and the sets that do not
 * fit are held with a reason instead of being cast into starvation.
 *
 * Pure — no I/O, no clock, no randomness. The same input casts the same plan
 * every time, which is what makes it arguable.
 */
import { armsThatCanLearn, dailyBudgetToLearn } from '@/lib/freehold/learning-phase'

export interface CastCandidate {
  id: string
  name: string
  /** People the platform says this set can reach. Null when it will not say. */
  reach: number | null
  /** 0–1, how sure we are this is the person you meant. */
  recognition: number
  /** 0–1, whether they are reachable today at a price worth paying. */
  opportunity: number
}

/** Why a candidate did not get a part. Never silence — always one of these. */
export type HeldReason =
  /** The platform would not estimate the reach, so we will not either. */
  | 'unknownReach'
  /** No recognition: we do not know these are the people you meant. */
  | 'noRecognition'
  /** No opportunity: nowhere to reach them today at a price worth paying. */
  | 'noOpportunity'
  /** The budget cannot carry another set that would leave learning. */
  | 'noBudgetLeft'
  /** No cost per event is known, so no set can be promised a learning budget. */
  | 'unknownCost'

export interface CastSlot {
  id: string
  name: string
  /** 1-based. The order IS the exclusion rule. */
  order: number
  /** Every set cast above this one. This set must exclude all of them. */
  excludes: string[]
  /** Whole AED per day. At least the learning floor, by construction. */
  dailyAed: number
  /** recognition × opportunity, the number the order came from. */
  score: number
}

export interface HeldSet {
  id: string
  name: string
  reason: HeldReason
}

export interface CastPlan {
  cast: CastSlot[]
  held: HeldSet[]
  /** What one set needs per day to leave learning. 0 when cost is unknown. */
  perSetFloorAed: number
  /** How many sets this budget can carry at all. */
  capacity: number
}

export interface CastInput {
  candidates: CastCandidate[]
  dailyBudgetAed: number
  /** Observed cost per optimisation event, in AED. Null when nothing is known. */
  costPerEventAed: number | null
}

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)

/**
 * recognition × opportunity. Exported because the order it produces is the
 * thing a person will argue with, and an argument needs the number.
 *
 * ROUNDED, and that is load-bearing. 0.4 × 0.9 and 0.6 × 0.6 are the same
 * score to anybody reading the plan, and in binary floating point the first is
 * larger by 4e-17. Unrounded, that invisible difference decides which audience
 * is cast first and which one excludes the other — and the stated tiebreak
 * below, "the one we are surer of leads", would never once run. Four decimals
 * is far finer than any input this takes and coarse enough that equal is equal.
 */
export const castScore = (c: CastCandidate): number =>
  Math.round(clamp01(c.recognition) * clamp01(c.opportunity) * 10_000) / 10_000

/**
 * Cast the candidates and distribute the budget.
 *
 * Determinism matters more than elegance here: ties break on recognition, then
 * on reach, then on id, so two people reading the same plan see the same order
 * and the same exclusions.
 */
export function castAudiences(input: CastInput): CastPlan {
  const { candidates, dailyBudgetAed } = input
  const cost = input.costPerEventAed
  const budget = Number.isFinite(dailyBudgetAed) && dailyBudgetAed > 0 ? Math.floor(dailyBudgetAed) : 0

  const held: HeldSet[] = []
  const hold = (c: CastCandidate, reason: HeldReason) => held.push({ id: c.id, name: c.name, reason })

  // No cost, no plan. Casting against an assumed cost would produce a budget
  // split that looks measured and is not.
  if (cost === null || !Number.isFinite(cost) || cost <= 0) {
    for (const c of candidates) hold(c, 'unknownCost')
    return { cast: [], held, perSetFloorAed: 0, capacity: 0 }
  }

  // The floor is rounded UP to a whole dirham, because a budget is paid in
  // whole dirhams. Capacity has to be counted at that same rounded floor:
  // armsThatCanLearn() divides by the exact figure, so at a budget of 143 with
  // a 71.43 floor it answers "two parts" — and two parts at the 72 that will
  // actually be paid is 144, one dirham more than exists. The part at the
  // bottom of the cast would then be handed 71 and quietly sit below the line
  // this whole calculation is here to keep it above.
  const perSetFloorAed = Math.ceil(dailyBudgetToLearn(cost))
  const capacity = Math.min(armsThatCanLearn(budget, cost), Math.floor(budget / perSetFloorAed))

  const eligible: CastCandidate[] = []
  for (const c of candidates) {
    if (c.reach === null || !Number.isFinite(c.reach) || c.reach <= 0) { hold(c, 'unknownReach'); continue }
    if (clamp01(c.recognition) === 0) { hold(c, 'noRecognition'); continue }
    if (clamp01(c.opportunity) === 0) { hold(c, 'noOpportunity'); continue }
    eligible.push(c)
  }

  const ranked = [...eligible].sort((a, b) =>
    castScore(b) - castScore(a) ||
    clamp01(b.recognition) - clamp01(a.recognition) ||
    (b.reach ?? 0) - (a.reach ?? 0) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  const taken = ranked.slice(0, Math.max(0, capacity))
  for (const c of ranked.slice(Math.max(0, capacity))) hold(c, 'noBudgetLeft')

  // Every cast set gets the learning floor first; what is left over is shared
  // by score, so the strongest part gets the bigger share of the reach without
  // any part being cast into starvation.
  const scoreSum = taken.reduce((s, c) => s + castScore(c), 0)
  const spare = budget - taken.length * perSetFloorAed
  const cast: CastSlot[] = taken.map((c, i) => ({
    id: c.id,
    name: c.name,
    order: i + 1,
    excludes: taken.slice(0, i).map((x) => x.id),
    dailyAed: perSetFloorAed + (scoreSum > 0 ? Math.floor((spare * castScore(c)) / scoreSum) : 0),
    score: castScore(c),
  }))

  // Flooring each share leaves a few dirhams unspent; they go to the first
  // part, so the plan always adds up to the budget it was given.
  const assigned = cast.reduce((s, c) => s + c.dailyAed, 0)
  if (cast.length > 0 && assigned < budget) cast[0].dailyAed += budget - assigned

  return { cast, held, perSetFloorAed, capacity }
}
