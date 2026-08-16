import { TableSpec } from "../tablespec/schema"
import { createHash } from "crypto"

export interface TimeTableMetadata {
  id?: string
  ownerId: string
  title: string
  spec: TableSpec
  hash: string
  createdAt: Date
  updatedAt: Date
  visibility: "private" | "team" | "public"
  refreshPolicy: "manual" | "daily" | "realtime"
  lastRefreshAt?: Date
}

export function calculateTableHash(spec: TableSpec): string {
  const content = JSON.stringify(spec)
  return createHash("sha256").update(content).digest("hex")
}

export interface TimeTableRow extends Record<string, any> {
  _rowId: string
  _timestamp: string
}

export interface TimeTableData {
  metadata: TimeTableMetadata
  columns: { key: string; label: string; type: string }[]
  rows: TimeTableRow[]
  summaryStats?: Record<string, any>
}
