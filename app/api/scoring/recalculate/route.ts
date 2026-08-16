import { NextResponse } from "next/server"
import { z } from "zod"
import {
  compileTableSpec,
  compileTableSpecWithLLM,
  enforceTableSpec,
  tableSpecEntitlementsSchema,
  TableSpecGoldenPath,
  tableSpecSchema,
} from "@/lib/tablespec"
import { createTimeTable } from "@/lib/time-table"
import { DEFAULT_SCORE_WEIGHTS, rankRows, type ScoreWeights } from "@/lib/scoring"
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

const weightsSchema = z.object({
  market: z
    .object({
      yield: z.number().min(0).max(1),
      risk: z.number().min(0).max(1),
      liquidity: z.number().min(0).max(1),
      price: z.number().min(0).max(1),
    })
    .optional(),
  match: z
    .object({
      area: z.number().min(0).max(1),
      budget: z.number().min(0).max(1),
      beds: z.number().min(0).max(1),
      risk: z.number().min(0).max(1),
      horizon: z.number().min(0).max(1),
    })
    .optional(),
})

const requestSchema = z.object({
  spec: tableSpecSchema.optional(),
  intent: z.string().trim().min(1).max(500).optional(),
  goldenPath: z
    .enum(["underwrite_development_site", "compare_area_yields", "draft_spa_contract"])
    .optional(),
  entitlements: tableSpecEntitlementsSchema.optional(),
  useLLM: z.boolean().optional(),
  llm: z
    .object({
      model: z.string().trim().min(1).max(80).optional(),
      temperature: z.number().min(0).max(1).optional(),
      maxTokens: z.number().int().min(100).max(2000).optional(),
    })
    .optional(),
  profile: profileSchema,
  weights: weightsSchema.optional(),
  limit: z.number().int().min(1).max(200).optional(),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    assertKillSwitch()
    const roleHeader = request.headers.get("x-entrestate-role")
    const role = (roleHeader as GovernanceRole) || "viewer"
    assertPermission(role, "time_table:read")

    const payload = await request.json()
    const parsed = requestSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId }, { status: 400 })
    }

    const { spec, intent, goldenPath, entitlements, useLLM, llm, profile, weights, limit } = parsed.data
    if (!spec && !intent && !goldenPath) {
      return NextResponse.json(
        { error: "Provide a TableSpec, intent, or goldenPath to recalculate scores.", requestId },
        { status: 400 },
      )
    }

    const resolvedSpec = spec
      ? enforceTableSpec(spec, entitlements)
      : (
          useLLM
            ? await compileTableSpecWithLLM({
                intent,
                goldenPath: goldenPath as TableSpecGoldenPath | undefined,
                entitlements,
                llm,
              })
            : compileTableSpec({
                intent,
                goldenPath: goldenPath as TableSpecGoldenPath | undefined,
                entitlements,
                llm,
              })
        ).spec

    const table = createTimeTable(resolvedSpec)
    const rows = table.materialize()
    const scoreWeights: ScoreWeights = {
      market: weights?.market ?? DEFAULT_SCORE_WEIGHTS.market,
      match: weights?.match ?? DEFAULT_SCORE_WEIGHTS.match,
    }

    const ranked = rankRows(rows, profile, scoreWeights)
    const resolvedLimit = limit ?? ranked.length

    return NextResponse.json({
      metadata: table.metadata(),
      weights: scoreWeights,
      total: ranked.length,
      rows: ranked.slice(0, resolvedLimit),
      requestId,
    })
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ error: error.message, requestId }, { status: 403 })
    }
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to recalculate scores."), requestId },
      { status: 500 },
    )
  }
}
