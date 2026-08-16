import Link from "next/link"
import { MapPin } from "lucide-react"
import { formatAed, formatYield } from "@/components/decision/formatters"
import { pickLocalizedText } from "@/lib/format/entities"
import { buildAreaStaticMapTileUrl } from "@/lib/area-geo"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import {
  type AreaBenchmarks,
  getAreaNarrative,
  getAreaPosition,
  getAreaPositionLabel,
  getAreaTypeLabel,
  getEfficiencyWidth,
  getInventoryDepthLabel,
} from "@/lib/area-intelligence"

type AreaCardProps = {
  slug: string
  area: string
  area_ar?: string | null
  projects?: number | null
  city?: string | null
  avg_price?: number | null
  avg_yield?: number | null
  efficiency?: number | null
  source_count?: number | null
  confidence?: string | null
  image_url?: string | null
  area_type?: string | null
  top_projects?: string[] | null
  benchmarks: AreaBenchmarks
  locale?: AppLocale | string | null
}

function slugifyProject(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function AreaCard(area: AreaCardProps) {
  const locale = (area.locale ?? "en") as AppLocale
  const isArabic = locale === "ar"
  const mapImageUrl = buildAreaStaticMapTileUrl(area.area, area.city)
  const topProjects = Array.isArray(area.top_projects) ? area.top_projects.slice(0, 4) : []
  const areaLabel = pickLocalizedText(locale, area.area_ar, area.area, area.area)
  const cityLabel = area.city ? pickLocalizedText(locale, null, area.city, area.city) : null
  const sourceCount = typeof area.source_count === "number" ? area.source_count : null
  const confidence = area.confidence ? String(area.confidence).toUpperCase() : null
  const areaTypeLabel = getAreaTypeLabel(area.area_type, locale)
  const positionKey = getAreaPosition(area, area.benchmarks)
  const positionLabel = getAreaPositionLabel(area, area.benchmarks, locale)
  const positionNarrative = getAreaNarrative(area, area.benchmarks, locale)
  const inventoryDepthLabel = getInventoryDepthLabel(area.projects, locale)
  const efficiencyWidth = getEfficiencyWidth(area.efficiency, area.benchmarks.maxEfficiency)
  const positionTone =
    positionKey === "value-yield"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : positionKey === "premium-carry"
        ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
        : positionKey === "accessible-soft"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : positionKey === "selective"
            ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
            : "border-border/60 bg-muted/40 text-muted-foreground"
  const efficiencyTier: "top-quartile" | "upper-mid" | "lower-mid" | "below-band" | null =
    efficiencyWidth >= 75
      ? "top-quartile"
      : efficiencyWidth >= 50
        ? "upper-mid"
        : efficiencyWidth >= 25
          ? "lower-mid"
          : efficiencyWidth > 0
            ? "below-band"
            : null
  const efficiencyTierLabel = efficiencyTier
    ? isArabic
      ? {
          "top-quartile": "رُبع علوي في الكفاءة",
          "upper-mid": "أعلى من الوسيط",
          "lower-mid": "تحت الوسيط",
          "below-band": "دون النطاق",
        }[efficiencyTier]
      : {
          "top-quartile": "Top-quartile efficiency",
          "upper-mid": "Above-median efficiency",
          "lower-mid": "Below-median efficiency",
          "below-band": "Below-band efficiency",
        }[efficiencyTier]
    : null
  const copy = isArabic
    ? {
      projects: "مشروع",
      avgPrice: "متوسط السعر",
      avgYield: "متوسط العائد",
      efficiency: "الكفاءة",
      efficiencyHint: "ترتيب نسبي داخل السوق",
      topProjects: "أبرز المشاريع",
      sources: "مصادر",
      confidence: "موثوقية",
      openArea: `افتح ملف ${areaLabel}`,
      mapAlt: `خريطة ${areaLabel}`,
    }
    : {
        projects: "projects",
        avgPrice: "Avg Price",
        avgYield: "Avg Yield",
        efficiency: "Efficiency",
        efficiencyHint: "Relative market ranking",
        topProjects: "Top Projects",
        sources: "sources",
        confidence: "confidence",
        openArea: `Open ${areaLabel} area details`,
        mapAlt: `Map of ${areaLabel}`,
      }

  return (
    <article className="group relative isolate block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)]">
      <div className="relative h-36 overflow-hidden bg-muted/30">
        <img
          src={area.image_url || mapImageUrl}
          alt={copy.mapAlt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ filter: "saturate(0.85) brightness(0.95)" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            <div className="h-3 w-3 rounded-full border-2 border-white bg-primary shadow-md" />
            <div className="absolute h-6 w-6 rounded-full animate-ping bg-primary/20" style={{ animationDuration: "2s" }} />
          </div>
        </div>
        {cityLabel ? (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <MapPin className="h-2.5 w-2.5" />
            {cityLabel}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-foreground">{areaLabel}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${positionTone}`}>
                {positionLabel}
              </span>
              <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {inventoryDepthLabel}
              </span>
              {areaTypeLabel ? (
                <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {areaTypeLabel}
                </span>
              ) : null}
            </div>
          </div>
          {area.projects ? (
            <span className="flex-shrink-0 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {area.projects} {copy.projects}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{copy.avgPrice}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{formatAed(area.avg_price, locale)}</p>
          </div>
          <div className="h-auto w-px bg-border/60" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{copy.avgYield}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatYield(area.avg_yield, locale)}
            </p>
          </div>
        </div>

        {(inventoryDepthLabel || efficiencyTierLabel) ? (
          <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium text-muted-foreground/80">
            <span>{inventoryDepthLabel}</span>
            {efficiencyTierLabel ? (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span>{efficiencyTierLabel}</span>
              </>
            ) : null}
          </p>
        ) : null}

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {positionNarrative}
        </p>

        {efficiencyWidth > 0 ? (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
              <span>{copy.efficiency}</span>
              <span>{copy.efficiencyHint}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted/70">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400"
                style={{ width: `${efficiencyWidth}%` }}
              />
            </div>
          </div>
        ) : null}

        {(sourceCount || confidence) ? (
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">
            {sourceCount ? (
              <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5">
                {sourceCount} {copy.sources}
              </span>
            ) : null}
            {confidence ? (
              <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5">
                {confidence} {copy.confidence}
              </span>
            ) : null}
          </div>
        ) : null}

        {topProjects.length > 0 ? (
          <div className="mt-3 translate-y-2 overflow-hidden opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="border-t border-border/60 pt-3">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">{copy.topProjects}</p>
              <div className="flex flex-wrap gap-1.5">
                {topProjects.map((project) => (
                  <Link
                    key={`${area.slug}-${project}`}
                    href={prefixLocalePath(`/properties/${slugifyProject(project)}`, locale)}
                    className="relative z-30 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  >
                    {project}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Link
        href={prefixLocalePath(`/areas/${area.slug}`, locale)}
        className="absolute inset-0 z-10"
        aria-label={copy.openArea}
      />
    </article>
  )
}
