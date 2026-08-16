import { getEntrestateRows } from "@/lib/daas/data"
import {
  average,
  buildListingItem,
  countBy,
  getYield,
  groupAverage,
  inferBalance,
  matchesText,
  median,
  percentile,
  priceValue,
  resolveColumns,
  toNumber,
  toStringValue,
  uniqueValues,
} from "@/lib/daas/engine"

type DataRow = Record<string, unknown>

const MAX_DAAS_ROWS = 25000
const DAAS_PREFERRED_TABLE: "entrestate_master" | "automation_inventory_view_v1" = "entrestate_master"

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function coerceString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  return str.length > 0 ? str : null
}

function sortByNumber(rows: DataRow[], selector: (row: DataRow) => number | null, direction: "asc" | "desc") {
  return [...rows].sort((a, b) => {
    const aVal = selector(a) ?? -Infinity
    const bVal = selector(b) ?? -Infinity
    return direction === "asc" ? aVal - bVal : bVal - aVal
  })
}

function summarizePrices(values: number[]) {
  return {
    avg: average(values),
    median: median(values),
    p25: percentile(values, 25),
    p75: percentile(values, 75),
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
  }
}

export async function listingFeed(params: Record<string, unknown>) {
  const { rows, source } = await getEntrestateRows({ maxRows: MAX_DAAS_ROWS, preferTable: DAAS_PREFERRED_TABLE })
  const columns = resolveColumns(rows)

  const city = coerceString(params.city)
  const area = coerceString(params.area)
  const developer = coerceString(params.developer)
  const status = coerceString(params.status)
  const minPrice = toNumber(params.min_price ?? params.minPrice)
  const maxPrice = toNumber(params.max_price ?? params.maxPrice)
  const minYield = toNumber(params.min_yield ?? params.minYield)
  const sortBy = coerceString(params.sort_by ?? params.sortBy) ?? "yield"
  const sortDir = (coerceString(params.sort_dir ?? params.sortDir) ?? "desc").toLowerCase() as "asc" | "desc"
  const page = clampNumber(toNumber(params.page) ?? 1, 1, 1000)
  const perPage = clampNumber(toNumber(params.per_page) ?? DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE)

  const filtered = rows.filter((row) => {
    if (!matchesText(columns.city ? row[columns.city] : null, city)) return false
    if (!matchesText(columns.area ? row[columns.area] : null, area)) return false
    if (!matchesText(columns.developer ? row[columns.developer] : null, developer)) return false
    if (!matchesText(columns.status ? row[columns.status] : null, status)) return false

    const price = priceValue(row, columns)
    if (minPrice !== null && price !== null && price < minPrice) return false
    if (maxPrice !== null && price !== null && price > maxPrice) return false

    const yieldValue = getYield(row, columns).value
    if (minYield !== null) {
      if (yieldValue === null || yieldValue < minYield) return false
    }

    return true
  })

  let sorted = filtered
  if (sortBy === "price") {
    sorted = sortByNumber(filtered, (row) => priceValue(row, columns), sortDir)
  } else if (sortBy === "appreciation") {
    sorted = sortByNumber(
      filtered,
      (row) => (columns.appreciation ? toNumber(row[columns.appreciation]) : null),
      sortDir,
    )
  } else if (sortBy === "liquidity") {
    sorted = sortByNumber(
      filtered,
      (row) => (columns.liquidity ? toNumber(row[columns.liquidity]) : null),
      sortDir,
    )
  } else {
    sorted = sortByNumber(filtered, (row) => getYield(row, columns).value, sortDir)
  }

  const start = (page - 1) * perPage
  const paged = sorted.slice(start, start + perPage)

  return {
    source,
    total: filtered.length,
    page,
    per_page: perPage,
    sort_by: sortBy,
    items: paged.map((row) => buildListingItem(row, columns)),
  }
}

export async function marketAnalysis(params: Record<string, unknown>) {
  const { rows, source } = await getEntrestateRows({ maxRows: MAX_DAAS_ROWS, preferTable: DAAS_PREFERRED_TABLE })
  const columns = resolveColumns(rows)

  const scope = (coerceString(params.scope) ?? "city").toLowerCase()
  const name = coerceString(params.name) ?? ""
  const includeComparisons = Boolean(params.include_comparisons ?? params.includeComparisons)

  const scopeKey =
    scope === "area" ? columns.area : scope === "developer" ? columns.developer : columns.city

  const filtered = scopeKey
    ? rows.filter((row) => matchesText(row[scopeKey], name))
    : rows

  const prices = filtered
    .map((row) => priceValue(row, columns))
    .filter((value): value is number => value !== null)

  const yields = filtered
    .map((row) => getYield(row, columns).value)
    .filter((value): value is number => value !== null)

  const netYields = filtered
    .map((row) => getYield(row, columns).net)
    .filter((value): value is number => value !== null)

  const rents = columns.rentMonthly
    ? filtered
        .map((row) => toNumber(row[columns.rentMonthly]))
        .filter((value): value is number => value !== null)
    : []

  const appreciation = columns.appreciation
    ? filtered.map((row) => toNumber(row[columns.appreciation])).filter((value): value is number => value !== null)
    : []

  const liquidity = columns.liquidity
    ? filtered.map((row) => toNumber(row[columns.liquidity])).filter((value): value is number => value !== null)
    : []

  const balanceValues = filtered.map((row) => inferBalance(row, columns))
  const statusValues = columns.status ? filtered.map((row) => toStringValue(row[columns.status])) : []
  const confidenceValues = columns.confidence
    ? filtered.map((row) => toStringValue(row[columns.confidence]))
    : []

  const developerValues = columns.developer
    ? filtered.map((row) => toStringValue(row[columns.developer]))
    : []

  const undersuppliedCount = balanceValues.filter((value) =>
    value ? value.toLowerCase().includes("under") : false,
  ).length

  const scopeSummary = {
    scope,
    name,
    total_projects: filtered.length,
    total_value: prices.reduce((sum, val) => sum + val, 0),
    prices: summarizePrices(prices),
  }

  const yieldSummary = {
    avg_gross: average(yields),
    median_gross: median(yields),
    range_gross: {
      p25: percentile(yields, 25),
      p75: percentile(yields, 75),
    },
    avg_net: average(netYields),
    median_net: median(netYields),
  }

  const rentalSummary = {
    avg_rent: average(rents),
    median_rent: median(rents),
    market_balance: countBy(balanceValues),
    undersupplied_pct: filtered.length ? (undersuppliedCount / filtered.length) * 100 : null,
  }

  const secondarySummary = {
    avg_appreciation: average(appreciation),
    avg_liquidity: average(liquidity),
    demand_distribution: countBy(balanceValues),
    units_available: columns.unitsAvailable
      ? filtered
          .map((row) => toNumber(row[columns.unitsAvailable]))
          .filter((value): value is number => value !== null)
          .reduce((sum, val) => sum + val, 0)
      : null,
  }

  const investmentSummary = {
    avg_capital_gain: columns.capitalGain
      ? average(
          filtered
            .map((row) => toNumber(row[columns.capitalGain]))
            .filter((value): value is number => value !== null),
        )
      : null,
    avg_roic: columns.roic
      ? average(
          filtered.map((row) => toNumber(row[columns.roic])).filter((value): value is number => value !== null),
        )
      : null,
    avg_breakeven_years: columns.breakevenYears
      ? average(
          filtered
            .map((row) => toNumber(row[columns.breakevenYears]))
            .filter((value): value is number => value !== null),
        )
      : null,
  }

  const comparisons =
    includeComparisons && scope === "area" && columns.city
      ? buildAreaComparison(filtered, rows, columns)
      : null

  return {
    source,
    summary: scopeSummary,
    yields: yieldSummary,
    rental: rentalSummary,
    secondary_market: secondarySummary,
    investment: investmentSummary,
    status_distribution: countBy(statusValues),
    confidence_distribution: countBy(confidenceValues),
    top_developers: countBy(developerValues, 5),
    comparisons,
  }
}

function buildAreaComparison(filtered: DataRow[], allRows: DataRow[], columns: Record<string, string | null>) {
  const cityValue = columns.city ? toStringValue(filtered[0]?.[columns.city]) : null
  if (!cityValue || !columns.city) return null

  const cityRows = allRows.filter((row) => matchesText(row[columns.city], cityValue))
  const areaPrices = filtered
    .map((row) => priceValue(row, columns))
    .filter((value): value is number => value !== null)
  const cityPrices = cityRows
    .map((row) => priceValue(row, columns))
    .filter((value): value is number => value !== null)

  const areaYield = filtered
    .map((row) => getYield(row, columns).value)
    .filter((value): value is number => value !== null)
  const cityYield = cityRows
    .map((row) => getYield(row, columns).value)
    .filter((value): value is number => value !== null)

  const areaAvgPrice = average(areaPrices)
  const cityAvgPrice = average(cityPrices)
  const areaAvgYield = average(areaYield)
  const cityAvgYield = average(cityYield)

  return {
    city: cityValue,
    avg_price_delta: areaAvgPrice && cityAvgPrice ? areaAvgPrice - cityAvgPrice : null,
    avg_yield_delta: areaAvgYield && cityAvgYield ? areaAvgYield - cityAvgYield : null,
  }
}

export async function developerIntel(params: Record<string, unknown>) {
  const { rows, source } = await getEntrestateRows({ maxRows: MAX_DAAS_ROWS, preferTable: DAAS_PREFERRED_TABLE })
  const columns = resolveColumns(rows)

  const name = coerceString(params.name) ?? ""
  const includeProjects = Boolean(params.include_projects ?? params.includeProjects)
  const includePortfolio = Boolean(params.include_portfolio_analysis ?? params.includePortfolioAnalysis)

  const filtered = columns.developer
    ? rows.filter((row) => matchesText(row[columns.developer], name))
    : []

  const prices = filtered
    .map((row) => priceValue(row, columns))
    .filter((value): value is number => value !== null)

  const yields = filtered
    .map((row) => getYield(row, columns).value)
    .filter((value): value is number => value !== null)

  const appreciation = columns.appreciation
    ? filtered.map((row) => toNumber(row[columns.appreciation])).filter((value): value is number => value !== null)
    : []

  const liquidity = columns.liquidity
    ? filtered.map((row) => toNumber(row[columns.liquidity])).filter((value): value is number => value !== null)
    : []

  const statusValues = columns.status ? filtered.map((row) => toStringValue(row[columns.status])) : []
  const balanceValues = filtered.map((row) => inferBalance(row, columns))

  const profile = {
    canonical_name: name || (columns.developer ? toStringValue(filtered[0]?.[columns.developer]) : null),
    aliases: uniqueValues(columns.developer ? filtered.map((row) => toStringValue(row[columns.developer])) : []),
  }

  const portfolio = {
    total_projects: filtered.length,
    total_value: prices.reduce((sum, val) => sum + val, 0),
    avg_price: average(prices),
    median_price: median(prices),
    price_range: {
      p25: percentile(prices, 25),
      p75: percentile(prices, 75),
    },
  }

  const performance = {
    avg_yield: average(yields),
    avg_appreciation: average(appreciation),
    avg_liquidity: average(liquidity),
  }

  const geoSpread = {
    cities: uniqueValues(columns.city ? filtered.map((row) => toStringValue(row[columns.city])) : []),
    areas: uniqueValues(columns.area ? filtered.map((row) => toStringValue(row[columns.area])) : []),
  }

  const statusMix = countBy(statusValues)
  const undersuppliedCount = balanceValues.filter((value) =>
    value ? value.toLowerCase().includes("under") : false,
  ).length

  const marketPosition = {
    undersupplied_pct: filtered.length ? (undersuppliedCount / filtered.length) * 100 : null,
  }

  const projects = includeProjects
    ? filtered.slice(0, 50).map((row) => buildListingItem(row, columns))
    : []

  return {
    source,
    profile,
    portfolio: includePortfolio ? portfolio : null,
    performance,
    geo_spread: geoSpread,
    status_mix: statusMix,
    market_position: marketPosition,
    projects,
  }
}

export async function rentalPricing(params: Record<string, unknown>) {
  const { rows, source } = await getEntrestateRows({ maxRows: MAX_DAAS_ROWS, preferTable: DAAS_PREFERRED_TABLE })
  const columns = resolveColumns(rows)

  const projectName = coerceString(params.project ?? params.name)
  const areaName = coerceString(params.area)
  const bedrooms = toNumber(params.bedrooms)
  const sizeSqft = toNumber(params.size_sqft ?? params.sizeSqft)

  const baseRows = projectName
    ? rows.filter((row) => matchesText(columns.name ? row[columns.name] : null, projectName))
    : areaName
      ? rows.filter((row) => matchesText(columns.area ? row[columns.area] : null, areaName))
      : rows

  const scopedRows = bedrooms && columns.bedrooms
    ? baseRows.filter((row) => toNumber(row[columns.bedrooms]) === bedrooms)
    : baseRows

  const rentValues = columns.rentMonthly
    ? scopedRows
        .map((row) => toNumber(row[columns.rentMonthly]))
        .filter((value): value is number => value !== null)
    : []

  const derivedRents: number[] = []
  if (rentValues.length === 0) {
    scopedRows.forEach((row) => {
      const rentPsf = columns.rentPsf ? toNumber(row[columns.rentPsf]) : null
      const unitSize = sizeSqft ?? (columns.sizeSqft ? toNumber(row[columns.sizeSqft]) : null)
      if (rentPsf && unitSize) {
        derivedRents.push((rentPsf * unitSize) / 12)
        return
      }

      const price = priceValue(row, columns)
      const yieldValue = getYield(row, columns).value
      if (price !== null && yieldValue !== null) {
        derivedRents.push((price * (yieldValue / 100)) / 12)
      }
    })
  }

  const monthlyValues = rentValues.length ? rentValues : derivedRents
  const yieldValues = scopedRows
    .map((row) => getYield(row, columns).value)
    .filter((value): value is number => value !== null)

  const balanceValues = scopedRows.map((row) => inferBalance(row, columns))

  return {
    source,
    level: projectName ? "project" : "area",
    name: projectName ?? areaName,
    projects_count: scopedRows.length,
    monthly_rent: {
      avg: average(monthlyValues),
      median: median(monthlyValues),
      p25: percentile(monthlyValues, 25),
      p75: percentile(monthlyValues, 75),
    },
    gross_yield: average(yieldValues),
    market_balance: countBy(balanceValues),
  }
}

export async function secondaryMarket(params: Record<string, unknown>) {
  const { rows, source } = await getEntrestateRows({ maxRows: MAX_DAAS_ROWS, preferTable: DAAS_PREFERRED_TABLE })
  const columns = resolveColumns(rows)

  const name = coerceString(params.name)
  const includeComparables = Boolean(params.include_comparables ?? params.includeComparables)

  const baseRows = name
    ? rows.filter((row) =>
        matchesText(columns.name ? row[columns.name] : null, name) ||
        matchesText(columns.area ? row[columns.area] : null, name),
      )
    : rows

  const liquidityValues = columns.liquidity
    ? baseRows.map((row) => toNumber(row[columns.liquidity])).filter((value): value is number => value !== null)
    : []

  const appreciationValues = columns.appreciation
    ? baseRows.map((row) => toNumber(row[columns.appreciation])).filter((value): value is number => value !== null)
    : []

  const unitsAvailable = columns.unitsAvailable
    ? baseRows
        .map((row) => toNumber(row[columns.unitsAvailable]))
        .filter((value): value is number => value !== null)
        .reduce((sum, val) => sum + val, 0)
    : null

  const comparables = includeComparables && columns.area && columns.name
    ? buildComparables(baseRows, rows, columns)
    : []

  return {
    source,
    name,
    liquidity_score: average(liquidityValues),
    appreciation_rate: average(appreciationValues),
    units_available: unitsAvailable,
    comparables,
  }
}

function buildComparables(baseRows: DataRow[], allRows: DataRow[], columns: Record<string, string | null>) {
  const areaValue = columns.area ? toStringValue(baseRows[0]?.[columns.area]) : null
  if (!areaValue) return []

  const areaRows = allRows.filter((row) => matchesText(row[columns.area!], areaValue))
  const sorted = areaRows
    .map((row) => buildListingItem(row, columns))
    .filter((item) => item.name)
    .sort((a, b) => (b.liquidity ?? 0) - (a.liquidity ?? 0))

  return sorted.slice(0, 5)
}

export async function dashboard(params: Record<string, unknown>) {
  const { rows, source } = await getEntrestateRows({ maxRows: MAX_DAAS_ROWS, preferTable: DAAS_PREFERRED_TABLE })
  const columns = resolveColumns(rows)

  const city = coerceString(params.city)
  const scopedRows = city && columns.city ? rows.filter((row) => matchesText(row[columns.city], city)) : rows

  const prices = scopedRows
    .map((row) => priceValue(row, columns))
    .filter((value): value is number => value !== null)

  const yields = scopedRows
    .map((row) => getYield(row, columns).value)
    .filter((value): value is number => value !== null)

  const appreciation = columns.appreciation
    ? scopedRows.map((row) => toNumber(row[columns.appreciation])).filter((value): value is number => value !== null)
    : []

  const liquidity = columns.liquidity
    ? scopedRows.map((row) => toNumber(row[columns.liquidity])).filter((value): value is number => value !== null)
    : []

  const balanceValues = scopedRows.map((row) => inferBalance(row, columns))
  const confidenceValues = columns.confidence
    ? scopedRows.map((row) => toStringValue(row[columns.confidence]))
    : []

  const statusValues = columns.status ? scopedRows.map((row) => toStringValue(row[columns.status])) : []

  const topAreasByYield = groupAverage(scopedRows, columns, "area", columns.yieldGross ? "yieldGross" : "yieldNet")
    .filter((item) => item.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 5)

  const topAreasByAppreciation = groupAverage(scopedRows, columns, "area", "appreciation")
    .filter((item) => item.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 5)

  const highYieldCount = yields.filter((value) => value >= 10).length
  const undersuppliedCount = balanceValues.filter((value) =>
    value ? value.toLowerCase().includes("under") : false,
  ).length
  const strongOpportunityCount = scopedRows.filter((row) => {
    const liquidityScore = columns.liquidity ? toNumber(row[columns.liquidity]) : null
    const appreciationScore = columns.appreciation ? toNumber(row[columns.appreciation]) : null
    return liquidityScore !== null && appreciationScore !== null && liquidityScore >= 70 && appreciationScore >= 8
  }).length

  const alerts = [
    highYieldCount > 0 ? `${highYieldCount} projects with 10%+ yield identified` : null,
    undersuppliedCount > 0 ? `${undersuppliedCount} projects in undersupplied markets` : null,
    strongOpportunityCount > 0
      ? `${strongOpportunityCount} projects with high liquidity and strong appreciation`
      : null,
  ].filter(Boolean)

  return {
    source,
    overview: {
      total_projects: scopedRows.length,
      portfolio_value: prices.reduce((sum, val) => sum + val, 0),
      avg_price: average(prices),
      avg_yield: average(yields),
      avg_appreciation: average(appreciation),
    },
    market_health: {
      undersupplied_pct: scopedRows.length ? (undersuppliedCount / scopedRows.length) * 100 : null,
      high_confidence_pct: confidenceValues.length
        ? (confidenceValues.filter((value) => value && value.toLowerCase().includes("high")).length / confidenceValues.length) * 100
        : null,
      avg_liquidity: average(liquidity),
    },
    top_areas_by_yield: topAreasByYield,
    top_areas_by_appreciation: topAreasByAppreciation,
    top_developers: countBy(columns.developer ? scopedRows.map((row) => toStringValue(row[columns.developer])) : [], 5),
    price_distribution: buildPriceDistribution(prices),
    status_distribution: countBy(statusValues),
    yield_distribution: buildYieldDistribution(yields),
    alerts,
  }
}

function buildPriceDistribution(values: number[]) {
  const buckets = [
    { label: "Under 500K", max: 500_000 },
    { label: "500K - 1M", max: 1_000_000 },
    { label: "1M - 2M", max: 2_000_000 },
    { label: "2M - 5M", max: 5_000_000 },
    { label: "Over 5M", max: Infinity },
  ]

  const counts = buckets.map((bucket) => ({ label: bucket.label, count: 0 }))
  values.forEach((value) => {
    const index = buckets.findIndex((bucket) => value < bucket.max)
    if (index >= 0) counts[index].count += 1
  })

  return counts
}

function buildYieldDistribution(values: number[]) {
  const buckets = [
    { label: "Premium 8%+", min: 8 },
    { label: "Strong 6-8%", min: 6 },
    { label: "Moderate 4-6%", min: 4 },
    { label: "Low under 4%", min: 0 },
  ]

  const counts = buckets.map((bucket) => ({ label: bucket.label, count: 0 }))
  values.forEach((value) => {
    if (value >= 8) counts[0].count += 1
    else if (value >= 6) counts[1].count += 1
    else if (value >= 4) counts[2].count += 1
    else counts[3].count += 1
  })
  return counts
}
