import crypto from "node:crypto"
import { NextResponse } from "next/server"
import {
  coerceEntitlementTier,
  recordWebhookEvent,
  upsertPaypalEntitlement,
  updateEntitlementBySubscriptionId,
} from "@/lib/billing-entitlements"
import { resolvePaidTier } from "@/lib/pricing/plans"
import { verifyStripeWebhookSignature } from "@/lib/payments/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeStripeStatus(status: string | null | undefined) {
  const normalized = status?.toLowerCase() ?? ""
  if (normalized === "active" || normalized === "trialing") return "ACTIVE"
  if (normalized === "past_due" || normalized === "unpaid") return "SUSPENDED"
  if (normalized === "canceled" || normalized === "incomplete_expired") return "CANCELLED"
  return normalized.toUpperCase() || "ACTIVE"
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature") ?? ""
  const rawBody = await request.text()

  try {
    const event = verifyStripeWebhookSignature(rawBody, signature) as {
      id?: string
      type?: string
      data?: { object?: any }
    }

    const type = event.type ?? "stripe.unknown"
    const object = event.data?.object ?? {}
    const subscriptionId = typeof object.subscription === "string" ? object.subscription : typeof object.id === "string" ? object.id : null
    await recordWebhookEvent(event.id ?? `stripe-${crypto.randomUUID()}`, event, type, subscriptionId)

    if (type === "checkout.session.completed") {
      const tier = resolvePaidTier(object.metadata?.tier) ?? "free"
      const accountKey = object.client_reference_id ?? object.metadata?.accountKey ?? null
      if (accountKey && tier !== "free") {
        await upsertPaypalEntitlement({
          accountKey,
          email: object.customer_email ?? object.customer_details?.email ?? null,
          provider: "stripe",
          tier,
          subscriptionId: typeof object.subscription === "string" ? object.subscription : object.id ?? null,
          planId: object.metadata?.tier ?? null,
          status: "ACTIVE",
          eventId: event.id ?? null,
          eventType: type,
          eventAt: new Date(),
        })
      }
    }

    if (type === "customer.subscription.updated" || type === "customer.subscription.deleted") {
      const metadataTier = resolvePaidTier(object.metadata?.tier)
      const nextTier =
        type === "customer.subscription.deleted"
          ? "free"
          : coerceEntitlementTier(metadataTier ?? "free")
      const normalizedStatus = normalizeStripeStatus(object.status)

      if (object.metadata?.accountKey && metadataTier) {
        await upsertPaypalEntitlement({
          accountKey: object.metadata.accountKey,
          provider: "stripe",
          tier: nextTier,
          subscriptionId: object.id ?? null,
          planId: object.items?.data?.[0]?.price?.id ?? object.metadata?.tier ?? null,
          status: normalizedStatus,
          eventId: event.id ?? null,
          eventType: type,
          eventAt: new Date(),
        })
      } else if (typeof object.id === "string") {
        await updateEntitlementBySubscriptionId({
          subscriptionId: object.id,
          provider: "stripe",
          tier: nextTier,
          planId: object.items?.data?.[0]?.price?.id ?? object.metadata?.tier ?? null,
          status: normalizedStatus,
          eventId: event.id ?? null,
          eventType: type,
          eventAt: new Date(),
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook" },
      { status: 400 },
    )
  }
}
