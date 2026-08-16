"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useCopilot } from "@/components/copilot-provider"
import { motion, AnimatePresence } from "framer-motion"
import { MarqueePrompts } from "@/components/marketing/marquee-prompts"
import { authClient } from "@/lib/auth/client"
import {
  BarChart3,
  Bell,
  BookmarkPlus,
  Building2,
  CheckCircle2,
  FileText,
  Gauge,
  Layers,
  Loader2,
  Radar,
  Scale,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  WandSparkles,
  Activity,
  ArrowRight,
  Command,
  Globe,
  Paperclip,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EvidenceDrawer } from "@/components/decision/evidence-drawer"
import {
  DEFAULT_COMPREHENSIVE_PROFILE,
  getComprehensiveProfileFromSignals,
} from "@/lib/profile/comprehensive"
import { generateMediaRichReport } from "@/lib/artifacts/media-report"
import { TransactionNotification } from "@/components/dld/transaction-notification"
import type {
  ComprehensiveProfile,
  ComprehensiveProfileMemoryEntry,
  ComprehensiveProfileReportAudience,
  ComprehensiveProfileReportTemplate,
} from "@/lib/profile/types"
import { formatAed as formatAedValue } from "@/lib/format/currency"
import { localizeAnalyticsLabel } from "@/lib/format/analytics-labels"
import { formatDecimal } from "@/lib/format/number"
import { pickLocalizedText } from "@/lib/format/entities"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type ChatInterfaceProps = {
  initialGoldenPath?: GoldenPathId
  initialLimit?: number | null
  initialRemaining?: number | null
  initialBlocked?: boolean
  initialCooldownSecondsRemaining?: number | null
}

type WorkspaceCard = {
  title: string
  value: string
  subtitle: string
}

export type GoldenPathId = "underwrite_development_site" | "compare_area_yields" | "draft_spa_contract"

type GoldenPathPreview = {
  metadata?: {
    id?: string
    hash?: string
    rowCount?: number
    spec?: {
      intent?: string
      signals?: string[]
      row_grain?: string
    }
  }
  rows?: Record<string, unknown>[]
  requestId?: string
}

type ComparisonRow = {
  kind: "project" | "area"
  label: string
  area: string
  developer: string
  confidence: string
  timingSignal: string
  stressGrade: string
  stressScore: number | null
  price: number | null
  yield: number | null
  score: number | null
  projectsCount: number | null
  buySignals: number | null
  safeProjects: number | null
  developerReliabilityScore: number | null
  supplyResilienceScore: number | null
  liquidityResilienceScore: number | null
  pricingDisciplineScore: number | null
  handoverReliabilityScore: number | null
  areaStabilityScore: number | null
  paymentPlanScore: number | null
}

type DldNotificationRow = {
  headline: string
  subline: string
  amount: number
  badge: string | null
  reg_type: string
  prop_type: string
  is_notable: boolean
}

type ReportDraftResult = {
  status: "idle" | "saving" | "saved" | "error"
  message?: string
  reportId?: string
  enabledExports?: string[]
}

type ShortlistResult = {
  status: "idle" | "saving" | "saved" | "error"
  message?: string
}

type SlashCommandContext = {
  selectedRow: ComparisonRow | null
}

type SlashCommand = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  buildPrompt: (context: SlashCommandContext) => string
}

function ChatMarkdown({ text }: { text: string }) {
  const lines = text.split("\n")
  const nodes: React.ReactNode[] = []
  let i = 0

  const inlineFormat = (s: string): React.ReactNode => {
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={idx}>{part.slice(2, -2)}</strong>
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={idx}>{part.slice(1, -1)}</em>
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={idx} className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">{part.slice(1, -1)}</code>
      return part
    })
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("### ")) {
      nodes.push(<p key={i} className="mt-3 mb-1 text-xs font-semibold text-foreground/80 uppercase tracking-wide">{inlineFormat(line.slice(4))}</p>)
    } else if (line.startsWith("## ")) {
      nodes.push(<p key={i} className="mt-4 mb-1.5 text-sm font-bold text-foreground border-b border-border/40 pb-1">{inlineFormat(line.slice(3))}</p>)
    } else if (line.startsWith("# ")) {
      nodes.push(<p key={i} className="mt-4 mb-1.5 text-base font-bold text-foreground">{inlineFormat(line.slice(2))}</p>)
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: React.ReactNode[] = []
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(<li key={i} className="leading-relaxed">{inlineFormat(lines[i].slice(2))}</li>)
        i++
      }
      nodes.push(<ul key={`ul-${i}`} className="my-2 ml-4 list-disc space-y-0.5 text-sm">{items}</ul>)
      continue
    } else if (/^\d+\. /.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i} className="leading-relaxed">{inlineFormat(lines[i].replace(/^\d+\. /, ""))}</li>)
        i++
      }
      nodes.push(<ol key={`ol-${i}`} className="my-2 ml-4 list-decimal space-y-0.5 text-sm">{items}</ol>)
      continue
    } else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-2" />)
    } else {
      nodes.push(<p key={i} className="leading-relaxed text-sm">{inlineFormat(line)}</p>)
    }
    i++
  }

  return <div className="space-y-0.5">{nodes}</div>
}

function messageText(message: any): string {
  if (typeof message.content === "string") return message.content
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === "text" && typeof part.text === "string")
      .map((part: any) => part.text)
      .join("\n")
      .trim()
  }
  return ""
}

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
}

function looksLikeStructuredPayloadText(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return false

  if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && /"rows"|"source"|"data_as_of"|"memo"|"project_context"/.test(trimmed)) {
    return true
  }

  try {
    const parsed = JSON.parse(trimmed)
    return Array.isArray(parsed) || Boolean(parsed && typeof parsed === "object")
  } catch {
    return false
  }
}

function displayMessageText(message: any): string {
  const text = messageText(message)
  if (message?.role === "assistant") {
    const cleaned = stripThinkTags(text)
    if (cleaned.toLowerCase().includes("tool result is missing for tool call")) {
      return "Data retrieval failed. Please retry your request."
    }
    if (looksLikeStructuredPayloadText(cleaned)) {
      return ""
    }
    return cleaned
  }
  return text
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => toRecord(entry)).filter((entry): entry is Record<string, unknown> => Boolean(entry))
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

function toText(value: unknown, fallback = "-") {
  if (typeof value === "string" && value.trim().length > 0) return value.trim()
  return fallback
}

function formatAed(value: number | null, locale: string) {
  if (value === null) return "-"
  return formatAedValue(value, locale, { fallback: "-" })
}

function formatMetric(value: number | null, locale: string, decimals = 1) {
  if (value === null) return "-"
  return formatDecimal(value, locale, decimals, decimals, "-")
}

function formatWholeNumber(value: number | null, locale: string) {
  if (value === null) return "-"
  return formatDecimal(value, locale, 0, 0, "-")
}

function formatPercent(value: number | null, locale: string, decimals = 1) {
  if (value === null) return "-"
  return `${formatMetric(value, locale, decimals)}%`
}

function formatDateLabel(value: unknown, locale: string) {
  if (typeof value !== "string" || value.trim().length === 0) return "-"

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-US", {
    month: "short",
    year: "numeric",
  }).format(parsed)
}

function average(values: Array<number | null>) {
  const filtered = values.filter((value): value is number => value !== null)
  if (filtered.length === 0) return null
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length
}

function weightedAverage(pairs: Array<{ value: number | null; weight: number | null }>) {
  const filtered = pairs.filter(
    (pair): pair is { value: number; weight: number } =>
      pair.value !== null && pair.weight !== null && pair.weight > 0,
  )
  if (filtered.length === 0) return null

  const totals = filtered.reduce(
    (acc, pair) => {
      acc.weighted += pair.value * pair.weight
      acc.weight += pair.weight
      return acc
    },
    { weighted: 0, weight: 0 },
  )

  if (totals.weight <= 0) return null
  return totals.weighted / totals.weight
}

function sumValues(values: Array<number | null>) {
  const filtered = values.filter((value): value is number => value !== null)
  if (filtered.length === 0) return null
  return filtered.reduce((sum, value) => sum + value, 0)
}

function toDisplayLabel(value: unknown, fallback = "-") {
  const text = typeof value === "string" ? value.trim() : ""
  if (!text) return fallback

  return text
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function localizeMetricText(value: unknown, locale: string, fallback = "-") {
  return localizeAnalyticsLabel(typeof value === "string" ? value : "", locale, fallback)
}

function chatUiCopy(locale: AppLocale) {
  if (locale === "ar") {
    return {
      buySignals: "إشارات الشراء",
      safeProjects: "المشاريع الآمنة",
      projectsScreened: "المشاريع المفحوصة",
      averageEntry: "متوسط الدخول",
      averageYield: "متوسط العائد",
      avgInvestorScore: "متوسط نقاط المستثمر",
      stressScore: "نقاط الضغط",
      stressGrade: "درجة الضغط",
      timingLabel: "تصنيف التوقيت",
      investorScore: "نقاط المستثمر",
      developerReliability: "موثوقية المطور",
      supplyResilience: "مرونة المعروض",
      liquidityResilience: "مرونة السيولة",
      pricingDiscipline: "انضباط التسعير",
      handoverReliability: "موثوقية التسليم",
      areaStability: "ثبات المنطقة",
      paymentPlan: "خطة الدفع",
      yield: "العائد",
      score: "النتيجة",
      screeningSuggestion: "فرز مشاريع إعمار مقابل داماك: من الأقل خطراً في التسليم؟",
      methodologySuggestion: "ماذا تعني إشارة الشراء وكيف تُحسب داخل المنصة؟",
      memoSuggestion: (label: string) => `أنشئ مذكرة استثمار كاملة لـ ${label} تشمل السعر والمخاطر وسجل المطور والحكم النهائي.`,
      compareSuggestion: (label: string, area: string) => `كيف يقارن ${label} مع البدائل الأعلى في ${area} من حيث العائد ودرجة المخاطر؟`,
      stressSuggestion: (label: string) => `اعرض ملف الضغط الحقيقي لـ ${label} شاملاً درجات المرونة الفرعية.`,
      outlookSuggestion: (label: string) => `ما أهم المخاطر الاستثمارية في ${label} وما الذي قد يغيّر النظرة الحالية؟`,
      riskBriefPrompt: (label: string) => `اعرض موجز مخاطر المنطقة لـ ${label}. أعد projects وavg_price وavg_yield وavg_score وbuy_signals وsafe_projects، ثم أخبرني هل هذا السوق أقوى من البدائل المجاورة ولماذا.`,
      projectStressPrompt: (label: string) => `اعرض ملف الضغط V1 الحقيقي لـ ${label}. أعد stress_score وstress_grade_v1 وtiming_label وinvestor_score_v1 وdecision_label_v1 وdeveloper_reliability_score وsupply_resilience_score وliquidity_resilience_score وpricing_discipline_score وhandover_reliability_score وarea_stability_score وpayment_plan_score.`,
    }
  }

  return {
    buySignals: "BUY signals",
    safeProjects: "Safe projects",
    projectsScreened: "Projects screened",
    averageEntry: "Average entry",
    averageYield: "Average yield",
    avgInvestorScore: "Avg investor score",
    stressScore: "Stress score",
    stressGrade: "Stress grade",
    timingLabel: "Timing label",
    investorScore: "Investor score",
    developerReliability: "Developer reliability",
    supplyResilience: "Supply resilience",
    liquidityResilience: "Liquidity resilience",
    pricingDiscipline: "Pricing discipline",
    handoverReliability: "Handover reliability",
    areaStability: "Area stability",
    paymentPlan: "Payment plan",
    yield: "Yield",
    score: "Score",
    screeningSuggestion: "Compare Emaar vs Damac reliability - which developer carries lower delivery risk?",
    methodologySuggestion: "What does a BUY signal mean and how is it calculated in this platform?",
    memoSuggestion: (label: string) => `Generate a full investor memo for ${label} - pricing, risk, developer track record, and verdict.`,
    compareSuggestion: (label: string, area: string) => `How does ${label} compare to top alternatives in ${area} on yield and risk grade?`,
    stressSuggestion: (label: string) => `Show the real V1 stress profile for ${label}, including all resilience sub-scores.`,
    outlookSuggestion: (label: string) => `What are the key investment risks for ${label} and what would change the outlook?`,
    riskBriefPrompt: (label: string) => `Run an area risk brief for ${label}. Return projects, avg_price, avg_yield, avg_score, buy_signals, safe_projects, and tell me whether this market screens stronger than nearby alternatives.`,
    projectStressPrompt: (label: string) => `Show the real V1 stress profile for ${label}. Return stress_score, stress_grade_v1, timing_label, investor_score_v1, decision_label_v1, developer_reliability_score, supply_resilience_score, liquidity_resilience_score, pricing_discipline_score, handover_reliability_score, area_stability_score, and payment_plan_score.`,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function inferReportAudience(
  transcript: string,
  memoryEntry: ComprehensiveProfileMemoryEntry | null,
): ComprehensiveProfileReportAudience {
  const text = `${transcript} ${memoryEntry?.contextNotes ?? ""} ${(memoryEntry?.tags ?? []).join(" ")}`.toLowerCase()

  if (["instagram", "linkedin", "social", "post", "campaign", "audience growth"].some((token) => text.includes(token))) {
    return "social"
  }
  if (["board", "executive", "c-suite", "management summary", "ceo"].some((token) => text.includes(token))) {
    return "executive"
  }
  if (["investor", "fund", "irr", "cap rate", "dscr", "returns", "portfolio"].some((token) => text.includes(token))) {
    return "investor"
  }

  return "client"
}

function formatReportAudienceLabel(audience: ComprehensiveProfileReportAudience): string {
  if (audience === "social") return "Social"
  if (audience === "investor") return "Investor"
  if (audience === "executive") return "Executive"
  return "Client"
}

function findBestMemoryEntry(
  transcript: string,
  memoryEntries: ComprehensiveProfileMemoryEntry[],
): ComprehensiveProfileMemoryEntry | null {
  if (memoryEntries.length === 0) {
    return null
  }

  const text = transcript.toLowerCase()

  const byName = memoryEntries.find((entry) => text.includes(entry.clientName.toLowerCase()))
  if (byName) {
    return byName
  }

  const byTag = memoryEntries.find((entry) =>
    entry.tags.some((tag) => tag && text.includes(tag.toLowerCase())),
  )

  return byTag ?? null
}

function findBestReportTemplate(
  templates: ComprehensiveProfileReportTemplate[],
  audience: ComprehensiveProfileReportAudience,
  memoryEntry: ComprehensiveProfileMemoryEntry | null,
): ComprehensiveProfileReportTemplate | null {
  if (templates.length === 0) {
    return null
  }

  const audienceTemplates = templates.filter((template) => template.audience === audience)
  const searchableTemplates = audienceTemplates.length > 0 ? audienceTemplates : templates

  if (memoryEntry) {
    const clientName = memoryEntry.clientName.toLowerCase()
    const matchedByClient = searchableTemplates.find((template) => {
      const haystack = `${template.name} ${template.outline}`.toLowerCase()
      return haystack.includes(clientName)
    })
    if (matchedByClient) {
      return matchedByClient
    }

    const matchedByTag = searchableTemplates.find((template) => {
      const haystack = `${template.name} ${template.outline}`.toLowerCase()
      return memoryEntry.tags.some((tag) => haystack.includes(tag.toLowerCase()))
    })
    if (matchedByTag) {
      return matchedByTag
    }
  }

  return searchableTemplates[0] ?? null
}

function resolvePreferredExportFormat(enabledExports: string[] | undefined): "pdf" | "json" | "branded" {
  if (!enabledExports || enabledExports.length === 0) {
    return "pdf"
  }
  if (enabledExports.includes("pdf")) {
    return "pdf"
  }
  if (enabledExports.includes("json")) {
    return "json"
  }
  if (enabledExports.includes("brandedFiles")) {
    return "branded"
  }
  return "pdf"
}

function normalizeToPercent(value: number | null, max: number) {
  if (value === null || max <= 0) return 0
  return clamp((value / max) * 100, 8, 100)
}

function buildSparklinePath(values: number[], width = 220, height = 64) {
  if (values.length === 0) return ""
  if (values.length === 1) {
    const y = height / 2
    return `M0 ${y} L${width} ${y}`
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")
}

function buildAreaPath(linePath: string, width = 220, height = 64) {
  if (!linePath) return ""
  return `${linePath} L${width} ${height} L0 ${height} Z`
}

function extractToolOutputs(messages: any[]): Record<string, unknown>[] {
  const outputs: Record<string, unknown>[] = []

  for (const message of messages) {
    if (Array.isArray(message.toolInvocations)) {
      for (const invocation of message.toolInvocations) {
        const result = toRecord(invocation?.result ?? invocation?.output)
        if (result) outputs.push(result)
      }
    }

    if (!Array.isArray(message.parts)) continue
    for (const part of message.parts) {
      if (part?.type === "dynamic-tool" && (part.output || part.result)) {
        const output = toRecord(part.output ?? part.result)
        if (output) outputs.push(output)
      }
      if (typeof part?.type === "string" && part.type.startsWith("tool-") && (part.output || part.result)) {
        const output = toRecord(part.output ?? part.result)
        if (output) outputs.push(output)
      }
    }
  }

  return outputs
}

function extractMessageToolOutputs(message: any): Record<string, unknown>[] {
  const outputs: Record<string, unknown>[] = []

  if (Array.isArray(message?.toolInvocations)) {
    for (const invocation of message.toolInvocations) {
      const result = toRecord(invocation?.result ?? invocation?.output)
      if (result) outputs.push(result)
    }
  }

  if (Array.isArray(message?.parts)) {
    for (const part of message.parts) {
      if (part?.type === "dynamic-tool" && (part.output || part.result)) {
        const output = toRecord(part.output ?? part.result)
        if (output) outputs.push(output)
      }
      if (typeof part?.type === "string" && part.type.startsWith("tool-") && (part.output || part.result)) {
        const output = toRecord(part.output ?? part.result)
        if (output) outputs.push(output)
      }
    }
  }

  return outputs
}

function extractRowsFromOutput(output: Record<string, unknown>): Record<string, unknown>[] {
  const directRows = [
    ...toRows(output.rows),
    ...toRows(output.items),
    ...toRows(output.results),
    ...toRows(output.records),
    ...toRows(output.list),
  ]

  const directRecords = [
    toRecord(output.project),
    toRecord(output.record),
    toRecord(output.overview),
    toRecord(output.market_overview),
    toRecord(output.project_context),
  ].filter((entry): entry is Record<string, unknown> => Boolean(entry))

  const memo = toRecord(output.memo)
  const memoSections = toRecord(memo?.sections)
  const sectionRows = memoSections
    ? Object.values(memoSections).flatMap((section) => {
        const sectionRecord = toRecord(section)
        if (!sectionRecord) return []
        return [
          ...toRows(sectionRecord.rows),
          ...toRows(sectionRecord.items),
          ...toRows(sectionRecord.results),
          ...(toRecord(sectionRecord.project) ? [sectionRecord.project as Record<string, unknown>] : []),
          ...(toRecord(sectionRecord.project_context) ? [sectionRecord.project_context as Record<string, unknown>] : []),
        ]
      })
    : []

  return [...directRows, ...directRecords, ...sectionRows].filter(
    (entry) => Object.keys(entry).length > 0,
  )
}

function extractStructuredRows(outputs: Record<string, unknown>[]) {
  return outputs.flatMap((output) => extractRowsFromOutput(output))
}

function isAnalyticRecord(row: Record<string, unknown>) {
  return [
    row.name,
    row.project_name,
    row.project,
    row.area,
    row.final_area,
    row.developer,
    row.projects,
    row.avg_price,
    row.avg_yield,
    row.price_from_aed,
    row.l1_canonical_price,
    row.investor_score_v1,
    row.avg_score,
    row.engine_god_metric,
    row.stress_score,
    row.stress_grade_v1,
    row.decision_label_v1,
    row.timing_label,
  ].some((value) => value !== null && value !== undefined && value !== "")
}

function extractNarrativeStrings(outputs: Record<string, unknown>[]) {
  const snippets: string[] = []

  const pushString = (value: unknown) => {
    if (typeof value !== "string") return
    const trimmed = value.trim()
    if (!trimmed || looksLikeStructuredPayloadText(trimmed)) return
    snippets.push(trimmed)
  }

  for (const output of outputs) {
    pushString(output.content)
    pushString(output.overview)
    pushString(output.narrative)

    const memo = toRecord(output.memo)
    if (memo) {
      const memoNarrative = toRecord(memo.narrative)
      if (memoNarrative) {
        Object.values(memoNarrative).forEach(pushString)
      }

      const memoSections = toRecord(memo.sections)
      if (memoSections) {
        Object.values(memoSections).forEach((section) => {
          const sectionRecord = toRecord(section)
          if (!sectionRecord) return
          pushString(sectionRecord.narrative)
          pushString(sectionRecord.overview)
        })
      }
    }
  }

  return snippets
}

function buildEvidenceDrawerData(message: any) {
  const outputs = extractMessageToolOutputs(message)
  const metadata = toRecord(message?.metadata)
  const provenance = toRecord(metadata?.provenance)
  if (outputs.length === 0 && !provenance) return null

  const sourceEntries = outputs.flatMap((output) => {
    const entries: unknown[] = []
    if (typeof output.source === "string") {
      entries.push({ source: output.source })
    }
    if (Array.isArray(output.sources_used)) {
      entries.push(...output.sources_used.map((value) => ({ source: value })))
    }
    return entries
  })

  if (Array.isArray(provenance?.sources_used)) {
    for (const source of provenance.sources_used) {
      sourceEntries.push({ source })
    }
  }

  const exclusions = outputs.flatMap((output) =>
    Array.isArray(output.exclusions) ? output.exclusions : [],
  )

  const assumptions = outputs.flatMap((output) => {
    const items: unknown[] = []
    if (Array.isArray(output.guardrail_warnings)) {
      items.push(...output.guardrail_warnings)
    }
    if (output.no_results === true) {
      items.push("No direct rows returned from this tool invocation.")
    }
    if (typeof output.overview === "string" && output.overview.trim().length > 0) {
      items.push(output.overview)
    }
    return items
  })

  const steps = outputs.flatMap((output) => {
    const items: unknown[] = []
    if (Array.isArray(output.calculation_steps)) {
      items.push(...output.calculation_steps)
    }
    if (Array.isArray(output.steps)) {
      items.push(...output.steps)
    }
    if (typeof output.formula === "string" && output.formula.trim().length > 0) {
      items.push(output.formula)
    }
    return items
  })

  const timestamp = outputs.find((output) => typeof output.data_as_of === "string")?.data_as_of

  return {
    sources: sourceEntries,
    exclusions,
    assumptions,
    steps,
    timestamp: typeof timestamp === "string" ? timestamp : typeof provenance?.snapshot_ts === "string" ? provenance.snapshot_ts : undefined,
    requestId: typeof metadata?.requestId === "string" ? metadata.requestId : typeof metadata?.request_id === "string" ? metadata.request_id : undefined,
    runId: typeof metadata?.run_id === "string" ? metadata.run_id : undefined,
    snapshotTs: typeof provenance?.snapshot_ts === "string" ? provenance.snapshot_ts : undefined,
  }
}

function deriveToolTrace(message: any, locale: string): string | null {
  const outputs = extractMessageToolOutputs(message)
  if (outputs.length === 0) return null

  const rows = extractStructuredRows(outputs).filter(isAnalyticRecord)
  let resultCount: number | null = rows.length > 0 ? rows.length : null
  if (resultCount === null) {
    for (const output of outputs) {
      const candidate = toFiniteNumber(
        output.resultCount ??
          output.result_count ??
          output.total ??
          output.count ??
          output.matches ??
          output.items ??
          output.row_count,
      )
      if (candidate !== null) {
        resultCount = candidate
        break
      }
    }
  }

  let durationMs: number | null = null
  for (const output of outputs) {
    const candidate = toFiniteNumber(
      output.duration_ms ??
        output.execution_ms ??
        output.elapsed_ms ??
        output.query_time_ms ??
        output.time_ms ??
        output.latency_ms,
    )
    if (candidate !== null) {
      durationMs = candidate
      break
    }
  }

  const isArabic = locale === "ar"
  const label = isArabic ? "محطة القرار" : "Decision Terminal"
  const queryLabel = isArabic ? "استعلام منظم" : "Structured Query"
  const parts: string[] = []
  if (resultCount !== null) {
    parts.push(isArabic ? `${resultCount} نتيجة` : `${resultCount} results`)
  }
  if (durationMs !== null) {
    const rounded = Math.round(durationMs)
    parts.push(isArabic ? `${rounded}ms` : `in ${rounded}ms`)
  }
  const suffix = parts.length > 0 ? ` -> ${parts.join(" / ")}` : ""

  return `${label} -> ${queryLabel}${suffix}`
}

function deriveWorkspaceCards(toolOutputs: Record<string, unknown>[], locale: string, t: (key: string) => string): WorkspaceCard[] {
  const rows = extractStructuredRows(toolOutputs).filter(isAnalyticRecord)

  if (rows.length === 0) {
    return [
      { title: t("matchedProjects"), value: "0", subtitle: t("askToScreen") },
      { title: t("avgAskingPrice"), value: "-", subtitle: t("appearsAfterSearch") },
      { title: t("decisionLabel"), value: "-", subtitle: t("decisionLabels") },
      { title: t("dataConfidence"), value: "-", subtitle: t("qualityTier") },
    ]
  }

  const aggregateRows = rows.filter((row) =>
    toFiniteNumber(row.projects) !== null ||
    toFiniteNumber(row.avg_price) !== null ||
    toFiniteNumber(row.avg_yield) !== null ||
    toFiniteNumber(row.avg_score) !== null,
  )

  const prices = rows
    .map((row) => toFiniteNumber(row.price_from_aed ?? row.l1_canonical_price))
    .filter((value): value is number => value !== null && value > 0)
  const aggregatePrice = weightedAverage(
    aggregateRows.map((row) => ({
      value: toFiniteNumber(row.avg_price),
      weight: toFiniteNumber(row.projects),
    })),
  )
  const avgPrice = prices.length > 0 ? average(prices) : aggregatePrice

  const timingCounts = new Map<string, number>()
  for (const row of rows) {
    const timing = toText(row.timing_label ?? row.l3_timing_signal, "")
    if (!timing) continue
    timingCounts.set(timing, (timingCounts.get(timing) ?? 0) + 1)
  }
  const topTimingRaw = [...timingCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "-"
  const topTiming = localizeMetricText(topTimingRaw, locale)

  const decisionCounts = new Map<string, number>()
  for (const row of rows) {
    const decisionLabel = toText(row.decision_label_v1, "")
    if (!decisionLabel) continue
    decisionCounts.set(decisionLabel, (decisionCounts.get(decisionLabel) ?? 0) + 1)
  }

  const confidenceCounts = new Map<string, number>()
  for (const row of rows) {
    const confidence = toText(row.price_confidence ?? row.l1_confidence, "")
    if (!confidence) continue
    confidenceCounts.set(confidence, (confidenceCounts.get(confidence) ?? 0) + 1)
  }
  const totalProjects = sumValues(aggregateRows.map((row) => toFiniteNumber(row.projects)))
  const totalBuySignals = sumValues(aggregateRows.map((row) => toFiniteNumber(row.buy_signals)))
  const totalSafeProjects = sumValues(aggregateRows.map((row) => toFiniteNumber(row.safe_projects)))

  const topConfidenceRaw = [...confidenceCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? (
    totalProjects && totalSafeProjects
      ? totalSafeProjects / totalProjects >= 0.65
        ? locale === "ar" ? "تغطية قوية" : "Strong coverage"
        : totalSafeProjects / totalProjects >= 0.4
          ? locale === "ar" ? "تغطية متوسطة" : "Moderate coverage"
          : locale === "ar" ? "تغطية محدودة" : "Thin coverage"
      : "-"
  )
  const topConfidence = topConfidenceRaw.startsWith("تغطية") || topConfidenceRaw.includes("coverage")
    ? topConfidenceRaw
    : localizeMetricText(topConfidenceRaw, locale)

  const scoreValues = rows
    .map((row) => toFiniteNumber(row.investor_score_v1 ?? row.avg_score ?? row.engine_god_metric))
    .filter((value): value is number => value !== null)
  const avgScore = scoreValues.length > 0 ? scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length : null

  const decisionValueRaw = [...decisionCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? (
    totalProjects && totalBuySignals
      ? totalBuySignals / totalProjects >= 0.5
        ? locale === "ar" ? "زخم شراء" : "BUY-heavy"
        : totalBuySignals / totalProjects >= 0.25
          ? locale === "ar" ? "انتقائي" : "Selective"
          : locale === "ar" ? "قيد المراقبة" : "Watchlist"
      : topTiming
  )
  const decisionValue = decisionValueRaw === topTiming || decisionValueRaw.includes("BUY") || decisionValueRaw === "Selective" || decisionValueRaw === "Watchlist" || decisionValueRaw.startsWith("زخم")
    ? (decisionValueRaw === topTiming ? topTiming : decisionValueRaw)
    : localizeMetricText(decisionValueRaw, locale)

  const matchedProjects = totalProjects && totalProjects > rows.length ? totalProjects : rows.length
  const matchedProjectsSubtitle = totalProjects && aggregateRows.length > 0
    ? locale === "ar"
      ? `${formatWholeNumber(aggregateRows.length, locale)} أسواق مفحوصة`
      : `${formatWholeNumber(aggregateRows.length, locale)} markets scanned`
    : t("fromLiveScan")

  const decisionSubtitle = totalBuySignals
    ? locale === "ar"
      ? `${formatWholeNumber(totalBuySignals, locale)} إشارات شراء`
      : `${formatWholeNumber(totalBuySignals, locale)} BUY signals`
    : `${t("timingLabelLead")}: ${topTiming}`

  return [
    { title: t("matchedProjects"), value: formatDecimal(matchedProjects, locale, 0, 0), subtitle: matchedProjectsSubtitle },
    { title: t("avgAskingPrice"), value: formatAed(avgPrice, locale), subtitle: t("acrossMatchedResults") },
    { title: t("decisionLabel"), value: decisionValue, subtitle: decisionSubtitle },
    { title: t("dataConfidence"), value: topConfidence, subtitle: `${t("avgInvestorScore")}: ${formatMetric(avgScore, locale)}` },
  ]
}

function deriveComparisonRows(toolOutputs: Record<string, unknown>[], locale: string): ComparisonRow[] {
  const rows = extractStructuredRows(toolOutputs)
    .filter(isAnalyticRecord)
    .filter((row) => {
      const hasSubject =
        typeof row.name === "string" ||
        typeof row.project_name === "string" ||
        typeof row.project === "string" ||
        typeof row.area === "string"

      const hasComparisonMetric = [
        row.price_from_aed,
        row.l1_canonical_price,
        row.avg_price,
        row.rental_yield,
        row.yield_pct,
        row.avg_yield,
        row.investor_score_v1,
        row.avg_score,
        row.engine_god_metric,
        row.stress_grade_v1,
        row.decision_label_v1,
        row.buy_signals,
        row.safe_projects,
        row.projects,
      ].some((value) => value !== null && value !== undefined && value !== "")

      return hasSubject && hasComparisonMetric
    })

  const unique = new Map<string, ComparisonRow>()
  for (const row of rows) {
    const projectLabel = toText(row.name ?? row.project_name ?? row.project, "")
    const areaLabel = pickLocalizedText(locale, row.area_ar, row.final_area ?? row.area, "")
    const label = projectLabel || areaLabel
    if (!label || unique.has(label)) continue

    const projectsCount = toFiniteNumber(row.projects)
    const buySignals = toFiniteNumber(row.buy_signals)
    const safeProjects = toFiniteNumber(row.safe_projects)
    const isAreaAggregate = !projectLabel && Boolean(areaLabel)

    unique.set(label, {
      kind: isAreaAggregate ? "area" : "project",
      label,
      area: areaLabel || label,
      developer: pickLocalizedText(locale, row.developer_ar, row.developer, "-"),
      confidence: isAreaAggregate
        ? (
            projectsCount !== null
              ? locale === "ar"
                ? `${formatWholeNumber(projectsCount, locale)} مشروع`
                : `${formatWholeNumber(projectsCount, locale)} projects`
              : "-"
          )
        : localizeMetricText(row.price_confidence ?? row.l1_confidence, locale),
      timingSignal: isAreaAggregate
        ? (
            buySignals !== null
              ? locale === "ar"
                ? `${formatWholeNumber(buySignals, locale)} إشارة شراء`
                : `${formatWholeNumber(buySignals, locale)} BUY signals`
              : "-"
          )
        : localizeMetricText(row.timing_label ?? row.l3_timing_signal, locale),
      stressGrade: isAreaAggregate
        ? (
            safeProjects !== null
              ? locale === "ar"
                ? `${formatWholeNumber(safeProjects, locale)} آمن`
                : `${formatWholeNumber(safeProjects, locale)} safe projects`
              : "-"
          )
        : localizeMetricText(row.stress_grade_v1 ?? row.l2_stress_test_grade, locale),
      stressScore: toFiniteNumber(row.stress_score ?? row.engine_stress_test),
      price: toFiniteNumber(row.price_from_aed ?? row.l1_canonical_price ?? row.avg_price),
      yield: toFiniteNumber(row.rental_yield ?? row.yield_pct ?? row.avg_yield ?? row.l1_canonical_yield),
      score: toFiniteNumber(row.investor_score_v1 ?? row.avg_score ?? row.engine_god_metric),
      projectsCount,
      buySignals,
      safeProjects,
      developerReliabilityScore: toFiniteNumber(row.developer_reliability_score ?? row.l2_developer_reliability),
      supplyResilienceScore: toFiniteNumber(row.supply_resilience_score),
      liquidityResilienceScore: toFiniteNumber(row.liquidity_resilience_score),
      pricingDisciplineScore: toFiniteNumber(row.pricing_discipline_score),
      handoverReliabilityScore: toFiniteNumber(row.handover_reliability_score),
      areaStabilityScore: toFiniteNumber(row.area_stability_score),
      paymentPlanScore: toFiniteNumber(row.payment_plan_score),
    })

    if (unique.size >= 8) break
  }

  return [...unique.values()]
}

function buildComparisonSubtitle(row: ComparisonRow, locale: string) {
  if (row.kind === "area") {
    const parts = [
      row.projectsCount !== null
        ? locale === "ar"
          ? `${formatWholeNumber(row.projectsCount, locale)} مشروع`
          : `${formatWholeNumber(row.projectsCount, locale)} projects`
        : null,
      row.buySignals !== null
        ? locale === "ar"
          ? `${formatWholeNumber(row.buySignals, locale)} إشارة شراء`
          : `${formatWholeNumber(row.buySignals, locale)} BUY signals`
        : null,
      row.safeProjects !== null
        ? locale === "ar"
          ? `${formatWholeNumber(row.safeProjects, locale)} مشروع آمن`
          : `${formatWholeNumber(row.safeProjects, locale)} safe projects`
        : null,
    ].filter((part): part is string => Boolean(part))

    return parts.join(" • ")
  }

  return [row.area, row.stressGrade, row.timingSignal, row.confidence]
    .filter((part) => part && part !== "-")
    .join(" • ")
}

function rankComparisonRows(rows: ComparisonRow[]) {
  return [...rows].sort((left, right) => {
    const scoreDelta = (right.score ?? Number.NEGATIVE_INFINITY) - (left.score ?? Number.NEGATIVE_INFINITY)
    if (scoreDelta !== 0) return scoreDelta

    const yieldDelta = (right.yield ?? Number.NEGATIVE_INFINITY) - (left.yield ?? Number.NEGATIVE_INFINITY)
    if (yieldDelta !== 0) return yieldDelta

    return (left.price ?? Number.POSITIVE_INFINITY) - (right.price ?? Number.POSITIVE_INFINITY)
  })
}

function buildComparisonFallbackText(rows: ComparisonRow[], locale: string) {
  const ranked = rankComparisonRows(rows)
  const leader = ranked[0]
  if (!leader) return ""

  const runnerUp = ranked[1] ?? null
  const verdictHeading = locale === "ar" ? "## الحكم السريع" : "## Quick verdict"

  if (leader.kind === "area") {
    const lines = [
      verdictHeading,
      runnerUp
        ? locale === "ar"
          ? `${leader.label} تظهر كالسوق الأقوى حالياً ضمن المقارنة الحالية.`
          : `${leader.label} screens as the stronger market right now in this comparison.`
        : locale === "ar"
          ? `${leader.label} هي القراءة الأقوى في النتيجة الحالية.`
          : `${leader.label} is the strongest area in the current result set.`,
      `- ${locale === "ar" ? "متوسط السعر" : "Average entry"}: ${formatAed(leader.price, locale)}${runnerUp ? ` vs ${formatAed(runnerUp.price, locale)}` : ""}`,
      `- ${locale === "ar" ? "متوسط العائد" : "Average yield"}: ${formatPercent(leader.yield, locale)}${runnerUp ? ` vs ${formatPercent(runnerUp.yield, locale)}` : ""}`,
      `- ${locale === "ar" ? "متوسط نقاط المستثمر" : "Average investor score"}: ${formatMetric(leader.score, locale)}${runnerUp ? ` vs ${formatMetric(runnerUp.score, locale)}` : ""}`,
      `- ${locale === "ar" ? "اتساع السوق" : "Market breadth"}: ${buildComparisonSubtitle(leader, locale) || "-"}`,
    ]

    return lines.join("\n")
  }

  const timingLabel = [leader.timingSignal, leader.stressGrade].filter((part) => part && part !== "-").join(" / ")
  const runnerTiming = runnerUp ? [runnerUp.timingSignal, runnerUp.stressGrade].filter((part) => part && part !== "-").join(" / ") : ""

  return [
    verdictHeading,
    runnerUp
      ? locale === "ar"
        ? `${leader.label} تتقدم على ${runnerUp.label} في هذه القراءة الحالية.`
        : `${leader.label} ranks ahead of ${runnerUp.label} in the current read.`
      : locale === "ar"
        ? `${leader.label} هي الصفقة الأقوى في النتيجة الحالية.`
        : `${leader.label} is the strongest live candidate in this result set.`,
    `- ${locale === "ar" ? "السعر" : "Entry price"}: ${formatAed(leader.price, locale)}${runnerUp ? ` vs ${formatAed(runnerUp.price, locale)}` : ""}`,
    `- ${locale === "ar" ? "العائد" : "Yield"}: ${formatPercent(leader.yield, locale)}${runnerUp ? ` vs ${formatPercent(runnerUp.yield, locale)}` : ""}`,
    `- ${locale === "ar" ? "نقاط المستثمر" : "Investor score"}: ${formatMetric(leader.score, locale)}${runnerUp ? ` vs ${formatMetric(runnerUp.score, locale)}` : ""}`,
    `- ${locale === "ar" ? "التوقيت / الضغط" : "Timing / stress"}: ${timingLabel || "-"}${runnerUp ? ` vs ${runnerTiming || "-"}` : ""}`,
  ].join("\n")
}

function buildProjectStressFallbackText(outputs: Record<string, unknown>[], locale: string) {
  const records = extractStructuredRows(outputs).filter(isAnalyticRecord)
  const candidate = records.find((row) =>
    [
      row.stress_score,
      row.stress_grade_v1,
      row.developer_reliability_score,
      row.supply_resilience_score,
      row.liquidity_resilience_score,
      row.pricing_discipline_score,
      row.handover_reliability_score,
      row.area_stability_score,
      row.payment_plan_score,
    ].some((value) => value !== null && value !== undefined && value !== ""),
  )

  if (!candidate) return ""

  const subject = toDisplayLabel(
    candidate.name ?? candidate.project_name ?? candidate.project ?? candidate.asset_id,
    locale === "ar" ? "المشروع المحدد" : "Selected project",
  )

  return [
    locale === "ar" ? "## ملف الضغط الحقيقي" : "## Live stress profile",
    locale === "ar"
      ? `${subject} وفق أحدث السجل المصنف في طبقة القرار.`
      : `${subject} from the latest scored record in the decision layer.`,
    `- ${locale === "ar" ? "درجة الضغط" : "Stress grade"}: ${localizeMetricText(candidate.stress_grade_v1 ?? candidate.l2_stress_test_grade, locale)}`,
    `- ${locale === "ar" ? "نقاط الضغط" : "Stress score"}: ${formatMetric(toFiniteNumber(candidate.stress_score), locale, 0)}`,
    `- ${locale === "ar" ? "موثوقية المطور" : "Developer reliability"}: ${formatMetric(toFiniteNumber(candidate.developer_reliability_score ?? candidate.l2_developer_reliability), locale, 0)}`,
    `- ${locale === "ar" ? "مرونة المعروض" : "Supply resilience"}: ${formatMetric(toFiniteNumber(candidate.supply_resilience_score), locale, 0)}`,
    `- ${locale === "ar" ? "مرونة السيولة" : "Liquidity resilience"}: ${formatMetric(toFiniteNumber(candidate.liquidity_resilience_score), locale, 0)}`,
    `- ${locale === "ar" ? "انضباط التسعير" : "Pricing discipline"}: ${formatMetric(toFiniteNumber(candidate.pricing_discipline_score), locale, 0)}`,
    `- ${locale === "ar" ? "موثوقية التسليم" : "Handover reliability"}: ${formatMetric(toFiniteNumber(candidate.handover_reliability_score), locale, 0)}`,
    `- ${locale === "ar" ? "ثبات المنطقة" : "Area stability"}: ${formatMetric(toFiniteNumber(candidate.area_stability_score), locale, 0)}`,
    `- ${locale === "ar" ? "مرونة خطة الدفع" : "Payment plan"}: ${formatMetric(toFiniteNumber(candidate.payment_plan_score), locale, 0)}`,
  ].join("\n")
}

function buildMemoFallbackText(outputs: Record<string, unknown>[], locale: string) {
  for (const output of outputs) {
    const memo = toRecord(output.memo)
    const narrative = memo ? toRecord(memo.narrative) : null
    if (!memo || !narrative) continue

    const projectName = toText(memo.project_name, locale === "ar" ? "المشروع المحدد" : "Selected project")
    const sections = [
      typeof narrative.price_reality === "string" ? narrative.price_reality : "",
      typeof narrative.area_risk === "string" ? narrative.area_risk : "",
      typeof narrative.developer === "string" ? narrative.developer : "",
      typeof narrative.stress_test === "string" ? narrative.stress_test : "",
    ].filter((line) => line.trim().length > 0)

    if (sections.length === 0) continue

    return [
      locale === "ar" ? `## مذكرة ${projectName}` : `## ${projectName} memo`,
      ...sections.slice(0, 4).map((line) => `- ${line}`),
    ].join("\n")
  }

  return ""
}

function buildGenericRowsFallbackText(outputs: Record<string, unknown>[], locale: string) {
  const rows = extractStructuredRows(outputs).filter(isAnalyticRecord)
  const first = rows[0]
  if (!first) return ""

  const subject = toDisplayLabel(first.name ?? first.project_name ?? first.project ?? first.area ?? first.developer ?? first.asset_id, "")
  if (!subject) {
    return locale === "ar"
      ? "اكتمل التحليل. افتح درج الأدلة لمراجعة النتيجة المنظمة."
      : "Analysis complete. Open the evidence drawer to inspect the structured result set."
  }

  const details = [
    `${locale === "ar" ? "السعر" : "Price"}: ${formatAed(toFiniteNumber(first.price_from_aed ?? first.l1_canonical_price ?? first.avg_price), locale)}`,
    `${locale === "ar" ? "العائد" : "Yield"}: ${formatPercent(toFiniteNumber(first.rental_yield ?? first.l1_canonical_yield ?? first.yield_pct ?? first.avg_yield), locale)}`,
    `${locale === "ar" ? "المنطقة" : "Area"}: ${toDisplayLabel(first.area ?? first.final_area, "-")}`,
  ].filter((entry) => !entry.endsWith(": -"))

  return [
    locale === "ar" ? "## قراءة سريعة" : "## Quick read",
    locale === "ar"
      ? `${subject} هو أبرز سجل في النتيجة الحالية.`
      : `${subject} is the leading record in the current result set.`,
    ...details.map((detail) => `- ${detail}`),
  ].join("\n")
}

function buildNarrativeFallbackText(outputs: Record<string, unknown>[]) {
  return extractNarrativeStrings(outputs)[0] ?? ""
}

function buildAssistantFallbackText(message: any, locale: string) {
  const outputs = extractMessageToolOutputs(message)
  if (outputs.length === 0) return ""

  const stressFallback = buildProjectStressFallbackText(outputs, locale)
  if (stressFallback) return stressFallback

  const comparisonFallback = buildComparisonFallbackText(deriveComparisonRows(outputs, locale), locale)
  if (comparisonFallback) return comparisonFallback

  const memoFallback = buildMemoFallbackText(outputs, locale)
  if (memoFallback) return memoFallback

  const narrativeFallback = buildNarrativeFallbackText(outputs)
  if (narrativeFallback) return narrativeFallback

  return buildGenericRowsFallbackText(outputs, locale)
}

function resolveAssistantDisplayText(message: any, locale: string) {
  const explicitText = displayMessageText(message)
  if (explicitText) return explicitText
  return buildAssistantFallbackText(message, locale)
}

function deriveGoldenPathPreviewDisplay(preview: GoldenPathPreview | null, locale: string) {
  if (!preview?.metadata) return null

  const rows = toRows(preview.rows)
  const intent = localizeMetricText(
    preview.metadata.spec?.intent ?? (locale === "ar" ? "معاينة المسار الذهبي" : "Golden Path Preview"),
    locale,
    locale === "ar" ? "معاينة المسار الذهبي" : "Golden Path Preview",
  )
  const avgPrice = average(rows.map((row) => toFiniteNumber(row.price_from_aed ?? row.avg_price)))
  const avgYield = average(rows.map((row) => toFiniteNumber(row.yield_pct ?? row.rental_yield ?? row.avg_yield)))
  const avgGfa = average(rows.map((row) => toFiniteNumber(row.gfa_sqm)))
  const developers = new Set(
    rows
      .map((row) => toDisplayLabel(row.developer, ""))
      .filter((value) => value.length > 0),
  )

  const stats = [
    {
      label: locale === "ar" ? "الصفوف" : "Rows",
      value: formatWholeNumber(preview.metadata.rowCount ?? rows.length, locale),
    },
    {
      label: locale === "ar" ? "متوسط السعر" : "Average price",
      value: formatAed(avgPrice, locale),
    },
    {
      label: locale === "ar" ? "متوسط العائد" : "Average yield",
      value: formatPercent(avgYield, locale),
    },
    {
      label: locale === "ar" ? "المطورون" : "Developers",
      value: formatWholeNumber(developers.size, locale),
    },
  ].filter((stat) => stat.value !== "-")

  if (stats.length < 4 && avgGfa !== null) {
    stats.push({
      label: locale === "ar" ? "متوسط المساحة" : "Average GFA",
      value: `${formatWholeNumber(avgGfa, locale)} sqm`,
    })
  }

  const cards = rows.slice(0, 4).map((row, index) => {
    const title = toDisplayLabel(row.project ?? row.name ?? row.asset_id ?? row.area, `${intent} ${index + 1}`)
    const subtitle = [
      toDisplayLabel(row.area, ""),
      toDisplayLabel(row.developer, ""),
      localizeMetricText(row.status_band, locale, ""),
    ]
      .filter((part) => part.length > 0)
      .join(" • ")

    const metrics = [
      { label: locale === "ar" ? "السعر" : "Entry", value: formatAed(toFiniteNumber(row.price_from_aed ?? row.avg_price), locale) },
      { label: locale === "ar" ? "العائد" : "Yield", value: formatPercent(toFiniteNumber(row.yield_pct ?? row.rental_yield ?? row.avg_yield), locale) },
      { label: locale === "ar" ? "المخاطر" : "Risk", value: localizeMetricText(row.risk_band, locale) },
      { label: locale === "ar" ? "السيولة" : "Liquidity", value: localizeMetricText(row.liquidity_band, locale) },
      { label: locale === "ar" ? "التسليم" : "Handover", value: formatDateLabel(row.handover_date, locale) },
      { label: locale === "ar" ? "المساحة" : "GFA", value: toFiniteNumber(row.gfa_sqm) !== null ? `${formatWholeNumber(toFiniteNumber(row.gfa_sqm), locale)} sqm` : "-" },
    ]
      .filter((metric) => metric.value !== "-")
      .slice(0, 4)

    return {
      title,
      subtitle,
      badge: localizeMetricText(row.risk_band ?? row.liquidity_band, locale, ""),
      metrics,
    }
  })

  const leadRow = cards[0]
  const summary = leadRow
    ? locale === "ar"
      ? `${leadRow.title} تقود القراءة الحالية ضمن ${formatWholeNumber(preview.metadata.rowCount ?? rows.length, locale)} صفوف مهيكلة.`
      : `${leadRow.title} leads the current preview across ${formatWholeNumber(preview.metadata.rowCount ?? rows.length, locale)} structured rows.`
    : locale === "ar"
      ? "المعاينة جاهزة."
      : "Preview ready."

  return {
    title: intent,
    summary,
    stats: stats.slice(0, 4),
    cards,
  }
}

function deriveDldNotifications(toolOutputs: Record<string, unknown>[]): DldNotificationRow[] {
  const notifications: DldNotificationRow[] = []

  for (let index = toolOutputs.length - 1; index >= 0; index -= 1) {
    const output = toolOutputs[index]
    const source = typeof output.source === "string" ? output.source : ""
    const rows = toRows(output.rows)
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

      if (notifications.length >= 8) {
        return notifications
      }
    }
  }

  return notifications
}

function resolveDataFreshness(toolOutputs: Record<string, unknown>[]) {
  for (let index = toolOutputs.length - 1; index >= 0; index -= 1) {
    const value = toolOutputs[index]?.data_as_of
    if (typeof value === "string" && value.trim().length > 0) {
      return value
    }
  }
  return null
}

const CAPABILITY_CARDS: Record<AppLocale, Array<{ label: string; description: string; example: string; prompt: string; icon: LucideIcon }>> = {
  en: [
    {
      label: "Screen Properties",
      description: "Find ranked projects by budget, area, and return profile using live scoring data.",
      example: "2BR under AED 2M, BUY signal, Grade A risk",
      prompt: "Find 2BR projects under AED 2M with BUY timing label and stress grade A or B. Rank by investor_score_v1 and show yield for each.",
      icon: Search,
    },
    {
      label: "Compare Markets",
      description: "Side-by-side analysis of areas or projects across price, yield, and risk metrics.",
      example: "Dubai Marina vs JBR: yield, risk, and timing",
      prompt: "Compare Dubai Marina vs JBR on price, yield, stress grade, and timing label. Which is the better entry point right now and why?",
      icon: Scale,
    },
    {
      label: "Stress Test",
      description: "Review real V1 stress grades, scores, and resilience sub-scores for live projects.",
      example: "Show Marina Vista V1 stress grade and sub-scores",
      prompt: "Show the real V1 stress profile for Marina Vista. Return stress_score, stress_grade_v1, developer_reliability_score, supply_resilience_score, liquidity_resilience_score, pricing_discipline_score, handover_reliability_score, area_stability_score, and payment_plan_score.",
      icon: SlidersHorizontal,
    },
    {
      label: "Investor Memo",
      description: "Generate a structured due diligence brief with price reality, developer track record, and risk verdict.",
      example: "Full memo: Marina Vista - pricing, risk, verdict",
      prompt: "Generate a full investor memo for Marina Vista. Include: price reality check versus area average, developer reliability score, stress grade assessment, timing label context, and final investment verdict.",
      icon: FileText,
    },
  ],
  ar: [
    {
      label: "فرز المشاريع",
      description: "اعثر على المشاريع الأنسب حسب الميزانية والمنطقة والعائد باستخدام البيانات المباشرة.",
      example: "شقق غرفتين تحت AED 2M مع BUY ومخاطر A",
      prompt: "اعرض شقق غرفتين تحت AED 2M بإشارة BUY ودرجة ضغط A أو B، ورتّبها حسب investor_score_v1 مع العائد.",
      icon: Search,
    },
    {
      label: "مقارنة المناطق",
      description: "قارن بين منطقتين أو مشروعين في السعر والعائد والمخاطر والتوقيت.",
      example: "دبي مارينا مقابل JBR: العائد والمخاطر والتوقيت",
      prompt: "قارن دبي مارينا وJBR في السعر والعائد ودرجة الضغط وإشارة التوقيت. أيهما أفضل للدخول الآن ولماذا؟",
      icon: Scale,
    },
    {
      label: "اختبار الضغط",
      description: "اعرض درجات الضغط الفعلية ودرجات المرونة الفرعية للمشاريع الحية.",
      example: "اعرض ملف الضغط V1 لمارينا فيستا",
      prompt: "اعرض ملف الضغط V1 الحقيقي لمارينا فيستا متضمناً stress_score وstress_grade_v1 وجميع درجات المرونة الفرعية.",
      icon: SlidersHorizontal,
    },
    {
      label: "مذكرة استثمار",
      description: "أنشئ مذكرة واضحة تشمل واقعية السعر وسجل المطور والمخاطر والقرار النهائي.",
      example: "مذكرة كاملة عن مارينا فيستا",
      prompt: "أنشئ مذكرة استثمار كاملة لمارينا فيستا تشمل فحص واقعية السعر مقابل المنطقة، وموثوقية المطور، وقراءة الضغط، وسياق التوقيت، والحكم النهائي.",
      icon: FileText,
    },
  ],
}

const COMMAND_PROMPTS: Record<AppLocale, Array<{ label: string; prompt: string; icon: LucideIcon }>> = {
  en: [
    {
      label: "Screen",
      prompt: "Find 2BR projects under AED 2M with BUY timing label and stress grade A or B. Rank by investor_score_v1.",
      icon: Search,
    },
    {
      label: "Compare",
      prompt: "Compare Dubai Marina vs JBR on price, yield, stress grade, and timing label. Which is the better entry point?",
      icon: Scale,
    },
    {
      label: "Stress test",
      prompt: "Show Marina Vista stress_score, stress_grade_v1, timing_label, investor_score_v1, and all real V1 resilience sub-scores.",
      icon: Radar,
    },
    {
      label: "Investor memo",
      prompt: "Generate a full investor memo for Marina Vista: price reality, area risk, developer diligence, stress test, and verdict.",
      icon: FileText,
    },
  ],
  ar: [
    {
      label: "فرز",
      prompt: "اعرض شقق غرفتين تحت AED 2M بإشارة BUY ودرجة ضغط A أو B، ورتّبها حسب investor_score_v1.",
      icon: Search,
    },
    {
      label: "مقارنة",
      prompt: "قارن دبي مارينا وJBR في السعر والعائد ودرجة الضغط وإشارة التوقيت. أيهما أفضل للدخول؟",
      icon: Scale,
    },
    {
      label: "الضغط",
      prompt: "اعرض stress_score وstress_grade_v1 وtiming_label وinvestor_score_v1 وكل درجات المرونة الحقيقية لمارينا فيستا.",
      icon: Radar,
    },
    {
      label: "مذكرة",
      prompt: "أنشئ مذكرة استثمار كاملة لمارينا فيستا تشمل السعر والمنطقة والمطور واختبار الضغط والحكم النهائي.",
      icon: FileText,
    },
  ],
}

const GOLDEN_PATHS: Record<AppLocale, Array<{ id: GoldenPathId; label: string; description: string }>> = {
  en: [
    {
      id: "underwrite_development_site",
      label: "Underwrite Development Site",
      description: "Pre-validated TableSpec for underwriting: price, risk, handover, developer.",
    },
    {
      id: "compare_area_yields",
      label: "Compare Area Yields",
      description: "Deterministic yield comparison across top UAE submarkets.",
    },
    {
      id: "draft_spa_contract",
      label: "Draft SPA Contract",
      description: "Contract-ready signals: payment plan, handover, fees, developer checks.",
    },
  ],
  ar: [
    {
      id: "underwrite_development_site",
      label: "تقييم موقع تطوير",
      description: "مسار ذهبي ثابت لتقييم السعر والمخاطر والتسليم والمطور.",
    },
    {
      id: "compare_area_yields",
      label: "مقارنة عوائد المناطق",
      description: "مقارنة عوائد محددة مسبقاً عبر المناطق الأساسية.",
    },
    {
      id: "draft_spa_contract",
      label: "مسودة عقد SPA",
      description: "إشارات تعاقدية أساسية: خطة الدفع، التسليم، الرسوم، المطور.",
    },
  ],
}

const slashCommands: SlashCommand[] = [
  {
    id: "compare",
    title: "/compare",
    description: "Run a direct area or project comparison.",
    icon: Scale,
    buildPrompt: ({ selectedRow }) =>
      selectedRow
        ? `Compare ${selectedRow.label} with top alternatives in ${selectedRow.area} using price, yield, stress grade, and timing label.`
        : "Compare Dubai Marina vs JBR on price, yield, stress grade, and timing label.",
  },
  {
    id: "screen",
    title: "/screen",
    description: "Find ranked projects with constraints.",
    icon: Search,
    buildPrompt: () =>
      "Find 2BR projects under AED 2M with BUY timing label and stress grade A or B. Rank by investor_score_v1.",
  },
  {
    id: "memo",
    title: "/memo",
    description: "Generate full investor memo.",
    icon: FileText,
    buildPrompt: ({ selectedRow }) =>
      `Generate an investor memo for ${selectedRow?.label ?? "Marina Vista"} with price reality, area risk, developer due diligence, and stress test.`,
  },
  {
    id: "risk",
    title: "/risk",
    description: "Show real V1 stress metrics.",
    icon: SlidersHorizontal,
    buildPrompt: ({ selectedRow }) =>
      `Show the real V1 stress profile for ${selectedRow?.label ?? "Marina Vista"}. Return stress_score, stress_grade_v1, timing_label, investor_score_v1, decision_label_v1, and all V1 resilience sub-scores.`,
  },
  {
    id: "price",
    title: "/price",
    description: "Run price reality check.",
    icon: Gauge,
    buildPrompt: ({ selectedRow }) => `Run price reality check for ${selectedRow?.label ?? "Marina Vista"}.`,
  },
]

export function ChatInterface({
  initialGoldenPath,
  initialLimit = 20,
  initialRemaining = 20,
  initialBlocked = false,
  initialCooldownSecondsRemaining = null,
}: ChatInterfaceProps) {
  const searchParams = useSearchParams()
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const t = useTranslations("chat")
  const uiCopy = useMemo(() => chatUiCopy(locale), [locale])
  const { data: session } = authClient.useSession()
  const canUpload = Boolean(session?.user)
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const [limit, setLimit] = useState<number | null>(initialLimit)
  const [remaining, setRemaining] = useState<number | null>(initialRemaining)
  const [cooldownBlocked, setCooldownBlocked] = useState(initialBlocked)
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState<number | null>(
    initialCooldownSecondsRemaining,
  )
  const [limitMessage, setLimitMessage] = useState<string | null>(null)
  const [reportDraft, setReportDraft] = useState<ReportDraftResult>({ status: "idle" })
  const [shortlistResult, setShortlistResult] = useState<ShortlistResult>({ status: "idle" })
  const [comprehensiveProfile, setComprehensiveProfile] = useState<ComprehensiveProfile>(DEFAULT_COMPREHENSIVE_PROFILE)
  const [selectedMemoryEntryId, setSelectedMemoryEntryId] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [selectedAudienceOverride, setSelectedAudienceOverride] = useState<"" | ComprehensiveProfileReportAudience>("")
  const [goldenPathPreview, setGoldenPathPreview] = useState<GoldenPathPreview | null>(null)
  const [goldenPathError, setGoldenPathError] = useState<string | null>(null)
  const [goldenPathLoading, setGoldenPathLoading] = useState<GoldenPathId | null>(null)

  const [selectedProject, setSelectedProject] = useState<string>("")
  const [slashActiveIndex, setSlashActiveIndex] = useState(0)
  const [canvasOpen, setCanvasOpen] = useState(false)
  const [activeCanvasTab, setActiveCanvasTab] = useState<"overview" | "projects" | "simulator" | "transactions" | "export">("overview")
  const prevComparisonCount = useRef(0)
  const prevDldCount = useRef(0)
  const prevSelectedProject = useRef("")
  const initialPromptRef = useRef<string | null>(null)
  const initialGoldenPathRef = useRef<GoldenPathId | null>(null)

  const { messages, sendMessage, status, error, stop } = useCopilot()

  const capabilityCards = CAPABILITY_CARDS[locale] ?? CAPABILITY_CARDS.en
  const commandPrompts = COMMAND_PROMPTS[locale] ?? COMMAND_PROMPTS.en
  const goldenPaths = GOLDEN_PATHS[locale] ?? GOLDEN_PATHS.en
  const heroCopy = isArabic
    ? {
        engine: "محطة القرار",
        feed: "محرك الاستعلامات المنظّم",
        titleLineOne: "محطة القرار",
        titleLineTwo: "استعلامات منظَّمة قابلة للتدقيق.",
        subtitle: "استعلامات منظَّمة على طبقة بيانات العقار الإماراتية. كل نتيجة تُرفق بأثر الأدوات وحمولة الـ API لتظل قابلة للتحقق.",
        dataLabel: "البيانات",
        analysing: "جارٍ التنفيذ",
        ready: "جاهز",
        showCanvas: "إظهار اللوحة",
        hideCanvas: "إخفاء اللوحة",
        emptyState: "ابدأ باستعلام منظم: مثال \"مشاريع A في المارينا تحت 5M بعائد فوق 6%\".",
        systemBadge: "Decision Terminal · استعلام منظَّم · أثر الأدوات · MCP Protocol",
      }
    : {
        engine: "Decision Terminal",
        feed: "Structured Query Engine",
        titleLineOne: "Decision Terminal.",
        titleLineTwo: "Auditable structured queries.",
        subtitle: "Run structured queries against the UAE real estate data layer. Every result is returned with the tool trace and API payload that produced it, so the answer stays inspectable.",
        dataLabel: "Data",
        analysing: "Executing",
        ready: "Ready",
        showCanvas: "Show canvas",
        hideCanvas: "Hide canvas",
        emptyState: "Start with a structured query. Example: \"A-grade Marina projects under 5M with 6%+ yield.\"",
        systemBadge: "Decision Terminal · Structured Query · Tool Trace · MCP Protocol",
      }

  useEffect(() => {
    if (!mounted) return
    let cancelled = false

    const loadUsage = async () => {
      try {
        const response = await fetch("/api/account/chat-usage", { cache: "no-store" })
        if (!response.ok) return
        const payload = (await response.json()) as {
          usage?: {
            limit?: number | null
            remaining?: number | null
            blocked?: boolean
            cooldownSecondsRemaining?: number | null
          }
        }
        if (cancelled) return
        if (payload.usage) {
          setLimit(payload.usage.limit ?? null)
          setRemaining(payload.usage.remaining ?? null)
          setCooldownBlocked(Boolean(payload.usage.blocked))
          setCooldownSecondsRemaining(payload.usage.cooldownSecondsRemaining ?? null)
        }
      } catch {
        // keep server defaults
      }
    }

    void loadUsage()
    return () => {
      cancelled = true
    }
  }, [mounted])

  const runGoldenPath = async (pathId: GoldenPathId) => {
    setGoldenPathError(null)
    setGoldenPathLoading(pathId)
    try {
      const response = await fetch("/api/time-table/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goldenPath: pathId,
          useLLM: false,
          limit: 8,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setGoldenPathError(typeof payload?.error === "string" ? payload.error : "Golden Path failed to load.")
        return
      }

      setGoldenPathPreview(payload as GoldenPathPreview)
    } catch {
      setGoldenPathError("Golden Path failed to load.")
    } finally {
      setGoldenPathLoading(null)
    }
  }

  useEffect(() => {
    if (!initialGoldenPath || initialGoldenPathRef.current === initialGoldenPath) {
      return
    }

    initialGoldenPathRef.current = initialGoldenPath
    void runGoldenPath(initialGoldenPath)
  }, [initialGoldenPath, runGoldenPath])

  useEffect(() => {
    if (!mounted) return

    if (!session?.user) {
      setComprehensiveProfile(DEFAULT_COMPREHENSIVE_PROFILE)
      return
    }

    let cancelled = false

    const loadProfileContext = async () => {
      try {
        const response = await fetch("/api/account/profile", { cache: "no-store" })
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as {
          profile?: {
            inferredSignals?: unknown
            comprehensiveProfile?: ComprehensiveProfile
          }
        }

        if (cancelled || !payload.profile) {
          return
        }

        const fromApi = payload.profile.comprehensiveProfile
        const fallback = getComprehensiveProfileFromSignals(payload.profile.inferredSignals)
        setComprehensiveProfile(fromApi ?? fallback)
      } catch {
        // Keep defaults when unavailable.
      }
    }

    void loadProfileContext()

    return () => {
      cancelled = true
    }
  }, [mounted, session?.user])

  useEffect(() => {
    if (!cooldownBlocked || !cooldownSecondsRemaining || cooldownSecondsRemaining <= 0) return

    const interval = window.setInterval(() => {
      setCooldownSecondsRemaining((current) => {
        if (!current || current <= 1) {
          setCooldownBlocked(false)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [cooldownBlocked, cooldownSecondsRemaining])

  const chatBlocked = cooldownBlocked || (limit !== null && (remaining ?? 0) <= 0)
  const usageError = error?.message ?? ""
  const isLimitError =
    usageError.includes("429") ||
    usageError.toLowerCase().includes("cool") ||
    usageError.toLowerCase().includes("limit")
  const isBusy = status === "submitted" || status === "streaming"
  const submitBlocked = input.trim().length === 0 || chatBlocked || isBusy
  const usageStatusLabel = useMemo(() => {
    if (limit === null) return t("unlimitedUsage")
    if (chatBlocked) {
      return t("usageCoolingDown")
    }
    return t("freeAccess")
  }, [chatBlocked, limit, t])

  const toolOutputs = useMemo(() => extractToolOutputs(messages as any[]), [messages])
  const workspaceCards = useMemo(() => deriveWorkspaceCards(toolOutputs, locale, t), [locale, toolOutputs, t])
  const comparisonRows = useMemo(() => deriveComparisonRows(toolOutputs, locale), [locale, toolOutputs])
  const dldNotifications = useMemo(() => deriveDldNotifications(toolOutputs), [toolOutputs])
  const dataFreshness = useMemo(() => resolveDataFreshness(toolOutputs), [toolOutputs])
  const goldenPathPreviewDisplay = useMemo(() => deriveGoldenPathPreviewDisplay(goldenPathPreview, locale), [goldenPathPreview, locale])

  const latestAssistantMessage = useMemo(() => {
    const assistant = [...(messages as any[])].reverse().find((message) => message.role === "assistant")
    return assistant ?? null
  }, [messages])

  const latestAssistantText = useMemo(() => {
    if (!latestAssistantMessage) return ""
    return resolveAssistantDisplayText(latestAssistantMessage, locale)
  }, [latestAssistantMessage, locale])

  const hasConversation = useMemo(() => {
    const stream = messages as any[]
    if (stream.length > 0) return true
    return status === "submitted" || status === "streaming"
  }, [messages, status])

  useEffect(() => {
    if (!hasConversation) setCanvasOpen(false)
  }, [hasConversation])

  useEffect(() => {
    setSelectedMemoryEntryId((current) =>
      current && !comprehensiveProfile.memoryEntries.some((entry) => entry.id === current) ? "" : current,
    )
  }, [comprehensiveProfile.memoryEntries])

  useEffect(() => {
    setSelectedTemplateId((current) =>
      current && !comprehensiveProfile.reportTemplates.some((template) => template.id === current) ? "" : current,
    )
  }, [comprehensiveProfile.reportTemplates])

  useEffect(() => {
    if (comparisonRows.length === 0) {
      setSelectedProject("")
      return
    }

    setSelectedProject((current) => {
      const exists = comparisonRows.some((row) => row.label === current)
      return exists ? current : comparisonRows[0].label
    })
  }, [comparisonRows])

  // Auto-switch canvas tab when new data arrives
  useEffect(() => {
    if (comparisonRows.length > prevComparisonCount.current) {
      setActiveCanvasTab("projects")
    }
    prevComparisonCount.current = comparisonRows.length
  }, [comparisonRows.length])

  useEffect(() => {
    if (dldNotifications.length > prevDldCount.current) {
      setActiveCanvasTab("transactions")
    }
    prevDldCount.current = dldNotifications.length
  }, [dldNotifications.length])

  useEffect(() => {
    if (selectedProject && selectedProject !== prevSelectedProject.current) {
      setActiveCanvasTab("simulator")
    }
    prevSelectedProject.current = selectedProject
  }, [selectedProject])

  const selectedRow = useMemo(
    () => comparisonRows.find((row) => row.label === selectedProject) ?? null,
    [comparisonRows, selectedProject],
  )

  const selectedMemoryEntry = useMemo(
    () =>
      selectedMemoryEntryId
        ? comprehensiveProfile.memoryEntries.find((entry) => entry.id === selectedMemoryEntryId) ?? null
        : null,
    [comprehensiveProfile.memoryEntries, selectedMemoryEntryId],
  )

  const selectedTemplate = useMemo(
    () =>
      selectedTemplateId
        ? comprehensiveProfile.reportTemplates.find((template) => template.id === selectedTemplateId) ?? null
        : null,
    [comprehensiveProfile.reportTemplates, selectedTemplateId],
  )

  const riskMetrics = useMemo(() => {
    if (!selectedRow) return null

    if (selectedRow.kind === "area") {
      return [
        { label: uiCopy.projectsScreened, value: formatWholeNumber(selectedRow.projectsCount, locale) },
        { label: uiCopy.buySignals, value: formatWholeNumber(selectedRow.buySignals, locale) },
        { label: uiCopy.safeProjects, value: formatWholeNumber(selectedRow.safeProjects, locale) },
        { label: uiCopy.averageEntry, value: formatAed(selectedRow.price, locale) },
        { label: uiCopy.averageYield, value: formatPercent(selectedRow.yield, locale) },
        { label: uiCopy.avgInvestorScore, value: formatMetric(selectedRow.score, locale) },
      ]
    }

    return [
      { label: uiCopy.stressScore, value: formatMetric(selectedRow.stressScore, locale) },
      { label: uiCopy.stressGrade, value: selectedRow.stressGrade || "-" },
      { label: uiCopy.timingLabel, value: selectedRow.timingSignal || "-" },
      { label: uiCopy.investorScore, value: formatMetric(selectedRow.score, locale) },
      { label: uiCopy.developerReliability, value: formatMetric(selectedRow.developerReliabilityScore, locale) },
      { label: uiCopy.supplyResilience, value: formatMetric(selectedRow.supplyResilienceScore, locale) },
      { label: uiCopy.liquidityResilience, value: formatMetric(selectedRow.liquidityResilienceScore, locale) },
      { label: uiCopy.pricingDiscipline, value: formatMetric(selectedRow.pricingDisciplineScore, locale) },
      { label: uiCopy.handoverReliability, value: formatMetric(selectedRow.handoverReliabilityScore, locale) },
      { label: uiCopy.areaStability, value: formatMetric(selectedRow.areaStabilityScore, locale) },
      { label: uiCopy.paymentPlan, value: formatMetric(selectedRow.paymentPlanScore, locale) },
    ]
  }, [locale, selectedRow, uiCopy])

  const chartCaps = useMemo(() => {
    const maxPrice = Math.max(...comparisonRows.map((row) => row.price ?? 0), 0)
    const maxYield = Math.max(...comparisonRows.map((row) => row.yield ?? 0), 0)
    const maxScore = Math.max(...comparisonRows.map((row) => row.score ?? 0), 0)
    return { maxPrice, maxYield, maxScore }
  }, [comparisonRows])

  const scoreSeries = useMemo(
    () => comparisonRows.slice(0, 6).map((row) => row.score ?? 0),
    [comparisonRows],
  )
  const yieldSeries = useMemo(
    () => comparisonRows.slice(0, 6).map((row) => row.yield ?? 0),
    [comparisonRows],
  )
  const scoreSparkPath = useMemo(() => buildSparklinePath(scoreSeries), [scoreSeries])
  const yieldSparkPath = useMemo(() => buildSparklinePath(yieldSeries), [yieldSeries])

  const dynamicSuggestions = useMemo(() => {
    if (!selectedRow) {
      return [
        t("slashExamples.screen"),
        t("slashExamples.yield"),
        uiCopy.screeningSuggestion,
        uiCopy.methodologySuggestion,
      ]
    }

    return [
      uiCopy.memoSuggestion(selectedRow.label),
      uiCopy.compareSuggestion(selectedRow.label, selectedRow.area),
      uiCopy.stressSuggestion(selectedRow.label),
      uiCopy.outlookSuggestion(selectedRow.label),
    ]
  }, [selectedRow, uiCopy])

  const slashQuery = useMemo(() => {
    const trimmed = input.trimStart()
    if (!trimmed.startsWith("/")) return ""
    return trimmed.slice(1).toLowerCase()
  }, [input])

  const filteredSlashCommands = useMemo(() => {
    if (!slashQuery) return slashCommands
    return slashCommands.filter(
      (command) =>
        command.id.includes(slashQuery) ||
        command.title.includes(slashQuery) ||
        command.description.toLowerCase().includes(slashQuery),
    )
  }, [slashQuery])

  const isSlashPaletteOpen = input.trimStart().startsWith("/")

  useEffect(() => {
    setSlashActiveIndex(0)
  }, [slashQuery])

  const sendPrompt = async (prompt: string): Promise<boolean> => {
    const cleanedPrompt = prompt.trim()
    if (!cleanedPrompt) return false

    if (isBusy) {
      setLimitMessage("Please wait for the current analysis to finish.")
      return false
    }

    if (chatBlocked) {
      setLimitMessage("Free usage is cooling down. Please try again soon.")
      return false
    }

    setLimitMessage(null)
    await sendMessage({ text: cleanedPrompt })

    if (limit !== null) {
      setRemaining((prev) => {
        const current = prev ?? limit
        const nextRemaining = Math.max(current - 1, 0)
        if (nextRemaining === 0) {
          setCooldownBlocked(true)
        }
        return nextRemaining
      })
    }

    return true
  }

  useEffect(() => {
    const promptParam = searchParams?.get("prompt") ?? searchParams?.get("q")
    if (!promptParam) return
    if (initialPromptRef.current === promptParam) return
    initialPromptRef.current = promptParam
    setInput(promptParam)

    if (!hasConversation) {
      void sendPrompt(promptParam).then((sent) => {
        if (sent) setInput("")
      })
    }
  }, [hasConversation, searchParams, sendPrompt])

  const activateSlashCommand = async (command: SlashCommand) => {
    const prompt = command.buildPrompt({ selectedRow })
    setInput("")
    await sendPrompt(prompt)
  }

  const onInputKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault()
      const value = input.trim()
      if (!value) return
      if (value.startsWith("/") && filteredSlashCommands.length > 0) {
        const command = filteredSlashCommands[slashActiveIndex] ?? filteredSlashCommands[0]
        if (command) await activateSlashCommand(command)
      } else {
        const submitted = await sendPrompt(value)
        if (submitted) {
          setInput("")
        }
      }
      return
    }

    if (!isSlashPaletteOpen || filteredSlashCommands.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setSlashActiveIndex((current) => (current + 1) % filteredSlashCommands.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setSlashActiveIndex((current) => (current - 1 + filteredSlashCommands.length) % filteredSlashCommands.length)
      return
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault()
      const command = filteredSlashCommands[slashActiveIndex] ?? filteredSlashCommands[0]
      if (command) {
        await activateSlashCommand(command)
      }
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      setInput("")
    }
  }

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = input.trim()
    if (!value) return

    if (value.startsWith("/") && filteredSlashCommands.length > 0) {
      const command = filteredSlashCommands[slashActiveIndex] ?? filteredSlashCommands[0]
      if (command) await activateSlashCommand(command)
      return
    }

    const submitted = await sendPrompt(value)
    if (submitted) {
      setInput("")
    }
  }

  const runRiskBriefInChat = async () => {
    if (!selectedRow) return

    const prompt = selectedRow.kind === "area"
      ? uiCopy.riskBriefPrompt(selectedRow.label)
      : uiCopy.projectStressPrompt(selectedRow.label)

    await sendPrompt(prompt)
  }

  const saveToShortlist = async () => {
    if (!selectedRow) return

    setShortlistResult({ status: "saving" })
    try {
      const createRes = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Chat Shortlist ${new Date().toISOString().slice(0, 10)}` }),
      })

      const createPayload = await createRes.json().catch(() => ({}))
      if (!createRes.ok) {
        setShortlistResult({
          status: "error",
          message:
            typeof createPayload?.error === "string"
              ? createPayload.error
              : "Could not create shortlist (Team tier may be required).",
        })
        return
      }

      const watchlistId = typeof createPayload?.watchlist?.id === "string" ? createPayload.watchlist.id : ""
      if (!watchlistId) {
        setShortlistResult({ status: "error", message: "Shortlist creation returned no identifier." })
        return
      }

      const itemRes = await fetch(`/api/watchlists/${watchlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedRow.label }),
      })
      const itemPayload = await itemRes.json().catch(() => ({}))
      if (!itemRes.ok) {
        setShortlistResult({
          status: "error",
          message:
            typeof itemPayload?.error === "string"
              ? itemPayload.error
              : "Could not add selected project to shortlist.",
        })
        return
      }

      setShortlistResult({ status: "saved", message: "Selected project saved to shortlist." })
    } catch {
      setShortlistResult({ status: "error", message: "Could not save shortlist right now." })
    }
  }

  const saveReportDraft = async () => {
    const reportContent = latestAssistantText.trim()
    if (!reportContent) {
      setReportDraft({
        status: "error",
        message: "Ask a question first to generate report content.",
      })
      return
    }

    setReportDraft({ status: "saving" })
    try {
      const matchedMemoryEntry = selectedMemoryEntry ?? findBestMemoryEntry(reportContent, comprehensiveProfile.memoryEntries)
      const audience = selectedAudienceOverride || inferReportAudience(reportContent, matchedMemoryEntry)
      const chosenTemplate = selectedTemplate ?? findBestReportTemplate(
        comprehensiveProfile.reportTemplates,
        audience,
        matchedMemoryEntry,
      )

      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Chat Report - ${new Date().toLocaleString()}`,
          clientName: matchedMemoryEntry?.clientName,
          templateId: chosenTemplate?.id,
          audience,
          content: {
            transcript: reportContent,
            cards: workspaceCards,
            comparison: comparisonRows,
            risk: riskMetrics,
            generatedAt: new Date().toISOString(),
          },
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const fallbackMessage = response.status === 403
          ? "Report export requires Team tier."
          : "Could not save report right now."
        setReportDraft({
          status: "error",
          message: typeof payload?.error === "string" ? payload.error : fallbackMessage,
        })
        return
      }

      const reportId = typeof payload?.report?.id === "string" ? payload.report.id : undefined
      const enabledExports = Array.isArray(payload?.enabledExports)
        ? payload.enabledExports.filter((item: unknown): item is string => typeof item === "string")
        : undefined

      const saveContextParts = [
        chosenTemplate?.name ? `template: ${chosenTemplate.name}` : null,
        matchedMemoryEntry?.clientName ? `client: ${matchedMemoryEntry.clientName}` : null,
        audience ? `audience: ${formatReportAudienceLabel(audience)}` : null,
      ].filter((item): item is string => Boolean(item))

      setReportDraft({
        status: "saved",
        message:
          saveContextParts.length > 0
            ? `Report saved (${saveContextParts.join(" / ")}).`
            : "Report saved.",
        reportId,
        enabledExports,
      })

      // Notify ReportNudge that a new report is available
      window.dispatchEvent(new CustomEvent("entrestate:report-created"))
    } catch {
      setReportDraft({
        status: "error",
        message: "Could not save report right now.",
      })
    }
  }

  const reportDownloadHref = useMemo(() => {
    if (!reportDraft.reportId) {
      return null
    }
    const format = resolvePreferredExportFormat(reportDraft.enabledExports)
    return `/api/reports/${reportDraft.reportId}/download?format=${format}`
  }, [reportDraft.reportId, reportDraft.enabledExports])

  if (!hasConversation) {

    return (
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center"
        >
          {/* ── Badge ── */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-primary bg-primary/5 rounded-full border border-primary/10 backdrop-blur-sm shadow-inner cursor-default group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 animate-shimmer" />
              <Activity className="w-3.5 h-3.5 animate-pulse relative z-10" />
              <span className="tracking-wide uppercase relative z-10">{heroCopy.engine}</span>
              <div className="h-3 w-px bg-primary/20 mx-1 relative z-10" />
              <span className="text-primary/60 font-medium italic relative z-10">{heroCopy.feed}</span>
            </div>
          </div>

          {/* ── Headline ── */}
          <h1 className="font-serif text-4xl md:text-6xl lg:text-8xl font-medium text-foreground leading-[1.1] tracking-tight mb-8">
            <span className="inline-block hover:scale-[1.02] transition-transform duration-500">{heroCopy.titleLineOne}</span><br />
            <span className="text-muted-foreground/40 italic bg-gradient-to-r from-muted-foreground/40 via-foreground/60 to-muted-foreground/40 bg-clip-text animate-gradient-slow">{heroCopy.titleLineTwo}</span>
          </h1>

          <p className="text-lg md:text-2xl text-muted-foreground/80 max-w-3xl mb-12 font-medium leading-relaxed">
            {heroCopy.subtitle}
          </p>

          {/* ── Marquee ── */}
          <div className="w-full mb-16 select-none opacity-90 hover:opacity-100 transition-opacity">
            <MarqueePrompts onPromptSelect={(prompt) => { void sendPrompt(prompt) }} />
          </div>

          {/* ── Golden Paths ── */}
          <div className="w-full max-w-5xl mb-14">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Golden Path Shortcuts</p>
              {goldenPathLoading ? (
                <span className="text-[11px] text-muted-foreground/70">Compiling {goldenPathLoading.replace(/_/g, " ")}</span>
              ) : null}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {goldenPaths.map((path) => (
                <button
                  key={path.id}
                  type="button"
                  onClick={() => void runGoldenPath(path.id)}
                  disabled={Boolean(goldenPathLoading)}
                  className="rounded-2xl border border-border/40 bg-card/50 p-5 text-left transition-all hover:border-primary/40 hover:bg-card/70 disabled:opacity-60"
                >
                  <p className="text-sm font-semibold text-foreground">{path.label}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{path.description}</p>
                </button>
              ))}
            </div>
            {goldenPathError ? (
              <p className="mt-3 text-xs text-rose-500">{goldenPathError}</p>
            ) : null}
            {goldenPathPreviewDisplay ? (
              <div className="mt-5 rounded-[1.75rem] border border-border/50 bg-gradient-to-br from-background/95 via-card/80 to-background/70 p-5 shadow-[0_24px_80px_-48px_rgba(37,99,235,0.45)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70">
                      {locale === "ar" ? "معاينة منظمة" : "Structured preview"}
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                      {goldenPathPreviewDisplay.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {goldenPathPreviewDisplay.summary}
                    </p>
                  </div>
                  {goldenPathPreview?.metadata?.hash ? (
                    <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-mono text-muted-foreground">
                      {goldenPathPreview.metadata.hash.slice(0, 12)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-4">
                  {goldenPathPreviewDisplay.stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-border/50 bg-background/60 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                      <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {goldenPathPreviewDisplay.cards.map((card) => (
                    <article key={`${card.title}-${card.subtitle}`} className="rounded-2xl border border-border/50 bg-background/55 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{card.title}</p>
                          {card.subtitle ? (
                            <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
                          ) : null}
                        </div>
                        {card.badge ? (
                          <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[10px] font-semibold text-primary/80">
                            {card.badge}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {card.metrics.map((metric) => (
                          <div key={`${card.title}-${metric.label}`} className="rounded-xl border border-border/40 bg-background/70 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                            <p className="mt-1 text-sm font-semibold text-foreground">{metric.value}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* ── Example Chips ── */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-4xl">
            {capabilityCards.map((card) => (
              <button
                key={card.label}
                type="button"
                onClick={() => void sendPrompt(card.prompt)}
                className="px-8 py-4 bg-card/40 backdrop-blur-xl hover:bg-card border border-border/40 hover:border-primary/40 rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground transition-all shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-95 group"
              >
                <span className="flex items-center gap-2">
                  {card.label}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all rtl:rotate-180" />
                </span>
              </button>
            ))}
          </div>

          {/* ── Input Shell ── */}
          <div className="w-full max-w-3xl group mb-24 relative">
            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full opacity-50" />
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-[2rem] blur-md opacity-0 group-focus-within:opacity-100 transition duration-1000" />
              
              <div className="relative bg-card/90 backdrop-blur-2xl rounded-[1.5rem] border border-border/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] focus-within:shadow-[0_20px_60px_rgba(47,90,166,0.15)] focus-within:border-primary/40 transition-all overflow-hidden">
                <form onSubmit={submitMessage}>
                  <div className="relative min-h-[140px] p-2">
                    <Textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => { void onInputKeyDown(event) }}
                      placeholder={t("heroPlaceholder")}
                      className="min-h-[140px] w-full bg-transparent border-0 focus-visible:ring-0 resize-none py-6 px-8 text-xl relative z-10 shadow-none placeholder:text-muted-foreground/20 leading-relaxed"
                      disabled={chatBlocked}
                    />

                    {isSlashPaletteOpen ? (
                      <div className="absolute bottom-[100%] left-4 right-4 mb-4 rounded-2xl border border-border/70 bg-card/98 p-3 shadow-2xl backdrop-blur-xl z-50">
                        {filteredSlashCommands.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-muted-foreground">{t("noMatchingCommands")}</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                            {filteredSlashCommands.map((command, index) => {
                              const Icon = command.icon
                              const isActive = index === slashActiveIndex
                              return (
                                <button
                                  key={command.id}
                                  type="button"
                                  onClick={() => void activateSlashCommand(command)}
                                  className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-all ${isActive ? "bg-primary/10 border-primary/20" : "hover:bg-background border-transparent"} border`}
                                >
                                  <div className={`p-2 rounded-lg ${isActive ? "bg-primary/20" : "bg-muted/50"}`}>
                                    <Icon className="h-4 w-4 text-primary" />
                                  </div>
                                  <span>
                                    <span className="block text-xs font-bold text-foreground">{command.title}</span>
                                    <span className="block text-[11px] text-muted-foreground line-clamp-1">{command.description}</span>
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between p-4 border-t border-border/5 bg-muted/20">
                    <div className="flex gap-2 px-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent/20 rounded-xl transition-colors"
                        disabled={!canUpload}
                        title={canUpload ? "Attach file" : "Log in to attach files"}
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent/20 rounded-xl transition-colors">
                        <Globe className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-2">
                      <Button 
                        type="submit"
                        disabled={submitBlocked}
                        className="h-12 px-10 rounded-xl bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-3"
                      >
                        <Send className="h-5 w-5" />
                        <span className="font-bold text-base">{t("chatLanding.analyze")}</span>
                      </Button>
                    </motion.div>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[11px] text-muted-foreground/50 font-bold uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2 bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("chatLanding.dldStat")}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="px-3 py-1.5">{t("chatLanding.verifiedData")}</span>
            </div>
          </div>

          {/* ── Comprehensive Outputs Showcase ── */}
          <div className="w-full max-w-5xl mb-24 px-4">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-border/40" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 whitespace-nowrap">
                {t("chatLanding.comprehensiveTitle")}
              </h3>
              <div className="h-px flex-1 bg-border/40" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: t("chatLanding.outputMemoTitle"), desc: t("chatLanding.outputMemoDesc"), icon: FileText, color: "text-blue-500", bg: "bg-blue-500/5" },
                { title: t("chatLanding.outputRiskTitle"), desc: t("chatLanding.outputRiskDesc"), icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/5" },
                { title: t("chatLanding.outputCompareTitle"), desc: t("chatLanding.outputCompareDesc"), icon: Scale, color: "text-violet-500", bg: "bg-violet-500/5" }
              ].map((item, i) => (
                <motion.div 
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (i * 0.1), duration: 0.8 }}
                  className="p-8 rounded-[2.5rem] border border-border/40 bg-card/30 backdrop-blur-xl hover:border-primary/40 hover:bg-card/50 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent blur-2xl" />
                  <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h4 className="text-xl font-bold text-foreground mb-3 tracking-tight">{item.title}</h4>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Writes, brainstorms... text ── */}
          <div className="mt-12 max-w-3xl pb-20">
            <h2 className="text-4xl md:text-5xl font-serif text-foreground/90 leading-tight mb-8">
              {t("chatLanding.titleLineOne")}{" "}
              <span className="text-primary italic relative">
                {t("chatLanding.titleLineTwo")}
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary/30" />
              </span>
            </h2>
            <Link href={prefixLocalePath("/overview", locale)} className="inline-flex items-center gap-3 text-base font-bold text-primary hover:text-primary/80 transition-all group">
              {t("chatLanding.exploreEngine")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
      <section className="overflow-hidden rounded-2xl border border-border bg-card p-4 md:p-5">

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">{locale === "ar" ? "محادثة الذكاء" : "AI Chat"}</p>
            {dataFreshness ? (
              <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                {heroCopy.dataLabel}: {new Date(dataFreshness).toLocaleDateString()}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs ${status === "streaming" ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status === "streaming" ? "animate-pulse bg-primary" : "bg-emerald-400"}`} />
              {status === "streaming" ? heroCopy.analysing : heroCopy.ready}
            </span>
            <Button
              type="button"
              variant={canvasOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setCanvasOpen((current) => !current)}
              className={`h-8 px-3 text-xs lg:hidden rounded-lg transition-all flex items-center gap-1.5 ${
                canvasOpen ? "bg-primary shadow-lg shadow-primary/20 border-primary" : "hover:bg-primary/5"
              }`}
            >
              <Activity className={`h-3.5 w-3.5 ${canvasOpen ? "animate-pulse" : ""}`} />
              <span className="font-bold">{canvasOpen ? heroCopy.hideCanvas : heroCopy.showCanvas}</span>
            </Button>
          </div>
        </div>

        <div className="relative z-10 mb-3 flex flex-wrap gap-1.5">
          {commandPrompts.map((command) => {
            const Icon = command.icon
            return (
              <button
                key={command.label}
                type="button"
                onClick={() => void sendPrompt(command.prompt)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitBlocked}
              >
                <Icon className="h-3 w-3" />
                {command.label}
              </button>
            )
          })}

          {dynamicSuggestions.slice(0, 2).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void sendPrompt(suggestion)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/35 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitBlocked}
            >
              <WandSparkles className="h-3 w-3" />
              <span className="max-w-48 truncate">{suggestion}</span>
            </button>
          ))}
        </div>

        <div className="relative z-10 mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {heroCopy.systemBadge}
          </span>
        </div>

        <div id="chat-container" className="relative z-10 h-[58vh] space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-background/55 p-3 backdrop-blur-sm md:h-[60vh] lg:h-[65vh]">
          {(messages as any[]).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/75 p-4 text-sm text-muted-foreground">
              {heroCopy.emptyState}
            </div>
          ) : null}

          {(messages as any[]).map((message) => {
            const cleanMessage = message.role === "assistant"
              ? resolveAssistantDisplayText(message, locale)
              : displayMessageText(message)
            const toolTrace = message.role === "assistant" ? deriveToolTrace(message, locale) : null
            const evidenceDrawer = message.role === "assistant" ? buildEvidenceDrawerData(message) : null

            return (
              <div
                key={message.id}
                className={`animate-msg-in ${message.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[95%]"}`}
              >
                {message.role === "user" ? (
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/85 px-4 py-3 text-sm text-primary-foreground shadow-[0_4px_12px_rgba(37,99,235,0.15)] rounded-tr-sm">
                    {cleanMessage || "..."}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md px-5 py-4 text-sm text-foreground shadow-sm rounded-tl-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                    <div className="mb-3 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                        {locale === "ar" ? "محطة القرار" : "Decision Terminal"}
                      </span>
                    </div>
                    <ChatMarkdown text={cleanMessage || (locale === "ar" ? "جارٍ تشغيل التحليل..." : "Running analysis...")} />
                    {toolTrace ? (
                      <div className="mt-3 text-[10px] font-mono text-muted-foreground/70">
                        [{toolTrace}]
                      </div>
                    ) : null}
                    {evidenceDrawer?.requestId ? (
                      <div className="mt-2 text-[10px] font-mono text-muted-foreground/70">
                        request_id={evidenceDrawer.requestId}
                      </div>
                    ) : null}
                    {evidenceDrawer ? (
                      <div className="mt-4">
                        <EvidenceDrawer
                          title={locale === "ar" ? "درج الأدلة" : "Evidence Drawer"}
                          sources={evidenceDrawer.sources}
                          exclusions={evidenceDrawer.exclusions}
                          assumptions={evidenceDrawer.assumptions}
                          steps={evidenceDrawer.steps}
                          timestamp={evidenceDrawer.timestamp}
                          snapshotId="copilot-tool-trace"
                          runId={evidenceDrawer.runId}
                          snapshotTs={evidenceDrawer.snapshotTs}
                          locale={locale}
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}

          {status === "streaming" ? (
            <div className="mr-auto max-w-[92%]">
              <div className="inline-flex items-center gap-2.5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card/90 to-background/85 px-4 py-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="chat-dot-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="chat-dot-2 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="chat-dot-3 h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                {t("liveAnalysis")}
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={submitMessage} className="relative z-10 mt-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative bg-background/60 backdrop-blur-xl border border-border/80 rounded-2xl p-2 shadow-inner focus-within:border-primary/40 transition-all">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  void onInputKeyDown(event)
                }}
                placeholder={t("composerPlaceholder")}
                className="min-h-[100px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 shadow-none py-3 px-4 text-base leading-relaxed"
              />

              {isSlashPaletteOpen ? (
                <div className="absolute bottom-[100%] left-0 right-0 mb-3 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-2xl backdrop-blur-xl z-50">
                  {filteredSlashCommands.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">{t("noMatchingCommands")}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {filteredSlashCommands.map((command, index) => {
                        const Icon = command.icon
                        const isActive = index === slashActiveIndex
                        return (
                          <button
                            key={command.id}
                            type="button"
                            onClick={() => void activateSlashCommand(command)}
                            className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                              isActive ? "bg-primary/12 border-primary/20" : "hover:bg-background border-transparent"
                            } border`}
                          >
                            <div className={`p-2 rounded-lg ${isActive ? "bg-primary/20" : "bg-muted/50"}`}>
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <span>
                              <span className="block text-xs font-bold text-foreground">{command.title}</span>
                              <span className="block text-[11px] text-muted-foreground line-clamp-1">{command.description}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="flex items-center justify-between p-2 mt-2 border-t border-border/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2">
                  {usageStatusLabel}
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    type="submit" 
                    disabled={submitBlocked} 
                    className="gap-2 rounded-xl h-10 px-5 bg-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {status === "streaming" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="font-bold">{status === "streaming" ? (locale === "ar" ? "جارٍ التحليل..." : "Analysing…") : (locale === "ar" ? "إرسال" : "Send")}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {limitMessage ? (
          <p className="mt-3 text-sm text-amber-600">
            {limitMessage}
          </p>
        ) : null}

        {!limitMessage && isLimitError ? (
          <p className="mt-3 text-sm text-amber-600">
            {isArabic
              ? "الاستخدام المجاني في فترة تهدئة. حاول مجدداً بعد قليل."
              : "Free usage is cooling down. Please try again soon."}
          </p>
        ) : null}

        {error && !isLimitError ? (
          <p className="mt-3 text-sm text-red-500">
            {isArabic
              ? "تعذّر إنهاء هذا الطلب. تحقّق من الاتصال أو حاول صياغة استعلام أكثر تحديداً."
              : "We couldn't finish that request. Check your connection or try a more specific query."}
          </p>
        ) : null}
      </section>

      <aside className={`overflow-hidden rounded-2xl border border-border bg-card/90 backdrop-blur-xl p-4 md:p-6 lg:sticky lg:top-28 lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto lg:block transition-all duration-500 ${
        canvasOpen ? "block ring-2 ring-primary/20 shadow-2xl" : "hidden"
      }`}>

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{t("decisionCanvas")}</h3>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">{t("live")}</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {workspaceCards.map((card) => (
            <article
              key={card.title}
              className="rounded-xl border border-border bg-muted/30 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/50"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.title}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{card.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{card.subtitle}</p>
            </article>
          ))}
        </div>

        <div className="relative z-10 mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">{t("performanceCurves")}</p>
          </div>
          {comparisonRows.length < 2 ? (
            <p className="text-xs text-muted-foreground">{t("runComparisonQuery")}</p>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border border-border/60 bg-gradient-to-br from-card/90 to-background/80 p-2">
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">{t("investorScore")}</p>
                <svg viewBox="0 0 220 64" className="h-16 w-full">
                  <path d={buildAreaPath(scoreSparkPath)} fill="rgba(59,130,246,0.16)" />
                  <path d={scoreSparkPath} stroke="rgb(59,130,246)" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <div className="rounded-lg border border-border/60 bg-gradient-to-br from-card/90 to-background/80 p-2">
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">{t("grossYield")}</p>
                <svg viewBox="0 0 220 64" className="h-16 w-full">
                  <path d={buildAreaPath(yieldSparkPath)} fill="rgba(34,197,94,0.16)" />
                  <path d={yieldSparkPath} stroke="rgb(34,197,94)" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">{t("dldFeed")}</p>
          </div>

          {dldNotifications.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("askForDldDeals")}</p>
          ) : (
            <div className="space-y-2">
              {dldNotifications.map((txn, index) => (
                <TransactionNotification key={`chat-dld-${index}-${txn.headline}`} txn={txn} />
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">{t("compareTitle")}</p>
          </div>

          {comparisonRows.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("compareEmpty")}</p>
          ) : (
            <div className="space-y-2">
              {comparisonRows.map((row) => (
                <button
                  key={row.label}
                  type="button"
                  onClick={() => setSelectedProject(row.label)}
                  className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                    row.label === selectedProject
                      ? "border-primary/60 bg-primary/12 shadow-[0_14px_28px_-20px_rgba(37,99,235,0.5)]"
                      : "border-border/60 bg-gradient-to-br from-card/90 to-background/80 hover:border-primary/30"
                  }`}
                >
                  <p className="truncate text-xs font-medium text-foreground">{row.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {buildComparisonSubtitle(row, locale) || row.area}
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${normalizeToPercent(row.score, chartCaps.maxScore)}%` }}
                      />
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${normalizeToPercent(row.yield, chartCaps.maxYield)}%` }}
                      />
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-sky-500"
                        style={{ width: `${normalizeToPercent(row.price, chartCaps.maxPrice)}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatAed(row.price, locale)} • {locale === "ar" ? "العائد" : "Yield"} {formatMetric(row.yield, locale)}% • {locale === "ar" ? "النتيجة" : "Score"} {formatMetric(row.score, locale)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">{t("v1RiskBreakdown")}</p>
          </div>

          {!selectedRow ? (
            <p className="text-xs text-muted-foreground">{t("selectProjectForRisk")}</p>
          ) : (
            <>
              <p className="text-xs font-medium text-foreground">{selectedRow.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {selectedRow.kind === "area"
                  ? buildComparisonSubtitle(selectedRow, locale)
                  : [selectedRow.area, selectedRow.developer].filter((part) => part && part !== "-").join(" • ")}
              </p>

              {riskMetrics ? (
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {riskMetrics.map((item) => (
                    <div key={item.label} className="rounded-lg border border-border/50 bg-background/40 px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                      <p className="mt-0.5 text-xs font-semibold tabular-nums text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <Button type="button" className="mt-3 w-full gap-1.5" variant="secondary" onClick={() => void runRiskBriefInChat()}>
                <TrendingUp className="h-3.5 w-3.5" />
                {t("openRiskBrief")}
              </Button>

              <Button type="button" className="mt-2 w-full gap-1.5" variant="outline" onClick={() => void saveToShortlist()}>
                <BookmarkPlus className="h-3.5 w-3.5" />
                {t("saveToWatchlist")}
              </Button>

              {shortlistResult.message ? (
                <p className={`mt-2 text-xs ${shortlistResult.status === "error" ? "text-amber-600" : "text-muted-foreground"}`}>
                  {shortlistResult.message}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="relative z-10 mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">{t("reportExport")}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("reportExportDescription")}
          </p>

          <div className="mt-3 space-y-2.5">
            <label className="block text-[11px] text-muted-foreground">
              {t("clientContext")}
              <select
                value={selectedMemoryEntryId}
                onChange={(event) => setSelectedMemoryEntryId(event.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs text-foreground"
              >
                <option value="">{t("autoDetect")}</option>
                {comprehensiveProfile.memoryEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.clientName.trim() || t("untitledClient")}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[11px] text-muted-foreground">
              {t("reportTemplate")}
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs text-foreground"
              >
                <option value="">{t("autoSelectTemplate")}</option>
                {comprehensiveProfile.reportTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {(template.name.trim() || t("untitledTemplate")) +
                      ` (${formatReportAudienceLabel(template.audience)})`}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[11px] text-muted-foreground">
              {t("audience")}
              <select
                value={selectedAudienceOverride}
                onChange={(event) =>
                  setSelectedAudienceOverride(event.target.value as "" | ComprehensiveProfileReportAudience)
                }
                className="mt-1 h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs text-foreground"
              >
                <option value="">{t("autoInfer")}</option>
                <option value="client">{t("client")}</option>
                <option value="social">{t("social")}</option>
                <option value="investor">{t("investor")}</option>
                <option value="executive">{t("executive")}</option>
              </select>
            </label>
          </div>

          <Button
            type="button"
            onClick={saveReportDraft}
            disabled={reportDraft.status === "saving"}
            className="mt-3 w-full"
            variant="secondary"
          >
            {reportDraft.status === "saving" ? t("savingReport") : t("saveReportDraft")}
          </Button>
          <Button
            type="button"
            onClick={async () => {
              const chatContent = document.getElementById('chat-container');
              if (chatContent) {
                const pdf = await generateMediaRichReport(chatContent.outerHTML);
                const link = document.createElement('a');
                link.href = pdf;
                link.download = 'media-report.pdf';
                link.click();
              }
            }}
            disabled={reportDraft.status === "saving"}
            className="mt-3 w-full"
            variant="secondary"
          >
            {t("downloadMediaReport")}
          </Button>

          {reportDraft.message ? (
            <p className={`mt-2 text-xs ${reportDraft.status === "error" ? "text-amber-600" : "text-muted-foreground"}`}>
              {reportDraft.message}
            </p>
          ) : null}

          {reportDownloadHref ? (
            <Link
              href={reportDownloadHref}
              className="mt-2 inline-block text-xs text-primary underline"
            >
              {t("downloadReport")}
            </Link>
          ) : null}
        </div>

        {latestAssistantText ? (
          <div className="relative z-10 mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("latestOutput")}</p>
            <p className="mt-2 line-clamp-6 text-xs text-foreground">{latestAssistantText}</p>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
