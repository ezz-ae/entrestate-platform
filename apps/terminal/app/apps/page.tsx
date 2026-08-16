import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ExplainWithChat } from "@/components/explain-with-chat"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import {
  ArrowRight,
  Workflow,
  PhoneCall,
  MessageCircle,
  Clapperboard,
  Clock,
  Image,
  Sparkles,
  Plus,
  Shield,
  FileText,
  FolderSearch,
  PieChart,
  Gauge,
  ClipboardCheck,
} from "lucide-react"

function getApps(locale: string) {
  const isArabic = locale === "ar"

  return [
    {
      title: isArabic ? "بناء القصة البصرية" : "Storyboard Builder",
      description: isArabic ? "حوّل وسائط المشروع إلى قصة إطلاق جاهزة خلال دقائق." : "Turn project media into a cinematic storyboard in minutes.",
      summary: isArabic ? "يبني تسلسلًا بصريًا واضحًا يصلح للمشاركة والإطلاق." : "Auto-assemble a launch story with ready-to-share panels.",
      href: "/storyboard",
      learnHref: "/apps/docs/storyboard-builder",
      icon: Clapperboard,
      tag: isArabic ? "الوسائط" : "Media",
      highlight: isArabic ? "الأفضل لإطلاق المشاريع" : "Best for: launch storyboards",
      cta: isArabic ? "ابدأ القصة" : "Build storyboard",
      featured: true,
    },
    {
      title: isArabic ? "خطة الإطلاق" : "Launch Timeline",
      description: isArabic ? "رتّب مشاهد الإطلاق وتوقيته في مسار واحد واضح." : "Build a timed media sequence for project launches and ads.",
      summary: isArabic ? "يرتب المشاهد والانتقالات وتوقيت التسليم في تدفق واحد." : "Map scenes, transitions, and delivery timing in one flow.",
      href: "/timeline",
      learnHref: "/apps/docs/launch-timeline",
      icon: Clock,
      tag: isArabic ? "الوسائط" : "Media",
      highlight: isArabic ? "الأفضل لخطط الإطلاق" : "Best for: campaign timelines",
      cta: isArabic ? "خطط الإطلاق" : "Plan the launch",
      featured: false,
    },
    {
      title: isArabic ? "استوديو الصور" : "Image Studio",
      description: isArabic ? "جهّز صورًا مناسبة للإعلانات والطرح من مكتبة وسائط المشروع." : "Create listing-ready visuals from your project media library.",
      summary: isArabic ? "ينسق المقاسات والنسخ البصرية لكل قناة." : "Refine visuals, formats, and variants for every channel.",
      href: "/image-playground",
      learnHref: "/apps/docs/image-playground",
      icon: Image,
      tag: isArabic ? "الوسائط" : "Media",
      highlight: isArabic ? "الأفضل لصور الطرح" : "Best for: listing visuals",
      cta: isArabic ? "افتح الاستوديو" : "Open image studio",
      featured: false,
    },
    {
      title: isArabic ? "بناء استقبال العملاء" : "Client Intake Builder",
      description: isArabic ? "ابنِ مسار استقبال واضحًا يفرز العميل من أول خطوة." : "Build client intake flows with a guided setup and clear business rules.",
      summary: isArabic ? "ينشر مسارًا جاهزًا مع مراحل تأهيل واضحة." : "Launch a client-ready intake flow with clear qualification stages.",
      href: "/apps/agent-builder",
      learnHref: "/apps/docs/agent-first-builder",
      icon: Workflow,
      tag: isArabic ? "استقبال العملاء" : "Client Desk",
      highlight: isArabic ? "الأفضل للتأهيل والمطابقة" : "Best for: qualification + matching",
      cta: isArabic ? "افتح المُنشئ" : "Open intake builder",
      featured: true,
    },
    {
      title: isArabic ? "مكتب الاتصال الخارجي" : "Cold Calling",
      description: isArabic ? "أدر جلسات الاتصال الخارجي بالنصوص وقوائم العملاء وتسجيل النتائج." : "Run outbound calling with scripts, lead queues, and outcome logging.",
      summary: isArabic ? "يبقي جلسات الاتصال منظمة وقابلة للمتابعة." : "Keep calling sessions structured, tracked, and report-ready.",
      href: "/apps/coldcalling",
      learnHref: "/apps/docs/cold-calling",
      icon: PhoneCall,
      tag: isArabic ? "المبيعات" : "Sales",
      highlight: isArabic ? "الأفضل للمسارات الخارجية" : "Best for: outbound pipelines",
      cta: isArabic ? "افتح المكتب" : "Open call desk",
      featured: false,
    },
    {
      title: isArabic ? "مكتب رسائل العملاء" : "Insta DM Lead Desk",
      description: isArabic ? "التقط العملاء من الرسائل والمواقع والصفحات وحوّلهم إلى فرص واضحة." : "Qualify real estate leads inside Instagram DMs, sites, QR codes, and landing pages.",
      summary: isArabic ? "يحوّل الرسائل الواردة إلى عملاء مؤهلين بخطوة تالية واضحة." : "Turn inbound messages into qualified leads with clear next steps.",
      href: "/apps/lead-agent",
      learnHref: "/apps/docs/insta-dm-lead-agent",
      icon: MessageCircle,
      tag: isArabic ? "التقاط العملاء" : "Lead Desk",
      highlight: isArabic ? "الأفضل للوارد" : "Best for: inbound capture",
      cta: isArabic ? "افتح المكتب" : "Open lead desk",
      featured: true,
    },
    {
      title: isArabic ? "فرز المشاريع" : "Deal Screener",
      description: isArabic ? "فرز المشاريع حسب درجة الاستثمار، والضغط، والتوقيت، والملاءمة." : "Rank projects by investment score, stress, timing, and affordability.",
      summary: isArabic ? "يعرض النتائج بمعايير حتمية قابلة للمراجعة." : "Deterministic filtering on inventory_full with evidence-ready results.",
      href: "/market-score",
      learnHref: "/docs",
      icon: FolderSearch,
      tag: isArabic ? "الاستثمار" : "Investment Desk",
      highlight: isArabic ? "الأفضل لالتقاط الفرص" : "Best for: sourcing candidates",
      cta: isArabic ? "افتح الفرز" : "Open screener",
      featured: false,
    },
    {
      title: isArabic ? "فلتر الإقامة الذهبية" : "Golden Visa Qualifier",
      description: isArabic ? "اعثر على المشاريع المؤهلة لمسارات الإقامة الذهبية بثقة أعلى." : "Identify high-confidence AED 2M+ candidates for visa pathways.",
      summary: isArabic ? "يربط السعر والمنطقة والمطور ودرجة الضغط في فلتر واحد." : "Filter by area, developer, stress grade, and timing signal.",
      href: "/golden-visa",
      learnHref: "/docs",
      icon: Shield,
      tag: isArabic ? "الاستثمار" : "Investment Desk",
      highlight: isArabic ? "الأفضل لمسارات الإقامة" : "Best for: visa workflows",
      cta: isArabic ? "افتح الفلتر" : "Open qualifier",
      featured: false,
    },
    {
      title: isArabic ? "فحص الضغط" : "Stress Test Engine",
      description: isArabic ? "راجع درجة الضغط وتحمل المشروع قبل الالتزام." : "Review stress grade and resilience scenarios across projects.",
      summary: isArabic ? "يكشف قدرة المشروع على تحمل السيناريوهات الهابطة." : "Surface downside survivability before commitment.",
      href: "/tools/stress-test",
      learnHref: "/docs",
      icon: Gauge,
      tag: isArabic ? "الاستثمار" : "Investment Desk",
      highlight: isArabic ? "الأفضل للضبط المخاطر" : "Best for: risk controls",
      cta: isArabic ? "افتح الفحص" : "Run stress tests",
      featured: false,
    },
    {
      title: isArabic ? "مذكرة الاستثمار" : "Investor Memo Generator",
      description: isArabic ? "أخرج مذكرة جاهزة للعرض تجمع السعر والمنطقة والمطور والضغط." : "Generate institutional-grade due diligence memos.",
      summary: isArabic ? "يجمع السعر ومخاطر المنطقة وتدقيق المطور والضغط في ملف واحد." : "Combine price reality, area risk, developer DD, and stress tests.",
      href: "/tools/memo",
      learnHref: "/docs",
      icon: FileText,
      tag: isArabic ? "الاستثمار" : "Investment Desk",
      highlight: isArabic ? "الأفضل للمذكرات الجاهزة" : "Best for: IC-ready memos",
      cta: isArabic ? "ابدأ المذكرة" : "Generate memo",
      featured: false,
    },
    {
      title: isArabic ? "ملف الأدلة" : "Evidence Drawer",
      description: isArabic ? "راجع المصادر والاستبعادات والافتراضات ومستوى الثقة." : "Inspect sources, exclusions, assumptions, and confidence.",
      summary: isArabic ? "يُظهر ما يدعم القرار قبل اعتماده." : "Verify every claim before making a decision.",
      href: "/tools/evidence",
      learnHref: "/docs",
      icon: ClipboardCheck,
      tag: isArabic ? "الاستثمار" : "Investment Desk",
      highlight: isArabic ? "الأفضل للمراجعة" : "Best for: auditability",
      cta: isArabic ? "افتح الملف" : "Open evidence",
      featured: false,
    },
    {
      title: isArabic ? "بناء المحفظة" : "Portfolio Builder",
      description: isArabic ? "ركّب محفظة متعددة المشاريع بحسب المخاطرة والهدف." : "Assemble multi-project portfolios by risk and intent.",
      summary: isArabic ? "يمزج المشاريع في سلال محافظة أو نمو بحسب الهدف." : "Blend assets into conservative or growth baskets.",
      href: "/tools/portfolio",
      learnHref: "/docs",
      icon: PieChart,
      tag: isArabic ? "الاستثمار" : "Investment Desk",
      highlight: isArabic ? "الأفضل للتوزيع" : "Best for: allocation",
      cta: isArabic ? "ابدأ البناء" : "Build portfolio",
      featured: false,
    },
  ]
}

function getPillars(locale: string) {
  const isArabic = locale === "ar"

  return [
    {
      title: isArabic ? "بيانات حية ووسائط" : "Live inventory + media",
      detail: isArabic ? "كل المسارات تقرأ من نفس طبقة القوائم والأسعار والوسائط." : "Workflows pull from the same verified listings, media, and pricing spine.",
    },
    {
      title: isArabic ? "مخرجات جاهزة للاستخدام" : "Decision-ready outputs",
      detail: isArabic ? "كل مسار ينتهي بخطوة واضحة قابلة للتنفيذ." : "Every tool ends with a clear next step you can act on.",
    },
    {
      title: isArabic ? "تسليم واضح للفريق" : "Team-safe handoff",
      detail: isArabic ? "شارك المخرجات مع التسويق أو الوسطاء أو الإدارة فورًا." : "Share outputs with brokers, marketing, and leadership instantly.",
    },
  ]
}

function getAccordions(locale: string) {
  const isArabic = locale === "ar"

  return [
    {
      title: isArabic ? "كيف تبقى المسارات متصلة بطبقة البيانات" : "How workflows stay synced with the data spine",
      detail: isArabic ? "كل مسار يقرأ من نفس المخزون والأسعار والوسائط، لذلك تبقى النتائج مرتبطة بما يمكن عرضه وبيعه فعليًا." : "Each workflow reads the same live inventory, pricing, and media feeds, so every output aligns with what you can actually sell.",
    },
    {
      title: isArabic ? "ماذا يحدث بعد خروج النتيجة" : "What happens after a workflow creates a result",
      detail: isArabic ? "يمكن حفظ النتيجة داخل المكتب، أو مشاركتها، أو نقلها إلى أدوات العمل بنفس التنسيق." : "Results can be saved to your dashboard, exported to client decks, or moved into your CRM with consistent formatting.",
    },
    {
      title: isArabic ? "كيف تصل التحديثات إلى الفريق" : "How updates reach your team",
      detail: isArabic ? "تظهر القوائم والتغييرات الجديدة عبر المسارات دون إعادة بناء أو إدخال يدوي." : "New listings, media, and market changes appear across apps without manual refreshes or rework.",
    },
  ]
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return {
    title: locale === "ar" ? "مسارات العمل - Entrestate" : "Apps - Entrestate",
    description:
      locale === "ar"
        ? "واجهات عمل جاهزة للتسويق، استقبال العملاء، والقرار الاستثماري."
        : "Launch focused real estate workflows for marketing, client intake, market research, and execution.",
  }
}

export default async function AppsPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const apps = getApps(locale)
  const featuredApps = apps.filter((app) => app.featured)
  const dataPillars = getPillars(locale)
  const dataAccordions = getAccordions(locale)

  return (
    <main id="main-content">
      <Navbar />
      <section className="relative overflow-hidden bg-background pb-20 pt-28 md:pb-24 md:pt-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.22),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(71,85,105,0.24),transparent_65%)]" />
        <div className="relative mx-auto w-full max-w-[1440px] px-6">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {isArabic ? "مسارات العمل" : "Real Estate Workflows"}
            </p>
            <h1 className="text-3xl font-serif leading-tight text-foreground md:text-5xl">
              {isArabic ? "اختر الواجهة التي تخدم القرار الذي أمامك." : "Choose the surface for the decision you need to make."}
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
              {isArabic
                ? "كل مسار هنا مبني لمهمة واحدة واضحة: استقبال عميل، تجهيز قصة إطلاق، فرز مشروع، أو إخراج مذكرة جاهزة للعرض."
                : "Entrestate workflows translate market evidence into focused execution. Each surface is built for a single, high-stakes job."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {dataPillars.map((pillar) => (
              <div key={pillar.title} className="rounded-2xl border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground">
                <p className="mb-2 text-sm font-medium text-foreground">{pillar.title}</p>
                <p className="text-xs leading-relaxed">{pillar.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "المسارات الأكثر استخدامًا" : "Featured apps"}</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              {isArabic ? "ابدأ بالمسارات الأكثر حضورًا في العمل اليومي" : "Start fast with the most used workflows"}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">{isArabic ? "كل مسار هنا متصل بنفس طبقة السوق." : "Every workflow shares the same market layer."}</span>
        </div>
        <div className="mt-6 overflow-x-auto pb-4">
          <div className="flex min-w-max snap-x snap-mandatory gap-4">
            {featuredApps.map((app) => (
              <div key={app.title} className="snap-start min-w-[280px] rounded-2xl border border-border/70 bg-card/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
                    <app.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{app.tag}</p>
                    <p className="text-sm font-medium text-foreground">{app.title}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{app.description}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <Link href={prefixLocalePath(app.href, locale)} className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                    {app.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <ExplainWithChat
                    prompt={isArabic ? `اشرح لي مسار ${app.title} ومتى أستخدمه وما أول خطوة فيه.` : `Explain the ${app.title} app, when to use it, and the best first step.`}
                    label={isArabic ? "اشرح المسار" : "Explain this workflow"}
                    variant="ghost"
                    size="sm"
                    className="justify-center text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pb-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => (
            <div key={app.title} className="group rounded-2xl border border-border/70 bg-card/70 p-6 transition hover:border-primary/30 hover:bg-card/80">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{app.tag}</p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">{app.title}</h3>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/40 p-2.5">
                  <app.icon className="h-5 w-5 text-foreground" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{app.description}</p>
              <div className="mt-5 rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isArabic ? "لمحة سريعة" : "Quick summary"}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground">{app.summary}</p>
                <p className="mt-3 text-xs text-muted-foreground">{app.highlight}</p>
              </div>
              <div className="mt-5 space-y-3">
                <Link
                  href={prefixLocalePath(app.href, locale)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border/70 bg-secondary/60 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                >
                  <Plus className="h-4 w-4" />
                  {isArabic ? "افتح المسار" : "Open workflow"}
                </Link>
                <Link
                  href={prefixLocalePath(app.learnHref, locale)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border/60 px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {isArabic ? "كيف يعمل؟" : "Learn how it works"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pb-20">
        <div className="rounded-2xl border border-border/70 bg-card/70 p-8 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "إعداد مسار العملاء" : "Lead desk setup"}</p>
              <h2 className="mt-2 text-2xl font-serif text-foreground md:text-3xl">
                {isArabic ? "ابنِ مسار استقبال جاهز للعمل خلال دقائق." : "Build a client-ready lead flow in under five minutes."}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {isArabic ? "اختر الدور، أضف قواعد العمل، ثم انشر المسار ليعمل مع الفريق مباشرة." : "Choose a role, add business inputs, and publish a lead-ready flow for your team."}
              </p>
            </div>
            <Link
              href={prefixLocalePath("/apps/agent-builder", locale)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {isArabic ? "افتح مُنشئ المسار" : "Open lead builder"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pb-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "بيانات السوق المشتركة" : "Connected market data"}</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {isArabic ? "كل مسار هنا يقرأ من نفس السوق." : "Every workflow speaks the same market language."}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {isArabic ? "طبقة بيانات واحدة تحفظ اتساق الفريق وتمنع تضارب القراءة بين التسويق، المبيعات، والقرار." : "Use one data spine with multiple workflows so your team never works from different truths."}
            </p>
          </div>
          <div className="space-y-3">
            {dataAccordions.map((item) => (
              <details key={item.title} className="group rounded-xl border border-border/60 bg-card/60 px-5 py-4 open:bg-card/80 transition">
                <summary className="flex cursor-pointer items-center justify-between text-sm text-foreground">
                  {item.title}
                  <span className="text-muted-foreground transition-transform group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
