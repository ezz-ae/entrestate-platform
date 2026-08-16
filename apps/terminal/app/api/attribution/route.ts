import { NextResponse } from "next/server"
import { z } from "zod"
import { getRequestId } from "@/lib/api-errors"
import { trackAttributionEvent } from "@/lib/attribution/events"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const attributionSchema = z
  .object({
    event_type: z.enum(["widget_view", "widget_click", "widget_signup", "widget_upgrade"]),
    widget_id: z.string().trim().min(1).max(120),
    embed_type: z.string().trim().max(80).optional(),
    source_domain: z.string().trim().max(255).optional(),
    source_page_url: z.string().trim().url().max(2048).optional(),
    project_id: z.string().trim().max(120).optional(),
    area: z.string().trim().max(120).optional(),
    referrer_user_id: z.string().trim().max(120).optional(),
    new_user_id: z.string().trim().max(255).optional(),
    session_id: z.string().trim().max(120).optional(),
    from_tier: z.string().trim().max(40).optional(),
    to_tier: z.string().trim().max(40).optional(),
    days_to_convert: z.number().int().min(0).max(365).optional(),
    mrr_delta: z.number().finite().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const payload = await request.json().catch(() => null)
  const parsed = attributionSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid attribution payload.", requestId }, { status: 400 })
  }

  void trackAttributionEvent(parsed.data)

  return NextResponse.json({ ok: true, requestId }, { status: 202 })
}
