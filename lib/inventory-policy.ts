import { Prisma } from "@prisma/client"

export const EXCLUDED_KEYWORDS: readonly string[] = []

const DEFAULT_COLUMNS = ["name", "developer", "area", "city"]

export function buildExclusionSql(columns: string[] = DEFAULT_COLUMNS): Prisma.Sql | null {
  if (EXCLUDED_KEYWORDS.length === 0 || columns.length === 0) return null

  const clauses = EXCLUDED_KEYWORDS.map((keyword) => {
    const pattern = `%${keyword}%`
    const columnClauses = columns.map((column) =>
      Prisma.sql`COALESCE(${Prisma.raw(column)}, '') ILIKE ${pattern}`,
    )
    return Prisma.sql`NOT (${Prisma.join(columnClauses, " OR ")})`
  })

  return Prisma.sql`${Prisma.join(clauses, " AND ")}`
}

export function shouldExcludeRow(row: Record<string, unknown>): boolean {
  return Object.values(row).some((value) => containsExcludedKeyword(value))
}

export function containsExcludedKeyword(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "string") {
    const lower = value.toLowerCase()
    return EXCLUDED_KEYWORDS.some((keyword) => lower.includes(keyword))
  }
  if (Array.isArray(value)) {
    return value.some((entry) => containsExcludedKeyword(entry))
  }
  return false
}
