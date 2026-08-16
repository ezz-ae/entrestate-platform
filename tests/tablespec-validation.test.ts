import { describe, expect, it } from "vitest"
import { validateTableSpec, tableSpecTemplates } from "@/lib/tablespec"

describe("TableSpec validation", () => {
  it("accepts allowed signals and filters", () => {
    const spec = tableSpecTemplates.underwrite_development_site
    const result = validateTableSpec(spec)
    expect(result.valid).toBe(true)
  })

  it("rejects disallowed signals", () => {
    const spec = {
      ...tableSpecTemplates.underwrite_development_site,
      signals: ["not_allowed"],
    }
    const result = validateTableSpec(spec)
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain("signal_not_allowed")
  })
})
