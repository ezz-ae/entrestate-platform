import "server-only"
import { Prisma } from "@prisma/client"
import { withStatementTimeout } from "@/lib/db-guardrails"
import { buildCoverageSummary, type CoverageSummary } from "@/lib/data-coverage"
import {
  getAreasTableName,
  getAreasTableSql,
  getDetailTableName,
  getDetailTableSql,
  getDevelopersTableName,
  getDevelopersTableSql,
  getInventoryTableName,
  getInventoryTableSql,
  getStatusTableName,
  getStatusTableSql,
} from "@/lib/inventory-table"

const STATEMENT_TIMEOUT_MS = 9000

const PROJECT_SORT_COLUMNS = {
  god_metric: "engine_god_metric",
  price: "l1_canonical_price",
  yield: "l1_canonical_yield",
  timing: "l3_timing_signal",
  reliability: "l2_developer_reliability",
} as const

function curatedNumeric(valueExpr: Prisma.Sql) {
  return Prisma.sql`NULLIF(regexp_replace(${valueExpr}, '[^0-9\\.-]', '', 'g'), '')::numeric`
}

const CURATED_ID = Prisma.sql`
  COALESCE(
    NULLIF(to_jsonb(t)->>'id', ''),
    NULLIF(to_jsonb(t)->>'project_id', '')
  )
`
const CURATED_NAME_EXPR = Prisma.sql`
  COALESCE(
    NULLIF(to_jsonb(t)->>'name', ''),
    NULLIF(to_jsonb(t)->>'project_name', ''),
    NULLIF(to_jsonb(t)->>'title', '')
  )
`
const CURATED_DEVELOPER_EXPR = Prisma.sql`
  COALESCE(
    NULLIF(to_jsonb(t)->>'developer', ''),
    NULLIF(to_jsonb(t)->>'developer_name', '')
  )
`
const CURATED_DEVELOPER_AR_EXPR = Prisma.sql`
  COALESCE(
    NULLIF(to_jsonb(t)->>'developer_ar', ''),
    NULLIF(to_jsonb(t)->>'developer_name_ar', '')
  )
`
const CURATED_AREA_EXPR = Prisma.sql`
  COALESCE(
    NULLIF(to_jsonb(t)->>'area', ''),
    NULLIF(to_jsonb(t)->>'final_area', ''),
    NULLIF(to_jsonb(t)->>'area_name', '')
  )
`
const CURATED_AREA_AR_EXPR = Prisma.sql`
  COALESCE(
    NULLIF(to_jsonb(t)->>'area_ar', ''),
    NULLIF(to_jsonb(t)->>'area_name_ar', '')
  )
`
const CURATED_RENTAL_YIELD = curatedNumeric(Prisma.sql`to_jsonb(t)->>'rental_yield'`)
const CURATED_TIMING_SCORE = curatedNumeric(Prisma.sql`to_jsonb(t)->>'timing_score'`)
const CURATED_TIMING_LABEL = Prisma.sql`NULLIF(to_jsonb(t)->>'timing_label', '')`
const CURATED_STRESS_SCORE = curatedNumeric(Prisma.sql`to_jsonb(t)->>'stress_score'`)
const CURATED_STRESS_GRADE = Prisma.sql`NULLIF(to_jsonb(t)->>'stress_grade_v1', '')`
const CURATED_YIELD_SCORE = curatedNumeric(Prisma.sql`to_jsonb(t)->>'yield_score'`)
const CURATED_YIELD_LABEL = Prisma.sql`NULLIF(to_jsonb(t)->>'yield_label', '')`
const CURATED_EVIDENCE_SCORE = curatedNumeric(Prisma.sql`to_jsonb(t)->>'evidence_score'`)
const CURATED_EVIDENCE_LABEL = Prisma.sql`NULLIF(to_jsonb(t)->>'evidence_label_v1', '')`
const CURATED_INVESTOR_SCORE = curatedNumeric(Prisma.sql`to_jsonb(t)->>'investor_score_v1'`)
const CURATED_DECISION_LABEL = Prisma.sql`NULLIF(to_jsonb(t)->>'decision_label_v1', '')`
const CURATED_HERO_IMAGE = Prisma.sql`NULLIF(to_jsonb(t)->>'hero_image', '')`
const CURATED_GOLDEN_VISA = Prisma.sql`NULLIF(to_jsonb(t)->>'golden_visa', '')`
const CURATED_SCORE_VERSION = Prisma.sql`NULLIF(to_jsonb(t)->>'score_version', '')`
const CURATED_PRICE_CONFIDENCE = Prisma.sql`NULLIF(to_jsonb(t)->>'price_confidence', '')`
const CURATED_PRICE_SOURCE = Prisma.sql`NULLIF(to_jsonb(t)->>'price_source', '')`
const CURATED_DEVELOPER_RELIABILITY = curatedNumeric(Prisma.sql`to_jsonb(t)->>'developer_reliability_score'`)

const CURATED_PRICE_FROM_AED = curatedNumeric(Prisma.sql`to_jsonb(t)->>'price_from_aed'`)
const CURATED_PRICE_FROM = curatedNumeric(Prisma.sql`to_jsonb(t)->>'price_from'`)
const CURATED_STARTING_PRICE = curatedNumeric(Prisma.sql`to_jsonb(t)->>'starting_price'`)
const CURATED_PRICE_START = curatedNumeric(Prisma.sql`to_jsonb(t)->>'price_start'`)
const CURATED_L1_CANONICAL_PRICE = curatedNumeric(Prisma.sql`to_jsonb(t)->>'l1_canonical_price'`)
const CURATED_PRICE_EXPR = Prisma.sql`
  COALESCE(
    ${CURATED_PRICE_FROM_AED},
    ${CURATED_PRICE_FROM},
    ${CURATED_STARTING_PRICE},
    ${CURATED_PRICE_START},
    ${CURATED_L1_CANONICAL_PRICE}
  )
`
const CURATED_PROJECT_SORT_EXPRESSIONS: Record<SortBy, Prisma.Sql> = {
  god_metric: Prisma.sql`investor_score_v1`,
  price: CURATED_PRICE_EXPR,
  yield: Prisma.sql`rental_yield`,
  timing: Prisma.sql`
    CASE UPPER(COALESCE(${CURATED_TIMING_LABEL}, ''))
      WHEN 'STRONG_BUY' THEN 5
      WHEN 'BUY' THEN 4
      WHEN 'HOLD' THEN 3
      WHEN 'WAIT' THEN 2
      WHEN 'AVOID' THEN 1
      ELSE 0
    END
  `,
  reliability: Prisma.sql`developer_reliability_score`,
}

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

const PROPERTIES_TABLE_NAME = getInventoryTableName()
const PROPERTIES_TABLE_SQL = getInventoryTableSql()
const DETAIL_TABLE_NAME = getDetailTableName()
const DETAIL_TABLE_SQL = getDetailTableSql()
const AREAS_TABLE_NAME = getAreasTableName()
const AREAS_TABLE_SQL = getAreasTableSql()
const DEVELOPERS_TABLE_NAME = getDevelopersTableName()
const DEVELOPERS_TABLE_SQL = getDevelopersTableSql()
const STATUS_TABLE_NAME = getStatusTableName()
const STATUS_TABLE_SQL = getStatusTableSql()

function tableEndsWith(tableName: string, suffix: string) {
  return tableName.toLowerCase().endsWith(suffix.toLowerCase())
}

const USE_CURATED_PROPERTIES_VIEW =
  tableEndsWith(PROPERTIES_TABLE_NAME, "entrestate_projects_api") ||
  tableEndsWith(PROPERTIES_TABLE_NAME, "entrestate_projects_api_full") ||
  tableEndsWith(PROPERTIES_TABLE_NAME, "projects_v1") ||
  tableEndsWith(PROPERTIES_TABLE_NAME, "inventory_clean")

const USE_CURATED_AREAS_VIEW =
  tableEndsWith(AREAS_TABLE_NAME, "entrestate_areas_api")
  || tableEndsWith(AREAS_TABLE_NAME, "areas_v1")
  || tableEndsWith(AREAS_TABLE_NAME, "area_intelligence_v1")

const USE_CURATED_DEVELOPERS_VIEW =
  tableEndsWith(DEVELOPERS_TABLE_NAME, "entrestate_developers_api")
  || tableEndsWith(DEVELOPERS_TABLE_NAME, "developers_v1")

type SortBy = keyof typeof PROJECT_SORT_COLUMNS

type DbRow = Record<string, unknown>
export type DecisionRecord = Record<string, unknown>
export type DecisionProject = DecisionRecord & { slug: string }

export type PropertyFilters = {
  area?: string
  developer?: string
  intent?: string
  budgetMaxAed?: number
  budgetMinAed?: number
  bedsMin?: number
  bedsMax?: number
  timingSignal?: "BUY" | "HOLD" | "WAIT"
  stressGradeMin?: "A" | "B" | "C" | "D"
  goldenVisaRequired?: boolean
}

export type ListPropertiesInput = {
  filters?: PropertyFilters
  sortBy?: SortBy
  page?: number
  pageSize?: number
  locale?: string
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
}

function buildQualityClauses(options: QualityOptions = {}): Prisma.Sql[] {
  const clauses: Prisma.Sql[] = []

  if (options.requirePrice) {
    clauses.push(Prisma.sql`COALESCE(l1_canonical_price, 0) > 0`)
  }

  if (options.requireStress) {
    clauses.push(Prisma.sql`l2_stress_test_grade IS NOT NULL`)
  }

  if (options.requireArea) {
    clauses.push(Prisma.sql`TRIM(COALESCE(final_area, area, '')) <> ''`)
  }

  if (options.requireDeveloper) {
    clauses.push(Prisma.sql`TRIM(COALESCE(developer, '')) <> ''`)
  }

  if (options.requireConfidence) {
    clauses.push(Prisma.sql`COALESCE(l1_confidence, 'LOW') IN ('MEDIUM', 'HIGH')`)
  }

  if (options.onlyUae) {
    clauses.push(
      Prisma.sql`LOWER(COALESCE(NULLIF(TRIM(final_city), ''), NULLIF(TRIM(city), ''), '')) IN (${toSqlList([...UAE_CITIES])})`,
    )
  }

  if (options.excludeGarbageDeveloper) {
    clauses.push(Prisma.sql`LOWER(COALESCE(developer, '')) NOT LIKE '%breadcrumb%'`)
    clauses.push(Prisma.sql`LOWER(COALESCE(developer, '')) NOT LIKE '%@id%'`)
    clauses.push(Prisma.sql`LOWER(COALESCE(developer, '')) NOT LIKE '%http%'`)
    clauses.push(Prisma.sql`LENGTH(COALESCE(developer, '')) <= 80`)
  }

  if (options.requireBedroomSanity) {
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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "bigint") {
    const asNumber = Number(value)
    return Number.isFinite(asNumber) ? asNumber : null
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim()
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const numeric = toNumber(value)
    if (numeric !== null) return numeric
  }
  return null
}

function applyLiveCalculations(record: DecisionRecord): DecisionRecord {
  const computed: DecisionRecord = { ...record }
  const existingDldFee = toNumber(computed.dld_registration_fee)
  if (existingDldFee === null) {
    const price = firstNumber(
      computed.l1_canonical_price,
      computed.price_from_aed,
      computed.price_from,
      computed.starting_price,
      computed.price_start,
    )
    if (price !== null) {
      computed.dld_registration_fee = Math.round(price * 0.04)
    }
  }

  const existingNetYield = toNumber(computed.yield_net_pct)
  if (existingNetYield === null) {
    const rentalYield = firstNumber(computed.rental_yield, computed.l1_canonical_yield)
    const serviceCharge = firstNumber(computed.service_charge_pct)
    if (rentalYield !== null) {
      computed.yield_net_pct = serviceCharge !== null ? Math.max(0, rentalYield - serviceCharge) : rentalYield
    }
  }

  return computed
}

function isDatabaseUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false
  const candidate = error as { code?: string; message?: string }
  const message = candidate.message ?? ""
  return (
    candidate.code === "P1001" ||
    message.includes("Can't reach database server") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("ETIMEDOUT")
  )
}

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const candidate = error as { code?: string; message?: string; meta?: { message?: string } }
  const message = candidate.meta?.message ?? candidate.message ?? ""
  return (
    candidate.code === "42P01"
    || (candidate.code === "P2010" && message.includes("42P01"))
    || message.toLowerCase().includes("does not exist")
  )
}

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const candidate = error as { code?: string; message?: string; meta?: { message?: string } }
  const message = candidate.meta?.message ?? candidate.message ?? ""
  return (
    candidate.code === "42703"
    || (candidate.code === "P2010" && message.includes("42703"))
    || message.toLowerCase().includes("column") && message.toLowerCase().includes("does not exist")
  )
}

async function runQuery<T extends DbRow = DbRow>(query: Prisma.Sql): Promise<T[]> {
  try {
    const rows = await withStatementTimeout((tx) => tx.$queryRaw<T[]>(query), STATEMENT_TIMEOUT_MS)
    return rows.map((row) => normalizeValue(row) as T)
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      console.error("Decision infrastructure DB unavailable; returning empty result set.", { error })
      return []
    }
    if (isMissingRelationError(error) || isMissingColumnError(error)) {
      console.error("Decision infrastructure relation mismatch; returning empty result set.", { error })
      return []
    }
    throw error
  }
}

async function runOptionalQuery<T extends DbRow = DbRow>(query: Prisma.Sql): Promise<T[]> {
  try {
    return await runQuery<T>(query)
  } catch {
    return []
  }
}

function getNonCuratedSortExpression(sortBy: SortBy): Prisma.Sql {
  if (sortBy === "timing") {
    return Prisma.sql`
      CASE UPPER(COALESCE(l3_timing_signal, ''))
        WHEN 'STRONG_BUY' THEN 5
        WHEN 'BUY' THEN 4
        WHEN 'HOLD' THEN 3
        WHEN 'WAIT' THEN 2
        WHEN 'AVOID' THEN 1
        ELSE 0
      END
    `
  }

  return Prisma.raw(PROJECT_SORT_COLUMNS[sortBy])
}

export function slugifyName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeAreaComparable(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function normalizeDeveloperComparable(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function hasMeaningfulValue(value: unknown) {
  if (value === null || value === undefined) return false
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0
  return true
}

function mergePreferredRecord(primary: DecisionRecord, fallback: DecisionRecord | null | undefined): DecisionRecord {
  if (!fallback) return primary

  const merged: DecisionRecord = { ...fallback }
  for (const [key, value] of Object.entries(primary)) {
    merged[key] = hasMeaningfulValue(value) ? value : (fallback[key] ?? value)
  }

  return merged
}

function buildDeveloperMatchClause(terms: string[]) {
  const normalizedTerms = Array.from(
    new Set(
      terms
        .map((term) => term.trim())
        .filter(Boolean),
    ),
  )

  if (normalizedTerms.length === 0) {
    return Prisma.sql`FALSE`
  }

  const rawMatches = normalizedTerms.map((term) => Prisma.sql`LOWER(COALESCE(developer, '')) LIKE LOWER('%' || ${term} || '%')`)
  const compactMatches = normalizedTerms
    .map((term) => normalizeDeveloperComparable(term))
    .filter(Boolean)
    .map((term) => Prisma.sql`LOWER(REGEXP_REPLACE(COALESCE(developer, ''), '[^a-z0-9]+', '', 'g')) LIKE '%' || ${term} || '%'`)

  return Prisma.sql`(${Prisma.join([...rawMatches, ...compactMatches], " OR ")})`
}

function buildNormalizedSlugSql(expr: Prisma.Sql) {
  return Prisma.sql`TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(COALESCE(${expr}, '')), '[^a-z0-9]+', '-', 'g'))`
}

function buildComparableSql(expr: Prisma.Sql) {
  return Prisma.sql`LOWER(REGEXP_REPLACE(COALESCE(${expr}, ''), '[^a-z0-9]+', '', 'g'))`
}

function getProjectSlug(record: DecisionRecord) {
  const name = record.name ?? record.project_name ?? record.title ?? "project"
  return slugifyName(String(name))
}

function mapProjectRecord(record: DecisionRecord): DecisionProject {
  const computed = applyLiveCalculations(record)
  return {
    ...computed,
    slug: getProjectSlug(computed),
  }
}

const SNAPSHOT_PAGE_SIZE = 1000
const SNAPSHOT_MAX_PAGES = 10
const SNAPSHOT_CACHE_TTL_MS = 30_000

type PropertySnapshotCacheEntry = {
  expiresAt: number
  promise: Promise<DecisionProject[]>
}

let propertySnapshotCache: PropertySnapshotCacheEntry | null = null

async function getPropertySnapshotProjects(): Promise<DecisionProject[]> {
  const now = Date.now()
  if (propertySnapshotCache && propertySnapshotCache.expiresAt > now) {
    return propertySnapshotCache.promise
  }

  const promise = (async () => {
    const projects: DecisionProject[] = []
    let expectedTotal = 0

    for (let page = 1; page <= SNAPSHOT_MAX_PAGES; page += 1) {
      const result = await listProperties({
        page,
        pageSize: SNAPSHOT_PAGE_SIZE,
        sortBy: "god_metric",
      })

      expectedTotal = Math.max(expectedTotal, result.total)

      if (result.projects.length === 0) {
        break
      }

      projects.push(...result.projects)

      if (projects.length >= result.total) {
        break
      }
    }

    if (expectedTotal > 0 && projects.length > expectedTotal) {
      return projects.slice(0, expectedTotal)
    }

    return projects
  })()

  propertySnapshotCache = {
    expiresAt: now + SNAPSHOT_CACHE_TTL_MS,
    promise,
  }

  try {
    return await promise
  } catch (error) {
    propertySnapshotCache = null
    throw error
  }
}

export async function listPropertySlugs(): Promise<string[]> {
  const projects = await getPropertySnapshotProjects()
  return Array.from(
    new Set(
      projects
        .map((project) => String(project.slug ?? "").trim())
        .filter(Boolean),
    ),
  )
}

function buildAreaRowsFromPropertySnapshot(projects: DecisionProject[]): DbRow[] {
  type Accumulator = {
    area: string
    city: string
    projects: number
    priceSum: number
    priceCount: number
    yieldSum: number
    yieldCount: number
    efficiencySum: number
    efficiencyCount: number
    buySignals: number
    topProjects: Array<{ key: string; name: string; score: number }>
  }

  const byArea = new Map<string, Accumulator>()

  for (const project of projects) {
    const areaName = String(project.final_area ?? project.area ?? "").trim()
    if (!areaName) continue

    const areaKey = areaName.toLowerCase()
    const city = String(project.final_city ?? project.city ?? "Dubai").trim() || "Dubai"
    const accumulator = byArea.get(areaKey) ?? {
      area: areaName,
      city,
      projects: 0,
      priceSum: 0,
      priceCount: 0,
      yieldSum: 0,
      yieldCount: 0,
      efficiencySum: 0,
      efficiencyCount: 0,
      buySignals: 0,
      topProjects: [],
    }

    accumulator.projects += 1

    const price = firstNumber(project.l1_canonical_price, project.price_from_aed, project.price_from)
    if (price !== null && price > 0) {
      accumulator.priceSum += price
      accumulator.priceCount += 1
    }

    const rentalYield = firstNumber(project.l1_canonical_yield, project.rental_yield)
    if (rentalYield !== null && rentalYield > 0) {
      accumulator.yieldSum += rentalYield
      accumulator.yieldCount += 1
    }

    const efficiency = firstNumber(project.engine_god_metric, project.investor_score_v1)
    if (efficiency !== null) {
      accumulator.efficiencySum += efficiency
      accumulator.efficiencyCount += 1
    }

    const timingSignal = String(project.l3_timing_signal ?? project.timing_label ?? "").trim().toUpperCase()
    if (timingSignal === "BUY" || timingSignal === "STRONG_BUY") {
      accumulator.buySignals += 1
    }

    const projectName = String(project.name ?? project.project_name ?? "").trim()
    if (projectName) {
      const projectKey = projectName.toLowerCase()
      if (!accumulator.topProjects.some((entry) => entry.key === projectKey)) {
        accumulator.topProjects.push({
          key: projectKey,
          name: projectName,
          score: efficiency ?? Number.NEGATIVE_INFINITY,
        })
      }

      accumulator.topProjects.sort((left, right) => right.score - left.score)
      if (accumulator.topProjects.length > 3) {
        accumulator.topProjects = accumulator.topProjects.slice(0, 3)
      }
    }

    byArea.set(areaKey, accumulator)
  }

  return Array.from(byArea.values())
    .sort((left, right) => {
      const rightEfficiency = right.efficiencyCount > 0 ? right.efficiencySum / right.efficiencyCount : Number.NEGATIVE_INFINITY
      const leftEfficiency = left.efficiencyCount > 0 ? left.efficiencySum / left.efficiencyCount : Number.NEGATIVE_INFINITY
      if (rightEfficiency !== leftEfficiency) return rightEfficiency - leftEfficiency
      return right.projects - left.projects
    })
    .map((entry) => ({
      area: entry.area,
      city: entry.city,
      projects: entry.projects,
      avg_price: entry.priceCount > 0 ? Math.round(entry.priceSum / entry.priceCount) : null,
      avg_yield: entry.yieldCount > 0 ? Number((entry.yieldSum / entry.yieldCount).toFixed(1)) : null,
      efficiency: entry.efficiencyCount > 0 ? Number((entry.efficiencySum / entry.efficiencyCount).toFixed(1)) : null,
      supply_pressure: null,
      source_count: null,
      confidence: null,
      buy_signals: entry.buySignals,
      top_projects: entry.topProjects.map((project) => project.name),
    }))
}

function buildDeveloperRowsFromPropertySnapshot(projects: DecisionProject[]): DbRow[] {
  type Accumulator = {
    developer: string
    projects: number
    priceSum: number
    priceCount: number
    reliabilitySum: number
    reliabilityCount: number
    efficiencySum: number
    efficiencyCount: number
    safeProjects: number
    areaCounts: Map<string, { label: string; count: number }>
    topProjects: Array<{ key: string; name: string; score: number }>
  }

  const byDeveloper = new Map<string, Accumulator>()

  for (const project of projects) {
    const developerName = String(project.developer ?? "").trim()
    if (!developerName || developerName.toLowerCase() === "unknown developer") continue

    const developerKey = developerName.toLowerCase()
    const accumulator = byDeveloper.get(developerKey) ?? {
      developer: developerName,
      projects: 0,
      priceSum: 0,
      priceCount: 0,
      reliabilitySum: 0,
      reliabilityCount: 0,
      efficiencySum: 0,
      efficiencyCount: 0,
      safeProjects: 0,
      areaCounts: new Map<string, { label: string; count: number }>(),
      topProjects: [] as Array<{ key: string; name: string; score: number }>,
    }

    accumulator.projects += 1

    const price = firstNumber(project.l1_canonical_price, project.price_from_aed, project.price_from)
    if (price !== null && price > 0) {
      accumulator.priceSum += price
      accumulator.priceCount += 1
    }

    const reliability = firstNumber(project.l2_developer_reliability, project.developer_reliability_score)
    if (reliability !== null) {
      accumulator.reliabilitySum += reliability
      accumulator.reliabilityCount += 1
    }

    const efficiency = firstNumber(project.engine_god_metric, project.investor_score_v1)
    if (efficiency !== null) {
      accumulator.efficiencySum += efficiency
      accumulator.efficiencyCount += 1
    }

    const stressGrade = String(project.l2_stress_test_grade ?? project.stress_grade_v1 ?? "").trim().toUpperCase()
    if (stressGrade === "A" || stressGrade === "B") {
      accumulator.safeProjects += 1
    }

    const areaName = String(project.final_area ?? project.area ?? "").trim()
    if (areaName) {
      const areaKey = areaName.toLowerCase()
      const current = accumulator.areaCounts.get(areaKey)
      accumulator.areaCounts.set(areaKey, {
        label: current?.label ?? areaName,
        count: (current?.count ?? 0) + 1,
      })
    }

    const projectName = String(project.name ?? project.project_name ?? "").trim()
    if (projectName) {
      const projectKey = projectName.toLowerCase()
      if (!accumulator.topProjects.some((entry) => entry.key === projectKey)) {
        accumulator.topProjects.push({
          key: projectKey,
          name: projectName,
          score: efficiency ?? Number.NEGATIVE_INFINITY,
        })
      }

      accumulator.topProjects.sort((left, right) => right.score - left.score)
      if (accumulator.topProjects.length > 3) {
        accumulator.topProjects = accumulator.topProjects.slice(0, 3)
      }
    }

    byDeveloper.set(developerKey, accumulator)
  }

  return Array.from(byDeveloper.values())
    .sort((left, right) => {
      const rightReliability = right.reliabilityCount > 0 ? right.reliabilitySum / right.reliabilityCount : Number.NEGATIVE_INFINITY
      const leftReliability = left.reliabilityCount > 0 ? left.reliabilitySum / left.reliabilityCount : Number.NEGATIVE_INFINITY
      if (rightReliability !== leftReliability) return rightReliability - leftReliability
      return right.projects - left.projects
    })
    .map((entry) => {
      const topAreas = Array.from(entry.areaCounts.entries())
        .sort((left, right) => right[1].count - left[1].count)
        .slice(0, 3)
        .map(([, area]) => area.label)

      return {
        developer: entry.developer,
        projects: entry.projects,
        reliability: entry.reliabilityCount > 0 ? Number((entry.reliabilitySum / entry.reliabilityCount).toFixed(1)) : null,
        efficiency: entry.efficiencyCount > 0 ? Number((entry.efficiencySum / entry.efficiencyCount).toFixed(1)) : null,
        avg_price: entry.priceCount > 0 ? Math.round(entry.priceSum / entry.priceCount) : null,
        safe_projects: entry.safeProjects,
        top_areas: topAreas,
        top_projects: entry.topProjects.map((project) => project.name),
      }
    })
}

function normalizeComparableValue(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

function buildAreaContextFromPropertySnapshot(projects: DecisionProject[], areaName: string) {
  const normalizedArea = normalizeComparableValue(areaName)
  if (!normalizedArea) return null

  const row = buildAreaRowsFromPropertySnapshot(projects).find(
    (entry) => normalizeComparableValue(entry.area) === normalizedArea,
  )

  return (row as DecisionRecord | undefined) ?? null
}

function buildDeveloperContextFromPropertySnapshot(projects: DecisionProject[], developerName: string) {
  const normalizedDeveloper = normalizeComparableValue(developerName)
  if (!normalizedDeveloper) return null

  const row = buildDeveloperRowsFromPropertySnapshot(projects).find(
    (entry) => normalizeComparableValue(entry.developer) === normalizedDeveloper,
  )

  return (row as DecisionRecord | undefined) ?? null
}

function buildSimilarProjectsFromPropertySnapshot(
  projects: DecisionProject[],
  currentProject: DecisionProject,
  limit = 5,
) {
  const normalizedArea = normalizeComparableValue(currentProject.final_area ?? currentProject.area)
  const currentSlug = normalizeComparableValue(currentProject.slug)
  const currentName = normalizeComparableValue(currentProject.name ?? currentProject.project_name)

  if (!normalizedArea) return []

  return projects
    .filter((project) => {
      if (normalizeComparableValue(project.final_area ?? project.area) !== normalizedArea) return false
      if (normalizeComparableValue(project.slug) === currentSlug) return false
      if (currentName && normalizeComparableValue(project.name ?? project.project_name) === currentName) return false
      return true
    })
    .sort((left, right) => {
      const rightScore = firstNumber(right.engine_god_metric, right.investor_score_v1) ?? Number.NEGATIVE_INFINITY
      const leftScore = firstNumber(left.engine_god_metric, left.investor_score_v1) ?? Number.NEGATIVE_INFINITY
      return rightScore - leftScore
    })
    .slice(0, limit)
}

function buildMarketPulseFromPropertySnapshot(projects: DecisionProject[]) {
  let priceSum = 0
  let priceCount = 0
  let yieldSum = 0
  let yieldCount = 0
  let efficiencySum = 0
  let efficiencyCount = 0

  const timingMap = new Map<string, number>()
  const stressMap = new Map<string, number>()
  const confidenceMap = new Map<string, number>()

  for (const project of projects) {
    const price = firstNumber(project.l1_canonical_price, project.price_from_aed, project.price_from)
    if (price !== null && price > 0) {
      priceSum += price
      priceCount += 1
    }

    const rentalYield = firstNumber(project.l1_canonical_yield, project.rental_yield)
    if (rentalYield !== null && rentalYield > 0) {
      yieldSum += rentalYield
      yieldCount += 1
    }

    const efficiency = firstNumber(project.engine_god_metric, project.investor_score_v1)
    if (efficiency !== null) {
      efficiencySum += efficiency
      efficiencyCount += 1
    }

    const timingLabel = String(project.l3_timing_signal ?? project.timing_label ?? "").trim().toUpperCase()
    if (timingLabel) {
      timingMap.set(timingLabel, (timingMap.get(timingLabel) ?? 0) + 1)
    }

    const stressLabel = String(project.l2_stress_test_grade ?? project.stress_grade_v1 ?? "").trim().toUpperCase()
    if (stressLabel) {
      stressMap.set(stressLabel, (stressMap.get(stressLabel) ?? 0) + 1)
    }

    const confidenceLabel = String(project.l1_confidence ?? project.price_confidence ?? "").trim().toUpperCase()
    if (confidenceLabel) {
      confidenceMap.set(confidenceLabel, (confidenceMap.get(confidenceLabel) ?? 0) + 1)
    }
  }

  const toLabelRows = (source: Map<string, number>) => Array.from(source.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([label, count]) => ({ label, count }))

  return {
    summary: {
      projects: projects.length,
      avg_price: priceCount > 0 ? Math.round(priceSum / priceCount) : null,
      avg_yield: yieldCount > 0 ? Number((yieldSum / yieldCount).toFixed(1)) : null,
      avg_efficiency: efficiencyCount > 0 ? Number((efficiencySum / efficiencyCount).toFixed(1)) : null,
    },
    timing_signals: toLabelRows(timingMap),
    stress_grades: toLabelRows(stressMap),
    confidence_distribution: toLabelRows(confidenceMap),
  }
}

function buildPropertyClauses(filters?: PropertyFilters, locale?: string, useCurated = USE_CURATED_PROPERTIES_VIEW): Prisma.Sql[] {
  const clauses: Prisma.Sql[] = useCurated
    ? [
        Prisma.sql`TRIM(COALESCE(${CURATED_NAME_EXPR}, '')) <> ''`,
        Prisma.sql`COALESCE(${CURATED_PRICE_EXPR}, 0) >= 0`,
      ]
    : [
        Prisma.sql`name IS NOT NULL`,
        ...buildQualityClauses({
          requirePrice: true,
          requireStress: true,
          requireArea: true,
          requireDeveloper: true,
          requireConfidence: true,
          onlyUae: true,
          excludeGarbageDeveloper: true,
          requireBedroomSanity: true,
        }),
      ]
  const gradeOrder = ["A", "B", "C", "D"] as const
  const isArabic = locale === "ar"
  const curatedAreaExpr = isArabic
    ? Prisma.sql`COALESCE(NULLIF(TRIM(${CURATED_AREA_AR_EXPR}), ''), ${CURATED_AREA_EXPR})`
    : CURATED_AREA_EXPR
  const curatedDeveloperExpr = isArabic
    ? Prisma.sql`COALESCE(NULLIF(TRIM(${CURATED_DEVELOPER_AR_EXPR}), ''), ${CURATED_DEVELOPER_EXPR})`
    : CURATED_DEVELOPER_EXPR

  if (!filters) return clauses

  if (typeof filters.bedsMin === "number" || typeof filters.bedsMax === "number") {
    if (!USE_CURATED_PROPERTIES_VIEW) {
      clauses.push(Prisma.sql`COALESCE(bedrooms_max, bedrooms_min) BETWEEN 0 AND 10`)
      clauses.push(Prisma.sql`(bedrooms_min IS NULL OR bedrooms_min BETWEEN 0 AND 10)`)
      clauses.push(Prisma.sql`(bedrooms_max IS NULL OR bedrooms_max BETWEEN 0 AND 10)`)
      clauses.push(Prisma.sql`(bedrooms_min IS NULL OR bedrooms_max IS NULL OR bedrooms_min <= bedrooms_max)`)
    }
  }

  if (filters.area) {
    clauses.push(
      USE_CURATED_PROPERTIES_VIEW
        ? Prisma.sql`LOWER(${curatedAreaExpr}) LIKE LOWER(${`%${filters.area}%`})`
        : Prisma.sql`LOWER(COALESCE(final_area, area)) LIKE LOWER(${`%${filters.area}%`})`,
    )
  }
  if (filters.developer) {
    clauses.push(
      USE_CURATED_PROPERTIES_VIEW
        ? Prisma.sql`LOWER(${curatedDeveloperExpr}) LIKE LOWER(${`%${filters.developer}%`})`
        : Prisma.sql`LOWER(developer) LIKE LOWER(${`%${filters.developer}%`})`,
    )
  }
  if (filters.intent) {
    if (!USE_CURATED_PROPERTIES_VIEW) {
      clauses.push(Prisma.sql`outcome_intent @> ARRAY[${filters.intent}]::text[]`)
    }
  }
  if (typeof filters.budgetMaxAed === "number") {
    clauses.push(
      USE_CURATED_PROPERTIES_VIEW
        ? Prisma.sql`${CURATED_PRICE_EXPR} <= ${filters.budgetMaxAed}`
        : Prisma.sql`l1_canonical_price <= ${filters.budgetMaxAed}`,
    )
  }
  if (typeof filters.budgetMinAed === "number") {
    clauses.push(
      USE_CURATED_PROPERTIES_VIEW
        ? Prisma.sql`${CURATED_PRICE_EXPR} >= ${filters.budgetMinAed}`
        : Prisma.sql`l1_canonical_price >= ${filters.budgetMinAed}`,
    )
  }
  if (typeof filters.bedsMin === "number") {
    if (!USE_CURATED_PROPERTIES_VIEW) {
      clauses.push(Prisma.sql`COALESCE(bedrooms_max, bedrooms_min) >= ${filters.bedsMin}`)
    }
  }
  if (typeof filters.bedsMax === "number") {
    if (!USE_CURATED_PROPERTIES_VIEW) {
      clauses.push(Prisma.sql`COALESCE(bedrooms_min, bedrooms_max) <= ${filters.bedsMax}`)
    }
  }
  if (filters.timingSignal) {
    clauses.push(
      useCurated
        ? Prisma.sql`timing_label = ${filters.timingSignal}`
        : Prisma.sql`l3_timing_signal = ${filters.timingSignal}`,
    )
  }
  if (filters.stressGradeMin) {
    const index = gradeOrder.indexOf(filters.stressGradeMin)
    const allowed = gradeOrder.slice(0, index + 1)
    clauses.push(
      useCurated
        ? Prisma.sql`stress_grade_v1 IN (${toSqlList([...allowed])})`
        : Prisma.sql`l2_stress_test_grade IN (${toSqlList([...allowed])})`,
    )
  }
  if (filters.goldenVisaRequired) {
    clauses.push(
      useCurated
        ? Prisma.sql`(
            COALESCE(${CURATED_PRICE_EXPR}, 0) >= 2000000
            OR LOWER(COALESCE(golden_visa, 'false')) IN ('true', 'yes', '1')
          )`
        : Prisma.sql`(
            l1_canonical_price >= 2000000
            OR LOWER(COALESCE(hotness_factors ->> 'golden_visa_eligible', hotness_factors ->> 'golden_visa', 'false')) IN ('true', 'yes', '1')
          )`,
    )
  }

  return clauses
}

export async function listProperties(input: ListPropertiesInput = {}): Promise<{
  data_as_of: string
  page: number
  pageSize: number
  total: number
  projects: DecisionProject[]
}> {
  const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 1000)
  const page = Math.max(input.page ?? 1, 1)
  const offset = (page - 1) * pageSize
  const sortBy = input.sortBy ?? "god_metric"

  const curatedFallbackTables = [
    "public.entrestate_projects_api",
    "public.entrestate_projects_api_full",
    "api.entrestate_projects_api",
    "api.entrestate_projects_api_full",
    "api.projects_v1",
    "raw.inventory_full",
    "canonical.inventory_clean",
    "public.inventory_clean",
    "inventory_clean",
  ]

  const candidates: Array<{ tableSql: Prisma.Sql; useCurated: boolean }> = [
    { tableSql: PROPERTIES_TABLE_SQL, useCurated: USE_CURATED_PROPERTIES_VIEW },
    ...(USE_CURATED_PROPERTIES_VIEW
      ? curatedFallbackTables
          .filter((name) => name.toLowerCase() !== PROPERTIES_TABLE_NAME.toLowerCase())
          .map((name) => ({ tableSql: Prisma.raw(name), useCurated: true }))
      : []),
  ]

  if (!USE_CURATED_PROPERTIES_VIEW) {
    candidates.push({ tableSql: Prisma.raw("canonical.inventory_clean"), useCurated: true })
    candidates.push({ tableSql: Prisma.raw("public.entrestate_projects_api"), useCurated: true })
    candidates.push({ tableSql: Prisma.raw("public.entrestate_projects_api_full"), useCurated: true })
    candidates.push({ tableSql: Prisma.raw("api.entrestate_projects_api_full"), useCurated: true })
  }

  async function fetchFrom(tableSql: Prisma.Sql, useCurated: boolean) {
    const clauses = buildPropertyClauses(input.filters, input.locale, useCurated)
    const whereClause = clauses.length > 0 ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}` : Prisma.empty
    const sortColumn = useCurated
      ? CURATED_PROJECT_SORT_EXPRESSIONS[sortBy]
      : getNonCuratedSortExpression(sortBy)

    const selectQuery = useCurated
      ? Prisma.sql`
          SELECT
            ${CURATED_ID} AS id,
            ${CURATED_NAME_EXPR} AS name,
            ${CURATED_NAME_EXPR} AS project_name,
            ${CURATED_DEVELOPER_EXPR} AS developer,
            ${CURATED_DEVELOPER_AR_EXPR} AS developer_ar,
            ${CURATED_AREA_EXPR} AS area,
            ${CURATED_AREA_AR_EXPR} AS area_ar,
            ${CURATED_AREA_EXPR} AS final_area,
            NULL::numeric AS bedrooms_max,
            NULL::numeric AS beds,
            (${CURATED_PRICE_EXPR}) AS price_from_aed,
            ${CURATED_RENTAL_YIELD} AS rental_yield,
            ${CURATED_TIMING_SCORE} AS timing_score,
            ${CURATED_TIMING_LABEL} AS timing_label,
            ${CURATED_STRESS_SCORE} AS stress_score,
            ${CURATED_STRESS_GRADE} AS stress_grade_v1,
            ${CURATED_YIELD_SCORE} AS yield_score,
            ${CURATED_YIELD_LABEL} AS yield_label,
            ${CURATED_EVIDENCE_SCORE} AS evidence_score,
            ${CURATED_EVIDENCE_LABEL} AS evidence_label_v1,
            ${CURATED_INVESTOR_SCORE} AS investor_score_v1,
            ${CURATED_DECISION_LABEL} AS decision_label_v1,
            ${CURATED_HERO_IMAGE} AS hero_image,
            ${CURATED_GOLDEN_VISA} AS golden_visa,
            ${CURATED_SCORE_VERSION} AS score_version,
            (${CURATED_PRICE_EXPR}) AS l1_canonical_price,
            ${CURATED_RENTAL_YIELD} AS l1_canonical_yield,
            NULL AS l1_canonical_status,
            ${CURATED_PRICE_CONFIDENCE} AS l1_confidence,
            ${CURATED_PRICE_SOURCE} AS l1_source_coverage,
            ${CURATED_INVESTOR_SCORE} AS l2_investment_score,
            ${CURATED_DEVELOPER_RELIABILITY} AS l2_developer_reliability,
            ${CURATED_STRESS_GRADE} AS l2_stress_test_grade,
            ${CURATED_TIMING_LABEL} AS l3_timing_signal,
            NULL::jsonb AS engine_stress_test,
            ${CURATED_INVESTOR_SCORE} AS engine_god_metric
          FROM ${tableSql} t
          ${whereClause}
          ORDER BY ${sortColumn} DESC NULLS LAST
          LIMIT ${pageSize}
          OFFSET ${offset}
        `
      : Prisma.sql`
          SELECT
            name,
            developer,
            area,
            final_area,
            bedrooms_min,
            bedrooms_max,
            COALESCE(bedrooms_min, bedrooms_max) AS beds,
            l1_canonical_price,
            l1_canonical_yield,
            l2_stress_test_grade,
            l2_developer_reliability,
            l3_timing_signal,
            engine_stress_test,
            engine_god_metric,
            l1_confidence,
            l1_source_coverage
          FROM ${tableSql} t
          ${whereClause}
          ORDER BY ${sortColumn} DESC NULLS LAST
          LIMIT ${pageSize}
          OFFSET ${offset}
        `

    const [rows, countRows] = await Promise.all([
      runQuery(selectQuery),
      runQuery<{ count: number }>(Prisma.sql`
        SELECT COUNT(*)::int AS count
        FROM ${tableSql} t
        ${whereClause}
      `),
    ])

    return {
      rows,
      total: countRows[0]?.count ?? 0,
    }
  }

  let rows: DbRow[] = []
  let total = 0

  for (const candidate of candidates) {
    const result = await fetchFrom(candidate.tableSql, candidate.useCurated)
    rows = result.rows
    total = result.total
    if (rows.length > 0 || total > 0) {
      break
    }
  }

  const projects: DecisionProject[] = rows.map((row) => mapProjectRecord(row as DecisionRecord))

  return {
    data_as_of: new Date().toISOString(),
    page,
    pageSize,
    total,
    projects,
  }
}

export async function getProjectBySlug(slug: string): Promise<{
  data_as_of: string
  slug: string
  project: DecisionProject
  area_context: DecisionRecord | null
  developer_profile: DecisionRecord | null
  similar_projects: DecisionProject[]
} | null> {
  const normalizedSlug = slug.toLowerCase().trim()
  const candidateName = normalizedSlug.replace(/-/g, " ")

  let candidates = USE_CURATED_PROPERTIES_VIEW
    ? await runQuery(Prisma.sql`
        SELECT
          ${CURATED_ID} AS id,
          ${CURATED_NAME_EXPR} AS name,
          ${CURATED_NAME_EXPR} AS project_name,
          ${CURATED_DEVELOPER_EXPR} AS developer,
          ${CURATED_DEVELOPER_AR_EXPR} AS developer_ar,
          ${CURATED_AREA_EXPR} AS area,
          ${CURATED_AREA_AR_EXPR} AS area_ar,
          ${CURATED_AREA_EXPR} AS final_area,
          NULL::numeric AS bedrooms_max,
          NULL::numeric AS beds,
          (${CURATED_PRICE_EXPR}) AS price_from_aed,
          ${CURATED_RENTAL_YIELD} AS rental_yield,
          ${CURATED_TIMING_SCORE} AS timing_score,
          ${CURATED_TIMING_LABEL} AS timing_label,
          ${CURATED_STRESS_SCORE} AS stress_score,
          ${CURATED_STRESS_GRADE} AS stress_grade_v1,
          ${CURATED_YIELD_SCORE} AS yield_score,
          ${CURATED_YIELD_LABEL} AS yield_label,
          ${CURATED_EVIDENCE_SCORE} AS evidence_score,
          ${CURATED_EVIDENCE_LABEL} AS evidence_label_v1,
          ${CURATED_INVESTOR_SCORE} AS investor_score_v1,
          ${CURATED_DECISION_LABEL} AS decision_label_v1,
          ${CURATED_HERO_IMAGE} AS hero_image,
          ${CURATED_GOLDEN_VISA} AS golden_visa,
          ${CURATED_SCORE_VERSION} AS score_version,
          (${CURATED_PRICE_EXPR}) AS l1_canonical_price,
          ${CURATED_RENTAL_YIELD} AS l1_canonical_yield,
          NULL AS l1_canonical_status,
          ${CURATED_PRICE_CONFIDENCE} AS l1_confidence,
          ${CURATED_PRICE_SOURCE} AS l1_source_coverage,
          ${CURATED_INVESTOR_SCORE} AS l2_investment_score,
          ${CURATED_DEVELOPER_RELIABILITY} AS l2_developer_reliability,
          ${CURATED_STRESS_GRADE} AS l2_stress_test_grade,
          ${CURATED_TIMING_LABEL} AS l3_timing_signal,
          NULL::numeric AS l3_supply_pressure,
          NULL::numeric AS l3_demand_velocity,
          NULL::numeric AS l3_price_drift_30d,
          ${CURATED_INVESTOR_SCORE} AS engine_god_metric,
          NULL::numeric AS engine_affordability,
          ${CURATED_STRESS_SCORE} AS engine_stress_test,
          NULL::jsonb AS payment_plan_structured,
          NULL::jsonb AS evidence_sources,
          NULL::jsonb AS evidence_exclusions,
          NULL::jsonb AS evidence_assumptions,
          NULL::jsonb AS hotness_factors,
          NULL::jsonb AS units,
          ${CURATED_DEVELOPER_RELIABILITY} AS developer_reliability_score,
          ${curatedNumeric(Prisma.sql`to_jsonb(t)->>'supply_resilience_score'`)} AS supply_resilience_score,
          ${curatedNumeric(Prisma.sql`to_jsonb(t)->>'liquidity_resilience_score'`)} AS liquidity_resilience_score,
          ${curatedNumeric(Prisma.sql`to_jsonb(t)->>'pricing_discipline_score'`)} AS pricing_discipline_score,
          ${curatedNumeric(Prisma.sql`to_jsonb(t)->>'handover_reliability_score'`)} AS handover_reliability_score,
          ${curatedNumeric(Prisma.sql`to_jsonb(t)->>'area_stability_score'`)} AS area_stability_score,
          ${curatedNumeric(Prisma.sql`to_jsonb(t)->>'payment_plan_score'`)} AS payment_plan_score
        FROM ${PROPERTIES_TABLE_SQL} t
        WHERE LOWER(${CURATED_NAME_EXPR}) LIKE LOWER('%' || ${candidateName} || '%')
        ORDER BY CASE WHEN LOWER(${CURATED_NAME_EXPR}) = LOWER(${candidateName}) THEN 0 ELSE 1 END,
                 ${CURATED_INVESTOR_SCORE} DESC NULLS LAST
        LIMIT 30
      `)
    : await runQuery(Prisma.sql`
        SELECT
          name,
          developer,
          area,
          final_area,
          bedrooms_min,
          bedrooms_max,
          COALESCE(bedrooms_min, bedrooms_max) AS beds,
          l1_canonical_price,
          l1_canonical_yield,
          l1_canonical_status,
          l1_confidence,
          l1_source_coverage,
          l2_stress_test_grade,
          l2_developer_reliability,
          l3_timing_signal,
          l3_supply_pressure,
          l3_demand_velocity,
          l3_price_drift_30d,
          engine_god_metric,
          engine_affordability,
          engine_stress_test,
          payment_plan_structured,
          evidence_sources,
          evidence_exclusions,
          evidence_assumptions,
          hotness_factors
        FROM ${DETAIL_TABLE_SQL}
        WHERE LOWER(name) LIKE LOWER('%' || ${candidateName} || '%')
        ORDER BY engine_god_metric DESC NULLS LAST
        LIMIT 30
      `)

  if (USE_CURATED_PROPERTIES_VIEW && candidates.length === 0) {
    const fallbackTables = [
      "canonical.inventory_clean",
      "public.inventory_clean",
      "inventory_clean",
    ]
    for (const name of fallbackTables) {
      if (name.toLowerCase() === PROPERTIES_TABLE_NAME.toLowerCase()) continue
      candidates = await runQuery(Prisma.sql`
        SELECT
          ${CURATED_ID} AS id,
          ${CURATED_NAME_EXPR} AS name,
          ${CURATED_NAME_EXPR} AS project_name,
          ${CURATED_DEVELOPER_EXPR} AS developer,
          ${CURATED_DEVELOPER_AR_EXPR} AS developer_ar,
          ${CURATED_AREA_EXPR} AS area,
          ${CURATED_AREA_AR_EXPR} AS area_ar,
          ${CURATED_AREA_EXPR} AS final_area,
          NULL::numeric AS bedrooms_max,
          NULL::numeric AS beds,
          (${CURATED_PRICE_EXPR}) AS price_from_aed,
          ${CURATED_RENTAL_YIELD} AS rental_yield,
          ${CURATED_TIMING_SCORE} AS timing_score,
          ${CURATED_TIMING_LABEL} AS timing_label,
          ${CURATED_STRESS_SCORE} AS stress_score,
          ${CURATED_STRESS_GRADE} AS stress_grade_v1,
          ${CURATED_YIELD_SCORE} AS yield_score,
          ${CURATED_YIELD_LABEL} AS yield_label,
          ${CURATED_EVIDENCE_SCORE} AS evidence_score,
          ${CURATED_EVIDENCE_LABEL} AS evidence_label_v1,
          ${CURATED_INVESTOR_SCORE} AS investor_score_v1,
          ${CURATED_DECISION_LABEL} AS decision_label_v1,
          ${CURATED_HERO_IMAGE} AS hero_image,
          ${CURATED_GOLDEN_VISA} AS golden_visa,
          ${CURATED_SCORE_VERSION} AS score_version,
          (${CURATED_PRICE_EXPR}) AS l1_canonical_price,
          ${CURATED_RENTAL_YIELD} AS l1_canonical_yield,
          NULL AS l1_canonical_status,
          ${CURATED_PRICE_CONFIDENCE} AS l1_confidence,
          ${CURATED_PRICE_SOURCE} AS l1_source_coverage,
          ${CURATED_INVESTOR_SCORE} AS l2_investment_score,
          ${CURATED_DEVELOPER_RELIABILITY} AS l2_developer_reliability,
          ${CURATED_STRESS_GRADE} AS l2_stress_test_grade,
          ${CURATED_TIMING_LABEL} AS l3_timing_signal,
          NULL::numeric AS l3_supply_pressure,
          NULL::numeric AS l3_demand_velocity,
          NULL::numeric AS l3_price_drift_30d,
          ${CURATED_INVESTOR_SCORE} AS engine_god_metric,
          NULL::numeric AS engine_affordability,
          ${CURATED_STRESS_SCORE} AS engine_stress_test,
          NULL::jsonb AS payment_plan_structured,
          NULL::jsonb AS evidence_sources,
          NULL::jsonb AS evidence_exclusions,
          NULL::jsonb AS evidence_assumptions,
          NULL::jsonb AS hotness_factors,
          NULL::jsonb AS units,
          ${CURATED_DEVELOPER_RELIABILITY} AS developer_reliability_score,
          ${curatedNumeric(Prisma.sql`to_jsonb(t)->>'supply_resilience_score'`)} AS supply_resilience_score,
          ${curatedNumeric(Prisma.sql`to_jsonb(t)->>'liquidity_resilience_score'`)} AS liquidity_resilience_score,
          ${curatedNumeric(Prisma.sql`to_jsonb(t)->>'pricing_discipline_score'`)} AS pricing_discipline_score,
          ${curatedNumeric(Prisma.sql`to_jsonb(t)->>'handover_reliability_score'`)} AS handover_reliability_score,
          ${curatedNumeric(Prisma.sql`to_jsonb(t)->>'area_stability_score'`)} AS area_stability_score,
          ${curatedNumeric(Prisma.sql`to_jsonb(t)->>'payment_plan_score'`)} AS payment_plan_score
        FROM ${Prisma.raw(name)} t
        WHERE LOWER(${CURATED_NAME_EXPR}) LIKE LOWER('%' || ${candidateName} || '%')
        ORDER BY CASE WHEN LOWER(${CURATED_NAME_EXPR}) = LOWER(${candidateName}) THEN 0 ELSE 1 END,
                 ${CURATED_INVESTOR_SCORE} DESC NULLS LAST
        LIMIT 30
      `)
      if (candidates.length > 0) break
    }
  }

  const project =
    (candidates.find((row) => slugifyName(String(row.name ?? "")) === normalizedSlug) as DecisionRecord | undefined) ??
    (candidates[0] as DecisionRecord | undefined) ??
    null
  if (!project) return null

  let enrichedProject = project as DecisionRecord

  if (USE_CURATED_PROPERTIES_VIEW) {
    const detailRows = await runOptionalQuery<{ raw_row: DecisionRecord | null }>(Prisma.sql`
      SELECT to_jsonb(t) AS raw_row
      FROM ${DETAIL_TABLE_SQL} t
      WHERE LOWER(COALESCE(name, '')) LIKE LOWER('%' || ${candidateName} || '%')
      ORDER BY
        CASE WHEN LOWER(COALESCE(name, '')) = LOWER(${String(project.name ?? "")}) THEN 0 ELSE 1 END,
        CASE WHEN LOWER(COALESCE(developer, '')) = LOWER(${String(project.developer ?? "")}) THEN 0 ELSE 1 END,
        engine_god_metric DESC NULLS LAST
      LIMIT 1
    `)

    const detailPayload = detailRows[0]?.raw_row
    if (detailPayload && typeof detailPayload === "object" && !Array.isArray(detailPayload)) {
      enrichedProject = mergePreferredRecord(enrichedProject, detailPayload)
    }
  }

  const computedProject = applyLiveCalculations(enrichedProject)
  const projectWithSlug = mapProjectRecord(computedProject)
  const areaName = String(computedProject.final_area ?? computedProject.area ?? "")
  const developerName = String(computedProject.developer ?? "")

  const [areaContextRows, developerRows, similarRows] = USE_CURATED_PROPERTIES_VIEW
    ? await Promise.all([
        runQuery(Prisma.sql`
          SELECT
            ${CURATED_AREA_EXPR} AS area,
            COUNT(*)::int AS projects,
            ROUND(AVG(${CURATED_PRICE_EXPR}) FILTER (WHERE ${CURATED_PRICE_EXPR} > 0)) AS avg_price,
            ROUND(AVG(${CURATED_RENTAL_YIELD}) FILTER (WHERE ${CURATED_RENTAL_YIELD} > 0), 1) AS avg_yield,
            ROUND(AVG(${CURATED_INVESTOR_SCORE}), 1) AS avg_efficiency
          FROM ${PROPERTIES_TABLE_SQL} t
          WHERE LOWER(${CURATED_AREA_EXPR}) = LOWER(${areaName})
          GROUP BY 1
        `),
        runQuery(Prisma.sql`
          SELECT
            ${CURATED_DEVELOPER_EXPR} AS developer,
            COUNT(*)::int AS projects,
            ROUND(AVG(${CURATED_DEVELOPER_RELIABILITY}), 1) AS reliability,
            ROUND(AVG(${CURATED_INVESTOR_SCORE}), 1) AS efficiency,
            array_agg(DISTINCT ${CURATED_AREA_EXPR}) AS areas
          FROM ${PROPERTIES_TABLE_SQL} t
          WHERE LOWER(${CURATED_DEVELOPER_EXPR}) = LOWER(${developerName})
          GROUP BY 1
        `),
        runQuery(Prisma.sql`
          SELECT
            ${CURATED_ID} AS id,
            ${CURATED_NAME_EXPR} AS name,
            ${CURATED_NAME_EXPR} AS project_name,
            ${CURATED_DEVELOPER_EXPR} AS developer,
            ${CURATED_DEVELOPER_AR_EXPR} AS developer_ar,
            ${CURATED_AREA_EXPR} AS area,
            ${CURATED_AREA_AR_EXPR} AS area_ar,
            ${CURATED_AREA_EXPR} AS final_area,
            (${CURATED_PRICE_EXPR}) AS price_from_aed,
            ${CURATED_RENTAL_YIELD} AS rental_yield,
            ${CURATED_TIMING_LABEL} AS timing_label,
            ${CURATED_STRESS_GRADE} AS stress_grade_v1,
            ${CURATED_INVESTOR_SCORE} AS investor_score_v1,
            ${CURATED_DECISION_LABEL} AS decision_label_v1,
            ${CURATED_PRICE_CONFIDENCE} AS price_confidence,
            (${CURATED_PRICE_EXPR}) AS l1_canonical_price,
            ${CURATED_RENTAL_YIELD} AS l1_canonical_yield,
            ${CURATED_STRESS_GRADE} AS l2_stress_test_grade,
            ${CURATED_TIMING_LABEL} AS l3_timing_signal,
            ${CURATED_INVESTOR_SCORE} AS engine_god_metric,
            ${CURATED_PRICE_CONFIDENCE} AS l1_confidence
          FROM ${PROPERTIES_TABLE_SQL} t
          WHERE LOWER(${CURATED_AREA_EXPR}) = LOWER(${areaName})
            AND LOWER(${CURATED_NAME_EXPR}) <> LOWER(${String(project.name)})
          ORDER BY ${CURATED_INVESTOR_SCORE} DESC NULLS LAST
          LIMIT 5
        `),
      ])
    : await Promise.all([
        runQuery(Prisma.sql`
          SELECT
            COALESCE(final_area, area) AS area,
            COUNT(*)::int AS projects,
            ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
            ROUND(AVG(l1_canonical_yield::numeric), 1) AS avg_yield,
            ROUND(AVG(engine_god_metric::numeric), 1) AS avg_efficiency
          FROM ${DETAIL_TABLE_SQL}
          WHERE LOWER(COALESCE(final_area, area)) = LOWER(${areaName})
          GROUP BY 1
        `),
        runQuery(Prisma.sql`
          SELECT
            developer,
            COUNT(*)::int AS projects,
            ROUND(AVG(l2_developer_reliability::numeric), 1) AS reliability,
            ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
            array_agg(DISTINCT COALESCE(final_area, area)) AS areas
          FROM ${DETAIL_TABLE_SQL}
          WHERE LOWER(developer) = LOWER(${developerName})
          GROUP BY 1
        `),
        runQuery(Prisma.sql`
          SELECT
            name,
            developer,
            COALESCE(final_area, area) AS area,
            l1_canonical_price,
            l1_canonical_yield,
            l2_stress_test_grade,
            l3_timing_signal,
            engine_god_metric,
            l1_confidence
          FROM ${DETAIL_TABLE_SQL}
          WHERE LOWER(COALESCE(final_area, area)) = LOWER(${areaName})
            AND LOWER(name) <> LOWER(${String(project.name)})
          ORDER BY engine_god_metric DESC NULLS LAST
          LIMIT 5
        `),
      ])

  let areaContext = (areaContextRows[0] as DecisionRecord | undefined) ?? null
  let developerProfile = (developerRows[0] as DecisionRecord | undefined) ?? null
  let similarProjects = similarRows.map((row) => mapProjectRecord(row as DecisionRecord))

  if (USE_CURATED_PROPERTIES_VIEW && (!areaContext || !developerProfile || similarProjects.length === 0)) {
    const snapshotProjects = await getPropertySnapshotProjects()

    if (snapshotProjects.length > 0) {
      if (!areaContext) {
        areaContext = buildAreaContextFromPropertySnapshot(snapshotProjects, areaName)
      }

      if (!developerProfile) {
        developerProfile = buildDeveloperContextFromPropertySnapshot(snapshotProjects, developerName)
      }

      if (similarProjects.length === 0) {
        similarProjects = buildSimilarProjectsFromPropertySnapshot(snapshotProjects, projectWithSlug)
      }
    }
  }

  return {
    data_as_of: new Date().toISOString(),
    slug: normalizedSlug,
    project: projectWithSlug,
    area_context: areaContext,
    developer_profile: developerProfile,
    similar_projects: similarProjects,
  }
}

export async function listAreas(): Promise<{
  data_as_of: string
  areas: Array<DecisionRecord & { slug: string }>
  source_view: string
  coverage: CoverageSummary
}> {
  const curatedAreaCandidates = [
    AREAS_TABLE_NAME,
    "public.entrestate_areas_api",
    "api.entrestate_areas_api",
    "api.areas_v1",
    "api.area_intelligence_v1",
  ].filter((value, index, all) => all.findIndex((entry) => entry.toLowerCase() === value.toLowerCase()) === index)

  const nonCuratedAreasQuery = Prisma.sql`
    SELECT
      COALESCE(final_area, area) AS area,
      MODE() WITHIN GROUP (ORDER BY COALESCE(NULLIF(TRIM(final_city), ''), NULLIF(TRIM(city), ''), 'Dubai')) AS city,
      COUNT(*)::int AS projects,
      ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
      ROUND(AVG(l1_canonical_yield::numeric), 1) AS avg_yield,
      ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
      ROUND(AVG(l3_supply_pressure::numeric), 2) AS supply_pressure,
      NULL::int AS source_count,
      NULL::text AS confidence,
      COUNT(CASE WHEN l3_timing_signal = 'BUY' THEN 1 END)::int AS buy_signals
    FROM ${DETAIL_TABLE_SQL}
    WHERE ${Prisma.join(
      buildQualityClauses({
        requirePrice: true,
        requireStress: true,
        requireArea: true,
        requireConfidence: true,
        onlyUae: true,
        requireBedroomSanity: true,
      }),
      " AND ",
    )}
    GROUP BY 1
    HAVING COUNT(*) >= 3
    ORDER BY efficiency DESC NULLS LAST
  `

  let rows: DbRow[] = []
  let sourceView = AREAS_TABLE_NAME

  if (USE_CURATED_AREAS_VIEW) {
    for (const tableName of curatedAreaCandidates) {
      const tableSql = tableName.toLowerCase() === AREAS_TABLE_NAME.toLowerCase()
        ? AREAS_TABLE_SQL
        : Prisma.raw(tableName)

      const candidateRows = await runOptionalQuery(Prisma.sql`
        SELECT
          COALESCE(
            NULLIF(TRIM(to_jsonb(t) ->> 'area'), ''),
            NULLIF(TRIM(to_jsonb(t) ->> 'name'), ''),
            NULLIF(TRIM(to_jsonb(t) ->> 'area_name'), '')
          ) AS area,
          COALESCE(
            NULLIF(TRIM(to_jsonb(t) ->> 'area_ar'), ''),
            NULLIF(TRIM(to_jsonb(t) ->> 'name_ar'), '')
          ) AS area_ar,
          COALESCE(
            NULLIF(TRIM(to_jsonb(t) ->> 'city'), ''),
            NULLIF(TRIM(to_jsonb(t) ->> 'region'), ''),
            'Dubai'
          ) AS city,
          COALESCE(
            (to_jsonb(t) ->> 'total_projects')::int,
            (to_jsonb(t) ->> 'project_count')::int,
            (to_jsonb(t) ->> 'projects')::int,
            0
          ) AS projects,
          ${curatedNumeric(Prisma.sql`to_jsonb(t) ->> 'avg_price'`)} AS avg_price,
          ${curatedNumeric(Prisma.sql`to_jsonb(t) ->> 'avg_yield'`)} AS avg_yield,
          COALESCE(
            ${curatedNumeric(Prisma.sql`to_jsonb(t) ->> 'avg_investor_score_v1'`)},
            ${curatedNumeric(Prisma.sql`to_jsonb(t) ->> 'avg_score'`)},
            ${curatedNumeric(Prisma.sql`to_jsonb(t) ->> 'efficiency'`)}
          ) AS efficiency,
          COALESCE(
            (to_jsonb(t) ->> 'source_count')::int,
            (to_jsonb(t) ->> 'sources')::int
          ) AS source_count,
          COALESCE(
            NULLIF(TRIM(to_jsonb(t) ->> 'confidence'), ''),
            NULLIF(TRIM(to_jsonb(t) ->> 'confidence_level'), ''),
            NULLIF(TRIM(to_jsonb(t) ->> 'evidence_level'), '')
          ) AS confidence,
          NULL::numeric AS supply_pressure,
          COALESCE(
            (to_jsonb(t) ->> 'buy_signals')::int,
            CASE WHEN UPPER(COALESCE(to_jsonb(t) ->> 'dominant_timing', '')) = 'BUY'
              THEN COALESCE((to_jsonb(t) ->> 'total_projects')::int, 0)
              ELSE 0
            END,
            0
          ) AS buy_signals
        FROM ${tableSql} t
        WHERE TRIM(COALESCE(
          NULLIF(TRIM(to_jsonb(t) ->> 'area'), ''),
          NULLIF(TRIM(to_jsonb(t) ->> 'name'), ''),
          NULLIF(TRIM(to_jsonb(t) ->> 'area_name'), '')
        )) <> ''
        ORDER BY efficiency DESC NULLS LAST
      `)

      if (candidateRows.length > 0) {
        rows = candidateRows
        sourceView = tableName
        break
      }
    }
  }

  if (rows.length === 0) {
    rows = await runOptionalQuery(nonCuratedAreasQuery)
    if (rows.length > 0) sourceView = DETAIL_TABLE_NAME
  }

  if (rows.length === 0) {
    const snapshotProjects = await getPropertySnapshotProjects()
    if (snapshotProjects.length > 0) {
      rows = buildAreaRowsFromPropertySnapshot(snapshotProjects)
      sourceView = "property_snapshot"
    }
  }

  const profiles = await runOptionalQuery<{ area_name: string; area_ar: string | null; image_url: string | null; area_type: string | null }>(Prisma.sql`
    SELECT
      name AS area_name,
      COALESCE(payload->>'area_ar', payload->>'name_ar') AS area_ar,
      image AS image_url,
      area_type
    FROM gc_area_profiles
  `)

  const profileMap = new Map(
    profiles.map((profile) => [String(profile.area_name ?? "").toLowerCase(), profile]),
  )

  const topProjectsRows = await runOptionalQuery<{ area: string; top_projects: string[] | null }>(Prisma.sql`
    WITH ranked AS (
      SELECT
        COALESCE(final_area, area) AS area,
        name,
        ROW_NUMBER() OVER (
          PARTITION BY COALESCE(final_area, area)
          ORDER BY engine_god_metric DESC NULLS LAST
        ) AS row_rank
      FROM ${DETAIL_TABLE_SQL}
      WHERE name IS NOT NULL
    )
    SELECT
      area,
      ARRAY_AGG(name ORDER BY row_rank) FILTER (WHERE row_rank <= 3) AS top_projects
    FROM ranked
    WHERE row_rank <= 3
    GROUP BY area
  `)

  const topProjectsMap = new Map(
    topProjectsRows.map((row) => [
      String(row.area ?? "").toLowerCase(),
      Array.isArray(row.top_projects) ? row.top_projects : [],
    ]),
  )

  const areas = rows.map((row) => {
    const key = String(row.area ?? "").toLowerCase()
    const profile = profileMap.get(key)
    const inlineTopProjects = Array.isArray((row as DecisionRecord).top_projects)
      ? ((row as DecisionRecord).top_projects as string[])
      : []
    const topProjects = inlineTopProjects.length > 0 ? inlineTopProjects : topProjectsMap.get(key) ?? []
    return {
      ...row,
      area: (row as any).area,
      city: (row as any).city,
      projects: (row as any).projects,
      avg_price: (row as any).avg_price,
      avg_yield: (row as any).avg_yield,
      efficiency: (row as any).efficiency,
      area_ar: (row as DecisionRecord).area_ar ?? profile?.area_ar ?? null,
      image_url: profile?.image_url ?? null,
      area_type: profile?.area_type ?? null,
      top_projects: topProjects,
      slug: slugifyName(String(row.area ?? "area")),
    }
  })

  return {
    data_as_of: new Date().toISOString(),
    areas,
    source_view: sourceView,
    coverage: buildCoverageSummary(areas, [
      { key: "city", label: "City", pick: (row) => row.city },
      { key: "area_ar", label: "Arabic label", pick: (row) => row.area_ar },
      { key: "avg_price", label: "Average price", pick: (row) => row.avg_price },
      { key: "avg_yield", label: "Average yield", pick: (row) => row.avg_yield },
      { key: "efficiency", label: "Efficiency", pick: (row) => row.efficiency },
      { key: "top_projects", label: "Top projects", pick: (row) => row.top_projects },
    ]),
  }
}

export async function getAreaBySlug(slug: string): Promise<{
  data_as_of: string
  area: DecisionRecord & { slug: string; profile: DecisionRecord | null }
  projects: DecisionProject[]
  developers: DecisionRecord[]
} | null> {
  const normalizedSlug = slugifyName(slug)
  const areaName = normalizedSlug.replace(/-/g, " ")
  const areaComparable = normalizeAreaComparable(normalizedSlug)
  const detailAreaExpr = Prisma.sql`COALESCE(final_area, area)`
  const detailAreaSlugExpr = buildNormalizedSlugSql(detailAreaExpr)
  const detailAreaComparableExpr = buildComparableSql(detailAreaExpr)
  const profileAreaSlugExpr = buildNormalizedSlugSql(Prisma.sql`name`)
  const profileAreaComparableExpr = buildComparableSql(Prisma.sql`name`)
  const areaQualityClauses = buildQualityClauses({
    requirePrice: true,
    requireStress: true,
    requireArea: true,
    requireConfidence: true,
    onlyUae: true,
    requireBedroomSanity: true,
  })

  const [profileCandidates, detailCandidates] = await Promise.all([
    runOptionalQuery(Prisma.sql`
      SELECT
        name AS area_name,
        COALESCE(payload->>'area_ar', payload->>'name_ar') AS area_ar,
        image AS image_url,
        area_type,
        payload->>'city' AS city
      FROM gc_area_profiles
      WHERE ${profileAreaSlugExpr} = ${normalizedSlug}
         OR ${profileAreaComparableExpr} = ${areaComparable}
         OR LOWER(name) LIKE LOWER('%' || ${areaName} || '%')
      ORDER BY
        CASE
          WHEN ${profileAreaSlugExpr} = ${normalizedSlug} THEN 0
          WHEN ${profileAreaComparableExpr} = ${areaComparable} THEN 1
          WHEN LOWER(name) = LOWER(${areaName}) THEN 2
          WHEN LOWER(name) LIKE LOWER(${`${areaName}%`}) THEN 3
          ELSE 4
        END,
        LENGTH(name) ASC
      LIMIT 3
    `),
    runOptionalQuery(Prisma.sql`
      SELECT
        ${detailAreaExpr} AS area_name,
        COUNT(*)::int AS projects
      FROM ${DETAIL_TABLE_SQL}
      WHERE (${detailAreaSlugExpr} = ${normalizedSlug}
        OR ${detailAreaComparableExpr} = ${areaComparable}
        OR LOWER(${detailAreaExpr}) LIKE LOWER('%' || ${areaName} || '%'))
        AND ${Prisma.join(areaQualityClauses, " AND ")}
      GROUP BY 1
      ORDER BY
        CASE
          WHEN ${detailAreaSlugExpr} = ${normalizedSlug} THEN 0
          WHEN ${detailAreaComparableExpr} = ${areaComparable} THEN 1
          WHEN LOWER(${detailAreaExpr}) = LOWER(${areaName}) THEN 2
          WHEN LOWER(${detailAreaExpr}) LIKE LOWER(${`${areaName}%`}) THEN 3
          ELSE 4
        END,
        projects DESC
      LIMIT 5
    `),
  ])

  const canonicalAreaName =
    typeof profileCandidates[0]?.area_name === "string" && profileCandidates[0].area_name.trim().length > 0
      ? profileCandidates[0].area_name.trim()
      : typeof detailCandidates[0]?.area_name === "string" && detailCandidates[0].area_name.trim().length > 0
        ? detailCandidates[0].area_name.trim()
        : areaName
  const canonicalAreaComparable = normalizeAreaComparable(canonicalAreaName) || areaComparable
  const areaWhere = Prisma.sql`${detailAreaComparableExpr} = ${canonicalAreaComparable} AND ${Prisma.join(areaQualityClauses, " AND ")}`
  const developerAreaWhere = Prisma.sql`${areaWhere} AND TRIM(COALESCE(developer, '')) <> ''`

  const [statsRows, projectsRows, developerRows, profileRows] = await Promise.all([
    runQuery(Prisma.sql`
      SELECT
        ${detailAreaExpr} AS area,
        COUNT(*)::int AS projects,
        ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
        ROUND(AVG(l1_canonical_yield::numeric), 1) AS avg_yield,
        ROUND(AVG(l3_supply_pressure::numeric), 2) AS supply_pressure,
        COUNT(CASE WHEN l3_timing_signal = 'BUY' THEN 1 END)::int AS buy_signals
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${areaWhere}
      GROUP BY 1
      ORDER BY projects DESC
      LIMIT 1
    `),
    runQuery(Prisma.sql`
      SELECT
        d.name,
        d.developer,
        COALESCE(gp.payload->>'developer_ar', gp.payload->>'name_ar') AS developer_ar,
        d.l1_canonical_price,
        d.l1_canonical_yield,
        d.l2_stress_test_grade,
        d.l3_timing_signal,
        d.engine_god_metric,
        d.l1_confidence
      FROM ${DETAIL_TABLE_SQL} d
      LEFT JOIN gc_developer_profiles gp ON LOWER(gp.name) = LOWER(d.developer)
      WHERE ${areaWhere}
      ORDER BY d.engine_god_metric DESC NULLS LAST
      LIMIT 40
    `),
    runQuery(Prisma.sql`
      SELECT
        d.developer,
        MAX(COALESCE(gp.payload->>'developer_ar', gp.payload->>'name_ar')) AS developer_ar,
        COUNT(*)::int AS projects
      FROM ${DETAIL_TABLE_SQL} d
      LEFT JOIN gc_developer_profiles gp ON LOWER(gp.name) = LOWER(d.developer)
      WHERE ${developerAreaWhere}
      GROUP BY 1
      ORDER BY projects DESC
      LIMIT 12
    `),
    runOptionalQuery(Prisma.sql`
      SELECT
        name AS area_name,
        COALESCE(payload->>'area_ar', payload->>'name_ar') AS area_ar,
        image AS image_url,
        area_type,
        payload->>'city' AS city
      FROM gc_area_profiles
      WHERE ${profileAreaComparableExpr} = ${canonicalAreaComparable}
         OR ${profileAreaSlugExpr} = ${normalizedSlug}
         OR LOWER(name) LIKE LOWER('%' || ${canonicalAreaName} || '%')
      ORDER BY
        CASE
          WHEN ${profileAreaComparableExpr} = ${canonicalAreaComparable} THEN 0
          WHEN ${profileAreaSlugExpr} = ${normalizedSlug} THEN 1
          WHEN LOWER(name) = LOWER(${canonicalAreaName}) THEN 2
          ELSE 3
        END
      LIMIT 1
    `),
  ])

  const stat = (statsRows[0] as DecisionRecord | undefined) ?? null
  if (!stat) return null

  return {
    data_as_of: new Date().toISOString(),
    area: {
      ...(stat as DecisionRecord),
      slug: slugifyName(String(stat.area ?? "area")),
      profile: (profileRows[0] as DecisionRecord | undefined) ?? null,
    },
    projects: projectsRows.map((row) => mapProjectRecord(row as DecisionRecord)),
    developers: developerRows as DecisionRecord[],
  }
}

export async function listDevelopers(): Promise<{
  data_as_of: string
  developers: Array<DecisionRecord & { slug: string }>
}> {
  const developerQualityClauses = buildQualityClauses({
    requirePrice: true,
    requireStress: true,
    requireArea: true,
    requireDeveloper: true,
    requireConfidence: true,
    onlyUae: true,
    excludeGarbageDeveloper: true,
    requireBedroomSanity: true,
  })

  const curatedDeveloperCandidates = [
    DEVELOPERS_TABLE_NAME,
    "public.entrestate_developers_api",
    "api.entrestate_developers_api",
    "api.developers_v1",
  ].filter((value, index, all) => all.findIndex((entry) => entry.toLowerCase() === value.toLowerCase()) === index)

  let curatedRows: DbRow[] = []

  if (USE_CURATED_DEVELOPERS_VIEW) {
    for (const tableName of curatedDeveloperCandidates) {
      const tableSql = tableName.toLowerCase() === DEVELOPERS_TABLE_NAME.toLowerCase()
        ? DEVELOPERS_TABLE_SQL
        : Prisma.raw(tableName)

      const candidateRows = await runOptionalQuery(Prisma.sql`
        SELECT
          COALESCE(
            NULLIF(TRIM(to_jsonb(d) ->> 'id'), ''),
            NULLIF(TRIM(to_jsonb(d) ->> 'developer_id'), '')
          ) AS id,
          COALESCE(
            NULLIF(TRIM(to_jsonb(d) ->> 'name'), ''),
            NULLIF(TRIM(to_jsonb(d) ->> 'developer'), '')
          ) AS name,
          NULLIF(TRIM(to_jsonb(d) ->> 'slug'), '') AS slug,
          NULLIF(TRIM(to_jsonb(d) ->> 'tier'), '') AS tier,
          COALESCE(
            NULLIF(TRIM(to_jsonb(d) ->> 'logo'), ''),
            NULLIF(TRIM(to_jsonb(d) ->> 'logo_url'), '')
          ) AS logo,
          COALESCE(
            NULLIF(TRIM(to_jsonb(d) ->> 'developer_ar'), ''),
            NULLIF(TRIM(to_jsonb(d) ->> 'name_ar'), '')
          ) AS developer_ar,
          COALESCE(
            (to_jsonb(d) ->> 'project_count')::int,
            (to_jsonb(d) ->> 'projects')::int,
            (to_jsonb(d) ->> 'total_projects')::int,
            0
          ) AS project_count,
          ${curatedNumeric(Prisma.sql`to_jsonb(d) ->> 'avg_score'`)} AS avg_score,
          COALESCE(
            ${curatedNumeric(Prisma.sql`to_jsonb(d) ->> 'avg_yield'`)},
            ${curatedNumeric(Prisma.sql`to_jsonb(d) ->> 'yield_avg'`)}
          ) AS avg_yield,
          ${curatedNumeric(Prisma.sql`to_jsonb(d) ->> 'avg_price'`)} AS avg_price,
          COALESCE(
            (to_jsonb(d) ->> 'buy_signals')::int,
            0
          ) AS buy_signals,
          COALESCE(
            (to_jsonb(d) ->> 'safe_projects')::int,
            0
          ) AS safe_projects,
          COALESCE(to_jsonb(d) -> 'areas', to_jsonb(d) -> 'top_areas') AS areas,
          COALESCE(
            NULLIF(TRIM(to_jsonb(d) ->> 'top_project'), ''),
            NULLIF(TRIM(to_jsonb(d) ->> 'top_projects'), '')
          ) AS top_project,
          to_jsonb(d) AS payload,
          NULLIF(TRIM(to_jsonb(d) ->> 'description'), '') AS description,
          NULLIF(TRIM(to_jsonb(d) ->> 'hq'), '') AS hq,
          NULLIF(TRIM(to_jsonb(d) ->> 'developer_type'), '') AS developer_type,
          COALESCE((to_jsonb(d) ->> 'total_projects')::int, 0) AS total_projects,
          COALESCE((to_jsonb(d) ->> 'priced_projects')::int, 0) AS priced_projects
        FROM ${tableSql} d
        WHERE COALESCE(
          NULLIF(TRIM(to_jsonb(d) ->> 'name'), ''),
          NULLIF(TRIM(to_jsonb(d) ->> 'developer'), '')
        ) <> 'Unknown Developer'
        ORDER BY project_count DESC
      `)

      if (candidateRows.length > 0) {
        curatedRows = candidateRows
        break
      }
    }
  }

  let rows = curatedRows.length > 0
    ? curatedRows.map((row) => ({
        ...row,
        developer: row.name,
        logo_url: row.logo,
        projects: row.project_count,
        reliability: row.avg_score,
        efficiency: row.avg_score,
        top_areas:
          Array.isArray((row as DecisionRecord).areas)
            ? ((row as DecisionRecord).areas as string[])
            : typeof (row as DecisionRecord).areas === "string"
              ? String((row as DecisionRecord).areas).split(/\s*,\s*/).filter(Boolean)
              : [],
      }))
    : await runQuery(Prisma.sql`
        SELECT
          developer,
          COUNT(*)::int AS projects,
          ROUND(AVG(l2_developer_reliability::numeric), 1) AS reliability,
          ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
          ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price
        FROM ${DETAIL_TABLE_SQL}
        WHERE ${Prisma.join(
          [Prisma.sql`developer <> 'Unknown Developer'`, ...developerQualityClauses],
          " AND ",
        )}
        GROUP BY 1
        HAVING COUNT(*) >= 3
        ORDER BY reliability DESC NULLS LAST
      `)

  if (rows.length === 0) {
    const snapshotProjects = await getPropertySnapshotProjects()
    if (snapshotProjects.length > 0) {
      rows = buildDeveloperRowsFromPropertySnapshot(snapshotProjects)
    }
  }

  const profiles = await runOptionalQuery<{ name: string; developer_ar: string | null; logo_url: string | null; founded_year: string | null; hq: string | null }>(Prisma.sql`
    SELECT
      name,
      COALESCE(payload->>'developer_ar', payload->>'name_ar') AS developer_ar,
      logo AS logo_url,
      payload->>'founded_year' AS founded_year,
      payload->>'hq' AS hq
    FROM gc_developer_profiles
  `)

  const profileMap = new Map(profiles.map((profile) => [String(profile.name ?? "").toLowerCase(), profile]))

  const topAreasRows = await runOptionalQuery<{ developer: string; top_areas: string[] | null }>(Prisma.sql`
    WITH ranked AS (
      SELECT
        developer,
        COALESCE(final_area, area) AS area,
        COUNT(*)::int AS projects,
        ROW_NUMBER() OVER (
          PARTITION BY developer
          ORDER BY COUNT(*) DESC
        ) AS row_rank
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${Prisma.join(developerQualityClauses, " AND ")}
      GROUP BY 1, 2
    )
    SELECT
      developer,
      ARRAY_AGG(area ORDER BY row_rank) FILTER (WHERE row_rank <= 3) AS top_areas
    FROM ranked
    WHERE row_rank <= 3
    GROUP BY 1
  `)

  const topProjectsRows = await runOptionalQuery<{ developer: string; top_projects: string[] | null }>(Prisma.sql`
    WITH ranked AS (
      SELECT
        developer,
        name,
        ROW_NUMBER() OVER (
          PARTITION BY developer
          ORDER BY engine_god_metric DESC NULLS LAST
        ) AS row_rank
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${Prisma.join(developerQualityClauses, " AND ")}
        AND name IS NOT NULL
    )
    SELECT
      developer,
      ARRAY_AGG(name ORDER BY row_rank) FILTER (WHERE row_rank <= 3) AS top_projects
    FROM ranked
    WHERE row_rank <= 3
    GROUP BY 1
  `)

  const topAreasMap = new Map(
    topAreasRows.map((row) => [String(row.developer ?? "").toLowerCase(), Array.isArray(row.top_areas) ? row.top_areas : []]),
  )

  const topProjectsMap = new Map(
    topProjectsRows.map((row) => [
      String(row.developer ?? "").toLowerCase(),
      Array.isArray(row.top_projects) ? row.top_projects : [],
    ]),
  )

  return {
    data_as_of: new Date().toISOString(),
    developers: rows.map((row) => {
      const key = String(row.developer ?? "").toLowerCase()
      const profile = profileMap.get(key)
      const rowLogo = (row as DecisionRecord).logo_url as string | null | undefined
      const rowSlug = (row as DecisionRecord).slug as string | null | undefined
      const inlineTopAreas = Array.isArray((row as DecisionRecord).top_areas)
        ? ((row as DecisionRecord).top_areas as string[])
        : []
      const topAreas = inlineTopAreas.length > 0 ? inlineTopAreas : topAreasMap.get(key) ?? []
      const inlineTopProjects = Array.isArray((row as DecisionRecord).top_projects)
        ? ((row as DecisionRecord).top_projects as string[])
        : typeof (row as DecisionRecord).top_project === "string"
          ? [String((row as DecisionRecord).top_project)]
          : []
      const topProjects = inlineTopProjects.length > 0 ? inlineTopProjects : topProjectsMap.get(key) ?? []
      return {
        ...row,
        developer_ar: (row as DecisionRecord).developer_ar ?? profile?.developer_ar ?? null,
        logo_url: rowLogo ?? profile?.logo_url ?? null,
        founded_year: profile?.founded_year ?? null,
        hq: profile?.hq ?? null,
        top_areas: topAreas,
        top_projects: topProjects,
        slug: rowSlug ?? slugifyName(String(row.developer ?? "developer")),
      }
    }),
  }
}

export async function getDeveloperBySlug(slug: string): Promise<{
  data_as_of: string
  developer: DecisionRecord & { slug: string; profile: DecisionRecord | null }
  projects: DecisionProject[]
  area_presence: DecisionRecord[]
} | null> {
  const developerNameFromSlug = slug.replace(/-/g, " ")
  const developerQualityClauses = buildQualityClauses({
    requirePrice: true,
    requireStress: true,
    requireArea: true,
    requireDeveloper: true,
    requireConfidence: true,
    onlyUae: true,
    excludeGarbageDeveloper: true,
    requireBedroomSanity: true,
  })
  const developerProjectClauses = buildQualityClauses({
    requirePrice: true,
    requireArea: true,
    requireDeveloper: true,
    onlyUae: true,
    excludeGarbageDeveloper: true,
    requireBedroomSanity: true,
  })

  let curatedDeveloper: DecisionRecord | null = null
  if (USE_CURATED_DEVELOPERS_VIEW) {
    const curatedRows = await runOptionalQuery(Prisma.sql`
      SELECT
        d.name AS developer,
        d.slug,
        COALESCE(
          NULLIF(TRIM(to_jsonb(d) ->> 'developer_ar'), ''),
          NULLIF(TRIM(to_jsonb(d) ->> 'name_ar'), '')
        ) AS developer_ar,
        d.avg_score AS reliability,
        d.avg_score AS efficiency,
        d.avg_price,
        d.safe_projects,
        d.project_count AS projects,
        d.hq,
        d.description,
        d.payload
      FROM ${DEVELOPERS_TABLE_SQL} d
      WHERE slug = ${slug}
      LIMIT 1
    `)
    curatedDeveloper = (curatedRows[0] as DecisionRecord | undefined) ?? null
  }

  const canonicalDeveloperName =
    typeof curatedDeveloper?.developer === "string" && curatedDeveloper.developer.trim().length > 0
      ? curatedDeveloper.developer
      : developerNameFromSlug

  const developerTerms = Array.from(new Set([canonicalDeveloperName, developerNameFromSlug].filter(Boolean)))
  const developerWhere = Prisma.sql`${buildDeveloperMatchClause(developerTerms)} AND ${Prisma.join(developerQualityClauses, " AND ")}`
  const developerProjectWhere = Prisma.sql`${buildDeveloperMatchClause(developerTerms)} AND ${Prisma.join(developerProjectClauses, " AND ")}`

  const [developerRows, detailProjectRows, detailAreaRows, profileRows] = await Promise.all([
    runQuery(Prisma.sql`
      SELECT
        developer,
        COUNT(*)::int AS projects,
        ROUND(AVG(l2_developer_reliability::numeric), 1) AS reliability,
        ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
        ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
      COUNT(CASE WHEN l2_stress_test_grade IN ('A', 'B') THEN 1 END)::int AS safe_projects
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${developerWhere}
      GROUP BY 1
      ORDER BY projects DESC
      LIMIT 1
    `),
    runQuery(Prisma.sql`
      SELECT
        name,
        COALESCE(final_area, area) AS area,
        l1_canonical_price,
        l1_canonical_yield,
        l2_stress_test_grade,
        l3_timing_signal,
        decision_label_v1,
        l2_developer_reliability,
        engine_god_metric,
        l1_confidence
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${developerProjectWhere}
      ORDER BY engine_god_metric DESC NULLS LAST
      LIMIT 40
    `),
    runQuery(Prisma.sql`
      SELECT
        d.area,
        MAX(COALESCE(gp.payload->>'area_ar', gp.payload->>'name_ar')) AS area_ar,
        COUNT(*)::int AS projects
      FROM (
        SELECT COALESCE(final_area, area) AS area
        FROM ${DETAIL_TABLE_SQL}
        WHERE ${developerProjectWhere}
      ) d
      LEFT JOIN gc_area_profiles gp ON LOWER(gp.name) = LOWER(d.area)
      GROUP BY 1
      ORDER BY projects DESC
      LIMIT 15
    `),
    runOptionalQuery(Prisma.sql`
      SELECT
        name,
        COALESCE(payload->>'developer_ar', payload->>'name_ar') AS developer_ar,
        logo AS logo_url,
        payload->>'founded_year' AS founded_year,
        payload->>'hq' AS hq,
        payload->>'footprint' AS footprint,
        payload->>'continuity' AS continuity
      FROM gc_developer_profiles
      WHERE ${Prisma.join(
        developerTerms.map((term) => Prisma.sql`LOWER(COALESCE(name, '')) LIKE LOWER('%' || ${term} || '%')`),
        " OR ",
      )}
      LIMIT 1
    `),
  ])

  let developer = (developerRows[0] as DecisionRecord | undefined) ?? null
  let profile = (profileRows[0] as DecisionRecord | undefined) ?? null

  if (!developer && curatedDeveloper) {
    developer = curatedDeveloper

    if (!profile) {
      profile = {
        developer_ar: developer.developer_ar ?? null,
        hq: developer.hq ?? null,
        description: developer.description ?? null,
        ...(typeof developer.payload === "object" && developer.payload !== null ? developer.payload as DecisionRecord : {}),
      }
    }
  }

  if (!developer) return null

  let projects = detailProjectRows.map((row) => mapProjectRecord(row as DecisionRecord))

  if (projects.length === 0) {
    for (const term of developerTerms) {
      const fallback = await listProperties({
        filters: { developer: term },
        pageSize: 40,
        sortBy: "god_metric",
      })

      if (fallback.projects.length > 0) {
        projects = fallback.projects
        break
      }
    }
  }

  let areaPresence = detailAreaRows as DecisionRecord[]

  if (areaPresence.length === 0 && projects.length > 0) {
    const areaAccumulator = new Map<string, { area: string; projects: number }>()

    for (const project of projects) {
      const areaName = String(project.final_area ?? project.area ?? "").trim()
      if (!areaName) continue

      const existing = areaAccumulator.get(areaName)
      if (existing) {
        existing.projects += 1
      } else {
        areaAccumulator.set(areaName, { area: areaName, projects: 1 })
      }
    }

    const areaKeys = Array.from(areaAccumulator.keys())
    let areaTranslations = new Map<string, string | null>()

    if (areaKeys.length > 0) {
      const translationRows = await runOptionalQuery<{ area_key: string; area_ar: string | null }>(Prisma.sql`
        SELECT
          LOWER(name) AS area_key,
          COALESCE(payload->>'area_ar', payload->>'name_ar') AS area_ar
        FROM gc_area_profiles
        WHERE LOWER(name) IN (${toSqlList(areaKeys.map((value) => value.toLowerCase()))})
      `)

      areaTranslations = new Map(
        translationRows.map((row) => [row.area_key, row.area_ar ?? null]),
      )
    }

    areaPresence = Array.from(areaAccumulator.values())
      .sort((left, right) => right.projects - left.projects)
      .map((entry) => ({
        area: entry.area,
        area_ar: areaTranslations.get(entry.area.toLowerCase()) ?? null,
        projects: entry.projects,
      }))
  }

  return {
    data_as_of: new Date().toISOString(),
    developer: {
      ...(developer as DecisionRecord),
      slug: typeof developer.slug === "string" ? developer.slug : slugifyName(String(developer.developer ?? "developer")),
      profile,
    },
    projects,
    area_presence: areaPresence,
  }
}

export async function getMarketPulse() {
  const qualityClauses = buildQualityClauses({
    requirePrice: true,
    requireStress: true,
    requireArea: true,
    requireConfidence: true,
    onlyUae: true,
    requireBedroomSanity: true,
  })

  let [summaryRows, timingRows, gradeRows, confidenceRows] = await Promise.all([
    runQuery(Prisma.sql`
      SELECT
        COUNT(*)::int AS projects,
        ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
        ROUND(AVG(l1_canonical_yield::numeric), 1) AS avg_yield,
        ROUND(AVG(engine_god_metric::numeric), 1) AS avg_efficiency
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${Prisma.join(qualityClauses, " AND ")}
    `),
    runQuery(Prisma.sql`
      SELECT l3_timing_signal AS label, COUNT(*)::int AS count
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${Prisma.join(qualityClauses, " AND ")}
      GROUP BY 1
      ORDER BY count DESC
    `),
    runQuery(Prisma.sql`
      SELECT l2_stress_test_grade AS label, COUNT(*)::int AS count
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${Prisma.join(qualityClauses, " AND ")}
      GROUP BY 1
      ORDER BY count DESC
    `),
    runQuery(Prisma.sql`
      SELECT l1_confidence AS label, COUNT(*)::int AS count
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${Prisma.join(qualityClauses, " AND ")}
      GROUP BY 1
      ORDER BY count DESC
    `),
  ])

  const primarySummary = (summaryRows[0] as DecisionRecord | undefined) ?? null
  const primaryProjects = primarySummary ? toNumber(primarySummary.projects) ?? 0 : 0

  if (primaryProjects <= 0) {
    const snapshotProjects = await getPropertySnapshotProjects()
    if (snapshotProjects.length > 0) {
      const fallbackPulse = buildMarketPulseFromPropertySnapshot(snapshotProjects)
      summaryRows = [fallbackPulse.summary]
      timingRows = fallbackPulse.timing_signals
      gradeRows = fallbackPulse.stress_grades
      confidenceRows = fallbackPulse.confidence_distribution
    }
  }

  return {
    data_as_of: new Date().toISOString(),
    summary: summaryRows[0] ?? null,
    timing_signals: timingRows,
    stress_grades: gradeRows,
    confidence_distribution: confidenceRows,
  }
}

export async function getTopDataSections() {
  const rows = await runOptionalQuery(Prisma.sql`
    SELECT *
    FROM entrestate_top_data
    WHERE is_live = true
    ORDER BY display_order
  `)

  if (rows.length > 0) {
    return {
      data_as_of: new Date().toISOString(),
      source: "entrestate_top_data",
      sections: rows,
    }
  }

  const pulse = await getMarketPulse()
  return {
    data_as_of: pulse.data_as_of,
    source: DETAIL_TABLE_NAME,
    sections: [
      {
        slug: "market-pulse",
        title: "Market Pulse",
        payload: pulse.summary,
      },
      {
        slug: "timing-signals",
        title: "Timing Signals",
        payload: pulse.timing_signals,
      },
      {
        slug: "stress-grades",
        title: "Stress Grades",
        payload: pulse.stress_grades,
      },
      {
        slug: "confidence",
        title: "Confidence Distribution",
        payload: pulse.confidence_distribution,
      },
    ],
  }
}

export async function getHomepageSections() {
  const rows = await runOptionalQuery(Prisma.sql`
    SELECT *
    FROM entrestate_homepage
    ORDER BY display_order
  `)

  return {
    data_as_of: new Date().toISOString(),
    sections: rows,
  }
}

export async function getOutcomeIntentCounts() {
  const rows = await runQuery<{ intent: string; count: number }>(Prisma.sql`
    SELECT
      LOWER(TRIM(intent)) AS intent,
      COUNT(*)::int AS count
    FROM ${DETAIL_TABLE_SQL},
      LATERAL unnest(COALESCE(outcome_intent, ARRAY[]::text[])) AS intent
    GROUP BY 1
    ORDER BY count DESC
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}

export async function getGoldenVisaProjects(filters?: PropertyFilters) {
  return listProperties({
    filters: {
      ...filters,
      goldenVisaRequired: true,
      budgetMinAed: Math.max(filters?.budgetMinAed ?? 0, 2_000_000),
    },
    sortBy: "god_metric",
    page: 1,
    pageSize: 50,
  })
}

export async function getPriceRealityByProjectName(name: string) {
  const rows = await runQuery(Prisma.sql`
    SELECT
      name,
      l1_canonical_price,
      l4_dld_avg_txn_price,
      l4_portal_price_delta,
      l1_confidence,
      l1_source_coverage,
      evidence_sources,
      evidence_assumptions
    FROM ${DETAIL_TABLE_SQL}
    WHERE LOWER(name) LIKE LOWER('%' || ${name} || '%')
    LIMIT 10
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}

export async function getStressTestByProjectName(name: string) {
  const rows = await runQuery(Prisma.sql`
    SELECT
      name,
      engine_stress_test,
      l2_stress_test_grade,
      l1_confidence,
      evidence_assumptions
    FROM ${DETAIL_TABLE_SQL}
    WHERE LOWER(name) LIKE LOWER('%' || ${name} || '%')
    LIMIT 10
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}

export async function getDeveloperReliabilityByName(name: string) {
  const rows = await runQuery(Prisma.sql`
    SELECT
      developer,
      COUNT(*)::int AS projects,
      ROUND(AVG(l2_developer_reliability::numeric), 1) AS reliability,
      ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
      COUNT(CASE WHEN l2_stress_test_grade IN ('A', 'B') THEN 1 END)::int AS safe_projects,
      array_agg(DISTINCT COALESCE(final_area, area)) AS areas
    FROM ${DETAIL_TABLE_SQL}
    WHERE LOWER(developer) LIKE LOWER('%' || ${name} || '%')
    GROUP BY 1
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}

export async function getEvidenceByProjectName(name: string) {
  const rows = await runQuery(Prisma.sql`
    SELECT
      name,
      l1_confidence,
      l1_source_coverage,
      evidence_sources,
      evidence_exclusions,
      evidence_assumptions,
      hotness_factors
    FROM ${DETAIL_TABLE_SQL}
    WHERE LOWER(name) LIKE LOWER('%' || ${name} || '%')
    LIMIT 10
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}

export async function getDataFreshnessStatus() {
  const rows = await runOptionalQuery(Prisma.sql`
    SELECT *
    FROM ${STATUS_TABLE_SQL}
    LIMIT 1
  `)

  return {
    data_as_of: new Date().toISOString(),
    source: STATUS_TABLE_NAME,
    row: (rows[0] as DecisionRecord | undefined) ?? null,
  }
}
