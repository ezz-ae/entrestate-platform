import type { ColumnTier } from "@/lib/registry/columns"
import { getUpgradeCopy, type TrustTier } from "@/lib/copy/trust"

export function buildUpgradeCTA(gatedColumns: string[], userTier: ColumnTier | TrustTier) {
  const primaryColumn = gatedColumns[0] ?? "advanced_signal"
  const upgradeCopy = getUpgradeCopy(primaryColumn, userTier)

  return {
    headline: upgradeCopy.headline,
    body: upgradeCopy.body,
    cta: upgradeCopy.cta,
    min_tier_needed: upgradeCopy.min_tier_needed,
  }
}
