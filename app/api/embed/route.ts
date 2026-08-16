import { NextResponse } from "next/server"
import { z } from "zod"
import { buildRateLimitKey, rateLimit } from "@/lib/rate-limit"
import { getRequestId } from "@/lib/api-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const querySchema = z
  .object({
    type: z.enum(["market_card", "area_table", "score_badge", "market_pulse"]).default("market_card"),
    id: z.string().trim().max(160).optional(),
    ref: z.string().trim().max(120).optional(),
  })
  .strict()

const EMBED_SPECS = {
  market_card: {
    columns_exposed: ["name", "area", "price_from_aed", "score_0_100", "safety_band"],
    leadMagnet: true,
  },
  area_table: {
    columns_exposed: ["area", "avg_price", "avg_yield", "supply_pressure", "efficiency"],
    leadMagnet: true,
  },
  score_badge: {
    columns_exposed: ["name", "score_0_100", "safety_band", "classification"],
    leadMagnet: false,
  },
  market_pulse: {
    columns_exposed: ["area", "buy_signals", "safe_projects", "efficiency"],
    leadMagnet: false,
  },
} as const

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const { searchParams } = new URL(request.url)

  const parsed = querySchema.safeParse({
    type: searchParams.get("type") ?? undefined,
    id: searchParams.get("id") ?? undefined,
    ref: searchParams.get("ref") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid embed request.", requestId }, { status: 400 })
  }

  const { type, id, ref } = parsed.data
  const spec = EMBED_SPECS[type]

  const limit = ref ? 100 : 10
  const limiter = await rateLimit(buildRateLimitKey(request, `embed:${ref || "anon"}`), {
    limit,
    windowMs: 60_000,
  })

  if (!limiter.allowed) {
    const retryAfter = Math.max(1, Math.ceil((limiter.resetAt - Date.now()) / 1000))
    return NextResponse.json(
      {
        error: "Too many embed requests. Please retry shortly.",
        requestId,
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    )
  }

  const payload = {
    request_id: requestId,
    widget_type: type,
    widget_id: id ?? null,
    interaction_mode: "overlay",
    actions: {
      cta_action: "open_evidence_drawer",
      fallback_action: "open_new_tab",
      fallback_url: id ? `/chat?ref=widget&wid=${encodeURIComponent(id)}` : "/chat?ref=widget",
    },
    lead_magnet: {
      enabled: spec.leadMagnet,
      mode: spec.leadMagnet ? "dual_capture" : "none",
      webhook_attribute: "data-lead-webhook",
      entrestate_signup_url: id
        ? `/api/signup?tier=free&source=widget&wid=${encodeURIComponent(id)}`
        : "/api/signup?tier=free&source=widget",
    },
    embed_attributes: {
      interaction: "overlay",
      lead_magnet: spec.leadMagnet ? "true" : "false",
    },
    columns_exposed: spec.columns_exposed,
    freshness: new Date().toISOString(),
    data: {
      headline: "Market evidence widget",
      summary: "Open the on-page evidence drawer without leaving this site.",
    },
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  })
}
