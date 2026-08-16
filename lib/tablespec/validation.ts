import { TableSpec, TableSpecEntitlements, TableSpecRowGrain, TableSpecScope } from "./types"

type AllowedFields = {
  signals: string[]
  filters: string[]
  sorts: string[]
}

const DEFAULT_SCOPE_KEYS: Array<keyof TableSpecScope> = ["cities", "areas", "developers", "projects"]

const ALLOWED_FIELDS: Record<TableSpecRowGrain, AllowedFields> = {
  project: {
    signals: [
      "project_id",
      "project",
      "area",
      "city",
      "developer",
      "price_from_aed",
      "yield_pct",
      "risk_band",
      "liquidity_band",
      "status_band",
      "handover_date",
      "gfa_sqm",
      "market_score",
      "classification",
    ],
    filters: [
      "project_id",
      "area",
      "city",
      "developer",
      "price_from_aed",
      "yield_pct",
      "risk_band",
      "liquidity_band",
      "status_band",
      "handover_date",
      "gfa_sqm",
      "classification",
    ],
    sorts: ["yield_pct", "price_from_aed", "risk_band", "liquidity_band", "handover_date", "gfa_sqm", "market_score"],
  },
  asset: {
    signals: [
      "asset_id",
      "project",
      "area",
      "city",
      "developer",
      "price_from_aed",
      "yield_pct",
      "beds",
      "risk_band",
      "liquidity_band",
      "status_band",
      "handover_date",
      "gfa_sqm",
      "market_score",
      "classification",
    ],
    filters: [
      "asset_id",
      "project",
      "area",
      "city",
      "developer",
      "price_from_aed",
      "yield_pct",
      "beds",
      "risk_band",
      "liquidity_band",
      "status_band",
      "handover_date",
      "gfa_sqm",
      "classification",
    ],
    sorts: ["yield_pct", "price_from_aed", "risk_band", "liquidity_band", "handover_date", "gfa_sqm", "market_score"],
  },
  transaction: {
    signals: [
      "transaction_id",
      "transaction_date",
      "asset_id",
      "project",
      "area",
      "city",
      "developer",
      "price_from_aed",
      "unit_price_aed",
      "yield_pct",
      "beds",
      "risk_band",
      "market_score",
    ],
    filters: [
      "transaction_id",
      "transaction_date",
      "asset_id",
      "project",
      "area",
      "city",
      "developer",
      "price_from_aed",
      "unit_price_aed",
      "yield_pct",
      "beds",
      "risk_band",
      "classification",
    ],
    sorts: ["transaction_date", "price_from_aed", "unit_price_aed", "yield_pct", "market_score"],
  },
}

const intersect = (base: string[], allowed?: string[]) => {
  if (!allowed) return base
  const allowedSet = new Set(allowed)
  return base.filter((field) => allowedSet.has(field))
}

export type TableSpecValidationResult = {
  valid: boolean
  errors: string[]
}

export function defaultEntitlementsForRowGrain(rowGrain: TableSpecRowGrain): TableSpecEntitlements {
  const base = ALLOWED_FIELDS[rowGrain]
  return {
    allowedRowGrains: [rowGrain],
    allowedSignals: base.signals,
    allowedFilters: base.filters,
    allowedSorts: base.sorts,
    allowedScopeKeys: DEFAULT_SCOPE_KEYS,
    maxLimit: 500,
  }
}

export function validateTableSpec(
  spec: TableSpec,
  entitlements?: TableSpecEntitlements,
): TableSpecValidationResult {
  const errors: string[] = []
  const base = ALLOWED_FIELDS[spec.row_grain]
  if (!base) {
    return { valid: false, errors: ["row_grain_not_allowed"] }
  }

  const allowedRowGrains = entitlements?.allowedRowGrains
  if (allowedRowGrains && !allowedRowGrains.includes(spec.row_grain)) {
    errors.push("row_grain_not_allowed")
  }

  const allowedSignals = intersect(base.signals, entitlements?.allowedSignals)
  const allowedFilters = intersect(base.filters, entitlements?.allowedFilters)
  const allowedSorts = intersect(base.sorts, entitlements?.allowedSorts)

  const maxLimit = entitlements?.maxLimit ?? 500
  if (spec.limit && spec.limit > maxLimit) {
    errors.push("limit_exceeds_entitlement")
  }

  const allowedScopeKeys = entitlements?.allowedScopeKeys ?? DEFAULT_SCOPE_KEYS
  for (const [key, value] of Object.entries(spec.scope)) {
    if (!value || value.length === 0) continue
    if (!allowedScopeKeys.includes(key as keyof TableSpecScope)) {
      errors.push(`scope_not_allowed:${key}`)
    }
  }

  const invalidSignals = spec.signals.filter((signal) => !allowedSignals.includes(signal))
  if (invalidSignals.length) {
    invalidSignals.forEach((signal) => errors.push(`signal_not_allowed:${signal}`))
  }

  const invalidFilters = spec.filters.filter((filter) => !allowedFilters.includes(filter.field))
  if (invalidFilters.length) {
    invalidFilters.forEach((filter) => errors.push(`filter_not_allowed:${filter.field}`))
  }

  if (spec.sort && !allowedSorts.includes(spec.sort.field)) {
    errors.push(`sort_not_allowed:${spec.sort.field}`)
  }

  return { valid: errors.length === 0, errors }
}

export function enforceTableSpec(spec: TableSpec, entitlements?: TableSpecEntitlements): TableSpec {
  const result = validateTableSpec(spec, entitlements)
  if (!result.valid) {
    throw new Error(`TableSpec validation failed: ${result.errors.join(", ")}`)
  }
  return spec
}
