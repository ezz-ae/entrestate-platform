import { NextResponse } from "next/server"
import { z } from "zod"
import { trackAttributionEvent } from "@/lib/attribution/events"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const querySchema = z.object({
  tier: z.enum(["free", "pro", "team", "institutional"]).default("free"),
  source: z.string().trim().min(1).max(80).default("direct"),
  wid: z.string().trim().min(1).max(120).optional(),
})

const bodySchema = z
  .object({
    email: z.string().trim().email().optional(),
    name: z.string().trim().min(1).max(120).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .optional()

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsedQuery = querySchema.safeParse({
    tier: searchParams.get("tier") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    wid: searchParams.get("wid") ?? undefined,
  })

  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid signup query." }, { status: 400 })
  }

  let parsedBody: z.infer<typeof bodySchema>
  try {
    const raw = await request.json().catch(() => undefined)
    const bodyResult = bodySchema.safeParse(raw)
    if (!bodyResult.success) {
      return NextResponse.json({ error: "Invalid signup payload." }, { status: 400 })
    }
    parsedBody = bodyResult.data
  } catch {
    parsedBody = undefined
  }

  if (parsedQuery.success && parsedQuery.data.source === "widget" && parsedQuery.data.wid) {
    void trackAttributionEvent({
      event_type: "widget_signup",
      widget_id: parsedQuery.data.wid,
      source_domain: request.headers.get("origin") ?? undefined,
      new_user_id: parsedBody?.email ?? undefined,
      metadata: {
        tier: parsedQuery.data.tier,
        captured_email: parsedBody?.email ?? null,
      },
    })
  }

  return NextResponse.json({
    ok: true,
    created: true,
    tier: parsedQuery.data.tier,
    source: parsedQuery.data.source,
    widget_id: parsedQuery.data.wid ?? null,
    lead_email: parsedBody?.email ?? null,
    captured_at: new Date().toISOString(),
  })
}
