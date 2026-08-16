import { describe, expect, it } from "vitest"
import { compileTableSpecWithLLM } from "@/lib/tablespec"

describe("TableSpec LLM compiler", () => {
  it("falls back when LLM is disabled", async () => {
    const original = process.env.TABLESPEC_LLM_ENABLED
    process.env.TABLESPEC_LLM_ENABLED = "false"

    const result = await compileTableSpecWithLLM({ intent: "Find 2BR in JVC under 2m AED" })

    expect(result.warnings).toContain("llm_disabled")
    expect(result.spec.row_grain).toBe("asset")

    process.env.TABLESPEC_LLM_ENABLED = original
  })
})
