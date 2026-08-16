import { NextResponse } from "next/server"
import { getSessionUserId, isAdminUser } from "@/lib/auth"
import { overrideBodySchema } from "@/lib/agent-runtime/validators"
import { recordOverride } from "@/lib/market-score/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    if (!(await isAdminUser())) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 })
    }

    const body = await request.json()
    const parsed = overrideBodySchema.parse(body)

    if (!parsed.override_flags.allow_2030_plus && !parsed.override_flags.allow_speculative) {
      return NextResponse.json({ error: "Select at least one override option." }, { status: 400 })
    }

    const userId = await getSessionUserId()
    const result = await recordOverride({
      userId,
      riskProfile: parsed.risk_profile,
      horizon: parsed.horizon,
      overrideFlags: {
        allow2030Plus: parsed.override_flags.allow_2030_plus,
        allowSpeculative: parsed.override_flags.allow_speculative,
      },
      reason: parsed.reason,
      selectedAssetId: parsed.selected_asset_id,
    })

    const loggedAt = new Date().toISOString()

    console.info("agent-runtime.override", {
      risk_profile: parsed.risk_profile,
      horizon: parsed.horizon,
      flags: parsed.override_flags,
      asset_id: parsed.selected_asset_id,
    })

    return NextResponse.json({ disclosure: result.disclosure, loggedAt })
  } catch (error) {
    console.error("Agent runtime override error:", error)
    return NextResponse.json({ error: "Failed to log override." }, { status: 500 })
  }
}
