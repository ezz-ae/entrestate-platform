"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { useLocale } from "next-intl"
import { formatAed, formatScore, formatYield } from "@/components/decision/formatters"
import { pickLocalizedText } from "@/lib/format/entities"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

const SIGNAL_LABELS_AR: Record<string, string> = {
  STRONG_BUY: "شراء قوي",
  BUY: "شراء",
  HOLD: "احتفاظ",
  WAIT: "انتظار",
  AVOID: "تجنب",
}

const STRESS_LABELS_AR: Record<string, string> = {
  A: "ممتاز",
  B: "جيد",
  C: "متوسط",
  D: "ضعيف",
  E: "خطر",
}

type ProjectCardProps = {
  slug: string
  name: string
  area?: string | null
  area_ar?: string | null
  developer?: string | null
  developer_ar?: string | null
  price_from?: number | null
  rental_yield?: number | null
  stress_grade_v1?: string | null
  timing_label?: string | null
  decision_label_v1?: string | null
  investor_score_v1?: number | null
  l1_canonical_price?: number | null
  l1_canonical_yield?: number | null
  l2_stress_test_grade?: string | null
  l3_timing_signal?: string | null
  engine_god_metric?: number | null
  l1_confidence?: string | null
  apiPreview?: Record<string, unknown>
}

function timingAccent(signal: string | null | undefined) {
  const s = (signal ?? "").toUpperCase()
  if (s === "BUY") return { border: "border-l-emerald-500", dot: "bg-emerald-500", label: "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" }
  if (s === "HOLD") return { border: "border-l-amber-500", dot: "bg-amber-500", label: "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" }
  if (s === "WAIT") return { border: "border-l-red-400", dot: "bg-red-400", label: "border-red-400/40 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300" }
  return { border: "border-l-border/40", dot: "bg-muted-foreground/30", label: "border-border/40 bg-muted/30 text-muted-foreground" }
}

function gradeColor(grade: string | null | undefined) {
  const g = (grade ?? "").toUpperCase()
  if (g === "A") return "text-emerald-600 dark:text-emerald-400"
  if (g === "B") return "text-emerald-500 dark:text-emerald-300"
  if (g === "C") return "text-amber-600 dark:text-amber-400"
  if (g === "D") return "text-orange-600 dark:text-orange-400"
  return "text-muted-foreground"
}

function formatCanonicalArabicLabel(locale: AppLocale, value: string, labels: Record<string, string>) {
  if (locale !== "ar") return value
  return labels[value] ? `${value} · ${labels[value]}` : value
}

function normalizeVerdict(value: string | null | undefined) {
  const normalized = (value ?? "").toUpperCase()
  if (normalized === "STRONG_BUY") return "BUY"
  if (["BUY", "HOLD", "WAIT", "AVOID"].includes(normalized)) return normalized
  return null
}

function verdictTone(verdict: string | null) {
  if (verdict === "BUY") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
  if (verdict === "HOLD") return "border-amber-500/40 bg-amber-500/10 text-amber-300"
  if (verdict === "WAIT") return "border-red-500/40 bg-red-500/10 text-red-300"
  if (verdict === "AVOID") return "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300"
  return "border-border/40 bg-muted/30 text-muted-foreground"
}

function normalizeEvidenceLevel(value: string | null | undefined) {
  const normalized = value?.toUpperCase()
  if (!normalized) return "L4"
  return /^L[1-5]$/.test(normalized) ? normalized : "L4"
}

function buildEvidenceLink(slug?: string, name?: string) {
  const base = slug || name || "decision"
  return `/evidence/${encodeURIComponent(base)}`
}

export function ProjectCard(project: ProjectCardProps) {
  const locale = useLocale() as AppLocale
  const [showApi, setShowApi] = useState(false)
  const price = project.price_from ?? project.l1_canonical_price ?? null
  const yieldValue = project.rental_yield ?? project.l1_canonical_yield ?? null
  const score = project.investor_score_v1 ?? project.engine_god_metric ?? null
  const timing = project.timing_label ?? project.l3_timing_signal ?? null
  const stressGrade = project.stress_grade_v1 ?? project.l2_stress_test_grade ?? null
  const areaLabel = pickLocalizedText(locale, project.area_ar, project.area, "")
  const developerLabel = pickLocalizedText(locale, project.developer_ar, project.developer, "")
  const copy = locale === "ar"
    ? {
        detailsPending: "التفاصيل قيد الاستكمال",
        yield: "العائد",
        grade: "الدرجة",
        score: "النتيجة",
        apiResponse: "استجابة API",
        cardView: "عرض البطاقة",
        verdict: "الحكم",
      }
    : {
        detailsPending: "Details pending",
        yield: "Yield",
        grade: "Grade",
        score: "Score",
        apiResponse: "API Response",
        cardView: "Card View",
        verdict: "Verdict",
      }

  const accent = timingAccent(timing)
  const signal = (timing ?? "—").toUpperCase()
  const grade = stressGrade?.toUpperCase() ?? null
  const signalLabel = formatCanonicalArabicLabel(locale, signal, SIGNAL_LABELS_AR)
  const gradeLabel = grade ? formatCanonicalArabicLabel(locale, grade, STRESS_LABELS_AR) : "—"
  const verdict = normalizeVerdict(project.decision_label_v1 ?? timing)
  const apiPreview = project.apiPreview
  const apiPreviewText = useMemo(() => {
    if (!apiPreview) return ""
    return JSON.stringify(apiPreview, null, 2)
  }, [apiPreview])
  const evidenceLevel = normalizeEvidenceLevel(project.apiPreview?.evidence_level ?? project.evidence_level)
  const evidenceHref = prefixLocalePath(buildEvidenceLink(project.slug, project.name), locale)

  return (
    <Link
      href={prefixLocalePath(`/properties/${project.slug}`, locale)}
      className={`group relative block overflow-hidden rounded-2xl border border-border bg-card border-l-4 ${accent.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)]`}
    >
      {/* Top section — always visible */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${accent.label}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
              {signalLabel}
            </span>
            {verdict ? (
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${verdictTone(verdict)}`}>
                {copy.verdict}: {verdict}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {apiPreview ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setShowApi((prev) => !prev)
                }}
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest transition ${
                  showApi
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/60 bg-muted/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
                aria-pressed={showApi}
              >
                {showApi ? copy.cardView : copy.apiResponse}
              </button>
            ) : null}
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 opacity-0 transition-all duration-200 group-hover:opacity-100">
              <ArrowUpRight className="h-3.5 w-3.5 text-foreground" />
            </span>
          </div>
        </div>

        {/* Project name */}
        <p className="mt-3 text-base font-semibold leading-snug text-foreground line-clamp-2">{project.name}</p>

        {/* Location + developer */}
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {[areaLabel, developerLabel].filter(Boolean).join(" · ") || copy.detailsPending}
        </p>

        {/* Price — always visible */}
        <p className="mt-4 text-xl font-bold tabular-nums text-foreground">
          {formatAed(price, locale)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] leading-tight text-muted-foreground">
          <span className="rounded-full border border-border/40 px-3 py-1 text-xs uppercase tracking-[0.2em]">
            Evidence {evidenceLevel}
          </span>
          <Link
            href={evidenceHref}
            className="rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary transition hover:bg-primary/10"
          >
            View Evidence Drawer
          </Link>
        </div>
      </div>

      {showApi && apiPreviewText ? (
        <div
          className="px-5 pb-5"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
        >
          <div className="rounded-xl border border-border/60 bg-background/60 p-4">
            <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-foreground/80">
              {apiPreviewText}
            </pre>
          </div>
        </div>
      ) : (
        <>
          {/* Divider */}
          <div className="mx-5 h-px bg-border/60" />

          {/* Hover-reveal section */}
          <div className="translate-y-2 overflow-hidden opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="grid grid-cols-3 gap-px bg-border/40 border-t-0">
              <div className="bg-card px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{copy.yield}</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{formatYield(yieldValue, locale)}</p>
              </div>
              <div className="bg-card px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{copy.grade}</p>
                <p className={`mt-0.5 text-sm font-bold tabular-nums ${gradeColor(grade)}`}>{gradeLabel}</p>
              </div>
              <div className="bg-card px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{copy.score}</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{formatScore(score, locale)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </Link>
  )
}
