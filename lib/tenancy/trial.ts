/**
 * HOW LONG THIS WORKSPACE HAS LEFT — the reading, not the enforcement.
 *
 * `trial_ends_at` was written by createTenant (lib/tenancy/store.ts) from the
 * day this product had tenants, and read by NOTHING. A grep across app/, lib/
 * and components/ found the column named in exactly one file: the one that
 * writes it. So every 14-day trial has been permanent, and — the part that
 * actually costs money — nobody has ever been told one was running.
 *
 * Not the customer: no screen counted down, so a brokerage loaded its
 * inventory, worked the product for months, and was never once prompted to
 * talk about paying. Not the vendor either: there is no list of trials, no
 * alert, no ordering by expiry. The lost revenue here is an absent sales
 * trigger, not free usage.
 *
 * WHY THIS MODULE DOES NOT LOCK ANYTHING, deliberately:
 *
 *  1. There is nowhere to pay. The platform carries no payment processor at
 *     all — the only money rails are human-confirmed credit top-ups
 *     (lib/freehold/credit-topups.ts) and the Terminal's Stripe/Tap stack,
 *     which is not wired to any product price. A gate today would lock a
 *     customer out with no button to press, which turns the people who liked
 *     the product enough to still be here into support tickets.
 *  2. The expensive thing is already safe. A trial tenant cannot spend the
 *     vendor's money: there are no vendor-wide Meta credentials, so a launch
 *     either runs on the customer's own connected ad account or throws
 *     MetaConfigError (lib/meta/client.ts). Per-trial cost is a Postgres
 *     schema and some AI calls.
 *
 * So this is a pure reading that screens and reports can render. When there IS
 * somewhere to pay, the gate is one branch against `expired` — and it will be
 * built on a function that has already been proven correct here.
 *
 * Pure: no clock of its own, no I/O. The instant is passed in, the way
 * lib/freehold/call-templates.ts does it, so the guard can drive every edge.
 */
import type { SaasTenant } from './store'

/**
 * Walkable const array — screens render t(`trial.state.${s}`) and `pnpm i18n`
 * cannot see a computed key. Enumerated in scripts/dynamic-keys-test.ts.
 */
export const TRIAL_STATES = ['notOnTrial', 'active', 'endingSoon', 'expired', 'unknown'] as const
export type TrialStateKind = (typeof TRIAL_STATES)[number]

/**
 * Three days. Short enough that the warning still means something — a banner
 * shown from day one is wallpaper by day three — and long enough that a
 * brokerage can get a decision through whoever signs for it over a weekend.
 */
export const ENDING_SOON_DAYS = 3

export interface TrialState {
  kind: TrialStateKind
  /** Whole days remaining. 0 only when the trial has already ended. */
  daysLeft: number
  /** Whole days since it ended. 0 unless `kind` is 'expired'. */
  daysSince: number
  /** The instant it ends, ISO, or null when there is nothing to show. */
  endsAt: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000

const state = (
  kind: TrialStateKind,
  endsAt: string | null = null,
  daysLeft = 0,
  daysSince = 0,
): TrialState => ({ kind, endsAt, daysLeft, daysSince })

/**
 * Where a workspace stands, right now.
 *
 * `status` beats the date in both directions, and that is the load-bearing
 * rule: a tenant that converted is 'active' and must never be told its trial
 * is ending because an old timestamp is still sitting in the row, and a
 * suspended tenant has a different conversation to have than a trial one.
 *
 * Everything unreadable lands on 'unknown', never on 'expired'. A missing or
 * malformed date is a fact about our data, and the failure mode of guessing
 * "expired" is telling a paying customer their access is over. `unknown`
 * renders as nothing at all, which is exactly what today already looks like.
 */
export function trialState(
  tenant: Pick<SaasTenant, 'status' | 'trialEndsAt'>,
  now: Date,
): TrialState {
  if (tenant.status === 'active') return state('notOnTrial')
  if (tenant.status === 'suspended') return state('notOnTrial')

  const raw = tenant.trialEndsAt
  if (!raw) return state('unknown')

  const ends = new Date(raw)
  const endsMs = ends.getTime()
  if (!Number.isFinite(endsMs)) return state('unknown')

  const nowMs = now.getTime()
  if (!Number.isFinite(nowMs)) return state('unknown')

  const endsAtIso = ends.toISOString()

  if (nowMs >= endsMs) {
    // Floor: something that ended forty minutes ago ended "today", not
    // "1 day ago". Overstating how long somebody has been lapsed makes the
    // sales note wrong in the direction that reads as neglect.
    const daysSince = Math.floor((nowMs - endsMs) / DAY_MS)
    return state('expired', endsAtIso, 0, daysSince)
  }

  // Ceil, so any remaining time reads as at least one day. Six hours left is
  // "1 day left"; printing "0 days left" on a workspace that still works is
  // the kind of number a customer screenshots and sends to support.
  const daysLeft = Math.ceil((endsMs - nowMs) / DAY_MS)
  return state(daysLeft <= ENDING_SOON_DAYS ? 'endingSoon' : 'active', endsAtIso, daysLeft)
}

/** True when a person should be shown something. The other states render nothing. */
export function trialIsWorthSaying(s: TrialState): boolean {
  return s.kind === 'endingSoon' || s.kind === 'expired'
}

/**
 * Trials in the order somebody should work them: the ones already lapsed
 * first — they are the conversation that is overdue — then the ones closest to
 * ending. Anything with nothing to say is dropped rather than sorted to the
 * bottom, so the length of this list is the size of today's job.
 */
export function trialsToChase<T extends Pick<SaasTenant, 'status' | 'trialEndsAt'>>(
  tenants: readonly T[],
  now: Date,
): Array<{ tenant: T; state: TrialState }> {
  return tenants
    .map((tenant) => ({ tenant, state: trialState(tenant, now) }))
    .filter((row) => trialIsWorthSaying(row.state))
    .sort((a, b) => {
      // Expired before ending-soon; within each, longest-lapsed and
      // soonest-ending first. Same comparator either side of the boundary
      // because both are "how far past the interesting moment are we".
      const rank = (s: TrialState) => (s.kind === 'expired' ? 0 : 1)
      if (rank(a.state) !== rank(b.state)) return rank(a.state) - rank(b.state)
      if (a.state.kind === 'expired') return b.state.daysSince - a.state.daysSince
      return a.state.daysLeft - b.state.daysLeft
    })
}
