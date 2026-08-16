import "server-only"
import { dbQuery, Prisma } from "@/lib/db"
import { PLATFORM_METRICS_FALLBACK, withPlatformMetricFallback, type PlatformMetrics } from "@/lib/platform-metrics"
import { platformStats } from "@/lib/stats/platformStats"

type CountRow = {
  count: number
}

const DLD_COUNT_TABLES = [
  "api.dld_transactions_v1",
  "public.dld_transactions_v1",
  "dld_transactions_arvo",
  "public.dld_transactions_arvo",
] as const

function isMissingRelationError(error: unknown, relation: string) {
  if (!error || typeof error !== "object") return false
  const candidate = error as { code?: string; message?: string; meta?: { message?: string } }
  const message = candidate.meta?.message ?? candidate.message ?? ""
  return (
    candidate.code === "42P01"
    || (candidate.code === "P2010" && message.includes("42P01"))
    || message.includes(`relation "${relation}" does not exist`)
    || message.includes(`relation '${relation}' does not exist`)
  )
}

async function countDldTransactions() {
  for (const tableName of DLD_COUNT_TABLES) {
    try {
      const rows = await dbQuery<CountRow>(Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM ${Prisma.raw(tableName)}
      `)

      const count = rows[0]?.count
      if (typeof count === "number" && Number.isFinite(count) && count > 0) {
        return count
      }
    } catch (error) {
      if (isMissingRelationError(error, tableName)) continue
      throw error
    }
  }

  return PLATFORM_METRICS_FALLBACK.dldTransactions
}

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const [stats, dldTransactions] = await Promise.all([
    platformStats().catch(() => null),
    countDldTransactions().catch(() => PLATFORM_METRICS_FALLBACK.dldTransactions),
  ])

  return withPlatformMetricFallback({
    dataAsOf: stats?.dataAsOf ?? new Date().toISOString(),
    totalProjects: stats?.totalProjects,
    totalAreas: stats?.totalAreas,
    ratedDevelopers: stats?.ratedDevelopers,
    strongBuySignals: stats?.strongBuyCount,
    buySignals: (stats?.strongBuyCount ?? 0) + (stats?.buyCount ?? 0),
    holdSignals: stats?.holdCount,
    waitSignals: stats?.waitCount,
    avoidSignals: stats?.avoidCount,
    highConfidence: stats?.highConfidence,
    dldTransactions,
    avgPrice: stats?.avgPrice,
    avgYield: stats?.avgYield,
  })
}
