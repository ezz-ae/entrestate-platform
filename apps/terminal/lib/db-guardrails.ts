import type { Prisma } from "@prisma/client"
import { PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const DEFAULT_STATEMENT_TIMEOUT_MS = 3000
const MIN_STATEMENT_TIMEOUT_MS = 100
const MAX_STATEMENT_TIMEOUT_MS = 30000

type DatabaseUrlCandidate = {
  source: string
  value: string | undefined
}

function sanitizeDatabaseUrl(url: string | undefined) {
  if (!url) return url
  try {
    const parsed = new URL(url)
    if (parsed.searchParams.get("channel_binding") === "require") {
      parsed.searchParams.delete("channel_binding")
    }
    return parsed.toString()
  } catch {
    return url
  }
}

function enhanceDatabaseUrl(url: string | undefined) {
  const sanitized = sanitizeDatabaseUrl(url)
  if (!sanitized) return sanitized
  try {
    const parsed = new URL(sanitized)
    if (parsed.hostname.includes("-pooler.") && !parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true")
    }
    return parsed.toString()
  } catch {
    return sanitized
  }
}

function isUsableDatabaseUrl(url: string | undefined) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    const isPostgresProtocol = parsed.protocol === "postgresql:" || parsed.protocol === "postgres:"
    return isPostgresProtocol && Boolean(parsed.hostname)
  } catch {
    return false
  }
}

function getDatabaseHost(url: string | undefined) {
  if (!url) return null
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

const readUrlCandidates: DatabaseUrlCandidate[] = [
  { source: "MARKET_DATABASE_URL", value: process.env.MARKET_DATABASE_URL },
  { source: "DATABASE_URL", value: process.env.DATABASE_URL },
  { source: "NEON_DATABASE_URL", value: process.env.NEON_DATABASE_URL },
  { source: "DATABASE_URL_UNPOOLED", value: process.env.DATABASE_URL_UNPOOLED },
  { source: "NEON_DATABASE_URL_UNPOOLED", value: process.env.NEON_DATABASE_URL_UNPOOLED },
  { source: "DATABASE_URL_READONLY", value: process.env.DATABASE_URL_READONLY },
  { source: "NEON_READONLY_URL", value: process.env.NEON_READONLY_URL },
]

const activeReadUrlCandidate = readUrlCandidates.find((candidate) => isUsableDatabaseUrl(candidate.value))

const queryDatabaseUrl = enhanceDatabaseUrl(activeReadUrlCandidate?.value)
const queryDatabaseSource = activeReadUrlCandidate?.source ?? null

declare global {
  // eslint-disable-next-line no-var
  var queryPrisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var queryPrismaUrl: string | undefined
}

const queryClient =
  queryDatabaseUrl && globalThis.queryPrisma && globalThis.queryPrismaUrl === queryDatabaseUrl
    ? globalThis.queryPrisma
    : queryDatabaseUrl
      ? new PrismaClient({ datasources: { db: { url: queryDatabaseUrl } } })
      : prisma

if (process.env.NODE_ENV !== "production") {
  globalThis.queryPrisma = queryClient
  globalThis.queryPrismaUrl = queryDatabaseUrl
}

function usesTransactionPooler(url: string | undefined) {
  if (!url) return false
  return url.includes("-pooler.") || url.includes("pgbouncer=true")
}

export function getQueryDatabaseDiagnostics() {
  const fallbackUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL

  return {
    querySource: queryDatabaseSource,
    queryHost: getDatabaseHost(queryDatabaseUrl),
    fallbackHost: getDatabaseHost(fallbackUrl),
    hasDedicatedReadUrl: Boolean(queryDatabaseSource === "MARKET_DATABASE_URL"),
    usesSeparateQueryClient: queryClient !== prisma,
  }
}

export async function withStatementTimeout<T>(
  runner: (tx: Prisma.TransactionClient) => Promise<T>,
  ms: number = DEFAULT_STATEMENT_TIMEOUT_MS,
) {
  const safeMs = Number.isFinite(ms) ? Math.round(ms) : DEFAULT_STATEMENT_TIMEOUT_MS
  const boundedMs = Math.min(MAX_STATEMENT_TIMEOUT_MS, Math.max(MIN_STATEMENT_TIMEOUT_MS, safeMs))

  const runWithClient = async (client: PrismaClient, databaseUrl: string | undefined) => {
    if (usesTransactionPooler(databaseUrl)) {
      return runner(client as unknown as Prisma.TransactionClient)
    }

    try {
      return await client.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = ${boundedMs}`)
        return runner(tx)
      })
    } catch (error) {
      const code = (error as { code?: string } | null)?.code
      if (code === "P2028") {
        return runner(client as unknown as Prisma.TransactionClient)
      }
      throw error
    }
  }

  try {
    return await runWithClient(queryClient, queryDatabaseUrl)
  } catch (primaryError) {
    const shouldFallback =
      queryClient !== prisma
      && primaryError
      && typeof primaryError === "object"
      && "code" in primaryError
      && ["P1001", "P1002", "P1008", "P1017", "P2010", "P2028"].includes(
        String((primaryError as { code?: string }).code),
      )

    if (shouldFallback) {
      return runWithClient(prisma, process.env.DATABASE_URL || process.env.NEON_DATABASE_URL)
    }

    throw primaryError
  }
}
