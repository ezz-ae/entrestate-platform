import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getTopDataRows } from "@/lib/frontend-content"
import { TopDataSection, shouldRenderTopDataSection, deriveDistributionInsight } from "@/components/top-data/top-data-section"
import { buildDataSyncMeta } from "@/lib/data-sync-contract"
import { getRequestLocale } from "@/i18n/request"
import { getTranslations } from "next-intl/server"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title:
      locale === "ar"
        ? "بيانات السوق | Entrestate"
        : "Live Dubai Market Signals — BUY/HOLD/AVOID Feed | Entrestate",
    description:
      locale === "ar"
        ? "بيانات السوق الحية: المشاريع المصنفة، إشارات التوقيت، درجات الضغط، ومستويات الأدلة من مخزون يتم تحديثه طوال اليوم."
        : "Live Dubai market data across scored projects, timing signals, stress grades, and evidence levels, refreshed throughout the day.",
  }
}

const REQUIRED_SECTIONS = [
  "market-pulse",
  "timing-signals",
  "stress-grades",
  "yield-labels",
  "evidence-levels",
  "decision-labels",
  "affordability",
  "outcome-intents",
  "top-projects",
  "area-intelligence",
  "developer-reliability",
  "golden-visa",
  "trust-bar",
  "dld-market",
] as const

type RequiredSection = (typeof REQUIRED_SECTIONS)[number]

const SECTION_ALIASES: Record<string, RequiredSection> = {
  market_pulse: "market-pulse",
  timing_signals: "timing-signals",
  stress_grades: "stress-grades",
  yield_labels: "yield-labels",
  evidence_levels: "evidence-levels",
  decision_labels: "decision-labels",
  affordability: "affordability",
  outcome_intents: "outcome-intents",
  top_projects: "top-projects",
  area_intelligence: "area-intelligence",
  developer_reliability: "developer-reliability",
  golden_visa: "golden-visa",
  trust_bar: "trust-bar",
  confidence: "trust-bar",
  dld_market: "dld-market",
}

function normalizeSectionKey(value: string | null | undefined) {
  if (!value) return ""
  return value.trim().toLowerCase().replace(/[_\s]+/g, "-")
}

function toRequiredSection(value: string | null | undefined): RequiredSection | null {
  const normalized = normalizeSectionKey(value)
  if (!normalized) return null

  const aliased = SECTION_ALIASES[normalized] ?? normalized
  return (REQUIRED_SECTIONS as readonly string[]).includes(aliased) ? (aliased as RequiredSection) : null
}

export default async function TopDataPage() {
  const locale = await getRequestLocale()
  const t = await getTranslations({ locale, namespace: "topData" })
  const isArabic = locale === "ar"
  let topData: Awaited<ReturnType<typeof getTopDataRows>>
  try {
    topData = await getTopDataRows()
  } catch (error) {
    console.error("Top-data page failed to load; rendering empty state.", { error })
    topData = {
      data_as_of: new Date().toISOString(),
      sections: [],
    }
  }

  const rowsBySection = new Map<RequiredSection, (typeof topData.sections)[number]>()
  for (const row of topData.sections) {
    const sectionKey = toRequiredSection(row.id) ?? toRequiredSection(row.section)
    if (!sectionKey || rowsBySection.has(sectionKey)) continue
    rowsBySection.set(sectionKey, row)
  }

  const availableSections = REQUIRED_SECTIONS.filter((sectionKey) => {
    const sectionData = rowsBySection.get(sectionKey)
    return sectionData ? shouldRenderTopDataSection(sectionKey, sectionData.data_json) : false
  })
  const visibleSectionCount = availableSections.length
  const missingSections = REQUIRED_SECTIONS.filter((key) => {
    const sectionData = rowsBySection.get(key)
    return !sectionData || !shouldRenderTopDataSection(key, sectionData.data_json)
  })
  const timingSection = rowsBySection.get("timing-signals")
  const timingInsight = timingSection
    ? deriveDistributionInsight(timingSection.data_json, "timing-signals", locale)
    : null
  const stressSection = rowsBySection.get("stress-grades")
  const stressInsight = stressSection
    ? deriveDistributionInsight(stressSection.data_json, "stress-grades", locale)
    : null
  const regimeLine = timingInsight ?? stressInsight
  const syncMeta = buildDataSyncMeta("topData", topData.data_as_of)
  const syncTimestamp = new Date(syncMeta.syncedAt).toLocaleString(isArabic ? "ar-AE-u-nu-latn" : "en-AE", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Dubai",
  })

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
            {isArabic
              ? "بيانات السوق"
              : "Market Signal Engine"}
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">
            {isArabic ? "بيانات السوق" : "Live market data, right now"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic
              ? "كل مقطع أدناه يعكس الحالة الحالية للمخزون المصنّف، ويتم تحديثه طوال اليوم من بيانات DLD ومصادر القوائم."
              : "Every section below reflects the current state of scored inventory, updated throughout the day from DLD and listing sources."}
          </p>
          {regimeLine ? (
            <p className="mt-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-300/90">
              {regimeLine}
            </p>
          ) : null}
        </header>

        <section className="mb-6 flex flex-wrap items-center gap-3">
          {availableSections.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" />
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{availableSections.length}</span>
                {isArabic ? `/${visibleSectionCount} أقسام مباشرة` : `/${visibleSectionCount} live sections`}
              </span>
            </div>
          )}
          <div className="rounded-xl border border-border/60 bg-card/70 px-4 py-2.5 text-xs text-muted-foreground">
            {isArabic ? (
              <>
                ابدأ بـ <span className="font-medium text-foreground">نبض السوق</span> ثم افحص <span className="font-medium text-foreground">التوقيت</span> و <span className="font-medium text-foreground">الضغط</span>
              </>
            ) : (
              <>
                Start with <span className="font-medium text-foreground">Market Pulse</span>, then scan <span className="font-medium text-foreground">Timing</span> and <span className="font-medium text-foreground">Stress</span>
              </>
            )}
          </div>
          {missingSections.length > 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-2.5 text-xs text-amber-400">
              <span className="font-medium">{missingSections.length}</span> {isArabic ? "أقسام قيد المزامنة" : "sections syncing"}
            </div>
          ) : null}
          {availableSections.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card/70 px-4 py-2.5 text-xs text-muted-foreground">
              {isArabic
                ? "يتم تحديث بيانات المؤشرات الآن. أعد المحاولة بعد دقائق."
                : "Signal data is refreshing. Please check back in a few minutes."}
            </div>
          ) : null}
          <div className="rounded-xl border border-border/60 bg-card/70 px-4 py-2.5 text-[11px] text-muted-foreground/70">
            {isArabic
              ? `مزامنة API · ${syncMeta.primaryView} · ${syncTimestamp} GST`
              : `API sync · ${syncMeta.primaryView} · ${syncTimestamp} GST`}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-12">
          {REQUIRED_SECTIONS.map((sectionId) => {
            const sectionData = rowsBySection.get(sectionId)
            if (!sectionData) return null

            if (!shouldRenderTopDataSection(sectionId, sectionData.data_json)) return null

            return (
              <TopDataSection
                key={sectionId}
                section={sectionId}
                locale={locale}
                title={t(`sections.${sectionId}.title`)}
                subtitle={t(`sections.${sectionId}.subtitle`)}
                confidence={sectionData.confidence ?? null}
                lastUpdated={sectionData.last_updated ?? null}
                data={sectionData.data_json}
              />
            )
          })}
        </div>
      </div>
      <Footer />
    </main>
  )
}
