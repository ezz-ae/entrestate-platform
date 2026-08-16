import type { TableSpec } from "../tablespec"
import type { EvidenceDrawer } from "./types"

export type EvidenceOptions = {
  sources?: string[]
  assumptions?: string[]
}

export function buildEvidenceDrawer(
  spec: TableSpec,
  tableHash: string,
  options: EvidenceOptions = {},
): EvidenceDrawer {
  return {
    tableHash,
    sources: options.sources ?? ["DLD transactions", "Listings", "Developer pipelines", "Risk metrics"],
    filters: spec.filters,
    assumptions: options.assumptions ?? ["Assumes latest canonical snapshot", "Signals normalized per row grain"],
    signals: spec.signals,
    scope: spec.scope,
    timeRange: spec.time_range,
  }
}
