import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DeveloperCard } from "@/components/decision/developer-card"
import { SitePagination, type SitePaginationItem } from "@/components/site-pagination"
import { listDevelopers } from "@/lib/decision-infrastructure"
import { buildDataSyncMeta } from "@/lib/data-sync-contract"
import { TrendingUp, Building2, BarChart3, ShieldCheck, Users2 } from "lucide-react"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { formatAed } from "@/lib/format/currency"
import { formatDate } from "@/lib/format/date"
import { formatInteger } from "@/lib/format/number"
import { getPlatformMetrics } from "@/lib/platform-metrics.server"
import { PLATFORM_METRICS_FALLBACK } from "@/lib/platform-metrics"
import { buildPaginationWindow, clampPage, parsePageParam } from "@/lib/pagination"

export const dynamic = "force-dynamic"

const DEVELOPERS_PAGE_SIZE = 9

type SearchParams = { filter?: string; sort?: string; page?: string }

function buildDevelopersHref(locale: "en" | "ar", filter: string | undefined, sort: string, page: number) {
  const params = new URLSearchParams()
  if (filter) params.set("filter", filter)
  if (sort !== "reliability") params.set("sort", sort)
  if (page > 1) params.set("page", String(page))
  const query = params.toString()
  return prefixLocalePath(query ? `/developers?${query}` : "/developers", locale)
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const metrics = await getPlatformMetrics().catch(() => PLATFORM_METRICS_FALLBACK)
  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US")

  return {
    title:
      locale === "ar"
        ? `موثوقية مطوري دبي — ${formatter.format(metrics.ratedDevelopers)} مطوراً مُقيّماً | Entrestate`
        : `Dubai Developer Reliability Scores — ${formatter.format(metrics.ratedDevelopers)} Rated | Entrestate`,
    description:
      locale === "ar"
        ? "تتبّع أداء المطورين عبر الاتساق ومعدل التسليم وسلامة المشاريع وجودة التنفيذ، مع درجات موثوقية للمطورين أصحاب السجل الموثق."
        : "Track developers across consistency, delivery, safe-project count, and execution quality, with reliability scores for developers backed by verified records.",
  }
}

function tierOf(score: number | null): "excellent" | "good" | "watch" | "unknown" {
  if (score === null) return "unknown"
  if (score >= 80) return "excellent"
  if (score >= 60) return "good"
  return "watch"
}

export default async function DevelopersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { filter, sort = "reliability", page } = await searchParams
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const data = await listDevelopers()

  const developers = data.developers

  // Derive tier counts
  const tierCounts = { excellent: 0, good: 0, watch: 0 }
  const withRel = developers.filter((d) => typeof d.reliability === "number")
  for (const d of withRel) {
    const t = tierOf(d.reliability as number)
    if (t === "excellent") tierCounts.excellent++
    else if (t === "good") tierCounts.good++
    else if (t === "watch") tierCounts.watch++
  }
  const avgRel = withRel.length > 0
    ? withRel.reduce((sum, d) => sum + (d.reliability as number), 0) / withRel.length
    : null
  const totalDevelopersCount = developers.length
  const totalProjects = developers.reduce((sum, d) => sum + (typeof d.projects === "number" ? d.projects : 0), 0)
  const avgPrice = (() => {
    const withPrice = developers.filter((d) => typeof d.avg_price === "number" && (d.avg_price as number) > 0)
    if (withPrice.length === 0) return null
    return withPrice.reduce((sum, d) => sum + (d.avg_price as number), 0) / withPrice.length
  })()

  // Sort
  const sorted = [...developers].sort((a, b) => {
    if (sort === "projects") return (typeof b.projects === "number" ? b.projects : 0) - (typeof a.projects === "number" ? a.projects : 0)
    if (sort === "price") return (typeof b.avg_price === "number" ? b.avg_price : 0) - (typeof a.avg_price === "number" ? a.avg_price : 0)
    return (typeof b.reliability === "number" ? b.reliability : 0) - (typeof a.reliability === "number" ? a.reliability : 0)
  })

  // Apply filter
  const filtered = filter && ["excellent", "good", "watch"].includes(filter)
    ? sorted.filter((d) => tierOf(typeof d.reliability === "number" ? d.reliability as number : null) === filter)
    : sorted
  const requestedPage = parsePageParam(page)
  const totalPages = Math.max(1, Math.ceil(filtered.length / DEVELOPERS_PAGE_SIZE))
  const currentPage = clampPage(requestedPage, totalPages)
  const pageStartIndex = (currentPage - 1) * DEVELOPERS_PAGE_SIZE
  const pageEndIndex = Math.min(pageStartIndex + DEVELOPERS_PAGE_SIZE, filtered.length)
  const pagedDevelopers = filtered.slice(pageStartIndex, pageEndIndex)

  const FILTER_TABS = [
    { key: "", label: isArabic ? "كل المطورين" : "All developers", count: developers.length },
    { key: "excellent", label: isArabic ? "ممتاز" : "Excellent", count: tierCounts.excellent, dot: "bg-emerald-500" },
    { key: "good", label: isArabic ? "جيد" : "Good", count: tierCounts.good, dot: "bg-amber-500" },
    { key: "watch", label: isArabic ? "قائمة المراقبة" : "Watch list", count: tierCounts.watch, dot: "bg-red-400" },
  ]

  const SORT_OPTIONS = [
    { key: "reliability", label: isArabic ? "حسب درجة الموثوقية" : "By reliability score" },
    { key: "projects", label: isArabic ? "حسب عدد المشاريع" : "By project count" },
    { key: "price", label: isArabic ? "حسب متوسط السعر" : "By avg price" },
  ]

  const freshnessLabel = data.data_as_of
    ? formatDate(data.data_as_of, locale)
    : null
  const syncMeta = buildDataSyncMeta("developers", data.data_as_of)
  const syncTimestamp = new Date(syncMeta.syncedAt).toLocaleString(isArabic ? "ar-AE" : "en-AE")
  const paginationItems: SitePaginationItem[] = buildPaginationWindow(currentPage, totalPages).map((item) =>
    typeof item === "number"
      ? {
          key: `developer-page-${item}`,
          label: String(item),
          href: buildDevelopersHref(locale, filter, sort, item),
          active: item === currentPage,
        }
      : {
          key: item,
          label: "…",
          ellipsis: true,
        },
  )
  const resultsSummary = filtered.length > 0
    ? (isArabic
        ? `عرض ${formatInteger(pageStartIndex + 1, locale)}–${formatInteger(pageEndIndex, locale)} من ${formatInteger(filtered.length, locale)} مطوراً · الصفحة ${formatInteger(currentPage, locale)} من ${formatInteger(totalPages, locale)}`
        : `Showing ${formatInteger(pageStartIndex + 1, locale)}–${formatInteger(pageEndIndex, locale)} of ${formatInteger(filtered.length, locale)} developers · page ${formatInteger(currentPage, locale)} of ${formatInteger(totalPages, locale)}`)
    : (isArabic
        ? "لا توجد نتائج مطابقة في هذا العرض."
        : "No developers match the current view.")

  const tierInsight = withRel.length > 0
    ? isArabic
      ? `${formatInteger(tierCounts.excellent, locale)} ممتاز، ${formatInteger(tierCounts.good, locale)} جيد، ${formatInteger(tierCounts.watch, locale)} على قائمة المراقبة — جودة التنفيذ ليست موزعة بالتساوي.`
      : `${formatInteger(tierCounts.excellent, locale)} Excellent, ${formatInteger(tierCounts.good, locale)} Good, ${formatInteger(tierCounts.watch, locale)} on watch — execution quality is not evenly distributed.`
    : null
  const headerBodyBase = isArabic
    ? `${formatInteger(developers.length, locale)} مطوراً متابعاً. و${formatInteger(withRel.length, locale)} منهم يملكون سجلات موثقة بدرجات موثوقية قابلة للفحص.`
    : `${formatInteger(developers.length, locale)} developers tracked. ${formatInteger(withRel.length, locale)} with verified records and reliability scores you can inspect.`
  const copy = {
    audit: isArabic ? "موثوقية المطور" : "Developer Reliability",
    titleLead: isArabic ? "المطورون" : "Developer",
    titleAccent: isArabic ? "الموثوقون" : "Reliability",
    headerBody: tierInsight ? `${headerBodyBase} ${tierInsight}` : headerBodyBase,
    freshness: isArabic ? "تحديث التدقيق" : "Audit Freshness",
    trackedDevelopers: isArabic ? "المطورون المتابعون" : "Tracked Developers",
    trackedDevelopersSub: isArabic ? "نشطون في سوق الإمارات" : "Active in UAE market",
    totalProjects: isArabic ? "إجمالي المشاريع" : "Total Projects",
    totalProjectsSub: isArabic ? "عبر جميع المحافظ" : "Across all portfolios",
    avgReliability: isArabic ? "متوسط الموثوقية" : "Avg Reliability",
    avgReliabilityGood: isArabic ? "السوق صحي" : "Market is healthy",
    avgReliabilityMixed: isArabic ? "جودة التنفيذ متفاوتة" : "Mixed execution quality",
    insufficient: isArabic ? "بيانات غير كافية" : "Insufficient data",
    avgProjectPrice: isArabic ? "متوسط سعر المشروع" : "Avg Project Price",
    avgProjectPriceSub: isArabic ? "عبر المخزون المتابع" : "Across tracked inventory",
    reliabilityDistribution: isArabic ? "توزيع الموثوقية" : "Reliability Distribution",
    reliabilityScale: isArabic ? "الدرجات ≥80 = ممتاز · 60–79 = جيد · أقل من 60 = مراقبة" : "Scores ≥80 = Excellent · 60–79 = Good · <60 = Watch",
    sort: isArabic ? "الترتيب:" : "Sort:",
    showing: isArabic
      ? `${resultsSummary}${filter ? ` · تمت التصفية حسب ${filter}` : ""}`
      : `${resultsSummary}${filter ? ` · filtered by ${filter}` : ""}`,
    emptyTitle: isArabic ? "لا يوجد مطورون في هذا التصنيف" : "No developers in this tier",
    emptyBody: isArabic ? "جرّب فلتر آخر أو اعرض كل المطورين." : "Try a different filter or view all developers.",
    clearFilter: isArabic ? "مسح الفلتر" : "Clear filter",
    pageRhythm: isArabic ? "تسعة ملفات في الصفحة حتى يبقى التقييم مقروءاً." : "Nine profiles per page so the audit stays readable.",
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">

        {/* Header */}
        <header className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 rounded-full border border-primary/10">
              <Users2 className="w-3 h-3" />
              {copy.audit}
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground leading-tight tracking-tight">
              {isArabic
                ? <>{formatInteger(developers.length, locale)} مطوراً. <span className="text-muted-foreground/40 italic">ودرجات موثوقية على أصحاب السجل الموثق.</span></>
                : <>{formatInteger(developers.length, locale)} developers. <span className="text-muted-foreground/40 italic">Reliability scores on the verified track records.</span></>}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed">
              {copy.headerBody}
            </p>
          </div>
          {freshnessLabel && (
            <div className="flex flex-col md:items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1">{copy.freshness}</span>
              <p className="text-xs font-bold text-foreground bg-secondary/50 px-3 py-1 rounded-lg border border-border/40">
                {freshnessLabel}
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground/60">
                {isArabic
                  ? `مزامنة API · ${syncMeta.primaryView} · ${syncTimestamp}`
                  : `API sync · ${syncMeta.primaryView} · ${syncTimestamp}`}
              </p>
            </div>
          )}
        </header>

        {/* Metric cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: copy.trackedDevelopers, value: formatInteger(totalDevelopersCount, locale), sub: copy.trackedDevelopersSub, icon: Building2, color: "text-primary" },
            { label: copy.totalProjects, value: formatInteger(totalProjects, locale), sub: copy.totalProjectsSub, icon: BarChart3, color: "text-sky-500" },
            { label: copy.avgReliability, value: avgRel !== null ? `${avgRel.toFixed(0)} / 100` : "—", sub: avgRel !== null ? (avgRel >= 70 ? copy.avgReliabilityGood : copy.avgReliabilityMixed) : copy.insufficient, icon: ShieldCheck, color: avgRel !== null ? (avgRel >= 70 ? "text-emerald-500" : "text-amber-500") : "text-muted-foreground" },
            { label: copy.avgProjectPrice, value: formatAed(avgPrice, locale, { compact: true, fallback: "—" }), sub: copy.avgProjectPriceSub, icon: TrendingUp, color: "text-violet-500" },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="rounded-2xl border border-border bg-card px-5 py-4">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${card.color}`} />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.label}</p>
                </div>
                <p className={`mt-2 text-2xl font-bold tabular-nums ${card.color}`}>{card.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{card.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Reliability tier bar */}
        <div className="mb-8 rounded-2xl border border-border/60 bg-card/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">{copy.reliabilityDistribution}</p>
            <p className="text-[10px] text-muted-foreground/50">
              {copy.reliabilityScale}
            </p>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
            {developers.length > 0 && (
              <>
                <div className="bg-emerald-500 transition-all" style={{ width: `${(tierCounts.excellent / developers.length) * 100}%` }} />
                <div className="bg-amber-500 transition-all" style={{ width: `${(tierCounts.good / developers.length) * 100}%` }} />
                <div className="bg-red-400 transition-all" style={{ width: `${(tierCounts.watch / developers.length) * 100}%` }} />
              </>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            {[
              { label: isArabic ? "ممتاز" : "Excellent", count: tierCounts.excellent, color: "bg-emerald-500" },
              { label: isArabic ? "جيد" : "Good", count: tierCounts.good, color: "bg-amber-500" },
              { label: isArabic ? "مراقبة" : "Watch", count: tierCounts.watch, color: "bg-red-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-semibold text-foreground tabular-nums">{item.count}</span>
                <span className="text-[10px] text-muted-foreground/50">
                  ({developers.length > 0 ? ((item.count / developers.length) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters + sort row */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => {
              const isActive = (tab.key === "" && !filter) || tab.key === filter
              const href = tab.key
                ? prefixLocalePath(`/developers?filter=${tab.key}${sort !== "reliability" ? `&sort=${sort}` : ""}`, locale)
                : prefixLocalePath(`/developers${sort !== "reliability" ? `?sort=${sort}` : ""}`, locale)
              return (
                <Link
                  key={tab.key}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-foreground/30 bg-foreground text-background"
                      : "border-border/60 bg-card/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  }`}
                >
                  {(tab as { dot?: string }).dot && (
                    <span className={`h-1.5 w-1.5 rounded-full ${(tab as { dot?: string }).dot}`} />
                  )}
                  {tab.label}
                  <span className={`tabular-nums text-[10px] ${isActive ? "text-background/60" : "text-muted-foreground"}`}>
                    {formatInteger(tab.count, locale)}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{copy.sort}</span>
            <div className="flex gap-1.5">
              {SORT_OPTIONS.map((opt) => {
                const isActive = sort === opt.key || (opt.key === "reliability" && !sort)
                const href = filter
                  ? prefixLocalePath(`/developers?filter=${filter}&sort=${opt.key}`, locale)
                  : prefixLocalePath(`/developers?sort=${opt.key}`, locale)
                return (
                  <Link
                    key={opt.key}
                    href={href}
                    className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                      isActive
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border/50 bg-card/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Showing count */}
        <p className="mb-4 text-xs text-muted-foreground/60">
          {copy.showing}
        </p>

        <div className="mb-5 rounded-2xl border border-border/60 bg-card/50 px-4 py-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-foreground">
              {filter
                ? (isArabic ? `نطاق القراءة الحالي: ${filter}` : `Current reading band: ${filter}`)
                : (isArabic ? "عرض كامل لسجل المطورين الموثق." : "Full browse across the verified developer register.")}
            </p>
            <p className="text-xs text-muted-foreground">{copy.pageRhythm}</p>
          </div>
        </div>

        {/* Cards grid */}
        <section className="relative grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_-10%,rgba(99,102,241,0.12),transparent_58%)]" />
          {pagedDevelopers.map((developer) => (
            <DeveloperCard
              key={String(developer.slug)}
              slug={String(developer.slug)}
              developer={String(developer.developer ?? "Developer")}
              developer_ar={typeof developer.developer_ar === "string" ? developer.developer_ar : null}
              projects={typeof developer.projects === "number" ? developer.projects : null}
              reliability={typeof developer.reliability === "number" ? developer.reliability : null}
              tier={typeof developer.tier === "string" ? developer.tier : null}
              avg_price={typeof developer.avg_price === "number" ? developer.avg_price : null}
              safe_projects={(() => {
                const value = (developer as unknown as { safe_projects?: unknown }).safe_projects
                return typeof value === "number" && Number.isFinite(value) ? value : null
              })()}
              logo_url={typeof developer.logo_url === "string" ? developer.logo_url : null}
              top_areas={
                Array.isArray(developer.top_areas)
                  ? developer.top_areas.filter((item): item is string => typeof item === "string")
                  : null
              }
              top_projects={
                Array.isArray(developer.top_projects)
                  ? developer.top_projects.filter((item): item is string => typeof item === "string")
                  : null
              }
              apiPreview={developer as Record<string, unknown>}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">{copy.emptyTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">{copy.emptyBody}</p>
              <Link href={prefixLocalePath("/developers", locale)} className="mt-4 inline-block rounded-full border border-border/60 bg-card px-4 py-2 text-xs text-foreground transition hover:border-primary/40">
                {copy.clearFilter}
              </Link>
            </div>
          )}
        </section>

        {filtered.length > 0 ? (
          <SitePagination
            summary={resultsSummary}
            previousHref={currentPage > 1 ? buildDevelopersHref(locale, filter, sort, currentPage - 1) : null}
            nextHref={currentPage < totalPages ? buildDevelopersHref(locale, filter, sort, currentPage + 1) : null}
            previousLabel={isArabic ? "السابق" : "Previous"}
            nextLabel={isArabic ? "التالي" : "Next"}
            items={paginationItems}
          />
        ) : null}
      </div>
      <Footer />
    </main>
  )
}
