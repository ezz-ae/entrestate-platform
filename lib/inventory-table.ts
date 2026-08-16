import "server-only"
import { Prisma } from "@prisma/client"

const DEFAULT_INVENTORY_TABLE = "api.projects_v1"
const DEFAULT_AREAS_TABLE = "api.areas_v1"
const DEFAULT_DEVELOPERS_TABLE = "api.developers_v1"
const DEFAULT_SEARCH_TABLE = "api.search_index"
const DEFAULT_DETAIL_TABLE = "raw.inventory_full"
const DEFAULT_STATUS_TABLE = "public.data_freshness"
const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

function normalizeTableName(rawValue: string | undefined, fallback: string) {
  const trimmed = rawValue?.trim()
  if (!trimmed) return fallback

  const parts = trimmed.split(".").map((part) => part.trim())
  if (parts.length === 0 || parts.some((part) => !IDENTIFIER_RE.test(part))) {
    return fallback
  }

  return parts.join(".")
}

export function getInventoryTableName() {
  return normalizeTableName(process.env.INVENTORY_TABLE, DEFAULT_INVENTORY_TABLE)
}

export function getInventoryTableSql() {
  return Prisma.raw(getInventoryTableName())
}

function getConfiguredTableName(envKey: string, fallback: string) {
  const envValue = process.env[envKey]
  if (envValue && envValue.trim()) {
    const trimmed = envValue.trim()
    const parts = trimmed.split(".").map((part) => part.trim())
    if (parts.length === 1) {
      const fallbackParts = fallback.split(".").map((part) => part.trim())
      if (fallbackParts.length === 2 && IDENTIFIER_RE.test(parts[0])) {
        return `${fallbackParts[0]}.${parts[0]}`
      }
    }
    return normalizeTableName(envValue, fallback)
  }
  return normalizeTableName(fallback, fallback)
}

export function getAreasTableName() {
  return getConfiguredTableName("AREAS_TABLE", DEFAULT_AREAS_TABLE)
}

export function getAreasTableSql() {
  return Prisma.raw(getAreasTableName())
}

export function getDevelopersTableName() {
  return getConfiguredTableName("DEVELOPERS_TABLE", DEFAULT_DEVELOPERS_TABLE)
}

export function getDevelopersTableSql() {
  return Prisma.raw(getDevelopersTableName())
}

export function getSearchTableName() {
  return getConfiguredTableName("SEARCH_TABLE", DEFAULT_SEARCH_TABLE)
}

export function getSearchTableSql() {
  return Prisma.raw(getSearchTableName())
}

export function getDetailTableName() {
  return getConfiguredTableName("DETAIL_TABLE", DEFAULT_DETAIL_TABLE)
}

export function getDetailTableSql() {
  return Prisma.raw(getDetailTableName())
}

export function getStatusTableName() {
  return getConfiguredTableName("STATUS_TABLE", DEFAULT_STATUS_TABLE)
}

export function getStatusTableSql() {
  return Prisma.raw(getStatusTableName())
}
