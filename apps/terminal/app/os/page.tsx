import { getMarketPulseSummary } from "@/lib/frontend-content"
import { getCompleteIntelligenceSynthesis } from "@/lib/ai/enterprise/service"
import { EnterpriseDashboard } from "./enterprise-dashboard"

export const dynamic = "force-dynamic"

export default async function OsPage() {
  const [pulse, intelligence] = await Promise.all([
    getMarketPulseSummary().catch(() => ({
      summary: { total: 0, avg_price: null, avg_yield: null, buy_signals: 0, high_confidence: 0 },
    })),
    getCompleteIntelligenceSynthesis().catch(() => null)
  ])

  return (
    <main id="main-content">
      <EnterpriseDashboard
        summary={{
          total: pulse.summary.total,
          avgPrice: pulse.summary.avg_price,
          avgYield: pulse.summary.avg_yield,
          buySignals: pulse.summary.buy_signals,
          highConfidence: pulse.summary.high_confidence,
        }}
        intelligence={intelligence ? {
          marketRegime: intelligence.marketRegime ?? "Analyzing...",
          marketSummary: intelligence.marketSummary ?? "",
          riskBias: intelligence.riskBias,
          yieldVsSafety: intelligence.yieldVsSafety
        } : undefined}
      />
    </main>
  )
}
