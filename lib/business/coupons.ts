/**
 * COUPONS AND VOUCHERS — the general marketing system, on top of the credit.
 *
 * The owner, verbatim: "This system of coupons and codes is our marketing
 * system in general. We will market by giving coupon numbers to the coupon
 * sites at AED 20, 40, 60. We will sell big vouchers on the gift sites. We
 * will play with ad credit on Meta for Realtors, and use it and the landing
 * builder as the bait."
 *
 * lib/business/offers.ts is the house's own three offers — welcome,
 * six-month, annual — one code per human, minted by the account page. THIS
 * file is everything the house hands to the outside: a CAMPAIGN is a batch
 * of credit with a source, an amount, a scope and a limit, and it comes in
 * two shapes.
 *
 *   COUPON   one shared code, printed on a coupon site, redeemed by many
 *            accounts — once per account, once per human, until the campaign
 *            is used up or runs out of time. "DXB40 — AED 40 on your account."
 *   VOUCHER  a batch of single-use codes, each one bought on a gift site and
 *            given to somebody. A voucher was paid for, so it is not limited
 *            per human — one code, one landing, and that is the whole rule.
 *
 * Every campaign lands as CREDIT — the same ledger, the same invoice rule
 * (applyCredit), the same words: an amount in AED that comes off the bills.
 * The SCOPE says which bills: 'bills' is any of them; 'pages' is the landing
 * builder's; 'app:<id>' is one app's; 'ads' does not touch the bills at all —
 * it becomes a pending ad-credit request on the account's Ads Coin wallet,
 * the one bridge to the money core, approved by a person (the standing rule).
 * That is the bait: "AED 100 of ad credit on Meta for Realtors" and "AED 60
 * on Landing Pages" are campaigns with a scope, not new mechanisms.
 *
 * Pure — no I/O. lib/coupon-campaigns.ts moves the rows;
 * scripts/coupon-campaigns-test.ts holds both to the rules.
 */
import { OFFERS, type Invoice } from './offers'
import { getProduct } from '@/lib/freehold/app-store'

export type CampaignKind = 'coupon' | 'voucher'
export const CAMPAIGN_KINDS: readonly CampaignKind[] = ['coupon', 'voucher'] as const

/**
 * Where a campaign's credit spends. `bills` is any invoice; `pages` is the
 * landing builder's invoices; `app:<store id>` is one app's; `ads` is ad
 * credit — a REQUEST on the Ads Coin wallet, never a posting in the ledger.
 */
export type CreditScope = 'bills' | 'pages' | 'ads' | `app:${string}`

/** The scopes a desk can pick from. Walkable so the desk's <select> and the guard read one list. */
export const SCOPE_CHOICES: readonly CreditScope[] = ['bills', 'pages', 'app:meta-for-realtors', 'app:web-designer', 'ads'] as const

export function isCreditScope(raw: string): raw is CreditScope {
  if (raw === 'bills' || raw === 'pages' || raw === 'ads') return true
  if (!raw.startsWith('app:')) return false
  const id = raw.slice(4)
  return /^[a-z0-9-]{2,40}$/.test(id) && getProduct(id) !== undefined
}

/** What the scope is called on a screen — a reader's words, never the key. */
export function scopeLabel(scope: CreditScope): string {
  if (scope === 'bills') return 'any bill'
  if (scope === 'pages') return 'Landing Pages'
  if (scope === 'ads') return 'ad credit'
  return getProduct(scope.slice(4))?.name ?? scope.slice(4)
}

/**
 * The bounds, in AED — house numbers. A coupon below AED 20 is not worth a
 * coupon site's listing and above AED 500 is a voucher by another name; a
 * voucher is sold, so it starts where a gift starts and stops where a typo
 * on the desk would give away a month's revenue.
 */
export const COUPON_AED = { min: 20, max: 500, ladder: [20, 40, 60] as const } as const
export const VOUCHER_AED = { min: 100, max: 10_000, ladder: [250, 500, 1_000, 2_500] as const } as const
/** A batch of vouchers, at most, in one minting — enough for a gift site's first listing. */
export const VOUCHER_BATCH_MAX = 500

export function amountAllowed(kind: CampaignKind, aed: number): boolean {
  if (!Number.isFinite(aed) || aed !== Math.floor(aed)) return false
  const b = kind === 'coupon' ? COUPON_AED : VOUCHER_AED
  return aed >= b.min && aed <= b.max
}

/* ── the code ───────────────────────────────────────────────────────────── */

/** Case and spacing are the reader's; the code is upper case with no space. */
export const normalizeCode = (raw: string): string => String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '')

/** No 0/O or 1/I — nothing to misread on a phone or a printed voucher. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const chunk = (n: number, random: () => number): string => {
  let s = ''
  for (let i = 0; i < n; i++) s += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]
  return s
}

/** A voucher code: V500-K7PM-Q2XD — the amount in the family, eight letters of the holder's. */
export function mintVoucherCode(amountAed: number, random: () => number = Math.random): string {
  return `V${Math.floor(amountAed)}-${chunk(4, random)}-${chunk(4, random)}`
}

/** A coupon code the desk did not name: ENTRE40-K7PM. */
export function mintCouponCode(amountAed: number, random: () => number = Math.random): string {
  return `ENTRE${Math.floor(amountAed)}-${chunk(4, random)}`
}

const VOUCHER_GRAMMAR = /^V\d+-[A-Z2-9]{4}-[A-Z2-9]{4}$/

/**
 * A coupon code the desk chose: letters, digits and hyphens, four to
 * twenty-four long, and never a house offer's family (WELCOME500…) or the
 * voucher grammar — the redeem path reads the family first, and a coupon
 * that spells like an offer would be read as one.
 */
export function couponCodeAllowed(code: string): boolean {
  const c = normalizeCode(code)
  if (!/^[A-Z0-9][A-Z0-9-]{3,23}$/.test(c)) return false
  if (VOUCHER_GRAMMAR.test(c)) return false
  const family = c.split('-')[0]
  return !OFFERS.some((o) => o.code === family)
}

/* ── the campaign ───────────────────────────────────────────────────────── */

export type CampaignStatus = 'live' | 'paused' | 'ended'

export interface Campaign {
  id: string
  kind: CampaignKind
  /** What the desk calls it: "Coupon site A · Sept". */
  name: string
  /** Where it was placed — the attribution: 'coupons-ae', 'gift-site-b'. */
  source: string
  amountFils: number
  scope: CreditScope
  /** For a coupon: how many accounts may land it; null is no ceiling. A voucher's ceiling is its batch. */
  maxRedemptions: number | null
  validFrom: string
  validUntil: string | null
  status: CampaignStatus
}

export type CampaignRefusal = 'paused' | 'ended' | 'not_yet' | 'expired' | 'used_up'

/**
 * Whether a campaign takes another landing now. Pure: the instant and the
 * count so far are passed in, so the guard can drive every edge.
 */
export function campaignOpen(c: Pick<Campaign, 'status' | 'validFrom' | 'validUntil' | 'maxRedemptions'>, redeemed: number, now: Date): { ok: true } | { ok: false; reason: CampaignRefusal } {
  if (c.status === 'paused') return { ok: false, reason: 'paused' }
  if (c.status === 'ended') return { ok: false, reason: 'ended' }
  const from = new Date(c.validFrom).getTime()
  if (Number.isFinite(from) && from > now.getTime()) return { ok: false, reason: 'not_yet' }
  if (c.validUntil) {
    const until = new Date(c.validUntil).getTime()
    if (Number.isFinite(until) && until <= now.getTime()) return { ok: false, reason: 'expired' }
  }
  if (c.maxRedemptions !== null && redeemed >= c.maxRedemptions) return { ok: false, reason: 'used_up' }
  return { ok: true }
}

/* ── which credit pays which bill ───────────────────────────────────────── */


/**
 * The scopes an invoice may draw on, NARROW FIRST — an app's own credit is
 * spent before the general credit, so the bait is used where it was aimed
 * and the general balance stays for the next bill. 'ads' is never here: it is
 * not a bill.
 */
export function scopesForInvoice(invoice: Pick<Invoice, 'kind' | 'product'>): CreditScope[] {
  const scopes: CreditScope[] = []
  if (invoice.kind === 'app' && invoice.product) scopes.push(`app:${invoice.product}`)
  if (invoice.kind === 'pages') scopes.push('pages')
  scopes.push('bills')
  return scopes
}

/**
 * Split an application across the scopes it may draw on, narrow first.
 * Pure: `applied` is what applyCredit decided; this only says which pocket
 * each fils comes from. Returns only the pockets that paid something.
 */
export function splitAcrossScopes(applied: number, balances: Partial<Record<CreditScope, number>>, scopes: CreditScope[]): Array<{ scope: CreditScope; fils: number }> {
  let left = Math.max(0, Math.floor(applied))
  const out: Array<{ scope: CreditScope; fils: number }> = []
  for (const scope of scopes) {
    if (left <= 0) break
    const have = Math.max(0, Math.floor(balances[scope] ?? 0))
    const take = Math.min(have, left)
    if (take > 0) { out.push({ scope, fils: take }); left -= take }
  }
  return out
}
