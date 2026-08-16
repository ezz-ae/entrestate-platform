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
import { createTimeTable, type TimeTableRow } from "@/lib/time-table"
import {
  generateContractDraft,
  generateHtmlWidget,
  generatePdfReport,
  generatePptxDeck,
  generateTextArtifact,
  type DecisionArtifactType,
} from "@/lib/artifacts"
import { generateDataScientistText } from "@/lib/llm/data-scientist"
import { AccessDeniedError, assertKillSwitch, assertPermission, type GovernanceRole } from "@/lib/governance"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const brandingSchema = z.object({
  primaryColor: z.string().trim().min(1).max(20).optional(),
  logoUrl: z.string().trim().url().optional(),
  badgeText: z.string().trim().min(1).max(40).optional(),
  tier: z.enum(["free", "pro", "enterprise"]).optional(),
})

const artifactTypeSchema = z.enum([
  "investor_memo",
  "underwriting_report",
  "comparison_note",
  "contract_draft",
  "widget",
  "pptx_deck",
  "social_post",
  "offer_letter",
  "investment_plan",
  "brochure",
])

const requestSchema = z.object({
  artifactType: artifactTypeSchema,
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
      maxTokens: z.number().int().min(200).max(2500).optional(),
    })
    .optional(),
  limit: z.number().int().min(1).max(50).optional(),
  branding: brandingSchema.optional(),
})

const textArtifactTypes = new Set<DecisionArtifactType>([
  "investor_memo",
  "comparison_note",
  "social_post",
  "offer_letter",
  "investment_plan",
  "brochure",
])

const artifactInstructions: Record<DecisionArtifactType, string> = {
  investor_memo:
    "Write a concise investor memo summary with sections: Summary, Signals, Risks, Recommendation.",
  comparison_note:
    "Write a comparison note in short bullet points with clear takeaways and open questions.",
  social_post:
    "Write a short social post (max 120 words) with one call-to-action. Keep it factual.",
  offer_letter:
    "Write a succinct offer letter summary (max 200 words) with scope, pricing posture, and next steps.",
  investment_plan:
    "Write a structured investment plan with headings: Objective, Thesis, Risks, Timeline, Next Steps.",
  brochure:
    "Write brochure copy with sections: Overview, Highlights, Metrics, Contact. Keep it crisp.",
  underwriting_report: "",
  contract_draft: "",
  widget: "",
  pptx_deck: "",
}

const fallbackText = (type: DecisionArtifactType, intent: string, signals: string[]) => {
  const signalLine = signals.length ? `Signals: ${signals.join(", ")}.` : "Signals available."
  return `Entrestate ${type.replace(/_/g, " ")}\n\nIntent: ${intent}\n${signalLine}\n\nReview the time table rows to confirm the evidence before sharing.`
}

const buildPrompt = (type: DecisionArtifactType, intent: string, specSignals: string[], sampleRows: TimeTableRow[]) => {
  const instruction = artifactInstructions[type]
  return `${instruction}

Intent: ${intent}
Signals: ${specSignals.join(", ") || "None"}
Sample rows:
${JSON.stringify(sampleRows, null, 2)}

Do not invent numbers not present in the rows. Return plain text only.`
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    assertKillSwitch()
    const roleHeader = request.headers.get("x-entrestate-role")
    const role = (roleHeader as GovernanceRole) || "viewer"
    assertPermission(role, "artifact:generate")

    const payload = await request.json()
    const parsed = requestSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId }, { status: 400 })
    }

    const { artifactType, spec, intent, goldenPath, entitlements, useLLM, llm, limit, branding } = parsed.data
    if (!spec && !intent && !goldenPath) {
      return NextResponse.json(
        { error: "Provide a TableSpec, intent, or goldenPath to generate artifacts.", requestId },
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
    const preview = table.preview(limit ?? 12)
    const tableHash = preview.metadata.hash
    const sampleRows = preview.rows.slice(0, 6)

    if (artifactType === "underwriting_report") {
      const artifact = generatePdfReport(resolvedSpec, tableHash, {
        branding,
        title: "Underwriting Report",
      })
      return NextResponse.json({ artifact, requestId })
    }

    if (artifactType === "pptx_deck") {
      const artifact = generatePptxDeck(resolvedSpec, tableHash, { branding })
      return NextResponse.json({ artifact, requestId })
    }

    if (artifactType === "widget") {
      const artifact = generateHtmlWidget(resolvedSpec, tableHash, { branding })
      return NextResponse.json({ artifact, requestId })
    }

    if (artifactType === "contract_draft") {
      const artifact = generateContractDraft(resolvedSpec, tableHash, { branding })
      return NextResponse.json({ artifact, requestId })
    }

    if (textArtifactTypes.has(artifactType)) {
      const prompt = buildPrompt(artifactType, resolvedSpec.intent, resolvedSpec.signals, sampleRows)
      const content = useLLM === false
        ? fallbackText(artifactType, resolvedSpec.intent, resolvedSpec.signals)
        : (
            await generateDataScientistText({
              prompt,
              system: "You convert evidence-backed time tables into client-ready decision artifacts.",
              maxTokens: llm?.maxTokens ?? 900,
              model: llm?.model,
            })
          ).text

      const artifact = generateTextArtifact(artifactType, resolvedSpec, tableHash, content, { branding })
      return NextResponse.json({ artifact, requestId })
    }

    return NextResponse.json({ error: "Unsupported artifact type.", requestId }, { status: 400 })
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ error: error.message, requestId }, { status: 403 })
    }
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to generate artifact."), requestId },
      { status: 500 },
    )
  }
}
