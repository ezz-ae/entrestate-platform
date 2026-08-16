export type SafetyBand =
  | "Institutional Safe"
  | "Capital Safe"
  | "Opportunistic"
  | "Speculative"
  | string

export type ClassificationBand = "Conservative" | "Balanced" | "Aggressive" | "Speculative" | string

export type StatusBand =
  | "Completed"
  | "2025"
  | "2026"
  | "2027"
  | "2028-29"
  | "2030+"
  | string

export interface MarketScoreFilters {
  cities: string[]
  areas: string[]
  statusBands: string[]
  priceTiers: string[]
  safetyBands: string[]
}

export interface RoutingParams {
  riskProfile?: string
  horizon?: string
  ranked?: boolean
  budgetAed?: number
  preferredArea?: string
  bedsPref?: string
  intent?: string
}

export interface OverrideFlags {
  allow2030Plus: boolean
  allowSpeculative: boolean
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface SummaryDistribution {
  label: string
  count: number
  percent?: number
}

export interface AverageScoreRow {
  label: string
  avgScore: number
}

export interface MarketScoreSummary {
  totalAssets: number
  avgScore: number
  safetyDistribution: SummaryDistribution[]
  classificationDistribution: SummaryDistribution[]
  avgScoreByStatus: AverageScoreRow[]
  avgScoreBySafetyBand: AverageScoreRow[]
  avgScoreByPriceTier?: AverageScoreRow[]
  conservativeReadyPool: number
  balancedDefaultPool: number
  available: {
    cities: string[]
    areas: string[]
    statusBands: string[]
    priceTiers: string[]
    safetyBands: string[]
  }
  source: "view" | "routed"
  overrideDisclosure?: OverrideDisclosure
  truthChecks: TruthChecks
  healthcheck?: SystemHealthcheckRow | null
}

export interface MarketScoreCharts {
  safetyDistribution: SummaryDistribution[]
  avgScoreByStatus: AverageScoreRow[]
  avgScoreBySafetyBand: AverageScoreRow[]
  avgScoreByPriceTier?: AverageScoreRow[]
  countByCity: SummaryDistribution[]
  source: "view" | "routed"
  overrideDisclosure?: OverrideDisclosure
}

export interface InventoryRow {
  asset_id: string | number
  name: string | null
  developer: string | null
  developer_ar?: string | null
  city: string | null
  area: string | null
  area_ar?: string | null
  status_band: string | null
  price_aed: number | null
  beds: number | null
  score_0_100: number | null
  match_score?: number | null
  final_rank?: number | null
  safety_band: string | null
  classification: string | null
  roi_band: string | null
  liquidity_band: string | null
  timeline_risk_band: string | null
  drivers: unknown | null
  warnings: unknown | null
  reason_codes: unknown | null
  risk_flags: unknown | null
}

export interface MarketScoreInventoryResponse {
  rows: InventoryRow[]
  total: number
  page: number
  pageSize: number
  source: "view" | "routed"
  overrideDisclosure?: OverrideDisclosure
}

export type OverrideDisclosure = Record<string, unknown>

export interface OverrideAuditPayload {
  userId: string
  riskProfile?: string
  horizon?: string
  overrideFlags: OverrideFlags
  reason: string
  selectedAssetId?: string
}

export interface TruthChecks {
  conservativeReady: SummaryDistribution[]
  balancedShort: SummaryDistribution[]
  horizonViolations: number
  speculativeLeak: number
}

export interface SystemHealthcheckRow {
  id?: string | number
  created_at?: string
  status?: string
  passing_count?: number
  total_count?: number
  meta?: unknown
}
