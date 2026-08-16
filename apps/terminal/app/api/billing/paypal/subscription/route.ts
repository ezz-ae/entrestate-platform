import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { recordWebhookEvent } from "@/lib/billing-entitlements"
import { syncPaypalSubscriptionEntitlement } from "@/lib/paypal-entitlement-sync"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    const current = await getCurrentEntitlement()

    if (!current.subscriptionId) {
      return NextResponse.json({ error: "No PayPal subscription linked to this account", requestId }, { status: 404 })
    }

    const sync = await syncPaypalSubscriptionEntitlement({
      subscriptionId: current.subscriptionId,
      accountKeyHint: current.accountKey,
      eventType: "MANUAL_SYNC",
      eventAt: new Date(),
    })

    await recordWebhookEvent(
      `manual-sync-${crypto.randomUUID()}`,
      {
        source: "account",
        action: "manual_sync",
        account_key: sync.accountKey,
        subscription_status: sync.status,
        tier: sync.tier,
      },
      "MANUAL_SYNC",
      sync.subscriptionId,
    )

    return NextResponse.json({
      requestId,
      subscription_id: sync.subscriptionId,
      subscription_status: sync.status,
      plan_tier: sync.tier,
      account_key: sync.accountKey,
      synced: true,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to sync PayPal subscription."), requestId },
      { status: 500 },
    )
  }
}
