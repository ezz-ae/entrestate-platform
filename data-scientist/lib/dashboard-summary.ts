export type SummaryItem = { label: string; count: number }

export type SummaryStats = {
  min: number
  max: number
  avg: number
  median: number
}

export type TopProject = {
  name: string
  score: number
  city?: string
  area?: string
}

export type DashboardSummary = {
  rowCount: number
  colCount: number
  columnsUsed: Record<string, string | null>
  uniqueCities: number
  uniqueAreas: number
  uniqueDevelopers: number
  priceStats: SummaryStats | null
  priceBands: SummaryItem[]
  topCities: SummaryItem[]
  topAreas: SummaryItem[]
  topDevelopers: SummaryItem[]
  riskDistribution: SummaryItem[]
  deliveryDistribution: SummaryItem[]
  confidenceDistribution: SummaryItem[]
  topProjects: TopProject[]
}

const COLUMN_ALIASES: Record<string, string[]> = {
  city: ["city_clean", "city", "city_name", "emirate"],
  area: ["area", "area_clean", "district", "sub_area", "community"],
  developer: ["developer_canonical", "developer", "developer_name", "master_developer"],
  price: [
    "final_price_from",
    "price_from_aed",
    "price_start",
    "starting_price",
    "price_aed",
  ],
  risk: ["derived_risk_class", "risk_class", "risk_bucket", "classification", "safety_band"],
  delivery: [
    "market_timing",
    "delivery_confidence",
    "handover_timing",
    "final_status",
    "status_band",
    "timeline_risk_band",
  ],
  confidence: ["data_confidence", "confidence", "confidence_score"],
  name: ["name", "project_name", "title"],
  score: ["investor_score_v1", "score", "score_0_100", "final_rank", "match_score"],
}

function resolveColumn(rows: Record<string, unknown>[], aliases: string[]): string | null {
  if (rows.length === 0) return null
  const keyMap = new Map<string, string>()
  for (const key of Object.keys(rows[0])) {
    keyMap.set(key.toLowerCase(), key)
  }

  for (const alias of aliases) {
    const match = keyMap.get(alias.toLowerCase())
    if (match) return match
  }

  return null
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim()
    const parsed = Number.parseFloat(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  return str.length > 0 ? str : null
}

function countBy(values: Array<string | null>, limit = 8): SummaryItem[] {
  const counts = new Map<string, number>()
  values.forEach((value) => {
    if (!value) return
    counts.set(value, (counts.get(value) ?? 0) + 1)
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }))
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

function createPriceBands(values: number[]): SummaryItem[] {
  if (values.length === 0) return []
  const max = Math.max(...values)
  const bands = [
    { label: "< 1M", max: 1_000_000 },
    { label: "1M - 2M", max: 2_000_000 },
    { label: "2M - 5M", max: 5_000_000 },
    { label: "5M - 10M", max: 10_000_000 },
    { label: "10M+", max: Infinity },
  ]

  const counts = bands.map((band) => ({ label: band.label, count: 0 }))

  values.forEach((value) => {
    const index = bands.findIndex((band) => value < band.max)
    if (index >= 0) counts[index].count += 1
  })

  return counts
}

export function buildDashboardSummary(rows: Record<string, unknown>[]): DashboardSummary {
  const cityCol = resolveColumn(rows, COLUMN_ALIASES.city)
  const areaCol = resolveColumn(rows, COLUMN_ALIASES.area)
  const developerCol = resolveColumn(rows, COLUMN_ALIASES.developer)
  const priceCol = resolveColumn(rows, COLUMN_ALIASES.price)
  const riskCol = resolveColumn(rows, COLUMN_ALIASES.risk)
  const deliveryCol = resolveColumn(rows, COLUMN_ALIASES.delivery)
  const confidenceCol = resolveColumn(rows, COLUMN_ALIASES.confidence)
  const nameCol = resolveColumn(rows, COLUMN_ALIASES.name)
  const scoreCol = resolveColumn(rows, COLUMN_ALIASES.score)

  const cityValues = cityCol ? rows.map((row) => toString(row[cityCol])) : []
  const areaValues = areaCol ? rows.map((row) => toString(row[areaCol])) : []
  const developerValues = developerCol ? rows.map((row) => toString(row[developerCol])) : []
  const riskValues = riskCol ? rows.map((row) => toString(row[riskCol])) : []
  const deliveryValues = deliveryCol ? rows.map((row) => toString(row[deliveryCol])) : []
  const confidenceValues = confidenceCol ? rows.map((row) => toString(row[confidenceCol])) : []

  const priceValues = priceCol
    ? rows
        .map((row) => toNumber(row[priceCol]))
        .filter((value): value is number => value !== null)
    : []

  const scoreValues = scoreCol
    ? rows
        .map((row) => toNumber(row[scoreCol]))
        .filter((value): value is number => value !== null)
    : []

  const uniqueCities = new Set(cityValues.filter(Boolean)).size
  const uniqueAreas = new Set(areaValues.filter(Boolean)).size
  const uniqueDevelopers = new Set(developerValues.filter(Boolean)).size

  const priceStats = priceValues.length
    ? {
        min: Math.min(...priceValues),
        max: Math.max(...priceValues),
        avg: priceValues.reduce((a, b) => a + b, 0) / priceValues.length,
        median: median(priceValues),
      }
    : null

  const topProjects: TopProject[] = []
  if (nameCol && scoreCol) {
    rows.forEach((row) => {
      const score = toNumber(row[scoreCol])
      const name = toString(row[nameCol])
      if (score === null || !name) return
      topProjects.push({
        name,
        score,
        city: cityCol ? toString(row[cityCol]) || undefined : undefined,
        area: areaCol ? toString(row[areaCol]) || undefined : undefined,
      })
    })
  }

  topProjects.sort((a, b) => b.score - a.score)

  const columnsUsed = {
    city: cityCol,
    area: areaCol,
    developer: developerCol,
    price: priceCol,
    risk: riskCol,
    delivery: deliveryCol,
    confidence: confidenceCol,
    name: nameCol,
    score: scoreCol,
  }

  return {
    rowCount: rows.length,
    colCount: rows.length > 0 ? Object.keys(rows[0]).length : 0,
    columnsUsed,
    uniqueCities,
    uniqueAreas,
    uniqueDevelopers,
    priceStats,
    priceBands: createPriceBands(priceValues),
    topCities: countBy(cityValues),
    topAreas: countBy(areaValues),
    topDevelopers: countBy(developerValues),
    riskDistribution: countBy(riskValues),
    deliveryDistribution: countBy(deliveryValues),
    confidenceDistribution: countBy(confidenceValues),
    topProjects: topProjects.slice(0, 8),
  }
}
