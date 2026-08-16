import { describe, expect, it } from "vitest"
import { createTimeTable, sampleTimeTableRows } from "@/lib/time-table"
import { tableSpecTemplates } from "@/lib/tablespec"

describe("Time Table", () => {
  it("computes signals and paginates rows", () => {
    const spec = tableSpecTemplates.underwrite_development_site
    const table = createTimeTable(spec, sampleTimeTableRows)
    const preview = table.preview(2)

    expect(preview.rows).toHaveLength(2)
    expect(preview.rows[0]).toHaveProperty("_rowId")
    expect(preview.rows[0]).toHaveProperty("_timestamp")
    expect(preview.rows[0]).toHaveProperty("yield_score")
    expect(preview.rows[0]).toHaveProperty("risk_score")
    expect(preview.rows[0]).toHaveProperty("liquidity_score")

    const page = table.paginate(1, 2)
    expect(page.total).toBe(sampleTimeTableRows.length)
    expect(page.rows).toHaveLength(2)
    expect(page.rows[0]?._rowId).toBeTruthy()
  })
})
