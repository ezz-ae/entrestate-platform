import "server-only"
import { withStatementTimeout } from "@/lib/db-guardrails"
import { PLATFORM_METRICS_FALLBACK } from "@/lib/platform-metrics"

const STATEMENT_TIMEOUT_MS = 15000
const MAX_ROWS = 100

type DbRow = Record<string, unknown>

// row_count below is last-known sample size for MCP client display only.
// Authoritative live counts: query the table or call /api/platform-metrics.
const SCORED_PROJECTS = PLATFORM_METRICS_FALLBACK.totalProjects
const DLD_TRANSACTIONS = PLATFORM_METRICS_FALLBACK.dldTransactions
const DLD_FEED = DLD_TRANSACTIONS // co-tracked

export const MCP_RESOURCES = {
  inventory_clean: {
    description: "Scored UAE projects with full V1 decision scores",
    key_columns: [
      "id",
      "name",
      "slug",
      "area",
      "city",
      "developer",
      "price_from_aed",
      "price_to",
      "timing_label",
      "stress_grade_v1",
      "rental_yield",
      "investor_score_v1",
      "decision_label_v1",
      "evidence_label_v1",
      "yield_label",
      "quality_score",
      "hero_image",
      "bedrooms",
      "completion_date",
      "price_confidence",
      "price_source",
    ],
    row_count: SCORED_PROJECTS,
    updated: "live",
  },
  inventory_full: {
    description: "Scored projects with full evidence-layer columns (180+ fields)",
    key_columns: [
      "name",
      "area",
      "developer",
      "l1_canonical_price",
      "l1_canonical_yield",
      "l2_developer_reliability",
      "l3_area_risk_score",
      "l4_dld_avg_txn_price",
      "engine_god_metric",
      "engine_stress_test",
      "engine_affordability",
      "timing_label",
      "stress_grade_v1",
      "demand_velocity",
      "supply_pressure",
    ],
    row_count: SCORED_PROJECTS,
    updated: "live",
  },
  dld_transactions_arvo: {
    description: "DLD transaction registry from Dubai Land Department (current YTD)",
    key_columns: [
      "transaction_id",
      "area",
      "project",
      "amount",
      "reg_type",
      "prop_type",
      "rooms",
      "size_sqm",
      "price_per_sqm",
      "transaction_date",
      "sub_type",
      "freehold",
      "usage",
      "nearest_mall",
      "nearest_metro",
      "nearest_landmark",
    ],
    row_count: DLD_TRANSACTIONS,
    updated: "daily via arvo.co API",
  },
  dld_transaction_feed: {
    description: "Notification-style DLD entries with badges and classification",
    key_columns: [
      "transaction_id",
      "feed_type",
      "headline",
      "subline",
      "amount",
      "area",
      "project",
      "reg_type",
      "prop_type",
      "badge",
      "is_notable",
      "icon",
      "metadata",
    ],
    row_count: DLD_FEED,
    updated: "daily",
  },
  dld_area_benchmarks_live: {
    description: "UAE area benchmarks with price stats, velocity, and supply mix",
    key_columns: [
      "area",
      "total_transactions",
      "total_volume_aed",
      "avg_price",
      "median_price",
      "p25_price",
      "p75_price",
      "p90_price",
      "avg_price_per_sqm",
      "median_price_per_sqm",
      "offplan_pct",
      "ready_pct",
      "freehold_pct",
      "avg_size_sqm",
      "daily_velocity",
      "most_common_rooms",
      "date_range_start",
      "date_range_end",
    ],
    row_count: 182,
    updated: "daily",
  },
  developer_registry: {
    description: "UAE developers with tiers, logos, and project counts",
    key_columns: ["name", "slug", "tier", "logo_url", "project_count", "avg_price", "min_price", "max_price", "hq", "established"],
    row_count: 75,
    updated: "live",
  },
  entrestate_projects_api: {
    description: "Quality-scored projects for API consumption",
    key_columns: "same as inventory_clean",
    row_count: SCORED_PROJECTS,
    updated: "live view",
  },
  entrestate_developers_api: {
    description: "Developers with active quality projects",
    key_columns: ["name", "slug", "tier", "logo_url", "project_count", "avg_price", "areas"],
    row_count: 75,
    updated: "live view",
  },
  entrestate_areas_api: {
    description: "UAE areas with full analytics",
    key_columns: ["name", "slug", "city", "project_count", "avg_price", "avg_yield", "area_score"],
    row_count: 167,
    updated: "live view",
  },
  source_of_truth_registry: {
    description: "Tracked source metrics with owners and update frequencies",
    key_columns: ["metric_name", "category", "source", "owner", "update_frequency", "current_value"],
    row_count: 31,
    updated: "live",
  },
  entrestate_top_data: {
    description: "Homepage intelligence sections (market pulse, stress test, etc)",
    key_columns: ["section_id", "title", "subtitle", "data"],
    row_count: 14,
    updated: "live",
  },
} as const

function sanitizeTableName(tableName: string) {
  return tableName.replace(/[^a-z0-9_]/gi, "")
}

export async function mcpQuery(input: {
  sql: string
  params?: unknown[]
  limit?: number
}) {
  const trimmed = input.sql.trim().toUpperCase()
  if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("WITH")) {
    return { error: "Only SELECT/WITH queries allowed", status: "rejected" }
  }

  const forbidden = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "CREATE", "GRANT"]
  for (const keyword of forbidden) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i")
    if (regex.test(input.sql)) {
      return { error: `${keyword} statements not allowed`, status: "rejected" }
    }
  }

  const limit = Math.min(input.limit || 50, MAX_ROWS)
  const finalSql = /\bLIMIT\b/i.test(input.sql) ? input.sql : `${input.sql} LIMIT ${limit}`

  try {
    const rows = (await withStatementTimeout(
      (tx) => tx.$queryRawUnsafe<DbRow[]>(finalSql, ...(input.params || [])),
      STATEMENT_TIMEOUT_MS,
    )) as DbRow[]

    return {
      source: "mcp_query",
      status: "success",
      count: rows.length,
      rows,
    }
  } catch (error) {
    return { source: "mcp_query", status: "error", message: String(error) }
  }
}

export async function mcpDescribeTable(tableName: string) {
  const safe = sanitizeTableName(tableName)
  if (!safe) {
    return { table: tableName, error: "Invalid table name" }
  }

  try {
    const columns = (await withStatementTimeout(
      (tx) =>
        tx.$queryRawUnsafe<DbRow[]>(
          `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `,
          safe,
        ),
      STATEMENT_TIMEOUT_MS,
    )) as DbRow[]

    const count = (await withStatementTimeout(
      (tx) => tx.$queryRawUnsafe<DbRow[]>(`SELECT COUNT(*)::int as total FROM "${safe}"`),
      STATEMENT_TIMEOUT_MS,
    )) as DbRow[]

    return {
      table: safe,
      columns,
      row_count: Number(count[0]?.total || 0),
      description: (MCP_RESOURCES as Record<string, { description?: string }>)[safe]?.description || "Unknown table",
    }
  } catch (error) {
    return { table: safe, error: String(error) }
  }
}

export async function mcpSampleData(tableName: string, limit: number = 5) {
  const safe = sanitizeTableName(tableName)
  if (!safe) {
    return { table: tableName, error: "Invalid table name" }
  }

  try {
    const rows = (await withStatementTimeout(
      (tx) => tx.$queryRawUnsafe<DbRow[]>(`SELECT * FROM "${safe}" LIMIT ${Math.min(limit, 20)}`),
      STATEMENT_TIMEOUT_MS,
    )) as DbRow[]

    return { table: safe, count: rows.length, rows }
  } catch (error) {
    return { table: safe, error: String(error) }
  }
}

export async function mcpCrossReference(input: {
  type: "price_vs_dld" | "developer_portfolio" | "area_intelligence" | "golden_visa_opportunities" | "stress_test_report"
  filter?: string
  limit?: number
}) {
  const limit = Math.min(input.limit || 20, 50)
  const filterClause = input.filter ? `AND LOWER(ic.area) LIKE LOWER('%${input.filter.replace(/'/g, "''")}%')` : ""

  const queries: Record<string, string> = {
    price_vs_dld: `
      SELECT ic.name, ic.area, ic.price_from_aed as listed_price,
             dab.median_price as dld_median, dab.p25_price, dab.p75_price,
             dab.avg_price_per_sqm as dld_psqm, dab.daily_velocity,
             CASE
               WHEN ic.price_from_aed < dab.p25_price THEN 'BELOW MARKET'
               WHEN ic.price_from_aed > dab.p75_price THEN 'ABOVE MARKET'
               ELSE 'FAIR VALUE'
             END as price_verdict,
             ic.timing_label, ic.stress_grade_v1, ic.rental_yield
      FROM inventory_clean ic
      JOIN dld_area_benchmarks_live dab ON UPPER(dab.area) = UPPER(ic.area)
      WHERE ic.price_from_aed > 0 ${filterClause}
      ORDER BY ic.quality_score DESC
      LIMIT ${limit}`,
    developer_portfolio: `
      SELECT dr.name as developer, dr.tier, dr.project_count as registry_projects,
             COUNT(ic.id) as clean_projects,
             AVG(ic.price_from_aed)::bigint as avg_price,
             AVG(ic.rental_yield)::numeric(4,2) as avg_yield,
             AVG(ic.investor_score_v1)::numeric(4,1) as avg_score,
             STRING_AGG(DISTINCT ic.area, ', ' ORDER BY ic.area) as areas,
             COUNT(*) FILTER (WHERE ic.timing_label IN ('STRONG_BUY', 'BUY')) as buy_signals,
             COUNT(*) FILTER (WHERE ic.stress_grade_v1 IN ('A','B')) as safe_projects
      FROM developer_registry dr
      LEFT JOIN inventory_clean ic ON LOWER(ic.developer) = LOWER(dr.name)
      GROUP BY dr.name, dr.tier, dr.project_count
      HAVING COUNT(ic.id) > 0
      ORDER BY COUNT(ic.id) DESC
      LIMIT ${limit}`,
    area_intelligence: `
      SELECT dab.area,
             dab.total_transactions, dab.total_volume_aed,
             dab.median_price, dab.avg_price_per_sqm, dab.daily_velocity,
             dab.offplan_pct, dab.ready_pct, dab.freehold_pct,
             COUNT(ic.id) as inventory_projects,
             AVG(ic.price_from_aed)::bigint as inventory_avg_price,
             AVG(ic.rental_yield)::numeric(4,2) as avg_yield,
             COUNT(*) FILTER (WHERE ic.timing_label IN ('STRONG_BUY', 'BUY')) as buy_signals,
             COUNT(*) FILTER (WHERE ic.stress_grade_v1 = 'A') as grade_a_projects
      FROM dld_area_benchmarks_live dab
      LEFT JOIN inventory_clean ic ON UPPER(ic.area) = UPPER(dab.area)
      GROUP BY dab.area, dab.total_transactions, dab.total_volume_aed,
               dab.median_price, dab.avg_price_per_sqm, dab.daily_velocity,
               dab.offplan_pct, dab.ready_pct, dab.freehold_pct
      ORDER BY dab.daily_velocity DESC
      LIMIT ${limit}`,
    golden_visa_opportunities: `
      SELECT ic.name, ic.area, ic.developer, ic.price_from_aed,
             ic.timing_label, ic.stress_grade_v1, ic.rental_yield, ic.investor_score_v1,
             dab.median_price as dld_area_median, dab.freehold_pct,
             CASE WHEN ic.price_from_aed < dab.median_price THEN 'BELOW MEDIAN' ELSE 'AT/ABOVE MEDIAN' END as vs_market
      FROM inventory_clean ic
      LEFT JOIN dld_area_benchmarks_live dab ON UPPER(dab.area) = UPPER(ic.area)
      WHERE ic.price_from_aed >= 2000000
        AND ic.timing_label IN ('STRONG_BUY', 'BUY', 'HOLD')
        AND ic.stress_grade_v1 IN ('A', 'B')
      ORDER BY ic.investor_score_v1 DESC
      LIMIT ${limit}`,
    stress_test_report: `
      SELECT ic.stress_grade_v1, COUNT(*) as projects,
             AVG(ic.price_from_aed)::bigint as avg_price,
             AVG(ic.rental_yield)::numeric(4,2) as avg_yield,
             AVG(ic.investor_score_v1)::numeric(4,1) as avg_score,
             COUNT(*) FILTER (WHERE ic.timing_label IN ('STRONG_BUY', 'BUY')) as buy_signals,
             STRING_AGG(DISTINCT ic.area, ', ' ORDER BY ic.area) as top_areas
      FROM inventory_clean ic
      WHERE ic.stress_grade_v1 IS NOT NULL
      GROUP BY ic.stress_grade_v1
      ORDER BY CASE ic.stress_grade_v1 WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3 WHEN 'D' THEN 4 WHEN 'E' THEN 5 END`,
  }

  const sql = queries[input.type]
  if (!sql) return { error: `Unknown cross-reference type: ${input.type}` }

  try {
    const rows = (await withStatementTimeout(
      (tx) => tx.$queryRawUnsafe<DbRow[]>(sql),
      STATEMENT_TIMEOUT_MS,
    )) as DbRow[]

    return { source: `mcp_cross_reference:${input.type}`, count: rows.length, rows }
  } catch (error) {
    return { source: `mcp_cross_reference:${input.type}`, error: String(error) }
  }
}

export async function mcpTriggerScraper(source: "arvo_dld" | "pf_developers") {
  if (source === "arvo_dld") {
    try {
      const response = await fetch("https://transactions.arvo.co/api/transactions", {
        headers: { "User-Agent": "Entrestate-MCP/1.0" },
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        return { source: "arvo.co", status: "error", code: response.status }
      }

      const transactions = await response.json()
      return {
        source: "arvo.co",
        status: "success",
        transactions_available: Array.isArray(transactions) ? transactions.length : 0,
        message: "Data fetched. Use mcp_query to analyze or sync to database.",
      }
    } catch (error) {
      return { source: "arvo.co", status: "error", message: String(error) }
    }
  }

  return { error: `Unknown scraper: ${source}` }
}
