import "server-only"
import { getSessionUser } from "@/lib/auth"
import { coerceEntitlementTier, getEntitlementByAccountKey } from "@/lib/billing-entitlements"

const TIER_ORDER = ["free", "pro", "team", "institutional"] as const

export type TierName = (typeof TIER_ORDER)[number]

function rankTier(tier: TierName) {
  return TIER_ORDER.indexOf(tier)
}

function parseTier(value: string | null): TierName {
  const normalized = value?.toLowerCase().trim() ?? "free"
  if (normalized === "institutional") return "institutional"
  if (normalized === "team") return "team"
  if (normalized === "pro") return "pro"
  return "free"
}

export async function resolveRequestAccountKey(request: Request): Promise<string | null> {
  const accountKey = request.headers.get("x-entrestate-account-key")?.trim() || request.headers.get("x-entrestate-user-id")?.trim()
  if (accountKey) return accountKey

  const sessionUser = await getSessionUser()
  const sessionAccountKey = sessionUser?.id?.trim()
  if (!sessionAccountKey) return null

  return sessionAccountKey
}

export async function getRequestTier(request: Request): Promise<TierName> {
  const headerTier = request.headers.get("x-entrestate-tier")
  if (headerTier) {
    return parseTier(headerTier)
  }

  const accountKey = await resolveRequestAccountKey(request)
  if (!accountKey) return "free"

  const entitlement = await getEntitlementByAccountKey(accountKey)
  return coerceEntitlementTier(entitlement?.tier)
}

export async function hasTierAccess(request: Request, requiredTier: TierName) {
  return rankTier(await getRequestTier(request)) >= rankTier(requiredTier)
}
