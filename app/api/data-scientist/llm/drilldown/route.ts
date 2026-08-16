import { NextResponse } from "next/server"
import type { VisSpec, DrillDownOption } from "@/data-scientist/lib/types"
import { generateDataScientistText } from "@/lib/llm/data-scientist"

interface DrillDownInsights {
  summary: string
  keyFindings: string[]
  drillDownOptions: DrillDownOption[]
  relatedQuestions: string[]
}

interface ProfileSummary {
  rowCount: number
  columns: Array<{ name: string; type: string; cardinality: number }>
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { datasetId, visSpec, profile } = body as {
      datasetId: string
      visSpec: VisSpec
      profile: ProfileSummary
    }

    if (!datasetId || !visSpec || !profile) {
      return NextResponse.json(
        { error: "datasetId, visSpec, and profile are required" },
        { status: 400 }
      )
    }

    // Build prompt for drill-down suggestions
    const prompt = buildDrillDownPrompt(visSpec, profile)

    const { text } = await generateDataScientistText({
      prompt,
      maxTokens: 1500,
    })

    const insights = parseDrillDownResponse(text, visSpec, profile)

    return NextResponse.json(insights)
  } catch (error) {
    console.error("Drill-down insights error:", error)

    // Return fallback
    return NextResponse.json({
      summary: "This view shows the market spread at a glance.",
      keyFindings: ["The market reveals patterns worth exploring."],
      drillDownOptions: [],
      relatedQuestions: ["What factors might influence this spread?"],
    })
  }
}

function buildDrillDownPrompt(visSpec: VisSpec, profile: ProfileSummary): string {
  const xClause = visSpec.intent.clauses.find((c) => c.role === "x")
  const yClause = visSpec.intent.clauses.find((c) => c.role === "y")
  const colorClause = visSpec.intent.clauses.find((c) => c.role === "color")
  const filterClauses = visSpec.intent.clauses.filter((c) => c.role === "filter")

  const currentFields = [xClause?.field, yClause?.field, colorClause?.field].filter(Boolean)
  const availableColumns = profile.columns.filter(
    (c) => !currentFields.includes(c.name) && c.cardinality > 1 && c.cardinality <= 50
  )

  const categoricalCols = availableColumns.filter((c) => c.type === "category")
  const numericCols = availableColumns.filter((c) => c.type === "number")

  return `You are a market analyst. Analyze this view and suggest meaningful next explorations.

CURRENT CHART:
- Title: ${visSpec.title}
- Type: ${visSpec.chartType}
- X-axis: ${xClause?.field || "none"}
- Y-axis: ${yClause?.field || "none"}
- Color grouping: ${colorClause?.field || "none"}
- Current filters: ${filterClauses.length > 0 ? filterClauses.map((f) => `${f.field}=${f.value}`).join(", ") : "none"}

COVERAGE:
- Total projects: ${profile.rowCount}
- Available categorical signals for segmentation: ${categoricalCols.map((c) => `${c.name} (${c.cardinality} values)`).join(", ") || "none"}
- Available numeric signals: ${numericCols.map((c) => c.name).join(", ") || "none"}

Respond with a JSON object in this exact format:
{
  "summary": "A 1-2 sentence summary of what this chart reveals",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "drillDownOptions": [
    {
      "type": "breakdown",
      "label": "Segment by ColumnName",
      "description": "See how the market varies across different ColumnName values",
      "field": "ColumnName"
    },
    {
      "type": "filter",
      "label": "Focus on specific segment",
      "description": "Filter to see just one part of the market",
      "field": "ColumnName",
      "value": "specific_value"
    },
    {
      "type": "compare",
      "label": "Compare with AnotherColumn",
      "description": "See how this relates to another dimension",
      "field": "AnotherColumn",
      "secondaryField": "OptionalSecondField"
    }
  ],
  "relatedQuestions": ["Question 1?", "Question 2?"]
}

IMPORTANT:
- For "breakdown" type: suggest adding a color grouping by a categorical signal
- For "filter" type: suggest filtering to interesting segments (use actual signal names from the feed)
- For "compare" type: suggest scatter plots or cross-comparisons with other signals
- Provide 3-5 next-view options that would genuinely help understand the market
- Only suggest fields that exist in the available signals
- Make descriptions actionable and specific

Respond ONLY with valid JSON, no additional text.`
}

function parseDrillDownResponse(
  text: string,
  visSpec: VisSpec,
  profile: ProfileSummary
): DrillDownInsights {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found")

    const parsed = JSON.parse(jsonMatch[0])

    // Validate and filter drill-down options to only include valid fields
    const validFields = new Set(profile.columns.map((c) => c.name))
    const validDrillDowns = (parsed.drillDownOptions || [])
      .filter((opt: DrillDownOption) => {
        if (opt.field && !validFields.has(opt.field)) return false
        if (opt.secondaryField && !validFields.has(opt.secondaryField)) return false
        return true
      })
      .slice(0, 5)

    return {
      summary: parsed.summary || "This view shows patterns in the market.",
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings.slice(0, 4) : [],
      drillDownOptions: validDrillDowns,
      relatedQuestions: Array.isArray(parsed.relatedQuestions) ? parsed.relatedQuestions.slice(0, 3) : [],
    }
  } catch {
    // Generate fallback based on available columns
    const currentFields = visSpec.intent.clauses.map((c) => c.field)
    const availableCategorical = profile.columns.filter(
      (c) => c.type === "category" && !currentFields.includes(c.name) && c.cardinality <= 20
    )

    const fallbackDrillDowns: DrillDownOption[] = availableCategorical.slice(0, 3).map((col) => ({
      type: "breakdown" as const,
      label: `Segment by ${col.name}`,
      description: `See how the market varies across ${col.name}`,
      field: col.name,
    }))

    return {
      summary: "This view reveals patterns in the market.",
      keyFindings: ["The market shows an interesting spread."],
      drillDownOptions: fallbackDrillDowns,
      relatedQuestions: ["What factors might explain these patterns?"],
    }
  }
}
