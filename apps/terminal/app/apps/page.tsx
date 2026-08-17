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
  Building2,
  Globe,
  Megaphone,
} from "lucide-react"

/**
 * THE THREE PRODUCTS. There is nothing else to sell.
 *
 * This page used to advertise twelve "apps" — Storyboard Builder, Cold Calling,
 * Golden Visa Qualifier, Image Studio, Investor Memo Generator and the rest.
 * Every one of them is a CAPABILITY INSIDE a product, not a thing anyone buys,
 * and listing them here made one platform read as a dozen half-products while
 * the three things actually on sale appeared nowhere.
 *
 * The commercial model this page has to carry, in one breath: the market data,
 * the full analysis, the inventory and the search are FREE on any account. The
 * three products are what money buys. One registration covers both — the free
 * account IS the account that upgrades, so nobody signs up twice.
 *
 * Labels and blurbs are kept in step with lib/business/nav.ts, which is the
 * canonical list the vendor site sells from. If a fourth product ever exists,
 * it lands there first and here second — never the other way round.
 */
function getApps(locale: string) {
  const isArabic = locale === "ar"
  const signup = "https://entrestate.com/signup"

  return [
    {
      title: isArabic ? "آلة العملاء" : "Lead Machine",
      description: isArabic
        ? "تصنع عملاء من وحداتك، ثم تعمل عليهم حتى الصفقة — النظام كامل، باسمك."
        : "Makes leads from your listings, then works them to the deal — the whole system, under your name.",
      summary: isArabic
        ? "المخزون، الصفحات، الإعلانات، العملاء، والمتابعة في نظام واحد."
        : "Inventory, pages, ads, leads and follow-up in one system.",
      href: signup,
      learnHref: "https://entrestate.com/business/lead-machine",
      icon: Building2,
      tag: isArabic ? "منتج" : "Product",
      highlight: isArabic ? "للشركات · تجربة ذاتية" : "Companies · self-serve trial",
      cta: isArabic ? "ابدأ التجربة" : "Start the trial",
      featured: true,
    },
    {
      title: isArabic ? "من وحدة إلى صفحة" : "Listing-to-Landing",
      description: isArabic
        ? "موقعك العام يُدار كما يجب — ومعه المكتب ونظام العملاء خلفه."
        : "Your public website, run properly — with the desk and the CRM behind it.",
      summary: isArabic
        ? "كل وحدة تحصل على صفحة تُحوِّل، وكل صفحة تُغذّي المكتب."
        : "Every listing gets a page that converts, and every page feeds the desk.",
      href: "https://entrestate.com/business/contact",
      learnHref: "https://entrestate.com/business/listing-to-landing",
      icon: Globe,
      tag: isArabic ? "منتج" : "Product",
      // Setup on request, not self-serve: this one is provisioned for
      // large-scale operators, so "Get started" would promise a door that
      // does not open.
      highlight: isArabic ? "للمشغّلين الكبار · تركيب عند الطلب" : "Large-scale operators · setup on request",
      cta: isArabic ? "اطلب التركيب" : "Request setup",
      featured: true,
    },
    {
      title: isArabic ? "ميتا للوسطاء" : "Meta for Realtors",
      description: isArabic
        ? "نظام كامل لإعلانات ميتا الاحترافية — من مخزوننا، بميزانيتك، بنقرات قليلة."
        : "A full system for professional Meta lead ads — our off-plan inventory, your budget, a few clicks.",
      summary: isArabic
        ? "اختر مشروعًا، حدّد الميزانية، والباقي يُبنى ويُطلق ويُراقب."
        : "Pick a project, set the budget; it builds, launches and watches the rest.",
      href: signup + "?plan=realtor",
      learnHref: "https://entrestate.com/business/meta-for-realtors",
      icon: Megaphone,
      tag: isArabic ? "منتج" : "Product",
      highlight: isArabic ? "للوسيط المنفرد · اشتراك" : "Individual realtors · membership",
      cta: isArabic ? "اشترك" : "Join",
      featured: true,
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
