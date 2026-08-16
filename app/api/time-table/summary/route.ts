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
import {
  buildTimeTableCitations,
  buildTimeTableEvidence,
  buildTimeTableNarrative,
} from "@/lib/time-table/presentation"
import { generateDataScientistText } from "@/lib/llm/data-scientist"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
      model: z.string().trim().min(1).max(120).optional(),
      maxTokens: z.number().int().min(200).max(2000).optional(),
    })
    .optional(),
  limit: z.number().int().min(1).max(50).optional(),
})

type SummaryResponse = {
  summary: string
  highlights: string[]
  nextActions: string[]
}

const fallbackSummary = (intent?: string): SummaryResponse => ({
  summary: intent
    ? `Generated a live table for: ${intent}. Review the rows and signals to validate the insight before sharing.`
    : "Generated a live table from your request. Review the rows to confirm the insight.",
  highlights: ["Signals are compiled from the Time Table.", "Use filters to refine the scope."],
  nextActions: ["Generate a report", "Create a presentation"],
})

const parseSummary = (text: string): SummaryResponse => {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("summary_json_missing")
  const parsed = JSON.parse(jsonMatch[0]) as SummaryResponse
  return {
    summary: parsed.summary || "",
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 4) : [],
    nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions.slice(0, 3) : [],
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const payload = await request.json()
    const parsed = requestSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId }, { status: 400 })
    }

    const { spec, intent, goldenPath, entitlements, useLLM, llm, limit } = parsed.data

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
    const preview = table.preview(limit ?? 8)
    const sampleRows = preview.rows.slice(0, 6)
    const citations = buildTimeTableCitations(resolvedSpec, preview.rows)
    const evidence = buildTimeTableEvidence(resolvedSpec)
    const fallback = fallbackSummary(intent ?? resolvedSpec.intent)
    let summary = fallback
    let degraded = false
    let warning: string | undefined

    try {
      const prompt = `You are an investment analyst writing a short notebook summary for a client.

Intent: ${resolvedSpec.intent}
Row grain: ${resolvedSpec.row_grain}
Signals: ${resolvedSpec.signals.join(", ")}
Filters: ${resolvedSpec.filters.map((f) => `${f.field} ${f.op}`).join("; ") || "None"}

Sample rows:
${JSON.stringify(sampleRows, null, 2)}

Return JSON only in this format:
{
  "summary": "2-3 sentence narrative summary",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "nextActions": ["next step 1", "next step 2"]
}

Be concise, avoid making up numbers not present in the rows. If data is sparse, say so.
Respond with valid JSON only.`

      const { text } = await generateDataScientistText({
        prompt,
        system: "You summarize time tables for real-estate decision notebooks.",
        maxTokens: llm?.maxTokens ?? 600,
        model: llm?.model,
      })

      summary = parseSummary(text)
    } catch (error) {
      degraded = true
      warning = getPublicErrorMessage(error, "Summary model unavailable. Returned deterministic fallback summary.")
    }

    return NextResponse.json(
      {
        ...summary,
        narrative: buildTimeTableNarrative({
          spec: resolvedSpec,
          summary: summary.summary,
          highlights: summary.highlights,
          citations,
        }),
        citations,
        evidence,
        degraded,
        warning,
        requestId,
        request_id: requestId,
      },
      { headers: { "x-request-id": requestId } },
    )
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to generate summary."), requestId, request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    )
  }
}
