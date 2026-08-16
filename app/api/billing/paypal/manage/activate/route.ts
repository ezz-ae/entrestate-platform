import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { recordWebhookEvent } from "@/lib/billing-entitlements"
import { activatePaypalSubscription } from "@/lib/paypal"
import { syncPaypalSubscriptionEntitlement } from "@/lib/paypal-entitlement-sync"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const requestId = getRequestId(request)

  try {
    const current = await getCurrentEntitlement()

    if (!current.accountKey) {
      return NextResponse.json({ error: "Account identity required", requestId }, { status: 401 })
    }

    if (!current.subscriptionId) {
      return NextResponse.json({ error: "No PayPal subscription linked", requestId }, { status: 400 })
    }

    await activatePaypalSubscription(current.subscriptionId)
    const sync = await syncPaypalSubscriptionEntitlement({
      subscriptionId: current.subscriptionId,
      accountKeyHint: current.accountKey,
      eventType: "MANUAL_ACTIVATE",
      eventAt: new Date(),
    })

    await recordWebhookEvent(
      `manual-activate-${crypto.randomUUID()}`,
      {
        source: "account",
        action: "manual_activate",
        account_key: sync.accountKey,
        subscription_status: sync.status,
        tier: sync.tier,
      },
      "MANUAL_ACTIVATE",
      sync.subscriptionId,
    )

    return NextResponse.json({
      requestId,
      activated: true,
      tier: sync.tier,
      subscription_id: sync.subscriptionId,
      subscription_status: sync.status,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to activate PayPal subscription."), requestId },
      { status: 500 },
    )
  }
}
