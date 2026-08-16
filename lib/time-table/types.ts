import { TableSpec } from "../tablespec"

export type TimeTableVisibility = "private" | "team" | "public"
export type TimeTableRefreshPolicy = "manual" | "daily" | "weekly" | "monthly"

export type TimeTableCell = string | number | boolean | null

export type TimeTableRow = Record<string, TimeTableCell>

export type TimeTableMaterializedRow = TimeTableRow & {
  _rowId: string
  _timestamp: string
}

export type TimeTableMetadata = {
  id: string
  hash: string
  createdAt: string
  owner?: string
  visibility: TimeTableVisibility
  refreshPolicy: TimeTableRefreshPolicy
  rowCount: number
  spec: TableSpec
  version?: string
}

export type TimeTablePreview = {
  metadata: TimeTableMetadata
  rows: TimeTableMaterializedRow[]
}

export type TimeTablePage = {
  metadata: TimeTableMetadata
  page: number
  pageSize: number
  total: number
  rows: TimeTableMaterializedRow[]
}
