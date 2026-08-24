/**
 * THE PRICE OF A LEAD — the one computation the tenant API must never leak.
 *
 * Two shapes, both set per tenant in the admin dashboard:
 *
 *   · fixed_fils set    → every lead costs exactly that. Predictable, and the
 *                         right opening offer for a new tenant.
 *   · otherwise         → price = max(floor, round(cost × multiplier)) where
 *                         cost is OUR cost per lead on the campaign at the
 *                         moment the lead arrives. The floor exists because a
 *                         lucky cheap week must not sell leads below what the
 *                         operation is worth to us; the multiplier is the
 *                         margin.
 *
 * When we cannot compute a cost (a brand-new campaign with no spend data),
 * the price is the floor — never zero: a lead handed over free by accident
 * is margin gone AND a wrong number taught to the tenant's expectations.
 *
 * Pure — provable in guards without a database.
 */

export interface PricingRule {
  multiplier: number
  floorFils: number
  fixedFils: number | null
}

export const DEFAULT_RULE: PricingRule = { multiplier: 1.5, floorFils: 15000, fixedFils: null }

export function priceLeadFils(costFils: number | null, rule: PricingRule): number {
  if (rule.fixedFils !== null && Number.isFinite(rule.fixedFils) && rule.fixedFils > 0) {
    return Math.round(rule.fixedFils)
  }
  const floor = Number.isFinite(rule.floorFils) && rule.floorFils > 0 ? Math.round(rule.floorFils) : DEFAULT_RULE.floorFils
  if (costFils === null || !Number.isFinite(costFils) || costFils <= 0) return floor
  const mult = Number.isFinite(rule.multiplier) && rule.multiplier > 0 ? rule.multiplier : DEFAULT_RULE.multiplier
  return Math.max(floor, Math.round(costFils * mult))
}

export const filsToAed = (fils: number): string =>
  (Math.round(fils) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
