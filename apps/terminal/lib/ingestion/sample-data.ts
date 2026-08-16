import type { DeveloperPipeline, DldTransaction, Listing, RiskMetric } from "./types"

export const sampleDldTransactions: DldTransaction[] = [
  {
    transactionId: "TRX-1001",
    assetId: "AST-001",
    project: "Marina Vista",
    area: "dubai marina",
    city: "dubai",
    developer: "Emaar",
    priceAed: 1850000,
    unitPriceAed: 13200,
    transactedAt: "2024-03-01",
    beds: 2,
  },
  {
    transactionId: "TRX-1002",
    assetId: "AST-028",
    project: "JVC Heights",
    area: "jvc",
    city: "dubai",
    developer: "Sobha",
    priceAed: 980000,
    unitPriceAed: 10300,
    transactedAt: "2024-05-12",
    beds: 1,
  },
]

export const sampleListings: Listing[] = [
  {
    listingId: "LST-2001",
    assetId: "AST-014",
    project: "Palm Crest",
    area: "palm jumeirah",
    city: "dubai",
    developer: "Nakheel",
    priceAed: 3250000,
    yieldPct: 5.4,
    statusBand: "2026",
    listedAt: "2024-04-08",
  },
]

export const sampleDeveloperPipelines: DeveloperPipeline[] = [
  {
    pipelineId: "PIPE-3001",
    developer: "Dubai Properties",
    project: "Downtown Edge",
    area: "downtown",
    city: "dubai",
    gfaSqm: 160,
    handoverDate: "2027-12-01",
    statusBand: "2027",
  },
]

export const sampleRiskMetrics: RiskMetric[] = [
  {
    metricId: "RISK-4001",
    area: "business bay",
    city: "dubai",
    riskBand: "Capital Safe",
    liquidityBand: "Short (1-2yr)",
    capturedAt: "2024-01-15",
  },
]
