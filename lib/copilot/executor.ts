import "server-only"
import { Prisma } from "@prisma/client"
import { withStatementTimeout } from "@/lib/db-guardrails"
import {
  AreaRiskBriefInput,
  CompareProjectsInput,
  ApplyDecisionLensInput,
  ListMarketEntitiesInput,
  GenerateDecisionObjectInput,
  GenerateStrategicReportInput,
  GenerateInvestmentRoadmapInput,
  MonitorMarketSegmentsInput,
  DealScreenerInput,
  DeveloperDueDiligenceInput,
  DldAreaBenchmarkInput,
  DldNotableDealsInput,
  DldTransactionSearchInput,
  GenerateInvestorMemoInput,
  MemoSection,
  PriceRealityCheckInput,
} from "@/lib/copilot/tools"
import { getEnterpriseStrategicContext, getStrategicNarrative } from "@/lib/ai/enterprise/service"

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

// Copilot runs against a curated inventory table with V1 columns.
const COPILOT_INVENTORY_TABLE =
  process.env.COPILOT_INVENTORY_TABLE
  ?? "canonical.inventory_clean"
const COPILOT_TABLE_HINT = COPILOT_INVENTORY_TABLE.toLowerCase()
const COPILOT_DEFAULT_AREA_COLUMN =
  COPILOT_TABLE_HINT.includes("inventory_full") || COPILOT_TABLE_HINT.includes("inventory_spine")
    ? "final_area"
    : "area"
const COPILOT_AREA_COLUMN = ((process.env.COPILOT_AREA_COLUMN ?? "").trim() || COPILOT_DEFAULT_AREA_COLUMN)
const COPILOT_HAS_AR_COLUMNS =
  COPILOT_TABLE_HINT.includes("inventory_clean")
  || COPILOT_TABLE_HINT.includes("projects_api")
  || COPILOT_TABLE_HINT.includes("projects_v1")

const COPILOT_DEFAULT_PRICE_COLUMN = "price_from_aed"
const COPILOT_PRICE_COLUMN = ((process.env.COPILOT_PRICE_COLUMN ?? "").trim() || COPILOT_DEFAULT_PRICE_COLUMN)
const COPILOT_SAFE_PRICE_COLUMN = IDENTIFIER_RE.test(COPILOT_PRICE_COLUMN)
  ? COPILOT_PRICE_COLUMN
  : "price_from_aed"

const STATEMENT_TIMEOUT_MS = 8000
const STRESS_GRADE_ORDER = ["A", "B", "C", "D", "E"] as const
const DEAL_SORT_COLUMNS = {
  investor_score_v1: "investor_score_v1",
  price_from_aed: COPILOT_SAFE_PRICE_COLUMN,
  rental_yield: "rental_yield",
  developer_reliability_score: "developer_reliability_score",
} as const

const UAE_CITIES = [
  "dubai",
  "abu dhabi",
  "sharjah",
  "ajman",
  "ras al khaimah",
  "fujairah",
  "umm al quwain",
  "al ain",
] as const

const COPILOT_TABLE_SQL = Prisma.raw(COPILOT_INVENTORY_TABLE)
const COPILOT_PRICE_SQL = Prisma.raw(COPILOT_SAFE_PRICE_COLUMN)
const COPILOT_AREA_EXPR = COPILOT_AREA_COLUMN === "final_area"
  ? Prisma.sql`COALESCE(final_area, area)`
  : Prisma.sql`area`

type DbRow = Record<string, unknown>

type ToolEnvelope<T> = {
  source: string
  data_as_of: string
  count?: number
  no_results?: boolean
  rows?: T[]
  memo?: Record<string, unknown>
}

function nowIso() {
  return new Date().toISOString()
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  if (value && typeof value === "object" && "toNumber" in value) {
    try {
      const parsed = (value as { toNumber: () => number }).toNumber()
      return Number.isFinite(parsed) ? parsed : null
    } catch {
      // fall through
    }
  }
  return null
}

function toSqlList(values: string[]) {
  return Prisma.join(values.map((value) => Prisma.sql`${value}`))
}

type QualityOptions = {
  requirePrice?: boolean
  requireStress?: boolean
  requireArea?: boolean
  requireDeveloper?: boolean
  requireConfidence?: boolean
  onlyUae?: boolean
  excludeGarbageDeveloper?: boolean
  requireBedroomSanity?: boolean
  includeBedroomColumns?: boolean
}

function buildQualityClauses(options: QualityOptions = {}): Prisma.Sql[] {
  const clauses: Prisma.Sql[] = []

  if (options.requirePrice) {
    clauses.push(Prisma.sql`${COPILOT_PRICE_SQL} IS NOT NULL AND ${COPILOT_PRICE_SQL} > 0`)
  }

  if (options.requireStress) {
    clauses.push(Prisma.sql`stress_grade_v1 IS NOT NULL`)
  }

  if (options.requireArea) {
    clauses.push(Prisma.sql`TRIM(COALESCE(${COPILOT_AREA_EXPR}, '')) <> ''`)
  }

  if (options.requireDeveloper) {
    clauses.push(Prisma.sql`TRIM(COALESCE(developer, '')) <> ''`)
  }

  if (options.requireConfidence) {
    clauses.push(Prisma.sql`COALESCE(price_confidence, 'LOW') IN ('MEDIUM', 'HIGH')`)
  }

  if (options.onlyUae) {
    if (COPILOT_INVENTORY_TABLE !== "inventory_clean") {
      clauses.push(
        Prisma.sql`LOWER(COALESCE(NULLIF(TRIM(city), ''), NULLIF(TRIM(emirate), ''), '')) IN (${toSqlList([...UAE_CITIES])})`,
      )
    }
  }

  if (options.excludeGarbageDeveloper) {
    clauses.push(Prisma.sql`LOWER(COALESCE(developer, '')) NOT LIKE '%breadcrumb%'`)
    clauses.push(Prisma.sql`LOWER(COALESCE(developer, '')) NOT LIKE '%@id%'`)
    clauses.push(Prisma.sql`LOWER(COALESCE(developer, '')) NOT LIKE '%http%'`)
    clauses.push(Prisma.sql`LENGTH(COALESCE(developer, '')) <= 80`)
  }

  const includeBedroomColumns = options.includeBedroomColumns !== false

  if (options.requireBedroomSanity && includeBedroomColumns) {
    clauses.push(Prisma.sql`(bedrooms_min IS NULL OR bedrooms_min BETWEEN 0 AND 10)`)
    clauses.push(Prisma.sql`(bedrooms_max IS NULL OR bedrooms_max BETWEEN 0 AND 10)`)
    clauses.push(Prisma.sql`(bedrooms_min IS NULL OR bedrooms_max IS NULL OR bedrooms_min <= bedrooms_max)`)
  }

  return clauses
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    const asNumber = Number(value)
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry))
  }

  if (value && typeof value === "object") {
    if ("toNumber" in value) {
      try {
        return (value as { toNumber: () => number }).toNumber()
      } catch {
        return value
      }
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, normalizeValue(entry)]),
    )
  }

  return value
}

function normalizeRows<T extends DbRow>(rows: T[]): T[] {
  return rows.map((row) => normalizeValue(row) as T)
}

async function runQuery<T extends DbRow>(query: Prisma.Sql): Promise<T[]> {
  const rows = await withStatementTimeout((tx) => tx.$queryRaw<T[]>(query), STATEMENT_TIMEOUT_MS)
  return normalizeRows(rows)
}

function isMissingColumnError(error: unknown, column: string) {
  if (!error || typeof error !== "object") return false
  const prismaError = error as { code?: string; meta?: { message?: string } }
  if (prismaError.code !== "P2010") return false
  const message = prismaError.meta?.message ?? ""
  return message.includes(`column \"${column}\" does not exist`)
}

function buildDealScreenerFilters(
  filters: DealScreenerInput["filters"],
  includeBedroomColumns: boolean,
): Prisma.Sql[] {
  if (!filters) return []

  const clauses: Prisma.Sql[] = []

  if (filters.area) {
    clauses.push(Prisma.sql`LOWER(${COPILOT_AREA_EXPR}) LIKE LOWER(${`%${filters.area}%`})`)
  }

  if (typeof filters.budget_max_aed === "number") {
    clauses.push(Prisma.sql`${COPILOT_PRICE_SQL} <= ${filters.budget_max_aed}`)
  }

  if (includeBedroomColumns) {
    if (typeof filters.beds_min === "number") {
      clauses.push(Prisma.sql`COALESCE(bedrooms_max, bedrooms_min) >= ${filters.beds_min}`)
    }

    if (typeof filters.beds_max === "number") {
      clauses.push(Prisma.sql`COALESCE(bedrooms_min, bedrooms_max) <= ${filters.beds_max}`)
    }

    if (typeof filters.beds_min === "number" || typeof filters.beds_max === "number") {
      clauses.push(Prisma.sql`COALESCE(bedrooms_max, bedrooms_min) BETWEEN 0 AND 10`)
      clauses.push(Prisma.sql`(bedrooms_min IS NULL OR bedrooms_min BETWEEN 0 AND 10)`)
      clauses.push(Prisma.sql`(bedrooms_max IS NULL OR bedrooms_max BETWEEN 0 AND 10)`)
      clauses.push(Prisma.sql`(bedrooms_min IS NULL OR bedrooms_max IS NULL OR bedrooms_min <= bedrooms_max)`)
    }
  }

  if (typeof filters.golden_visa_required === "boolean" && filters.golden_visa_required) {
    clauses.push(
      Prisma.sql`(
        LOWER(COALESCE(hotness_factors ->> 'golden_visa_eligible', hotness_factors ->> 'golden_visa', 'false')) IN ('true', 'yes', '1')
        OR LOWER(COALESCE(outcome_intent::text, '')) LIKE '%golden%visa%'
      )`,
    )
  }

  if (filters.timing_label) {
    clauses.push(Prisma.sql`timing_label = ${filters.timing_label}`)
  }

  if (filters.stress_grade_min) {
    const index = STRESS_GRADE_ORDER.indexOf(filters.stress_grade_min)
    const allowedGrades = STRESS_GRADE_ORDER.slice(0, index + 1)
    clauses.push(Prisma.sql`stress_grade_v1 IN (${toSqlList([...allowedGrades])})`)
  }

  return clauses
}

function buildDealScreenerQuery(input: DealScreenerInput, includeBedroomColumns = true): Prisma.Sql {
  const clauses = [
    ...buildQualityClauses({
      requirePrice: true,
      requireStress: true,
      requireArea: true,
      requireDeveloper: true,
      requireConfidence: true,
      onlyUae: true,
      excludeGarbageDeveloper: true,
      requireBedroomSanity: true,
      includeBedroomColumns,
    }),
    ...buildDealScreenerFilters(input.filters, includeBedroomColumns),
  ]
  const whereClause = clauses.length > 0 ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}` : Prisma.empty
  const sortColumn = Prisma.raw(DEAL_SORT_COLUMNS[input.sort_by])
  const bedroomsMinSql = includeBedroomColumns ? Prisma.sql`bedrooms_min` : Prisma.sql`NULL::double precision`
  const bedroomsMaxSql = includeBedroomColumns ? Prisma.sql`bedrooms_max` : Prisma.sql`NULL::double precision`

  return Prisma.sql`
    SELECT
      id,
      name AS project_name,
      name,
      ${COPILOT_AREA_EXPR} AS area,
      ${COPILOT_HAS_AR_COLUMNS ? Prisma.sql`area_ar` : Prisma.sql`NULL::text`} AS area_ar,
      developer,
      ${COPILOT_HAS_AR_COLUMNS ? Prisma.sql`developer_ar` : Prisma.sql`NULL::text`} AS developer_ar,
      ${COPILOT_PRICE_SQL} AS price_from_aed,
      ${COPILOT_PRICE_SQL} AS price_from,
      rental_yield,
      timing_score,
      timing_label,
      stress_score,
      yield_label,
      evidence_score,
      stress_grade_v1,
      evidence_label_v1,
      investor_score_v1,
      decision_label_v1,
      hero_image,
      golden_visa,
      price_source,
      price_confidence,
      stress_grade_v1,
      evidence_label_v1,
      investor_score_v1,
      decision_label_v1,
      ${bedroomsMinSql} AS bedrooms_min,
      ${bedroomsMaxSql} AS bedrooms_max,
      COALESCE(${bedroomsMinSql}, ${bedroomsMaxSql}) AS beds,
      developer_reliability_score,
      supply_resilience_score,
      liquidity_resilience_score,
      pricing_discipline_score,
      handover_reliability_score,
      area_stability_score,
      payment_plan_score
    FROM ${COPILOT_TABLE_SQL}
    ${whereClause}
    ORDER BY ${sortColumn} DESC NULLS LAST
    LIMIT ${input.limit}
  `
}

export async function executeDealScreener(input: DealScreenerInput): Promise<ToolEnvelope<DbRow>> {
  try {
    const query = buildDealScreenerQuery(input)
    const rows = await runQuery(query)

    return {
      source: "deal_screener",
      data_as_of: nowIso(),
      count: rows.length,
      no_results: rows.length === 0,
      rows,
    }
  } catch (error) {
    if (isMissingColumnError(error, "bedrooms_min") || isMissingColumnError(error, "bedrooms_max")) {
      const query = buildDealScreenerQuery(input, false)
      const rows = await runQuery(query)
      return {
        source: "deal_screener",
        data_as_of: nowIso(),
        count: rows.length,
        no_results: rows.length === 0,
        rows,
      }
    }
    throw error
  }
}

export async function executePriceRealityCheck(input: PriceRealityCheckInput): Promise<ToolEnvelope<DbRow>> {
  const qualityClauses = buildQualityClauses({
    requirePrice: true,
    requireStress: true,
    requireArea: true,
    onlyUae: true,
    requireBedroomSanity: true,
  })

  const query = Prisma.sql`
    SELECT
      name,
      ${COPILOT_PRICE_SQL} AS price_from_aed,
      price_source,
      price_confidence,
      investor_score_v1,
      decision_label_v1,
      timing_label,
      stress_grade_v1,
      yield_label,
      evidence_label_v1
    FROM ${COPILOT_TABLE_SQL}
    WHERE LOWER(name) LIKE LOWER('%' || ${input.project_name} || '%')
      AND ${Prisma.join(qualityClauses, " AND ")}
    LIMIT 5
  `
  const rows = await runQuery(query)

  return {
    source: "price_reality_check",
    data_as_of: nowIso(),
    count: rows.length,
    no_results: rows.length === 0,
    rows,
  }
}

export async function executeAreaRiskBrief(input: AreaRiskBriefInput): Promise<ToolEnvelope<DbRow>> {
  const qualityClauses = buildQualityClauses({
    requirePrice: true,
    requireStress: true,
    requireArea: true,
    onlyUae: true,
    requireBedroomSanity: true,
  })

  const query = Prisma.sql`
    SELECT
      ${COPILOT_AREA_EXPR} AS area,
      COUNT(*)::int AS projects,
      ROUND(AVG(${COPILOT_PRICE_SQL}::numeric) FILTER (WHERE ${COPILOT_PRICE_SQL} > 0)) AS avg_price,
      ROUND(AVG(rental_yield::numeric), 1) AS avg_yield,
      ROUND(AVG(investor_score_v1::numeric), 1) AS avg_score,
      COUNT(CASE WHEN timing_label IN ('STRONG_BUY', 'BUY') THEN 1 END)::int AS buy_signals,
      COUNT(CASE WHEN stress_grade_v1 IN ('A', 'B') THEN 1 END)::int AS safe_projects
    FROM ${COPILOT_TABLE_SQL}
    WHERE LOWER(${COPILOT_AREA_EXPR}) LIKE LOWER('%' || ${input.area_name} || '%')
      AND ${Prisma.join(qualityClauses, " AND ")}
    GROUP BY 1
  `
  const rows = await runQuery(query)

  return {
    source: "area_risk_brief",
    data_as_of: nowIso(),
    count: rows.length,
    no_results: rows.length === 0,
    rows,
  }
}

export async function executeDeveloperDueDiligence(
  input: DeveloperDueDiligenceInput,
): Promise<ToolEnvelope<DbRow>> {
  const registryRows = await runQuery(
    Prisma.sql`
      SELECT name, tier, project_count
      FROM developer_registry
      WHERE name ILIKE '%' || ${input.developer_name} || '%'
      ORDER BY CASE WHEN LOWER(name) = LOWER(${input.developer_name}) THEN 0 ELSE 1 END
      LIMIT 1
    `,
  )

  if (registryRows.length === 0) {
    return {
      source: "developer_due_diligence",
      data_as_of: nowIso(),
      no_results: true,
      rows: [],
    }
  }

  const developerName = registryRows[0].name
  const qualityClauses = buildQualityClauses({
    requirePrice: true,
    requireStress: true,
    requireArea: true,
    requireDeveloper: true,
    requireConfidence: true,
    onlyUae: true,
    excludeGarbageDeveloper: true,
    requireBedroomSanity: true,
  })

  const statsRows = await runQuery(
    Prisma.sql`
      SELECT
        COUNT(*)::int AS projects,
        ROUND(AVG(developer_reliability_score::numeric), 1) AS reliability,
        ROUND(AVG(investor_score_v1::numeric), 1) AS avg_score,
        COUNT(CASE WHEN stress_grade_v1 IN ('A', 'B') THEN 1 END)::int AS safe_projects,
        ROUND(AVG(${COPILOT_PRICE_SQL}::numeric) FILTER (WHERE ${COPILOT_PRICE_SQL} > 0)) AS avg_price,
        array_agg(DISTINCT ${COPILOT_AREA_EXPR}) AS areas
      FROM ${COPILOT_TABLE_SQL}
      WHERE developer ILIKE '%' || ${developerName} || '%'
        AND ${Prisma.join(qualityClauses, " AND ")}
    `,
  )

  const stats = statsRows[0] ?? {}

  return {
    source: "developer_due_diligence",
    data_as_of: nowIso(),
    count: 1,
    rows: [
      {
        developer: developerName,
        tier: registryRows[0].tier,
        registry_projects: registryRows[0].project_count,
        ...stats,
      },
    ],
  }
}

async function loadProjectContext(projectName: string): Promise<DbRow | null> {
  const qualityClauses = buildQualityClauses({
    requirePrice: true,
    requireStress: true,
    requireArea: true,
    onlyUae: true,
    requireBedroomSanity: true,
  })

  const query = Prisma.sql`
    SELECT
      name,
      developer,
      ${COPILOT_AREA_EXPR} AS area,
      stress_score,
      stress_grade_v1,
      timing_label,
      investor_score_v1,
      decision_label_v1,
      evidence_label_v1,
      yield_label,
      price_confidence,
      price_source
    FROM ${COPILOT_TABLE_SQL}
    WHERE LOWER(name) LIKE LOWER('%' || ${projectName} || '%')
      AND ${Prisma.join(qualityClauses, " AND ")}
    LIMIT 1
  `

  const rows = await runQuery(query)
  return rows[0] ?? null
}

function formatScalar(value: unknown): string {
  if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString() : "unavailable"
  if (typeof value === "string" && value.trim().length > 0) return value
  return "unavailable"
}

function buildStressNarrative(projectContext: DbRow | null): string {
  if (!projectContext) return "Stress test is unavailable because the project was not found."
  const grade = formatScalar(projectContext.stress_grade_v1)
  const score = formatScalar(projectContext.stress_score)
  const timing = formatScalar(projectContext.timing_label)
  return `Stress profile: grade ${grade}, stress score ${score}, timing label ${timing}.`
}

function includesSection(sections: MemoSection[], section: MemoSection) {
  return sections.includes(section)
}

export async function executeGenerateInvestorMemo(
  input: GenerateInvestorMemoInput,
): Promise<ToolEnvelope<DbRow>> {
  const projectContext = await loadProjectContext(input.project_name)

  const priceReality = includesSection(input.sections, "price_reality")
    ? await executePriceRealityCheck({ project_name: input.project_name })
    : null

  const areaRisk = includesSection(input.sections, "area_risk")
    ? projectContext?.area
      ? await executeAreaRiskBrief({ area_name: String(projectContext.area) })
      : {
          source: "area_risk_brief",
          data_as_of: nowIso(),
          count: 0,
          no_results: true,
          rows: [],
        }
    : null

  const developer = includesSection(input.sections, "developer")
    ? projectContext?.developer
      ? await executeDeveloperDueDiligence({ developer_name: String(projectContext.developer) })
      : {
          source: "developer_due_diligence",
          data_as_of: nowIso(),
          count: 0,
          no_results: true,
          rows: [],
        }
    : null

  const stressTestSection = includesSection(input.sections, "stress_test")
    ? {
        source: "stress_test",
        data_as_of: nowIso(),
        no_results: !projectContext,
        project: projectContext,
        narrative: buildStressNarrative(projectContext),
      }
    : null

  const memo = {
    project_name: input.project_name,
    project_context: projectContext,
    sections: {
      price_reality: priceReality,
      area_risk: areaRisk,
      developer,
      stress_test: stressTestSection,
    },
    narrative: {
      price_reality:
        priceReality && priceReality.rows?.[0]
          ? `Price snapshot for ${formatScalar(priceReality.rows[0].name)}: price ${formatScalar(
              priceReality.rows[0].price_from_aed,
            )}, source ${formatScalar(priceReality.rows[0].price_source)}, confidence ${formatScalar(
              priceReality.rows[0].price_confidence,
            )}.`
          : "Price reality section returned no matching project.",
      area_risk:
        areaRisk && areaRisk.rows?.[0]
          ? `Area risk snapshot for ${formatScalar(areaRisk.rows[0].area)}: projects ${formatScalar(
              areaRisk.rows[0].projects,
            )}, average price ${formatScalar(areaRisk.rows[0].avg_price)}, average yield ${formatScalar(
              areaRisk.rows[0].avg_yield,
            )}.`
          : "Area risk section returned no matching area.",
      developer:
        developer && developer.rows?.[0]
          ? `Developer snapshot for ${formatScalar(developer.rows[0].developer)}: projects ${formatScalar(
              developer.rows[0].projects,
            )}, reliability ${formatScalar(developer.rows[0].reliability)}, safe projects ${formatScalar(
              developer.rows[0].safe_projects,
            )}.`
          : "Developer diligence section returned no matching developer.",
      stress_test: stressTestSection?.narrative ?? "Stress test section was not requested.",
    },
  }

  return {
    source: "generate_investor_memo",
    data_as_of: nowIso(),
    no_results: !projectContext,
    memo,
  }
}

export async function executeCompareProjects(input: CompareProjectsInput): Promise<ToolEnvelope<DbRow>> {
  const qualityClauses = buildQualityClauses({
    requirePrice: true,
    requireArea: true,
    requireDeveloper: true,
    onlyUae: true,
  })

  const names = input.project_names.map((n) => `%${n}%`)

  const query = Prisma.sql`
    SELECT
      name,
      developer,
      ${COPILOT_AREA_EXPR} AS area,
      ${COPILOT_PRICE_SQL} AS price_from_aed,
      rental_yield,
      price_confidence,
      stress_grade_v1,
      investor_score_v1,
      timing_label,
      decision_label_v1,
      evidence_label_v1,
      yield_label
    FROM ${COPILOT_TABLE_SQL}
    WHERE (${Prisma.join(
      names.map((n) => Prisma.sql`LOWER(name) LIKE LOWER(${n})`),
      " OR ",
    )})
      AND ${Prisma.join(qualityClauses, " AND ")}
    ORDER BY investor_score_v1 DESC
    LIMIT 10
  `

  const rows = await runQuery(query)

  return {
    source: "compare_projects",
    data_as_of: nowIso(),
    count: rows.length,
    no_results: rows.length === 0,
    rows,
  }
}

export async function executeApplyDecisionLens(input: ApplyDecisionLensInput): Promise<ToolEnvelope<DbRow>> {
  return {
    source: "apply_decision_lens",
    data_as_of: nowIso(),
    rows: [{ applied_lens: input.lens, status: "active", message: `The ${input.lens} lens is now active for this session.` }],
  }
}

export async function executeListMarketEntities(input: ListMarketEntitiesInput): Promise<ToolEnvelope<DbRow>> {
  const column = input.type === "AREA" ? COPILOT_AREA_EXPR : Prisma.sql`developer`
  const where = input.query
    ? Prisma.sql`WHERE ${column} ILIKE ${`%${input.query}%`}`
    : Prisma.empty

  const query = Prisma.sql`
    SELECT
      ${column} AS entity_name,
      COUNT(*)::int AS project_count
    FROM ${COPILOT_TABLE_SQL}
    ${where}
    GROUP BY 1
    HAVING COUNT(*) >= 1
    ORDER BY 2 DESC
    LIMIT ${input.limit}
  `

  const rows = await runQuery(query)

  return {
    source: "list_market_entities",
    data_as_of: nowIso(),
    count: rows.length,
    no_results: rows.length === 0,
    rows,
  }
}

export async function executeGenerateDecisionObject(input: GenerateDecisionObjectInput): Promise<ToolEnvelope<DbRow>> {
  const { generatePdfReport, generatePptxDeck, generateHtmlWidget } = await import("@/lib/artifacts/generator")
  const projectContext = await loadProjectContext(input.project_name)

  if (!projectContext) {
    return {
      source: "generate_decision_object",
      data_as_of: nowIso(),
      no_results: true,
      rows: [],
    }
  }

  // Generate a TableSpec for the artifact
  const mockSpec = {
    version: "v1" as const,
    intent: `Analysis for ${input.project_name}`,
    row_grain: "project" as const,
    scope: { projects: [String(projectContext.name)] },
    time_grain: "lifecycle" as const,
    time_range: { mode: "relative" as const, last: 1, unit: "years" as const },
    signals: ["price_from_aed", "rental_yield", "stress_grade_v1"],
    filters: [{ field: "name", op: "eq" as const, value: String(projectContext.name) }],
  }

  const tableHash = "copilot-auto-gen-" + input.project_name.toLowerCase().replace(/[^a-z0-9]/g, "-")

  let artifact
  if (input.type === "PDF_REPORT") {
    artifact = generatePdfReport(mockSpec, tableHash, { title: input.title || `Underwriting Report: ${input.project_name}` })
  } else if (input.type === "PPTX_DECK") {
    artifact = generatePptxDeck(mockSpec, tableHash)
  } else {
    artifact = generateHtmlWidget(mockSpec, tableHash)
  }

  return {
    source: "generate_decision_object",
    data_as_of: nowIso(),
    rows: [{
      artifact_id: artifact.id,
      type: artifact.type,
      format: artifact.format,
      content_type: artifact.contentType,
      content_base64: artifact.content,
      filename: `${input.project_name.toLowerCase().replace(/ /g, "_")}.${artifact.format}`
    }],
  }
}

export async function executeGenerateStrategicReport(input: GenerateStrategicReportInput): Promise<ToolEnvelope<DbRow>> {
  const context = await getEnterpriseStrategicContext()
  const narrative = context ? getStrategicNarrative(context) : "General market analysis."

  const focusFilter = input.focus_areas && input.focus_areas.length > 0
    ? Prisma.sql`AND LOWER(${COPILOT_AREA_EXPR}) IN (${Prisma.join(input.focus_areas.map(a => Prisma.sql`LOWER(${a})`), ", ")})`
    : Prisma.empty

  const [marketOverview, topAreas, riskDistribution] = await Promise.all([
    runQuery(Prisma.sql`
      SELECT
        COUNT(*)::int AS total_projects,
        ROUND(AVG(${COPILOT_PRICE_SQL}::numeric) FILTER (WHERE ${COPILOT_PRICE_SQL} > 0)) AS avg_price,
        ROUND(AVG(rental_yield::numeric), 1) AS avg_yield,
        ROUND(AVG(investor_score_v1::numeric), 1) AS avg_score,
        COUNT(CASE WHEN timing_label IN ('STRONG_BUY', 'BUY') THEN 1 END)::int AS buy_count,
        COUNT(CASE WHEN stress_grade_v1 IN ('A', 'B') THEN 1 END)::int AS safe_count
      FROM ${COPILOT_TABLE_SQL}
      WHERE ${COPILOT_PRICE_SQL} > 0 AND price_confidence IN ('MEDIUM', 'HIGH')
        ${focusFilter}
    `),
    runQuery(Prisma.sql`
      SELECT
        ${COPILOT_AREA_EXPR} AS area,
        COUNT(*)::int AS projects,
        ROUND(AVG(rental_yield::numeric), 1) AS avg_yield,
        ROUND(AVG(investor_score_v1::numeric), 1) AS avg_score
      FROM ${COPILOT_TABLE_SQL}
      WHERE ${COPILOT_PRICE_SQL} > 0 AND price_confidence IN ('MEDIUM', 'HIGH')
        ${focusFilter}
      GROUP BY 1
      HAVING COUNT(*) >= 3
      ORDER BY avg_score DESC
      LIMIT 10
    `),
    runQuery(Prisma.sql`
      SELECT
        stress_grade_v1 AS grade,
        COUNT(*)::int AS count
      FROM ${COPILOT_TABLE_SQL}
      WHERE ${COPILOT_PRICE_SQL} > 0 AND stress_grade_v1 IS NOT NULL
        ${focusFilter}
      GROUP BY 1
      ORDER BY count DESC
    `),
  ])

  return {
    source: "generate_strategic_report",
    data_as_of: nowIso(),
    memo: {
      narrative,
      strategic_intent: input.intent,
      profile_biases: context ? { risk: context.riskBias, yield: context.yieldVsSafety } : null,
      focus_areas: input.focus_areas ?? [],
      market_overview: marketOverview[0] ?? null,
      top_areas: topAreas,
      risk_distribution: riskDistribution,
    }
  }
}

export async function executeGenerateInvestmentRoadmap(input: GenerateInvestmentRoadmapInput): Promise<ToolEnvelope<DbRow>> {
  const context = await getEnterpriseStrategicContext()
  const horizon = context?.horizon || "10yr+"
  const isYieldFocused = context?.yieldVsSafety ? context.yieldVsSafety > 0.6 : false
  const capital = input.initial_capital_aed
  const years = input.target_horizon_years

  // Query real market data for budget-appropriate projects
  const [readyAssets, pipelineAssets, topYieldAreas] = await Promise.all([
    runQuery(Prisma.sql`
      SELECT name, ${COPILOT_AREA_EXPR} AS area, ${COPILOT_PRICE_SQL} AS price_from_aed, rental_yield,
             stress_grade_v1, investor_score_v1, timing_label
      FROM ${COPILOT_TABLE_SQL}
      WHERE ${COPILOT_PRICE_SQL} > 0 AND ${COPILOT_PRICE_SQL} <= ${capital * 0.5}
        AND price_confidence IN ('MEDIUM', 'HIGH')
        AND timing_label IN ('STRONG_BUY', 'BUY')
      ORDER BY ${isYieldFocused ? Prisma.sql`rental_yield` : Prisma.sql`investor_score_v1`} DESC NULLS LAST
      LIMIT 5
    `),
    runQuery(Prisma.sql`
      SELECT name, ${COPILOT_AREA_EXPR} AS area, ${COPILOT_PRICE_SQL} AS price_from_aed, rental_yield,
             stress_grade_v1, investor_score_v1, timing_label
      FROM ${COPILOT_TABLE_SQL}
      WHERE ${COPILOT_PRICE_SQL} > 0 AND ${COPILOT_PRICE_SQL} <= ${capital * 0.4}
        AND price_confidence IN ('MEDIUM', 'HIGH')
        AND stress_grade_v1 IN ('A', 'B')
      ORDER BY rental_yield DESC NULLS LAST
      LIMIT 5
    `),
    runQuery(Prisma.sql`
      SELECT ${COPILOT_AREA_EXPR} AS area,
             ROUND(AVG(rental_yield::numeric), 1) AS avg_yield,
             COUNT(*)::int AS projects
      FROM ${COPILOT_TABLE_SQL}
      WHERE ${COPILOT_PRICE_SQL} > 0 AND price_confidence IN ('MEDIUM', 'HIGH')
      GROUP BY 1
      HAVING COUNT(*) >= 3
      ORDER BY avg_yield DESC NULLS LAST
      LIMIT 5
    `),
  ])

  const milestones = [
    { year: 1, action: "Acquire high-liquidity ready assets in BUY-signal areas", recommended_projects: readyAssets.slice(0, 3) },
    { year: Math.min(3, years), action: "Reinvest rental income into off-plan pipeline with A/B stress grades", recommended_projects: pipelineAssets.slice(0, 3) },
    { year: Math.min(5, years), action: "Portfolio rebalancing — exit underperformers, reallocate to top-yield areas", top_yield_areas: topYieldAreas },
  ]

  if (years > 5) {
    milestones.push({ year: years, action: "Long-term exit strategy — liquidate mature assets, retain highest performers", recommended_projects: [], top_yield_areas: [] } as unknown as typeof milestones[number])
  }

  return {
    source: "generate_investment_roadmap",
    data_as_of: nowIso(),
    memo: {
      initial_capital: capital,
      horizon_years: years,
      profile_horizon: horizon,
      strategy: isYieldFocused ? "Aggressive Yield" : "Stable Appreciation",
      milestones,
    }
  }
}

export async function executeMonitorMarketSegments(input: MonitorMarketSegmentsInput): Promise<ToolEnvelope<DbRow>> {
  const areaMetrics = await runQuery(Prisma.sql`
    SELECT
      ${COPILOT_AREA_EXPR} AS area,
      ROUND(AVG(rental_yield::numeric), 2) AS current_avg_yield,
      COUNT(*)::int AS projects,
      COUNT(CASE WHEN timing_label IN ('STRONG_BUY', 'BUY') THEN 1 END)::int AS buy_signals,
      COUNT(CASE WHEN stress_grade_v1 IN ('A', 'B') THEN 1 END)::int AS safe_count,
      ROUND(AVG(investor_score_v1::numeric), 1) AS avg_score
    FROM ${COPILOT_TABLE_SQL}
    WHERE LOWER(${COPILOT_AREA_EXPR}) IN (${Prisma.join(input.areas.map(a => Prisma.sql`LOWER(${a})`), ", ")})
      AND ${COPILOT_PRICE_SQL} > 0
      AND price_confidence IN ('MEDIUM', 'HIGH')
    GROUP BY 1
  `)

  const metricsMap = new Map(areaMetrics.map(r => [String(r.area).toLowerCase(), r]))

  const rows = input.areas.map(area => {
    const metrics = metricsMap.get(area.toLowerCase())
    if (!metrics) {
      return { area, status: "no_data", threshold: `${input.alert_threshold_yield}%`, current_avg_yield: null, alert_status: "UNKNOWN" }
    }
    const currentYield = typeof metrics.current_avg_yield === "number" ? metrics.current_avg_yield : 0
    const alert = currentYield >= input.alert_threshold_yield ? "GREEN" : currentYield >= input.alert_threshold_yield * 0.8 ? "AMBER" : "RED"
    return {
      area: metrics.area,
      status: "monitoring",
      threshold: `${input.alert_threshold_yield}%`,
      current_avg_yield: `${currentYield}%`,
      projects: metrics.projects,
      buy_signals: metrics.buy_signals,
      safe_count: metrics.safe_count,
      avg_score: metrics.avg_score,
      alert_status: alert,
    }
  })

  return {
    source: "monitor_market_segments",
    data_as_of: nowIso(),
    rows,
  }
}

export async function executeDldTransactionSearch(input: DldTransactionSearchInput) {
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (input.area) {
    conditions.push(`LOWER(area) LIKE LOWER($${paramIndex})`)
    params.push(`%${input.area}%`)
    paramIndex += 1
  }

  if (input.project) {
    conditions.push(`LOWER(project) LIKE LOWER($${paramIndex})`)
    params.push(`%${input.project}%`)
    paramIndex += 1
  }

  if (input.min_amount) {
    conditions.push(`amount >= $${paramIndex}`)
    params.push(input.min_amount)
    paramIndex += 1
  }

  if (input.max_amount) {
    conditions.push(`amount <= $${paramIndex}`)
    params.push(input.max_amount)
    paramIndex += 1
  }

  if (input.reg_type) {
    conditions.push(`reg_type = $${paramIndex}`)
    params.push(input.reg_type)
    paramIndex += 1
  }

  if (input.prop_type) {
    conditions.push(`prop_type = $${paramIndex}`)
    params.push(input.prop_type)
    paramIndex += 1
  }

  if (input.date_from) {
    conditions.push(`transaction_date >= $${paramIndex}::date`)
    params.push(input.date_from)
    paramIndex += 1
  }

  if (input.date_to) {
    conditions.push(`transaction_date <= $${paramIndex}::date`)
    params.push(input.date_to)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const limit = Math.min(input.limit || 20, 50)

  const rowsSql = `
    SELECT transaction_id, area, project, amount, reg_type, prop_type,
           rooms, size_sqm, price_per_sqm, transaction_date,
           sub_type, freehold, usage
    FROM dld_transactions_arvo
    ${whereClause}
    ORDER BY transaction_date DESC, amount DESC
    LIMIT ${limit}
  `

  const rows = normalizeRows((await withStatementTimeout(
    (tx) => tx.$queryRawUnsafe<DbRow[]>(rowsSql, ...params),
    STATEMENT_TIMEOUT_MS,
  )) as DbRow[])

  const statsSql = `
    SELECT COUNT(*) as total_txns,
           SUM(amount) as total_volume,
           AVG(amount)::bigint as avg_price,
           PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount)::bigint as median_price
    FROM dld_transactions_arvo
    ${whereClause}
  `

  const statsRows = normalizeRows((await withStatementTimeout(
    (tx) => tx.$queryRawUnsafe<DbRow[]>(statsSql, ...params),
    STATEMENT_TIMEOUT_MS,
  )) as DbRow[])

  return {
    source: "dld_transactions_arvo",
    data_as_of: nowIso(),
    count: rows.length,
    stats: statsRows[0] || {},
    rows,
  }
}

export async function executeDldAreaBenchmark(input: DldAreaBenchmarkInput) {
  const rows = normalizeRows((await withStatementTimeout(
    (tx) =>
      tx.$queryRaw<DbRow[]>`
        SELECT * FROM dld_area_benchmarks_live
        WHERE UPPER(area) = UPPER(${input.area_name})
           OR UPPER(area) LIKE '%' || UPPER(${input.area_name}) || '%'
           OR UPPER(${input.area_name}) LIKE '%' || UPPER(area) || '%'
        ORDER BY LENGTH(area) ASC
        LIMIT 1
      `,
    STATEMENT_TIMEOUT_MS,
  )) as DbRow[])

  if (rows.length === 0) {
    return {
      source: "dld_area_benchmarks_live",
      data_as_of: nowIso(),
      no_results: true,
      rows: [],
    }
  }

  return {
    source: "dld_area_benchmarks_live",
    data_as_of: nowIso(),
    count: rows.length,
    rows,
  }
}

export async function executeDldMarketPulse() {
  const overviewRows = normalizeRows((await withStatementTimeout(
    (tx) =>
      tx.$queryRaw<DbRow[]>`
        SELECT
          COUNT(*) as total_transactions,
          SUM(amount) as total_volume,
          AVG(amount)::bigint as avg_price,
          COUNT(DISTINCT area) as unique_areas,
          COUNT(DISTINCT project) as unique_projects,
          MIN(transaction_date) as date_from,
          MAX(transaction_date) as date_to,
          COUNT(*) FILTER (WHERE reg_type = 'Off-Plan') as offplan_count,
          COUNT(*) FILTER (WHERE reg_type = 'Ready') as ready_count,
          COUNT(*) FILTER (WHERE amount >= 10000000) as mega_deals,
          COUNT(*) FILTER (WHERE amount >= 2000000 AND freehold = 'Free Hold') as golden_visa_eligible,
          AVG(amount) FILTER (WHERE reg_type = 'Off-Plan')::bigint as avg_offplan,
          AVG(amount) FILTER (WHERE reg_type = 'Ready')::bigint as avg_ready
        FROM dld_transactions_arvo
      `,
    STATEMENT_TIMEOUT_MS,
  )) as DbRow[])

  const topAreasByVolume = normalizeRows((await withStatementTimeout(
    (tx) =>
      tx.$queryRaw<DbRow[]>`
        SELECT area,
               COUNT(*) as txn_count,
               SUM(amount) as volume,
               AVG(amount)::bigint as avg_price
        FROM dld_transactions_arvo
        GROUP BY area
        ORDER BY volume DESC
        LIMIT 10
      `,
    STATEMENT_TIMEOUT_MS,
  )) as DbRow[])

  const topAreasByVelocity = normalizeRows((await withStatementTimeout(
    (tx) =>
      tx.$queryRaw<DbRow[]>`
        SELECT area, daily_velocity, total_transactions, median_price
        FROM dld_area_benchmarks_live
        ORDER BY daily_velocity DESC
        LIMIT 10
      `,
    STATEMENT_TIMEOUT_MS,
  )) as DbRow[])

  return {
    source: "dld_transactions_arvo + dld_area_benchmarks_live",
    data_as_of: nowIso(),
    overview: overviewRows[0] || null,
    top_areas_by_volume: topAreasByVolume,
    top_areas_by_velocity: topAreasByVelocity,
  }
}

export async function executeDldNotableDeals(input: DldNotableDealsInput) {
  const limit = Math.min(input.limit || 20, 50)
  const daysBack = Math.min(Math.max(input.days || 7, 1), 90)

  let badgeFilter = ""
  const params: unknown[] = []
  if (input.badge) {
    badgeFilter = "AND badge = $1"
    params.push(input.badge)
  }

  const sql = `
    SELECT headline, subline, amount, area, project, reg_type,
           prop_type, badge, is_notable, transaction_date, icon,
           metadata->>'freehold' as freehold,
           metadata->>'nearestLandmark' as landmark
    FROM dld_transaction_feed
    WHERE transaction_date >= CURRENT_DATE - INTERVAL '${daysBack} days'
    ${badgeFilter}
    ORDER BY
      CASE WHEN is_notable THEN 0 ELSE 1 END,
      amount DESC
    LIMIT ${limit}
  `

  const rows = normalizeRows((await withStatementTimeout(
    (tx) => tx.$queryRawUnsafe<DbRow[]>(sql, ...params),
    STATEMENT_TIMEOUT_MS,
  )) as DbRow[])

  return {
    source: "dld_transaction_feed",
    data_as_of: nowIso(),
    count: rows.length,
    rows,
  }
}

export async function executeRefreshDldData() {
  try {
    const response = await fetch("https://transactions.arvo.co/api/transactions", {
      headers: { "User-Agent": "Entrestate-Copilot/1.0" },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      return { source: "arvo.co", status: "error", message: `API returned ${response.status}` }
    }

    const transactions = await response.json()
    return {
      source: "arvo.co",
      data_as_of: nowIso(),
      status: "success",
      transactions_available: Array.isArray(transactions) ? transactions.length : 0,
      message: "DLD data refreshed. Run sync to update database.",
    }
  } catch (error) {
    return { source: "arvo.co", status: "error", message: String(error) }
  }
}

export const copilotExecutors = {
  deal_screener: executeDealScreener,
  price_reality_check: executePriceRealityCheck,
  area_risk_brief: executeAreaRiskBrief,
  developer_due_diligence: executeDeveloperDueDiligence,
  generate_investor_memo: executeGenerateInvestorMemo,
  compare_projects: executeCompareProjects,
  apply_decision_lens: executeApplyDecisionLens,
  list_market_entities: executeListMarketEntities,
  generate_decision_object: executeGenerateDecisionObject,
  generate_strategic_report: executeGenerateStrategicReport,
  generate_investment_roadmap: executeGenerateInvestmentRoadmap,
  monitor_market_segments: executeMonitorMarketSegments,
  dld_transaction_search: executeDldTransactionSearch,
  dld_area_benchmark: executeDldAreaBenchmark,
  dld_market_pulse: executeDldMarketPulse,
  dld_notable_deals: executeDldNotableDeals,
  refresh_dld_data: executeRefreshDldData,
} as const

export { buildDealScreenerQuery }
