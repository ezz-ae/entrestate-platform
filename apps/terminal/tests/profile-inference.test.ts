import { describe, expect, it } from "vitest"
import { inferProfileUpdate } from "@/lib/profile"

describe("Profile inference", () => {
  it("adjusts biases based on behavior", () => {
    const profile = {
      userId: "user-1",
      riskBias: 0.65,
      yieldVsSafety: 0.5,
      preferredMarkets: [],
    }

    const result = inferProfileUpdate(profile as any, [
      { type: "lens_selected", lens: "map" },
      { type: "signal_toggled", signal: "yield" },
    ])

    expect(result.profile.yieldVsSafety).toBeGreaterThan(profile.yieldVsSafety)
    expect(result.adjustments.length).toBeGreaterThan(0)
  })
})
