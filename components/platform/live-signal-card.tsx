"use client"

import Link from "next/link"
import { useLocale } from "next-intl"
import { ArrowRight } from "lucide-react"
import { TimingSignalBadge, StressGradeBadge } from "@/components/decision/badges"
import { formatAed, formatScore, formatYield } from "@/components/decision/formatters"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type LiveSignalCardProps = {
  title: string
  area?: string | null
  developer?: string | null
  timing?: string | null
  stress?: string | null
  yieldValue?: number | null
  score?: number | null
  price?: number | null
  updatedLabel?: string | null
  slug?: string | null
}

export function LiveSignalCard({
  title,
  area,
  developer,
  timing,
  stress,
  yieldValue,
  score,
  price,
  updatedLabel,
  slug,
}: LiveSignalCardProps) {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const href = prefixLocalePath(`/properties/${slug ?? ""}`, locale)

  return (
    <div className="rounded-[28px] border border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(15,23,42,0.12))] p-5 shadow-[0_24px_80px_-48px_rgba(16,185,129,0.55)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.45)]" />
          {isArabic ? "أعلى إشارة حية" : "Top live signal"}
        </div>
        {updatedLabel ? (
          <span className="text-[11px] text-muted-foreground">{updatedLabel}</span>
        ) : null}
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {[area, developer].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <TimingSignalBadge signal={timing} />
        <StressGradeBadge grade={stress} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
          <p className="text-[11px] text-muted-foreground">{isArabic ? "درجة الاستثمار" : "Investment Score"}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{formatScore(score, locale)}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
          <p className="text-[11px] text-muted-foreground">{isArabic ? "العائد" : "Yield"}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{formatYield(yieldValue, locale)}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
          <p className="text-[11px] text-muted-foreground">{isArabic ? "سعر الدخول" : "Entry price"}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{formatAed(price, locale, { compact: true })}</p>
        </div>
      </div>

      {slug ? (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
        >
          {isArabic ? "اعرض هذا المشروع" : "View this project"}
          <ArrowRight className={isArabic ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
        </Link>
      ) : null}
    </div>
  )
}
