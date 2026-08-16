import "server-only"
import { prisma } from "@/lib/prisma"
import { getSyncedUser } from "@/lib/auth/sync"

import { getMarketPulseSummary } from "@/lib/frontend-content"

export type MarketRegime = "High-Velocity Expansion" | "Supply-Constrained Plateau" | "Price-Corrective Rebalancing" | "Stable Yield Accumulation"

export type EnterpriseStrategicContext = {
  riskBias: number
  yieldVsSafety: number
  horizon: string
  preferredMarkets: string[]
  isInstitutional: boolean
  marketRegime?: MarketRegime
  marketSummary?: string
}

/**
 * Fetches the user's strategic profile and synthesizes it with live market pulse.
 */
export async function getCompleteIntelligenceSynthesis(): Promise<EnterpriseStrategicContext | null> {
  const user = await getSyncedUser()
  if (!user) return null

  const [profile, pulse] = await Promise.all([
    user.profile || prisma.userProfile.findUnique({ where: { userId: user.id } }),
    getMarketPulseSummary().catch(() => null)
  ])

  // Contextual Intelligence: Determine Market Regime
  // This is a heuristic for "Complete Intelligence" demonstration
  const buySignals = pulse?.summary?.buy_signals ?? 0
  const total = pulse?.summary?.total ?? 1
  const buyRatio = buySignals / total
  
  let regime: MarketRegime = "Stable Yield Accumulation"
  if (buyRatio > 0.15) regime = "High-Velocity Expansion"
  else if (buyRatio < 0.05) regime = "Price-Corrective Rebalancing"
  else if (pulse?.summary?.avg_price && pulse.summary.avg_price > 2500000) regime = "Supply-Constrained Plateau"

  return {
    riskBias: profile?.riskBias ?? 0.65,
    yieldVsSafety: profile?.yieldVsSafety ?? 0.5,
    horizon: profile?.horizon ?? "Ready",
    preferredMarkets: profile?.preferredMarkets ?? [],
    isInstitutional: true,
    marketRegime: regime,
    marketSummary: pulse?.data_as_of ? `Market pulse as of ${pulse.data_as_of}.` : "Market data currently normalizing."
  }
}

export async function getEnterpriseStrategicContext(): Promise<EnterpriseStrategicContext | null> {
  return getCompleteIntelligenceSynthesis()
}

/**
 * Generates an institutional-grade strategic narrative.
 */
export function getStrategicNarrative(context: EnterpriseStrategicContext): string {
  const strategy = context.yieldVsSafety > 0.6 ? "Yield Maximization" : context.yieldVsSafety < 0.4 ? "Capital Appreciation" : "Balanced Growth"
  const risk = context.riskBias > 0.7 ? "Aggressive Opportunistic" : context.riskBias < 0.3 ? "Conservative Defensive" : "Core-Plus"
  
  return `Analyzing through the lens of ${strategy} within a ${context.marketRegime} regime. Decision framework tuned for ${risk} deployment across the ${context.horizon} horizon.`
}
