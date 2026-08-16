import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { recordWebhookEvent, upsertPaypalEntitlement } from "@/lib/billing-entitlements"
import { cancelPaypalSubscription } from "@/lib/paypal"

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

    await cancelPaypalSubscription(current.subscriptionId)
    await upsertPaypalEntitlement({
      accountKey: current.accountKey,
      tier: "free",
      subscriptionId: current.subscriptionId,
      status: "CANCELLED",
      eventType: "MANUAL_CANCEL",
      eventAt: new Date(),
    })

    await recordWebhookEvent(
      `manual-cancel-${crypto.randomUUID()}`,
      {
        source: "account",
        action: "manual_cancel",
        account_key: current.accountKey,
        subscription_status: "CANCELLED",
        tier: "free",
      },
      "MANUAL_CANCEL",
      current.subscriptionId,
    )

    return NextResponse.json({
      requestId,
      cancelled: true,
      tier: "free",
      subscription_id: current.subscriptionId,
      subscription_status: "CANCELLED",
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to cancel PayPal subscription."), requestId },
      { status: 500 },
    )
  }
}
