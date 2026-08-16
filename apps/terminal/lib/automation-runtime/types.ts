export type RiskProfile = "Conservative" | "Balanced" | "Aggressive"
export type HorizonBand = "Ready" | "6-12mo" | "1-2yr" | "2-4yr" | "4yr+"
export type IntentType = "invest" | "live" | "rent"

export interface OverrideFlags {
  allow2030Plus: boolean
  allowSpeculative: boolean
}

export interface AutomationRuntimeRunInput {
  riskProfile: RiskProfile
  horizon: HorizonBand
  ranked: boolean
  budgetAed?: number
  preferredArea?: string
  bedsPref?: string
  intent?: IntentType
  overrideActive: boolean
  overrideFlags: OverrideFlags
}

export interface AutomationRuntimeCandidate {
  asset_id: string
  name: string | null
  developer: string | null
  city: string | null
  area: string | null
  status_band: string | null
  price_aed: number | null
  beds: string | number | null
  score_0_100: number | null
  match_score: number | null
  final_rank: number | null
  safety_band: string | null
  classification: string | null
  roi_band: string | null
  liquidity_band: string | null
  timeline_risk_band: string | null
  drivers: unknown
  reason_codes: string[] | null
  risk_flags: string[] | null
}

export interface AutomationRuntimeResponse {
  rows: AutomationRuntimeCandidate[]
  returnedCount: number
  mode: "ranked" | "routed"
  overrideActive: boolean
}

export interface OverrideDisclosureResponse {
  disclosure: unknown | null
}
