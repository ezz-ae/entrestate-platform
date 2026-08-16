import { NextResponse } from "next/server"
import { isAdminUser } from "@/lib/auth"
import { parseRunBody } from "@/lib/agent-runtime/validators"
import { runAgentRuntime } from "@/lib/agent-runtime/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = parseRunBody(body)

    if (parsed.overrideActive && (parsed.overrideFlags.allow2030Plus || parsed.overrideFlags.allowSpeculative)) {
      if (!(await isAdminUser())) {
        return NextResponse.json({ error: "Not authorized." }, { status: 403 })
      }
    }

    const result = await runAgentRuntime(parsed)

    console.info("agent-runtime.run", {
      mode: parsed.ranked ? "ranked" : "matched",
      risk_profile: parsed.riskProfile,
      horizon: parsed.horizon,
      returned_count: result.returnedCount,
      override: parsed.overrideActive ? parsed.overrideFlags : null,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Agent runtime run error:", error)
    return NextResponse.json({ error: "Unable to run matching. Check your inputs." }, { status: 400 })
  }
}
