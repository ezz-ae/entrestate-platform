import { ColumnTier } from "../registry/columns"

export type TableSpecRowGrain = "project" | "asset" | "transaction"
export type TableSpecTimeGrain = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "lifecycle"

export type TableSpecFilterOp = "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "in" | "contains"

export type TableSpecScope = {
  cities?: string[]
  areas?: string[]
  developers?: string[]
  projects?: string[]
}

export type TableSpecTimeRange = {
  mode: "relative" | "absolute"
  last?: number
  unit?: "days" | "months" | "years"
  from?: string
  to?: string
}

export type TableSpecFilter = {
  field: string
  op: TableSpecFilterOp
  value: string | number | boolean | Array<string | number>
}

export type TableSpecSort = {
  field: string
  direction: "asc" | "desc"
}

export type TableSpecEntitlements = {
  currentTier?: ColumnTier
  allowedRowGrains?: TableSpecRowGrain[]
  allowedSignals?: string[]
  allowedFilters?: string[]
  allowedSorts?: string[]
  allowedScopeKeys?: Array<keyof TableSpecScope>
  maxLimit?: number
}

export type TableSpec = {
  version: "v1"
  intent: string
  row_grain: TableSpecRowGrain
  scope: TableSpecScope
  time_grain: TableSpecTimeGrain
  time_range: TableSpecTimeRange
  signals: string[]
  filters: TableSpecFilter[]
  sort?: TableSpecSort
  limit?: number
  reasoning?: string
  dataSource?: string
}

export type TableSpecGoldenPath =
  | "underwrite_development_site"
  | "compare_area_yields"
  | "draft_spa_contract"

export type TableSpecCompileInput = {
  intent?: string
  goldenPath?: TableSpecGoldenPath
  profile?: {
    riskProfile?: string
    horizon?: string
    reasoning?: string
  }
  overrides?: Partial<TableSpec>
  entitlements?: TableSpecEntitlements
  llm?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
}

export type TableSpecCompilation = {
  spec: TableSpec
  warnings: string[]
  source: "intent" | "golden_path"
}
