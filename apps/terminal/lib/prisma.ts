import "server-only"
import { PrismaClient } from "@prisma/client"

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

const pooledCandidate = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
const unpooledCandidate = process.env.DATABASE_URL_UNPOOLED || process.env.NEON_DATABASE_URL_UNPOOLED
const pooledUrl = isUsableDatabaseUrl(pooledCandidate) ? pooledCandidate : undefined
const unpooledUrl = isUsableDatabaseUrl(unpooledCandidate) ? unpooledCandidate : undefined
const preferUnpooledInDev =
  Boolean(pooledUrl && pooledUrl.includes("-pooler.")) &&
  Boolean(unpooledUrl) &&
  process.env.NODE_ENV !== "production"

const databaseUrl = enhanceDatabaseUrl(preferUnpooledInDev ? unpooledUrl : pooledUrl || unpooledUrl)

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var prismaUrl: string | undefined
}

const prismaInstance =
  globalThis.prisma && globalThis.prismaUrl === databaseUrl
    ? globalThis.prisma
    : new PrismaClient({
        datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
      })

export const prisma = prismaInstance

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prismaInstance
  globalThis.prismaUrl = databaseUrl
}
