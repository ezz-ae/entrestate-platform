const KILL_SWITCH_KEYS = ["ENTRESTATE_KILL_SWITCH", "ENTRESTATE_FREEZE"]

export function isKillSwitchEnabled(): boolean {
  return KILL_SWITCH_KEYS.some((key) => process.env[key] === "true")
}

export function assertKillSwitch() {
  if (isKillSwitchEnabled()) {
    throw new Error("Kill switch enabled. Operations are temporarily disabled.")
  }
}
