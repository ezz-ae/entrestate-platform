import { describe, expect, it } from "vitest"
import { compileTableSpec } from "@/lib/tablespec"

describe("TableSpec compiler", () => {
  it("returns a golden path template", () => {
    const result = compileTableSpec({ goldenPath: "underwrite_development_site" })
    expect(result.source).toBe("golden_path")
    expect(result.spec.signals).toContain("gfa_sqm")
    expect(result.spec.row_grain).toBe("project")
  })

  it("parses basic intent into filters", () => {
    const result = compileTableSpec({ intent: "Find 2BR in JVC under 2m AED" })
    const filters = result.spec.filters
    expect(result.spec.row_grain).toBe("asset")
    expect(result.spec.scope.areas).toContain("JVC")
    expect(filters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "price_from_aed", op: "lte", value: 2000000 }),
        expect.objectContaining({ field: "beds", op: "eq", value: 2 }),
      ]),
    )
  })

  it("enforces price_from_aed over generic price fields", () => {
    const result = compileTableSpec({ intent: "Projects under 1m price" })
    const priceFilter = result.spec.filters.find(f => f.field === "price_from_aed")
    expect(priceFilter).toBeDefined()
    expect(priceFilter?.op).toBe("lte")
    expect(priceFilter?.value).toBe(1000000)
  })

  it("includes provenance metadata (reasoning & dataSource)", () => {
    const result = compileTableSpec({ intent: "Top yield in Marina" })
    expect(result.spec.reasoning).toBeDefined()
    expect(result.spec.dataSource).toBeDefined()
    expect(typeof result.spec.reasoning).toBe("string")
  })
})
