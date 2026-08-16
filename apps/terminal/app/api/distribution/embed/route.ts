import { NextResponse } from "next/server"
import { z } from "zod"
import { generateEmbedSnippet } from "@/lib/distribution"
import { AccessDeniedError, assertKillSwitch, assertPermission, type GovernanceRole } from "@/lib/governance"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const requestSchema = z.object({
  widgetId: z.string().trim().min(1).max(100),
  tableHash: z.string().trim().min(6).max(128),
  widgetType: z.enum(["market_card", "area_table", "score_badge", "market_pulse"]).optional(),
  tier: z.enum(["free", "pro", "enterprise"]).optional(),
  branding: z
    .object({
      primaryColor: z.string().trim().min(1).max(20).optional(),
      logoUrl: z.string().trim().url().optional(),
      badgeText: z.string().trim().min(1).max(40).optional(),
    })
    .optional(),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    assertKillSwitch()
    const roleHeader = request.headers.get("x-entrestate-role")
    const role = (roleHeader as GovernanceRole) || "viewer"
    assertPermission(role, "distribution:publish")

    const payload = await request.json()
    const parsed = requestSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId }, { status: 400 })
    }

    const embedCode = generateEmbedSnippet(parsed.data)
    return NextResponse.json({ embedCode, requestId })
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ error: error.message, requestId }, { status: 403 })
    }
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to generate embed snippet."), requestId },
      { status: 500 },
    )
  }
}
