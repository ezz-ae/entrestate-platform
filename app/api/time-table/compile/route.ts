import { NextResponse } from "next/server"
import { z } from "zod"
import {
  compileTableSpec,
  compileTableSpecWithLLM,
  tableSpecEntitlementsSchema,
  TableSpecGoldenPath,
} from "@/lib/tablespec"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const compileRequestSchema = z.object({
  intent: z.string().trim().min(1).max(500).optional(),
  goldenPath: z
    .enum(["underwrite_development_site", "compare_area_yields", "draft_spa_contract"])
    .optional(),
  profile: z
    .object({
      riskProfile: z.string().trim().min(1).max(40).optional(),
      horizon: z.string().trim().min(1).max(40).optional(),
    })
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
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const payload = await request.json()
    const parsed = compileRequestSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId }, { status: 400 })
    }

    const compilerInput = {
      intent: parsed.data.intent,
      goldenPath: parsed.data.goldenPath as TableSpecGoldenPath | undefined,
      profile: parsed.data.profile,
      entitlements: parsed.data.entitlements,
      llm: parsed.data.llm,
    }

    const result = parsed.data.useLLM
      ? await compileTableSpecWithLLM(compilerInput)
      : compileTableSpec(compilerInput)

    return NextResponse.json({ ...result, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to compile TableSpec."), requestId },
      { status: 500 },
    )
  }
}
