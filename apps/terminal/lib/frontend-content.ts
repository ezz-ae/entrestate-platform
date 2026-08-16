import "server-only"
import { Prisma, dbQuery } from "@/lib/db"
import { getInventoryTableName, getInventoryTableSql } from "@/lib/inventory-table"
import { PLATFORM_METRICS_FALLBACK } from "@/lib/platform-metrics"

export type HomepageSectionRow = {
  id: string
  section: string
  content_json: unknown
  display_order: number | null
}

export type TopDataRow = {
  id: string
  section: string
  title: string | null
  subtitle: string | null
  data_json: unknown
  display_order: number | null
  confidence?: string | null
  last_updated?: string | null
}

type InventoryCountRow = {
  total: number
}

export type MarketPulseSummary = {
  total: number
  avg_price: number | null
  avg_yield: number | null
  buy_signals: number
  high_confidence: number
}

export type ApiContentRow = {
  endpoint: string
  method: string
  description: string | null
  tier_required: string | null
}

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
function splitTableName(tableName: string) {
  const parts = tableName.split(".").map((part) => part.trim()).filter(Boolean)
  if (parts.length === 2 && parts.every((part) => IDENTIFIER_RE.test(part))) {
    return { schema: parts[0], table: parts[1] }
  }
  if (parts.length === 1 && IDENTIFIER_RE.test(parts[0])) {
    return { schema: "public", table: parts[0] }
  }
  return { schema: "public", table: tableName }
}

async function getTableColumns(tableName: string) {
  const { schema, table } = splitTableName(tableName)
  const rows = await dbQuery<Array<{ column_name: string }>[number]>(Prisma.sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = ${schema}
      AND table_name = ${table}
  `)
  return new Set(rows.map((row) => row.column_name))
}

async function getTableColumnsFromSample(tableSql: Prisma.Sql) {
  const rows = await dbQuery<Array<{ row_json: Record<string, unknown> | null }>[number]>(Prisma.sql`
    SELECT to_jsonb(t) AS row_json
    FROM ${tableSql} t
    LIMIT 1
  `)

  const rowJson = rows[0]?.row_json
  if (!rowJson || typeof rowJson !== "object" || Array.isArray(rowJson)) {
    return new Set<string>()
  }

  return new Set(Object.keys(rowJson))
}

function pickColumn(columns: Set<string>, ...candidates: string[]) {
  return candidates.find((candidate) => columns.has(candidate)) ?? null
}

function isMissingRelationError(error: unknown, relation: string) {
  if (!error || typeof error !== "object") return false
  const candidate = error as { code?: string; message?: string; meta?: { message?: string } }
  const message = candidate.meta?.message ?? candidate.message ?? ""
  return (
    candidate.code === "42P01"
    || (candidate.code === "P2010" && message.includes("42P01"))
    || message.includes(`relation \"${relation}\" does not exist`)
    || message.includes(`relation '${relation}' does not exist`)
  )
}

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const candidate = error as { code?: string; message?: string; meta?: { message?: string } }
  const message = candidate.meta?.message ?? candidate.message ?? ""
  return (
    candidate.code === "42703"
    || (candidate.code === "P2010" && message.includes("42703"))
    || message.toLowerCase().includes("column")
       && message.toLowerCase().includes("does not exist")
  )
}

const DLD_FALLBACK_TABLES = [
  "api.dld_transactions_v1",
  "public.dld_transactions_v1",
  "dld_transactions_arvo",
  "public.dld_transactions_arvo",
  "api.notifications_v1",
  "public.notifications_v1",
] as const

const INVENTORY_FALLBACK_TABLES = [
  "public.entrestate_projects_api",
  "public.entrestate_projects_api_full",
  "api.entrestate_projects_api",
  "api.entrestate_projects_api_full",
  "api.projects_v1",
  "raw.inventory_full",
  "canonical.inventory_clean",
  "public.inventory_clean",
  "inventory_clean",
] as const

type DldFallbackRow = {
  headline: string | null
  subline: string | null
  amount: number | null
  badge: string | null
  reg_type: string | null
  prop_type: string | null
  is_notable: boolean
}

function isEmptyPayload(value: unknown): boolean {
  if (value === null || value === undefined) return true

  if (Array.isArray(value)) {
    return value.length === 0
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed.length === 0) return true

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed)
        return isEmptyPayload(parsed)
      } catch {
        return false
      }
    }

    return false
  }

  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length === 0
  }

  return false
}

function firstNumericValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value.replace(/,/g, ""))
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

function normalizeDeveloperReliabilityPayload(value: unknown) {
  if (!Array.isArray(value)) return value

  return value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry
    const row = entry as Record<string, unknown>
    return {
      ...row,
      developer: row.developer ?? row.name ?? row.developer_name ?? null,
      projects: firstNumericValue(row, ["projects", "count", "project_count", "total_projects"]),
      reliability:
        firstNumericValue(row, [
          "reliability",
          "developer_reliability_score",
          "developer_reliability",
          "reliability_score",
          "delivery_reliability_score",
          "avg_reliability",
          "score",
          "avg_score",
        ]),
      safe_projects: firstNumericValue(row, ["safe_projects", "safe_count", "qualified_projects", "qualified_count"]),
    }
  })
}

async function buildDldMarketFallbackRows(limit = 12) {
  for (const tableName of DLD_FALLBACK_TABLES) {
    try {
      const rows = await dbQuery<DldFallbackRow>(Prisma.sql`
        SELECT
          COALESCE(
            NULLIF(to_jsonb(t)->>'headline', ''),
            NULLIF(to_jsonb(t)->>'title', ''),
            CONCAT_WS(' · ', NULLIF(to_jsonb(t)->>'project', ''), NULLIF(to_jsonb(t)->>'area', ''))
          ) AS headline,
          COALESCE(
            NULLIF(to_jsonb(t)->>'subline', ''),
            CONCAT_WS(' · ',
              COALESCE(NULLIF(to_jsonb(t)->>'area', ''), NULLIF(to_jsonb(t)->>'community', ''), NULLIF(to_jsonb(t)->>'city', '')),
              COALESCE(NULLIF(to_jsonb(t)->>'reg_type', ''), NULLIF(to_jsonb(t)->>'transaction_type', ''), NULLIF(to_jsonb(t)->>'badge', '')),
              COALESCE(NULLIF(to_jsonb(t)->>'transaction_date', ''), NULLIF(to_jsonb(t)->>'date', ''), NULLIF(to_jsonb(t)->>'created_at', ''))
            )
          ) AS subline,
          COALESCE(
            NULLIF(
              regexp_replace(
                COALESCE(
                  to_jsonb(t)->>'amount_aed',
                  to_jsonb(t)->>'amount',
                  to_jsonb(t)->>'price',
                  to_jsonb(t)->>'value',
                  '0'
                ),
                '[^0-9\\.-]',
                '',
                'g'
              ),
              ''
            )::numeric,
            0
          ) AS amount,
          COALESCE(NULLIF(to_jsonb(t)->>'badge', ''), NULLIF(to_jsonb(t)->>'deal_tag', '')) AS badge,
          COALESCE(NULLIF(to_jsonb(t)->>'reg_type', ''), NULLIF(to_jsonb(t)->>'transaction_type', '')) AS reg_type,
          COALESCE(NULLIF(to_jsonb(t)->>'prop_type', ''), NULLIF(to_jsonb(t)->>'property_type', '')) AS prop_type,
          CASE
            WHEN LOWER(COALESCE(to_jsonb(t)->>'is_notable', 'false')) IN ('true', '1', 'yes') THEN true
            ELSE false
          END AS is_notable
        FROM ${Prisma.raw(tableName)} t
        ORDER BY COALESCE(
          NULLIF(to_jsonb(t)->>'transaction_date', ''),
          NULLIF(to_jsonb(t)->>'date', ''),
          NULLIF(to_jsonb(t)->>'created_at', ''),
          '1970-01-01'
        ) DESC,
        amount DESC NULLS LAST
        LIMIT ${limit}
      `)

      if (rows.length === 0) {
        continue
      }

      return rows.map((row) => ({
        headline: row.headline?.trim() || "DLD transaction",
        subline: row.subline?.trim() || "Dubai Land Department feed",
        amount: typeof row.amount === "number" ? row.amount : 0,
        badge: row.badge,
        reg_type: row.reg_type ?? "",
        prop_type: row.prop_type ?? "",
        is_notable: Boolean(row.is_notable),
      }))
    } catch (error) {
      if (isMissingColumnError(error) || isMissingRelationError(error, tableName)) {
        continue
      }
      throw error
    }
  }

  return []
}

async function buildSafeTopDataFallback(inventoryTotal: number) {
  try {
    return await buildTopDataFallback(inventoryTotal)
  } catch (error) {
    console.error("Top-data fallback failed; returning empty sections.", { error })
    return {
      data_as_of: new Date().toISOString(),
      sections: [],
    }
  }
}

type InventoryContext = {
  tableName: string
  tableSql: Prisma.Sql
  columns: Set<string>
  total: number
}

function buildInventoryCandidates() {
  const configured = getInventoryTableName().trim()
  const candidates = [configured, ...INVENTORY_FALLBACK_TABLES]
  const unique = new Set<string>()

  for (const tableName of candidates) {
    if (!tableName || !tableName.trim()) continue
    unique.add(tableName.trim())
  }

  return {
    configured,
    candidates: Array.from(unique),
  }
}

async function getInventoryContext(): Promise<InventoryContext> {
  const { configured, candidates } = buildInventoryCandidates()
  let fallbackContext: InventoryContext | null = null

  for (const tableName of candidates) {
    const tableSql = tableName.toLowerCase() === configured.toLowerCase()
      ? getInventoryTableSql()
      : Prisma.raw(tableName)

    try {
      const countRows = await dbQuery<InventoryCountRow>(Prisma.sql`
        SELECT COUNT(*)::int AS total
        FROM ${tableSql}
      `)

      const total = countRows[0]?.total ?? 0
      let columns = new Set<string>()

      try {
        columns = await getTableColumns(tableName)
      } catch (columnError) {
        if (!isMissingRelationError(columnError, tableName) && !isMissingColumnError(columnError)) {
          throw columnError
        }
      }

      if (columns.size === 0 && total > 0) {
        try {
          columns = await getTableColumnsFromSample(tableSql)
        } catch {
          columns = new Set<string>()
        }
      }

      const context: InventoryContext = {
        tableName,
        tableSql,
        columns,
        total,
      }

      if (!fallbackContext) {
        fallbackContext = context
      }

      if (total > 0) {
        return context
      }
    } catch (error) {
      if (isMissingRelationError(error, tableName) || isMissingColumnError(error)) {
        continue
      }
    }
  }

  if (fallbackContext) {
    return fallbackContext
  }

  return {
    tableName: configured,
    tableSql: getInventoryTableSql(),
    columns: new Set(),
    total: 0,
  }
}

function buildAvgSql(column: string | null) {
  if (!column) return Prisma.sql`NULL`
  const col = Prisma.raw(column)
  return Prisma.sql`ROUND(AVG(${col}) FILTER (WHERE ${col} > 0))::int`
}

function buildAvgYieldSql(column: string | null) {
  if (!column) return Prisma.sql`NULL`
  const col = Prisma.raw(column)
  return Prisma.sql`ROUND(AVG(${col}::numeric) FILTER (WHERE ${col} > 0), 1)`
}

function buildCountWhenSql(column: string | null, values: string[]) {
  if (!column) return Prisma.sql`0::int`
  const col = Prisma.raw(column)
  const valueSql = Prisma.join(values.map((value) => Prisma.sql`${value}`))
  return Prisma.sql`COUNT(CASE WHEN ${col} IN (${valueSql}) THEN 1 END)::int`
}

async function buildMarketPulseSnapshot(context: InventoryContext) {
  const priceColumn = pickColumn(context.columns, "price_from_aed", "price_from")
  const yieldColumn = pickColumn(context.columns, "rental_yield")
  const timingColumn = pickColumn(context.columns, "timing_label")
  const confidenceColumn = pickColumn(context.columns, "price_confidence")

  const rows = await dbQuery<MarketPulseSummary>(Prisma.sql`
    SELECT
      COUNT(*)::int AS total,
      ${buildAvgSql(priceColumn)} AS avg_price,
      ${buildAvgYieldSql(yieldColumn)} AS avg_yield,
      ${buildCountWhenSql(timingColumn, ["STRONG_BUY", "BUY"])} AS buy_signals,
      ${buildCountWhenSql(confidenceColumn, ["HIGH"])} AS high_confidence
    FROM ${context.tableSql}
  `)

  return rows[0] ?? {
    total: 0,
    avg_price: null,
    avg_yield: null,
    buy_signals: 0,
    high_confidence: 0,
  }
}

async function buildTopDataFallback(inventoryTotal: number) {
  const context = await getInventoryContext()
  const priceColumn = pickColumn(context.columns, "price_from_aed", "price_from")
  const yieldColumn = pickColumn(context.columns, "rental_yield")
  const timingColumn = pickColumn(context.columns, "timing_label")
  const stressColumn = pickColumn(context.columns, "stress_grade_v1")
  const yieldLabelColumn = pickColumn(context.columns, "yield_label")
  const evidenceColumn = pickColumn(context.columns, "evidence_label_v1", "evidence_level")
  const decisionColumn = pickColumn(context.columns, "decision_label_v1", "decision_label")
  const affordabilityColumn = pickColumn(context.columns, "affordability_tier", "affordability_label", "affordability")
  const outcomeColumn = pickColumn(context.columns, "outcome_intent")
  const scoreColumn = pickColumn(context.columns, "investor_score_v1", "investor_score")
  const areaColumn = pickColumn(context.columns, "area")
  const developerColumn = pickColumn(context.columns, "developer")
  const developerReliabilityColumn = pickColumn(context.columns, "developer_reliability_score")
  const goldenVisaColumn = pickColumn(context.columns, "golden_visa_required", "golden_visa")
  const confidenceColumn = pickColumn(context.columns, "price_confidence")

  const [
    marketPulse,
    timingRows,
    stressRows,
    yieldRows,
    evidenceRows,
    decisionRows,
    affordabilityRows,
    outcomeRows,
    topProjectRows,
    areaRows,
    developerRows,
    goldenVisaRows,
    confidenceRows,
    dldMarketRows,
  ] = await Promise.all([
    buildMarketPulseSnapshot(context),
    timingColumn
      ? dbQuery(Prisma.sql`
          SELECT
            ${Prisma.raw(timingColumn)} AS signal,
            COUNT(*)::int AS count,
            ${buildAvgSql(priceColumn)} AS avg_price,
            ${buildAvgYieldSql(yieldColumn)} AS avg_yield
          FROM ${context.tableSql}
          WHERE ${Prisma.raw(timingColumn)} IS NOT NULL
          GROUP BY 1
          ORDER BY count DESC
        `)
      : Promise.resolve([]),
    stressColumn
      ? dbQuery(Prisma.sql`
          SELECT
            ${Prisma.raw(stressColumn)} AS grade,
            COUNT(*)::int AS count,
            ${buildAvgSql(priceColumn)} AS avg_price
          FROM ${context.tableSql}
          WHERE ${Prisma.raw(stressColumn)} IS NOT NULL
          GROUP BY 1
          ORDER BY 1
        `)
      : Promise.resolve([]),
    yieldLabelColumn
      ? dbQuery(Prisma.sql`
          SELECT
            ${Prisma.raw(yieldLabelColumn)} AS label,
            COUNT(*)::int AS count,
            ${buildAvgSql(priceColumn)} AS avg_price,
            ${buildAvgYieldSql(yieldColumn)} AS avg_yield
          FROM ${context.tableSql}
          WHERE ${Prisma.raw(yieldLabelColumn)} IS NOT NULL
          GROUP BY 1
          ORDER BY count DESC
        `)
      : Promise.resolve([]),
    evidenceColumn
      ? dbQuery(Prisma.sql`
          SELECT
            ${Prisma.raw(evidenceColumn)} AS label,
            COUNT(*)::int AS count
          FROM ${context.tableSql}
          WHERE ${Prisma.raw(evidenceColumn)} IS NOT NULL
          GROUP BY 1
          ORDER BY count DESC
        `)
      : Promise.resolve([]),
    decisionColumn
      ? dbQuery(Prisma.sql`
          SELECT
            ${Prisma.raw(decisionColumn)} AS label,
            COUNT(*)::int AS count
          FROM ${context.tableSql}
          WHERE ${Prisma.raw(decisionColumn)} IS NOT NULL
          GROUP BY 1
          ORDER BY count DESC
        `)
      : Promise.resolve([]),
    affordabilityColumn
      ? dbQuery(Prisma.sql`
          SELECT
            ${Prisma.raw(affordabilityColumn)} AS tier,
            COUNT(*)::int AS count,
            ${buildAvgSql(priceColumn)} AS avg_price,
            ${buildAvgYieldSql(yieldColumn)} AS avg_yield,
            ${buildCountWhenSql(timingColumn, ["STRONG_BUY", "BUY"])} AS buy_signals
          FROM ${context.tableSql}
          WHERE ${Prisma.raw(affordabilityColumn)} IS NOT NULL
          GROUP BY 1
          ORDER BY count DESC
        `)
      : Promise.resolve([]),
    outcomeColumn
      ? dbQuery(Prisma.sql`
          SELECT
            LOWER(TRIM(intent)) AS intent,
            COUNT(*)::int AS count,
            ${buildAvgSql(priceColumn)} AS avg_price,
            ${buildAvgYieldSql(yieldColumn)} AS avg_yield
          FROM ${context.tableSql},
            LATERAL unnest(COALESCE(${Prisma.raw(outcomeColumn)}, ARRAY[]::text[])) AS intent
          GROUP BY 1
          ORDER BY count DESC
        `)
      : Promise.resolve([]),
    scoreColumn
      ? dbQuery(Prisma.sql`
          SELECT
            name,
            ${areaColumn ? Prisma.raw(areaColumn) : Prisma.sql`NULL`} AS area,
            ${developerColumn ? Prisma.raw(developerColumn) : Prisma.sql`NULL`} AS developer,
            ${priceColumn ? Prisma.raw(priceColumn) : Prisma.sql`NULL`} AS price_from_aed,
            ${yieldColumn ? Prisma.raw(yieldColumn) : Prisma.sql`NULL`} AS rental_yield,
            ${stressColumn ? Prisma.raw(stressColumn) : Prisma.sql`NULL`} AS stress_grade_v1,
            ${timingColumn ? Prisma.raw(timingColumn) : Prisma.sql`NULL`} AS timing_label,
            ${Prisma.raw(scoreColumn)} AS investor_score_v1
          FROM ${context.tableSql}
          WHERE ${Prisma.raw(scoreColumn)} IS NOT NULL
          ORDER BY ${Prisma.raw(scoreColumn)} DESC NULLS LAST
          LIMIT 10
        `)
      : Promise.resolve([]),
    areaColumn
      ? dbQuery(Prisma.sql`
          SELECT
            ${Prisma.raw(areaColumn)} AS area,
            COUNT(*)::int AS count,
            ${buildAvgSql(priceColumn)} AS avg_price,
            ${buildAvgYieldSql(yieldColumn)} AS avg_yield,
            ${scoreColumn ? Prisma.sql`ROUND(AVG(${Prisma.raw(scoreColumn)}::numeric), 1)` : Prisma.sql`NULL`} AS avg_score
          FROM ${context.tableSql}
          WHERE ${Prisma.raw(areaColumn)} IS NOT NULL AND TRIM(${Prisma.raw(areaColumn)}) <> ''
          GROUP BY 1
          ORDER BY count DESC
          LIMIT 10
        `)
      : Promise.resolve([]),
    developerColumn
      ? dbQuery(Prisma.sql`
          SELECT
            ${Prisma.raw(developerColumn)} AS developer,
            COUNT(*)::int AS count,
            ${developerReliabilityColumn
              ? Prisma.sql`ROUND(AVG(${Prisma.raw(developerReliabilityColumn)}::numeric), 1)`
              : Prisma.sql`NULL`} AS reliability,
            ${buildCountWhenSql(stressColumn, ["A", "B"])} AS safe_projects
          FROM ${context.tableSql}
          WHERE ${Prisma.raw(developerColumn)} IS NOT NULL AND TRIM(${Prisma.raw(developerColumn)}) <> ''
          GROUP BY 1
          ORDER BY count DESC
          LIMIT 10
        `)
      : Promise.resolve([]),
    goldenVisaColumn
      ? dbQuery(Prisma.sql`
          SELECT
            COUNT(*)::int AS eligible_count,
            ${buildAvgSql(priceColumn)} AS avg_price,
            ${buildCountWhenSql(stressColumn, ["A", "B"])} AS safe_count,
            ${buildCountWhenSql(timingColumn, ["STRONG_BUY", "BUY"])} AS buy_signals
          FROM ${context.tableSql}
          WHERE ${Prisma.raw(goldenVisaColumn)} = true
        `)
      : Promise.resolve([]),
    confidenceColumn
      ? dbQuery(Prisma.sql`
          SELECT
            ${Prisma.raw(confidenceColumn)} AS label,
            COUNT(*)::int AS count
          FROM ${context.tableSql}
          WHERE ${Prisma.raw(confidenceColumn)} IS NOT NULL
          GROUP BY 1
          ORDER BY count DESC
        `)
      : Promise.resolve([]),
    buildDldMarketFallbackRows(),
  ])

  const dataAsOf = new Date().toISOString()
  const sections: TopDataRow[] = []

  const pushSection = (id: string, data: unknown, order: number) => {
    sections.push({
      id,
      section: id,
      title: null,
      subtitle: null,
      data_json: data,
      display_order: order,
      confidence: null,
      last_updated: dataAsOf,
    })
  }

  pushSection("market-pulse", { ...marketPulse, total: inventoryTotal }, 1)
  pushSection("timing-signals", timingRows, 2)
  pushSection("stress-grades", stressRows, 3)
  pushSection("yield-labels", yieldRows, 4)
  pushSection("evidence-levels", evidenceRows, 5)
  pushSection("decision-labels", decisionRows, 6)
  pushSection("affordability", affordabilityRows, 7)
  pushSection("outcome-intents", outcomeRows, 8)
  pushSection("top-projects", topProjectRows, 9)
  pushSection("area-intelligence", areaRows, 10)
  pushSection("developer-reliability", developerRows, 11)
  pushSection("golden-visa", goldenVisaRows[0] ?? {}, 12)
  pushSection("trust-bar", { confidence_distribution: confidenceRows }, 13)
  pushSection("dld-market", dldMarketRows, 14)

  return {
    data_as_of: dataAsOf,
    sections,
  }
}

export async function getHomepageContentSections() {
  const rows = await dbQuery<HomepageSectionRow>(Prisma.sql`
    SELECT id, section, content_json, display_order
    FROM entrestate_homepage
    WHERE is_live = true
    ORDER BY display_order
  `)

  return {
    data_as_of: new Date().toISOString(),
    sections: rows,
  }
}

export async function getTopDataRows() {
  const inventoryContext = await getInventoryContext()
  const inventoryTotal = inventoryContext.total > 0 ? inventoryContext.total : PLATFORM_METRICS_FALLBACK.totalProjects
  let rows: TopDataRow[] = []

  try {
    rows = await dbQuery<TopDataRow>(Prisma.sql`
      SELECT id, section, title, subtitle, data_json, display_order, confidence, last_updated
      FROM entrestate_top_data
      WHERE is_live = true
      ORDER BY display_order
    `)
  } catch (error) {
    if (isMissingRelationError(error, "entrestate_top_data") || isMissingColumnError(error)) {
      return buildSafeTopDataFallback(inventoryTotal)
    }
    throw error
  }

  const dldFallbackRows = await buildDldMarketFallbackRows()

  const normalizedRows = rows.map((row) => {
    if (row.id === "dld-market") {
      if (!isEmptyPayload(row.data_json)) {
        return row
      }

      return {
        ...row,
        data_json: dldFallbackRows,
      }
    }

    if (row.id === "developer-reliability") {
      return {
        ...row,
        data_json: normalizeDeveloperReliabilityPayload(row.data_json),
      }
    }

    if (row.id !== "market-pulse") return row

    const dataJson = row.data_json && typeof row.data_json === "object" && !Array.isArray(row.data_json)
      ? { ...(row.data_json as Record<string, unknown>) }
      : null

    if (dataJson && typeof dataJson.totalProjects !== "undefined") {
      dataJson.totalProjects = inventoryTotal
    }

    return {
      ...row,
      subtitle: row.subtitle?.replace(/\b1,216\b|\b1216\b|\b1,642\b|\b1642\b/g, inventoryTotal.toLocaleString()) ?? null,
      data_json: dataJson ?? row.data_json,
    }
  })

  return {
    data_as_of: new Date().toISOString(),
    sections: normalizedRows,
  }
}

export async function getMarketPulseSummary() {
  let summary: MarketPulseSummary

  try {
    const context = await getInventoryContext()
    summary = await buildMarketPulseSnapshot(context)
  } catch (error) {
    console.error("Market pulse summary fallback engaged.", { error })
    summary = {
      total: 0,
      avg_price: null,
      avg_yield: null,
      buy_signals: 0,
      high_confidence: 0,
    }
  }

  return {
    data_as_of: new Date().toISOString(),
    summary,
  }
}

export async function getOutcomeIntentCounts() {
  const context = await getInventoryContext()
  const outcomeColumn = pickColumn(context.columns, "outcome_intent")
  if (!outcomeColumn) {
    return {
      data_as_of: new Date().toISOString(),
      rows: [],
    }
  }

  const rows = await dbQuery<Array<{ intent: string; count: number }>[number]>(Prisma.sql`
    SELECT
      LOWER(TRIM(intent)) AS intent,
      COUNT(*)::int AS count
    FROM ${context.tableSql},
      LATERAL unnest(COALESCE(${Prisma.raw(outcomeColumn)}, ARRAY[]::text[])) AS intent
    GROUP BY 1
    ORDER BY count DESC
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}

export async function getApiContentRows() {
  const rows = await dbQuery<ApiContentRow>(Prisma.sql`
    SELECT endpoint, method, description, tier_required
    FROM entrestate_api_content
    WHERE is_live = true
    ORDER BY endpoint
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}
