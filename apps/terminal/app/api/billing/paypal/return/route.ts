import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/api-errors"
import { recordWebhookEvent, redeemCoupon } from "@/lib/billing-entitlements"
import { syncPaypalSubscriptionEntitlement } from "@/lib/paypal-entitlement-sync"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getSubscriptionIdFromParams(searchParams: URLSearchParams) {
  const candidates = [
    searchParams.get("subscription_id"),
    searchParams.get("ba_token"),
    searchParams.get("token"),
  ]

  for (const candidate of candidates) {
    const normalized = candidate?.trim()
    if (normalized) return normalized
  }

  return null
}

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const url = new URL(request.url)
  const accountKeyHint = url.searchParams.get("accountKey")?.trim() ?? null
  const tierHint = url.searchParams.get("tier")?.trim() ?? null
  const couponCode = url.searchParams.get("coupon")?.trim() ?? null
  const subscriptionId = getSubscriptionIdFromParams(url.searchParams)

  const redirectUrl = new URL("/account/billing", url.origin)

  if (!subscriptionId) {
    redirectUrl.searchParams.set("billing", "missing_subscription")
    redirectUrl.searchParams.set("requestId", requestId)
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const sync = await syncPaypalSubscriptionEntitlement({
      subscriptionId,
      accountKeyHint,
      eventType: "CHECKOUT_RETURN",
      eventAt: new Date(),
    })

    // Redeem coupon if present and subscription is active/approved
    if (couponCode && sync.accountKey) {
      await redeemCoupon(couponCode, sync.accountKey, sync.subscriptionId).catch(() => {
        // Non-fatal — subscription already activated
      })
    }

    await recordWebhookEvent(
      `checkout-return-${crypto.randomUUID()}`,
      {
        source: "checkout_return",
        account_key: sync.accountKey,
        requested_tier: tierHint,
        coupon_code: couponCode ?? null,
        subscription_status: sync.status,
        tier: sync.tier,
      },
      "CHECKOUT_RETURN",
      sync.subscriptionId,
    )

    redirectUrl.searchParams.set("billing", "success")
    redirectUrl.searchParams.set("subscription_id", sync.subscriptionId)
    redirectUrl.searchParams.set("status", sync.status ?? "UNKNOWN")
    redirectUrl.searchParams.set("tier", sync.tier)
    if (tierHint) {
      redirectUrl.searchParams.set("requested_tier", tierHint)
    }

    return NextResponse.redirect(redirectUrl)
  } catch {
    redirectUrl.searchParams.set("billing", "error")
    redirectUrl.searchParams.set("requestId", requestId)
    return NextResponse.redirect(redirectUrl)
  }
}
