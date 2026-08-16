import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/api-errors"
import { getSessionUser } from "@/lib/auth"
import { normalizeLocale, prefixLocalePath } from "@/i18n/locale"
import { createStripeCheckoutSession, hasStripePrice } from "@/lib/payments/stripe"
import { createTapCharge, isTapAvailable } from "@/lib/payments/tap"
import { resolvePaidTier, type BillingCadence, type BillingProcessor, type PaidTier } from "@/lib/pricing/plans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const requestUrl = new URL(request.url)
  const locale = normalizeLocale(request.headers.get("x-entrestate-locale"))
  const tier = resolvePaidTier(requestUrl.searchParams.get("tier"))
  const cadence = (requestUrl.searchParams.get("cadence") === "annual" ? "annual" : "monthly") as BillingCadence
  const processorOverride = requestUrl.searchParams.get("processor")
  const processor =
    processorOverride === "stripe" || processorOverride === "tap"
      ? processorOverride
      : (["AE", "SA"].includes(request.headers.get("x-vercel-ip-country") ?? "AE") ? "tap" : "stripe") as BillingProcessor

  if (!tier) {
    return NextResponse.json(
      {
        error: "Invalid tier. Use one of: pro, team, institutional.",
        requestId,
        request_id: requestId,
      },
      { status: 400, headers: { "x-request-id": requestId } },
    )
  }

  if (tier === "institutional") {
    const fallbackUrl = new URL(prefixLocalePath("/contact", locale), requestUrl.origin)
    fallbackUrl.searchParams.set("plan", tier)
    fallbackUrl.searchParams.set("source", "pricing")
    fallbackUrl.searchParams.set("billing", "sales")

    const response = NextResponse.redirect(fallbackUrl, { status: 307 })
    response.headers.set("x-request-id", requestId)
    return response
  }

  const user = await getSessionUser().catch(() => null)
  if (!user?.id || !user.email) {
    const checkoutUrl = new URL(prefixLocalePath("/checkout", locale), requestUrl.origin)
    checkoutUrl.searchParams.set("tier", tier)
    checkoutUrl.searchParams.set("cadence", cadence)
    const response = NextResponse.redirect(checkoutUrl, { status: 307 })
    response.headers.set("x-request-id", requestId)
    return response
  }

  const successUrl = `${requestUrl.origin}${prefixLocalePath("/account/billing", locale)}?billing=success&tier=${tier}`
  const cancelUrl = `${requestUrl.origin}${prefixLocalePath("/pricing", locale)}?billing=cancelled&tier=${tier}`

  const attemptProcessors: BillingProcessor[] =
    processor === "tap"
      ? ["tap", "stripe"]
      : ["stripe", "tap"]

  try {
    for (const candidate of attemptProcessors) {
      if (candidate === "stripe" && hasStripePrice(tier, cadence)) {
        const checkoutUrl = await createStripeCheckoutSession({
          tier,
          cadence,
          customerEmail: user.email,
          accountKey: user.id,
          successUrl,
          cancelUrl,
        })
        const response = NextResponse.redirect(checkoutUrl, { status: 303 })
        response.headers.set("x-request-id", requestId)
        return response
      }

      if (candidate === "tap" && isTapAvailable()) {
        const checkoutUrl = await createTapCharge({
          tier,
          cadence,
          accountKey: user.id,
          customer: {
            email: user.email,
            name: typeof user.name === "string" ? user.name : null,
          },
          successUrl,
          origin: requestUrl.origin,
        })
        const response = NextResponse.redirect(checkoutUrl, { status: 303 })
        response.headers.set("x-request-id", requestId)
        return response
      }
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Checkout unavailable.",
        requestId,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    )
  }

  const response = NextResponse.redirect(new URL(prefixLocalePath("/contact", locale), requestUrl.origin), { status: 307 })
  response.headers.set("x-request-id", requestId)
  return response
}
