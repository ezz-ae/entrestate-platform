import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { JsonLd } from "@/components/JsonLd"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { ConfidenceBadge, StressGradeBadge, TimingSignalBadge } from "@/components/decision/badges"
import { EvidenceDrawer } from "@/components/decision/evidence-drawer"
import { formatAed, formatScore, formatYield } from "@/components/decision/formatters"
import { ProjectCard } from "@/components/decision/project-card"
import { prefixLocalePath } from "@/i18n/locale"
import { getRequestLocale } from "@/i18n/request"
import { pickLocalizedText } from "@/lib/format/entities"
import { formatInteger } from "@/lib/format/number"
import { getProjectBySlug } from "@/lib/decision-infrastructure"
import { SEO, absoluteUrl, getLocaleAlternates, getOpenGraphLocale } from "@/lib/seo"
import { breadcrumbSchema, realEstateListingSchema } from "@/lib/seo/schema"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const detail = await getProjectBySlug(slug)

  if (!detail) {
    return {
      title: locale === "ar" ? "المشروع غير موجود | Entrestate" : "Project not found | Entrestate",
      alternates: getLocaleAlternates(`/properties/${slug}`, locale),
    }
  }

  const project = detail.project
  const name = String(project.name ?? project.project_name ?? "Project").trim()
  const area = pickLocalizedText(locale, project.area_ar, project.final_area ?? project.area, locale === "ar" ? "دبي" : "Dubai")
  const developer = pickLocalizedText(locale, project.developer_ar, project.developer, locale === "ar" ? "المطور" : "Developer")
  const title = locale === "ar"
    ? `${name} — تقييم المشروع والأدلة | Entrestate`
    : `${name} — Project score and evidence | Entrestate`
  const description = locale === "ar"
    ? `${name} في ${area} من ${developer}. راجع الحكم المدعوم بالأدلة، إشارة التوقيت، طبقة الضغط، وحسابات العائد من صفحة المشروع الكاملة.`
    : `${name} in ${area} by ${developer}. Review the evidence-backed verdict, timing signal, stress layer, and yield calculations from the full project page.`
  const alternates = getLocaleAlternates(`/properties/${slug}`, locale)

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      locale: getOpenGraphLocale(locale),
      url: alternates.languages?.[locale],
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim()
    if (!cleaned) return null
    const numeric = Number(cleaned)
    return Number.isFinite(numeric) ? numeric : null
  }
  return null
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false
  if (typeof value === "number") return Number.isFinite(value)
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0
  return true
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function formatValue(value: unknown, locale: string, booleanCopy: { yes: string; no: string }) {
  if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString(locale) : "—"
  if (typeof value === "string") return value.trim() || "—"
  if (typeof value === "boolean") return value ? booleanCopy.yes : booleanCopy.no
  return "—"
}

function toRecordArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean)
  }

  if (typeof value === "string") {
    return value
      .split(/\s*,\s*/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function InfoGrid({
  items,
  locale,
}: {
  items: Array<{ label: string; value: string | number | null; tone?: "primary" | "default" }>
  locale: string
}) {
  const visibleItems = items.filter((item) => hasValue(item.value))

  if (visibleItems.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {visibleItems.map((item) => (
        <div key={item.label} className="rounded-xl border border-border/60 bg-background/60 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">{item.label}</p>
          <p className={`mt-2 text-base font-semibold ${item.tone === "primary" ? "text-primary" : "text-foreground"}`}>
            {typeof item.value === "number" ? item.value.toLocaleString(locale) : item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const detail = await getProjectBySlug(slug)

  if (!detail) notFound()

  const project = detail.project
  const copy = locale === "ar"
    ? {
        unknownArea: "منطقة غير معروفة",
        developerFallback: "المطور",
        pageEyebrow: "تفاصيل المشروع",
        marketSnapshot: "لقطة السوق",
        projectIntelligence: "طبقة المشروع",
        projectIntelligenceNote: "هذا المسار متصل بالمشاريع المصنفة الحية حتى عند غياب الصف الخام التفصيلي.",
        canonicalPrice: "سعر الدخول",
        canonicalYield: "العائد الإيجاري",
        investorScore: "نتيجة المستثمر",
        stressEngine: "محرك الضغط",
        verdict: "الحكم",
        timingSignal: "إشارة التوقيت",
        evidenceLevel: "مستوى الأدلة",
        marketSignal: "إشارة السوق",
        clusterArchetype: "تصنيف الأصل",
        bedMix: "أنواع الوحدات",
        dldTransactions: "معاملات DLD",
        sourceVersion: "نسخة التقييم",
        liveCalculations: "الحسابات المباشرة",
        dldFee: "رسوم تسجيل DLD",
        netYield: "العائد الصافي",
        serviceCharge: "رسوم الخدمة",
        paymentPlan: "خطة الدفع",
        units: "الوحدات",
        milestone: "مرحلة",
        unit: "وحدة",
        areaContext: "سياق المنطقة",
        developerProfile: "سياق المطور",
        similarProjects: "مشاريع مشابهة",
        areaProjects: "المشاريع في المنطقة",
        areaAvgPrice: "متوسط سعر المنطقة",
        areaAvgYield: "متوسط عائد المنطقة",
        areaEfficiency: "كفاءة المنطقة",
        developerProjects: "مشاريع المطور",
        developerReliability: "موثوقية المطور",
        developerEfficiency: "كفاءة المطور",
        activeAreas: "المناطق النشطة",
        topProjects: "أفضل المشاريع",
        noAreaContext: "لا توجد طبقة منطقة إضافية في هذا المسار حالياً.",
        noDeveloperContext: "لا توجد طبقة مطور إضافية في هذا المسار حالياً.",
        noSimilarProjects: "لا توجد مشاريع مقارنة مرتبطة في المسار الحالي.",
        goToArea: "عرض المنطقة",
        goToDeveloper: "عرض المطور",
        yes: "نعم",
        no: "لا",
      }
    : {
        unknownArea: "Unknown area",
        developerFallback: "Developer",
        pageEyebrow: "Project Detail",
        marketSnapshot: "Market snapshot",
        projectIntelligence: "Project intelligence",
        projectIntelligenceNote: "This route is connected to the live scored project inventory even when the deeper raw detail row is unavailable.",
        canonicalPrice: "Entry price",
        canonicalYield: "Rental yield",
        investorScore: "Investor score",
        stressEngine: "Stress engine",
        verdict: "Verdict",
        timingSignal: "Timing signal",
        evidenceLevel: "Evidence level",
        marketSignal: "Market signal",
        clusterArchetype: "Asset class",
        bedMix: "Bed mix",
        dldTransactions: "DLD transactions",
        sourceVersion: "Score version",
        liveCalculations: "Live calculations",
        dldFee: "DLD registration fee",
        netYield: "Net yield",
        serviceCharge: "Service charge",
        paymentPlan: "Payment plan",
        units: "Units",
        milestone: "Milestone",
        unit: "Unit",
        areaContext: "Area context",
        developerProfile: "Developer context",
        similarProjects: "Comparable projects",
        areaProjects: "Projects in area",
        areaAvgPrice: "Area average price",
        areaAvgYield: "Area average yield",
        areaEfficiency: "Area efficiency",
        developerProjects: "Developer projects",
        developerReliability: "Developer reliability",
        developerEfficiency: "Developer efficiency",
        activeAreas: "Active areas",
        topProjects: "Top projects",
        noAreaContext: "No additional area layer is attached on the current route.",
        noDeveloperContext: "No additional developer layer is attached on the current route.",
        noSimilarProjects: "No comparable projects are linked on the current route.",
        goToArea: "View area",
        goToDeveloper: "View developer",
        yes: "Yes",
        no: "No",
      }

  const areaLabel = pickLocalizedText(locale, project.area_ar, project.final_area ?? project.area, copy.unknownArea)
  const developerLabel = pickLocalizedText(locale, project.developer_ar, project.developer, copy.developerFallback)
  const paymentPlanRows = toRecordArray(project.payment_plan_structured)
  const unitRows = toRecordArray(project.units)
  const areaContext = toObject(detail.area_context)
  const developerProfile = toObject(detail.developer_profile)
  const areaTopProjects = toStringArray(areaContext.top_projects)
  const developerAreas = toStringArray(developerProfile.areas ?? developerProfile.top_areas)
  const developerTopProjects = toStringArray(developerProfile.top_projects)
  const bedroomValues = toStringArray(project.bedrooms)
  const bedroomNumbers = bedroomValues
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value))
  const projectAreaSlug = slugify(String(project.final_area ?? project.area ?? "area"))
  const projectDeveloperSlug = slugify(String(project.developer ?? "developer"))
  const intelligenceItems = [
    {
      label: copy.verdict,
      value: typeof project.decision_label_v1 === "string" ? project.decision_label_v1 : null,
      tone: "primary" as const,
    },
    {
      label: copy.timingSignal,
      value: typeof project.l3_timing_signal === "string"
        ? project.l3_timing_signal
        : typeof project.timing_label === "string"
          ? project.timing_label
          : null,
    },
    {
      label: copy.evidenceLevel,
      value:
        typeof project.evidence_level === "string"
          ? project.evidence_level
          : typeof project.evidence_label_v1 === "string"
            ? project.evidence_label_v1
            : null,
    },
    {
      label: copy.marketSignal,
      value: typeof project.market_signal === "string" ? project.market_signal : null,
    },
    {
      label: copy.clusterArchetype,
      value: typeof project.cluster_archetype === "string" ? project.cluster_archetype : null,
    },
    {
      label: copy.sourceVersion,
      value: typeof project.score_version === "string" ? project.score_version : null,
    },
  ]

  const marketSnapshotItems = [
    { label: copy.canonicalPrice, value: formatAed(project.l1_canonical_price ?? project.price_from_aed, locale) },
    { label: copy.canonicalYield, value: formatYield(project.l1_canonical_yield ?? project.rental_yield, locale) },
    { label: copy.investorScore, value: formatScore(project.engine_god_metric ?? project.investor_score_v1, locale) },
    { label: copy.stressEngine, value: formatScore(project.engine_stress_test ?? project.stress_score, locale) },
    {
      label: copy.bedMix,
      value: bedroomValues.length > 0
        ? bedroomValues.join(" · ")
        : hasValue(project.beds)
          ? formatValue(project.beds, locale, copy)
          : null,
    },
    {
      label: copy.dldTransactions,
      value: toNumber(project.dld_txn_count) !== null ? formatInteger(toNumber(project.dld_txn_count), locale) : null,
    },
  ]

  const liveCalculationItems = [
    {
      label: copy.dldFee,
      value: toNumber(project.dld_registration_fee) !== null ? formatAed(project.dld_registration_fee, locale) : null,
    },
    {
      label: copy.netYield,
      value: toNumber(project.yield_net_pct) !== null ? formatYield(project.yield_net_pct, locale) : null,
    },
    {
      label: copy.serviceCharge,
      value: toNumber(project.service_charge_pct) !== null ? formatYield(project.service_charge_pct, locale) : null,
    },
  ].filter((item) => item.value !== null)

  const areaItems = [
    {
      label: copy.areaProjects,
      value: toNumber(areaContext.projects) !== null ? formatInteger(toNumber(areaContext.projects), locale) : null,
    },
    {
      label: copy.areaAvgPrice,
      value: toNumber(areaContext.avg_price) !== null ? formatAed(areaContext.avg_price, locale) : null,
    },
    {
      label: copy.areaAvgYield,
      value: toNumber(areaContext.avg_yield) !== null ? formatYield(toNumber(areaContext.avg_yield), locale) : null,
    },
    {
      label: copy.areaEfficiency,
      value: toNumber(areaContext.avg_efficiency) !== null ? formatScore(toNumber(areaContext.avg_efficiency), locale) : null,
    },
  ]

  const developerItems = [
    {
      label: copy.developerProjects,
      value: toNumber(developerProfile.projects) !== null ? formatInteger(toNumber(developerProfile.projects), locale) : null,
    },
    {
      label: copy.developerReliability,
      value: toNumber(developerProfile.reliability) !== null ? formatScore(toNumber(developerProfile.reliability), locale) : null,
    },
    {
      label: copy.developerEfficiency,
      value: toNumber(developerProfile.efficiency) !== null ? formatScore(toNumber(developerProfile.efficiency), locale) : null,
    },
    {
      label: copy.activeAreas,
      value: developerAreas.length > 0 ? formatInteger(developerAreas.length, locale) : null,
    },
  ]

  const structuredDescription = locale === "ar"
    ? `${String(project.name ?? project.project_name ?? "المشروع")} في ${areaLabel} من ${developerLabel}. راجع الحكم المدعوم بالأدلة وإشارات التوقيت والضغط والعائد من صفحة المشروع الكاملة.`
    : `${String(project.name ?? project.project_name ?? "Project")} in ${areaLabel} by ${developerLabel}. Review the evidence-backed verdict, timing signal, stress layer, and yield calculations from the full project page.`
  const structuredImage = typeof project.hero_image === "string" && project.hero_image.trim().length > 0
    ? project.hero_image
    : absoluteUrl(SEO.defaultOgImagePath)
  const breadcrumb = breadcrumbSchema([
    { name: locale === "ar" ? "الرئيسية" : "Home", href: prefixLocalePath("/", locale) },
    { name: locale === "ar" ? "المشاريع" : "Properties", href: prefixLocalePath("/properties", locale) },
    { name: String(project.name ?? project.project_name ?? "Project"), href: prefixLocalePath(`/properties/${slug}`, locale) },
  ])
  const listing = realEstateListingSchema({
    name: String(project.name ?? project.project_name ?? "Project"),
    url: absoluteUrl(prefixLocalePath(`/properties/${slug}`, locale)),
    description: structuredDescription,
    developer: developerLabel,
    area: areaLabel,
    priceMin: toNumber(project.l1_canonical_price ?? project.price_from_aed),
    priceMax: toNumber(project.price_max ?? project.price_to_aed),
    currency: "AED",
    bedrooms: bedroomNumbers,
    completionYear: toNumber(project.completion_year),
    image: structuredImage,
  })

  return (
    <main id="main-content">
      <JsonLd data={breadcrumb} />
      <JsonLd data={listing} />
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card/70 p-6 md:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-primary/20" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(640px_circle_at_0%_0%,rgba(59,130,246,0.16),transparent_55%),radial-gradient(520px_circle_at_100%_0%,rgba(16,185,129,0.12),transparent_45%)]" />

          <div className="relative">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{copy.pageEyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              {String(project.name ?? "Project")}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {areaLabel} · {developerLabel}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <StressGradeBadge grade={typeof project.l2_stress_test_grade === "string" ? project.l2_stress_test_grade : null} />
              <TimingSignalBadge signal={typeof project.l3_timing_signal === "string" ? project.l3_timing_signal : null} />
              <ConfidenceBadge confidence={typeof project.l1_confidence === "string" ? project.l1_confidence : null} />
              {typeof project.decision_label_v1 === "string" ? (
                <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {project.decision_label_v1}
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={prefixLocalePath(`/areas/${projectAreaSlug}`, locale)}
                className="rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                {copy.goToArea}
              </Link>
              <Link
                href={prefixLocalePath(`/developers/${projectDeveloperSlug}`, locale)}
                className="rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                {copy.goToDeveloper}
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-border/70 bg-card/70 p-5">
              <h2 className="text-lg font-semibold text-foreground">{copy.marketSnapshot}</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {marketSnapshotItems
                  .filter((item) => hasValue(item.value))
                  .map((item) => (
                    <div key={item.label} className="rounded-xl border border-border/60 bg-background/60 p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">{item.label}</p>
                      <p className="mt-2 text-base font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-card/70 p-5">
              <h2 className="text-lg font-semibold text-foreground">{copy.projectIntelligence}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {copy.projectIntelligenceNote}
              </p>
              <div className="mt-4">
                <InfoGrid items={intelligenceItems} locale={locale} />
              </div>
            </div>

            {liveCalculationItems.length > 0 ? (
              <div className="rounded-[24px] border border-border/70 bg-card/70 p-5">
                <h2 className="text-lg font-semibold text-foreground">{copy.liveCalculations}</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {liveCalculationItems.map((item) => (
                    <div key={item.label} className="rounded-xl border border-border/60 bg-background/60 p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">{item.label}</p>
                      <p className="mt-2 text-base font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {paymentPlanRows.length > 0 ? (
              <div className="rounded-[24px] border border-border/70 bg-card/70 p-5">
                <h2 className="text-lg font-semibold text-foreground">{copy.paymentPlan}</h2>
                <div className="mt-4 space-y-3">
                  {paymentPlanRows.slice(0, 6).map((row, index) => (
                    <div key={`plan-${index}`} className="rounded-xl border border-border/60 bg-background/60 p-4 text-sm">
                      <p className="font-medium text-foreground">{copy.milestone} {index + 1}</p>
                      <p className="mt-2 text-muted-foreground">
                        {Object.entries(row)
                          .slice(0, 3)
                          .map(([key, value]) => `${key}: ${formatValue(value, locale, copy)}`)
                          .join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {unitRows.length > 0 ? (
              <div className="rounded-[24px] border border-border/70 bg-card/70 p-5">
                <h2 className="text-lg font-semibold text-foreground">{copy.units}</h2>
                <div className="mt-4 space-y-3">
                  {unitRows.slice(0, 6).map((row, index) => (
                    <div key={`unit-${index}`} className="rounded-xl border border-border/60 bg-background/60 p-4 text-sm">
                      <p className="font-medium text-foreground">{copy.unit} {index + 1}</p>
                      <p className="mt-2 text-muted-foreground">
                        {Object.entries(row)
                          .slice(0, 4)
                          .map(([key, value]) => `${key}: ${formatValue(value, locale, copy)}`)
                          .join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-6">
            <EvidenceDrawer
              sources={toArray(project.evidence_sources)}
              exclusions={toArray(project.evidence_exclusions)}
              assumptions={toArray(project.evidence_assumptions)}
              locale={locale}
            />

            <div className="rounded-[24px] border border-border/70 bg-card/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">{copy.areaContext}</h2>
                <Link
                  href={prefixLocalePath(`/areas/${projectAreaSlug}`, locale)}
                  className="text-sm font-medium text-primary transition hover:text-primary/80"
                >
                  {copy.goToArea}
                </Link>
              </div>
              <div className="mt-4">
                <InfoGrid items={areaItems} locale={locale} />
              </div>
              {areaTopProjects.length > 0 ? (
                <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">{copy.topProjects}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {areaTopProjects.slice(0, 3).map((projectName) => (
                      <span key={projectName} className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-sm text-foreground">
                        {projectName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {!areaItems.some((item) => hasValue(item.value)) && areaTopProjects.length === 0 ? (
                <p className="mt-4 rounded-xl border border-border/60 bg-background/60 px-4 py-4 text-sm text-muted-foreground">
                  {copy.noAreaContext}
                </p>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-border/70 bg-card/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">{copy.developerProfile}</h2>
                <Link
                  href={prefixLocalePath(`/developers/${projectDeveloperSlug}`, locale)}
                  className="text-sm font-medium text-primary transition hover:text-primary/80"
                >
                  {copy.goToDeveloper}
                </Link>
              </div>
              <div className="mt-4">
                <InfoGrid items={developerItems} locale={locale} />
              </div>
              {developerAreas.length > 0 ? (
                <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">{copy.activeAreas}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {developerAreas.slice(0, 4).map((areaName) => (
                      <span key={areaName} className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-sm text-foreground">
                        {areaName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {developerTopProjects.length > 0 ? (
                <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">{copy.topProjects}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {developerTopProjects.slice(0, 3).map((projectName) => (
                      <span key={projectName} className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-sm text-foreground">
                        {projectName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {!developerItems.some((item) => hasValue(item.value)) && developerAreas.length === 0 && developerTopProjects.length === 0 ? (
                <p className="mt-4 rounded-xl border border-border/60 bg-background/60 px-4 py-4 text-sm text-muted-foreground">
                  {copy.noDeveloperContext}
                </p>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-border/70 bg-card/70 p-5">
              <h2 className="text-lg font-semibold text-foreground">{copy.similarProjects}</h2>
              {detail.similar_projects.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {detail.similar_projects.map((similar) => (
                    <ProjectCard
                      key={String(similar.slug)}
                      slug={String(similar.slug)}
                      name={String(similar.name ?? "Project")}
                      area={String(similar.area ?? "")}
                      area_ar={typeof similar.area_ar === "string" ? similar.area_ar : null}
                      developer={String(similar.developer ?? "")}
                      developer_ar={typeof similar.developer_ar === "string" ? similar.developer_ar : null}
                      price_from={toNumber(similar.price_from)}
                      rental_yield={toNumber(similar.rental_yield)}
                      timing_label={typeof similar.timing_label === "string" ? similar.timing_label : null}
                      stress_grade_v1={typeof similar.stress_grade_v1 === "string" ? similar.stress_grade_v1 : null}
                      decision_label_v1={typeof similar.decision_label_v1 === "string" ? similar.decision_label_v1 : null}
                      investor_score_v1={toNumber(similar.investor_score_v1)}
                      l1_canonical_price={toNumber(similar.l1_canonical_price)}
                      l1_canonical_yield={toNumber(similar.l1_canonical_yield)}
                      l2_stress_test_grade={
                        typeof similar.l2_stress_test_grade === "string" ? similar.l2_stress_test_grade : null
                      }
                      l3_timing_signal={typeof similar.l3_timing_signal === "string" ? similar.l3_timing_signal : null}
                      engine_god_metric={toNumber(similar.engine_god_metric)}
                      l1_confidence={typeof similar.l1_confidence === "string" ? similar.l1_confidence : null}
                      apiPreview={
                        typeof similar.evidence_level === "string"
                          ? { evidence_level: similar.evidence_level }
                          : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-border/60 bg-background/60 px-4 py-4 text-sm text-muted-foreground">
                  {copy.noSimilarProjects}
                </p>
              )}
            </div>
          </aside>
        </section>
      </div>
      <Footer />
    </main>
  )
}
