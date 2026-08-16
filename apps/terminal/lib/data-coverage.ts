export type CoverageStatus = "strong" | "mixed" | "gap"

export type CoverageFieldSummary = {
  key: string
  label: string
  available: number
  total: number
  pct: number
  status: CoverageStatus
}

export type CoverageSummary = {
  total: number
  score: number
  status: CoverageStatus
  fields: CoverageFieldSummary[]
}

export type CoverageFieldSpec<T extends Record<string, unknown>> = {
  key: string
  label: string
  pick: (row: T) => unknown
}

function toCoverageStatus(pct: number): CoverageStatus {
  if (pct >= 85) return "strong"
  if (pct >= 60) return "mixed"
  return "gap"
}

function hasCoverageValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "string") {
    const normalized = value.trim()
    return normalized.length > 0 && normalized !== "—"
  }
  if (typeof value === "number") return Number.isFinite(value)
  if (typeof value === "bigint") return true
  if (typeof value === "boolean") return true
  if (value instanceof Date) return !Number.isNaN(value.getTime())
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.keys(value).length > 0
  return true
}

function toPct(available: number, total: number) {
  if (total <= 0) return 0
  return Math.round((available / total) * 1000) / 10
}

export function buildEmptyCoverageSummary(fields: Array<Pick<CoverageFieldSummary, "key" | "label">> = []): CoverageSummary {
  return {
    total: 0,
    score: 0,
    status: "gap",
    fields: fields.map((field) => ({
      ...field,
      available: 0,
      total: 0,
      pct: 0,
      status: "gap",
    })),
  }
}

export function buildCoverageSummary<T extends Record<string, unknown>>(
  rows: T[],
  fields: CoverageFieldSpec<T>[],
): CoverageSummary {
  if (rows.length === 0) {
    return buildEmptyCoverageSummary(fields)
  }

  const summaries = fields.map((field) => {
    const available = rows.reduce((count, row) => count + (hasCoverageValue(field.pick(row)) ? 1 : 0), 0)
    const pct = toPct(available, rows.length)

    return {
      key: field.key,
      label: field.label,
      available,
      total: rows.length,
      pct,
      status: toCoverageStatus(pct),
    } satisfies CoverageFieldSummary
  })

  const score = summaries.length > 0
    ? Math.round((summaries.reduce((sum, field) => sum + field.pct, 0) / summaries.length) * 10) / 10
    : 0

  return {
    total: rows.length,
    score,
    status: toCoverageStatus(score),
    fields: summaries,
  }
}
