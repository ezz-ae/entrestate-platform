import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { recordWebhookEvent, upsertPaypalEntitlement } from "@/lib/billing-entitlements"
import { verifyTapSignature } from "@/lib/payments/tap"
import { resolvePaidTier } from "@/lib/pricing/plans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isTapSuccess(status: string | null | undefined) {
  const normalized = status?.toLowerCase() ?? ""
  return normalized === "captured" || normalized === "authorized" || normalized === "success"
}

export async function POST(request: Request) {
  const hash = request.headers.get("hashstring") ?? ""
  const rawBody = await request.text()

  if (!verifyTapSignature(rawBody, hash)) {
    return NextResponse.json({ error: "Tap signature verification failed" }, { status: 400 })
  }

  const event = JSON.parse(rawBody) as {
    id?: string
    status?: string
    metadata?: { accountKey?: string; tier?: string }
  }

  const tier = resolvePaidTier(event.metadata?.tier) ?? "free"
  const status = isTapSuccess(event.status) ? "ACTIVE" : (event.status?.toUpperCase() ?? "PENDING")
  await recordWebhookEvent(event.id ?? `tap-${crypto.randomUUID()}`, event, "tap.charge", event.id ?? null)

  if (event.metadata?.accountKey && tier !== "free" && status === "ACTIVE") {
    await upsertPaypalEntitlement({
      accountKey: event.metadata.accountKey,
      provider: "tap",
      tier,
      subscriptionId: event.id ?? null,
      planId: tier,
      status,
      eventType: "tap.charge",
      eventAt: new Date(),
    })
  }

  return NextResponse.json({ received: true })
}
