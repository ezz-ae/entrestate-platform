import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Activity, ArrowRight, BookOpen, CreditCard, FileText, Lock, Map, Search, Server, ShieldCheck, Zap, MessageSquare } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/homepage/hero-section"
import { GoldenPathsSection } from "@/components/homepage/golden-paths-section"
import { DecisionTunnelStepper } from "@/components/homepage/decision-tunnel-stepper"
import { MobileHomePage } from "@/components/mobile/mobile-home-page"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { listProperties } from "@/lib/decision-infrastructure"
import { docsArticles } from "@/lib/docs-articles"
import { libraryArticles } from "@/lib/library-data"
import { SEO, absoluteUrl, getLocaleAlternates, getSeoCopy } from "@/lib/seo"
import { getPlatformMetrics } from "@/lib/platform-metrics.server"
import { getRequestRuntimeShell } from "@/lib/runtime-shell"
import { PLATFORM_METRICS_FALLBACK } from "@/lib/platform-metrics"
import { getSessionUser } from "@/lib/auth/server"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { VerdictCard } from "@/components/platform/verdict-card"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const copy = getSeoCopy(locale)
  const metrics = await getPlatformMetrics().catch(() => PLATFORM_METRICS_FALLBACK)
  const alternates = getLocaleAlternates("/", locale)
  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US")
  const homeDescription = locale === "ar"
    ? `${formatter.format(metrics.dldTransactions)} معاملة DLD، و${formatter.format(metrics.totalProjects)} مشروعاً مقيّماً، و${formatter.format(metrics.totalAreas)} ملف منطقة، و${formatter.format(metrics.ratedDevelopers)} مطوراً مُقيّماً داخل منصة استخبارات عقارية مدعومة بالأدلة.`
    : `${formatter.format(metrics.dldTransactions)} DLD transactions, ${formatter.format(metrics.totalProjects)} scored projects, ${formatter.format(metrics.totalAreas)} area profiles, and ${formatter.format(metrics.ratedDevelopers)} rated developers in one evidence-backed UAE real estate intelligence platform.`

  return {
    title: copy.homeTitle,
    description: homeDescription,
    alternates,
    openGraph: {
      title: copy.homeTitle,
      description: homeDescription,
      url: alternates.languages?.[locale],
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.homeTitle,
      description: homeDescription,
      images: [absoluteUrl(SEO.defaultOgImagePath)],
    },
  }
}

function getStructuredData(locale: "en" | "ar") {
  const localizedSearchUrl = absoluteUrl(prefixLocalePath("/search", locale))
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SEO.siteName,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/icon.svg"),
      },
      {
        "@type": "WebSite",
        name: SEO.siteName,
        url: absoluteUrl("/"),
        potentialAction: {
          "@type": "SearchAction",
          target: `${localizedSearchUrl}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: SEO.siteName,
        url: absoluteUrl("/"),
        operatingSystem: "Web",
        applicationCategory: "BusinessApplication",
        description:
          locale === "ar"
            ? "منصة استخبارات عقارية في الإمارات تجمع الدردشة، البحث، والخريطة داخل طبقة أدلة واحدة قابلة للتدقيق."
            : "A UAE real estate intelligence platform with chat, search, and map surfaces backed by auditable evidence.",
        areaServed: {
          "@type": "Country",
          name: "United Arab Emirates",
        },
        availableLanguage: ["en", "ar"],
        featureList:
          locale === "ar"
            ? ["دردشة مدعومة بالأدلة", "بحث المشاريع", "خريطة السوق", "معرفات الطلب", "توثيق معماري عام"]
            : ["Evidence-backed chat", "Project search", "Spatial market map", "Request IDs", "Public architecture docs"],
      },
    ],
  }
}

function getTrustMarkers(locale: "en" | "ar") {
  return locale === "ar"
    ? ["مصدر DLD", "سجلات متقاطعة المراجع", "تتبّع كامل", "وصول محكوم"]
    : ["DLD Sourced", "Cross-referenced Records", "Auditable Lineage", "Governed Access"]
}

function getAutomationCards(locale: "en" | "ar") {
  return locale === "ar"
    ? [
        {
          icon: BookOpen,
          title: "دفاتر الأبحاث",
          body:
            "حوّل الأسئلة، والفرضيات، والنتائج إلى دفاتر بحث منظمة تبقى مرتبطة بحساب المستخدم ونفس طبقة الأدلة.",
          cta: "افتح دفاتر الأبحاث",
          href: "/account/book",
          accent: "text-blue-400",
        },
        {
          icon: FileText,
          title: "طبقة التقارير المؤسسية",
          body:
            "انتقل من البيانات الموثقة إلى مذكرات استثمار وتقارير سوق منشورة من دون فقد سلسلة الأدلة أو السياق.",
          cta: "تصفح مكتبة التقارير",
          href: "/reports/library",
          accent: "text-violet-400",
        },
      ]
    : [
        {
          icon: BookOpen,
          title: "Research Notebooks",
          body:
            "Turn questions, hypotheses, and findings into reusable notebooks tied to the same evidence layer.",
          cta: "Open notebooks",
          href: "/account/book",
          accent: "text-blue-400",
        },
        {
          icon: FileText,
          title: "Institutional Reports",
          body:
            "Move from verified market data to publishable investor briefs and team reports without losing provenance.",
          cta: "Browse reports",
          href: "/reports/library",
          accent: "text-violet-400",
        },
      ]
}

function getSurfaceCards(locale: "en" | "ar") {
  return locale === "ar"
    ? [
        {
          icon: MessageSquare,
          title: "الدردشة",
          body: "ابدأ من سؤال مباشر واحصل على حكم مدعوم بالأدلة مع معرف طلب واضح.",
          href: "/chat",
        },
        {
          icon: Search,
          title: "البحث",
          body: "افحص السوق والمشاريع والفلاتر من سطح مخصص للتحليل المقارن.",
          href: "/search",
        },
        {
          icon: Map,
          title: "الخريطة",
          body: "اقرأ العائد والسعر وكثافة المشاريع من منظور مكاني مباشر.",
          href: "/map",
        },
      ]
    : [
        {
          icon: MessageSquare,
          title: "Chat",
          body: "Start with a direct question and get an evidence-backed verdict with a request ID.",
          href: "/chat",
        },
        {
          icon: Search,
          title: "Search",
          body: "Screen markets, projects, and filters from a dedicated comparison surface.",
          href: "/search",
        },
        {
          icon: Map,
          title: "Map",
          body: "Read yield, price, and project density from a spatial market view.",
          href: "/map",
        },
      ]
}

function getTrustProofCards(locale: "en" | "ar") {
  return locale === "ar"
    ? [
        {
          title: "دليل البيانات",
          body: "طبقات الأدلة، TableSpec، وقرار التصفية كلها موثقة ومفتوحة للمراجعة.",
          href: "/docs/documentation",
        },
        {
          title: "الحالة والتشغيل",
          body: "صفحة الحالة تعرض حداثة البيانات، توفر الخدمات، وأهداف التشغيل.",
          href: "/status",
        },
        {
          title: "الحوكمة والخصوصية",
          body: "راجع الخصوصية والشروط ومسؤولية الاعتماد قبل دمج المنصة في مساراتك.",
          href: "/privacy",
        },
        {
          title: "طبقة المؤسسة",
          body: "راجع البنية، الـ API، وتكامل الفريق قبل الإطلاق أو التوسعة.",
          href: "/enterprise",
        },
        {
          title: "الباقات والأسعار",
          body: "مستويات الوصول، التاريخي، والتصدير واضحة قبل الاشتراك.",
          href: "/pricing",
        },
      ]
    : [
        {
          title: "Data methodology",
          body: "Evidence layers, TableSpec behavior, and filtering rules are documented and reviewable.",
          href: "/docs/documentation",
        },
        {
          title: "Status and operations",
          body: "System health, data freshness, and operating targets are exposed on the public status surface.",
          href: "/status",
        },
        {
          title: "Governance and privacy",
          body: "Privacy, terms, and reliance language are explicit before you adopt the platform.",
          href: "/privacy",
        },
        {
          title: "Enterprise layer",
          body: "Architecture, API delivery, and team rollout paths are visible before procurement.",
          href: "/enterprise",
        },
        {
          title: "Plans and pricing",
          body: "Access tiers, historical depth, and export limits are explicit before you subscribe.",
          href: "/pricing",
        },
      ]
}

function getResourceCards(locale: "en" | "ar") {
  return locale === "ar"
    ? [
        {
          title: "Decision Tunnel",
          body: "شرح كيف تتحول النية إلى TableSpec ثم إلى أدلة وحكم ومخرج نهائي.",
          href: "/docs/documentation",
        },
        {
          title: "Evidence Stack",
          body: "راجع طبقات L1-L5 وما الذي يُعد حقيقة نهائية مقابل إشارة خام.",
          href: "/docs/source-of-truth-registry",
        },
        {
          title: "تقارير ومكتبة",
          body: "ادخل إلى تقارير المكتبة وصفحات الشرح العميق لتقييم المنتج بالكامل.",
          href: "/library/reports",
        },
      ]
    : [
        {
          title: "Decision Tunnel",
          body: "See how user intent becomes TableSpec, evidence, judgment, and a final artifact.",
          href: "/docs/documentation",
        },
        {
          title: "Evidence Stack",
          body: "Review L1-L5 trust boundaries and what qualifies as canonical truth.",
          href: "/docs/source-of-truth-registry",
        },
        {
          title: "Reports and library",
          body: "Use the report library and long-form docs to evaluate the platform in depth.",
          href: "/library/reports",
        },
      ]
}

function getProofCounters(locale: "en" | "ar", docsCount: number, libraryCount: number, totalProjects: number, trustSurfaceCount: number) {
  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US")
  return locale === "ar"
    ? [
        {
          label: "المشاريع المقيّمة",
          value: formatter.format(totalProjects),
          body: "طبقة العرض تسحب من نفس العمود الفقري المستخدم في البحث والخريطة والدردشة.",
        },
        {
          label: "صفحات توثيق عامة",
          value: formatter.format(docsCount),
          body: "المعمارية، طبقات الأدلة، ونموذج القرار متاحة قبل التعاقد أو الدمج.",
        },
        {
          label: "تقارير ومكتبة",
          value: formatter.format(libraryCount),
          body: "قراءات معمقة وتقارير طويلة مرتبطة بنفس طبقة البيانات.",
        },
        {
          label: "أسطح ثقة علنية",
          value: formatter.format(trustSurfaceCount),
          body: "الحالة، التوثيق، الخصوصية، والشروط متاحة علناً وتربط حدود الاعتماد.",
        },
      ]
    : [
        {
          label: "Scored assets",
          value: formatter.format(totalProjects),
          body: "Chat, Search, and Map all read from the same underlying inventory and scoring spine.",
        },
        {
          label: "Public docs",
          value: formatter.format(docsCount),
          body: "Architecture, evidence rules, and the decision model are visible before rollout.",
        },
        {
          label: "Library deep dives",
          value: formatter.format(libraryCount),
          body: "Reports and long-form market reads are linked from the product, not hidden behind sales copy.",
        },
        {
          label: "Trust surfaces",
          value: formatter.format(trustSurfaceCount),
          body: "Status, docs, privacy, and terms are public and define the platform's reliance boundaries.",
        },
      ]
}

const API_PAYLOAD_PREVIEW = {
  project: "Marina Vista",
  area: "Dubai Marina",
  verdict: "BUY",
  confidence: 0.84,
  evidence_level: "L1_CANONICAL",
  sources: ["DLD", "PropertyFinder", "Bayut"],
  timing_score: 78,
  stress_grade: "B",
  yield_score: 72,
  drivers: {
    positive: ["DLD velocity +23% QoQ", "Below area median entry"],
    negative: ["Developer continuity at watch threshold"],
  },
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = await getRequestLocale()
  const sessionUser = await getSessionUser()
  if (sessionUser) {
    const resolvedSearchParams = (await searchParams) ?? {}
    const nextSearchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (Array.isArray(value)) {
        value.forEach((entry) => nextSearchParams.append(key, entry))
      } else if (typeof value === "string") {
        nextSearchParams.set(key, value)
      }
    }

    redirect(
      prefixLocalePath(`/me${nextSearchParams.toString() ? `?${nextSearchParams.toString()}` : ""}`, locale),
    )
  }
  const runtimeShell = await getRequestRuntimeShell()
  const isArabic = locale === "ar"
  const formatter = new Intl.NumberFormat(isArabic ? "ar-AE" : "en-US")
  const structuredDataObj = getStructuredData(locale)
  const trustMarkers = getTrustMarkers(locale)
  const automationCards = getAutomationCards(locale)
  const surfaceCards = getSurfaceCards(locale)
  const trustProofCards = getTrustProofCards(locale)
  const resourceCards = getResourceCards(locale)
  const goldenPathShortcuts = [
    {
      label: isArabic ? "اكتب موقع تطوير" : "Underwrite Development Site",
      href: prefixLocalePath("/chat?goldenPath=underwrite_development_site", locale),
    },
    {
      label: isArabic ? "قارن عوائد المناطق" : "Compare Area Yields",
      href: prefixLocalePath("/chat?goldenPath=compare_area_yields", locale),
    },
    {
      label: isArabic ? "صياغة SPA" : "Draft SPA Contract",
      href: prefixLocalePath("/chat?goldenPath=draft_spa_contract", locale),
    },
  ]

  const metrics = await getPlatformMetrics().catch(() => PLATFORM_METRICS_FALLBACK)
  const proofCounters = getProofCounters(locale, docsArticles.length, libraryArticles.length, metrics.totalProjects, trustProofCards.length)
  const featured = await listProperties({
    page: 1,
    pageSize: 1,
    sortBy: "god_metric",
    locale,
  }).catch(() => ({
    data_as_of: new Date().toISOString(),
    projects: [],
    total: 0,
    page: 1,
    pageSize: 1,
  }))

  const totalProjects = metrics.totalProjects
  const avgMarketPrice = metrics.avgPrice
  const buySignals = metrics.buySignals
  const topProject = featured.projects[0]
    ? {
        slug: String(featured.projects[0].slug),
        name: String(featured.projects[0].name ?? featured.projects[0].project_name ?? "Top project"),
        area: String(featured.projects[0].final_area ?? featured.projects[0].area ?? ""),
        developer: String(featured.projects[0].developer ?? ""),
        timing: typeof featured.projects[0].timing_label === "string"
          ? featured.projects[0].timing_label
          : typeof featured.projects[0].l3_timing_signal === "string"
            ? featured.projects[0].l3_timing_signal
            : null,
        stress: typeof featured.projects[0].stress_grade_v1 === "string"
          ? featured.projects[0].stress_grade_v1
          : typeof featured.projects[0].l2_stress_test_grade === "string"
            ? featured.projects[0].l2_stress_test_grade
            : null,
        yieldValue: typeof featured.projects[0].rental_yield === "number"
          ? featured.projects[0].rental_yield
          : typeof featured.projects[0].l1_canonical_yield === "number"
            ? featured.projects[0].l1_canonical_yield
            : null,
        score: typeof featured.projects[0].investor_score_v1 === "number"
          ? featured.projects[0].investor_score_v1
          : typeof featured.projects[0].engine_god_metric === "number"
            ? featured.projects[0].engine_god_metric
            : null,
        price: typeof featured.projects[0].price_from_aed === "number"
          ? featured.projects[0].price_from_aed
          : typeof featured.projects[0].l1_canonical_price === "number"
            ? featured.projects[0].l1_canonical_price
            : null,
      }
    : null
  const syncLabel = new Date(metrics.dataAsOf).toLocaleString(isArabic ? "ar-AE-u-nu-latn" : "en-AE", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Dubai",
  }) + " GST"

  if (runtimeShell === "mobile") {
    return (
      <main id="main-content">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredDataObj) }}
        />
        <Navbar />
        <MobileHomePage
          locale={locale}
          totalProjects={totalProjects}
          totalAreas={metrics.totalAreas}
          ratedDevelopers={metrics.ratedDevelopers}
          buySignals={buySignals}
          dldTransactions={metrics.dldTransactions}
          syncLabel={syncLabel}
          topProject={topProject}
        />
        <Footer />
      </main>
    )
  }

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredDataObj) }}
      />
      <Navbar />

      <div className="mx-auto max-w-[1100px] px-6 pb-28 pt-32 md:pt-44">
        <HeroSection
          avgMarketPrice={avgMarketPrice}
          totalProjects={totalProjects}
          buySignals={buySignals}
          totalAreas={metrics.totalAreas}
          ratedDevelopers={metrics.ratedDevelopers}
          dldTransactions={metrics.dldTransactions}
          topProject={topProject}
          syncLabel={syncLabel}
        />

        <GoldenPathsSection shortcuts={goldenPathShortcuts} />

        <section className="mt-6 rounded-2xl border border-border bg-card px-6 py-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <ShieldCheck className="h-8 w-8 shrink-0 text-primary/70" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {isArabic
                  ? "شريط الثقة للتشغيل والإثبات"
                  : "Trust bar for evidence-backed operations"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isArabic
                  ? `${formatter.format(totalProjects)} أصل مقيّم · ${formatter.format(buySignals)} إشارة توقيت BUY/STRONG_BUY · آخر دورة ${syncLabel}`
                  : `${formatter.format(totalProjects)} scored assets · ${formatter.format(buySignals)} BUY/STRONG_BUY timing signals · last cycle ${syncLabel}`}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {trustMarkers.map((marker) => (
                  <span
                    key={marker}
                    className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary"
                  >
                    {marker}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href={prefixLocalePath("/docs/data-information", locale)}
              className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-primary hover:underline"
            >
              {isArabic ? "كيف تعمل الأدلة" : "See evidence model"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>

        <section className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
              {isArabic ? "كيف يعمل المحرك" : "How the engine works"}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
              {isArabic
                ? "إشارة → أدلة → حكم → تنفيذ"
                : "Signal → Evidence → Judgment → Action"}
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              {isArabic
                ? "كل حكم يعود إلى مصدره. ليست درجات غامضة؛ بل مخرجات قابلة للتدقيق من أول إشارة حتى التنفيذ."
                : "Every verdict traces back to source. No black-box scores. Every output is auditable from first signal to execution."}
            </p>
          </div>
          <DecisionTunnelStepper />
        </section>

        <section className="mt-20 rounded-3xl border border-border bg-card/60 p-8 md:p-10">
          <div className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
              {isArabic ? "هندسة الاستخدام" : "Platform architecture"}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
              {isArabic ? "ابدأ من السطح الصحيح" : "Start from the right surface"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {isArabic
                ? "الدردشة للقرار، والبحث للمقارنة، والخريطة للقراءة المكانية. ثم تنتقل إلى الأسعار والحالة والتوثيق عندما تحتاج الاعتماد أو التكامل."
                : "Chat handles intent, Search handles comparison, and Map handles spatial reading. Pricing, Status, and Docs support adoption, rollout, and procurement."}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {surfaceCards.map((card) => {
              const Icon = card.icon
              const className =
                "group rounded-2xl border border-border/60 bg-background/50 p-5 transition hover:border-primary/30 hover:bg-background"
              const content = (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    {isArabic ? "افتح السطح" : "Open surface"}
                    <ArrowRight className="h-3 w-3" />
                  </span>
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
        </section>

        <section className="relative mt-28 overflow-hidden rounded-3xl border border-blue-500/20 bg-blue-500/5 p-8 md:p-12">
          <div className="relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
                <Lock className="h-3 w-3" />
                {isArabic ? "لفِرق المؤسسات" : "For enterprise teams"}
              </div>
              <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">
                {isArabic
                  ? "واجهتك كما هي. ومحركنا الاستخباراتي يعمل تحتها."
                  : "Your interface. Our intelligence engine underneath it."}
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                {isArabic
                  ? "انشر Entrestate خلف بوابتك الحالية. أنت تحتفظ بالعلامة والواجهة، ونحن نشغّل طبقة البيانات والتقييم والتنفيذ تحتها."
                  : "Deploy Entrestate behind your existing portal. You keep the brand and interface. We run the data, scoring, and execution layer underneath it."}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href={prefixLocalePath("/infrastructure", locale)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-blue-600 shadow-lg shadow-blue-500/25"
                >
                  {isArabic ? "اعرض طبقات المنصة" : "See the full system"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={prefixLocalePath("/contact", locale)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-8 py-4 text-sm font-semibold transition-all hover:bg-slate-900"
                >
                  {isArabic ? "استفسار مؤسسي" : "Enterprise enquiry"}
                </Link>
              </div>
            </div>

            <div className="relative aspect-square rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl lg:aspect-video">
              <div className="flex h-full flex-col">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      {isArabic ? "مسار التكامل النشط" : "Integration flow active"}
                    </span>
                  </div>
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>

                <div className="flex flex-1 flex-col justify-center space-y-4">
                  <div className="flex h-12 items-center rounded-lg border border-slate-800 bg-slate-900 px-4">
                    <div className="h-1.5 w-1/3 rounded-full bg-blue-500/40" />
                  </div>
                  <div className="flex h-12 items-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4">
                    <div className="h-1.5 w-1/2 rounded-full bg-indigo-500" />
                  </div>
                  <div className="flex h-12 items-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4">
                    <div className="h-1.5 w-2/3 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        </section>

        <section className="mt-24">
          <div className="mb-10 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
              {isArabic ? "مسارات العمل" : "Operational workflows"}
            </p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              {isArabic ? "بعد الحكم تبدأ دورة العمل الحقيقية" : "The real workflow starts after the first verdict"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              {isArabic
                ? "الدفاتر، والتقارير، ومسارات التسليم كلها تقرأ من نفس طبقة الأدلة حتى لا يبدأ الفريق من الصفر في كل مرة."
                : "Notebooks, reports, and delivery surfaces all read from the same evidence layer so teams do not restart from zero."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {automationCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-sm">
                  <Icon className={`mb-6 h-8 w-8 ${card.accent}`} />
                  <h3 className="mb-3 text-xl font-bold">{card.title}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-slate-400">{card.body}</p>
                  <Link href={prefixLocalePath(card.href, locale)} className={`flex items-center gap-2 text-sm font-semibold ${card.accent}`}>
                    {card.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-24 rounded-3xl border border-border bg-card/60 p-8 md:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                {isArabic ? "كيف تبدو النتيجة" : "What a verdict looks like"}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
                {isArabic ? "كل مخرج قابل للتفسير" : "Every output is explainable"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {isArabic
                  ? "درجة الثقة، ومستوى الأدلة، والمصادر، والعائد، والتوقيت، ومحركات النتيجة تظهر معاً في حمولة واحدة. ليست صندوقاً أسود."
                  : "Confidence score, evidence level, data sources, yield, timing, and drivers appear in one structured payload. Not a black box."}
              </p>

              <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                <p>{isArabic ? "• كل BUY أو AVOID مرتبط بمصدر بيانات مسمّى وواضح." : "• Every BUY or AVOID is linked to a specific, named data source."}</p>
                <p>{isArabic ? "• الفرق تتحرك بسرعة لأن سلسلة الأدلة جاهزة معهم مسبقاً." : "• Teams move quickly because the evidence chain is already done for them."}</p>
              </div>
            </div>

            <VerdictCard
              name={API_PAYLOAD_PREVIEW.project}
              area={API_PAYLOAD_PREVIEW.area}
              verdict={API_PAYLOAD_PREVIEW.verdict}
              confidence={API_PAYLOAD_PREVIEW.confidence}
              yieldValue={API_PAYLOAD_PREVIEW.yield_score / 10}
              stress={API_PAYLOAD_PREVIEW.stress_grade}
              timing={API_PAYLOAD_PREVIEW.verdict}
              score={API_PAYLOAD_PREVIEW.confidence * 100}
              evidenceLevel={API_PAYLOAD_PREVIEW.evidence_level}
              sources={API_PAYLOAD_PREVIEW.sources}
              positiveDrivers={API_PAYLOAD_PREVIEW.drivers.positive}
              negativeDrivers={API_PAYLOAD_PREVIEW.drivers.negative}
              jsonPayload={API_PAYLOAD_PREVIEW}
              href="/properties"
            />
          </div>
        </section>

        <section className="mt-20 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border bg-card/60 p-8 md:p-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
              {isArabic ? "الثقة والاعتماد" : "Trust and adoption"}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
              {isArabic ? "لا تعتمد على الواجهة فقط" : "Trust is operational, not cosmetic"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {isArabic
                ? "المستندات، الحالة، والحوكمة متاحة علناً حتى يعرف الفريق كيف تُنتج المنصة الحكم وما حدود الاعتماد عليه."
                : "Docs, status, and governance are public so teams can inspect how verdicts are produced and where reliance boundaries sit."}
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {trustProofCards.map((card) => (
                <Link
                  key={card.title}
                  href={prefixLocalePath(card.href, locale)}
                  className="rounded-2xl border border-border/60 bg-background/50 p-5 transition hover:border-primary/30 hover:bg-background"
                >
                  <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/60 p-8 md:p-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
              {isArabic ? "تعلم وتحقق" : "Learn and verify"}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
              {isArabic ? "المحتوى العميق متاح من البداية" : "Deep content is linked from the core flow"}
            </h2>
            <div className="mt-6 space-y-4">
              {resourceCards.map((card) => (
                <Link
                  key={card.title}
                  href={prefixLocalePath(card.href, locale)}
                  className="block rounded-2xl border border-border/60 bg-background/50 p-5 transition hover:border-primary/30 hover:bg-background"
                >
                  <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-3xl border border-border bg-card/60 p-8 md:p-10">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
              {isArabic ? "دليل علني" : "Public proof"}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
              {isArabic ? "إشارات الثقة مبنية على أسطح قابلة للمراجعة" : "Trust signals come from reviewable surfaces"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {isArabic
                ? "لا نعتمد على ادعاءات غامضة. نربط الثقة بالحالة العامة، التوثيق، السياسات، والمحتوى العميق الذي يمكن مراجعته قبل اتخاذ القرار."
                : "Trust is not handled with vague claims. It is tied to public status, architecture documentation, policy pages, and deep market content that can be reviewed before adoption."}
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {proofCounters.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/60 bg-background/50 p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/50">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
