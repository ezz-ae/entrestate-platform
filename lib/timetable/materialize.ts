import { TableSpec } from "../tablespec/schema"
import { TimeTableRow, TimeTableData, calculateTableHash } from "./model"
import { prisma } from "../prisma"
import { Prisma } from "@prisma/client"

/**
 * Materializes a TableSpec into actual rows from the database.
 * This function translates the TableSpec into deterministic SQL queries.
 */
export async function materializeTable(spec: TableSpec): Promise<TimeTableRow[]> {
  // This is a simplified version. A full implementation would dynamically build the SQL
  // based on spec.grain, spec.scope, spec.signals, etc.
  
  // For now, we'll map to the existing automation_inventory_view_v1 for demo purposes
  const columns = spec.signals.join(", ")
  
  // In a real implementation, we'd build the WHERE clause from spec.filters and spec.scope
  let whereClauses: string[] = []
  if (spec.scope.cities?.length) {
    whereClauses.push(`city IN (${spec.scope.cities.map(c => `'${c}'`).join(",")})`)
  }
  if (spec.scope.areas?.length) {
    whereClauses.push(`area IN (${spec.scope.areas.map(a => `'${a}'`).join(",")})`)
  }
  
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : ""
  const limitSql = spec.limit ? `LIMIT ${spec.limit}` : "LIMIT 100"
  
  // We use Prisma.raw for this dynamic query generation, but in production,
  // we should be very careful about injection (e.g., validating signal names against a whitelist).
  const query = `SELECT ${columns} FROM automation_inventory_view_v1 ${whereSql} ${limitSql}`
  
  const results = await prisma.$queryRawUnsafe<any[]>(query)
  
  return results.map((row, index) => ({
    ...row,
    _rowId: `row-${index}`,
    _timestamp: new Date().toISOString()
  }))
}
