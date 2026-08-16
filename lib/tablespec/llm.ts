import { resolveCopilotModel } from "../ai-provider"
import { generateText } from "ai"
import { tableSpecSchema } from "./schema"
import { compileTableSpec } from "./compiler"
import { TableSpec, TableSpecCompilation, TableSpecCompileInput } from "./types"
import { enforceTableSpec } from "./validation"
import { COLUMN_REGISTRY, getAccessibleColumns } from "../registry/columns"

const DEFAULT_MODEL = process.env.TABLESPEC_LLM_MODEL || "openai/gpt-4o-mini"
const DEFAULT_TEMPERATURE = 0.1
const DEFAULT_MAX_TOKENS = 900

const DEFAULT_TIME_RANGE = { mode: "relative", last: 24, unit: "months" } as const

const extractJson = (text: string) => {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("llm_no_json")
  return JSON.parse(match[0]) as Partial<TableSpec>
}

const applyOverrides = (spec: TableSpec, overrides?: Partial<TableSpec>): TableSpec => {
  if (!overrides) return spec
  return {
    ...spec,
    ...overrides,
    scope: {
      ...spec.scope,
      ...overrides.scope,
    },
    time_range: {
      ...spec.time_range,
      ...overrides.time_range,
    },
  }
}

const buildPrompt = (input: TableSpecCompileInput) => {
  const intent = input.intent?.trim() ?? ""
  const profile = input.profile
    ? `Risk profile: ${input.profile.riskProfile ?? "unspecified"}\nHorizon: ${input.profile.horizon ?? "unspecified"}`
    : "Profile: not provided"

  const registryScope = input.entitlements?.currentTier
    ? getAccessibleColumns(input.entitlements.currentTier)
    : COLUMN_REGISTRY

  // Provide a list of legal columns from the registry (tier-aware).
  const legalColumns = registryScope.map((c) => `${c.id} (${c.tier} tier, ${c.layer} layer)`).join("\n- ")

  const entitlementLines = input.entitlements
    ? [
        `User Tier: ${input.entitlements.currentTier ?? "free"}`,
        `Allowed row grains: ${input.entitlements.allowedRowGrains?.join(", ") ?? "project, asset, transaction"}`,
        `Max limit: ${input.entitlements.maxLimit ?? 500}`,
      ].join("\n")
    : "Entitlements: not provided"

  const narrative = input.profile ? `STRATEGIC NARRATIVE: ${input.profile.reasoning ?? "Standard institutional deployment"}` : ""

  return `You are the Lead Investment Strategist for Entrestate Intelligence OS.
Your objective is to convert user intent into a high-fidelity TableSpec JSON object while providing deep, first-principles reasoning.

User intent: "${intent}"
${profile}
${entitlementLines}
${narrative}

RECOGNIZED COLUMNS:
- ${legalColumns}

CRITICAL ANALYTICAL RULES:
1. FIRST PRINCIPLES REASONING: In the "reasoning" field, follow a Chain-of-Thought (CoT) format:
   - Metadata Synthesis: What specific constraints (budget, risk, horizon) are driving the parameters?
   - Strategic Hypothesis: Why are these specific signals (e.g., yield_gross_pct vs. investor_score_v1) the correct lens for this regime?
   - Epistemic Disclosure: Why was the chosen "dataSource" (L1-L5) selected for this specific query?
2. FIELD STANDARDIZATION:
   - "price" or "cost" -> ALWAYS "price_from_aed".
   - "yield" or "returns" -> ALWAYS "yield_gross_pct".
3. TIME DIMENSIONS: If not specified, default to "monthly" grain and "last 24 months" relative range.
4. EVIDENCE LAYERING: The "dataSource" must cite the primary truth layer (e.g., "L1 Canonical", "L2 Derived", "L3 Dynamic").

Return ONLY raw JSON matching this schema:
{
  "version": "v1",
  "intent": "string",
  "row_grain": "project" | "asset" | "transaction",
  "scope": {"cities"?: string[], "areas"?: string[], "developers"?: string[], "projects"?: string[]},
  "time_grain": "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
  "time_range": {"mode": "relative" | "absolute", "last"?: number, "unit"?: "days" | "months" | "years", "from"?: string, "to"?: string},
  "signals": string[],
  "filters": [{"field": string, "op": "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "in" | "contains", "value": string | number | boolean}],
  "sort"?: {"field": string, "direction": "asc" | "desc"},
  "limit"?: number,
  "reasoning": "First Principles Trace: [CoT reasoning here]",
  "dataSource": "string"
}
No markdown formatting, no commentary.`
}

export const isTableSpecLlmEnabled = () => process.env.TABLESPEC_LLM_ENABLED === "true"

export async function compileTableSpecWithLLM(
  input: TableSpecCompileInput,
): Promise<TableSpecCompilation> {
  if (input.goldenPath) return compileTableSpec(input)

  const warnings: string[] = []
  if (!isTableSpecLlmEnabled()) {
    const fallback = compileTableSpec(input)
    return { ...fallback, warnings: ["llm_disabled", ...fallback.warnings] }
  }

  if (!input.intent) {
    const fallback = compileTableSpec(input)
    return { ...fallback, warnings: ["missing_intent", ...fallback.warnings] }
  }

  try {
    const model = resolveCopilotModel()
    if (!model) throw new Error("no_ai_model")

    const prompt = buildPrompt(input)
    const { text } = await generateText({
      model,
      prompt,
      temperature: input.llm?.temperature ?? DEFAULT_TEMPERATURE,
      maxTokens: input.llm?.maxTokens ?? DEFAULT_MAX_TOKENS,
    } as any)

    const candidate = extractJson(text)
    if (!Array.isArray(candidate.signals) || candidate.signals.length === 0) {
      throw new Error("llm_missing_signals")
    }

    const reasoning =
      typeof candidate.reasoning === "string" && candidate.reasoning.trim().length > 0
        ? candidate.reasoning
        : `First Principles Trace: intent=${candidate.intent ?? input.intent ?? "request"}; signals=${candidate.signals.join(", ")}.`
    if (reasoning === candidate.reasoning) {
      void 0
    } else {
      warnings.push("llm_missing_reasoning")
    }

    const dataSource =
      typeof candidate.dataSource === "string" && candidate.dataSource.trim().length > 0
        ? candidate.dataSource
        : "L2 Derived"
    if (dataSource !== candidate.dataSource) {
      warnings.push("llm_missing_price_source")
    }

    const spec: TableSpec = {
      version: "v1",
      intent: candidate.intent ?? input.intent ?? "Untitled request",
      row_grain: candidate.row_grain ?? "project",
      scope: candidate.scope ?? {},
      time_grain: candidate.time_grain ?? "monthly",
      time_range: candidate.time_range ?? DEFAULT_TIME_RANGE,
      signals: candidate.signals,
      filters: candidate.filters ?? [],
      sort: candidate.sort,
      limit: candidate.limit,
      reasoning,
      dataSource,
    }

    const resolved = applyOverrides(spec, input.overrides)
    const parsed = tableSpecSchema.strict().parse(resolved)
    const validated = enforceTableSpec(parsed, input.entitlements)

    return { spec: validated, warnings, source: "intent" }
  } catch (error) {
    warnings.push("llm_fallback")
    const fallback = compileTableSpec(input)
    return { ...fallback, warnings: [...warnings, ...fallback.warnings] }
  }
}
