import "server-only"
import {
  coerceEntitlementTier,
  getEntitlementBySubscriptionId,
  type EntitlementTier,
  updateEntitlementBySubscriptionId,
  upsertPaypalEntitlement,
} from "@/lib/billing-entitlements"
import { getPaypalSubscription, getTierFromPaypalPlanId, parsePaypalCustomId } from "@/lib/paypal"

type SyncInput = {
  subscriptionId: string
  accountKeyHint?: string | null
  eventId?: string | null
  eventType?: string | null
  eventAt?: Date | null
}

type SyncResult = {
  accountKey: string | null
  subscriptionId: string
  status: string | null
  tier: EntitlementTier
  planId: string | null
}

function resolveTierFromStatus(
  baseTier: EntitlementTier,
  status: string | null | undefined,
  fallbackTier: EntitlementTier,
  eventType?: string | null,
) {
  const normalized = status?.toUpperCase() ?? null
  const normalizedEvent = eventType?.toUpperCase() ?? null

  if (
    normalizedEvent === "BILLING.SUBSCRIPTION.CANCELLED" ||
    normalizedEvent === "BILLING.SUBSCRIPTION.SUSPENDED" ||
    normalizedEvent === "BILLING.SUBSCRIPTION.EXPIRED"
  ) {
    return "free" as const
  }

  if (normalized === "CANCELLED" || normalized === "SUSPENDED" || normalized === "EXPIRED") {
    return "free" as const
  }

  if (normalized === "ACTIVE" || normalized === "APPROVAL_PENDING" || normalized === "APPROVED") {
    return baseTier
  }

  return fallbackTier
}

export async function syncPaypalSubscriptionEntitlement(input: SyncInput): Promise<SyncResult> {
  const subscriptionId = input.subscriptionId.trim()
  if (!subscriptionId) {
    throw new Error("subscriptionId is required for entitlement sync")
  }

  const [subscription, existing] = await Promise.all([
    getPaypalSubscription(subscriptionId),
    getEntitlementBySubscriptionId(subscriptionId),
  ])

  const parsedCustom = parsePaypalCustomId(subscription.customId)
  const planTier = coerceEntitlementTier(getTierFromPaypalPlanId(subscription.planId))
  const customTier = coerceEntitlementTier(parsedCustom.tier)
  const fallbackTier = coerceEntitlementTier(existing?.tier)

  const baseTier = planTier !== "free" ? planTier : customTier !== "free" ? customTier : fallbackTier
  const effectiveTier = resolveTierFromStatus(baseTier, subscription.status, fallbackTier, input.eventType)

  const accountKey = input.accountKeyHint?.trim() || parsedCustom.accountKey || existing?.account_key || null

  if (accountKey) {
    await upsertPaypalEntitlement({
      accountKey,
      email: existing?.email ?? null,
      tier: effectiveTier,
      subscriptionId,
      planId: subscription.planId,
      status: subscription.status,
      eventId: input.eventId ?? null,
      eventType: input.eventType ?? "SUBSCRIPTION_SYNC",
      eventAt: input.eventAt ?? new Date(),
    })
  } else {
    await updateEntitlementBySubscriptionId({
      subscriptionId,
      tier: effectiveTier,
      planId: subscription.planId,
      status: subscription.status,
      eventId: input.eventId ?? null,
      eventType: input.eventType ?? "SUBSCRIPTION_SYNC",
      eventAt: input.eventAt ?? new Date(),
    })
  }

  return {
    accountKey,
    subscriptionId,
    status: subscription.status,
    tier: effectiveTier,
    planId: subscription.planId,
  }
}
