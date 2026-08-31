/**
 * ENGINE 07 §3.3 — THE TEMPORAL ANOMALY GATE.
 *
 * A pipeline status is supposed to be a judgment about one person, made by
 * the broker who spoke to them. It stops being that the moment somebody
 * moves many cards in a few minutes: an end-of-shift backlog purge, a tidy-up
 * before a management review, a bad afternoon. Each of those status changes
 * then feeds two things that LEARN from it — the audience seed that copies
 * "qualified" people and excludes "lost" ones, and the campaign-quality score
 * that can pause a campaign — and both learn something nobody meant.
 *
 * The gate looks at ONE actor's status transitions inside a short window.
 * At BULK_STATUS_THRESHOLD distinct leads or more within
 * BULK_STATUS_WINDOW_MINUTES it declares a Bulk Status Event, and the
 * write side (lib/freehold/lead-rate-db.ts) does three things the spec names:
 *
 *   1. QUARANTINE — every lead in the event is stamped seed_quarantined_at,
 *      and lib/freehold/lead-evidence.ts refuses to feed a quarantined lead
 *      to any audience, seed or exclusion.
 *   2. REDISTRIBUTE — when the event is NEGLECT-CLEANING (active leads the
 *      actor never touched, swept to lost), the lead's previous status is
 *      restored, ownership is revoked and it is routed to a top performer.
 *   3. THE LEDGER — the actor, the leads and the exact timestamps go to the
 *      authority log and management is told, in-app and by email.
 *
 * THE THRESHOLD AGREES WITH THE READ SIDE. lib/freehold/training-integrity.ts
 * already subtracted lost/blocked bursts from the seed retrospectively, at
 * five distinct leads — so five is the number here too; the spec's ">5" and
 * a floor of 5 must not become two rules about the same burst. The window is
 * the spec's ten minutes. Both are exported so the guard can read them.
 *
 * WHAT NEGLECT-CLEANING MEANS, exactly: a transition INTO 'lost' from an open
 * status on a lead with no logged contact — nobody called, nobody messaged,
 * and now it is gone. When at least half of a flagged event's transitions
 * look like that, the event is neglect-cleaning. Bulk moves into any other
 * status (a manager closing a month's deals, say) are quarantined for the
 * seed's sake and logged, and nothing is reverted — the gate protects the
 * training data on every burst and reverses only the one kind of burst that
 * demonstrably threw leads away.
 *
 * Pure — no I/O. scripts/anomaly-gate-test.ts pins the window, the threshold
 * and the neglect classification.
 */

/** Distinct leads whose status one actor changed inside the window. */
export const BULK_STATUS_THRESHOLD = 5
export const BULK_STATUS_WINDOW_MINUTES = 10

const OPEN_STATUSES = new Set(['', 'new', 'contacted', 'qualified', 'viewing', 'negotiation'])

export interface StatusTransition {
  leadId: string
  actor: string
  fromStatus: string | null
  toStatus: string | null
  /** ISO timestamp or epoch ms of the change. */
  at: string | number
  /** Contact touches logged on the lead BEFORE this change (calls, messages). */
  contactCount?: number
}

export interface BulkStatusEvent {
  flagged: boolean
  actor: string
  /** Every distinct lead inside the window, flagged or not. */
  leadIds: string[]
  count: number
  windowStart: string | null
  windowEnd: string | null
  /** True when at least half the transitions swept untouched open leads to lost. */
  neglectCleaning: boolean
  /** The leads that were swept — the ones to restore and redistribute. */
  neglectedLeadIds: string[]
}

const ms = (at: string | number) => (typeof at === 'number' ? at : new Date(at).getTime())

/** Is this single transition the shape of throwing an untouched lead away? */
export function isNeglectTransition(t: Pick<StatusTransition, 'fromStatus' | 'toStatus' | 'contactCount'>): boolean {
  const from = (t.fromStatus ?? '').trim().toLowerCase()
  const to = (t.toStatus ?? '').trim().toLowerCase()
  return to === 'lost' && OPEN_STATUSES.has(from) && (t.contactCount ?? 0) === 0
}

/**
 * Evaluate ONE actor's transitions against the trailing window that ends at
 * `now` (default: the latest transition). Transitions by other actors are
 * ignored rather than merged — two brokers each moving three cards is not one
 * person moving six.
 */
export function detectBulkStatusEvent(
  transitions: readonly StatusTransition[],
  actor: string,
  opts: { now?: number; threshold?: number; windowMinutes?: number } = {},
): BulkStatusEvent {
  const threshold = opts.threshold ?? BULK_STATUS_THRESHOLD
  const windowMs = (opts.windowMinutes ?? BULK_STATUS_WINDOW_MINUTES) * 60_000
  const own = transitions
    .filter((t) => t.actor === actor && Number.isFinite(ms(t.at)))
    .sort((a, b) => ms(a.at) - ms(b.at))
  const end = opts.now ?? (own.length ? ms(own[own.length - 1].at) : Date.now())
  const inWindow = own.filter((t) => ms(t.at) <= end && end - ms(t.at) <= windowMs)

  const leadIds = [...new Set(inWindow.map((t) => t.leadId))]
  const flagged = leadIds.length >= threshold
  const neglected = flagged
    ? [...new Set(inWindow.filter(isNeglectTransition).map((t) => t.leadId))]
    : []
  return {
    flagged,
    actor,
    leadIds,
    count: leadIds.length,
    windowStart: inWindow.length ? new Date(ms(inWindow[0].at)).toISOString() : null,
    windowEnd: inWindow.length ? new Date(ms(inWindow[inWindow.length - 1].at)).toISOString() : null,
    neglectCleaning: flagged && neglected.length * 2 >= leadIds.length,
    neglectedLeadIds: neglected,
  }
}
