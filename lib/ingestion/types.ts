export type DldTransaction = {
  transactionId: string
  assetId?: string
  project: string
  area: string
  city: string
  developer?: string
  priceAed: number
  unitPriceAed?: number
  transactedAt: string
  beds?: number
}

export type Listing = {
  listingId: string
  assetId?: string
  project: string
  area: string
  city: string
  developer?: string
  priceAed: number
  yieldPct?: number
  statusBand?: string
  listedAt: string
}

export type DeveloperPipeline = {
  pipelineId: string
  developer: string
  project: string
  area: string
  city: string
  gfaSqm?: number
  handoverDate?: string
  statusBand?: string
}

export type RiskMetric = {
  metricId: string
  area: string
  city: string
  riskBand: string
  liquidityBand?: string
  capturedAt: string
}

export type CanonicalEntity = {
  id: string
  entityType: "transaction" | "listing" | "pipeline" | "risk_metric"
  source: string
  sourceId: string
  name?: string
  city?: string
  area?: string
  attributes: Record<string, unknown>
}

export type CanonicalSnapshot = {
  id: string
  entityId: string
  version: string
  asOf: string
  payload: Record<string, unknown>
  source: string
}

export type IngestionRun = {
  id: string
  source: string
  startedAt: string
  completedAt?: string
  status: "started" | "completed" | "failed"
  rowCount: number
}
