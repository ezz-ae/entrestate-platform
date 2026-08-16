type DataRow = Record<string, unknown>

type ColumnMap = Record<string, string | null>

const COLUMN_ALIASES: Record<string, string[]> = {
  id: ["project_id", "id", "asset_id"],
  name: ["name", "project_name", "title"],
  city: ["city_clean", "city", "city_name", "emirate"],
  area: ["area", "area_clean", "district", "community", "sub_area"],
  developer: ["developer_canonical", "developer", "developer_name", "master_developer"],
  status: ["final_status", "status", "market_timing", "project_status", "status_band", "delivery_band"],
  priceFrom: ["price_from_aed", "starting_price", "price_start"],
  priceTo: ["final_price_to", "price_to", "price_to_aed", "max_price"],
  yieldGross: ["gross_yield", "yield_gross", "rental_yield", "yield"],
  yieldNet: ["net_yield", "yield_net"],
  appreciation: ["appreciation_rate", "capital_appreciation", "price_growth", "annual_appreciation"],
  liquidity: ["liquidity_score", "liquidity_index", "liquidity"],
  marketBalance: ["market_balance", "supply_demand_balance"],
  demandScore: ["demand_score", "demand_index"],
  supplyScore: ["supply_score", "supply_index"],
  confidence: ["data_confidence", "confidence", "confidence_level"],
  rentMonthly: ["rent_monthly", "monthly_rent", "avg_rent", "rent_estimate"],
  rentPsf: ["rent_per_sqft", "rental_psf", "rent_psf"],
  sizeSqft: ["size_sqft", "unit_size_sqft", "sqft"],
  bedrooms: ["bedrooms", "beds", "unit_bedrooms"],
  unitsAvailable: ["units_available", "secondary_units", "units_listed"],
  resaleRate: ["resale_rate", "secondary_rate"],
  currentValue: ["current_value", "market_value"],
  purchasePrice: ["purchase_price", "original_price"],
  capitalGain: ["capital_gain", "capital_gain_pct"],
  roic: ["roic", "roi", "return_on_investment"],
  breakevenYears: ["breakeven_years", "break_even_years"],
}

export function resolveColumns(rows: DataRow[]): ColumnMap {
  if (!rows.length) return {}
  const keyMap = new Map<string, string>()
  Object.keys(rows[0]).forEach((key) => keyMap.set(key.toLowerCase(), key))

  const result: ColumnMap = {}
  Object.entries(COLUMN_ALIASES).forEach(([field, aliases]) => {
    result[field] = aliases.reduce<string | null>((found, alias) => {
      if (found) return found
      return keyMap.get(alias.toLowerCase()) ?? null
    }, null)
  })
  return result
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim()
    const parsed = Number.parseFloat(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function toStringValue(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  return str.length > 0 ? str : null
}

export function matchesText(target: unknown, query?: string | null): boolean {
  if (!query) return true
  const normalized = query.toLowerCase().trim()
  if (!normalized) return true
  const value = toStringValue(target)
  if (!value) return false
  return value.toLowerCase().includes(normalized)
}

export function average(values: number[]): number | null {
  if (!values.length) return null
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

export function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

export function percentile(values: number[], pct: number): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((pct / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))]
}

export function countBy(values: Array<string | null>, limit = 8): Array<{ label: string; count: number }> {
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

export function uniqueValues(values: Array<string | null>): string[] {
  const set = new Set<string>()
  values.forEach((value) => {
    if (value) set.add(value)
  })
  return Array.from(set)
}

export function inferBalance(row: DataRow, columns: ColumnMap): string | null {
  const direct = columns.marketBalance ? toStringValue(row[columns.marketBalance]) : null
  if (direct) return direct

  const demand = columns.demandScore ? toNumber(row[columns.demandScore]) : null
  const supply = columns.supplyScore ? toNumber(row[columns.supplyScore]) : null
  if (demand === null || supply === null) return null

  if (demand > supply * 1.1) return "undersupplied"
  if (supply > demand * 1.1) return "oversupplied"
  return "balanced"
}

export function getYield(row: DataRow, columns: ColumnMap): { gross: number | null; net: number | null; value: number | null } {
  const gross = columns.yieldGross ? toNumber(row[columns.yieldGross]) : null
  const net = columns.yieldNet ? toNumber(row[columns.yieldNet]) : null
  return { gross, net, value: gross ?? net }
}

export function priceValue(row: DataRow, columns: ColumnMap): number | null {
  const from = columns.priceFrom ? toNumber(row[columns.priceFrom]) : null
  if (from !== null) return from
  return columns.priceTo ? toNumber(row[columns.priceTo]) : null
}

export function buildListingItem(row: DataRow, columns: ColumnMap) {
  const name = columns.name ? toStringValue(row[columns.name]) : null
  const id = columns.id ? row[columns.id] : name ?? "unknown"
  const yieldInfo = getYield(row, columns)

  return {
    id,
    name,
    developer: columns.developer ? toStringValue(row[columns.developer]) : null,
    city: columns.city ? toStringValue(row[columns.city]) : null,
    area: columns.area ? toStringValue(row[columns.area]) : null,
    status: columns.status ? toStringValue(row[columns.status]) : null,
    price_from_aed: columns.priceFrom ? toNumber(row[columns.priceFrom]) : null,
    price_to: columns.priceTo ? toNumber(row[columns.priceTo]) : null,
    yield_gross: yieldInfo.gross,
    yield_net: yieldInfo.net,
    appreciation: columns.appreciation ? toNumber(row[columns.appreciation]) : null,
    liquidity: columns.liquidity ? toNumber(row[columns.liquidity]) : null,
    market_balance: inferBalance(row, columns),
    confidence: columns.confidence ? toStringValue(row[columns.confidence]) : null,
  }
}

export function groupAverage(rows: DataRow[], columns: ColumnMap, groupKey: string, valueKey: string) {
  const grouped = new Map<string, number[]>()
  rows.forEach((row) => {
    const groupValue = columns[groupKey] ? toStringValue(row[columns[groupKey]]) : null
    const value = columns[valueKey] ? toNumber(row[columns[valueKey]]) : null
    if (!groupValue || value === null) return
    if (!grouped.has(groupValue)) grouped.set(groupValue, [])
    grouped.get(groupValue)?.push(value)
  })
  return Array.from(grouped.entries()).map(([label, values]) => ({
    label,
    value: average(values),
  }))
}
