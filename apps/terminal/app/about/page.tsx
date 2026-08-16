import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight, Shield, Eye, Scale, BookOpen } from "lucide-react"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { getPlatformMetrics } from "@/lib/platform-metrics.server"
import { PLATFORM_METRICS_FALLBACK } from "@/lib/platform-metrics"
import { formatInteger } from "@/lib/format/number"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title:
      locale === "ar"
        ? "عن Entrestate — منصة استخبارات عقارية في الإمارات"
        : "About Entrestate — UAE Real Estate Intelligence Platform",
    description:
      locale === "ar"
        ? "تعرف على كيف تبني Entrestate إشارات وتقييمات ومخرجات استخباراتية مرتبطة بالأدلة لسوق العقارات في الإمارات."
        : "Learn how Entrestate produces evidence-linked real estate signals, scoring, and decision inputs for the UAE market.",
  }
}

function getPrinciples(locale: AppLocale) {
  return locale === "ar"
    ? [
        {
          icon: Eye,
          title: "الوضوح قبل الإقناع",
          description: "تعرض المنصة البيانات والإشارات والمخرجات المصنفة حسب الأدلة. منطق التقييم موثق. والأدلة مذكورة. والحكم النهائي لك.",
        },
        {
          icon: Shield,
          title: "الهيكل قبل السرعة",
          description: "كل مسار داخل Entrestate يربط النتيجة بالمصدر وبحالة تنفيذ واضحة، حتى لا تتحول السرعة إلى فوضى.",
        },
        {
          icon: Scale,
          title: "الإنصاف عبر الفصل الواضح",
          description: "المنصة تنتج قراءة منظمة للسوق. المستخدم يفحص الأدلة. والتنفيذ يتم ضمن أدوار واضحة بدون تضارب مصالح.",
        },
        {
          icon: BookOpen,
          title: "المعرفة موقعة",
          description: "كل تقرير في المكتبة يُراجع ويُوقّع باسم Entrestate، ويعتمد على DLD ومصادر القوائم الموثقة لا على ملخصات مولدة آلياً فقط.",
        },
      ]
    : [
        {
          icon: Eye,
          title: "Clarity over persuasion",
          description: "The platform shows data, signals, and evidence-graded outputs. The scoring logic is documented. The evidence is cited. The judgment is yours.",
        },
        {
          icon: Shield,
          title: "Structure over speed",
          description: "Every workflow ties a result back to source, evidence level, and a clear execution state so speed never comes at the cost of control.",
        },
        {
          icon: Scale,
          title: "Fairness through separation",
          description: "Entrestate produces structured market intelligence. Users examine the evidence. Execution happens inside clear roles and governed flows.",
        },
        {
          icon: BookOpen,
          title: "Knowledge is signed",
          description: "Every report in the library is researched and signed by Entrestate analysts, using DLD and verified listing feeds rather than generic AI summaries.",
        },
      ]
}

export default async function AboutPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const principles = getPrinciples(locale)

  const metrics = await getPlatformMetrics().catch(() => PLATFORM_METRICS_FALLBACK)

  const stats = isArabic
    ? [
        { value: formatInteger(3, locale), label: "إمارات" },
        { value: formatInteger(metrics.totalProjects, locale), label: "مشروع مُقيَّم" },
        { value: formatInteger(metrics.ratedDevelopers, locale), label: "مطور بدرجة موثوقية" },
        { value: formatInteger(metrics.dldTransactions, locale), label: "معاملة DLD" },
      ]
    : [
        { value: formatInteger(3, locale), label: "Emirates" },
        { value: formatInteger(metrics.totalProjects, locale), label: "Projects scored" },
        { value: formatInteger(metrics.ratedDevelopers, locale), label: "Reliability-scored developers" },
        { value: formatInteger(metrics.dldTransactions, locale), label: "DLD transactions" },
      ]

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-20">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">
              {isArabic ? "عن Entrestate" : "About Entrestate"}
            </p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              {isArabic
                ? "استخبارات عقارية منظمة، قابلة للتفسير، ومرتبطة بالأدلة."
                : "Structured real estate intelligence, linked to evidence."}
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
              {isArabic
                ? "تنتج Entrestate مخرجات استخباراتية منظمة لسوق العقارات في الإمارات: إشارات توقيت، درجات أدلة، وتقييمات مرتبة. هذه المخرجات هي مدخلات قرار، وليست نصيحة مالية. كل حكم مرتبط بمصدره، وكل مستخدم يفحص الأدلة ثم يتخذ حكمه."
                : "Entrestate produces structured intelligence outputs for UAE real estate: timing signals, evidence scores, and ranked verdicts. These are decision inputs, not financial advice. Every verdict links to its evidence. Users inspect the evidence and make their own judgment."}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
            {stats.map((stat) => (
              <div key={stat.label} className="p-6 bg-card border border-border rounded-lg text-center">
                <p className="text-3xl md:text-4xl font-serif text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
            <div className="p-8 md:p-10 bg-primary rounded-lg">
              <p className="text-xs font-medium uppercase tracking-wider text-primary-foreground/60 mb-3">
                {isArabic ? "الرسالة" : "Mission"}
              </p>
              <h2 className="text-2xl md:text-3xl font-serif text-primary-foreground leading-tight mb-4">
                {isArabic
                  ? "نجعل سوق العقار قابلاً للقراءة قبل أن يصبح قابلاً للتنفيذ"
                  : "Make the market readable before it becomes executable"}
              </h2>
              <p className="text-sm text-primary-foreground/70 leading-relaxed">
                {isArabic
                  ? "الفوضى في السوق لا تأتي فقط من قلة البيانات، بل من غياب المسار الذي يربط النتيجة بمصدرها. Entrestate تجمع البيانات، والتقييم، والأدلة، وطبقة التنفيذ في منظومة واحدة قابلة للتدقيق."
                  : "Market noise is not just a data problem. It is a traceability problem. Entrestate brings together data, scoring, evidence, and execution layers into one system that can be audited end to end."}
              </p>
            </div>
            <div className="p-8 md:p-10 bg-card border border-border rounded-lg flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">
                  {isArabic ? "كيف تعمل المنصة" : "How the platform works"}
                </p>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground leading-tight mb-4">
                  {isArabic ? "الأدلة أولاً، والتفسير ثانياً" : "Evidence first, interpretation second"}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isArabic
                    ? "تنتج Entrestate إشارات وتقييمات ومخرجات مرتبة قابلة للتتبع إلى مصادر موثقة. الأحكام ليست أوامر شراء أو بيع؛ بل مدخلات قرار مدروسة بدرجة أدلة واضحة. الدليل ظاهر دائماً، والقرار النهائي لك."
                    : "Entrestate produces structured market intelligence: scoring, signals, and ranked outputs, all traceable to verified sources. Verdicts are graded inputs, not instructions. The evidence is always visible. The conclusion is always yours."}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-20">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">
                {isArabic ? "المبادئ" : "Principles"}
              </p>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground leading-tight text-balance">
                {isArabic ? "كيف نبني الثقة في المنتج" : "How product trust is built"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {principles.map((principle) => (
                <div key={principle.title} className="p-8 bg-card border border-border rounded-lg">
                  <div className="p-2.5 bg-secondary rounded-md w-fit mb-4">
                    <principle.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="text-xl font-serif text-foreground mb-2">{principle.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{principle.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 md:p-12 bg-card border border-border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-serif text-foreground mb-2">
                {isArabic ? "ابدأ من السطح المناسب" : "Start from the right surface"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? "افتح ملفات المناطق إذا كنت تبدأ من السوق، أو اعرض المشاريع المصنفة إذا كنت تريد نتائج قابلة للفحص."
                  : "Open area profiles if you are starting from market context, or move straight to scored projects if you want inspectable outputs."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={prefixLocalePath("/areas", locale)}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium border border-border rounded-md hover:border-accent/40 transition-colors"
              >
                {isArabic ? "استكشف المناطق" : "Explore Areas"}
              </Link>
              <Link
                href={prefixLocalePath("/properties", locale)}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {isArabic ? "اعرض المشاريع المصنفة" : "View scored projects"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
