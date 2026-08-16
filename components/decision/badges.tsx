"use client"

import { useLocale } from "next-intl"
import { cn } from "@/lib/utils"

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

const CONFIDENCE_LABELS_AR: Record<string, string> = {
  HIGH: "عالية",
  MEDIUM: "متوسطة",
  LOW: "منخفضة",
  UNKNOWN: "غير محدد",
}

function baseClassName(colorClass: string) {
  return cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", colorClass)
}

function normalizeBadgeValue(value: string | number | null | undefined, fallback: string) {
  if (value === null || value === undefined) return fallback
  return String(value)
}

function formatBadgeLabel(locale: string, value: string, arabicLabel?: string) {
  if (locale !== "ar" || !arabicLabel) return value
  return arabicLabel
}

export function TimingSignalBadge({ signal }: { signal: string | null | undefined }) {
  const locale = useLocale()
  const value = normalizeBadgeValue(signal, "UNKNOWN").toUpperCase()
  const tone =
    value === "STRONG_BUY"
      ? "border-emerald-600/50 bg-emerald-600/15 text-emerald-200"
      : value === "BUY"
        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
        : value === "HOLD"
          ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
          : value === "WAIT"
            ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
            : "border-red-500/50 bg-red-500/10 text-red-300"

  return <span className={baseClassName(tone)}>{formatBadgeLabel(locale, value, SIGNAL_LABELS_AR[value])}</span>
}

export function StressGradeBadge({ grade }: { grade: string | null | undefined }) {
  const locale = useLocale()
  const value = normalizeBadgeValue(grade, "NOT AVAILABLE").toUpperCase()
  const tone =
    value === "A"
      ? "border-emerald-600/50 bg-emerald-600/10 text-emerald-300"
      : value === "B"
        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
        : value === "C"
          ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
          : value === "D"
            ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
            : "border-red-500/50 bg-red-500/10 text-red-300"
  const label = locale === "ar"
    ? formatBadgeLabel(locale, value, STRESS_LABELS_AR[value])
    : `Grade ${value}`

  return <span className={baseClassName(tone)}>{label}</span>
}

export function ConfidenceBadge({ confidence }: { confidence: string | null | undefined }) {
  const locale = useLocale()
  const value = normalizeBadgeValue(confidence, "UNKNOWN").toUpperCase()
  const tone =
    value === "HIGH"
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
      : value === "MEDIUM"
        ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
        : "border-slate-500/50 bg-slate-500/10 text-slate-300"
  return <span className={baseClassName(tone)}>{formatBadgeLabel(locale, value, CONFIDENCE_LABELS_AR[value])}</span>
}
