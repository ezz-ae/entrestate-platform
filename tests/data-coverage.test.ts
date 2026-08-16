import { describe, expect, it } from "vitest"
import { buildCoverageSummary, buildEmptyCoverageSummary } from "@/lib/data-coverage"

describe("data coverage summary", () => {
  it("computes field-level coverage and a blended score", () => {
    const summary = buildCoverageSummary(
      [
        { name: "A", price: 10, yield: 5.1, tags: ["buy"] },
        { name: "B", price: null, yield: 4.8, tags: [] },
        { name: "C", price: 12, yield: null, tags: ["hold"] },
      ],
      [
        { key: "price", label: "Price", pick: (row) => row.price },
        { key: "yield", label: "Yield", pick: (row) => row.yield },
        { key: "tags", label: "Tags", pick: (row) => row.tags },
      ],
    )

    expect(summary.total).toBe(3)
    expect(summary.score).toBeCloseTo(66.7, 1)
    expect(summary.status).toBe("mixed")
    expect(summary.fields.map((field) => field.pct)).toEqual([66.7, 66.7, 66.7])
  })

  it("returns an empty gap summary when there are no rows", () => {
    const summary = buildEmptyCoverageSummary([{ key: "price", label: "Price" }])

    expect(summary.total).toBe(0)
    expect(summary.score).toBe(0)
    expect(summary.status).toBe("gap")
    expect(summary.fields[0]).toMatchObject({
      key: "price",
      pct: 0,
      status: "gap",
    })
  })
})
