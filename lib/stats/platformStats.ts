import "server-only"
import { getMarketPulse, listAreas, listDevelopers } from "@/lib/decision-infrastructure"
import { PLATFORM_METRICS_FALLBACK } from "@/lib/platform-metrics"

type LabelRow = {
  label?: string | null
  count?: number | null
}

export type PlatformStats = {
  dataAsOf: string
  totalProjects: number
  totalAreas: number
  ratedDevelopers: number
  strongBuyCount: number
  buyCount: number
  holdCount: number
  waitCount: number
  avoidCount: number
  highConfidence: number
  avgPrice: number | null
  avgYield: number | null
}

function getCount(rows: unknown, label: string) {
  if (!Array.isArray(rows)) return 0
  const row = (rows as LabelRow[]).find((item) => String(item.label ?? "").toUpperCase() === label)
  return typeof row?.count === "number" && Number.isFinite(row.count) ? row.count : 0
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

export async function platformStats(): Promise<PlatformStats> {
  const [pulse, areas, developers] = await Promise.all([
    getMarketPulse().catch(() => null),
    listAreas().catch(() => null),
    listDevelopers().catch(() => null),
  ])

  const summary = pulse?.summary as Record<string, unknown> | null

  return {
    dataAsOf: pulse?.data_as_of ?? new Date().toISOString(),
    totalProjects: getNumber(summary?.projects) ?? PLATFORM_METRICS_FALLBACK.totalProjects,
    totalAreas: areas?.areas.length ?? PLATFORM_METRICS_FALLBACK.totalAreas,
    ratedDevelopers: developers?.developers.length ?? PLATFORM_METRICS_FALLBACK.ratedDevelopers,
    strongBuyCount: getCount(pulse?.timing_signals, "STRONG_BUY"),
    buyCount: getCount(pulse?.timing_signals, "BUY"),
    holdCount: getCount(pulse?.timing_signals, "HOLD"),
    waitCount: getCount(pulse?.timing_signals, "WAIT"),
    avoidCount: getCount(pulse?.timing_signals, "AVOID"),
    highConfidence: getCount(pulse?.confidence_distribution, "HIGH"),
    avgPrice: getNumber(summary?.avg_price),
    avgYield: getNumber(summary?.avg_yield),
  }
}
