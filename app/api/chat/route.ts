import { NextResponse } from "next/server"
import { generateText, tool } from "ai"
import { z } from "zod"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { resolveCopilotModel } from "@/lib/ai-provider"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import {
  safeConsumeCopilotUsage,
  getAnonymousCopilotAccountKey,
} from "@/lib/copilot-usage"
import {
  executeAreaRiskBrief,
  executeDealScreener,
  executeDldAreaBenchmark,
  executeDldMarketPulse,
  executeDldNotableDeals,
  executeDldTransactionSearch,
  executeDeveloperDueDiligence,
  executeGenerateInvestorMemo,
  executePriceRealityCheck,
} from "@/lib/copilot/executor"
import { collectGuardrailWarnings } from "@/lib/copilot/guardrails"
import {
  type AreaRiskBriefInput,
  type DealScreenerInput,
  type DeveloperDueDiligenceInput,
  type DldAreaBenchmarkInput,
  type DldNotableDealsInput,
  type DldTransactionSearchInput,
  type GenerateInvestorMemoInput,
  type PriceRealityCheckInput,
  areaRiskBriefInputSchema,
  getCopilotSystemPrompt,
  copilotToolDescriptions,
  dealScreenerInputSchema,
  dldAreaBenchmarkInputSchema,
  dldMarketPulseInputSchema,
  dldNotableDealsInputSchema,
  dldTransactionSearchInputSchema,
  developerDueDiligenceInputSchema,
  generateInvestorMemoInputSchema,
  priceRealityCheckInputSchema,
} from "@/lib/copilot/tools"
import {
  mcpCrossReference,
  mcpDescribeTable,
  mcpQuery,
} from "@/lib/mcp/server"
import { getLatestNotebookProvenance } from "@/lib/notebook-provenance"
import { Prisma, dbQuery } from "@/lib/db"
import {
  mcpCrossReferenceInputSchema,
  mcpDescribeTableInputSchema,
  mcpQueryInputSchema,
  type McpCrossReferenceInput,
  type McpDescribeTableInput,
  type McpQueryInput,
} from "@/lib/mcp/schemas"
import { normalizeLocale } from "@/i18n/locale"
import { pickLocalizedText } from "@/lib/format/entities"
import { formatAed as formatAedValue } from "@/lib/format/currency"
import { formatDecimal, formatInteger } from "@/lib/format/number"
import { getInventoryTableSql } from "@/lib/inventory-table"
import { getEnterpriseConfig } from "@/lib/enterprise-config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const chatRequestSchema = z
  .object({
    intent: z.string().trim().min(1).max(500).optional(),
    message: z.string().trim().min(1).max(500).optional(),
    context: z
      .object({
        city: z.string().trim().min(1).max(120).optional(),
        area: z.string().trim().min(1).max(120).optional(),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.intent || data.message), {
    message: "message or intent is required",
  })

function getDefaultSuggestions(locale: string) {
  return locale === "ar"
    ? [
        "هل يمكنك إيجاد استوديوهات تحت 800 ألف درهم في الخليج التجاري؟",
        "ساعدني في المقارنة بين دبي مارينا وجميرا بيتش ريزيدنس",
        "ما هي أفضل المناطق التي سيتم تسليم مشاريعها خلال عامين؟",
        "أبحث عن مشاريع في أبوظبي بميزانية تحت 2 مليون درهم"
      ]
    : [
        "Can you find me studios under AED 800K in Business Bay?",
        "Help me compare Dubai Marina vs JBR",
        "What are the best areas for projects delivering in the next 2 years?",
        "I'm looking for projects in Abu Dhabi under AED 2M"
      ]
}

const rawChatModelTimeoutMs = Number.parseInt(process.env.CHAT_MODEL_TIMEOUT_MS ?? "5000", 10)
const chatModelTimeoutMs = Number.isFinite(rawChatModelTimeoutMs) && rawChatModelTimeoutMs >= 1000
  ? rawChatModelTimeoutMs
  : 60000

type ChatCard = {
  type: "stat" | "area" | "project"
  title: string
  value: string
  subtitle?: string
}

type ToolResultEnvelope = {
  source?: unknown
  rows?: unknown
  count?: unknown
  data_as_of?: unknown
  guardrail_warnings?: unknown
  overview?: unknown
  top_areas_by_velocity?: unknown
}

type DldNotification = {
  headline: string
  subline: string
  amount: number
  badge: string | null
  reg_type: string
  prop_type: string
  is_notable: boolean
}

function sanitizeForAi<T>(value: T): T {
  if (typeof value === "bigint") {
    const asNumber = Number(value)
    return (Number.isSafeInteger(asNumber) ? asNumber : value.toString()) as T
  }

  if (value instanceof Date) {
    return value.toISOString() as T
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeForAi(entry)) as T
  }

  if (value && typeof value === "object") {
    const candidate = value as { toNumber?: unknown }
    if (typeof candidate.toNumber === "function") {
      try {
        return candidate.toNumber() as T
      } catch {
        return String(value) as T
      }
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => typeof entry !== "function")
        .map(([key, entry]) => [key, sanitizeForAi(entry)]),
    ) as T
  }

  return value
}

function buildHardFallback(locale: string) {
  return {
    content: locale === "ar"
      ? "البيانات غير متاحة مؤقتاً. حاول مرة أخرى خلال لحظات."
      : "Market data is temporarily unavailable. Please try again shortly.",
    dataCards: undefined,
    evidence: {
      sources_used: ["fallback"],
    },
    data_as_of: new Date().toISOString(),
  }
}

function buildChatProvenance(
  runId: string,
  provenance: { snapshot_ts?: string | null } | null,
  sourcesUsed: string[],
) {
  return {
    run_id: runId,
    snapshot_ts: provenance?.snapshot_ts ?? null,
    sources_used: sourcesUsed,
  }
}

function buildChatResponse(args: {
  content: string
  requestId: string
  runId: string
  provenance: { snapshot_ts?: string | null } | null
  sourcesUsed: string[]
  dataCards?: ChatCard[]
  dataAsOf?: string
  warnings?: string[]
  extra?: Record<string, unknown>
}) {
  const provenancePayload = buildChatProvenance(args.runId, args.provenance, args.sourcesUsed)

  return {
    ...(args.extra ?? {}),
    content: args.content,
    dataCards: args.dataCards ?? [],
    evidence: {
      sources_used: args.sourcesUsed,
      warnings: args.warnings ?? [],
      run_id: args.runId,
      provenance: provenancePayload,
    },
    provenance: provenancePayload,
    data_as_of: args.dataAsOf ?? new Date().toISOString(),
    requestId: args.requestId,
    request_id: args.requestId,
    run_id: args.runId,
  }
}

async function safeDbQuery<T>(query: Prisma.Sql, label: string): Promise<T[]> {
  try {
    return await dbQuery<T>(query)
  } catch (error) {
    console.error("Chat fallback query failed:", { label, error })
    return []
  }
}

async function safeToolResult<T>(label: string, call: () => Promise<T>): Promise<T | null> {
  try {
    return await call()
  } catch (error) {
    console.error("Chat fallback tool failed:", { label, error })
    return null
  }
}

function withGuardrails<T extends Record<string, unknown>>(output: T): T & { guardrail_warnings: string[] } {
  const sanitized = sanitizeForAi(output)
  const warnings = collectGuardrailWarnings(sanitized)
  return {
    ...sanitized,
    guardrail_warnings: warnings,
  }
}

function buildUserPrompt(message: string, context?: { city?: string; area?: string }) {
  const segments = [message.trim()]

  if (context?.city || context?.area) {
    segments.push(
      [
        "Context:",
        context.city ? `- City: ${context.city}` : null,
        context.area ? `- Area: ${context.area}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    )
  }

  return segments.join("\n\n")
}

function normalizeTerminalInput(message: string) {
  return message.trim().toLowerCase().replace(/\s+/g, " ")
}

function isNonActionableTerminalInput(message: string) {
  const normalized = normalizeTerminalInput(message)
  if (normalized.length === 0) return true

  return /^(hi|hello|hey|hey there|yo|sup|help|start|menu|commands|what can you do|how are you|who are you|ok|okay|thanks|thank you|مرحبا|اهلا|أهلا|مساعدة|ابدأ|اوامر|أوامر|شكرا|شكراً|\?+)$/.test(
    normalized,
  )
}

function buildTerminalCommandGuide(locale: string) {
  if (locale === "ar") {
    return [
      "ENTRESTATE Decision Terminal",
      "────────────────────────────────",
      "الوضع: بانتظار أمر",
      "الأوامر: SCREEN | PROJECT | AREA | COMPARE | RISK | MEMO | PULSE",
      "",
      "أمثلة:",
      "- PULSE",
      "- PROJECT Marina Vista",
      "- SCREEN مشاريع تحت AED 2M",
      "- AREA Jumeirah Village Circle",
      "- COMPARE Dubai Marina vs JBR",
      "- RISK Emaar Properties",
    ].join("\n")
  }

  return [
    "ENTRESTATE Decision Terminal",
    "────────────────────────────────",
    "Mode: Awaiting command",
    "Commands: SCREEN | PROJECT | AREA | COMPARE | RISK | MEMO | PULSE",
    "",
    "Examples:",
    "- PULSE",
    "- PROJECT Marina Vista",
    "- SCREEN projects under AED 2M",
    "- AREA Jumeirah Village Circle",
    "- COMPARE Dubai Marina vs JBR",
    "- RISK Emaar Properties",
  ].join("\n")
}

function extractProjectQuery(message: string) {
  const trimmed = message.trim()
  const explicitMatch = trimmed.match(/^project\s+(.+)$/i)
  if (explicitMatch?.[1]) return explicitMatch[1].trim()

  const analysisMatch = trimmed.match(/^(?:analyze|analyse|review|show)\s+(.+)$/i)
  if (analysisMatch?.[1] && !/(projects under|market pulse|compare|risk|area)/i.test(analysisMatch[1])) {
    return analysisMatch[1].trim()
  }

  return null
}

function buildProjectContent(row: Record<string, unknown>, locale: string) {
  const name = typeof row.project_name === "string" ? row.project_name : typeof row.name === "string" ? row.name : "Project"
  const area = pickLocalizedText(locale, row.area_ar, row.area, "UAE")
  const price = toFiniteNumber(row.price_from_aed)
  const yieldValue = toFiniteNumber(row.rental_yield)
  const stressGrade = typeof row.stress_grade_v1 === "string" ? row.stress_grade_v1 : "-"
  const stressScore = toFiniteNumber(row.stress_score)
  const timing = typeof row.timing_label === "string" ? row.timing_label : "-"
  const timingScore = toFiniteNumber(row.timing_score)
  const evidence = typeof row.evidence_label_v1 === "string" ? row.evidence_label_v1 : "-"
  const evidenceScore = toFiniteNumber(row.evidence_score)
  const investorScore = toFiniteNumber(row.investor_score_v1)
  const decision = typeof row.decision_label_v1 === "string" ? row.decision_label_v1 : "-"
  const developer = pickLocalizedText(locale, row.developer_ar, row.developer, "Developer")

  return [
    `${name} — ${area}`,
    "────────────────────────────",
    price === null ? null : `Price:     ${formatAed(price, locale)}`,
    yieldValue === null ? null : `Yield:     ${formatDecimal(yieldValue, locale, 2, 2)}%`,
    `Stress:    ${stressGrade} (${stressScore === null ? "-" : Math.round(stressScore)})`,
    `Timing:    ${timing} (${timingScore === null ? "-" : Math.round(timingScore)})`,
    `Evidence:  ${evidence} (${evidenceScore === null ? "-" : Math.round(evidenceScore)})`,
    `Score:     ${investorScore === null ? "-" : formatInteger(Math.round(investorScore), locale)}`,
    "",
    `Decision:  ${decision}`,
    `Developer: ${developer}`,
  ].filter(Boolean).join("\n")
}

function buildScreeningTable(rows: Record<string, unknown>[], locale: string) {
  const header = "| Project | Area | Price | Yield | Stress | Timing | Evidence | Score | Signal |"
  const divider = "|---|---|---:|---:|---|---|---|---:|---|"
  const body = rows.slice(0, 8).map((row) => {
    const name = typeof row.project_name === "string" ? row.project_name : typeof row.name === "string" ? row.name : "Project"
    const area = pickLocalizedText(locale, row.area_ar, row.area, "-")
    const price = toFiniteNumber(row.price_from_aed)
    const yieldValue = toFiniteNumber(row.rental_yield)
    const stress = typeof row.stress_grade_v1 === "string" ? row.stress_grade_v1 : "-"
    const timing = typeof row.timing_label === "string" ? row.timing_label : "-"
    const evidence = typeof row.evidence_label_v1 === "string" ? row.evidence_label_v1 : "-"
    const score = toFiniteNumber(row.investor_score_v1)
    const signal = typeof row.decision_label_v1 === "string" ? row.decision_label_v1 : "-"

    return `| ${name} | ${area} | ${price === null ? "-" : formatAed(price, locale)} | ${yieldValue === null ? "-" : `${formatDecimal(yieldValue, locale, 2, 2)}%`} | ${stress} | ${timing} | ${evidence} | ${score === null ? "-" : formatInteger(Math.round(score), locale)} | ${signal} |`
  })

  return [header, divider, ...body].join("\n")
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "true" || normalized === "1" || normalized === "yes"
  }
  return false
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => toRecord(entry)).filter((entry): entry is Record<string, unknown> => Boolean(entry))
}

function formatAed(value: number, locale: string) {
  return formatAedValue(value, locale)
}

function parseBudgetAed(message: string): number | null {
  const budgetMatch = message.match(/\b(?:under|below|max|budget)\s*(?:aed\s*)?([\d,.]+)\s*(k|m|mn|million)?\b/i)
  const generalMatch = message.match(/\baed\s*([\d,.]+)\s*(k|m|mn|million)?\b/i)
  const match = budgetMatch ?? generalMatch
  if (!match) return null
  const value = Number.parseFloat(match[1].replace(/,/g, ""))
  if (!Number.isFinite(value)) return null
  const unit = match[2]?.toLowerCase()
  if (unit === "k") return value * 1_000
  if (unit === "m" || unit === "mn" || unit === "million") return value * 1_000_000
  return value
}

function parseBedsFromMessage(message: string): number | null {
  const bedMatch = message.match(/\b(\d+)\s*(?:br|bed|beds|bedroom|bedrooms)\b/i)
  if (!bedMatch) return null
  const beds = Number.parseInt(bedMatch[1], 10)
  return Number.isFinite(beds) ? beds : null
}

function parseTimingSignal(message: string): "BUY" | "HOLD" | "WAIT" | undefined {
  const normalized = message.toLowerCase()
  if (normalized.includes("buy")) return "BUY"
  if (normalized.includes("hold")) return "HOLD"
  if (normalized.includes("wait")) return "WAIT"
  return undefined
}

function collectSources(toolResults: unknown[]): string[] {
  const sources = new Set<string>(["inventory_clean"])
  for (const result of toolResults) {
    const record = toRecord(result) as ToolResultEnvelope | null
    const source = typeof record?.source === "string" ? record.source.trim() : ""
    if (source.length > 0) {
      sources.add(source)
    }
  }
  return [...sources]
}

function collectToolWarnings(toolResults: unknown[]): string[] {
  const warnings = new Set<string>()

  for (const result of toolResults) {
    const record = toRecord(result) as ToolResultEnvelope | null
    if (!record) continue
    const list = Array.isArray(record.guardrail_warnings) ? record.guardrail_warnings : []
    for (const entry of list) {
      if (typeof entry === "string" && entry.trim().length > 0) {
        warnings.add(entry)
      }
    }
  }

  return [...warnings]
}

function resolveDataAsOf(toolResults: unknown[]): string {
  for (let index = toolResults.length - 1; index >= 0; index -= 1) {
    const record = toRecord(toolResults[index]) as ToolResultEnvelope | null
    if (!record) continue
    if (typeof record.data_as_of === "string" && record.data_as_of.trim().length > 0) {
      return record.data_as_of
    }
  }
  return new Date().toISOString()
}

function buildPulseContentFromToolResults(toolResults: unknown[], locale: string): string | null {
  for (let index = toolResults.length - 1; index >= 0; index -= 1) {
    const record = toRecord(toolResults[index]) as ToolResultEnvelope | null
    if (!record) continue

    const overview = toRecord(record.overview)
    if (!overview) continue

    const totalVolume = toFiniteNumber(overview.total_volume)
    const totalTransactions = toFiniteNumber(overview.total_transactions)
    const offplanCount = toFiniteNumber(overview.offplan_count)
    const readyCount = toFiniteNumber(overview.ready_count)
    const avgOffplan = toFiniteNumber(overview.avg_offplan)
    const avgReady = toFiniteNumber(overview.avg_ready)
    const velocityRows = toRows(record.top_areas_by_velocity).slice(0, 2)
    const velocitySummary = velocityRows
      .map((row) => {
        const area = pickLocalizedText(locale, row.area_ar, row.area, "Area")
        const velocity = toFiniteNumber(row.daily_velocity)
        return velocity === null ? area : `${area} ${formatDecimal(velocity, locale, 1, 1)}`
      })
      .join(" | ")

    return [
      "Dubai Market Pulse",
      "────────────────────────────────",
      totalVolume === null ? null : `Volume:        AED ${(totalVolume / 1_000_000_000).toFixed(2)}B YTD`,
      totalTransactions === null ? null : `Transactions:  ${formatInteger(Math.round(totalTransactions), locale)}`,
      velocitySummary ? `Daily Velocity: ${velocitySummary}` : null,
      offplanCount === null || avgOffplan === null ? null : `Off-Plan:      ${formatInteger(Math.round(offplanCount), locale)} (avg ${formatAed(avgOffplan, locale)})`,
      readyCount === null || avgReady === null ? null : `Ready:         ${formatInteger(Math.round(readyCount), locale)} (avg ${formatAed(avgReady, locale)})`,
    ].filter(Boolean).join("\n")
  }

  return null
}

function buildDataCardsFromRows(rows: Record<string, unknown>[], locale: string): ChatCard[] {
  if (rows.length === 0) {
    return [
      {
        type: "stat",
        title: "Matches",
        value: "0",
        subtitle: "No matching projects found",
      },
    ]
  }

  const prices = rows
    .map((row) => toFiniteNumber(row.price_from_aed ?? row.l1_canonical_price))
    .filter((value): value is number => value !== null && value > 0)

  const areaFrequency = new Map<string, number>()
  for (const row of rows) {
    const areaValue = typeof row.area_ar === "string" && row.area_ar.trim().length > 0 && locale === "ar"
      ? row.area_ar
      : typeof row.area === "string" && row.area.trim().length > 0
      ? row.area
      : typeof row.final_area === "string" && row.final_area.trim().length > 0
        ? row.final_area
        : typeof row.area === "string"
        ? row.area
        : ""
    const key = areaValue.trim()
    if (!key) continue
    areaFrequency.set(key, (areaFrequency.get(key) ?? 0) + 1)
  }

  const topArea = [...areaFrequency.entries()].sort((left, right) => right[1] - left[1])[0]?.[0]
  const avgPrice = prices.length > 0 ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null

  const cards: ChatCard[] = [
    {
      type: "stat",
      title: "Matches",
      value: formatInteger(rows.length, locale),
      subtitle: "From live inventory",
    },
  ]

  cards.push({
    type: "stat",
    title: "Average price",
    value: avgPrice === null ? "-" : formatAed(avgPrice, locale),
    subtitle: "From matching inventory",
  })

  if (topArea) {
    cards.push({
      type: "area",
      title: "Top area",
      value: topArea,
      subtitle: "Most frequent in results",
    })
  }

  return cards
}

function extractRowsFromToolResults(toolResults: unknown[]): Record<string, unknown>[] {
  for (let index = toolResults.length - 1; index >= 0; index -= 1) {
    const record = toRecord(toolResults[index]) as ToolResultEnvelope | null
    if (!record) continue
    const rows = toRows(record.rows)
    if (rows.length > 0) return rows
  }
  return []
}

function buildDldNotificationsFromToolResults(toolResults: unknown[]): DldNotification[] {
  const notifications: DldNotification[] = []

  for (let index = toolResults.length - 1; index >= 0; index -= 1) {
    const record = toRecord(toolResults[index]) as ToolResultEnvelope | null
    if (!record) continue

    const source = typeof record.source === "string" ? record.source : ""
    const rows = toRows(record.rows)
    if (rows.length === 0) continue

    const isDldFeedSource = source.includes("dld_transaction_feed")

    for (const row of rows) {
      const headline = typeof row.headline === "string" ? row.headline.trim() : ""
      const amount = toFiniteNumber(row.amount)

      if (!headline || amount === null) continue
      if (!isDldFeedSource && !("subline" in row || "badge" in row || "is_notable" in row)) continue

      notifications.push({
        headline,
        subline: typeof row.subline === "string" ? row.subline : "",
        amount,
        badge: typeof row.badge === "string" ? row.badge : null,
        reg_type: typeof row.reg_type === "string" ? row.reg_type : "Ready",
        prop_type: typeof row.prop_type === "string" ? row.prop_type : "Unit",
        is_notable: toBoolean(row.is_notable),
      })

      if (notifications.length >= 12) {
        return notifications
      }
    }
  }

  return notifications
}

function buildCompilerOutput(message: string) {
  const normalized = message.toLowerCase()
  const isComplexQuery =
    normalized.includes(" vs ") ||
    normalized.includes("compare") ||
    normalized.includes("built after") ||
    normalized.includes(" and ")

  const unitSignalRegex = /(high floor|seaview|sea view|\b1br\b|\b2br\b|\b3br\b|bedroom|bedrooms|floor)/i
  const signals = [
    {
      signal: unitSignalRegex.test(message) ? "unit_distribution_signal" : "decision_label_v1",
      confidence: "medium",
    },
  ]

  return {
    output_type: isComplexQuery ? "partial_spec" : "table_spec",
    table_spec: {
      signals,
    },
  }
}

function buildUsageHeaders(usage: {
  used: number
  limit: number | null
  remaining: number | null
  blocked?: boolean
  cooldownSecondsRemaining?: number | null
}) {
  return {
    "x-copilot-usage-used": String(usage.used),
    "x-copilot-usage-limit": usage.limit === null ? "unlimited" : String(usage.limit),
    "x-copilot-usage-remaining": usage.remaining === null ? "unlimited" : String(usage.remaining),
    "x-copilot-usage-blocked": String(Boolean(usage.blocked)),
    "x-copilot-cooldown-seconds": usage.cooldownSecondsRemaining === null || usage.cooldownSecondsRemaining === undefined
      ? "0"
      : String(usage.cooldownSecondsRemaining),
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timeout)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timeout)
        reject(error)
      })
  })
}

const PROVENANCE_TIMEOUT_MS = 500

async function resolveProvenanceFast() {
  try {
    return await Promise.race([
      getLatestNotebookProvenance(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), PROVENANCE_TIMEOUT_MS)),
    ])
  } catch {
    return null
  }
}

async function buildDeterministicFallback(message: string, locale: string, context?: { city?: string; area?: string }) {
  if (message.trim().toUpperCase().includes("PULSE")) {
    const pulse = await safeToolResult("dld_market_pulse", () => executeDldMarketPulse())
    if (!pulse) {
      return buildHardFallback(locale)
    }
    const pulseContent = buildPulseContentFromToolResults([pulse], locale)
    return {
      content: pulseContent ?? "Dubai Market Pulse is temporarily unavailable.",
      dataCards: undefined,
      evidence: {
        sources_used: ["dld_market_pulse"],
      },
      data_as_of: pulse.data_as_of,
    }
  }

  const projectQuery = extractProjectQuery(message)
  if (projectQuery) {
    const projectRows = await safeDbQuery<Record<string, unknown>>(Prisma.sql`
      SELECT
        id,
        name AS project_name,
        name,
        area,
        area_ar,
        developer,
        developer_ar,
        price_from_aed,
        rental_yield,
        timing_score,
        timing_label,
        stress_score,
        stress_grade_v1,
        evidence_score,
        evidence_label_v1,
        investor_score_v1,
        decision_label_v1,
        developer_reliability_score,
        supply_resilience_score,
        liquidity_resilience_score,
        pricing_discipline_score,
        handover_reliability_score,
        area_stability_score,
        payment_plan_score
      FROM ${getInventoryTableSql()}
      WHERE LOWER(name) LIKE LOWER('%' || ${projectQuery} || '%')
      ORDER BY
        CASE WHEN LOWER(name) = LOWER(${projectQuery}) THEN 0 ELSE 1 END,
        investor_score_v1 DESC NULLS LAST
      LIMIT 1
    `, "project_lookup")

    const project = projectRows[0]
    if (project) {
      return {
        content: buildProjectContent(project, locale),
        dataCards: buildDataCardsFromRows([project], locale),
        evidence: {
          sources_used: ["inventory_clean"],
        },
        data_as_of: new Date().toISOString(),
      }
    }
  }

  const budgetMax = parseBudgetAed(message)
  const beds = parseBedsFromMessage(message)
  const timingLabel = parseTimingSignal(message)

  const filters: DealScreenerInput["filters"] = {}
  if (context?.area) filters.area = context.area
  if (typeof budgetMax === "number") filters.budget_max_aed = budgetMax
  if (typeof beds === "number") {
    filters.beds_min = beds
    filters.beds_max = beds
  }
  if (timingLabel) filters.timing_label = timingLabel

  const result = await safeToolResult("deal_screener", () => executeDealScreener({
    filters,
    sort_by: "investor_score_v1",
    limit: 8,
  }))
  if (!result) {
    return buildHardFallback(locale)
  }

  const rows = toRows(result.rows)
  const cards = buildDataCardsFromRows(rows, locale)
  const content = rows.length > 0 ? buildScreeningTable(rows, locale) : "No matching projects found."

  return {
    content,
    dataCards: cards,
    evidence: {
      sources_used: ["deal_screener"],
    },
    data_as_of: result.data_as_of,
  }
}

async function buildSafeDeterministicFallback(message: string, locale: string, context?: { city?: string; area?: string }) {
  try {
    return await buildDeterministicFallback(message, locale, context)
  } catch (error) {
    console.error("Deterministic fallback failed:", { error })
    return buildHardFallback(locale)
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const provenance = await resolveProvenanceFast()
  const runId = provenance?.run_id ?? requestId

  try {
    const body = await request.json()
    const parsed = chatRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId, request_id: requestId }, { status: 400 })
    }

    const headerAccountKey = request.headers.get("x-entrestate-account-key")?.trim() || request.headers.get("x-entrestate-user-id")?.trim()
    const entitlement = await getCurrentEntitlement(headerAccountKey)
    const usageAccountKey = entitlement.accountKey || getAnonymousCopilotAccountKey(request)
    const { allowed, usage } = await safeConsumeCopilotUsage(usageAccountKey, entitlement.tier)

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Free usage is cooling down. Try again once your cooldown ends.",
          upgrade_cta: {
            label: "Upgrade for uninterrupted access",
            url: "/pricing",
          },
          tier: entitlement.tier,
          usage,
          requestId,
          request_id: requestId,
        },
        {
          status: 429,
          headers: {
            "x-request-id": requestId,
            ...buildUsageHeaders(usage),
          },
        },
      )
    }

    const model = resolveCopilotModel()

    const safeTool = <TInput,>(
      source: string,
      execute: (input: TInput) => Promise<Record<string, unknown>>,
    ) => async (input: TInput) => {
      try {
        return withGuardrails(await execute(input))
      } catch (error) {
        console.error("Chat tool failed:", { requestId, source, error })
        return withGuardrails({
          source,
          data_as_of: new Date().toISOString(),
          no_results: true,
          error: "tool_failed",
        })
      }
    }

    const safeToolNoGuard = <TInput,>(
      source: string,
      execute: (input: TInput) => Promise<Record<string, unknown>>,
    ) => async (input: TInput) => {
      try {
        return sanitizeForAi(await execute(input))
      } catch (error) {
        console.error("Chat tool failed:", { requestId, source, error })
        return {
          source,
          data_as_of: new Date().toISOString(),
          no_results: true,
          error: "tool_failed",
        }
      }
    }

    const toolset = {
      deal_screener: tool({
        description: copilotToolDescriptions.deal_screener,
        inputSchema: dealScreenerInputSchema,
        execute: safeTool("deal_screener", executeDealScreener),
      }),
      price_reality_check: tool({
        description: copilotToolDescriptions.price_reality_check,
        inputSchema: priceRealityCheckInputSchema,
        execute: safeTool("price_reality_check", executePriceRealityCheck),
      }),
      area_risk_brief: tool({
        description: copilotToolDescriptions.area_risk_brief,
        inputSchema: areaRiskBriefInputSchema,
        execute: safeTool("area_risk_brief", executeAreaRiskBrief),
      }),
      developer_due_diligence: tool({
        description: copilotToolDescriptions.developer_due_diligence,
        inputSchema: developerDueDiligenceInputSchema,
        execute: safeTool("developer_due_diligence", executeDeveloperDueDiligence),
      }),
      generate_investor_memo: tool({
        description: copilotToolDescriptions.generate_investor_memo,
        inputSchema: generateInvestorMemoInputSchema,
        execute: safeTool("generate_investor_memo", executeGenerateInvestorMemo),
      }),
      dld_transaction_search: tool({
        description: copilotToolDescriptions.dld_transaction_search,
        inputSchema: dldTransactionSearchInputSchema,
        execute: safeTool("dld_transaction_search", executeDldTransactionSearch),
      }),
      dld_area_benchmark: tool({
        description: copilotToolDescriptions.dld_area_benchmark,
        inputSchema: dldAreaBenchmarkInputSchema,
        execute: safeTool("dld_area_benchmark", executeDldAreaBenchmark),
      }),
      dld_market_pulse: tool({
        description: copilotToolDescriptions.dld_market_pulse,
        inputSchema: dldMarketPulseInputSchema,
        execute: safeTool("dld_market_pulse", async (_input: unknown) => executeDldMarketPulse()),
      }),
      dld_notable_deals: tool({
        description: copilotToolDescriptions.dld_notable_deals,
        inputSchema: dldNotableDealsInputSchema,
        execute: safeTool("dld_notable_deals", executeDldNotableDeals),
      }),
      mcp_query: tool({
        description:
          "Execute a read-only SQL query against the full Entrestate database. Use for custom analytics, cross-joins, aggregations. Only SELECT/WITH allowed, max 100 rows.",
        inputSchema: mcpQueryInputSchema,
        execute: safeTool("mcp_query", mcpQuery),
      }),
      mcp_describe_table: tool({
        description: "Inspect a table's schema: column names, types, row count. Use before querying unfamiliar tables.",
        inputSchema: mcpDescribeTableInputSchema,
        execute: safeToolNoGuard("mcp_describe_table", async (input: McpDescribeTableInput) =>
          mcpDescribeTable(input.table_name),
        ),
      }),
      mcp_cross_reference: tool({
        description:
          "Run pre-built cross-reference analytics: price_vs_dld, developer_portfolio, area_intelligence, golden_visa_opportunities, stress_test_report. Optionally filter by area name.",
        inputSchema: mcpCrossReferenceInputSchema,
        execute: safeTool("mcp_cross_reference", mcpCrossReference),
      }),
    } as const

    const message = parsed.data.message ?? parsed.data.intent ?? ""
    const locale = normalizeLocale(request.headers.get("x-entrestate-locale"))
    const prompt = buildUserPrompt(message, parsed.data.context)

    if (isNonActionableTerminalInput(message)) {
      return NextResponse.json(
        buildChatResponse({
          content: buildTerminalCommandGuide(locale),
          requestId,
          runId,
          provenance,
          sourcesUsed: ["terminal_command_guide"],
          extra: {
            suggestions: [
              locale === "ar" ? "PULSE" : "PULSE",
              "PROJECT Marina Vista",
              locale === "ar" ? "SCREEN مشاريع تحت AED 2M" : "SCREEN projects under AED 2M",
              "AREA Jumeirah Village Circle",
            ],
            compiler_output: buildCompilerOutput(message),
            usage,
          },
        }),
        {
          status: 200,
          headers: {
            "x-request-id": requestId,
            ...buildUsageHeaders(usage),
          },
        },
      )
    }

    if (!model) {
      const fallback = await buildSafeDeterministicFallback(message, locale, parsed.data.context)
      return NextResponse.json(
        buildChatResponse({
          content: fallback.content,
          requestId,
          runId,
          provenance,
          sourcesUsed: fallback.evidence?.sources_used ?? ["deterministic_fallback"],
          dataCards: fallback.dataCards,
          dataAsOf: fallback.data_as_of,
          extra: {
            warning: "Live model unavailable. Returned deterministic market response.",
            suggestions: getDefaultSuggestions(locale),
            compiler_output: buildCompilerOutput(message),
            usage,
          },
        }),
        {
          status: 200,
          headers: {
            "x-request-id": requestId,
            ...buildUsageHeaders(usage),
          },
        },
      )
    }

    try {
      const enterpriseConfig = await getEnterpriseConfig()

      const response = await withTimeout(
        generateText({
          model,
          system: getCopilotSystemPrompt(locale, {
            voice: enterpriseConfig.prompt.voice,
            constraints: enterpriseConfig.prompt.constraints,
            language: enterpriseConfig.prompt.language,
            brandName: enterpriseConfig.brand.brand_name,
            tone: enterpriseConfig.brand.tone,
          }),
          prompt,
          temperature: enterpriseConfig.prompt.temperature,
          maxSteps: 6,
          toolChoice: "auto",
          tools: toolset,
        } as any),
        chatModelTimeoutMs,
        "chat model",
      )

      const text = response.text.trim()
      const toolResults = ((response as { toolResults?: Array<{ result?: unknown }> }).toolResults ?? [])
        .map((entry) => entry.result)
        .filter((entry) => entry !== undefined)

      const rows = extractRowsFromToolResults(toolResults)
      const dataCards = rows.length > 0 ? buildDataCardsFromRows(rows, locale) : undefined
      const notifications = buildDldNotificationsFromToolResults(toolResults)
      const confidenceWarnings = collectToolWarnings(toolResults)
      const pulseContent = buildPulseContentFromToolResults(toolResults, locale)
      const toolSummary = toolResults.length > 0 ? JSON.stringify(toolResults[toolResults.length - 1]).slice(0, 1200) : ""
      const deterministic = text.length === 0 && rows.length === 0 && !pulseContent
        ? await buildDeterministicFallback(message, locale, parsed.data.context)
        : null
      const projectQuery = extractProjectQuery(message)
      const content = text.length > 0
        ? text
        : projectQuery && rows.length > 0
          ? buildProjectContent(rows[0], locale)
        : pulseContent && message.trim().toUpperCase().includes("PULSE")
          ? pulseContent
        : rows.length > 0
          ? buildScreeningTable(rows, locale)
        : deterministic?.content
          ? deterministic.content
        : toolSummary.length > 0
          ? `The data shows: ${toolSummary}`
          : "No matching projects found."

      const sourcesUsed = deterministic?.evidence?.sources_used ?? collectSources(toolResults)

      const responsePayload = buildChatResponse({
        content,
        requestId,
        runId,
        provenance,
        sourcesUsed,
        dataCards: dataCards ?? deterministic?.dataCards,
        dataAsOf: deterministic?.data_as_of ?? resolveDataAsOf(toolResults),
        warnings: confidenceWarnings,
        extra: {
          notifications: notifications.length > 0 ? notifications : undefined,
          suggestions: getDefaultSuggestions(locale),
          compiler_output: buildCompilerOutput(message),
          usage,
        },
      })

      return NextResponse.json(responsePayload, {
        status: 200,
        headers: {
          "x-request-id": requestId,
          ...buildUsageHeaders(usage),
        },
      })
    } catch (error) {
      console.error("Chat route LLM execution failed:", { requestId, error })
      const fallback = await buildSafeDeterministicFallback(message, locale, parsed.data.context)
      return NextResponse.json(
        buildChatResponse({
          content: fallback.content,
          requestId,
          runId,
          provenance,
          sourcesUsed: fallback.evidence?.sources_used ?? ["deterministic_fallback"],
          dataCards: fallback.dataCards,
          dataAsOf: fallback.data_as_of,
          extra: {
            warning: "Live model unavailable. Returned deterministic market response.",
            suggestions: getDefaultSuggestions(locale),
            compiler_output: buildCompilerOutput(message),
            usage,
          },
        }),
        {
          status: 200,
          headers: {
            "x-request-id": requestId,
            ...buildUsageHeaders(usage),
          },
        },
      )
    }
  } catch (error) {
    console.error("Chat route error:", { requestId, error })
    return NextResponse.json(
      {
        error: getPublicErrorMessage(error, "The assistant failed to process your request."),
        requestId,
        request_id: requestId,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
