import { TableSpec, TableSpecGoldenPath } from "./types"

const baseSpec: Omit<TableSpec, "intent"> = {
  version: "v1",
  row_grain: "project",
  scope: {},
  time_grain: "monthly",
  time_range: { mode: "relative", last: 24, unit: "months" },
  signals: ["price_from_aed", "yield_pct", "risk_band", "liquidity_band"],
  filters: [],
  sort: { field: "yield_pct", direction: "desc" },
  limit: 50,
}

export const tableSpecTemplates: Record<TableSpecGoldenPath, TableSpec> = {
  underwrite_development_site: {
    ...baseSpec,
    intent: "Underwrite development site",
    row_grain: "project",
    signals: ["price_from_aed", "yield_pct", "gfa_sqm", "handover_date", "risk_band"],
    sort: { field: "risk_band", direction: "asc" },
    limit: 25,
  },
  compare_area_yields: {
    ...baseSpec,
    intent: "Compare area yields",
    row_grain: "project",
    signals: ["area", "yield_pct", "price_from_aed", "liquidity_band"],
    sort: { field: "yield_pct", direction: "desc" },
    limit: 100,
  },
  draft_spa_contract: {
    ...baseSpec,
    intent: "Draft SPA contract",
    row_grain: "asset",
    signals: ["asset_id", "project", "price_from_aed", "developer", "handover_date"],
    sort: { field: "price_from_aed", direction: "desc" },
    limit: 10,
  },
}

export function getTableSpecTemplate(path: TableSpecGoldenPath): TableSpec {
  return tableSpecTemplates[path]
}
