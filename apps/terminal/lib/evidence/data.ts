import { EvidenceResponse } from "./types"

const EVIDENCE_DATA: EvidenceResponse[] = [
  {
    request_id: "req-20260417-WJVC-001",
    project_id: "westwood-grande-ii",
    slug: "westwood-grande-ii",
    name: "Westwood Grande II",
    verdict: "STRONG_BUY",
    score: {
      timing: 89,
      stress: "B",
      yield: 4.2,
      investor_score: 87,
      evidence_grade: "L1",
    },
    drivers: {
      positive: [
        "DLD velocity +23% QoQ",
        "Below area median entry price",
        "Developer delivery reliability 94%",
      ],
      negative: ["High-tier finishes extend closing timeline"],
    },
    area_context: {
      area: "Jumeirah Village Circle",
      city: "Dubai",
      dld_transactions: 2445,
      buy_signals: 78,
      margin: "4.2% premium vs. PF benchmark",
    },
    price: {
      amount: 1825000,
      currency: "AED",
      price_source: "DLD + Bayut + PF canonical blend",
    },
    evidence_level: "L1",
    sources: [
      {
        name: "DLD transactions",
        type: "official",
        detail: "DLD registry merged via `api.dld_transactions_v1`",
      },
      { name: "PropertyFinder", type: "portal", detail: "Bayut + PF inventory matching" },
      { name: "Bayut listings", type: "portal", detail: "Listing drift + velocity feed" },
      { name: "Developer registry", type: "registry", detail: "Reliability + delivery metrics" },
    ],
    exclusions: [
      "Filtered out pre-2018 transactions (low confidence)",
      "Removed listings flagged as developer repeats",
      "Excluded units outside core SDR radius",
    ],
    assumptions: [
      "Yield calculated on fully financed price",
      "Timing assumes current zoning approval timeline",
      "Stress grade uses L2 cross-validated liquidity signals",
    ],
  },
]

export function getEvidenceByKey(key: string | null | undefined) {
  if (!key) return null
  const normalized = key.toLowerCase()
  return EVIDENCE_DATA.find(
    (item) => item.project_id === normalized || item.slug === normalized || item.request_id === normalized,
  ) ?? null
}
