"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { Activity, ArrowUpRight, ShieldCheck } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import type { MarketScoreSummary, SystemHealthcheckRow } from "@/lib/market-score/types"
import { formatDate } from "@/lib/format/date"
import { formatInteger } from "@/lib/format/number"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

const HISTORICAL_MEDIAN_SCORE = 58
const WATCH_THRESHOLD_SCORE = 45
const FRESH_HOURS = 4
const STALE_HOURS = 24

function freshnessTone(createdAt: string | null | undefined) {
  if (!createdAt) return { dot: "bg-muted-foreground/40", ringAlpha: "0.2" }
  const ts = new Date(createdAt).getTime()
  if (!Number.isFinite(ts)) return { dot: "bg-muted-foreground/40", ringAlpha: "0.2" }
  const ageHours = (Date.now() - ts) / (1000 * 60 * 60)
  if (ageHours < FRESH_HOURS) return { dot: "bg-emerald-400", ringAlpha: "0.5" }
  if (ageHours < STALE_HOURS) return { dot: "bg-amber-400", ringAlpha: "0.5" }
  return { dot: "bg-rose-400", ringAlpha: "0.5" }
}

export function MarketPulsePopover({ className, compact = false }: { className?: string; compact?: boolean }) {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const t = (en: string, ar: string) => (isArabic ? ar : en)
  const [mounted, setMounted] = useState(false)
  const [summary, setSummary] = useState<MarketScoreSummary | null>(null)
  const [healthcheck, setHealthcheck] = useState<SystemHealthcheckRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    let isMounted = true

    const loadPulse = async () => {
      try {
        const [summaryRes, healthRes] = await Promise.all([
          fetch("/api/market-score/summary", { cache: "no-store" }),
          fetch("/api/market-score/healthcheck", { cache: "no-store" }),
        ])
        if (!summaryRes.ok || !healthRes.ok) throw new Error("Pulse fetch failed")
        const summaryData = await summaryRes.json()
        const healthData = await healthRes.json()
        if (!isMounted) return
        setSummary(summaryData)
        setHealthcheck(healthData.healthcheck || null)
      } catch (error) {
        console.error("Market pulse error:", error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadPulse()
    return () => {
      isMounted = false
    }
  }, [])

  const topBands = useMemo(() => {
    if (!summary?.safetyDistribution) return []
    return [...summary.safetyDistribution]
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
  }, [summary])

  const avgScore = summary ? Math.round(summary.avgScore) : null
  const interpretation = useMemo(() => {
    if (avgScore === null) return null
    if (avgScore >= HISTORICAL_MEDIAN_SCORE) {
      return {
        tone: "text-emerald-400",
        copy: t(
          `Above historical median (${HISTORICAL_MEDIAN_SCORE}) — inventory leaning constructive.`,
          `فوق الوسيط التاريخي (${HISTORICAL_MEDIAN_SCORE}) — المخزون يميل إلى الإيجابية.`,
        ),
      }
    }
    if (avgScore >= WATCH_THRESHOLD_SCORE) {
      return {
        tone: "text-amber-400",
        copy: t(
          `Below historical median — selective positioning advised.`,
          `تحت الوسيط التاريخي — يُنصح بتموضع انتقائي.`,
        ),
      }
    }
    return {
      tone: "text-rose-400",
      copy: t(
        `Below watch threshold (${WATCH_THRESHOLD_SCORE}) — defer non-essential entries.`,
        `تحت عتبة المراقبة (${WATCH_THRESHOLD_SCORE}) — أجِّل الدخول غير الضروري.`,
      ),
    }
  }, [avgScore, isArabic])

  const fresh = freshnessTone(healthcheck?.created_at)

  const triggerClasses = compact
    ? `inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${
        className ?? ""
      }`
    : `hidden lg:inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 ${
        className ?? ""
      }`

  if (!mounted) {
    return (
      <button
        className={triggerClasses}
        aria-label={t("Market pulse", "نبض السوق")}
      >
        <Activity className="h-3.5 w-3.5 text-accent" />
        {!compact ? t("Market pulse", "نبض السوق") : null}
      </button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={triggerClasses}
          aria-label={t("Market pulse", "نبض السوق")}
        >
          <Activity className="h-3.5 w-3.5 text-accent" />
          {!compact ? t("Market pulse", "نبض السوق") : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("Market pulse", "نبض السوق")}</p>
            <p className="text-sm font-semibold text-foreground">{t("Live inventory snapshot", "لقطة حية للمخزون")}</p>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            {healthcheck?.passing_count ?? "—"}/{healthcheck?.total_count ?? "—"}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-3">
          {loading ? (
            <p className="text-xs text-muted-foreground">{t("Loading pulse…", "جارٍ تحميل النبض…")}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("Assets scored", "الأصول المصنفة")}</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatInteger(summary?.totalAssets, locale)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("Average score", "متوسط الدرجة")}</span>
                <span className="text-sm font-semibold text-foreground">
                  {avgScore ?? "—"}
                </span>
              </div>
              {interpretation ? (
                <p className={`text-[11px] leading-relaxed ${interpretation.tone}`}>{interpretation.copy}</p>
              ) : null}
              {topBands.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topBands.map((band) => (
                    <Badge key={band.label} className="bg-secondary text-foreground" variant="secondary">
                      {band.label}: {band.count}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={`h-1.5 w-1.5 rounded-full ${fresh.dot}`}
            style={{ boxShadow: `0 0 6px 2px rgba(255,255,255,${fresh.ringAlpha})` }}
          />
          {t("Updated", "آخر تحديث")}{" "}
          {healthcheck?.created_at
            ? formatDate(healthcheck.created_at, locale, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : t("recently", "مؤخراً")}
          .
        </p>

        <div className="mt-4 flex items-center justify-between">
          <Link href={prefixLocalePath("/market-score", locale)} className="text-xs text-accent hover:text-accent/80">
            {t("View score dashboard", "عرض لوحة الدرجة")}
          </Link>
          <Link href={prefixLocalePath("/agent-runtime", locale)} className="inline-flex items-center gap-1 text-xs text-foreground">
            {t("Open match desk", "افتح مكتب المطابقة")}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
