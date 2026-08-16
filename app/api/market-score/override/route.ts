import { NextResponse } from "next/server"
import { recordOverride } from "@/lib/market-score/service"
import { overrideBodySchema } from "@/lib/market-score/validators"
import { getSessionUserId, isAdminUser } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    if (!(await isAdminUser())) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 })
    }

    const body = await request.json()
    const parsed = overrideBodySchema.parse(body)
    const userId = await getSessionUserId()

    if (!parsed.override_flags.allow_2030_plus && !parsed.override_flags.allow_speculative) {
      return NextResponse.json({ error: "Select at least one override option." }, { status: 400 })
    }

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

    return NextResponse.json({ disclosure: result.disclosure })
  } catch (error) {
    console.error("Market score override error:", error)
    return NextResponse.json({ error: "Failed to log override." }, { status: 500 })
  }
}
