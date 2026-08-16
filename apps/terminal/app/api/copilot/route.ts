import { NextResponse } from "next/server"
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { resolveCopilotModel } from "@/lib/ai-provider"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import {
  safeConsumeCopilotUsage,
  getAnonymousCopilotAccountKey,
} from "@/lib/copilot-usage"
import {
  executeAreaRiskBrief,
  executeCompareProjects,
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
  type CompareProjectsInput,
  type DealScreenerInput,
  type DeveloperDueDiligenceInput,
  type DldAreaBenchmarkInput,
  type DldNotableDealsInput,
  type DldTransactionSearchInput,
  type GenerateInvestorMemoInput,
  type PriceRealityCheckInput,
  areaRiskBriefInputSchema,
  compareProjectsInputSchema,
  dealScreenerInputSchema,
  developerDueDiligenceInputSchema,
  dldAreaBenchmarkInputSchema,
  dldMarketPulseInputSchema,
  dldNotableDealsInputSchema,
  dldTransactionSearchInputSchema,
  generateInvestorMemoInputSchema,
  priceRealityCheckInputSchema,
  getCopilotSystemPrompt,
  copilotToolDescriptions,
} from "@/lib/copilot/tools"
import { mcpCrossReference, mcpDescribeTable, mcpQuery } from "@/lib/mcp/server"
import {
  mcpCrossReferenceInputSchema,
  mcpDescribeTableInputSchema,
  mcpQueryInputSchema,
  type McpCrossReferenceInput,
  type McpDescribeTableInput,
  type McpQueryInput,
} from "@/lib/mcp/schemas"

import { loadChatSession, saveChatMessage } from "@/lib/copilot/persistence"
import { getUserProfile } from "@/lib/profile/queries"
import { normalizeLocale } from "@/i18n/locale"
import { getEnterpriseConfig } from "@/lib/enterprise-config"
import { getLatestNotebookProvenance } from "@/lib/notebook-provenance"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
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

function normalizeIncomingMessages(messages: UIMessage[]) {
  return messages.map((message, index) => {
    const msg = message as UIMessage & { content?: unknown; parts?: unknown[] }
    if (Array.isArray(msg.parts) && msg.parts.length > 0) {
      return msg
    }

    const textContent = typeof msg.content === "string" ? msg.content : ""
    return {
      ...msg,
      id: msg.id || `msg-${index}`,
      parts: [{ type: "text", text: textContent }],
    }
  })
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

function withGuardrails<T extends Record<string, unknown>>(output: T): T & { guardrail_warnings: string[] } {
  const sanitized = sanitizeForAi(output)
  const warnings = collectGuardrailWarnings(sanitized)
  return {
    ...sanitized,
    guardrail_warnings: warnings,
  }
}

function normalizeTerminalInput(message: string) {
  return message.trim().toLowerCase().replace(/\s+/g, " ")
}

function extractLatestUserText(messages: UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role !== "user") continue

    for (const part of message.parts ?? []) {
      if (part.type === "text" && typeof part.text === "string" && part.text.trim().length > 0) {
        return part.text.trim()
      }
    }
  }

  return ""
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

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const locale = normalizeLocale(request.headers.get("x-entrestate-locale"))
  const provenance = await resolveProvenanceFast()
  const runId = provenance?.run_id ?? requestId

  const messageMetadata = () => ({
    requestId,
    request_id: requestId,
    run_id: runId,
    provenance: {
      run_id: runId,
      snapshot_ts: provenance?.snapshot_ts ?? null,
      sources_used: provenance?.sources_used ?? ["copilot_tool_stream"],
    },
  })

  try {
    let body: { messages?: UIMessage[]; id?: string }
    try {
      body = (await request.json()) as { messages?: UIMessage[]; id?: string }
    } catch {
      return NextResponse.json({ error: "Invalid request payload", requestId }, { status: 400 })
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Invalid request payload", requestId }, { status: 400 })
    }

    const headerAccountKey = request.headers.get("x-entrestate-account-key")?.trim() || request.headers.get("x-entrestate-user-id")?.trim()
    let entitlement = {
      accountKey: null,
      tier: "free",
      source: "default",
      subscriptionId: null,
      status: null,
    }
    try {
      entitlement = await getCurrentEntitlement(headerAccountKey)
    } catch (error) {
      console.error("Copilot entitlement lookup failed; using free tier fallback.", { requestId, error })
    }
    const usageAccountKey = entitlement.accountKey || getAnonymousCopilotAccountKey(request)
    let allowed = true
    let usage = {
      accountKey: usageAccountKey,
      date: new Date().toISOString().slice(0, 10),
      used: 0,
      limit: null,
      remaining: null,
      blocked: false,
      resetAt: null,
      cooldownUntil: null,
      cooldownSecondsRemaining: null,
    }

    try {
      const usageResult = await safeConsumeCopilotUsage(usageAccountKey, entitlement.tier)
      allowed = usageResult.allowed
      usage = usageResult.usage
    } catch (error) {
      console.error("Copilot usage tracking failed; allowing request with fallback usage.", {
        requestId,
        error,
      })
      if (!entitlement?.accountKey) {
        entitlement = {
          accountKey: null,
          tier: "free",
          source: "default",
          subscriptionId: null,
          status: null,
        }
      }
    }

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
        },
        {
          status: 429,
          headers: {
            "x-request-id": requestId,
            "x-copilot-usage-used": String(usage.used),
            "x-copilot-usage-limit": usage.limit === null ? "unlimited" : String(usage.limit),
            "x-copilot-usage-remaining": usage.remaining === null ? "unlimited" : String(usage.remaining),
            "x-copilot-usage-blocked": String(usage.blocked),
            "x-copilot-cooldown-seconds": usage.cooldownSecondsRemaining === null ? "0" : String(usage.cooldownSecondsRemaining),
          },
        },
      )
    }

    const sessionId = body.id || null
    const userId = entitlement.accountKey

    // Persist the incoming user message if we have a userId
    if (userId) {
      const lastMessage = body.messages[body.messages.length - 1]
      if (lastMessage.role === "user") {
        try {
          await saveChatMessage(userId, sessionId, {
            role: "user",
            content: typeof lastMessage.content === "string" ? lastMessage.content : "",
          })
        } catch (error) {
          console.error("Copilot persistence failed; skipping user message save.", { requestId, error })
        }
      }
    }

    const safeTool = <TInput,>(
      source: string,
      execute: (input: TInput) => Promise<Record<string, unknown>>,
    ) => async (input: TInput) => {
      try {
        return withGuardrails(await execute(input))
      } catch (error) {
        console.error("Copilot tool failed:", { requestId, source, error })
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
        console.error("Copilot tool failed:", { requestId, source, error })
        return {
          source,
          data_as_of: new Date().toISOString(),
          no_results: true,
          error: "tool_failed",
        }
      }
    }

    const toolset: Record<string, any> = {
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
      compare_projects: tool({
        description: copilotToolDescriptions.compare_projects,
        inputSchema: compareProjectsInputSchema,
        execute: safeTool("compare_projects", executeCompareProjects),
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
    }

    const normalizedMessages = normalizeIncomingMessages(body.messages)
    const latestUserText = extractLatestUserText(normalizedMessages)

    if (isNonActionableTerminalInput(latestUserText)) {
      const stream = createUIMessageStream({
        originalMessages: normalizedMessages,
        execute: ({ writer }) => {
          writer.write({ type: "start" })
          writer.write({ type: "message-metadata", messageMetadata: messageMetadata() })
          writer.write({ type: "start-step" })
          writer.write({ type: "text-start", id: "text-1" })
          writer.write({
            type: "text-delta",
            id: "text-1",
            delta: buildTerminalCommandGuide(locale),
          })
          writer.write({ type: "text-end", id: "text-1" })
          writer.write({ type: "finish-step" })
          writer.write({ type: "finish", finishReason: "stop" })
        },
      })

      return createUIMessageStreamResponse({
        stream,
        headers: {
          "x-request-id": requestId,
          "x-entrestate-tier": entitlement.tier,
          "x-copilot-usage-used": String(usage.used),
          "x-copilot-usage-limit": usage.limit === null ? "unlimited" : String(usage.limit),
          "x-copilot-usage-remaining": usage.remaining === null ? "unlimited" : String(usage.remaining),
          "x-copilot-usage-blocked": String(usage.blocked),
          "x-copilot-cooldown-seconds": usage.cooldownSecondsRemaining === null ? "0" : String(usage.cooldownSecondsRemaining),
        },
      })
    }

    const model = resolveCopilotModel()
    if (!model) {
      const stream = createUIMessageStream({
        originalMessages: normalizedMessages,
        execute: ({ writer }) => {
          writer.write({ type: "start" })
          writer.write({ type: "message-metadata", messageMetadata: messageMetadata() })
          writer.write({ type: "start-step" })
          writer.write({ type: "text-start", id: "text-1" })
          writer.write({
            type: "text-delta",
            id: "text-1",
            delta:
              "Live reasoning is briefly offline — the analyst still answers from the dataset, with sources, but without streamed commentary. Full answers return shortly.",
          })
          writer.write({ type: "text-end", id: "text-1" })
          writer.write({ type: "finish-step" })
          writer.write({ type: "finish", finishReason: "stop" })
        },
      })

      return createUIMessageStreamResponse({
        stream,
        headers: {
          "x-request-id": requestId,
          "x-entrestate-tier": entitlement.tier,
          "x-copilot-usage-used": String(usage.used),
          "x-copilot-usage-limit": usage.limit === null ? "unlimited" : String(usage.limit),
          "x-copilot-usage-remaining": usage.remaining === null ? "unlimited" : String(usage.remaining),
          "x-copilot-usage-blocked": String(usage.blocked),
          "x-copilot-cooldown-seconds": usage.cooldownSecondsRemaining === null ? "0" : String(usage.cooldownSecondsRemaining),
        },
      })
    }

    // Load user profile for personalized system context
    let profileContext = "No profile data available — ask the user about their preferences."
    if (userId) {
      try {
        const profile = await getUserProfile(userId)
        if (profile) {
          const riskLabel = profile.riskBias >= 0.8 ? "aggressive" : profile.riskBias >= 0.6 ? "balanced" : "conservative"
          const yieldLabel = profile.yieldVsSafety >= 0.7 ? "yield-focused" : profile.yieldVsSafety <= 0.3 ? "safety-focused" : "balanced"
          const parts: string[] = [
            `Risk appetite: ${riskLabel} (${Math.round(profile.riskBias * 100)}%)`,
            `Investment style: ${yieldLabel} (yield vs safety: ${Math.round(profile.yieldVsSafety * 100)}%)`,
          ]
          if (profile.horizon) parts.push(`Horizon: ${profile.horizon}`)
          if (profile.preferredMarkets?.length) parts.push(`Preferred markets: ${profile.preferredMarkets.join(", ")}`)
          const comp = profile.inferredSignals?.comprehensiveProfile
          if (comp?.branding?.companyName) parts.push(`Company: ${comp.branding.companyName}`)
          if (comp?.preferredClientTypes?.length) parts.push(`Client types: ${comp.preferredClientTypes.join(", ")}`)
          profileContext = parts.join("\n")
        }
      } catch {
        // Non-blocking — use default context
      }
    }

    const enterpriseConfig = await getEnterpriseConfig()

    const systemPrompt = getCopilotSystemPrompt(locale, {
      voice: enterpriseConfig.prompt.voice,
      constraints: enterpriseConfig.prompt.constraints,
      language: enterpriseConfig.prompt.language,
      brandName: enterpriseConfig.brand.brand_name,
      tone: enterpriseConfig.brand.tone,
    }).replace("{USER_PROFILE_CONTEXT}", profileContext)

    const result = streamText({
      model,
      system: systemPrompt,
      messages: await convertToModelMessages(normalizedMessages, { tools: toolset }),
      temperature: enterpriseConfig.prompt.temperature,
      stopWhen: stepCountIs(6),
      toolChoice: "required",
      tools: toolset,
      onFinish: async ({ text, toolCalls }) => {
        if (userId && (text || (toolCalls && toolCalls.length > 0))) {
          try {
            await saveChatMessage(userId, sessionId, {
              role: "assistant",
              content: text || "",
              toolCalls: toolCalls,
            })
          } catch (error) {
            console.error("Copilot persistence failed; skipping assistant message save.", { requestId, error })
          }
        }
      },
    })
    return result.toUIMessageStreamResponse({
      originalMessages: normalizedMessages,
      messageMetadata,
      headers: {
        "x-request-id": requestId,
        "x-entrestate-tier": entitlement.tier,
        "x-copilot-usage-used": String(usage.used),
        "x-copilot-usage-limit": usage.limit === null ? "unlimited" : String(usage.limit),
        "x-copilot-usage-remaining": usage.remaining === null ? "unlimited" : String(usage.remaining),
        "x-copilot-usage-blocked": String(usage.blocked),
        "x-copilot-cooldown-seconds": usage.cooldownSecondsRemaining === null ? "0" : String(usage.cooldownSecondsRemaining),
      },
    })
  } catch (error) {
    console.error("Copilot route error:", { requestId, error })
    return NextResponse.json(
      {
        error: getPublicErrorMessage(error, "Copilot failed to process this request."),
        requestId,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/copilot",
    mode: "streaming-tool-calling",
  })
}
