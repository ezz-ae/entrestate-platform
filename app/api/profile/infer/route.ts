import { NextResponse } from "next/server"
import { z } from "zod"
import { inferProfileUpdate } from "@/lib/profile"
import { AccessDeniedError, assertKillSwitch, assertPermission, type GovernanceRole } from "@/lib/governance"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const profileSchema = z.object({
  riskAppetite: z.enum(["conservative", "balanced", "growth", "opportunistic"]),
  horizon: z.enum(["ready", "6-12mo", "1-2yr", "2-4yr", "4yr+"]),
  yieldBias: z.number().min(0).max(1),
  safetyBias: z.number().min(0).max(1),
  preferredAreas: z.array(z.string()).optional(),
  budgetAed: z.number().int().positive().optional(),
  beds: z.number().int().positive().optional(),
})

const signalSchema = z.object({
  type: z.enum(["lens_selected", "suggestion_ignored", "signal_toggled"]),
  lens: z.enum(["chat", "search", "map"]).optional(),
  signal: z.enum(["yield", "risk", "liquidity", "price"]).optional(),
  timestamp: z.string().optional(),
})

const requestSchema = z.object({
  profile: profileSchema,
  signals: z.array(signalSchema).min(1),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    assertKillSwitch()
    const roleHeader = request.headers.get("x-entrestate-role")
    const role = (roleHeader as GovernanceRole) || "viewer"
    assertPermission(role, "profile:write")

    const payload = await request.json()
    const parsed = requestSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId }, { status: 400 })
    }

    const result = inferProfileUpdate(parsed.data.profile, parsed.data.signals)
    return NextResponse.json({ ...result, requestId })
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ error: error.message, requestId }, { status: 403 })
    }
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to infer profile updates."), requestId },
      { status: 500 },
    )
  }
}
