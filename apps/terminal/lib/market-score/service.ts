import { prisma } from "@/lib/prisma"
import type {
  MarketScoreCharts,
  MarketScoreFilters,
  MarketScoreInventoryResponse,
  MarketScoreSummary,
  OverrideAuditPayload,
  OverrideFlags,
  PaginationParams,
  RoutingParams,
  SummaryDistribution,
  SystemHealthcheckRow,
} from "@/lib/market-score/types"
import {
  buildAverageByQuery,
  buildAverageQuery,
  buildCountQuery,
  buildDistributionQuery,
  buildDistinctOptionsQuery,
  buildFilterSql,
  buildInventoryColumns,
  buildInventoryQuery,
  buildInventorySourceSql,
  buildOverrideInsertQuery,
  buildSummaryBaseSql,
} from "@/lib/market-score/queries"
import { resolveInventoryContract } from "@/lib/inventory-contract"

type DbClient = {
  $queryRaw<T>(query: unknown): Promise<T>
}

const DEFAULT_TRUTH_PROFILE = "Conservative"
const DEFAULT_TRUTH_HORIZON = "Ready"
const BALANCED_PROFILE = "Balanced"
const BALANCED_HORIZON = "1-2yr"

const HORIZON_BANDS: Record<string, string[]> = {
  Ready: ["Completed", "Handover2025"],
  "6-12mo": ["Handover2025"],
  "1-2yr": ["Handover2025", "Handover2026"],
  "2-4yr": ["Handover2027", "Handover2028_29"],
  "4yr+": ["Handover2028_29", "Handover2030Plus"],
}

function ensureRows<T>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows : []
}

export async function getMarketScoreSummary(
  filters: MarketScoreFilters,
  routing: RoutingParams,
  overrideFlags: OverrideFlags,
  db: DbClient = prisma,
): Promise<MarketScoreSummary> {
  const contract = await resolveInventoryContract(db)
  const hasPriceTier = await hasColumn(db, contract.viewName, "price_tier")
  const includePriceTier = hasPriceTier && !routing.ranked
  const baseSql = buildSummaryBaseSql(routing, overrideFlags, includePriceTier, contract)
  const filterSql = buildFilterSql(filters, { includePriceTier })

  const [totalRowsRaw, avgScoreRowsRaw, safetyRowsRaw, classRowsRaw, statusAvgRowsRaw, safetyAvgRowsRaw, priceAvgRowsRaw] =
    await Promise.all([
      db.$queryRaw<{ count: number }[]>(buildCountQuery(baseSql, filterSql)),
      db.$queryRaw<{ avg_score: number }[]>(buildAverageQuery(baseSql, filterSql)),
      db.$queryRaw<SummaryDistribution[]>(buildDistributionQuery(baseSql, "safety_band", filterSql)),
      db.$queryRaw<SummaryDistribution[]>(buildDistributionQuery(baseSql, "classification", filterSql)),
      db.$queryRaw<{ label: string; avg_score: number }[]>(buildAverageByQuery(baseSql, "status_band", filterSql)),
      db.$queryRaw<{ label: string; avg_score: number }[]>(buildAverageByQuery(baseSql, "safety_band", filterSql)),
      includePriceTier
        ? db.$queryRaw<{ label: string; avg_score: number }[]>(buildAverageByQuery(baseSql, "price_tier", filterSql))
        : Promise.resolve([]),
    ])

  const totalRows = ensureRows(totalRowsRaw)
  const avgScoreRows = ensureRows(avgScoreRowsRaw)
  const safetyRows = ensureRows(safetyRowsRaw)
  const classRows = ensureRows(classRowsRaw)
  const statusAvgRows = ensureRows(statusAvgRowsRaw)
  const safetyAvgRows = ensureRows(safetyAvgRowsRaw)
  const priceAvgRows = ensureRows(priceAvgRowsRaw)

  const [citiesRaw, areasRaw, statusBandsRaw, priceTiersRaw, safetyBandsRaw, conservativePoolRaw, balancedPoolRaw] = await Promise.all([
    db.$queryRaw<{ value: string }[]>(buildDistinctOptionsQuery(baseSql, "city")),
    db.$queryRaw<{ value: string }[]>(
      buildDistinctOptionsQuery(
        baseSql,
        "area",
        buildFilterSql({ ...filters, areas: [], priceTiers: [] }, { includePriceTier: false }),
      ),
    ),
    db.$queryRaw<{ value: string }[]>(buildDistinctOptionsQuery(baseSql, "status_band")),
    includePriceTier ? db.$queryRaw<{ value: string }[]>(buildDistinctOptionsQuery(baseSql, "price_tier")) : Promise.resolve([]),
    db.$queryRaw<{ value: string }[]>(buildDistinctOptionsQuery(baseSql, "safety_band")),
    db.$queryRaw<{ count: number }[]>(
      buildCountQuery(
        buildSummaryBaseSql(
          { riskProfile: DEFAULT_TRUTH_PROFILE, horizon: DEFAULT_TRUTH_HORIZON },
          { allow2030Plus: false, allowSpeculative: false },
          false,
          contract,
        ),
      ),
    ),
    db.$queryRaw<{ count: number }[]>(
      buildCountQuery(
        buildSummaryBaseSql(
          { riskProfile: BALANCED_PROFILE, horizon: BALANCED_HORIZON },
          { allow2030Plus: false, allowSpeculative: false },
          false,
          contract,
        ),
      ),
    ),
  ])

  const cities = ensureRows(citiesRaw)
  const areas = ensureRows(areasRaw)
  const statusBands = ensureRows(statusBandsRaw)
  const priceTiers = ensureRows(priceTiersRaw)
  const safetyBands = ensureRows(safetyBandsRaw)
  const conservativePool = ensureRows(conservativePoolRaw)
  const balancedPool = ensureRows(balancedPoolRaw)

  const total = totalRows[0]?.count ?? 0
  const enrichPercent = (rows: SummaryDistribution[]) =>
    rows.map((row) => ({
      ...row,
      percent: total > 0 ? Number(((row.count / total) * 100).toFixed(1)) : 0,
    }))

  return {
    totalAssets: total,
    avgScore: avgScoreRows[0]?.avg_score ?? 0,
    safetyDistribution: enrichPercent(safetyRows),
    classificationDistribution: enrichPercent(classRows),
    avgScoreByStatus: statusAvgRows.map((row) => ({ label: row.label ?? "Unknown", avgScore: row.avg_score })),
    avgScoreBySafetyBand: safetyAvgRows.map((row) => ({ label: row.label ?? "Unknown", avgScore: row.avg_score })),
    avgScoreByPriceTier: priceAvgRows.map((row) => ({ label: row.label ?? "Unknown", avgScore: row.avg_score })),
    conservativeReadyPool: conservativePool[0]?.count ?? 0,
    balancedDefaultPool: balancedPool[0]?.count ?? 0,
    available: {
      cities: cities.map((row) => row.value).filter(Boolean),
      areas: areas.map((row) => row.value).filter(Boolean),
      statusBands: statusBands.map((row) => row.value).filter(Boolean),
      priceTiers: priceTiers.map((row) => row.value).filter(Boolean),
      safetyBands: safetyBands.map((row) => row.value).filter(Boolean),
    },
    source: routing.riskProfile && routing.horizon ? "routed" : "view",
    truthChecks: {
      conservativeReady: [],
      balancedShort: [],
      horizonViolations: 0,
      speculativeLeak: 0,
    },
  }
}

export async function getMarketScoreCharts(
  filters: MarketScoreFilters,
  routing: RoutingParams,
  overrideFlags: OverrideFlags,
  db: DbClient = prisma,
): Promise<MarketScoreCharts> {
  const contract = await resolveInventoryContract(db)
  const hasPriceTier = await hasColumn(db, contract.viewName, "price_tier")
  const includePriceTier = hasPriceTier && !routing.ranked
  const baseSql = buildSummaryBaseSql(routing, overrideFlags, includePriceTier, contract)
  const filterSql = buildFilterSql(filters, { includePriceTier })

  const [safetyRows, statusAvgRows, safetyAvgRows, priceAvgRows, cityRows] = await Promise.all([
    db.$queryRaw<SummaryDistribution[]>(buildDistributionQuery(baseSql, "safety_band", filterSql)),
    db.$queryRaw<{ label: string; avg_score: number }[]>(buildAverageByQuery(baseSql, "status_band", filterSql)),
    db.$queryRaw<{ label: string; avg_score: number }[]>(buildAverageByQuery(baseSql, "safety_band", filterSql)),
    includePriceTier
      ? db.$queryRaw<{ label: string; avg_score: number }[]>(buildAverageByQuery(baseSql, "price_tier", filterSql))
      : Promise.resolve([]),
    db.$queryRaw<SummaryDistribution[]>(buildDistributionQuery(baseSql, "city", filterSql)),
  ])

  return {
    safetyDistribution: safetyRows,
    avgScoreByStatus: statusAvgRows.map((row) => ({ label: row.label ?? "Unknown", avgScore: row.avg_score })),
    avgScoreBySafetyBand: safetyAvgRows.map((row) => ({ label: row.label ?? "Unknown", avgScore: row.avg_score })),
    avgScoreByPriceTier: priceAvgRows.map((row) => ({ label: row.label ?? "Unknown", avgScore: row.avg_score })),
    countByCity: cityRows,
    source: routing.riskProfile && routing.horizon ? "routed" : "view",
  }
}

export async function getMarketScoreInventory(
  filters: MarketScoreFilters,
  routing: RoutingParams,
  overrideFlags: OverrideFlags,
  pagination: PaginationParams,
  db: DbClient = prisma,
): Promise<MarketScoreInventoryResponse> {
  const contract = await resolveInventoryContract(db)
  const [hasPriceTier, hasDrivers, hasReasonCodes, hasRiskFlags] = await Promise.all([
    hasColumn(db, contract.viewName, "price_tier"),
    hasColumn(db, contract.viewName, "drivers"),
    hasColumn(db, contract.viewName, "reason_codes"),
    hasColumn(db, contract.viewName, "risk_flags"),
  ])
  const columns = buildInventoryColumns({
    includeRank: Boolean(routing.ranked),
    includeDrivers: hasDrivers,
    includeReasonCodes: hasReasonCodes,
    includeRiskFlags: hasRiskFlags,
  })
  const baseSql = buildInventorySourceSql(columns, routing, overrideFlags, contract)
  const filterSql = buildFilterSql(filters, { includePriceTier: hasPriceTier && !routing.ranked })
  const limit = pagination.pageSize
  const offset = (pagination.page - 1) * pagination.pageSize

  const [rows, totalRows] = await Promise.all([
    db.$queryRaw<any[]>(buildInventoryQuery(baseSql, filterSql, limit, offset)),
    db.$queryRaw<{ count: number }[]>(buildCountQuery(baseSql, filterSql)),
  ])

  return {
    rows,
    total: totalRows[0]?.count ?? 0,
    page: pagination.page,
    pageSize: pagination.pageSize,
    source: routing.riskProfile && routing.horizon ? "routed" : "view",
  }
}

export async function recordOverride(
  payload: OverrideAuditPayload,
  db: DbClient = prisma,
): Promise<{ disclosure: unknown | undefined }> {
  const insertQuery = buildOverrideInsertQuery(
    payload.userId,
    payload.riskProfile ?? null,
    payload.horizon ?? null,
    payload.overrideFlags,
    payload.reason,
    payload.selectedAssetId ?? null,
  )

  await db.$queryRaw(insertQuery)
  if (!payload.selectedAssetId || !payload.riskProfile) {
    return { disclosure: undefined }
  }

  const disclosureRows = await db.$queryRaw<{ disclosure: unknown }[]>`
    SELECT generate_override_disclosure(${payload.selectedAssetId}, ${getOverrideType(payload.overrideFlags)}, ${payload.riskProfile}) AS disclosure
  `

  return { disclosure: disclosureRows[0]?.disclosure }
}

export async function buildTruthChecks(db: DbClient) {
  const contract = await resolveInventoryContract(db)
  const conservativeBase = buildSummaryBaseSql(
    { riskProfile: DEFAULT_TRUTH_PROFILE, horizon: DEFAULT_TRUTH_HORIZON },
    { allow2030Plus: false, allowSpeculative: false },
    false,
    contract,
  )
  const balancedBase = buildSummaryBaseSql(
    { riskProfile: BALANCED_PROFILE, horizon: BALANCED_HORIZON },
    { allow2030Plus: false, allowSpeculative: false },
    false,
    contract,
  )
  const conservativeMidBase = buildSummaryBaseSql(
    { riskProfile: DEFAULT_TRUTH_PROFILE, horizon: "2-4yr" },
    { allow2030Plus: false, allowSpeculative: false },
    false,
    contract,
  )

  const [conservativeRowsRaw, balancedRowsRaw, speculativeLeakRowsRaw, horizonViolationRowsRaw] = await Promise.all([
    db.$queryRaw<SummaryDistribution[]>(buildDistributionQuery(conservativeBase, "safety_band")),
    db.$queryRaw<SummaryDistribution[]>(buildDistributionQuery(balancedBase, "safety_band")),
    db.$queryRaw<{ count: number }[]>(
      buildCountQuery(
        conservativeMidBase,
        buildFilterSql(
          { cities: [], areas: [], statusBands: [], priceTiers: [], safetyBands: ["Speculative"] },
          { includePriceTier: false },
        ),
      ),
    ),
    db.$queryRaw<{ count: number }[]>(
      buildCountQuery(
        conservativeBase,
        buildFilterSql(
          {
            cities: [],
            areas: [],
            statusBands: Object.values(HORIZON_BANDS)
              .flat()
              .filter((band) => !HORIZON_BANDS[DEFAULT_TRUTH_HORIZON]?.includes(band)),
            priceTiers: [],
            safetyBands: [],
          },
          { includePriceTier: false },
        ),
      ),
    ),
  ])

  const conservativeRows = ensureRows(conservativeRowsRaw)
  const balancedRows = ensureRows(balancedRowsRaw)
  const speculativeLeakRows = ensureRows(speculativeLeakRowsRaw)
  const horizonViolationRows = ensureRows(horizonViolationRowsRaw)

  return {
    conservativeReady: conservativeRows,
    balancedShort: balancedRows,
    horizonViolations: horizonViolationRows[0]?.count ?? 0,
    speculativeLeak: speculativeLeakRows[0]?.count ?? 0,
  }
}

export async function getLatestHealthcheck(db: DbClient = prisma): Promise<SystemHealthcheckRow | null> {
  const rows = await db.$queryRaw<SystemHealthcheckRow[]>`
    SELECT
      MAX(checked_at) AS created_at,
      COUNT(*)::int AS total_count,
      SUM(CASE WHEN passed THEN 1 ELSE 0 END)::int AS passing_count
    FROM system_healthcheck
  `
  return rows[0] || null
}

async function hasColumn(db: DbClient, table: string, column: string): Promise<boolean> {
  const rows = await db.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = ${table} AND column_name = ${column}
    ) AS exists
  `
  return Boolean(rows[0]?.exists)
}

function getOverrideType(flags: OverrideFlags) {
  if (flags.allow2030Plus && flags.allowSpeculative) return "allow_2030_plus_and_speculative"
  if (flags.allow2030Plus) return "allow_2030_plus"
  if (flags.allowSpeculative) return "allow_speculative"
  return "none"
}
