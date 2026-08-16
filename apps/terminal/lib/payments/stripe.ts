import crypto from "node:crypto"
import { getPaidPlan, type BillingCadence, type PaidTier } from "@/lib/pricing/plans"

type CreateStripeCheckoutSessionInput = {
  tier: PaidTier
  cadence: BillingCadence
  customerEmail: string
  accountKey: string
  successUrl: string
  cancelUrl: string
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required env: ${name}`)
  return value
}

function getStripePriceId(tier: PaidTier, cadence: BillingCadence) {
  const plan = getPaidPlan(tier)
  const envName = plan.stripePriceEnv?.[cadence]
  return envName ? process.env[envName]?.trim() ?? null : null
}

export function hasStripePrice(tier: PaidTier, cadence: BillingCadence) {
  return Boolean(getStripePriceId(tier, cadence) && process.env.STRIPE_SECRET_KEY)
}

export async function createStripeCheckoutSession(input: CreateStripeCheckoutSessionInput) {
  const secretKey = getRequiredEnv("STRIPE_SECRET_KEY")
  const priceId = getStripePriceId(input.tier, input.cadence)

  if (!priceId) {
    throw new Error(`Stripe price ID missing for ${input.tier}:${input.cadence}`)
  }

  const body = new URLSearchParams()
  body.set("mode", "subscription")
  body.set("success_url", input.successUrl)
  body.set("cancel_url", input.cancelUrl)
  body.set("customer_email", input.customerEmail)
  body.set("client_reference_id", input.accountKey)
  body.set("line_items[0][price]", priceId)
  body.set("line_items[0][quantity]", "1")
  body.set("allow_promotion_codes", "true")
  body.set("automatic_tax[enabled]", "true")
  body.set("billing_address_collection", "required")
  body.set("metadata[accountKey]", input.accountKey)
  body.set("metadata[tier]", input.tier)
  body.set("metadata[cadence]", input.cadence)
  body.set("subscription_data[metadata][accountKey]", input.accountKey)
  body.set("subscription_data[metadata][tier]", input.tier)
  body.set("subscription_data[metadata][cadence]", input.cadence)

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  })

  if (!response.ok) {
    throw new Error(`Stripe checkout failed: ${response.status} ${await response.text()}`)
  }

  const payload = (await response.json()) as { url?: string }
  if (!payload.url) {
    throw new Error("Stripe checkout URL missing from response")
  }

  return payload.url
}

function parseStripeSignature(signatureHeader: string) {
  const entries = Object.fromEntries(
    signatureHeader
      .split(",")
      .map((part) => part.split("=", 2))
      .filter((part): part is [string, string] => part.length === 2),
  )

  return {
    timestamp: entries.t ?? null,
    v1: entries.v1 ?? null,
  }
}

export function verifyStripeWebhookSignature(rawBody: string, signatureHeader: string) {
  const secret = getRequiredEnv("STRIPE_WEBHOOK_SECRET")
  const { timestamp, v1 } = parseStripeSignature(signatureHeader)
  if (!timestamp || !v1) {
    throw new Error("Stripe signature header is malformed")
  }

  const signedPayload = `${timestamp}.${rawBody}`
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex")
  const expectedBuffer = Buffer.from(expected, "utf8")
  const actualBuffer = Buffer.from(v1, "utf8")

  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    throw new Error("Stripe signature verification failed")
  }

  return JSON.parse(rawBody) as Record<string, unknown>
}
