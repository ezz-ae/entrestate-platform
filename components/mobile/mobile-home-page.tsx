import Link from "next/link"
import { ArrowRight, Building2, Database, FileText, MapPin, Search, ShieldCheck, Sparkles, Users2 } from "lucide-react"
import { LiveSignalCard } from "@/components/platform/live-signal-card"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type TopProject = {
  slug: string
  name: string
  area?: string | null
  developer?: string | null
  timing?: string | null
  stress?: string | null
  yieldValue?: number | null
  score?: number | null
  price?: number | null
} | null

type Props = {
  locale: AppLocale
  totalProjects: number
  totalAreas: number
  ratedDevelopers: number
  buySignals: number
  dldTransactions: number
  syncLabel: string
  topProject: TopProject
}

function formatInteger(value: number, locale: AppLocale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US").format(value)
}

function buildChatHref(locale: AppLocale, prompt: string) {
  const params = new URLSearchParams({
    openChat: "true",
    prompt,
  })
  return `${prefixLocalePath("/", locale)}?${params.toString()}`
}

export function MobileHomePage({
  locale,
  totalProjects,
  totalAreas,
  ratedDevelopers,
  buySignals,
  dldTransactions,
  syncLabel,
  topProject,
}: Props) {
  const isArabic = locale === "ar"
  const quickActions = [
    {
      title: isArabic ? "افتح المحطة" : "Open chat",
      body: isArabic ? "اسأل مباشرة وافتح درج الأدلة فوراً." : "Ask directly and open the evidence-backed terminal.",
      href: `${prefixLocalePath("/", locale)}?openChat=true`,
      icon: Database,
    },
    {
      title: isArabic ? "ابحث في السوق" : "Search market",
      body: isArabic ? "شاشات مقارنة أسرع للمشاريع والمناطق." : "Fast screening across projects and submarkets.",
      href: prefixLocalePath("/search", locale),
      icon: Search,
    },
    {
      title: isArabic ? "مساحة العمل" : "Workspace",
      body: isArabic ? "لوحات، تقارير، ومكاتب العمل الأساسية." : "Dashboards, reports, and operator desks.",
      href: prefixLocalePath("/workspace", locale),
      icon: Sparkles,
    },
    {
      title: isArabic ? "رتّب جولة" : "Book walkthrough",
      body: isArabic ? "جلسة تشغيل من دبي لفريقك أو شركتك." : "Dubai-based operator walkthrough for your team.",
      href: prefixLocalePath("/contact", locale),
      icon: FileText,
    },
  ]

  const promptShortcuts = [
    ...(isArabic
      ? [
          {
            title: "BUY تحت 2M",
            prompt: "افرز مشاريع غرفتين تحت 2 مليون درهم مع إشارة BUY ومخاطر من الدرجة A أو B.",
            preview: "افرز مشاريع 2BR تحت 2M مع BUY ومخاطر A/B.",
          },
          {
            title: "مارينا ضد JBR",
            prompt: "قارن دبي مارينا مقابل JBR من حيث العائد والسعر ودرجة الضغط وإشارة التوقيت.",
            preview: "قارن مارينا وJBR في العائد والسعر والتوقيت.",
          },
          {
            title: "مذكرة مارينا فيستا",
            prompt: "أنشئ مذكرة استثمار لمارينا فيستا تغطي السعر والمنطقة والمطور والضغط والحكم النهائي.",
            preview: "مذكرة استثمار جاهزة لمارينا فيستا.",
          },
        ]
      : [
          {
            title: "BUY under AED 2M",
            prompt: "Screen 2BR projects under AED 2M with BUY signal and Grade A/B risk.",
            preview: "Screen 2BR projects under AED 2M with BUY and Grade A/B risk.",
          },
          {
            title: "Marina vs JBR",
            prompt: "Compare Dubai Marina vs JBR on yield, price, stress grade, and timing label.",
            preview: "Compare Dubai Marina and JBR on yield, price, and timing.",
          },
          {
            title: "Marina Vista memo",
            prompt: "Generate an investor memo for Marina Vista covering price, area, developer, stress, and verdict.",
            preview: "Generate a ready investor memo for Marina Vista.",
          },
        ]),
  ]

  const trustCounters = [
    {
      label: isArabic ? "سجل DLD" : "DLD registry",
      value: formatInteger(dldTransactions, locale),
      body: isArabic ? "معاملات مرجعية رسمية" : "Canonical official record",
      icon: ShieldCheck,
    },
    {
      label: isArabic ? "المشاريع المصنفة" : "Scored projects",
      value: formatInteger(totalProjects, locale),
      body: isArabic ? "إشارات قرار وطبقة ثقة" : "Decision signals and confidence tiers",
      icon: Building2,
    },
    {
      label: isArabic ? "ملفات المناطق" : "Area coverage",
      value: formatInteger(totalAreas, locale),
      body: isArabic ? "قراءة مكانية قابلة للمقارنة" : "Comparable spatial reading",
      icon: MapPin,
    },
    {
      label: isArabic ? "المطورون" : "Developers",
      value: formatInteger(ratedDevelopers, locale),
      body: isArabic
        ? `${formatInteger(buySignals, locale)} إشارة توقيت BUY/STRONG_BUY`
        : `${formatInteger(buySignals, locale)} BUY/STRONG_BUY timing`,
      icon: Users2,
    },
  ]

  return (
    <div className="mx-auto max-w-xl px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-24 sm:px-6">
      <section className="rounded-[2rem] border border-border/60 bg-[linear-gradient(160deg,rgba(47,90,166,0.16),rgba(17,22,29,0.04))] px-5 py-6 shadow-[0_24px_90px_-56px_rgba(47,90,166,0.55)]">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {isArabic ? "سطح القرار" : "Decision surface"}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          {isArabic ? "اتخذ القرار العقاري من شاشة واضحة وسريعة." : "Make the real estate call from one clear surface."}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {isArabic
            ? "ابدأ من المحطة، افحص السوق، ثم ادخل إلى مساحة العمل من دون ضوضاء أو تشتت."
            : "Start from the terminal, screen the market, and move into the workspace without noise or friction."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
            {isArabic
              ? `${formatInteger(buySignals, locale)} إشارة BUY/STRONG_BUY`
              : `${formatInteger(buySignals, locale)} BUY/STRONG_BUY timing`}
          </span>
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
            {isArabic ? `آخر دورة ${syncLabel}` : `Last cycle ${syncLabel}`}
          </span>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.title}
              href={action.href}
              className="rounded-[1.6rem] border border-border/60 bg-card/70 p-4 shadow-sm transition hover:border-primary/30 hover:bg-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">{action.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{action.body}</p>
            </Link>
          )
        })}
      </section>

      {topProject ? (
        <section className="mt-5">
          <LiveSignalCard
            title={topProject.name}
            area={topProject.area}
            developer={topProject.developer}
            timing={topProject.timing}
            stress={topProject.stress}
            yieldValue={topProject.yieldValue}
            score={topProject.score}
            price={topProject.price}
            updatedLabel={syncLabel}
            slug={topProject.slug}
          />
        </section>
      ) : null}

      <section className="mt-5 rounded-[1.8rem] border border-border/60 bg-card/60 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
              {isArabic ? "ابدأ من سؤال جاهز" : "Start from a ready prompt"}
            </p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
              {isArabic ? "اختصارات القرار السريعة" : "Fast decision shortcuts"}
            </p>
          </div>
          <Database className="h-5 w-5 text-primary/70" />
        </div>
        <div className="mt-4 space-y-3">
          {promptShortcuts.map((shortcut) => (
            <Link
              key={shortcut.title}
              href={buildChatHref(locale, shortcut.prompt)}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm transition hover:border-primary/30"
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{shortcut.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{shortcut.preview}</p>
              </div>
              <ArrowRight className={`h-4 w-4 shrink-0 text-primary/70 ${isArabic ? "rotate-180" : ""}`} />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        {trustCounters.map((counter) => {
          const Icon = counter.icon
          return (
            <div key={counter.label} className="rounded-[1.5rem] border border-border/60 bg-card/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">{counter.label}</p>
                <Icon className="h-4 w-4 text-primary/60" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground">{counter.value}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{counter.body}</p>
            </div>
          )
        })}
      </section>

      <section className="mt-5 rounded-[1.5rem] border border-border/60 bg-card/40 p-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground/75">
          {isArabic
            ? "Entrestate طبقة استخبارات سوقية، وليست منصة قوائم أو وسيطاً أو مستشاراً مالياً. الأحكام مدعومة بالأدلة وليست توصيات."
            : "Entrestate is a market-intelligence layer, not a marketplace, broker, or financial advisor. Verdicts are evidence-backed reads, not advice."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <Link
            href={prefixLocalePath("/methodology", locale)}
            className="rounded-full border border-border/60 bg-background/70 px-3 py-1 font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
          >
            {isArabic ? "المنهجية" : "Methodology"}
          </Link>
          <Link
            href={prefixLocalePath("/data-usage", locale)}
            className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-muted-foreground transition hover:text-foreground"
          >
            {isArabic ? "استخدام البيانات" : "Data Usage"}
          </Link>
          <Link
            href={prefixLocalePath("/privacy", locale)}
            className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-muted-foreground transition hover:text-foreground"
          >
            {isArabic ? "الخصوصية" : "Privacy"}
          </Link>
          <Link
            href={prefixLocalePath("/terms", locale)}
            className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-muted-foreground transition hover:text-foreground"
          >
            {isArabic ? "الشروط" : "Terms"}
          </Link>
        </div>
      </section>
    </div>
  )
}
