import "server-only"

const PAYPAL_BASE_URL =
  process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

export type PaidTier = "pro" | "team" | "institutional"

type CreateSubscriptionInput = {
  tier: PaidTier
  requestOrigin: string
  customId?: string
  returnUrl?: string
  cancelUrl?: string
  firstMonthDiscountPct?: number
}

type VerifyWebhookInput = {
  headers: Headers
  webhookEvent: unknown
}

type VerifyWebhookResult = {
  verified: boolean
  verificationStatus: string | null
}

export type PaypalSubscriptionSummary = {
  id: string
  status: string | null
  planId: string | null
  customId: string | null
  raw: unknown
}

const PAYPAL_PLAN_IDS: Record<PaidTier, string | undefined> = {
  pro: process.env.PAYPAL_PLAN_ID_PRO,
  team: process.env.PAYPAL_PLAN_ID_TEAM,
  institutional: process.env.PAYPAL_PLAN_ID_INSTITUTIONAL,
}

const PLAN_ID_TO_TIER = new Map<string, PaidTier>()

for (const [tier, planId] of Object.entries(PAYPAL_PLAN_IDS) as Array<[PaidTier, string | undefined]>) {
  if (planId) PLAN_ID_TO_TIER.set(planId, tier)
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env: ${name}`)
  return value
}

export function isPaidTier(value: string): value is PaidTier {
  return value === "pro" || value === "team" || value === "institutional"
}

export function getTierFromPaypalPlanId(planId: string | null | undefined): PaidTier | null {
  if (!planId) return null
  return PLAN_ID_TO_TIER.get(planId) ?? null
}

export function buildPaypalCustomId(input: { tier: PaidTier; accountKey: string }) {
  const customId = `es_v1|tier=${encodeURIComponent(input.tier)}|account=${encodeURIComponent(input.accountKey)}`
  if (customId.length > 127) {
    throw new Error("PayPal custom_id exceeds 127 characters. Use a shorter account key.")
  }
  return customId
}

export function parsePaypalCustomId(customId: string | null | undefined): {
  tier: PaidTier | null
  accountKey: string | null
} {
  if (!customId) return { tier: null, accountKey: null }

  const parts = customId.split("|")
  const values = new Map<string, string>()

  for (const part of parts) {
    const [rawKey, rawValue] = part.split("=", 2)
    if (rawKey && rawValue) {
      values.set(rawKey, decodeURIComponent(rawValue))
    }
  }

  const tier = values.get("tier")
  const accountKey = values.get("account")

  return {
    tier: tier && isPaidTier(tier) ? tier : null,
    accountKey: accountKey ?? null,
  }
}

function getPlanIdForTier(tier: PaidTier) {
  const planId = PAYPAL_PLAN_IDS[tier]
  if (!planId) {
    throw new Error(`Missing PayPal plan ID for tier '${tier}'. Set PAYPAL_PLAN_ID_${tier.toUpperCase()}.`)
  }
  return planId
}

async function getPaypalAccessToken() {
  const clientId = getRequiredEnv("PAYPAL_CLIENT_ID")
  const clientSecret = getRequiredEnv("PAYPAL_CLIENT_SECRET")
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`PayPal token request failed: ${response.status} ${message}`)
  }

  const json = (await response.json()) as { access_token?: string }
  if (!json.access_token) throw new Error("PayPal access token missing from response")
  return json.access_token
}

async function paypalApiRequest(path: string, init?: RequestInit) {
  const accessToken = await getPaypalAccessToken()
  const response = await fetch(`${PAYPAL_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  return response
}

export async function createPaypalSubscription(input: CreateSubscriptionInput) {
  const { tier, requestOrigin, customId } = input
  const returnUrl = input.returnUrl || process.env.PAYPAL_RETURN_URL || `${requestOrigin}/account/billing?billing=success&tier=${tier}`
  const cancelUrl = input.cancelUrl || process.env.PAYPAL_CANCEL_URL || `${requestOrigin}/pricing?billing=cancelled&tier=${tier}`
  const planId = getPlanIdForTier(tier)
  const brandName = process.env.PAYPAL_BRAND_NAME || "Entrestate"

  // Build plan override for first-month discount coupon
  const TIER_PRICES: Record<PaidTier, string> = {
    pro: "299.00",
    team: "999.00",
    institutional: "4000.00",
  }
  const planOverride = input.firstMonthDiscountPct
    ? {
        plan: {
          billing_cycles: [
            {
              sequence: 1,
              total_cycles: 1,
              pricing_scheme: {
                fixed_price: {
                  value: (parseFloat(TIER_PRICES[tier]) * (1 - input.firstMonthDiscountPct / 100)).toFixed(2),
                  currency_code: "USD",
                },
              },
            },
          ],
        },
      }
    : {}

  const response = await paypalApiRequest("/v1/billing/subscriptions", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: customId ?? `entrestate-${tier}`,
      quantity: "1",
      application_context: {
        brand_name: brandName,
        user_action: "SUBSCRIBE_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
      ...planOverride,
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`PayPal subscription request failed: ${response.status} ${message}`)
  }

  const json = (await response.json()) as {
    id?: string
    links?: Array<{ rel?: string; href?: string }>
  }

  const approvalUrl = json.links?.find((link) => link.rel === "approve")?.href
  if (!json.id || !approvalUrl) throw new Error("PayPal subscription response missing approval URL")

  return {
    subscriptionId: json.id,
    approvalUrl,
  }
}

export async function getPaypalSubscription(subscriptionId: string): Promise<PaypalSubscriptionSummary> {
  const normalizedId = subscriptionId.trim()
  if (!normalizedId) {
    throw new Error("subscriptionId is required")
  }

  const response = await paypalApiRequest(`/v1/billing/subscriptions/${encodeURIComponent(normalizedId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Failed to fetch PayPal subscription: ${response.status} ${message}`)
  }

  const json = (await response.json()) as {
    id?: string
    status?: string
    plan_id?: string
    custom_id?: string
    plan?: { id?: string }
  }

  const id = json.id ?? normalizedId

  return {
    id,
    status: json.status ?? null,
    planId: json.plan_id ?? json.plan?.id ?? null,
    customId: json.custom_id ?? null,
    raw: json,
  }
}

export async function cancelPaypalSubscription(subscriptionId: string, reason?: string) {
  const normalizedId = subscriptionId.trim()
  if (!normalizedId) throw new Error("subscriptionId is required")

  const response = await paypalApiRequest(`/v1/billing/subscriptions/${encodeURIComponent(normalizedId)}/cancel`, {
    method: "POST",
    body: JSON.stringify({
      reason: reason ?? "Cancelled by customer from Entrestate account settings",
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Failed to cancel PayPal subscription: ${response.status} ${message}`)
  }
}

export async function activatePaypalSubscription(subscriptionId: string, reason?: string) {
  const normalizedId = subscriptionId.trim()
  if (!normalizedId) throw new Error("subscriptionId is required")

  const response = await paypalApiRequest(`/v1/billing/subscriptions/${encodeURIComponent(normalizedId)}/activate`, {
    method: "POST",
    body: JSON.stringify({
      reason: reason ?? "Reactivated by customer from Entrestate account settings",
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Failed to activate PayPal subscription: ${response.status} ${message}`)
  }
}

function getPaypalHeader(headers: Headers, key: string) {
  return headers.get(key) ?? headers.get(key.toLowerCase())
}

export async function verifyPaypalWebhookSignature(input: VerifyWebhookInput): Promise<VerifyWebhookResult> {
  const webhookId = getRequiredEnv("PAYPAL_WEBHOOK_ID")
  const authAlgo = getPaypalHeader(input.headers, "PAYPAL-AUTH-ALGO")
  const certUrl = getPaypalHeader(input.headers, "PAYPAL-CERT-URL")
  const transmissionId = getPaypalHeader(input.headers, "PAYPAL-TRANSMISSION-ID")
  const transmissionSig = getPaypalHeader(input.headers, "PAYPAL-TRANSMISSION-SIG")
  const transmissionTime = getPaypalHeader(input.headers, "PAYPAL-TRANSMISSION-TIME")

  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return { verified: false, verificationStatus: "MISSING_HEADERS" }
  }

  const response = await paypalApiRequest("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: input.webhookEvent,
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`PayPal webhook verification failed: ${response.status} ${message}`)
  }

  const json = (await response.json()) as { verification_status?: string }
  const status = json.verification_status ?? null

  return {
    verified: status === "SUCCESS",
    verificationStatus: status,
  }
}
