import crypto from "node:crypto"
import { TableSpec } from "../tablespec"
import { sampleTimeTableRows } from "./sample-data"
import {
  TimeTableMaterializedRow,
  TimeTableMetadata,
  TimeTablePage,
  TimeTablePreview,
  TimeTableRefreshPolicy,
  TimeTableRow,
  TimeTableVisibility,
} from "./types"

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
  return `{${entries.join(",")}}`
}

const hashTableSpec = (spec: TableSpec): string => {
  const payload = stableStringify(spec)
  return crypto.createHash("sha256").update(payload).digest("hex")
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))

const riskScores: Record<string, number> = {
  "Institutional Safe": 90,
  "Capital Safe": 80,
  "Balanced": 65,
  "Opportunistic": 45,
  "Speculative": 30,
}

const liquidityScores: Record<string, number> = {
  "Short (1-2yr)": 85,
  "Medium (2-4yr)": 65,
  "Long (4yr+)": 40,
}

const getNumeric = (value: TimeTableRow[keyof TimeTableRow]) => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const sanitizeRowId = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const resolveRowId = (row: TimeTableRow, index: number) => {
  const record = row as Record<string, unknown>
  const existing = typeof record._rowId === "string" && record._rowId.trim().length > 0
    ? record._rowId
    : null

  if (existing) {
    return existing
  }

  const candidate = [record.asset_id, record.project, record.area]
    .find((value) => typeof value === "string" && value.trim().length > 0)

  const base = typeof candidate === "string" ? sanitizeRowId(candidate) : ""
  return `${base || "row"}-${index + 1}`
}

const hydrateRow = (row: TimeTableRow, index: number, createdAt: string): TimeTableMaterializedRow => {
  const record = row as Record<string, unknown>
  const timestamp = typeof record._timestamp === "string" && record._timestamp.trim().length > 0
    ? record._timestamp
    : createdAt

  return {
    ...row,
    _rowId: resolveRowId(row, index),
    _timestamp: timestamp,
  }
}

const computeRowSignals = (row: TimeTableMaterializedRow): TimeTableMaterializedRow => {
  const yieldPct = getNumeric(row.yield_pct)
  const riskBand = typeof row.risk_band === "string" ? row.risk_band : ""
  const liquidityBand = typeof row.liquidity_band === "string" ? row.liquidity_band : ""

  const yieldScore = yieldPct === null ? null : clamp((yieldPct / 10) * 100)
  const riskScore = riskBand ? riskScores[riskBand] ?? 55 : null
  const liquidityScore = liquidityBand ? liquidityScores[liquidityBand] ?? 55 : null

  return {
    ...row,
    yield_score: yieldScore,
    risk_score: riskScore,
    liquidity_score: liquidityScore,
  }
}

export type TimeTableOptions = {
  owner?: string
  visibility?: TimeTableVisibility
  refreshPolicy?: TimeTableRefreshPolicy
  createdAt?: string
  version?: string
}

export class TimeTable {
  private readonly spec: TableSpec
  private readonly rows: TimeTableRow[]
  private readonly options: TimeTableOptions
  private readonly createdAt: string

  constructor(spec: TableSpec, rows: TimeTableRow[], options: TimeTableOptions = {}) {
    this.spec = spec
    this.rows = rows
    this.options = options
    this.createdAt = options.createdAt || new Date().toISOString()
  }

  metadata(): TimeTableMetadata {
    return {
      id: this.spec.intent.toLowerCase().replace(/\s+/g, "-") || "time-table",
      hash: hashTableSpec(this.spec),
      createdAt: this.createdAt,
      owner: this.options.owner,
      visibility: this.options.visibility || "private",
      refreshPolicy: this.options.refreshPolicy || "manual",
      rowCount: this.rows.length,
      spec: this.spec,
      version: this.options.version,
    }
  }

  preview(limit = 20): TimeTablePreview {
    return {
      metadata: this.metadata(),
      rows: this.computeSignals().slice(0, limit),
    }
  }

  computeSignals(): TimeTableMaterializedRow[] {
    return this.rows.map((row, index) => computeRowSignals(hydrateRow(row, index, this.createdAt)))
  }

  materialize(): TimeTableMaterializedRow[] {
    return this.computeSignals()
  }

  paginate(page = 1, pageSize = 20): TimeTablePage {
    const resolvedPage = Math.max(1, page)
    const resolvedPageSize = Math.max(1, pageSize)
    const rows = this.computeSignals()
    const offset = (resolvedPage - 1) * resolvedPageSize
    return {
      metadata: this.metadata(),
      page: resolvedPage,
      pageSize: resolvedPageSize,
      total: rows.length,
      rows: rows.slice(offset, offset + resolvedPageSize),
    }
  }
}

export function createTimeTable(spec: TableSpec, rows?: TimeTableRow[], options?: TimeTableOptions) {
  const resolvedRows = rows && rows.length ? rows : sampleTimeTableRows
  return new TimeTable(spec, resolvedRows, options)
}
