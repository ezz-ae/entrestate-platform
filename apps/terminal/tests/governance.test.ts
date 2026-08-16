import { describe, expect, it } from "vitest"
import { assertKillSwitch, isKillSwitchEnabled, signSession, verifySession } from "@/lib/governance"

describe("Governance", () => {
  it("signs and verifies sessions", () => {
    const token = signSession({
      sub: "user-123",
      role: "editor",
      exp: Math.floor(Date.now() / 1000) + 60,
    })

    const payload = verifySession(token)
    expect(payload?.sub).toBe("user-123")
    expect(payload?.role).toBe("editor")
  })

  it("respects the kill switch", () => {
    process.env.ENTRESTATE_KILL_SWITCH = "true"
    expect(isKillSwitchEnabled()).toBe(true)
    expect(() => assertKillSwitch()).toThrow()
    process.env.ENTRESTATE_KILL_SWITCH = "false"
  })
})
