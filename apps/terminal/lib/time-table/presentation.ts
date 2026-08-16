import type { TableSpec, TableSpecFilter } from "../tablespec"
import { getEvidenceForSpec, type Evidence } from "../timetable/evidence"
import type { TimeTableMaterializedRow } from "./types"

export type TimeTableCitation = {
  id: string
  rowIds: string[]
  description: string
}

export type TimeTableColumn = {
  key: string
  label: string
}

const INTERNAL_KEYS = new Set(["_rowId", "_timestamp"])
const LEADING_COLUMN_KEYS = [
  "project",
  "asset_id",
  "area",
  "developer",
  "price_from_aed",
  "yield_pct",
  "yield_score",
  "risk_band",
  "risk_score",
  "liquidity_band",
  "liquidity_score",
  "status_band",
  "handover_date",
  "gfa_sqm",
]

const FILTER_OPERATOR_LABELS: Record<TableSpecFilter["op"], string> = {
  eq: "=",
  neq: "≠",
  lt: "<",
  lte: "≤",
  gt: ">",
  gte: "≥",
  in: "in",
  contains: "contains",
}

const SIGNAL_LABELS: Record<string, string> = {
  asset_id: "Asset ID",
  gfa_sqm: "GFA (sqm)",
  handover_date: "Handover date",
  liquidity_band: "Liquidity band",
  liquidity_score: "Liquidity score",
  price_from_aed: "Price (AED)",
  risk_band: "Risk band",
  risk_score: "Risk score",
  status_band: "Status band",
  yield_pct: "Yield (%)",
  yield_score: "Yield score",
}

function humanizeKey(key: string) {
  if (SIGNAL_LABELS[key]) return SIGNAL_LABELS[key]
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function toSentence(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

export function describeTableFilters(filters: TableSpecFilter[]) {
  if (!filters.length) return "No explicit filters applied."
  return filters
    .map((filter) => {
      const rawValue = Array.isArray(filter.value) ? filter.value.join(", ") : String(filter.value)
      return `${humanizeKey(filter.field)} ${FILTER_OPERATOR_LABELS[filter.op]} ${rawValue}`
    })
    .join("; ")
}

export function buildTimeTableColumns(
  rows: TimeTableMaterializedRow[],
  preferredKeys: string[] = [],
): TimeTableColumn[] {
  const discoveredKeys = new Set<string>()

  for (const key of preferredKeys) {
    if (!INTERNAL_KEYS.has(key)) discoveredKeys.add(key)
  }

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!INTERNAL_KEYS.has(key)) discoveredKeys.add(key)
    }
  }

  const priority = new Map<string, number>()
  LEADING_COLUMN_KEYS.forEach((key, index) => priority.set(key, index))

  return Array.from(discoveredKeys)
    .sort((left, right) => {
      const leftPriority = priority.get(left)
      const rightPriority = priority.get(right)

      if (leftPriority !== undefined && rightPriority !== undefined) return leftPriority - rightPriority
      if (leftPriority !== undefined) return -1
      if (rightPriority !== undefined) return 1
      return left.localeCompare(right)
    })
    .map((key) => ({ key, label: humanizeKey(key) }))
}

export function buildTimeTableCitations(
  spec: TableSpec,
  rows: TimeTableMaterializedRow[],
): TimeTableCitation[] {
  if (!rows.length) return []

  const citedRows = rows.map((row) => row._rowId)
  const citations: TimeTableCitation[] = [
    {
      id: "cit-1",
      rowIds: citedRows.slice(0, Math.min(citedRows.length, 10)),
      description: `Current scope contains ${rows.length} rows for ${spec.intent.toLowerCase()}.`,
    },
    {
      id: "cit-2",
      rowIds: citedRows.slice(0, Math.min(citedRows.length, 5)),
      description: spec.sort
        ? `Rows are ordered by ${humanizeKey(spec.sort.field)} ${spec.sort.direction}.`
        : "Leading rows represent the top of the current result set.",
    },
  ]

  if (spec.filters.length > 0) {
    citations.push({
      id: "cit-3",
      rowIds: citedRows.slice(0, Math.min(citedRows.length, 8)),
      description: `Applied filters: ${describeTableFilters(spec.filters)}.`,
    })
  } else if (spec.reasoning?.trim()) {
    citations.push({
      id: "cit-3",
      rowIds: citedRows.slice(0, Math.min(citedRows.length, 8)),
      description: spec.reasoning.trim(),
    })
  }

  return citations
}

export function buildTimeTableNarrative(input: {
  spec: TableSpec
  summary: string
  highlights: string[]
  citations: TimeTableCitation[]
}) {
  const { spec, summary, highlights, citations } = input
  const segments: string[] = []

  if (summary.trim().length > 0) {
    const citation = citations[0]
    segments.push(citation ? `${toSentence(summary)} [${citation.id}]` : toSentence(summary))
  }

  if (highlights[0]?.trim().length) {
    const citation = citations[1] ?? citations[0]
    segments.push(citation ? `${toSentence(highlights[0])} [${citation.id}]` : toSentence(highlights[0]))
  }

  const supportText = highlights[1]?.trim()
    || spec.reasoning?.trim()
    || (spec.filters.length > 0 ? `Filters applied: ${describeTableFilters(spec.filters)}.` : "")

  if (supportText) {
    const citation = citations[2] ?? citations[1] ?? citations[0]
    segments.push(citation ? `${toSentence(supportText)} [${citation.id}]` : toSentence(supportText))
  }

  return segments.join(" ").trim()
}

export function buildTimeTableEvidence(spec: TableSpec): Evidence {
  return getEvidenceForSpec(spec)
}
