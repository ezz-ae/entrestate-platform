import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { buildDealScreenerQuery } from "@/lib/copilot/executor"
import { collectGuardrailWarnings, validateToolOutput } from "@/lib/copilot/guardrails"
import {
  copilotSystemPrompt,
  dealScreenerInputSchema,
  developerDueDiligenceInputSchema,
  generateInvestorMemoInputSchema,
} from "@/lib/copilot/tools"

function sqlText(sql: unknown) {
  const fragment = sql as { strings?: string[] }
  if (fragment?.strings) return fragment.strings.join("")
  return String(sql)
}

describe("copilot schemas", () => {
  it("accepts screener request for 2BR under AED 2M with BUY signal", () => {
    const parsed = dealScreenerInputSchema.parse({
      filters: {
        budget_max_aed: 2_000_000,
        beds_min: 2,
        beds_max: 2,
        timing_label: "BUY",
      },
      sort_by: "investor_score_v1",
      limit: 10,
    })

    expect(parsed.filters.budget_max_aed).toBe(2_000_000)
    expect(parsed.filters.timing_label).toBe("BUY")
  })

  it("requires decision engine identity in system prompt", () => {
    expect(copilotSystemPrompt).toContain("YOU ARE A DECISION ENGINE")
  })

  it("accepts developer due diligence lookup", () => {
    const parsed = developerDueDiligenceInputSchema.parse({ developer_name: "Emaar" })
    expect(parsed.developer_name).toBe("Emaar")
  })

  it("accepts investor memo generation payload", () => {
    const parsed = generateInvestorMemoInputSchema.parse({
      project_name: "Marina Vista",
      sections: ["price_reality", "area_risk", "developer", "stress_test"],
    })
    expect(parsed.project_name).toBe("Marina Vista")
    expect(parsed.sections).toHaveLength(4)
  })
})

describe("copilot route", () => {
  it("enforces required tool choice", () => {
    const routePath = path.join(process.cwd(), "app/api/copilot/route.ts")
    const source = fs.readFileSync(routePath, "utf8")
    expect(source).toContain('toolChoice: "required"')
  })
})

describe("copilot SQL builder", () => {
  it("builds deal screener SQL with key filters", () => {
    const sql = buildDealScreenerQuery(
      dealScreenerInputSchema.parse({
        filters: {
          budget_max_aed: 2_000_000,
          beds_min: 2,
          beds_max: 2,
          timing_label: "BUY",
        },
        sort_by: "investor_score_v1",
        limit: 10,
      }),
    )

    const text = sqlText(sql)
    expect(text).toContain("FROM")
    expect(text).toContain("price_from_aed <=")
    expect(text).toContain("COALESCE(bedrooms_max, bedrooms_min) >=")
    expect(text).toContain("COALESCE(bedrooms_min, bedrooms_max) <=")
    expect(text).toContain("COALESCE(price_confidence, 'LOW') IN ('MEDIUM', 'HIGH')")
    expect(text).toContain("TRIM(COALESCE(developer, '')) <>")
    expect(text).toContain("timing_label =")
    expect(text).toContain("ORDER BY investor_score_v1 DESC")
    expect(text).toContain("LIMIT")
  })
})

describe("copilot guardrails", () => {
  it("flags low confidence and missing DLD overlays", () => {
    expect(validateToolOutput({ l1_confidence: "LOW" }).warning).toContain("LOW confidence")
    expect(validateToolOutput({ l4_dld_avg_txn_price: null }).warning).toContain("No DLD transaction")
  })

  it("collects warnings recursively from arrays", () => {
    const warnings = collectGuardrailWarnings({
      rows: [
        { l1_confidence: "LOW" },
        { l1_canonical_price: null },
        { l4_dld_avg_txn_price: null },
      ],
    })

    expect(warnings).toContain("LOW confidence — limited data sources")
    expect(warnings).toContain("Price data unavailable")
    expect(warnings).toContain("No DLD transaction overlay available")
  })
})
