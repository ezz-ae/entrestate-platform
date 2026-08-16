"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { useMemo, useState } from "react"
import { useLocale } from "next-intl"
import { formatAed } from "@/components/decision/formatters"
import { pickLocalizedText } from "@/lib/format/entities"
import { formatInteger } from "@/lib/format/number"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type DeveloperCardProps = {
  slug: string
  developer: string
  developer_ar?: string | null
  projects?: number | null
  reliability?: number | null
  tier?: string | null
  avg_price?: number | null
  /** @deprecated Not displayed — yield at developer scope is not meaningful and was previously mis-sourced. Keep prop optional for back-compat. */
  avg_yield?: number | null
  safe_projects?: number | null
  logo_url?: string | null
  top_areas?: string[] | null
  top_projects?: string[] | null
  apiPreview?: Record<string, unknown>
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

type ReliabilityTierKey = "excellent" | "good" | "watch" | "unknown"

function reliabilityConfig(score: number | null): {
  bar: string
  text: string
  label: string
  tier: string
  tierKey: ReliabilityTierKey
} {
  if (score === null) return { bar: "bg-muted", text: "text-muted-foreground", label: "—", tier: "", tierKey: "unknown" }
  if (score >= 80) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: `${score.toFixed(0)}`, tier: "Excellent", tierKey: "excellent" }
  if (score >= 60) return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", label: `${score.toFixed(0)}`, tier: "Good", tierKey: "good" }
  return { bar: "bg-red-500", text: "text-red-600 dark:text-red-400", label: `${score.toFixed(0)}`, tier: "Watch", tierKey: "watch" }
}

function trajectoryCopy(tierKey: ReliabilityTierKey, isArabic: boolean): string | null {
  if (tierKey === "excellent") return isArabic ? "فوق أرضية الـ80" : "Above 80 floor"
  if (tierKey === "good") return isArabic ? "ضمن نطاق التحمّل" : "Within tolerance band"
  if (tierKey === "watch") return isArabic ? "قرب عتبة المراقبة — تابع" : "Near watch threshold — monitor"
  return null
}

function trajectoryTone(tierKey: ReliabilityTierKey): string {
  if (tierKey === "excellent") return "text-emerald-600 dark:text-emerald-400"
  if (tierKey === "good") return "text-amber-600 dark:text-amber-400"
  if (tierKey === "watch") return "text-rose-600 dark:text-rose-400"
  return "text-muted-foreground"
}

function getDeveloperInitials(name: string) {
  const cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z\u0600-\u06FF\s]+/g, " ")
    .trim()
    .split(/\s+/)
  if (cleaned.length === 0) return "ES"
  if (cleaned.length === 1) return cleaned[0].slice(0, 2).toUpperCase()
  return (cleaned[0][0] + cleaned[1][0]).toUpperCase()
}

export function DeveloperCard(developer: DeveloperCardProps) {
  const locale = useLocale() as AppLocale
  const [showApi, setShowApi] = useState(false)
  const topAreas = Array.isArray(developer.top_areas) ? developer.top_areas.slice(0, 3) : []
  const topProjects = Array.isArray(developer.top_projects) ? developer.top_projects.slice(0, 3) : []
  const relScore = typeof developer.reliability === "number" ? developer.reliability : null
  const relPct = relScore !== null ? Math.min(Math.max(relScore, 0), 100) : 0
  const rel = reliabilityConfig(relScore)
  const tier = typeof developer.tier === "string" && developer.tier.trim().length > 0 ? developer.tier.toUpperCase() : null
  const developerLabel = pickLocalizedText(locale, developer.developer_ar, developer.developer)
  const apiPreviewText = useMemo(() => {
    if (!developer.apiPreview) return ""
    return JSON.stringify(developer.apiPreview, null, 2)
  }, [developer.apiPreview])
  const localizedTopAreas = topAreas.map((areaName) => ({
    slug: slugify(areaName),
    label: pickLocalizedText(locale, null, areaName, areaName),
    value: areaName,
  }))
  const copy = locale === "ar"
    ? {
        projects: "مشاريع مكتملة",
        deliveryReliability: "موثوقية التسليم",
        tier: "الفئة",
        avgTicket: "متوسط حجم التذكرة",
        safeCoverage: "تغطية المشاريع الآمنة",
        activeAreas: "المناطق النشطة",
        keyProjects: "أهم المشاريع",
        apiResponse: "استجابة API",
        cardView: "عرض البطاقة",
        openDetails: `فتح تفاصيل المطور ${developerLabel}`,
      }
    : {
        projects: "completed projects",
        deliveryReliability: "Delivery Reliability",
        tier: "Tier",
        avgTicket: "Avg Ticket Size",
        safeCoverage: "Safe Project Coverage",
        activeAreas: "Active Areas",
        keyProjects: "Key Projects",
        apiResponse: "API Response",
        cardView: "Card View",
        openDetails: `Open ${developerLabel} developer details`,
      }

 return (
    <article className="group relative isolate block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 p-5 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo / icon */}
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/50 bg-cover bg-center"
            style={{ backgroundImage: developer.logo_url ? `url(${developer.logo_url})` : undefined }}
          >
            {!developer.logo_url ? (
              <span className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-semibold uppercase tracking-widest text-primary">
                {getDeveloperInitials(developerLabel)}
              </span>
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{developerLabel}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <p>
                {formatInteger(developer.projects, locale)} {copy.projects}
              </p>
              {tier ? (
                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground/80">
                  {copy.tier}: {tier}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {apiPreviewText ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setShowApi((prev) => !prev)
              }}
              className={`relative z-30 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest transition ${
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

      {/* Body */}
      <div className="p-5">
        {/* Reliability bar */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{copy.deliveryReliability}</p>
            <div className="flex items-center gap-1.5">
              {rel.tier ? (
                <span className="text-[10px] text-muted-foreground">{rel.tier}</span>
              ) : null}
              <span className={`text-sm font-bold tabular-nums ${rel.text}`}>{rel.label}</span>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${rel.bar}`}
              style={{ width: `${relPct}%` }}
            />
          </div>
          {trajectoryCopy(rel.tierKey, locale === "ar") ? (
            <p className={`mt-1.5 text-[11px] font-medium ${trajectoryTone(rel.tierKey)}`}>
              {trajectoryCopy(rel.tierKey, locale === "ar")}
            </p>
          ) : null}
        </div>

        {/* Avg ticket + safe coverage */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{copy.avgTicket}</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{formatAed(developer.avg_price, locale)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{copy.safeCoverage}</p>
            {(() => {
              const safe = typeof developer.safe_projects === "number" ? developer.safe_projects : null
              const total = typeof developer.projects === "number" ? developer.projects : null
              if (safe === null || total === null || total <= 0) {
                return <p className="mt-0.5 text-lg font-bold tabular-nums text-muted-foreground">—</p>
              }
              const pct = Math.round((safe / total) * 100)
              return (
                <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-500">
                  {formatInteger(safe, locale)}<span className="text-sm text-muted-foreground"> / {formatInteger(total, locale)}</span> <span className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">{pct}%</span>
                </p>
              )
            })()}
          </div>
        </div>

        {showApi && apiPreviewText ? (
          <div
            className="relative z-30 mt-3 rounded-lg border border-border/60 bg-background/40 p-3"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
          >
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-relaxed text-foreground/80">
              {apiPreviewText}
            </pre>
          </div>
        ) : null}

        {/* Hover reveal — areas + projects */}
        {!showApi && (topAreas.length > 0 || topProjects.length > 0) ? (
          <div className="mt-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="border-t border-border/60 pt-3 space-y-3">
              {localizedTopAreas.length > 0 ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{copy.activeAreas}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {localizedTopAreas.map((area) => (
                      <Link
                        key={`${developer.slug}-area-${area.value}`}
                        href={prefixLocalePath(`/areas/${area.slug}`, locale)}
                        className="relative z-30 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                      >
                        {area.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {topProjects.length > 0 ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{copy.keyProjects}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topProjects.map((projectName) => (
                      <Link
                        key={`${developer.slug}-project-${projectName}`}
                        href={prefixLocalePath(`/properties/${slugify(projectName)}`, locale)}
                        className="relative z-30 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                      >
                        {projectName}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <Link
        href={prefixLocalePath(`/developers/${developer.slug}`, locale)}
        className="absolute inset-0 z-10"
        aria-label={copy.openDetails}
      />
    </article>
  )
}
