export type Source = {
  name: string
  type: "official" | "portal" | "registry"
  detail: string
}

export type Exclusion = {
  reason: string
}

export type Assumption = {
  detail: string
}

export type AreaContext = {
  area: string
  city: string
  dld_transactions: number
  buy_signals: number
  margin: string
}

export type PriceInfo = {
  amount: number
  currency: string
  price_source: string
}

export type ScoreDetail = {
  timing: number
  stress: string
  yield: number
  investor_score: number
  evidence_grade: string
}

export interface EvidenceResponse {
  request_id: string
  project_id: string
  slug: string
  name: string
  verdict: string
  score: ScoreDetail
  drivers: {
    positive: string[]
    negative: string[]
  }
  evidence_level: string
  area_context: AreaContext
  price: PriceInfo
  sources: Source[]
  exclusions: Exclusion[]
  assumptions: Assumption[]
}
