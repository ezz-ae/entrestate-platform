/**
 * Credit economy vocabulary shared by server (credits-db.ts) and client pages.
 * Kept free of server-only imports so 'use client' components can import it.
 */

/** Real tier vocabulary — matches broker_credit_accounts.tier. */
export const CREDIT_TIERS = ['Starter', 'Growth', 'Pro', 'Elite'] as const
export type CreditTier = (typeof CREDIT_TIERS)[number]

/**
 * Monthly credit quota per tier — the single source of truth for UI + server.
 *
 * The numbers are COMMERCIAL TERMS, not derived from any platform constraint:
 * they are what each subscription tier buys, set by whoever owns Freehold's
 * pricing. There is nothing in the code to balance them against — change them
 * only on a pricing decision, and expect brokers to notice: the grant job
 * tops accounts up to these values every month.
 */
export const TIER_MONTHLY_QUOTA: Record<CreditTier, number> = {
  Starter: 12,
  Growth: 18,
  Pro: 25,
  Elite: 40,
}

export const isCreditTier = (value: unknown): value is CreditTier =>
  typeof value === 'string' && (CREDIT_TIERS as readonly string[]).includes(value)

/** 1 credit = AED 10 of funded ad spend (matches the launch deduction:
 *  creditsToSpend = dailyBudgetAED / CREDIT_VALUE_AED). */
export const CREDIT_VALUE_AED = 10

/**
 * THE TOKEN PRICE — the one number a human must confirm before selling.
 *
 * Deliberately its own constant rather than a reuse of CREDIT_VALUE_AED, which
 * is a different fact: that one is the METER (how fast a running campaign burns
 * tokens), this one is the TILL (what a token costs to buy). They start equal
 * because a token bought at the rate it burns is the honest opening position,
 * and they are free to diverge the day the vendor prices a margin — which is
 * exactly why nothing may derive one from the other.
 *
 * Nothing public quotes a price yet (/business/pricing says "talk to us"), so
 * this constant is the single place a price becomes real.
 */
export const TOKEN_PRICE_AED = 10

/**
 * What a realtor may buy, in whole packs.
 *
 * Packs, not a free-typed amount: the browser must never name its own price,
 * and a fixed ladder is what lets the request row freeze a quote the vendor
 * will honour. Sized against the product's own floor — the marketing promises
 * a minimum AED 50 daily budget, which the meter charges at 5 tokens a day, so
 * the smallest pack is a fortnight of the smallest campaign and the largest is
 * about a quarter of it.
 */
export const TOKEN_PACKS = [
  { credits: 75, aed: 75 * TOKEN_PRICE_AED },
  { credits: 150, aed: 150 * TOKEN_PRICE_AED },
  { credits: 400, aed: 400 * TOKEN_PRICE_AED },
  { credits: 1000, aed: 1000 * TOKEN_PRICE_AED },
] as const

export type TokenPack = (typeof TOKEN_PACKS)[number]

/** The pack for an exact credit count, or null — the server's price check. */
export const packForCredits = (credits: number): TokenPack | null =>
  TOKEN_PACKS.find((p) => p.credits === credits) ?? null

/**
 * Credits reserved for a campaign launch, for EVERY ad platform.
 *
 * One derivation, one rate: Meta and Google must charge a broker the same for
 * the same funded budget, so neither route re-derives "/ 10" of its own. Whole
 * credits only (the ledger column is INTEGER), minimum 1 — a funded campaign is
 * never free.
 *
 * Returns 0 for a non-finite budget so a malformed payload can never produce a
 * NaN charge; every caller must still reject a non-numeric budget BEFORE this
 * point (0 credits = no reservation = a free launch, which is the bug this
 * guard exists to make loud rather than to paper over).
 */
export const creditsForDailyBudget = (dailyBudgetAED: number): number =>
  Number.isFinite(dailyBudgetAED)
    ? Math.max(1, Math.round(dailyBudgetAED / CREDIT_VALUE_AED))
    : 0

/**
 * Days a balance funds at a given daily budget — the only honest way to show a
 * token count to someone who thinks in campaigns, and the number the top-up
 * screen leads with. Returns null when the budget cannot burn (0 or invalid),
 * because "infinite days" is not a fact worth printing.
 */
export const daysOfRunway = (balance: number, dailyBudgetAED: number): number | null => {
  // Guard the BUDGET, not the rate derived from it. creditsForDailyBudget
  // floors at 1 because a funded campaign is never free, so a budget of 0
  // burns "1 token a day" — and a `perDay <= 0` test can never fire. Read off
  // the derived rate alone, a zero budget printed a confident runway (75
  // tokens → "75 days") for a campaign that cannot run at all.
  if (!Number.isFinite(dailyBudgetAED) || dailyBudgetAED <= 0) return null
  const perDay = creditsForDailyBudget(dailyBudgetAED)
  if (!Number.isFinite(balance) || balance < 0 || perDay <= 0) return null
  return Math.floor(balance / perDay)
}

/**
 * Ledger reference prefix for the monthly tier grant: `cycle:YYYY-MM`.
 *
 * This IS the idempotency key of the monthly quota — combined with the unique
 * index on (broker_id, type, reference), a calendar month can be granted to a
 * broker exactly once, however many times the rollover is attempted.
 */
export const CYCLE_REFERENCE_PREFIX = 'cycle:'

/** True for a ledger row written by the monthly tier grant. */
export const isCycleGrantReference = (reference: string | null | undefined): boolean =>
  typeof reference === 'string' && reference.startsWith(CYCLE_REFERENCE_PREFIX)

/** Earn rule: 1 credit per AED 1,000 of broker net commission, minimum 1. */
export const EARN_AED_PER_CREDIT = 1000

export const creditsEarnedForCommission = (brokerTotalAED: number): number => {
  if (!Number.isFinite(brokerTotalAED)) return 1
  return Math.max(1, Math.round(brokerTotalAED / EARN_AED_PER_CREDIT))
}

/**
 * Sanity ceiling for a single ledger movement (1,000,000 credits = AED 10M of
 * funded ad spend). Not an economic rule — a fail-closed guard so a typo or a
 * malformed payload can never write an absurd amount into the ledger.
 */
export const MAX_CREDIT_AMOUNT = 1_000_000

/**
 * Every credit movement is a WHOLE, POSITIVE, finite number of credits. The
 * ledger column is INTEGER, so a float would be silently rounded by Postgres
 * and a negative would invert the sign convention (a negative 'spend' ADDS
 * credits). Validated at the library boundary, not just in the API routes.
 */
export const isValidCreditAmount = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  Number.isInteger(value) &&
  value > 0 &&
  value <= MAX_CREDIT_AMOUNT

/**
 * ONE reading of `GET /api/freehold/credits/balance`.
 *
 * The endpoint answers `{ balance: CreditBalance | null }` — an OBJECT with a
 * nested numeric `balance`, or null when the account has no ledger row yet.
 * Four screens each invented their own reading of that body and two of them
 * tested `typeof body.balance === 'number'`, which is false on EVERY
 * successful response: the balance never loaded, the shortfall warning could
 * never fire, and the screen showed "could not read your balance" on a read
 * that succeeded. A wrong number on a money screen is a defect; a permanent
 * false error about a number is the same defect wearing a hat.
 *
 * Kept beside the other credit vocabulary so a fifth screen cannot invent a
 * fifth reading.
 */
export type BalanceRead =
  /** A real number, safe to show and to compare against a launch cost. */
  | { state: 'ok'; balance: number }
  /** No ledger row yet — an honest zero, not a failure. */
  | { state: 'empty' }
  /** 403: this account is not funded by credits at all (company staff). */
  | { state: 'off' }
  /** Anything else. MUST NOT render as a zero. */
  | { state: 'failed' }

export const readBalanceBody = (body: unknown): BalanceRead => {
  if (!body || typeof body !== 'object' || !('balance' in body)) return { state: 'failed' }
  const nested = (body as { balance: unknown }).balance
  if (nested === null) return { state: 'empty' }
  if (!nested || typeof nested !== 'object') return { state: 'failed' }
  const n = (nested as { balance?: unknown }).balance
  return typeof n === 'number' && Number.isFinite(n) ? { state: 'ok', balance: n } : { state: 'failed' }
}
