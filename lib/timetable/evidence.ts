export interface Evidence {
  sources: { name: string; url?: string; timestamp: string }[]
  exclusions: { rule: string; count: number }[]
  assumptions: string[]
  calculations: { metric: string; formula: string }[]
}

export function getEvidenceForSpec(spec: any): Evidence {
  return {
    sources: [
      { name: "DLD Official Registry", timestamp: new Date().toISOString() },
      { name: "Entrestate Pipeline Monitor", timestamp: new Date().toISOString() }
    ],
    exclusions: [
      { rule: "Distressed sales (forced liquidation)", count: 12 },
      { rule: "Internal family transfers", count: 5 },
      { rule: "Incomplete project records", count: 3 }
    ],
    assumptions: [
      "Yields calculated on net area where available, otherwise gross.",
      "Service charges estimated at 15-18 AED/sqft for JVC."
    ],
    calculations: [
      { metric: "ROI", formula: "(Net Annual Rent / Purchase Price) * 100" },
      { metric: "Market Timing", formula: "Z-score of price momentum vs 3yr rolling avg" }
    ]
  }
}
