"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useLocale } from "next-intl"
import { ArrowRight } from "lucide-react"
import { StressGradeBadge, TimingSignalBadge } from "@/components/decision/badges"
import { formatScore, formatYield } from "@/components/decision/formatters"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { cn } from "@/lib/utils"

type VerdictCardProps = {
  name: string
  area?: string | null
  verdict?: string | null
  confidence?: number | null
  yieldValue?: number | null
  stress?: string | null
  timing?: string | null
  score?: number | null
  evidenceLevel?: string | null
  sources?: string[]
  positiveDrivers?: string[]
  negativeDrivers?: string[]
  jsonPayload?: Record<string, unknown> | null
  href?: string
  gated?: boolean
  compact?: boolean
}

function normalizeConfidence(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  return value <= 1 ? value * 100 : value
}

function verdictTone(verdict: string | null | undefined) {
  const value = (verdict ?? "").toUpperCase()
  if (value === "STRONG_BUY") return "bg-[#085041] text-[#9FE1CB]"
  if (value === "BUY") return "border border-[#C0DD97] bg-[#EAF3DE] text-[#27500A]"
  if (value === "HOLD") return "border border-[#FAC775] bg-[#FAEEDA] text-[#633806]"
  if (value === "WAIT") return "border border-[#D3D1C7] bg-[#F1EFE8] text-[#444441]"
  if (value === "AVOID") return "border border-[#F7C1C1] bg-[#FCEBEB] text-[#791F1F]"
  return "border border-border bg-muted/40 text-muted-foreground"
}

function evidenceTone(level: string | null | undefined) {
  const value = (level ?? "").toUpperCase()
  if (value.startsWith("L1")) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
  if (value.startsWith("L2")) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
  if (value.startsWith("L3")) return "border-amber-500/30 bg-amber-500/10 text-amber-300"
  if (value.startsWith("L4")) return "border-orange-500/30 bg-orange-500/10 text-orange-300"
  return "border-red-500/30 bg-red-500/10 text-red-300"
}

function evidenceMeaning(level: string | null | undefined, isArabic: boolean): string | null {
  const value = (level ?? "").toUpperCase()
  if (value.startsWith("L1")) return isArabic ? "DLD موثّق — جاهز للتدقيق" : "DLD-verified · audit-ready"
  if (value.startsWith("L2")) return isArabic ? "مصادر متعددة متطابقة" : "Multi-source cross-checked"
  if (value.startsWith("L3")) return isArabic ? "إشارة سوق — تحقّق يدوي" : "Market signal · verify before acting"
  if (value.startsWith("L4")) return isArabic ? "تقدير نموذجي" : "Model-estimated"
  if (value.length > 0) return isArabic ? "دليل محدود — احذر" : "Thin evidence · caution"
  return null
}

export function VerdictCard({
  name,
  area,
  verdict,
  confidence,
  yieldValue,
  stress,
  timing,
  score,
  evidenceLevel,
  sources = [],
  positiveDrivers = [],
  negativeDrivers = [],
  jsonPayload,
  href,
  gated = false,
  compact = false,
}: VerdictCardProps) {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const [showJson, setShowJson] = useState(false)
  const confidencePercent = normalizeConfidence(confidence)
  const resolvedHref = href ? prefixLocalePath(href, locale) : null
  const drivers = useMemo(
    () => ({
      positive: positiveDrivers.slice(0, compact ? 2 : 3),
      negative: negativeDrivers.slice(0, compact ? 1 : 3),
    }),
    [compact, negativeDrivers, positiveDrivers],
  )
  const payloadText = jsonPayload ? JSON.stringify(jsonPayload, null, 2) : ""

  return (
    <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.65)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-foreground">{name}</p>
          {area ? <p className="mt-1 text-sm text-muted-foreground">{area}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
              verdictTone(verdict),
              gated && "blur-[4px] select-none",
            )}
          >
            {verdict ?? (isArabic ? "مقفل" : "Locked")}
          </span>
          {confidencePercent !== null ? (
            <span className={cn("text-sm font-semibold text-foreground", gated && "blur-[4px] select-none")}>
              {Math.round(confidencePercent)}%
            </span>
          ) : null}
        </div>
      </div>

      {confidencePercent !== null ? (
        <div className="mt-4 h-2 rounded-full bg-muted">
          <div
            className={cn("h-2 rounded-full bg-primary transition-all", gated && "blur-[4px]")}
            style={{ width: `${Math.max(0, Math.min(confidencePercent, 100))}%` }}
          />
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
          <p className="text-[11px] text-muted-foreground">{isArabic ? "العائد" : "Yield"}</p>
          <p className="mt-1 text-base font-semibold text-foreground">{formatYield(yieldValue, locale)}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
          <p className="text-[11px] text-muted-foreground">{isArabic ? "الضغط" : "Stress"}</p>
          <div className="mt-2">
            <StressGradeBadge grade={stress} />
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
          <p className="text-[11px] text-muted-foreground">{isArabic ? "النتيجة" : "Score"}</p>
          <p className="mt-1 text-base font-semibold text-foreground">{formatScore(score, locale)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TimingSignalBadge signal={timing} />
        {evidenceLevel ? (
          <span
            className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", evidenceTone(evidenceLevel))}
            title={evidenceMeaning(evidenceLevel, isArabic) ?? undefined}
          >
            <span>{isArabic ? `الأدلة ${evidenceLevel}` : `Evidence ${evidenceLevel}`}</span>
            {evidenceMeaning(evidenceLevel, isArabic) ? (
              <span className="text-[10px] font-normal opacity-80">· {evidenceMeaning(evidenceLevel, isArabic)}</span>
            ) : null}
          </span>
        ) : null}
        {sources.slice(0, 4).map((source) => (
          <span key={source} className="rounded-full border border-border/60 bg-background/70 px-2.5 py-0.5 text-xs text-muted-foreground">
            {source}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {gated ? (
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-sm text-muted-foreground">
              {isArabic ? "سجّل الدخول لرؤية الحكم الكامل ومحركات القرار." : "Sign in to see the full verdict and decision drivers."}
            </p>
            <Link
              href={prefixLocalePath("/pricing", locale)}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
            >
              {isArabic ? "ابدأ التجربة" : "Start free trial"}
              <ArrowRight className={isArabic ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
            </Link>
          </div>
        ) : (
          <>
            {drivers.positive.map((driver) => (
              <div key={driver} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-foreground">
                <span className="font-semibold text-emerald-400">↑ </span>
                {driver}
              </div>
            ))}
            {drivers.negative.map((driver) => (
              <div key={driver} className="rounded-2xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-foreground">
                <span className="font-semibold text-red-400">↓ </span>
                {driver}
              </div>
            ))}
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        {jsonPayload ? (
          <button
            type="button"
            onClick={() => setShowJson((current) => !current)}
            className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground"
          >
            {showJson ? (isArabic ? "عرض البطاقة" : "Card view") : "Raw JSON"}
          </button>
        ) : <span />}
        {resolvedHref ? (
          <Link href={resolvedHref} className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80">
            {isArabic ? "اعرض التحليل الكامل" : "View full analysis"}
            <ArrowRight className={isArabic ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
          </Link>
        ) : null}
      </div>

      {showJson && payloadText ? (
        <pre className="mt-4 max-h-80 overflow-auto rounded-2xl border border-border/60 bg-background/70 p-4 text-[11px] leading-relaxed text-foreground/80">
          {payloadText}
        </pre>
      ) : null}
    </div>
  )
}
