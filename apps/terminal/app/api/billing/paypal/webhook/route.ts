import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { recordWebhookEvent } from "@/lib/billing-entitlements"
import { syncPaypalSubscriptionEntitlement } from "@/lib/paypal-entitlement-sync"
import { verifyPaypalWebhookSignature } from "@/lib/paypal"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type PaypalWebhookEvent = {
  id?: string
  event_type?: string
  create_time?: string
  resource?: {
    id?: string
    status?: string
    custom_id?: string
    plan_id?: string
    billing_agreement_id?: string
  }
}

function pickSubscriptionId(event: PaypalWebhookEvent) {
  const billingAgreementId = event.resource?.billing_agreement_id?.trim()
  if (billingAgreementId) return billingAgreementId

  const resourceId = event.resource?.id?.trim()
  if (resourceId) return resourceId

  return null
}

function isSupportedEvent(eventType: string | null) {
  return (
    eventType === "BILLING.SUBSCRIPTION.CREATED" ||
    eventType === "BILLING.SUBSCRIPTION.ACTIVATED" ||
    eventType === "BILLING.SUBSCRIPTION.UPDATED" ||
    eventType === "BILLING.SUBSCRIPTION.CANCELLED" ||
    eventType === "BILLING.SUBSCRIPTION.SUSPENDED" ||
    eventType === "BILLING.SUBSCRIPTION.EXPIRED" ||
    eventType === "PAYMENT.SALE.COMPLETED"
  )
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)

  try {
    const body = await request.text()
    const event = JSON.parse(body) as PaypalWebhookEvent
    const verification = await verifyPaypalWebhookSignature({ headers: request.headers, webhookEvent: event })

    if (!verification.verified) {
      return NextResponse.json(
        {
          error: "PayPal webhook signature verification failed",
          verificationStatus: verification.verificationStatus,
          requestId,
        },
        { status: 400 },
      )
    }

    const eventType = event.event_type ?? null
    const subscriptionId = pickSubscriptionId(event)
    const eventId = event.id?.trim() ?? null
    const supported = isSupportedEvent(eventType)

    if (eventId) {
      const inserted = await recordWebhookEvent(eventId, event, eventType, subscriptionId)
      if (!inserted) {
        return NextResponse.json(
          {
            received: true,
            duplicate: true,
            event_type: eventType,
            webhook_event_id: eventId,
            requestId,
          },
          { status: 200 },
        )
      }
    }

    const eventAt = event.create_time ? new Date(event.create_time) : new Date()
    const sync = supported && subscriptionId
      ? await syncPaypalSubscriptionEntitlement({
          subscriptionId,
          eventId,
          eventType,
          eventAt,
        })
      : null

    return NextResponse.json(
      {
        received: true,
        verified: true,
        verification_status: verification.verificationStatus,
        event_type: eventType,
        supported,
        webhook_event_id: eventId,
        subscription_id: subscriptionId,
        subscription_status: sync?.status ?? event.resource?.status ?? null,
        subscription_plan_id: sync?.planId ?? event.resource?.plan_id ?? null,
        account_key: sync?.accountKey ?? null,
        effective_tier: sync?.tier ?? null,
        created_at: event.create_time ?? null,
        requestId,
      },
      { status: 200 },
    )
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : 500
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to process PayPal webhook."), requestId },
      { status },
    )
  }
}
