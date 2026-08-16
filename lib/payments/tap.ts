import crypto from "node:crypto"
import { getPaidPlan, type BillingCadence, type PaidTier } from "@/lib/pricing/plans"

type CreateTapChargeInput = {
  tier: PaidTier
  cadence: BillingCadence
  accountKey: string
  customer: {
    email: string
    name?: string | null
    phone?: string | null
  }
  successUrl: string
  origin: string
}

const TAP_API = "https://api.tap.company/v2"

function getTapAmount(tier: PaidTier, cadence: BillingCadence) {
  const plan = getPaidPlan(tier)
  if (cadence === "annual") return plan.annualAed
  return plan.monthlyAed
}

export function isTapAvailable() {
  return Boolean(process.env.TAP_SECRET_KEY?.trim())
}

export async function createTapCharge(input: CreateTapChargeInput) {
  const secretKey = process.env.TAP_SECRET_KEY?.trim()
  if (!secretKey) {
    throw new Error("Missing required env: TAP_SECRET_KEY")
  }

  const amount = getTapAmount(input.tier, input.cadence)
  if (!amount) {
    throw new Error(`Tap amount missing for ${input.tier}:${input.cadence}`)
  }

  const firstName = input.customer.name?.trim().split(/\s+/)[0] ?? "Entrestate"
  const response = await fetch(`${TAP_API}/charges`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "AED",
      customer: {
        first_name: firstName,
        email: input.customer.email,
        phone: input.customer.phone ?? undefined,
      },
      source: { id: "src_all" },
      description: `Entrestate ${input.tier} (${input.cadence})`,
      metadata: {
        accountKey: input.accountKey,
        tier: input.tier,
        cadence: input.cadence,
      },
      redirect: { url: input.successUrl },
      post: { url: `${input.origin}/api/webhooks/tap` },
    }),
  })

  if (!response.ok) {
    throw new Error(`Tap charge failed: ${response.status} ${await response.text()}`)
  }

  const payload = (await response.json()) as { transaction?: { url?: string } }
  const transactionUrl = payload.transaction?.url
  if (!transactionUrl) {
    throw new Error("Tap charge URL missing from response")
  }

  return transactionUrl
}

export function verifyTapSignature(rawBody: string, headerHash: string) {
  const secret = process.env.TAP_WEBHOOK_SECRET?.trim()
  if (!secret) return true
  if (!headerHash) return false

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest()
  const candidates = [digest.toString("hex"), digest.toString("base64")]
  return candidates.some((candidate) => candidate === headerHash)
}
