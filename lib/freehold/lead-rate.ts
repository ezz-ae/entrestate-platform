/**
 * ENGINE 06 — THE LEAD RATE. One number on every lead, 0 to 10.
 *
 * The CRM already knew a great deal about each lead — a pipeline status, a
 * broker's 0–10 value judgment, a landing-page behaviour score, whether the
 * phone was dialable, whether a viewing was booked, whether a deal record
 * closed — and every screen and every audience read a DIFFERENT subset of it.
 * The follow-up queue sorted by temperature, the seed cohort by its own
 * quality score, the Ads Machine by the human rating. Nothing on the lead
 * itself said, in one figure, how far this person is from buying.
 *
 * The Rate is that figure, and it is a CONTROL SIGNAL, not a report: the
 * audience seed excludes what it marks junk, the neglect gate fires on what
 * it marks peak, and the learning loop reseeds on what it marks won.
 *
 * THE LADDER (docs/spec/engine-06-lead-rate-v6.md §2):
 *
 *     0      blocked — the person asked not to be contacted, or was a fraud
 *     1–3    inbound: verified contact details and declared intent
 *     4–7    engagement: contacted → qualified → viewing → negotiation
 *     8      PEAK — the highest an OPEN lead can ever be: the broker's
 *            5-star call, or a convergent second inquiry (Engine 07)
 *     9      WON — a human moved the card to closed, or a deal record closed
 *     10     MASTER — a repeat buyer / institutional anchor, flagged by hand
 *
 * TWO RULES THE FUNCTION CANNOT BREAK, by construction:
 *
 *   · Human-in-the-loop. 9 and 10 come only from a human act — the pipeline
 *     status a person set, a deal record a person approved, a master flag a
 *     manager ticked. No behaviour signal, no rating overlay and no duplicate
 *     inquiry reaches past RATE_OPEN_CAP. A model may lift a lead to 8; it may
 *     never declare a sale.
 *   · No fake ratings. Every input here is a FACT on the row (a status, a
 *     dialable phone, a booked viewing). A lead nobody has evaluated shows the
 *     baseline its facts earn, never an estimate of what it might be worth.
 *
 * DECAY. An open lead loses one point per RATE_DECAY_DAYS without a touch,
 * never below RATE_DECAY_FLOOR. That is what makes "worst first" mean
 * something: a peak lead nobody has spoken to for a month is not a peak lead.
 * Won, master and blocked never decay — they are outcomes, not opportunities.
 *
 * Pure — no I/O. lib/freehold/lead-rate-db.ts gathers the facts and writes the
 * result; scripts/lead-rate-test.ts pins every rung of the ladder.
 */
import { AVOID_RATING, PERFECT_RATING, VALUABLE_RATING, WON_STATUSES } from '@/lib/freehold/lead-stages'
import { DEEP_READ_SCORE } from '@/lib/freehold/seed-cohort'

export const RATE_BLOCKED = 0
export const RATE_JUNK = 1
/** The highest rate an open (unclosed) lead can hold. */
export const RATE_OPEN_CAP = 8
export const RATE_WON = 9
export const RATE_MASTER = 10

/** One point off per fortnight of silence; never below the floor. */
export const RATE_DECAY_DAYS = 14
export const RATE_DECAY_FLOOR = 1

/**
 * Off-hours in Asia/Dubai. The spec's example is an Arabic WhatsApp ping at
 * 2:47 AM: somebody who registers outside working hours is acting on their own
 * urgency, not on an ad's schedule, and enters at 3.
 */
export const OFF_HOURS_START = 22
export const OFF_HOURS_END = 8

/**
 * Words in an enquiry that declare an investment motive, in the three
 * languages the product speaks. Matched case-insensitively as substrings —
 * Arabic and Russian carry no word boundaries a regex could honour.
 */
export const INVESTMENT_INTENT_TERMS = [
  'invest', 'yield', 'roi', 'rental return', 'resale', 'capital growth', 'portfolio',
  'استثمار', 'عائد', 'إيجار', 'ايجار',
  'инвест', 'доходност', 'аренд',
] as const

/**
 * Every reason the engine can give, enumerated so the UI can say it in three
 * languages (scripts/dynamic-keys-test.ts walks this list against
 * `crm.rate.reason.*`) and so a new rung cannot ship without its words.
 */
export const RATE_REASONS = [
  'blocked',
  'master',
  'won',
  'lost',
  'avoid_rated',
  'ingest_thin',
  'ingest_verified',
  'ingest_intent',
  'contacted',
  'contacted_documented',
  'qualified',
  'qualified_viewing',
  'viewing',
  'viewing_held',
  'negotiation',
  'peak_rated',
  'peak_convergent',
] as const
export type RateReason = (typeof RATE_REASONS)[number]

export const RATE_BANDS = ['blocked', 'avoid', 'ingest', 'engaged', 'peak', 'won', 'master'] as const
export type RateBand = (typeof RATE_BANDS)[number]

const OPEN_STATUSES = new Set(['', 'new', 'contacted', 'qualified', 'viewing', 'negotiation'])

export interface RateFacts {
  /** CRM pipeline status; null/empty reads as 'new'. */
  status: string | null
  blocked: boolean | null
  /** The manager's master-lead flag — a human act, never inferred. */
  masterLead: boolean | null
  /** A deal record in approved/closed for this lead — the objective win. */
  dealClosed: boolean
  /** The broker's one-click 0–10 value judgment; null when never rated. */
  valueRating: number | null
  /** 0–100 landing-page reading score; null without a linked session. */
  behaviourScore: number | null
  buyerIntent: string | null
  /** Declared intent carried on the ad click (?intent=). */
  clickIntent: string | null
  interest: string | null
  message: string | null
  phone: string | null
  email: string | null
  utmSource: string | null
  budgetAed: number | null
  /** Contact touches logged on the lead (calls, meetings, messages). */
  contactCount: number
  viewingScheduled: boolean
  viewingHeld: boolean
  offerMade: boolean
  /** Engine 07 marked a convergent second inquiry; null when never. */
  convergentAt: string | null
  /** The most recent touch of any kind — decay counts from here. */
  lastTouchAt: string | null
  createdAt: string
  /** Evaluation clock, passed in so the rule is deterministic and testable. */
  now: number
}

export interface RateResult {
  rate: number
  band: RateBand
  reason: RateReason
  /** Points removed by decay (0 when none applied). */
  decayedBy: number
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** A UTM source is clean when it is a plain channel token, not pasted junk. */
const CLEAN_UTM = /^[a-z0-9][a-z0-9_.-]{0,63}$/i

export function bandOf(rate: number | null | undefined): RateBand | null {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return null
  if (rate <= RATE_BLOCKED) return 'blocked'
  if (rate >= RATE_MASTER) return 'master'
  if (rate >= RATE_WON) return 'won'
  if (rate >= RATE_OPEN_CAP) return 'peak'
  if (rate >= 4) return 'engaged'
  if (rate >= 2) return 'ingest'
  return 'avoid'
}

/** Hour of day in Asia/Dubai for an ISO timestamp; null when unparseable. */
export function dubaiHour(iso: string): number | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const h = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Dubai' }).format(d))
  // Intl renders midnight as "24" in some engines.
  return Number.isFinite(h) ? h % 24 : null
}

export function isOffHours(iso: string): boolean {
  const h = dubaiHour(iso)
  return h !== null && (h >= OFF_HOURS_START || h < OFF_HOURS_END)
}

export function declaresInvestmentIntent(...texts: Array<string | null | undefined>): boolean {
  const hay = texts.filter(Boolean).join(' ').toLowerCase()
  if (!hay) return false
  return INVESTMENT_INTENT_TERMS.some((term) => hay.includes(term))
}

/** Rates 1–3: what the inbound facts alone earn, before any human touch. */
function ingestRate(f: RateFacts): { rate: number; reason: RateReason } {
  const digits = (f.phone ?? '').replace(/\D/g, '')
  const dialable = digits.length >= 7
  const verifiedPhone = digits.length >= 9
  const validEmail = EMAIL_SHAPE.test((f.email ?? '').trim())
  const utm = (f.utmSource ?? '').trim()
  const utmClean = utm === '' || CLEAN_UTM.test(utm)

  const verified = dialable && (verifiedPhone || validEmail) && utmClean
  if (!verified) return { rate: RATE_JUNK, reason: 'ingest_thin' }

  const intent =
    f.buyerIntent === 'investor' || f.buyerIntent === 'investor_end_user'
    || !!(f.clickIntent ?? '').trim()
    || (typeof f.behaviourScore === 'number' && f.behaviourScore >= DEEP_READ_SCORE)
    || declaresInvestmentIntent(f.interest, f.message)
    || isOffHours(f.createdAt)
  return intent ? { rate: 3, reason: 'ingest_intent' } : { rate: 2, reason: 'ingest_verified' }
}

/** Rates 4–7: what the pipeline status and the logged work earn. */
function engagementRate(status: string, f: RateFacts): { rate: number; reason: RateReason } | null {
  switch (status) {
    case 'contacted':
      return f.budgetAed && f.budgetAed > 0 && (f.interest ?? '').trim()
        ? { rate: 5, reason: 'contacted_documented' }
        : { rate: 4, reason: 'contacted' }
    case 'qualified':
      return f.viewingScheduled ? { rate: 6, reason: 'qualified_viewing' } : { rate: 5, reason: 'qualified' }
    case 'viewing':
      return f.viewingHeld || f.offerMade ? { rate: 7, reason: 'viewing_held' } : { rate: 6, reason: 'viewing' }
    case 'negotiation':
      return { rate: 7, reason: 'negotiation' }
    default:
      return null
  }
}

function decayApplied(rate: number, f: RateFacts): { rate: number; decayedBy: number } {
  const since = f.lastTouchAt ?? f.createdAt
  const ms = f.now - new Date(since).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return { rate, decayedBy: 0 }
  const steps = Math.floor(ms / (RATE_DECAY_DAYS * 86_400_000))
  if (steps <= 0) return { rate, decayedBy: 0 }
  const decayed = Math.max(RATE_DECAY_FLOOR, rate - steps)
  return { rate: decayed, decayedBy: rate - decayed }
}

/**
 * THE rule. Terminal states first (they do not decay), then the open ladder,
 * then the two human overlays and the convergence lift — all capped at 8 —
 * then decay.
 */
export function computeLeadRate(f: RateFacts): RateResult {
  const status = (f.status ?? '').trim().toLowerCase()

  if (f.blocked) return { rate: RATE_BLOCKED, band: 'blocked', reason: 'blocked', decayedBy: 0 }
  if (f.masterLead) return { rate: RATE_MASTER, band: 'master', reason: 'master', decayedBy: 0 }
  if (WON_STATUSES.has(status) || f.dealClosed) return { rate: RATE_WON, band: 'won', reason: 'won', decayedBy: 0 }
  if (status === 'lost') return { rate: RATE_JUNK, band: 'avoid', reason: 'lost', decayedBy: 0 }

  // A broker who rated 0–2 said "stop buying this". That judgment outranks
  // the stage — a lead can sit in 'contacted' and still be junk — and it does
  // not decay because there is nothing below it to decay to.
  const rating = typeof f.valueRating === 'number' && Number.isFinite(f.valueRating) ? f.valueRating : null
  if (rating !== null && rating <= AVOID_RATING) {
    return { rate: RATE_JUNK, band: 'avoid', reason: 'avoid_rated', decayedBy: 0 }
  }

  const open = OPEN_STATUSES.has(status)
  let { rate, reason } = (open && engagementRate(status, f)) || ingestRate(f)

  // The broker's judgment: 6–7 puts a lead on the qualified rung even before
  // the card moves (lead-stages.ts already tells Meta so); 8+ is the 5-star
  // call that makes a peak lead.
  if (rating !== null && rating >= PERFECT_RATING) {
    rate = RATE_OPEN_CAP; reason = 'peak_rated'
  } else if (rating !== null && rating >= VALUABLE_RATING && rate < 5) {
    rate = 5; reason = 'qualified'
  }

  // Engine 07: a convergent second inquiry is the urgency multiplier — the
  // person came back for the same thing in the same place.
  if (f.convergentAt && rate < RATE_OPEN_CAP) {
    rate = RATE_OPEN_CAP; reason = 'peak_convergent'
  }

  rate = Math.min(rate, RATE_OPEN_CAP)
  const decayed = decayApplied(rate, f)
  return { rate: decayed.rate, band: bandOf(decayed.rate) ?? 'ingest', reason, decayedBy: decayed.decayedBy }
}
