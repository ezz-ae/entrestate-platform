import { describe, expect, it } from "vitest"
import { rankRows } from "@/lib/scoring"
import { createTimeTable } from "@/lib/time-table"
import { tableSpecTemplates } from "@/lib/tablespec"

const profile = {
  riskAppetite: "balanced",
  horizon: "1-2yr",
  yieldBias: 0.5,
  safetyBias: 0.5,
  preferredAreas: ["jvc"],
  budgetAed: 2000000,
  beds: 2,
}

describe("Scoring engine", () => {
  it("ranks rows with market and match scores", () => {
    const spec = tableSpecTemplates.underwrite_development_site
    const table = createTimeTable(spec)
    const ranked = rankRows(table.materialize(), profile)

    expect(ranked.length).toBeGreaterThan(0)
    expect(ranked[0]).toHaveProperty("market_score")
    expect(ranked[0]).toHaveProperty("match_score")
    expect(ranked[0]).toHaveProperty("total_score")
  })
})
