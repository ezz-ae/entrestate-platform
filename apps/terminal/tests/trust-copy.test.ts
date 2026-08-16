import { describe, expect, it } from "vitest"
import { buildUpgradeCTA } from "@/lib/copy/upgrade"
import { formatProvenance, getScoreExplanation } from "@/lib/copy/trust"

describe("trust copy", () => {
  it("formats provenance with snapshot and run id", () => {
    expect(
      formatProvenance({
        snapshot_ts: "2026-04-10T00:55:00.000Z",
        run_id: "run-123",
      }),
    ).toBe("Data snapshot: 2026-04-10T00:55:00.000Z · Run ID: run-123")
  })

  it("builds upgrade CTA from the benefit map", () => {
    const cta = buildUpgradeCTA(["developer_honesty_index"], "free")
    expect(cta.headline).toContain("Pro")
    expect(cta.body).toContain("filter out developers with poor delivery track records")
    expect(cta.cta).toContain("View Pro plan")
  })

  it("keeps the score explainer what-it-isnt clause", () => {
    expect(getScoreExplanation("market_score").what_it_isn_t).toContain("Not a prediction")
  })
})
