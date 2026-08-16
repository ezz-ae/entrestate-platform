import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { withStatementTimeout } from "@/lib/db-guardrails"
import { shouldExcludeRow } from "@/lib/inventory-policy"

type DataRow = Record<string, unknown>

const CACHE_TTL_MS = 5 * 60 * 1000
const QUERY_TIMEOUT_MS = 25000
const STATEMENT_TIMEOUT_MS = 8000
const DEFAULT_MAX_ROWS = 20000

const NEON_TABLES = [
  { name: "automation_inventory_view_v1", label: "automation_inventory_view_v1" },
  { name: "entrestate_master", label: "entrestate_master" },
]

let cached: {
  rows: DataRow[]
  source: "neon"
  sourceTable?: string
  fetchedAt: number
  maxRows?: number
  sourceLimit?: number
  preferTable?: "agent_inventory_view_v1" | "entrestate_master"
} | null = null

type EntrestateOptions = {
  maxRows?: number
  preferTable?: "agent_inventory_view_v1" | "entrestate_master"
}

export async function getEntrestateRows(options?: EntrestateOptions): Promise<{
  rows: DataRow[]
  source: "neon"
  sourceTable?: string
  sourceLimit?: number
}> {
  const now = Date.now()
  if (
    cached &&
    now - cached.fetchedAt < CACHE_TTL_MS &&
    cached.maxRows === options?.maxRows &&
    cached.preferTable === options?.preferTable
  ) {
    return {
      rows: cached.rows,
      source: cached.source,
      sourceTable: cached.sourceTable,
      sourceLimit: cached.sourceLimit,
    }
  }

  const hasDatabaseUrl = Boolean(
    process.env.DATABASE_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.NEON_DATABASE_URL ||
      process.env.NEON_DATABASE_URL_UNPOOLED,
  )

  if (!hasDatabaseUrl) {
    throw new Error("Neon database is not configured.")
  }

  let rows: DataRow[] = []
  let source: "neon" = "neon"
  let sourceTable: string | undefined
  let sourceLimit: number | undefined

  const maxRows = options?.maxRows ?? DEFAULT_MAX_ROWS
  const preferred = options?.preferTable
  const orderedTables = preferred
    ? [
        ...NEON_TABLES.filter((table) => table.name === preferred),
        ...NEON_TABLES.filter((table) => table.name !== preferred),
      ]
    : NEON_TABLES
  const limitOptions = Array.from(
    new Set([
      maxRows,
      Math.min(maxRows, 20000),
      Math.min(maxRows, 10000),
      Math.min(maxRows, 5000),
    ].filter((value) => Number.isFinite(value) && value > 0)),
  )

  for (const candidate of orderedTables) {
    let lastError: unknown
    let lastLimit: number | undefined
    for (const limit of limitOptions) {
      try {
        const limitClause = Prisma.sql`LIMIT ${limit}`
        const query = Prisma.sql`SELECT * FROM ${Prisma.raw(candidate.name)} ${limitClause}`
        const rawRows = await withTimeout(
          withStatementTimeout((tx) => tx.$queryRaw<DataRow[]>(query), STATEMENT_TIMEOUT_MS),
          QUERY_TIMEOUT_MS,
          `${candidate.label}:${limit}`,
        )
        if (rawRows.length === 0) {
          continue
        }
        rows = rawRows.map((row) =>
          Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeValue(value)])),
        )
        rows = rows.filter((row) => !shouldExcludeRow(row))
        sourceTable = candidate.name
        sourceLimit = limit
        break
      } catch (error) {
        lastError = error
        lastLimit = limit
      }
    }
    if (rows.length > 0) break
    if (lastError) {
      console.error(
        `DaaS Neon dataset error for ${candidate.label}${lastLimit ? ` (limit ${lastLimit})` : ""}:`,
        lastError,
      )
    }
  }

  if (rows.length === 0) {
    throw new Error("Live market data is unavailable.")
  }

  cached = {
    rows,
    source,
    sourceTable,
    fetchedAt: now,
    maxRows,
    sourceLimit,
    preferTable: preferred,
  }
  return { rows, source, sourceTable, sourceLimit }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms (${label})`)), ms)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId!)
  }
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    const asNumber = Number(value)
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (value && typeof value === "object" && "toNumber" in value) {
    try {
      return (value as { toNumber: () => number }).toNumber()
    } catch {
      return value
    }
  }

  return value
}
