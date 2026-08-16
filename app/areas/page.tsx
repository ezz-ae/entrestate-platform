import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AreasView } from "@/components/decision/areas-view"
import { AreaCard } from "@/components/decision/area-card"
import { SitePagination, type SitePaginationItem } from "@/components/site-pagination"
import { listAreas } from "@/lib/decision-infrastructure"
import { buildDataSyncMeta } from "@/lib/data-sync-contract"
import { getRequestLocale } from "@/i18n/request"
import { formatDecimal, formatInteger } from "@/lib/format/number"
import Link from "next/link"
import { prefixLocalePath } from "@/i18n/locale"
import { formatAed } from "@/lib/format/currency"
import { computeMedian, getAreaPosition } from "@/lib/area-intelligence"
import { getPlatformMetrics } from "@/lib/platform-metrics.server"
import { PLATFORM_METRICS_FALLBACK } from "@/lib/platform-metrics"
import { buildPaginationWindow, clampPage, parsePageParam } from "@/lib/pagination"

export const dynamic = "force-dynamic"

const AREAS_PAGE_SIZE = 9

type SearchParams = {
  city?: string
  page?: string
}

function buildAreasHref(locale: "en" | "ar", city: string, page: number) {
  const params = new URLSearchParams()
  if (city) params.set("city", city)
  if (page > 1) params.set("page", String(page))
  const query = params.toString()
  return prefixLocalePath(query ? `/areas?${query}` : "/areas", locale)
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const metrics = await getPlatformMetrics().catch(() => PLATFORM_METRICS_FALLBACK)

  return {
    title:
      locale === "ar"
        ? "ملفات مناطق دبي — العائد والسعر وبيانات العرض | Entrestate"
        : `${metrics.totalAreas} Dubai Area Profiles — Yield, Price & Supply Data | Entrestate`,
    description:
      locale === "ar"
        ? "ملفات مناطق مع متوسط السعر والعائد وسرعة المعاملات وضغط المعروض والمشاريع المقارنة، معززة ببيانات DLD."
        : "Area profiles with average price, yield, transaction velocity, supply pressure, and comparable projects sourced from DLD and verified listing data.",
  }
}

export default async function AreasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const data = await listAreas()
  const params = await searchParams
  const syncMeta = buildDataSyncMeta("areas", data.data_as_of)
  const syncTimestamp = new Date(syncMeta.syncedAt).toLocaleString(isArabic ? "ar-AE" : "en-AE")
  const isFallbackSource = data.source_view !== syncMeta.primaryView
  const coverageLabels = {
    city: isArabic ? "المدينة" : "City",
    area_ar: isArabic ? "الاسم العربي" : "Arabic label",
    avg_price: isArabic ? "متوسط السعر" : "Average price",
    avg_yield: isArabic ? "متوسط العائد" : "Average yield",
    efficiency: isArabic ? "الكفاءة" : "Efficiency",
    top_projects: isArabic ? "المشاريع البارزة" : "Top projects",
  } satisfies Record<string, string>
  const cities = [...new Set(data.areas.map((area) => String(area.city ?? "").trim()).filter(Boolean))].sort()
  const activeCity = cities.includes(String(params.city ?? "").trim()) ? String(params.city).trim() : ""
  const visibleAreas = activeCity
    ? data.areas.filter((area) => String(area.city ?? "").trim() === activeCity)
    : data.areas
  const requestedPage = parsePageParam(params.page)
  const totalPages = Math.max(1, Math.ceil(visibleAreas.length / AREAS_PAGE_SIZE))
  const currentPage = clampPage(requestedPage, totalPages)
  const pageStartIndex = (currentPage - 1) * AREAS_PAGE_SIZE
  const pageEndIndex = Math.min(pageStartIndex + AREAS_PAGE_SIZE, visibleAreas.length)
  const pagedAreas = visibleAreas.slice(pageStartIndex, pageEndIndex)
  const medianPrice = computeMedian(visibleAreas.map((area) => (typeof area.avg_price === "number" ? area.avg_price : null)))
  const medianYield = computeMedian(visibleAreas.map((area) => (typeof area.avg_yield === "number" ? area.avg_yield : null)))
  const maxEfficiency = visibleAreas.reduce<number | null>((currentMax, area) => {
    const efficiency = typeof area.efficiency === "number" ? area.efficiency : null
    if (efficiency === null) return currentMax
    if (currentMax === null) return efficiency
    return Math.max(currentMax, efficiency)
  }, null)
  const benchmarks = {
    medianPrice,
    medianYield,
    maxEfficiency,
  }
  const benchmarkedAreas = visibleAreas.filter((area) => typeof area.projects === "number" && area.projects >= 5)
  const valueYieldAreas = benchmarkedAreas.filter(
    (area) =>
      getAreaPosition(
        {
          avg_price: typeof area.avg_price === "number" ? area.avg_price : null,
          avg_yield: typeof area.avg_yield === "number" ? area.avg_yield : null,
          efficiency: typeof area.efficiency === "number" ? area.efficiency : null,
          projects: typeof area.projects === "number" ? area.projects : null,
        },
        benchmarks,
      ) === "value-yield",
  )
  const valueYieldPreview = valueYieldAreas.slice(0, 3).map((area) => String(area.area ?? "")).filter(Boolean)
  const efficiencyLeader =
    [...benchmarkedAreas]
      .filter((area) => typeof area.efficiency === "number")
      .sort((left, right) => Number(right.efficiency ?? 0) - Number(left.efficiency ?? 0))[0] ?? null
  const depthLeader =
    [...visibleAreas]
      .filter((area) => typeof area.projects === "number")
      .sort((left, right) => Number(right.projects ?? 0) - Number(left.projects ?? 0))[0] ?? null
  const paginationItems: SitePaginationItem[] = buildPaginationWindow(currentPage, totalPages).map((item) =>
    typeof item === "number"
      ? {
          key: `area-page-${item}`,
          label: String(item),
          href: buildAreasHref(locale, activeCity, item),
          active: item === currentPage,
        }
      : {
          key: item,
          label: item === "ellipsis-left" ? "…" : "…",
          ellipsis: true,
        },
  )
  const resultsSummary = visibleAreas.length > 0
    ? (isArabic
        ? `عرض ${formatInteger(pageStartIndex + 1, locale)}–${formatInteger(pageEndIndex, locale)} من ${formatInteger(visibleAreas.length, locale)} منطقة · الصفحة ${formatInteger(currentPage, locale)} من ${formatInteger(totalPages, locale)}`
        : `Showing ${formatInteger(pageStartIndex + 1, locale)}–${formatInteger(pageEndIndex, locale)} of ${formatInteger(visibleAreas.length, locale)} areas · page ${formatInteger(currentPage, locale)} of ${formatInteger(totalPages, locale)}`)
    : (isArabic ? "لا توجد مناطق في هذا العرض." : "No areas are available in this view.")

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
            {isArabic ? "المناطق" : "Areas"}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-medium text-foreground md:text-5xl">
            {isArabic
              ? `${formatInteger(data.areas.length, locale)} ملف منطقة. وكل رقم له مصدر.`
              : `${formatInteger(data.areas.length, locale)} area profiles. Every number is sourced.`}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic
              ? "متوسط السعر، والعائد، وسرعة المعاملات، وضغط المعروض، والمشاريع المقارنة لكل منطقة، ولكل ربع، معززة ببيانات DLD."
              : "Average price, yield, transaction velocity, supply pressure, and comparable projects per area, per quarter, traced to DLD."}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground/60">
            {isArabic
              ? `مزامنة API · ${data.source_view} · ${syncTimestamp}${isFallbackSource ? " · مصدر احتياطي" : ""}`
              : `API sync · ${data.source_view} · ${syncTimestamp}${isFallbackSource ? " · fallback source" : ""}`}
          </p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={prefixLocalePath("/areas", locale)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeCity === ""
                ? "border-foreground/30 bg-foreground text-background"
                : "border-border/60 bg-card/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
            }`}
          >
            {isArabic ? "كل المدن" : "All cities"}
            <span className={`ms-1 text-[10px] ${activeCity === "" ? "text-background/70" : "text-muted-foreground"}`}>
              {formatInteger(data.areas.length, locale)}
            </span>
          </Link>
          {cities.map((city) => {
            const href = prefixLocalePath(`/areas?city=${encodeURIComponent(city)}`, locale)
            const count = data.areas.filter((area) => String(area.city ?? "").trim() === city).length
            const isActive = activeCity === city
            return (
              <Link
                key={city}
                href={href}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border/60 bg-card/70 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {city}
                <span className={`ms-1 text-[10px] ${isActive ? "text-foreground/60" : "text-muted-foreground"}`}>
                  {formatInteger(count, locale)}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mb-8 rounded-2xl border border-border/70 bg-card/60 p-4">
          <h2 className="text-sm font-semibold text-foreground">
            {isArabic
              ? `تغطية البيانات: ${formatInteger(visibleAreas.length, locale)} منطقة · ${formatDecimal(data.coverage.score, locale, 1, 1)}/100`
              : `Data coverage: ${formatInteger(visibleAreas.length, locale)} areas · ${formatDecimal(data.coverage.score, locale, 1, 1)}/100`}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isArabic
              ? `${activeCity ? `عرض مدينة: ${activeCity} · ` : ""}مصادر متقاطعة: PropertyFinder / Bayut / DLD / Entrestate Spine · مرتبة حسب الكفاءة`
              : `${activeCity ? `City filter: ${activeCity} · ` : ""}Cross-referenced: PropertyFinder / Bayut / DLD / Entrestate Spine · sorted by efficiency`}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
            {data.coverage.fields.map((field) => (
              <div key={field.key} className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                  {coverageLabels[field.key as keyof typeof coverageLabels] ?? field.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{formatDecimal(field.pct, locale, 1, 1)}%</p>
              </div>
            ))}
          </div>
        </div>

        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
                {isArabic ? "قراءات السوق" : "Market Reads"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                {isArabic ? "ما الذي يقوله متوسط السوق" : "What the area math is saying"}
              </h2>
            </div>
            <p className="max-w-xl text-xs text-muted-foreground">
              {isArabic
                ? `الوسيط الحالي: ${formatAed(medianPrice, locale, { compact: true })} للدخول و ${formatDecimal(medianYield, locale, 1, 1)}% للعائد.`
                : `Current median: ${formatAed(medianPrice, locale, { compact: true })} entry and ${formatDecimal(medianYield, locale, 1, 1)}% yield.`}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                {isArabic ? "قيمة وعائد" : "Value Yield"}
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {formatInteger(valueYieldAreas.length, locale)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {isArabic
                  ? "مناطق تحت وسيط السعر وفوق وسيط العائد. هذه هي الجيوب التي تظهر فيها الكفاءة الرأسمالية أولاً."
                  : "Areas sitting below the median entry price and above the median yield. This is where capital efficiency appears first."}
              </p>
              {valueYieldPreview.length > 0 ? (
                <p className="mt-3 text-xs text-emerald-200/90">
                  {isArabic ? `الأقرب للصورة الآن: ${valueYieldPreview.join(" · ")}` : `Closest fits right now: ${valueYieldPreview.join(" · ")}`}
                </p>
              ) : null}
            </article>

            <article className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                {isArabic ? "قائد الكفاءة" : "Efficiency Leader"}
              </p>
              <p className="mt-3 text-xl font-semibold text-foreground">
                {efficiencyLeader ? String(efficiencyLeader.area ?? "") : (isArabic ? "قيد التشكّل" : "Forming")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {efficiencyLeader
                  ? (isArabic
                    ? `${formatAed(efficiencyLeader.avg_price, locale, { compact: true })} · ${formatDecimal(efficiencyLeader.avg_yield, locale, 1, 1)}% عائد · ${formatInteger(efficiencyLeader.projects, locale)} مشاريع`
                    : `${formatAed(efficiencyLeader.avg_price, locale, { compact: true })} · ${formatDecimal(efficiencyLeader.avg_yield, locale, 1, 1)}% yield · ${formatInteger(efficiencyLeader.projects, locale)} projects`)
                  : (isArabic
                    ? "لا توجد بيانات كافية لترتيب الكفاءة حالياً."
                    : "Not enough coverage yet to rank efficiency cleanly.")}
              </p>
            </article>

            <article className="rounded-2xl border border-border/70 bg-card/70 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                {isArabic ? "عمق المخزون" : "Inventory Depth"}
              </p>
              <p className="mt-3 text-xl font-semibold text-foreground">
                {depthLeader ? String(depthLeader.area ?? "") : (isArabic ? "قيد التشكّل" : "Forming")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {depthLeader
                  ? (isArabic
                    ? `${formatInteger(depthLeader.projects, locale)} مشروعاً مصنفاً · ${formatAed(depthLeader.avg_price, locale, { compact: true })} دخول متوسط`
                    : `${formatInteger(depthLeader.projects, locale)} scored projects · ${formatAed(depthLeader.avg_price, locale, { compact: true })} average entry`)
                  : (isArabic
                    ? "لم يتكوّن بعد رائد واضح في عمق المخزون."
                    : "No clear depth leader is visible yet.")}
              </p>
            </article>
          </div>
        </section>

        <AreasView areas={visibleAreas} />

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
                {isArabic ? "كل المناطق" : "All Areas"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                {isArabic ? "ملفات المناطق" : "Area Profiles"}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {isArabic
                ? `${formatInteger(AREAS_PAGE_SIZE, locale)} بطاقات في الصفحة للحفاظ على القراءة واضحة وسريعة.`
                : `${formatInteger(AREAS_PAGE_SIZE, locale)} cards per page so the reading rhythm stays clear.`}
            </p>
          </div>

          <div className="mb-5 rounded-2xl border border-border/60 bg-card/50 px-4 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-medium text-foreground">
                {activeCity
                  ? (isArabic ? `المدينة النشطة: ${activeCity}` : `Active city filter: ${activeCity}`)
                  : (isArabic ? "عرض كل المدن عبر نفس طبقة البيانات." : "Browsing every city through the same evidence layer.")}
              </p>
              <p className="text-xs text-muted-foreground">{resultsSummary}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pagedAreas.map((area) => (
              <AreaCard
                key={String(area.slug)}
                slug={String(area.slug)}
                area={String(area.area ?? "")}
                area_ar={typeof area.area_ar === "string" ? area.area_ar : null}
                projects={typeof area.projects === "number" ? area.projects : null}
                city={typeof area.city === "string" ? area.city : null}
                avg_price={typeof area.avg_price === "number" ? area.avg_price : null}
                avg_yield={typeof area.avg_yield === "number" ? area.avg_yield : null}
                efficiency={typeof area.efficiency === "number" ? area.efficiency : null}
                source_count={typeof area.source_count === "number" ? area.source_count : null}
                confidence={typeof area.confidence === "string" ? area.confidence : null}
                image_url={typeof area.image_url === "string" ? area.image_url : null}
                area_type={typeof area.area_type === "string" ? area.area_type : null}
                top_projects={Array.isArray(area.top_projects) ? area.top_projects.filter((item): item is string => typeof item === "string") : []}
                benchmarks={benchmarks}
                locale={locale}
              />
            ))}
          </div>

          {visibleAreas.length > 0 ? (
            <SitePagination
              summary={resultsSummary}
              previousHref={currentPage > 1 ? buildAreasHref(locale, activeCity, currentPage - 1) : null}
              nextHref={currentPage < totalPages ? buildAreasHref(locale, activeCity, currentPage + 1) : null}
              previousLabel={isArabic ? "السابق" : "Previous"}
              nextLabel={isArabic ? "التالي" : "Next"}
              items={paginationItems}
            />
          ) : null}
        </section>
      </div>
      <Footer />
    </main>
  )
}
