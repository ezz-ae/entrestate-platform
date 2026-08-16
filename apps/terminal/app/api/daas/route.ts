import { NextResponse } from "next/server"
import {
  dashboard,
  developerIntel,
  listingFeed,
  marketAnalysis,
  rentalPricing,
  secondaryMarket,
} from "@/lib/daas/services"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { buildRateLimitKey, rateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Product =
  | "listing_feed"
  | "market_analysis"
  | "developer_intel"
  | "rental_pricing"
  | "secondary_market"
  | "dashboard"

const PRODUCT_MAP: Record<Product, (params: Record<string, unknown>) => Promise<unknown>> = {
  listing_feed: listingFeed,
  market_analysis: marketAnalysis,
  developer_intel: developerIntel,
  rental_pricing: rentalPricing,
  secondary_market: secondaryMarket,
  dashboard,
}

const NUMERIC_KEYS = new Set([
  "min_price",
  "max_price",
  "min_yield",
  "page",
  "per_page",
  "bedrooms",
  "size_sqft",
])

const BOOLEAN_KEYS = new Set([
  "include_comparisons",
  "include_projects",
  "include_portfolio_analysis",
  "include_comparables",
])

function coerceParams(params: Record<string, unknown>) {
  const next: Record<string, unknown> = {}
  Object.entries(params).forEach(([key, value]) => {
    if (NUMERIC_KEYS.has(key)) {
      const parsed = typeof value === "number" ? value : Number(String(value).trim())
      next[key] = Number.isFinite(parsed) ? parsed : value
      return
    }
    if (BOOLEAN_KEYS.has(key)) {
      if (typeof value === "boolean") {
        next[key] = value
        return
      }
      const normalized = String(value).toLowerCase()
      next[key] = normalized === "true" || normalized === "1" || normalized === "yes"
      return
    }
    next[key] = value
  })
  return next
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const { allowed, resetAt } = await rateLimit(buildRateLimitKey(request, "daas"), {
      limit: 10,
      windowMs: 60_000,
    })
    if (!allowed) {
      const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again.", requestId },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      )
    }

    const body = await request.json()
    const product = body?.product as Product

    if (!product || !(product in PRODUCT_MAP)) {
      return NextResponse.json({ error: "Unknown DaaS product.", requestId }, { status: 400 })
    }

    const params = coerceParams(body?.params ?? {})
    const result = await PRODUCT_MAP[product](params)

    return NextResponse.json({
      product,
      params,
      result,
    })
  } catch (error) {
    console.error("DaaS request failed:", { requestId, error })
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Service unavailable."), requestId },
      { status: 500 },
    )
  }
}
