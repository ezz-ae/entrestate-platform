/**
 * THE PRICE OF A LEAD — the one computation the tenant API must never leak.
 *
 * THE MARGIN IS 25 %, BY THE OWNER'S RULING (2026-08-31, "اعتمد التقديم").
 * The submission and engine-11-cash-v4.md state the marketplace formula as
 *
 *     P_lead = C_gen × 1.25
 *
 * and for a while the code shipped something else — 1.5× with a 150 AED
 * clamp — which made the published claim untrue for every lead sold. The
 * owner was asked which number is the truth and chose the submission's, so
 * the DEFAULT is now exactly the spec's formula, and the guard
 * (scripts/ctrl-marketplace-test.ts) pins the arithmetic so the two can
 * never drift apart silently again.
 *
 * Two shapes, both set per tenant in the admin dashboard:
 *
 *   · fixed_fils set    → every lead costs exactly that. Predictable, and the
 *                         right opening offer for a new tenant.
 *   · otherwise         → price = round(cost × multiplier), where cost is OUR
 *                         cost per lead on the campaign at the moment the
 *                         lead arrives. No clamp on top: 25 % means 25 %,
 *                         and a cheap week for us is a cheap lead for the
 *                         partner — that is the marketplace's honesty.
 *
 * THE FLOOR'S ONE REMAINING JOB: the price when no cost is computable (a
 * brand-new campaign with no spend data). Never zero — a lead handed over
 * free by accident is margin gone AND a wrong number taught to the tenant's
 * expectations. It no longer overrides a real measured cost; the old
 * "lucky cheap week" clamp is exactly what the ruling retired.
 *
 * Pure — provable in guards without a database.
 */

export interface PricingRule {
  multiplier: number
  /** The no-cost-data price ONLY — never a clamp over a measured cost. */
  floorFils: number
  fixedFils: number | null
}

/** The spec's own numbers: 25 % margin; 150 AED when cost is unknowable. */
export const DEFAULT_RULE: PricingRule = { multiplier: 1.25, floorFils: 15000, fixedFils: null }

export function priceLeadFils(costFils: number | null, rule: PricingRule): number {
  if (rule.fixedFils !== null && Number.isFinite(rule.fixedFils) && rule.fixedFils > 0) {
    return Math.round(rule.fixedFils)
  }
  const floor = Number.isFinite(rule.floorFils) && rule.floorFils > 0 ? Math.round(rule.floorFils) : DEFAULT_RULE.floorFils
  if (costFils === null || !Number.isFinite(costFils) || costFils <= 0) return floor
  const mult = Number.isFinite(rule.multiplier) && rule.multiplier > 0 ? rule.multiplier : DEFAULT_RULE.multiplier
  return Math.round(costFils * mult)
}

export const filsToAed = (fils: number): string =>
  (Math.round(fils) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
