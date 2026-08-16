import type { OverrideDisclosure, OverrideFlags } from "@/lib/market-score/types"

export function buildOverrideDisclosure(flags: OverrideFlags): OverrideDisclosure | undefined {
  if (!flags.allow2030Plus && !flags.allowSpeculative) return undefined

  const notes: string[] = []
  if (flags.allow2030Plus) {
    notes.push("Includes 2030+ delivery assets outside the standard horizon gate.")
  }
  if (flags.allowSpeculative) {
    notes.push("Includes speculative safety bands that are normally excluded.")
  }

  return {
    allow2030Plus: flags.allow2030Plus,
    allowSpeculative: flags.allowSpeculative,
    riskLevel: "heightened",
    notes,
  }
}
