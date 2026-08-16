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
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const previewRequestSchema = z.object({
  spec: tableSpecSchema.optional(),
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
  limit: z.number().int().min(1).max(100).optional(),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const payload = await request.json()
    const parsed = previewRequestSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId }, { status: 400 })
    }

    const { spec, intent, goldenPath, profile, entitlements, useLLM, llm, limit } = parsed.data
    if (!spec && !intent && !goldenPath) {
      return NextResponse.json(
        { error: "Provide a TableSpec, intent, or goldenPath to preview.", requestId },
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
                profile,
                entitlements,
                llm,
              })
            : compileTableSpec({
                intent,
                goldenPath: goldenPath as TableSpecGoldenPath | undefined,
                profile,
                entitlements,
                llm,
              })
        ).spec

    const table = createTimeTable(resolvedSpec)
    const preview = table.preview(limit ?? 20)
    return NextResponse.json({ ...preview, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to preview Time Table."), requestId },
      { status: 500 },
    )
  }
}
