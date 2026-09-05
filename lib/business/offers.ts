/**
 * CREDIT OFFERS — the only kind of offer this company makes.
 *
 * The owner's school, verbatim: "You will have a hundred ways to take money
 * afterwards; the idea is that you use VALUE. 'Try me' is a bad strategy.
 * 'Buy me and get a gift' is bad too. 50–60% off is the worst of the worst.
 * Cashback is respect. 'Take these, spend them on me' — that is the school."
 * And: "forget free — free never sells again."
 *
 * So there is no trial, no discount, no gift. There is CREDIT: an amount
 * put on the account, claimed with a code, that comes off the account's
 * bills. Three rules, all his:
 *
 *   1. COUPON → CLAIM → CREDIT. Nothing lands without a claim. A code is a
 *      thing the person does; a balance that appears by itself is a gift,
 *      and gifts are out.
 *   2. CREDIT IS SPENT INSIDE THE SYSTEM. It is deducted from invoices —
 *      subscription, apps, pages. It is never paid out and never becomes ad
 *      spend, except the part of an offer that SAYS ads: that part becomes a
 *      request on the Ads Coin wallet, which a person approves in the
 *      finance screen (the standing money rule — no coin moves anywhere
 *      else).
 *   3. NOT ALL AT ONCE. Each invoice takes at most a share of itself from
 *      the credit — "50–60%, depending on the invoice" — and the rest of
 *      the credit waits for the next one. The share is a HOUSE number,
 *      never printed: "we will not tell him the percentage; he will find
 *      it deducted." So the cap lives here and nowhere on a screen.
 *
 * Pure — no I/O. lib/account-credit.ts moves the numbers; this file decides
 * them; scripts/credit-offers-test.ts holds both to the three rules.
 */

export type OfferId = 'welcome' | 'six_month_meta' | 'annual_cashback'

export interface Offer {
  id: OfferId
  /** The code a person types. Upper case, no spaces. */
  code: string
  /** One line for a screen — what they get, never how the cap works. */
  headline: string
  /** Credit that comes off invoices, in AED. */
  systemAed: number
  /**
   * Credit that becomes an Ads Coin REQUEST (pending a person's approval),
   * in AED. Only an offer that says "ads" carries any.
   */
  adsAed: number
  /** What has to be true on the account for the claim to land. */
  requires: 'account' | 'six_month_plan' | 'annual_plan'
}

export const OFFERS: readonly Offer[] = [
  {
    // "When you put AED 500 in his wallet it is far better than 50% off or
    // half a month free."
    id: 'welcome',
    code: 'WELCOME500',
    headline: 'AED 500 on your account when you start — it comes off your bills.',
    systemAed: 500,
    adsAed: 0,
    requires: 'account',
  },
  {
    // "Meta credit cashback AED 1,000 on the six-month membership."
    id: 'six_month_meta',
    code: 'SIXMONTH1000',
    headline: 'AED 1,000 of ad credit back on a six-month plan.',
    systemAed: 0,
    adsAed: 1_000,
    requires: 'six_month_plan',
  },
  {
    // "90% cashback on the annual subscription, 30% of it spendable on ads."
    // Amounts are computed from the plan price at claim time (annualCashback).
    id: 'annual_cashback',
    code: 'ANNUAL90',
    headline: '90% of your annual plan back as credit — a third of it for ads.',
    systemAed: 0,
    adsAed: 0,
    requires: 'annual_plan',
  },
] as const

export const OFFER_IDS = OFFERS.map((o) => o.id)

/** The annual offer's split, from the plan price: 90% back, 30 points of it as ads. */
export const ANNUAL_CASHBACK = { backPct: 90, adsPct: 30 } as const

export function annualCashback(annualPriceAed: number): { systemAed: number; adsAed: number } {
  const total = Math.round(annualPriceAed * ANNUAL_CASHBACK.backPct) / 100
  const ads = Math.round(annualPriceAed * ANNUAL_CASHBACK.adsPct) / 100
  return { systemAed: Math.round((total - ads) * 100) / 100, adsAed: ads }
}

export function offerByCode(raw: string): Offer | null {
  const code = String(raw ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  return OFFERS.find((o) => o.code === code) ?? null
}

/* ── the invoice rule ───────────────────────────────────────────────────── */

export type InvoiceKind = 'subscription' | 'app' | 'pages' | 'other'

/**
 * The house cap — the most an invoice may take from the credit, as a share
 * of itself. "50–60%, depending on the invoice." Never shown; a screen
 * shows the deduction, not the rule.
 */
export const CREDIT_CAP_PCT: Record<InvoiceKind, number> = {
  subscription: 50,
  app: 60,
  pages: 60,
  other: 50,
}

export interface Invoice {
  id: string
  kind: InvoiceKind
  /** In fils (AED × 100), always positive. */
  totalFils: number
  /**
   * For an app invoice, the store id it bills (lib/freehold/app-store.ts) —
   * so credit scoped to that app (lib/business/coupons.ts) can pay it.
   */
  product?: string
}

export interface CreditApplication {
  /** Taken off this invoice, in fils. */
  appliedFils: number
  /** What is still owed on this invoice, in fils. */
  dueFils: number
  /** Credit left on the account after this invoice, in fils. */
  remainingFils: number
}

/**
 * How much of an invoice the credit pays. Pure. The cap is applied to the
 * invoice — rounded UP to a whole dirham, so the AED 999 subscription takes
 * the whole AED 500 welcome credit, which is the owner's own example — then
 * bounded by what the account actually has. Nothing goes negative and an
 * invoice of nothing takes nothing. An app is never paid in full from
 * credit: its cap is a share, so something is always paid.
 */
export function applyCredit(balanceFils: number, invoice: Invoice): CreditApplication {
  const balance = Math.max(0, Math.floor(balanceFils))
  const total = Math.max(0, Math.floor(invoice.totalFils))
  const capAed = Math.ceil((total * CREDIT_CAP_PCT[invoice.kind]) / 100 / 100)
  const cap = Math.min(total, capAed * 100)
  const applied = Math.min(balance, cap)
  return { appliedFils: applied, dueFils: total - applied, remainingFils: balance - applied }
}

/* ── the code ───────────────────────────────────────────────────────────── */

/**
 * A code is issued ONCE per human — "by device, network, email, everything"
 * — so it is minted per account, not shared: WELCOME-7K3M. The offer's
 * `code` above is the family name; the suffix is the person's.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function mintCode(offer: Offer, random: () => number = Math.random): string {
  let suffix = ''
  for (let i = 0; i < 4; i++) suffix += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]
  return `${offer.code}-${suffix}`
}

/** The offer a minted code belongs to, or null. Tolerant of case and spacing. */
export function offerOfCode(raw: string): Offer | null {
  const clean = String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '')
  const family = clean.split('-')[0]
  return OFFERS.find((o) => o.code === family) ?? null
}

export const filsToAedText = (fils: number): string => (fils / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
