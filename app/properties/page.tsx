import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProjectCard } from "@/components/decision/project-card"
import { listProperties } from "@/lib/decision-infrastructure"
import { buildDataSyncMeta } from "@/lib/data-sync-contract"
import { BarChart3, TrendingUp, ShieldCheck, Zap, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { formatAed } from "@/lib/format/currency"
import { formatDate } from "@/lib/format/date"
import { formatInteger } from "@/lib/format/number"
import { getTranslations } from "next-intl/server"
import { getPlatformMetrics } from "@/lib/platform-metrics.server"
import { PLATFORM_METRICS_FALLBACK } from "@/lib/platform-metrics"

export const dynamic = "force-dynamic"

type PropertySortBy = "god_metric" | "price" | "yield" | "timing" | "reliability"

type SearchParams = {
  area?: string
  developer?: string
  timing?: "BUY" | "HOLD" | "WAIT"
  stress?: "A" | "B" | "C" | "D"
  sortBy?: PropertySortBy
  goldenVisa?: string
  minPrice?: string
  maxPrice?: string
  bedsMin?: string
  bedsMax?: string
  page?: string
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const metrics = await getPlatformMetrics().catch(() => PLATFORM_METRICS_FALLBACK)
  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US")

  return {
    title:
      locale === "ar"
        ? `مشاريع دبي المقيّمة — ${formatter.format(metrics.totalProjects)} مشروعاً مع أدلة قابلة للفحص | Entrestate`
        : `${formatter.format(metrics.totalProjects)} Scored Dubai Projects — Evidence-backed verdicts | Entrestate`,
    description:
      locale === "ar"
        ? "مشاريع مقيّمة عبر التوقيت والضغط والعائد والأدلة، مع أحكام قابلة للفحص وروابط إلى مصادرها."
        : "Scored Dubai projects ranked across timing, stress, yield, and evidence, with inspectable verdicts linked back to named sources.",
  }
}

function buildFilterHref(base: Record<string, string | undefined>, override: Record<string, string | undefined>) {
  const merged = { ...base, ...override }
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "") params.set(k, v)
  }
  const qs = params.toString()
  return `/properties${qs ? `?${qs}` : ""}`
}

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getRequestLocale()
  const t = await getTranslations({ locale, namespace: "properties" })
  const params = await searchParams
  const page = Number.parseInt(params.page ?? "1", 10)
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1
  const pageSize = 21
  const allowedSortValues: PropertySortBy[] = ["god_metric", "price", "yield", "timing", "reliability"]
  const sortBy = allowedSortValues.includes((params.sortBy ?? "") as PropertySortBy)
    ? (params.sortBy as PropertySortBy)
    : "god_metric"

  const result = await listProperties({
    page: currentPage,
    pageSize,
    sortBy,
    locale,
    filters: {
      area: params.area,
      developer: params.developer,
      timingSignal: params.timing,
      stressGradeMin: params.stress,
      goldenVisaRequired: params.goldenVisa === "true",
      budgetMinAed: params.minPrice ? Number.parseFloat(params.minPrice) : undefined,
      budgetMaxAed: params.maxPrice ? Number.parseFloat(params.maxPrice) : undefined,
      bedsMin: params.bedsMin ? Number.parseFloat(params.bedsMin) : undefined,
      bedsMax: params.bedsMax ? Number.parseFloat(params.bedsMax) : undefined,
    },
  }).catch(() => ({ projects: [], total: 0, data_as_of: null }))

  const totalProjectsCount = result.total || 0
  const totalPages = Math.ceil(totalProjectsCount / pageSize)
  const hasFilters = !!(
    params.timing
    || params.stress
    || params.goldenVisa === "true"
    || params.area
    || params.developer
    || params.minPrice
    || params.maxPrice
    || params.bedsMin
    || params.bedsMax
  )

  // Derive stats from current page
  const projects = result.projects
  const buyCount = projects.filter((p) => (p.timing_label ?? p.l3_timing_signal) === "BUY").length
  const holdCount = projects.filter((p) => (p.timing_label ?? p.l3_timing_signal) === "HOLD").length
  const waitCount = projects.filter((p) => (p.timing_label ?? p.l3_timing_signal) === "WAIT").length
  const signaledCount = buyCount + holdCount + waitCount
  const dominantSignal: "BUY" | "HOLD" | "WAIT" | null = signaledCount === 0
    ? null
    : buyCount >= holdCount && buyCount >= waitCount
      ? "BUY"
      : holdCount >= waitCount
        ? "HOLD"
        : "WAIT"
  const dominantShare = signaledCount > 0 && dominantSignal
    ? Math.round((dominantSignal === "BUY" ? buyCount : dominantSignal === "HOLD" ? holdCount : waitCount) / signaledCount * 100)
    : null
  const prices = projects.map((p) => typeof (p.price_from_aed ?? p.l1_canonical_price) === "number" ? Number(p.price_from_aed ?? p.l1_canonical_price) : null).filter((v): v is number => v !== null && v > 0)
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null
  const yields = projects.map((p) => typeof (p.rental_yield ?? p.l1_canonical_yield) === "number" ? Number(p.rental_yield ?? p.l1_canonical_yield) : null).filter((v): v is number => v !== null && v > 0)
  const avgYield = yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : null

  const freshnessLabel = result.data_as_of
    ? formatDate(result.data_as_of, locale)
    : null
  const syncMeta = buildDataSyncMeta("properties", result.data_as_of)
  const syncTimestamp = new Date(syncMeta.syncedAt).toLocaleString(locale === "ar" ? "ar-AE" : "en-AE")

  // Base params for filter links (preserve all except the one being changed)
  const baseParams: Record<string, string | undefined> = {
    area: params.area,
    developer: params.developer,
    timing: params.timing,
    stress: params.stress,
    sortBy,
    goldenVisa: params.goldenVisa,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    bedsMin: params.bedsMin,
    bedsMax: params.bedsMax,
  }

  const ui = locale === "ar"
    ? {
        area: "المنطقة",
        developer: "المطور",
        minPrice: "أقل سعر",
        maxPrice: "أعلى سعر",
        bedsMin: "غرف نوم (حد أدنى)",
        bedsMax: "غرف نوم (حد أقصى)",
        sortBy: "الترتيب",
        applyFilters: "تطبيق الفلاتر",
        goldenVisa: "الإقامة الذهبية",
        minPriceChip: "أقل سعر",
        maxPriceChip: "أعلى سعر",
        bedsMinChip: "غرف (من)",
        bedsMaxChip: "غرف (إلى)",
      }
    : {
        area: "Area",
        developer: "Developer",
        minPrice: "Min price",
        maxPrice: "Max price",
        bedsMin: "Beds (min)",
        bedsMax: "Beds (max)",
        sortBy: "Sort by",
        applyFilters: "Apply filters",
        goldenVisa: "Golden Visa",
        minPriceChip: "Min price",
        maxPriceChip: "Max price",
        bedsMinChip: "Beds min",
        bedsMaxChip: "Beds max",
      }

  const sortOptions: Array<{ value: PropertySortBy; label: string }> = locale === "ar"
    ? [
        { value: "god_metric", label: "النتيجة" },
        { value: "price", label: "السعر" },
        { value: "yield", label: "العائد" },
        { value: "timing", label: "التوقيت" },
        { value: "reliability", label: "موثوقية المطور" },
      ]
    : [
        { value: "god_metric", label: "Score" },
        { value: "price", label: "Price" },
        { value: "yield", label: "Yield" },
        { value: "timing", label: "Timing" },
        { value: "reliability", label: "Developer reliability" },
      ]

  const pageSummary = locale === "ar"
    ? `الصفحة ${formatInteger(currentPage, locale)} من ${formatInteger(totalPages || 1, locale)} · عرض ${formatInteger(projects.length, locale)} من ${formatInteger(totalProjectsCount, locale)} مشروعاً`
    : `Page ${formatInteger(currentPage, locale)} of ${formatInteger(totalPages || 1, locale)} · showing ${formatInteger(projects.length, locale)} of ${formatInteger(totalProjectsCount, locale)} projects`

  const signalLabelAr: Record<"BUY" | "HOLD" | "WAIT", string> = { BUY: "الشراء", HOLD: "الاحتفاظ", WAIT: "الانتظار" }
  const compositionInsight = dominantSignal && dominantShare !== null
    ? locale === "ar"
      ? `على هذه الصفحة، ${signalLabelAr[dominantSignal]} هو الإشارة الغالبة بـ ${dominantShare}٪ من الحمولة المصنّفة.`
      : `On this page, ${dominantSignal} is the dominant signal at ${dominantShare}% of scored inventory.`
    : null
  const headerBodyBase = locale === "ar"
    ? `${formatInteger(totalProjectsCount, locale)} مشروعاً مقيّماً عبر التوقيت والضغط والعائد ومستوى الأدلة، مع أحكام قابلة للفحص قبل اتخاذ القرار.`
    : `${formatInteger(totalProjectsCount, locale)} projects scored across timing, stress, yield, and evidence, with verdicts you can inspect before acting.`
  const headerBody = compositionInsight ? `${headerBodyBase} ${compositionInsight}` : headerBodyBase

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">

        {/* Header */}
        <header className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 rounded-full border border-primary/10">
              <Building2 className="w-3 h-3" />
              {locale === "ar" ? "المشاريع المقيّمة" : "Scored projects"}
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground leading-tight tracking-tight">
              {locale === "ar"
                ? <>المشاريع <span className="text-muted-foreground/40 italic">الجاهزة للفحص</span></>
                : <>Projects <span className="text-muted-foreground/40 italic">ready for inspection</span></>}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed">
              {headerBody}
            </p>
          </div>
          {freshnessLabel && (
            <div className="flex flex-col md:items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1">{t("freshness")}</span>
              <p className="text-xs font-bold text-foreground bg-secondary/50 px-3 py-1 rounded-lg border border-border/40">
                {freshnessLabel}
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground/60">
                {locale === "ar"
                  ? `مزامنة API · ${syncMeta.primaryView} · ${syncTimestamp}`
                  : `API sync · ${syncMeta.primaryView} · ${syncTimestamp}`}
              </p>
            </div>
          )}
        </header>

        {/* Metric cards */}
        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: t("inventoryDepth"), value: formatInteger(totalProjectsCount, locale), sub: hasFilters ? t("filtered") : t("totalActive"), icon: BarChart3, color: "text-primary", bg: "bg-primary/5" },
            { label: t("activeBuy"), value: `${formatInteger(buyCount, locale)} / ${formatInteger(projects.length, locale)}`, sub: t("density"), icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/5" },
            { label: t("marketPrice"), value: formatAed(avgPrice, locale, { compact: true, fallback: "—" }), sub: t("marketPriceSub"), icon: TrendingUp, color: "text-sky-500", bg: "bg-sky-500/5" },
            { label: t("strategicYield"), value: avgYield !== null ? `${avgYield.toFixed(1)}%` : "—", sub: t("strategicYieldSub"), icon: ShieldCheck, color: "text-violet-500", bg: "bg-violet-500/5" },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="group rounded-[2rem] border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-xl ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">{card.label}</p>
                <p className="text-2xl font-serif font-bold tabular-nums text-foreground">{card.value}</p>
                <p className="mt-1 text-[10px] font-medium text-muted-foreground opacity-60 uppercase tracking-wider">{card.sub}</p>
              </div>
            )
          })}
        </div>

        <div className="mb-6 flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {locale === "ar"
            ? "افتح أي بطاقة لرؤية الحمولة كما تصل للواجهة."
            : "Open any card to inspect the payload delivered to the frontend."}
        </div>

        <form
          action={prefixLocalePath("/properties", locale)}
          className="mb-6 rounded-2xl border border-border/60 bg-card/70 p-4"
        >
          {params.timing ? <input type="hidden" name="timing" value={params.timing} /> : null}
          {params.stress ? <input type="hidden" name="stress" value={params.stress} /> : null}
          {params.goldenVisa === "true" ? <input type="hidden" name="goldenVisa" value="true" /> : null}
          <input type="hidden" name="page" value="1" />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-7">
            <input
              name="area"
              defaultValue={params.area ?? ""}
              placeholder={ui.area}
              className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
            />
            <input
              name="developer"
              defaultValue={params.developer ?? ""}
              placeholder={ui.developer}
              className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
            />
            <input
              name="minPrice"
              type="number"
              min={0}
              defaultValue={params.minPrice ?? ""}
              placeholder={ui.minPrice}
              className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
            />
            <input
              name="maxPrice"
              type="number"
              min={0}
              defaultValue={params.maxPrice ?? ""}
              placeholder={ui.maxPrice}
              className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
            />
            <input
              name="bedsMin"
              type="number"
              min={0}
              defaultValue={params.bedsMin ?? ""}
              placeholder={ui.bedsMin}
              className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
            />
            <input
              name="bedsMax"
              type="number"
              min={0}
              defaultValue={params.bedsMax ?? ""}
              placeholder={ui.bedsMax}
              className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
            />
            <select
              name="sortBy"
              defaultValue={sortBy}
              className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground"
              aria-label={ui.sortBy}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex justify-end">
            <Button type="submit" size="sm">
              {ui.applyFilters}
            </Button>
          </div>
        </form>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {/* Timing signal */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground/60">{t("signal")}</span>
            {(["BUY", "HOLD", "WAIT"] as const).map((signal) => {
              const isActive = params.timing === signal
              const colors = {
                BUY: isActive ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400/60 hover:bg-emerald-500/10",
                HOLD: isActive ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : "border-amber-500/30 bg-amber-500/5 text-amber-400/60 hover:bg-amber-500/10",
                WAIT: isActive ? "border-red-500/60 bg-red-500/15 text-red-400" : "border-red-500/30 bg-red-500/5 text-red-400/60 hover:bg-red-500/10",
              }[signal]
              return (
                <Link
                  key={signal}
                  href={prefixLocalePath(buildFilterHref(baseParams, { timing: isActive ? undefined : signal, page: undefined }), locale)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${colors}`}
                >
                  {signal}
                </Link>
              )
            })}
          </div>

          <span className="text-border/60">·</span>

          <Link
            href={prefixLocalePath(
              buildFilterHref(baseParams, {
                goldenVisa: params.goldenVisa === "true" ? undefined : "true",
                page: undefined,
              }),
              locale,
            )}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              params.goldenVisa === "true"
                ? "border-violet-500/60 bg-violet-500/15 text-violet-300"
                : "border-violet-500/30 bg-violet-500/5 text-violet-300/70 hover:bg-violet-500/10"
            }`}
          >
            {ui.goldenVisa}
          </Link>

          {/* Stress grade */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground/60">{t("risk")}</span>
            {(["A", "B", "C", "D"] as const).map((grade) => {
              const isActive = params.stress === grade
              return (
                <Link
                  key={grade}
                  href={prefixLocalePath(buildFilterHref(baseParams, { stress: isActive ? undefined : grade, page: undefined }), locale)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    isActive
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border/50 bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {grade}
                </Link>
              )
            })}
          </div>

          {hasFilters && (
            <>
              <span className="text-border/60">·</span>
              <Link href={prefixLocalePath("/properties", locale)} className="rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-foreground">
                {t("clearAll")}
              </Link>
            </>
          )}
        </div>

        {/* Active filter summary */}
        {hasFilters && (
          <div className="mb-4 flex flex-wrap gap-2">
            {params.timing && (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                {t("signalChip")}: {params.timing}
                <Link href={prefixLocalePath(buildFilterHref(baseParams, { timing: undefined, page: undefined }), locale)} className="ms-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
            {params.stress && (
              <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-foreground">
                {t("riskChip")}: {params.stress}
                <Link href={prefixLocalePath(buildFilterHref(baseParams, { stress: undefined, page: undefined }), locale)} className="ms-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
            {params.area && (
              <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                {t("areaChip")}: {params.area}
                <Link href={prefixLocalePath(buildFilterHref(baseParams, { area: undefined, page: undefined }), locale)} className="ms-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
            {params.developer && (
              <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                {t("developerChip")}: {params.developer}
                <Link href={prefixLocalePath(buildFilterHref(baseParams, { developer: undefined, page: undefined }), locale)} className="ms-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
            {params.minPrice && (
              <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                {ui.minPriceChip}: {formatAed(Number(params.minPrice), locale)}
                <Link href={prefixLocalePath(buildFilterHref(baseParams, { minPrice: undefined, page: undefined }), locale)} className="ms-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
            {params.maxPrice && (
              <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                {ui.maxPriceChip}: {formatAed(Number(params.maxPrice), locale)}
                <Link href={prefixLocalePath(buildFilterHref(baseParams, { maxPrice: undefined, page: undefined }), locale)} className="ms-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
            {params.bedsMin && (
              <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                {ui.bedsMinChip}: {params.bedsMin}
                <Link href={prefixLocalePath(buildFilterHref(baseParams, { bedsMin: undefined, page: undefined }), locale)} className="ms-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
            {params.bedsMax && (
              <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                {ui.bedsMaxChip}: {params.bedsMax}
                <Link href={prefixLocalePath(buildFilterHref(baseParams, { bedsMax: undefined, page: undefined }), locale)} className="ms-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
            {params.goldenVisa === "true" && (
              <span className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                {ui.goldenVisa}
                <Link href={prefixLocalePath(buildFilterHref(baseParams, { goldenVisa: undefined, page: undefined }), locale)} className="ms-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
          </div>
        )}

        {/* Showing count */}
        <p className="mb-4 text-xs text-muted-foreground/60">
          {pageSummary}
        </p>

        {/* Grid */}
        <section className="relative grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_-10%,rgba(59,130,246,0.12),transparent_58%)]" />
          {projects.map((project) => (
            <ProjectCard
              key={String(project.slug)}
              slug={String(project.slug)}
              name={String(project.name ?? "Unnamed project")}
              area={String(project.final_area ?? project.area ?? "")}
              area_ar={typeof project.area_ar === "string" ? project.area_ar : null}
              developer={String(project.developer ?? "")}
              developer_ar={typeof project.developer_ar === "string" ? project.developer_ar : null}
              l1_canonical_price={typeof project.l1_canonical_price === "number" ? project.l1_canonical_price : null}
              l1_canonical_yield={typeof project.l1_canonical_yield === "number" ? project.l1_canonical_yield : null}
              l2_stress_test_grade={typeof project.l2_stress_test_grade === "string" ? project.l2_stress_test_grade : null}
              l3_timing_signal={typeof project.l3_timing_signal === "string" ? project.l3_timing_signal : null}
              decision_label_v1={typeof project.decision_label_v1 === "string" ? project.decision_label_v1 : null}
              engine_god_metric={typeof project.engine_god_metric === "number" ? project.engine_god_metric : null}
              l1_confidence={typeof project.l1_confidence === "string" ? project.l1_confidence : null}
              apiPreview={project as Record<string, unknown>}
            />
          ))}
          {projects.length === 0 && (
            <div className="col-span-3 rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">{t("emptyTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("emptyBody")}</p>
              <Link href={prefixLocalePath("/properties", locale)} className="mt-4 inline-block rounded-full border border-border/60 bg-card px-4 py-2 text-xs text-foreground transition hover:border-primary/40">
                {t("clearFilters")}
              </Link>
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={prefixLocalePath(buildFilterHref(baseParams, { page: String(currentPage - 1) }), locale)}
                className="rounded-full border border-border/60 bg-card px-4 py-2 text-xs text-foreground transition hover:border-primary/40"
              >
                {t("previous")}
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={prefixLocalePath(buildFilterHref(baseParams, { page: String(currentPage + 1) }), locale)}
                className="rounded-full border border-border/60 bg-card px-4 py-2 text-xs text-foreground transition hover:border-primary/40"
              >
                {t("next")}
              </Link>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
