import { describe, expect, it } from "vitest"
import { buildRunQuery } from "@/lib/agent-runtime/queries"
import { runBodySchema, assertAdmin } from "@/lib/agent-runtime/validators"

function sqlText(sql: unknown) {
  const fragment = sql as { strings?: string[] }
  if (fragment?.strings) return fragment.strings.join("")
  return String(sql)
}

describe("agent runtime validation", () => {
  it("requires ranked inputs when ranked is true", () => {
    expect(() =>
      runBodySchema.parse({
        risk_profile: "Balanced",
        horizon: "1-2yr",
        ranked: true,
      }),
    ).toThrow()
  })

  it("requires admin for overrides", () => {
    expect(() => assertAdmin(false)).toThrow("Not authorized")
  })
})

describe("agent runtime queries", () => {
  it("uses routed function for default path without speculative override", () => {
    const sql = buildRunQuery({
      riskProfile: "Conservative",
      horizon: "Ready",
      ranked: false,
      overrideActive: false,
      overrideFlags: { allow2030Plus: false, allowSpeculative: false },
    })

    const text = sqlText(sql)
    expect(text).toContain("automation_inventory_for_investor_v1")
    expect(text).not.toContain("Speculative")
  })

  it("limits results to 10 and keeps price numeric", () => {
    const sql = buildRunQuery({
      riskProfile: "Balanced",
      horizon: "1-2yr",
      ranked: false,
      overrideActive: false,
      overrideFlags: { allow2030Plus: false, allowSpeculative: false },
    })

    const text = sqlText(sql)
    expect(text).toContain("LIMIT 10")
    expect(text).toContain("price_aed")
    expect(text).not.toContain("price_aed::text")
  })
})
