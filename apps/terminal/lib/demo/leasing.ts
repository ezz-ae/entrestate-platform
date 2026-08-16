import "server-only"
import { Prisma, dbQuery } from "@/lib/db"

const CANDIDATE_SCHEMAS = [
  "entrestate",
  "entrestate_tx",
  "public",
]

let cachedSchema: string | null | undefined
const columnCache = new Map<string, string[]>()

export async function resolveLeasingSchema(): Promise<string | null> {
  if (cachedSchema !== undefined) return cachedSchema
  for (const schema of CANDIDATE_SCHEMAS) {
    const rows = await dbQuery<{ exists: boolean }>(Prisma.sql`
      SELECT EXISTS(
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = ${schema}
          AND table_name = 'folders'
      ) AS exists
    `)
    if (rows[0]?.exists) {
      cachedSchema = schema
      return schema
    }
  }
  cachedSchema = null
  return null
}

export async function tableExists(schema: string, table: string): Promise<boolean> {
  const rows = await dbQuery<{ exists: boolean }>(Prisma.sql`
    SELECT EXISTS(
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = ${schema}
        AND table_name = ${table}
    ) AS exists
  `)
  return Boolean(rows[0]?.exists)
}

export function tableSql(schema: string, table: string): Prisma.Sql {
  const safeSchema = schema.replace(/"/g, "")
  const safeTable = table.replace(/"/g, "")
  return Prisma.raw(`"${safeSchema}"."${safeTable}"`)
}

export async function getTableColumns(schema: string, table: string): Promise<string[]> {
  const cacheKey = `${schema}.${table}`
  const cached = columnCache.get(cacheKey)
  if (cached) return cached

  const rows = await dbQuery<{ column_name: string }>(Prisma.sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = ${schema}
      AND table_name = ${table}
  `)
  const columns = rows.map((row) => row.column_name)
  columnCache.set(cacheKey, columns)
  return columns
}

export async function buildInsertSql(
  schema: string,
  table: string,
  data: Record<string, unknown>,
): Promise<Prisma.Sql | null> {
  const columns = await getTableColumns(schema, table)
  if (columns.length === 0) return null

  const entries = Object.entries(data).filter(
    ([key, value]) => value !== undefined && columns.includes(key),
  )
  if (entries.length === 0) return null

  const columnSql = Prisma.join(entries.map(([key]) => Prisma.raw(`"${key}"`)))
  const valueSql = Prisma.join(entries.map(([, value]) => Prisma.sql`${value}`))

  return Prisma.sql`INSERT INTO ${tableSql(schema, table)} (${columnSql}) VALUES (${valueSql})`
}

export function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function extractFolderId(record: Record<string, unknown> | null): string | null {
  if (!record) return null
  const id = record.id ?? record.folder_id ?? record.folderId ?? record.workspace_id ?? record.uid
  if (typeof id === "string" && id.trim()) return id
  if (typeof id === "number" && Number.isFinite(id)) return String(id)
  return null
}

export function normalizeString(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number") return String(value)
  return ""
}
