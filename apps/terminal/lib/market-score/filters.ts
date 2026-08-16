import type { MarketScoreFilters, OverrideFlags, PaginationParams, RoutingParams } from "@/lib/market-score/types"

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

function toList(value: string | null): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function collectParams(searchParams: URLSearchParams, key: string): string[] {
  const direct = searchParams.getAll(key).flatMap((item) => toList(item))
  return Array.from(new Set(direct)).filter(Boolean)
}

function toBoolean(value: string | null): boolean {
  if (!value) return false
  return ["true", "1", "yes", "on"].includes(value.toLowerCase())
}

export function parseMarketScoreFilters(searchParams: URLSearchParams): {
  filters: MarketScoreFilters
  routing: RoutingParams
  pagination: PaginationParams
  overrideFlags: OverrideFlags
} {
  const filters: MarketScoreFilters = {
    cities: collectParams(searchParams, "city"),
    areas: collectParams(searchParams, "area"),
    statusBands: collectParams(searchParams, "status_band"),
    priceTiers: collectParams(searchParams, "price_tier"),
    safetyBands: collectParams(searchParams, "safety_band"),
  }

  const ranked = toBoolean(searchParams.get("ranked"))
  const budgetValue = searchParams.get("budget_aed")
  const parsedBudget = budgetValue ? Number(budgetValue) : undefined
  const routing: RoutingParams = {
    riskProfile: searchParams.get("risk_profile") || undefined,
    horizon: searchParams.get("horizon") || undefined,
    budgetAed: Number.isFinite(parsedBudget) ? parsedBudget : undefined,
    preferredArea: searchParams.get("preferred_area") || undefined,
    bedsPref: searchParams.get("beds_pref") || undefined,
    intent: searchParams.get("intent") || undefined,
  }
  const canRank = Boolean(routing.riskProfile && routing.horizon && Number.isFinite(parsedBudget))
  routing.ranked = ranked && canRank

  const overrideFlags: OverrideFlags = {
    allow2030Plus: toBoolean(searchParams.get("override_2030")),
    allowSpeculative: toBoolean(searchParams.get("override_speculative")),
  }

  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const pageSize = Number.parseInt(searchParams.get("pageSize") || `${DEFAULT_PAGE_SIZE}`, 10)

  return {
    filters,
    routing,
    overrideFlags,
    pagination: {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: Number.isFinite(pageSize) ? Math.min(Math.max(pageSize, 5), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE,
    },
  }
}
