import "server-only"
import { Prisma, dbQuery } from "@/lib/db"
import { buildCoverageSummary, buildEmptyCoverageSummary, type CoverageSummary } from "@/lib/data-coverage"
import { getInventoryTableName, getSearchTableName, getSearchTableSql } from "@/lib/inventory-table"
import { listProperties, slugifyName, type PropertyFilters } from "@/lib/decision-infrastructure"

type SearchSortBy = "god_metric" | "price" | "yield" | "timing" | "reliability"

export type SearchIndexInput = {
  query?: string
  locale?: string
  filters?: PropertyFilters
  sortBy?: SearchSortBy
  page?: number
  pageSize?: number
}

export type SearchIndexResult = {
  data_as_of: string
  page: number
  pageSize: number
  total: number
  projects: Record<string, unknown>[]
  source_view: string
  coverage: CoverageSummary
}

type CountRow = { total: number }

const SEARCH_NAME_EXPR = Prisma.sql`
  COALESCE(
    NULLIF(to_jsonb(s)->>'project_name', ''),
    NULLIF(to_jsonb(s)->>'name', ''),
    NULLIF(to_jsonb(s)->>'title', '')
  )
`

const SEARCH_DEVELOPER_EXPR = Prisma.sql`
  COALESCE(
    NULLIF(to_jsonb(s)->>'developer', ''),
    NULLIF(to_jsonb(s)->>'developer_name', '')
  )
`

const SEARCH_DEVELOPER_AR_EXPR = Prisma.sql`
  COALESCE(
    NULLIF(to_jsonb(s)->>'developer_ar', ''),
    NULLIF(to_jsonb(s)->>'developer_name_ar', '')
  )
`

const SEARCH_AREA_EXPR = Prisma.sql`
  COALESCE(
    NULLIF(to_jsonb(s)->>'area', ''),
    NULLIF(to_jsonb(s)->>'final_area', ''),
    NULLIF(to_jsonb(s)->>'area_name', '')
  )
`

const SEARCH_AREA_AR_EXPR = Prisma.sql`
  COALESCE(
    NULLIF(to_jsonb(s)->>'area_ar', ''),
    NULLIF(to_jsonb(s)->>'area_name_ar', '')
  )
`

function asNumeric(valueExpr: Prisma.Sql) {
  return Prisma.sql`NULLIF(regexp_replace(${valueExpr}, '[^0-9\\.-]', '', 'g'), '')::numeric`
}

const SEARCH_PRICE_EXPR = Prisma.sql`
  COALESCE(
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'price_from_aed'`)},
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'price_from'`)},
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'l1_canonical_price'`)},
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'starting_price'`)},
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'price_start'`)}
  )
`

const SEARCH_YIELD_EXPR = Prisma.sql`
  COALESCE(
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'rental_yield'`)},
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'l1_canonical_yield'`)}
  )
`

const SEARCH_INVESTOR_SCORE_EXPR = Prisma.sql`
  COALESCE(
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'investor_score_v1'`)},
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'engine_god_metric'`)},
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'god_metric'`)}
  )
`

const SEARCH_RELIABILITY_EXPR = Prisma.sql`
  COALESCE(
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'developer_reliability_score'`)},
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'l2_developer_reliability'`)},
    ${asNumeric(Prisma.sql`to_jsonb(s)->>'avg_score'`)}
  )
`

const SEARCH_TIMING_SORT_EXPR = Prisma.sql`
  CASE UPPER(COALESCE(NULLIF(to_jsonb(s)->>'timing_label', ''), NULLIF(to_jsonb(s)->>'l3_timing_signal', '')))
    WHEN 'STRONG_BUY' THEN 5
    WHEN 'BUY' THEN 4
    WHEN 'HOLD' THEN 3
    WHEN 'WAIT' THEN 2
    WHEN 'AVOID' THEN 1
    ELSE 0
  END
`

const SEARCH_SORT_EXPRESSIONS: Record<SearchSortBy, Prisma.Sql> = {
  god_metric: SEARCH_INVESTOR_SCORE_EXPR,
  price: SEARCH_PRICE_EXPR,
  yield: SEARCH_YIELD_EXPR,
  timing: SEARCH_TIMING_SORT_EXPR,
  reliability: SEARCH_RELIABILITY_EXPR,
}

function toSqlList(values: string[]) {
  return Prisma.join(values.map((value) => Prisma.sql`${value}`))
}

function isSkippableSearchError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const candidate = error as { code?: string; message?: string; meta?: { message?: string } }
  const message = candidate.meta?.message ?? candidate.message ?? ""

  return (
    candidate.code === "42P01"
    || candidate.code === "42703"
    || (candidate.code === "P2010" && (message.includes("42P01") || message.includes("42703")))
    || (message.toLowerCase().includes("does not exist") && message.toLowerCase().includes("relation"))
    || (message.toLowerCase().includes("does not exist") && message.toLowerCase().includes("column"))
  )
}

function buildSearchClauses(query: string | undefined, filters: PropertyFilters | undefined, locale?: string) {
  const clauses: Prisma.Sql[] = [Prisma.sql`TRIM(COALESCE(${SEARCH_NAME_EXPR}, '')) <> ''`]

  const normalizedQuery = query?.trim()
  if (normalizedQuery) {
    const searchableAreaExpr = locale === "ar"
      ? Prisma.sql`COALESCE(NULLIF(TRIM(${SEARCH_AREA_AR_EXPR}), ''), ${SEARCH_AREA_EXPR})`
      : SEARCH_AREA_EXPR
    const searchableDeveloperExpr = locale === "ar"
      ? Prisma.sql`COALESCE(NULLIF(TRIM(${SEARCH_DEVELOPER_AR_EXPR}), ''), ${SEARCH_DEVELOPER_EXPR})`
      : SEARCH_DEVELOPER_EXPR

    clauses.push(
      Prisma.sql`(
        ${SEARCH_NAME_EXPR} ILIKE ${`%${normalizedQuery}%`}
        OR ${searchableAreaExpr} ILIKE ${`%${normalizedQuery}%`}
        OR ${searchableDeveloperExpr} ILIKE ${`%${normalizedQuery}%`}
      )`,
    )
  }

  if (filters?.area) {
    const areaExpr = locale === "ar"
      ? Prisma.sql`COALESCE(NULLIF(TRIM(${SEARCH_AREA_AR_EXPR}), ''), ${SEARCH_AREA_EXPR})`
      : SEARCH_AREA_EXPR
    clauses.push(Prisma.sql`${areaExpr} ILIKE ${`%${filters.area}%`}`)
  }

  if (filters?.developer) {
    const developerExpr = locale === "ar"
      ? Prisma.sql`COALESCE(NULLIF(TRIM(${SEARCH_DEVELOPER_AR_EXPR}), ''), ${SEARCH_DEVELOPER_EXPR})`
      : SEARCH_DEVELOPER_EXPR
    clauses.push(Prisma.sql`${developerExpr} ILIKE ${`%${filters.developer}%`}`)
  }

  if (filters?.budgetMinAed !== undefined) {
    clauses.push(Prisma.sql`COALESCE(${SEARCH_PRICE_EXPR}, 0) >= ${filters.budgetMinAed}`)
  }

  if (filters?.budgetMaxAed !== undefined) {
    clauses.push(Prisma.sql`COALESCE(${SEARCH_PRICE_EXPR}, 0) <= ${filters.budgetMaxAed}`)
  }

  if (filters?.timingSignal) {
    clauses.push(
      Prisma.sql`UPPER(COALESCE(NULLIF(to_jsonb(s)->>'timing_label', ''), NULLIF(to_jsonb(s)->>'l3_timing_signal', ''))) = ${filters.timingSignal}`,
    )
  }

  if (filters?.stressGradeMin) {
    const gradeOrder = ["A", "B", "C", "D"] as const
    const index = gradeOrder.indexOf(filters.stressGradeMin)
    const allowedGrades = gradeOrder.slice(0, index + 1)

    clauses.push(
      Prisma.sql`UPPER(COALESCE(NULLIF(to_jsonb(s)->>'stress_grade_v1', ''), NULLIF(to_jsonb(s)->>'l2_stress_test_grade', ''))) IN (${toSqlList([...allowedGrades])})`,
    )
  }

  if (filters?.goldenVisaRequired) {
    clauses.push(
      Prisma.sql`(
        COALESCE(${SEARCH_PRICE_EXPR}, 0) >= 2000000
        OR LOWER(COALESCE(to_jsonb(s)->>'golden_visa', to_jsonb(s)->>'golden_visa_eligible', 'false')) IN ('true', 'yes', '1')
      )`,
    )
  }

  return clauses
}

function mapSearchRow(row: Record<string, unknown>) {
  const projectName = typeof row.project_name === "string"
    ? row.project_name
    : typeof row.name === "string"
      ? row.name
      : "Project"

  const slug = typeof row.slug === "string" && row.slug.trim().length > 0
    ? row.slug
    : slugifyName(projectName)

  return {
    ...row,
    name: projectName,
    project_name: projectName,
    slug,
  }
}

const SEARCH_COVERAGE_FIELDS = [
  { key: "developer", label: "Developer", pick: (row: Record<string, unknown>) => row.developer },
  { key: "area", label: "Area", pick: (row: Record<string, unknown>) => row.area ?? row.final_area },
  { key: "price", label: "Price", pick: (row: Record<string, unknown>) => row.price_from_aed ?? row.l1_canonical_price },
  { key: "yield", label: "Yield", pick: (row: Record<string, unknown>) => row.rental_yield ?? row.l1_canonical_yield },
  { key: "score", label: "Score", pick: (row: Record<string, unknown>) => row.investor_score_v1 ?? row.engine_god_metric ?? row.god_metric },
  { key: "timing", label: "Timing", pick: (row: Record<string, unknown>) => row.timing_label ?? row.l3_timing_signal },
  { key: "stress", label: "Stress", pick: (row: Record<string, unknown>) => row.stress_grade_v1 ?? row.l2_stress_test_grade },
  { key: "slug", label: "Slug", pick: (row: Record<string, unknown>) => row.slug },
] as const

function normalizeSourceCandidates() {
  const primary = getSearchTableName()
  const values = [primary, "api.search_index", "public.search_index"]
  const normalized = new Set<string>()

  for (const value of values) {
    if (value && value.trim().length > 0) {
      normalized.add(value.trim())
    }
  }

  return { primary, candidates: Array.from(normalized) }
}

export async function listSearchIndex(input: SearchIndexInput = {}): Promise<SearchIndexResult> {
  const pageSize = Math.min(Math.max(input.pageSize ?? 25, 1), 100)
  const page = Math.max(input.page ?? 1, 1)
  const offset = (page - 1) * pageSize
  const sortBy = input.sortBy ?? "god_metric"
  const sortExpression = SEARCH_SORT_EXPRESSIONS[sortBy]
  const clauses = buildSearchClauses(input.query, input.filters, input.locale)
  const whereClause = clauses.length > 0 ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}` : Prisma.empty

  const { primary, candidates } = normalizeSourceCandidates()
  let lastEmptyResult: SearchIndexResult | null = null

  for (const tableName of candidates) {
    const tableSql = tableName === primary ? getSearchTableSql() : Prisma.raw(tableName)

    try {
      const [countRows, rows] = await Promise.all([
        dbQuery<CountRow>(Prisma.sql`
          SELECT COUNT(*)::int AS total
          FROM ${tableSql} s
          ${whereClause}
        `),
        dbQuery<Record<string, unknown>>(Prisma.sql`
          SELECT
            COALESCE(NULLIF(to_jsonb(s)->>'id', ''), NULLIF(to_jsonb(s)->>'project_id', '')) AS id,
            ${SEARCH_NAME_EXPR} AS project_name,
            ${SEARCH_DEVELOPER_EXPR} AS developer,
            ${SEARCH_DEVELOPER_AR_EXPR} AS developer_ar,
            ${SEARCH_AREA_EXPR} AS area,
            ${SEARCH_AREA_AR_EXPR} AS area_ar,
            ${SEARCH_AREA_EXPR} AS final_area,
            ${SEARCH_PRICE_EXPR} AS price_from_aed,
            ${SEARCH_YIELD_EXPR} AS rental_yield,
            ${SEARCH_INVESTOR_SCORE_EXPR} AS investor_score_v1,
            ${SEARCH_RELIABILITY_EXPR} AS developer_reliability_score,
            COALESCE(
              NULLIF(to_jsonb(s)->>'timing_label', ''),
              NULLIF(to_jsonb(s)->>'l3_timing_signal', '')
            ) AS timing_label,
            COALESCE(
              NULLIF(to_jsonb(s)->>'stress_grade_v1', ''),
              NULLIF(to_jsonb(s)->>'l2_stress_test_grade', '')
            ) AS stress_grade_v1,
            NULLIF(to_jsonb(s)->>'decision_label_v1', '') AS decision_label_v1,
            NULLIF(to_jsonb(s)->>'slug', '') AS slug
          FROM ${tableSql} s
          ${whereClause}
          ORDER BY ${sortExpression} DESC NULLS LAST
          LIMIT ${pageSize}
          OFFSET ${offset}
        `),
      ])

      const mappedProjects = rows.map((row) => mapSearchRow(row))
      const total = countRows[0]?.total ?? mappedProjects.length

      if (total > 0 || mappedProjects.length > 0) {
        return {
          data_as_of: new Date().toISOString(),
          page,
          pageSize,
          total,
          projects: mappedProjects,
          source_view: tableName,
          coverage: buildCoverageSummary(mappedProjects, [...SEARCH_COVERAGE_FIELDS]),
        }
      }

      lastEmptyResult = {
        data_as_of: new Date().toISOString(),
        page,
        pageSize,
        total: 0,
        projects: [],
        source_view: tableName,
        coverage: buildEmptyCoverageSummary([...SEARCH_COVERAGE_FIELDS]),
      }
    } catch (error) {
      if (isSkippableSearchError(error)) {
        continue
      }

      throw error
    }
  }

  const fallback = await listProperties({
    filters: input.filters,
    page,
    pageSize,
    sortBy,
    locale: input.locale,
  })

  if (fallback.projects.length > 0 || !lastEmptyResult) {
    return {
      data_as_of: fallback.data_as_of,
      page: fallback.page,
      pageSize: fallback.pageSize,
      total: fallback.total,
      projects: fallback.projects,
      source_view: getInventoryTableName(),
      coverage: buildCoverageSummary(fallback.projects, [...SEARCH_COVERAGE_FIELDS]),
    }
  }

  return lastEmptyResult
}
