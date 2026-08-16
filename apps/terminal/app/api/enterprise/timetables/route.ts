import { NextResponse } from "next/server"
import { compileTableSpecWithLLM } from "@/lib/tablespec/llm"
import { getCompleteIntelligenceSynthesis, getStrategicNarrative } from "@/lib/ai/enterprise/service"
import { materializeTable } from "@/lib/timetable/materialize"
import { getRequestId } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const authHeader = request.headers.get("Authorization")
  const secret = process.env.ENTERPRISE_API_SECRET

  // 1. Bearer Token Verification
  if (!secret) {
    return NextResponse.json(
      { error: "Enterprise API is not configured.", requestId },
      { status: 503 }
    )
  }

  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== secret) {
    return NextResponse.json(
      { error: "Unauthorized. Invalid or missing Bearer token.", requestId },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { intent, overrides, goldenPath } = body

    if (!intent && !goldenPath) {
      return NextResponse.json(
        { error: "Missing required parameters: 'intent' or 'goldenPath' must be provided.", requestId },
        { status: 400 }
      )
    }

    const intelligence = await getCompleteIntelligenceSynthesis().catch(() => null)

    // 2. Compile TableSpec with LLM-backed Strategist
    const compilation = await compileTableSpecWithLLM({
      intent,
      overrides,
      goldenPath,
      profile: intelligence ? {
        riskProfile: intelligence.riskBias > 0.7 ? "aggressive" : "moderate",
        horizon: intelligence.horizon,
        reasoning: getStrategicNarrative(intelligence)
      } : undefined,
      entitlements: {
        currentTier: "enterprise",
      },
    })

    if (!compilation.spec) {
      return NextResponse.json(
        { error: "Failed to compile TableSpec from the provided input.", requestId, warnings: compilation.warnings },
        { status: 422 }
      )
    }

    // 3. Materialize data from the compiled spec
    const data = await materializeTable(compilation.spec)

    // 4. Return results
    return NextResponse.json({
      requestId,
      spec: compilation.spec,
      data,
      metadata: {
        source: compilation.source,
        warnings: compilation.warnings,
        data_as_of: new Date().toISOString(),
        rows_count: data.length,
      },
    })
  } catch (error: any) {
    console.error(`[API] Enterprise Timetables Error (${requestId}):`, error)
    return NextResponse.json(
      { error: "Internal server error during TableSpec processing.", detail: error.message, requestId },
      { status: 500 }
    )
  }
}
