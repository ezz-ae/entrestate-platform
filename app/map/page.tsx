"use client"

import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import type { CoverageSummary } from "@/lib/data-coverage"
import { MapPin, Layers, Activity, TrendingUp, Shield, Loader2, MessageSquare, BookOpen } from "lucide-react"
import { pickLocalizedText } from "@/lib/format/entities"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type AreaCluster = {
  area: string
  area_ar?: string | null
  slug: string
  city?: string | null
  projects: number
  avg_price: number | null
  avg_yield: number | null
  efficiency: number | null
  buy_signals: number
}

type AreaMeta = {
  sourceView: string
  primaryView: string
  syncedAt: string
  coverage: CoverageSummary | null
}

type LayerOptionId = "yield" | "price" | "supply" | "safety" | "liquidity"

const LAYER_OPTIONS: Array<{ id: LayerOptionId; en: string; ar: string }> = [
  { id: "yield", en: "Yield bands", ar: "شرائح العائد" },
  { id: "price", en: "Pricing heatmap", ar: "خريطة السعر" },
  { id: "supply", en: "Supply pressure", ar: "ضغط المعروض" },
  { id: "safety", en: "Safety tiers", ar: "طبقات الأمان" },
  { id: "liquidity", en: "Liquidity score", ar: "سيولة السوق" },
]

function getHeatColor(value: number | null, max: number): string {
  if (value === null || max === 0) return "bg-muted/30 border-border/60"
  const ratio = Math.min(value / max, 1)
  if (ratio > 0.75) return "bg-emerald-500/20 border-emerald-500/40"
  if (ratio > 0.5) return "bg-blue-500/20 border-blue-500/40"
  if (ratio > 0.25) return "bg-amber-500/20 border-amber-500/40"
  return "bg-red-500/15 border-red-500/30"
}

export default function MapPage() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const [areas, setAreas] = useState<AreaCluster[]>([])
  const [meta, setMeta] = useState<AreaMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeLayer, setActiveLayer] = useState<LayerOptionId>("yield")

  useEffect(() => {
    fetch("/api/areas")
      .then((res) => (res.ok ? res.json() : { areas: [] }))
      .then((data) => {
        setAreas(data.areas ?? [])
        setMeta({
          sourceView: data.source_view ?? data.sync?.primaryView ?? "api.areas_v1",
          primaryView: data.sync?.primaryView ?? "api.areas_v1",
          syncedAt: data.data_as_of ?? data.sync?.syncedAt ?? new Date().toISOString(),
          coverage: data.coverage ?? null,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const maxYield = Math.max(...areas.map((a) => (typeof a.avg_yield === "number" ? a.avg_yield : 0)), 1)
  const maxEfficiency = Math.max(...areas.map((a) => (typeof a.efficiency === "number" ? a.efficiency : 0)), 1)
  const maxPrice = Math.max(...areas.map((a) => (typeof a.avg_price === "number" ? a.avg_price : 0)), 1)
  const maxProjects = Math.max(...areas.map((a) => a.projects), 1)

  function getClusterColor(area: AreaCluster): string {
    switch (activeLayer) {
      case "yield":
        return getHeatColor(typeof area.avg_yield === "number" ? area.avg_yield : null, maxYield)
      case "price":
        return getHeatColor(typeof area.avg_price === "number" ? area.avg_price : null, maxPrice)
      case "safety":
      case "liquidity":
        return getHeatColor(typeof area.efficiency === "number" ? area.efficiency : null, maxEfficiency)
      case "supply":
        return getHeatColor(area.projects, maxProjects)
      default:
        return "bg-muted/30 border-border/60"
    }
  }

  const layerOptions = LAYER_OPTIONS.map((option) => ({
    id: option.id,
    label: isArabic ? option.ar : option.en,
  }))
  const coverageLabels: Record<string, string> = {
    city: isArabic ? "المدينة" : "City",
    area_ar: isArabic ? "الاسم العربي" : "Arabic label",
    avg_price: isArabic ? "متوسط السعر" : "Average price",
    avg_yield: isArabic ? "متوسط العائد" : "Average yield",
    efficiency: isArabic ? "الكفاءة" : "Efficiency",
    top_projects: isArabic ? "المشاريع البارزة" : "Top projects",
  }
  const isFallbackSource = meta ? meta.sourceView !== meta.primaryView : false

  const flowCards = [
    {
      title: isArabic ? "افتح البحث" : "Open Search",
      body: isArabic
        ? "انتقل من القراءة المكانية إلى تصفية المشاريع والمطورين والدرجات."
        : "Move from spatial context into project, developer, and score filtering.",
      href: "/search",
      icon: Layers,
    },
    {
      title: isArabic ? "افتح الدردشة" : "Open Chat",
      body: isArabic
        ? "حوّل المشهد المكاني إلى حكم نهائي مدعوم بالأدلة."
        : "Turn a geographic signal into a final verdict with evidence.",
      href: "/chat",
      icon: MessageSquare,
    },
    {
      title: isArabic ? "راجع الحالة والتوثيق" : "Review status and docs",
      body: isArabic
        ? "راجع حداثة البيانات والمنهجية قبل الاعتماد على الطبقات المكانية."
        : "Confirm data freshness and methodology before relying on spatial layers.",
      href: "/status",
      icon: BookOpen,
    },
  ]

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="mx-auto w-full max-w-[1440px] px-6">
          <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "الخريطة" : "Map"}</p>
              <h1 className="mt-3 text-3xl md:text-5xl font-serif text-foreground">{isArabic ? "خريطة السوق" : "Spatial Trust Surface"}</h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
                {isArabic
                  ? "استكشف المناطق بحسب العائد والسعر وكثافة المشاريع. اضغط على أي منطقة لعرض التفاصيل."
                  : "Area clusters colored by market signals. Click any area to explore its projects and intelligence."}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-accent" />
              {isArabic ? `${areas.length} منطقة متاحة` : `${areas.length} areas loaded`}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            {/* Area cluster grid */}
            <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
                <MapPin className="h-4 w-4 text-accent" />
                {isArabic ? "المناطق" : "Area clusters"}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-[420px]">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[500px] overflow-y-auto pr-1">
                  {areas.map((area) => (
                    <Link
                      key={area.slug}
                      href={prefixLocalePath(`/areas/${area.slug}`, locale)}
                      className={`rounded-xl border p-3 transition-all hover:scale-[1.02] hover:shadow-md ${getClusterColor(area)}`}
                    >
                      <div className="text-xs font-medium text-foreground truncate">{pickLocalizedText(locale, area.area_ar, area.area, area.area)}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{isArabic ? `${area.projects} مشروع` : `${area.projects} projects`}</div>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
                        <div>
                          <span className="text-muted-foreground">{isArabic ? "العائد" : "Yield"}</span>
                          <div className="font-medium text-foreground">
                            {typeof area.avg_yield === "number" ? `${Number(area.avg_yield).toFixed(1)}%` : "\u2014"}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{isArabic ? "السعر" : "Price"}</span>
                          <div className="font-medium text-foreground">
                            {typeof area.avg_price === "number"
                              ? `${(Number(area.avg_price) / 1_000_000).toFixed(1)}M`
                              : "\u2014"}
                          </div>
                        </div>
                      </div>
                      {area.buy_signals > 0 && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">
                          <TrendingUp className="h-2.5 w-2.5" />
                          {isArabic ? `${area.buy_signals} BUY` : `${area.buy_signals} BUY`}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Layer controls */}
            <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Layers className="h-4 w-4 text-accent" />
                {isArabic ? "الطبقات النشطة" : "Active layers"}
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "مستويات العرض" : "Core layers"}</p>
                  <div className="mt-3 space-y-2">
                    {layerOptions.map((layer) => (
                      <button
                        key={layer.id}
                        onClick={() => setActiveLayer(layer.id)}
                        className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                          activeLayer === layer.id
                            ? "border-primary/60 bg-primary/10 text-foreground"
                            : "border-border/60 bg-background/50 text-foreground hover:border-primary/30"
                        }`}
                      >
                        {layer.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "الدليل اللوني" : "Legend"}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-3 w-3 rounded-sm bg-emerald-500/20 border border-emerald-500/40" />
                      {isArabic ? "مرتفع (أعلى ربع)" : "High (top quartile)"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-3 w-3 rounded-sm bg-blue-500/20 border border-blue-500/40" />
                      {isArabic ? "فوق المتوسط" : "Above average"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-3 w-3 rounded-sm bg-amber-500/20 border border-amber-500/40" />
                      {isArabic ? "دون المتوسط" : "Below average"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-3 w-3 rounded-sm bg-red-500/15 border border-red-500/30" />
                      {isArabic ? "منخفض (أدنى ربع)" : "Low (bottom quartile)"}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-accent inline-block mr-2" />
                  {isArabic
                    ? "اضغط على أي منطقة لفتح صفحتها مع المشاريع والإشارات الاستخباراتية."
                    : "Click any area to open its detail page with projects and intelligence."}
                </div>
              </div>
            </section>
          </div>

          <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-border/60 bg-card/70 p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                {isArabic ? "وضع الاعتماد" : "Reliance posture"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                {isArabic ? "الخريطة تقرأ السوق مكانياً، ولا تصدر الحكم وحدها" : "Map is a spatial lens, not a standalone verdict"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {isArabic
                  ? "استخدم الخريطة لفهم التوزيع المكاني للعائد والسعر وكثافة المشاريع، ثم انتقل إلى البحث للتصفية أو إلى الدردشة للحكم النهائي."
                  : "Use Map to understand geographic price, yield, and project density, then move into Search for filtering or Chat for the final verdict."}
              </p>
              <div className="mt-4 rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">{isArabic ? "المصدر الحالي:" : "Current source:"}</span>{" "}
                  {meta?.sourceView ?? "api.areas_v1"}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-foreground">{isArabic ? "جودة التغطية:" : "Coverage score:"}</span>{" "}
                  {meta?.coverage ? `${meta.coverage.score}/100` : "—"}
                  {isFallbackSource ? ` · ${isArabic ? "مصدر احتياطي" : "Fallback source"}` : ""}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-foreground">{isArabic ? "آخر تزامن:" : "Last sync:"}</span>{" "}
                  {meta ? new Date(meta.syncedAt).toLocaleString(isArabic ? "ar-AE" : "en-AE") : "—"}
                </p>
              </div>
              {meta?.coverage?.fields?.length ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {meta.coverage.fields.slice(0, 4).map((field) => (
                    <div key={field.key} className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                        {coverageLabels[field.key] ?? field.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{field.pct}%</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                {isArabic ? "الأسطح المرتبطة" : "Connected surfaces"}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {flowCards.map((card) => {
                  const Icon = card.icon
                  const className =
                    "group rounded-2xl border border-border/60 bg-background/50 p-4 transition hover:border-primary/30 hover:bg-background"
                  const content = (
                    <>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-foreground">{card.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                    </>
                  )

                  return card.href === "/chat" ? (
                    <CopilotEntryLink key={card.title} className={className}>
                      {content}
                    </CopilotEntryLink>
                  ) : (
                    <Link
                      key={card.title}
                      href={prefixLocalePath(card.href, locale)}
                      className={className}
                    >
                      {content}
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
