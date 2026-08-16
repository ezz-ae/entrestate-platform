import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CreditCard,
  FileText,
  Gauge,
  LayoutGrid,
  MessageSquareText,
  PenLine,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"

import { AccountSectionNav } from "@/components/account/account-section-nav"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buildLoginHref } from "@/lib/auth/navigation"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { getSyncedUser } from "@/lib/auth/sync"
import { getCopilotDailyUsage } from "@/lib/copilot-usage"
import { prisma } from "@/lib/prisma"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

function formatTierLabel(tier: "free" | "pro" | "team" | "institutional", locale: AppLocale) {
  const labels = {
    free: { en: "Free", ar: "مجاني" },
    pro: { en: "Pro", ar: "احترافي" },
    team: { en: "Team", ar: "فريق" },
    institutional: { en: "Institutional", ar: "مؤسسي" },
  } as const
  return labels[tier][locale]
}

function formatStatus(value: string | null | undefined, locale: AppLocale) {
  if (!value) return locale === "ar" ? "غير مرتبط" : "Not linked"

  const normalized = value.replaceAll("_", " ").toLowerCase()
  if (locale === "ar") {
    switch (normalized) {
      case "active":
        return "نشط"
      case "approved":
      case "approval pending":
        return "قيد الاعتماد"
      case "cancelled":
        return "ملغى"
      case "suspended":
        return "معلق"
      case "inactive":
        return "غير مفعّل"
      default:
        return normalized
    }
  }

  return normalized.replace(/^\w/, (char) => char.toUpperCase())
}

function formatHorizon(value: string | null | undefined, locale: AppLocale) {
  const normalized = value?.trim().toLowerCase() ?? "ready"
  const labels = {
    ready: { en: "Ready now", ar: "جاهز الآن" },
    "6-12mo": { en: "6-12 months", ar: "خلال 6-12 شهر" },
    "1-2yr": { en: "1-2 years", ar: "خلال 1-2 سنة" },
    "2-4yr": { en: "2-4 years", ar: "خلال 2-4 سنوات" },
    "4yr+": { en: "4+ years", ar: "أكثر من 4 سنوات" },
  } as const

  if (normalized in labels) {
    return labels[normalized as keyof typeof labels][locale]
  }

  return locale === "ar" ? "جاهز الآن" : "Ready now"
}

function formatArchetype(yieldVsSafety: number, locale: AppLocale) {
  if (locale === "ar") {
    if (yieldVsSafety < 0.35) return "حذر"
    if (yieldVsSafety < 0.65) return "متوازن"
    if (yieldVsSafety < 0.85) return "نمائي"
    return "انتهازي"
  }

  if (yieldVsSafety < 0.35) return "Conservative"
  if (yieldVsSafety < 0.65) return "Balanced"
  if (yieldVsSafety < 0.85) return "Growth"
  return "Opportunistic"
}

function formatDate(value: Date, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value)
}

function getSingleQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const user = await getSyncedUser()

  if (!user) {
    redirect(buildLoginHref(locale, "/account"))
  }

  const profile = user.profile
  const entitlement = await getCurrentEntitlement(user.id)
  const usage = await getCopilotDailyUsage(user.id, entitlement.tier)
  const params = (await searchParams) ?? {}
  const billingState = getSingleQueryValue(params.billing)?.trim() ?? null

  const [notebookCount, latestBook, reportCount, latestReport, apiKeyCount] = await Promise.all([
    prisma.marketBook.count({ where: { ownerId: user.id } }),
    prisma.marketBook.findFirst({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.assistantReport.count({ where: { userId: user.id } }),
    prisma.assistantReport.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { publicId: true, title: true, createdAt: true },
    }),
    prisma.apiKey.count({ where: { userId: user.id } }),
  ])

  const copy = {
    eyebrow: isArabic ? "واجهة الحساب" : "Account hub",
    title: isArabic ? `أهلاً، ${user.name || user.email || "عضو Entrestate"}` : `Welcome, ${user.name || user.email || "Entrestate member"}`,
    description: isArabic
      ? "هذه هي واجهتك الهادئة. اضبط ملف القرار، افتح دفترك، ثم انتقل إلى المحطة أو التقارير عند الحاجة."
      : "This is your calm operating surface. Tune the decision profile, open your notebook, then move into the terminal or report library only when needed.",
    billingNotice:
      billingState === "success"
        ? isArabic
          ? "تم تفعيل الاشتراك. تفاصيل الخطة الآن داخل مركز الفوترة."
          : "Your subscription is active. Plan details now live in the billing center."
        : billingState
          ? isArabic
            ? "هناك تحديث متعلق بالفوترة. راجع مركز الفوترة للاطلاع على الحالة."
            : "There is a billing update. Review the billing center for the current status."
          : null,
    openTerminal: isArabic ? "افتح محطة القرار" : "Open decision terminal",
    openNotebook: isArabic ? "افتح الدفاتر" : "Open notebooks",
    openBilling: isArabic ? "مركز الفوترة" : "Billing center",
    startHere: isArabic ? "ابدأ من هنا" : "Start here",
    startHereDescription: isArabic
      ? "قسم واحد لكل خطوة حتى لا تتحول الواجهة إلى لوحة مزدحمة."
      : "One clear destination for each next step so the account never turns into an overloaded operations board.",
    workMap: isArabic ? "خريطة الاستخدام" : "How the account works",
    workMapDescription: isArabic
      ? "الترتيب المقترح لاستخدام المنصة من دون إرباك."
      : "The recommended order for using the platform without overwhelm.",
    snapshot: isArabic ? "ملخص الحساب" : "Account snapshot",
    usageTitle: isArabic ? "استخدام المساعد" : "Assistant usage",
    workspaceTitle: isArabic ? "حالة المكتبة" : "Workspace status",
    status: isArabic ? "الحالة" : "Status",
    tier: isArabic ? "الخطة" : "Plan",
    horizon: isArabic ? "الأفق" : "Horizon",
    archetype: isArabic ? "الأسلوب" : "Archetype",
    preferredMarkets: isArabic ? "الأسواق المفضلة" : "Preferred markets",
    reports: isArabic ? "التقارير" : "Reports",
    notebooks: isArabic ? "الدفاتر" : "Notebooks",
    apiKeys: isArabic ? "مفاتيح API" : "API keys",
    dailyLimit: isArabic ? "الحد اليومي" : "Daily limit",
    used: isArabic ? "مستخدم" : "Used",
    reset: isArabic ? "يُعاد التصفير يومياً عند منتصف الليل بتوقيت دبي." : "Resets daily at midnight Dubai time.",
    latestBook: isArabic ? "آخر دفتر" : "Latest notebook",
    latestReport: isArabic ? "آخر تقرير" : "Latest report",
  }

  const usagePct = usage.limit ? Math.min((usage.used / usage.limit) * 100, 100) : 0
  const preferredMarkets = profile?.preferredMarkets ?? []
  const riskBias = Math.round((profile?.riskBias ?? 0.65) * 100)
  const yieldVsSafety = profile?.yieldVsSafety ?? 0.5
  const terminalHref = prefixLocalePath("/me?openChat=true", locale)

  const guidedCards = [
    {
      title: isArabic ? "اضبط ملف القرار" : "Tune the decision profile",
      description: isArabic
        ? "حدد وزن السوق، أفق الاستثمار، والأسواق المفضلة قبل بدء أي تحليل."
        : "Set market weighting, investment horizon, and preferred markets before running analysis.",
      href: "/account/profile",
      cta: isArabic ? "افتح الملف" : "Open profile",
      icon: PenLine,
      meta: `${riskBias}% ${isArabic ? "وزن السوق" : "market bias"}`,
    },
    {
      title: isArabic ? "افتح دفتر البحث" : "Open a research notebook",
      description: isArabic
        ? "احتفظ بالنظرة العامة والمخاطر والمذكرة في مساحة عمل واحدة قابلة للمتابعة."
        : "Keep the overview, risk, and memo inside one working space you can revisit.",
      href: latestBook ? `/account/book/${latestBook.id}` : "/account/book",
      cta: latestBook ? (isArabic ? "تابع آخر دفتر" : "Continue latest notebook") : copy.openNotebook,
      icon: BookOpen,
      meta: latestBook
        ? `${latestBook.title} · ${formatDate(latestBook.updatedAt, locale)}`
        : isArabic
          ? "ابدأ أول دفتر للحساب"
          : "Start the first notebook for this account",
    },
    {
      title: isArabic ? "شغّل المحطة عند الحاجة" : "Run the terminal when needed",
      description: isArabic
        ? "استخدم المحطة للاستعلامات الحية بعد ضبط الملف والموضوع، لا قبل ذلك."
        : "Use the terminal for live questions after the profile and research subject are clear, not before.",
      href: "/me?openChat=true",
      cta: copy.openTerminal,
      icon: MessageSquareText,
      meta: isArabic ? "استعلامات حيّة مع أدلة" : "Live evidence-backed queries",
    },
  ]

  const workspaceCards = [
    {
      title: isArabic ? "دفاتر البحث" : "Research notebooks",
      description: isArabic ? "المكان الرئيسي للعمل التراكمي." : "The main surface for cumulative work.",
      href: "/account/book",
      stat: notebookCount,
      icon: BookOpen,
    },
    {
      title: isArabic ? "التقارير" : "Reports",
      description: isArabic ? "المخرجات الجاهزة للمراجعة أو الإرسال." : "Generated outputs ready for review or delivery.",
      href: "/account/reports",
      stat: reportCount,
      icon: FileText,
    },
    {
      title: isArabic ? "الفوترة" : "Billing",
      description: isArabic ? "الخطة والاشتراك وسجل المدفوعات في مكان مستقل." : "Plan, subscription controls, and payment history in a dedicated destination.",
      href: "/account/billing",
      stat: formatTierLabel(entitlement.tier, locale),
      icon: CreditCard,
    },
    {
      title: isArabic ? "API" : "API",
      description: isArabic ? "مفاتيح الربط للفرق المؤسسية فقط." : "Connection keys reserved for institutional teams.",
      href: "/account/api-keys",
      stat: entitlement.tier === "institutional" ? apiKeyCount : isArabic ? "مؤسسي" : "Institutional",
      icon: LayoutGrid,
    },
  ]

  const journey = [
    {
      title: isArabic ? "1. ابدأ بالملف" : "1. Start with the profile",
      body: isArabic
        ? "اضبط التفضيلات مرة واحدة لتنعكس على الشات، البحث، والتقارير."
        : "Tune preferences once so chat, search, and reports inherit the same lens.",
    },
    {
      title: isArabic ? "2. ابنِ دفتر العمل" : "2. Build the working notebook",
      body: isArabic
        ? "كل موضوع مهم يحتاج دفتره الخاص بدل بعثرة الجلسات."
        : "Each serious topic should live in its own notebook instead of scattered sessions.",
    },
    {
      title: isArabic ? "3. ولّد التقرير عند الحاجة" : "3. Generate only when ready",
      body: isArabic
        ? "عندما تتضح الفرضية، صدّر التقرير أو المذكرة من المسار المناسب."
        : "Once the thesis is clear, export the report or memo from the right surface.",
    },
  ]

  return (
    <main id="main-content" className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 md:pt-28">
        <header className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {copy.eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                {copy.title}
              </h1>
              <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
                {copy.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href={prefixLocalePath("/account/book", locale)}>
                  <BookOpen className="h-4 w-4" />
                  {copy.openNotebook}
                </Link>
              </Button>
              <Button asChild>
                <Link href={terminalHref}>
                  <MessageSquareText className="h-4 w-4" />
                  {copy.openTerminal}
                </Link>
              </Button>
            </div>
          </div>

          <AccountSectionNav
            active="overview"
            locale={locale}
            apiEnabled={entitlement.tier === "institutional"}
          />
        </header>

        {copy.billingNotice ? (
          <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
              <p>{copy.billingNotice}</p>
            </div>
            <Button asChild variant="outline">
              <Link href={prefixLocalePath("/account/billing", locale)}>{copy.openBilling}</Link>
            </Button>
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr),380px]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{copy.startHere}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.startHereDescription}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {guidedCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <Link
                      key={card.title}
                      href={prefixLocalePath(card.href, locale)}
                      className="group rounded-3xl border border-border/70 bg-background/60 p-5 transition hover:border-primary/30 hover:bg-card"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-foreground">{card.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
                      <p className="mt-4 text-xs font-medium text-muted-foreground">{card.meta}</p>
                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                        <span>{card.cta}</span>
                        <ArrowRight className={`h-4 w-4 transition group-hover:translate-x-1 ${isArabic ? "rotate-180 group-hover:-translate-x-1 group-hover:translate-x-0" : ""}`} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{copy.workMap}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.workMapDescription}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {journey.map((step) => (
                  <div key={step.title} className="rounded-3xl border border-border/70 bg-background/60 p-5">
                    <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <LayoutGrid className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{copy.workspaceTitle}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {isArabic
                      ? "كل سطح له وظيفة واضحة. الفوترة هنا كرابط فقط وليست قسماً مفروضاً على أول شاشة."
                      : "Each surface has a clear job. Billing appears here only as a destination, not as forced content on first load."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {workspaceCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <Link
                      key={card.title}
                      href={prefixLocalePath(card.href, locale)}
                      className="rounded-3xl border border-border/70 bg-background/60 p-5 transition hover:border-primary/30 hover:bg-card"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{card.stat}</Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{copy.snapshot}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant="outline">{formatTierLabel(entitlement.tier, locale)}</Badge>
              </div>

              <dl className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.status}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{formatStatus(entitlement.status, locale)}</dd>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.horizon}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{formatHorizon(profile?.horizon, locale)}</dd>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.archetype}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{formatArchetype(yieldVsSafety, locale)}</dd>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.preferredMarkets}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {preferredMarkets.length > 0 ? preferredMarkets.join(" · ") : isArabic ? "غير محدد بعد" : "Not set yet"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Gauge className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{copy.usageTitle}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {isArabic
                      ? "مؤشر سريع لاستهلاك مساعد القرار اليومي."
                      : "A quick read on today’s decision-assistant usage."}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-border/70 bg-background/60 p-5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{copy.dailyLimit}</span>
                  <span className="font-semibold text-foreground">
                    {usage.used} / {usage.limit}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full transition-all ${usagePct >= 90 ? "bg-destructive" : usagePct >= 70 ? "bg-amber-500" : "bg-primary"}`}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {copy.used}: {usagePct.toFixed(0)}%. {copy.reset}
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {isArabic ? "آخر النشاطات" : "Recent account signals"}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {isArabic
                      ? "قراءة سريعة لآخر ما تم إنشاؤه داخل الحساب."
                      : "A quick read on the latest items created inside this account."}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.latestBook}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {latestBook?.title ?? (isArabic ? "لا يوجد بعد" : "None yet")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {latestBook ? formatDate(latestBook.updatedAt, locale) : notebookCount === 0 ? (isArabic ? "أنشئ أول دفتر للبدء." : "Create the first notebook to begin.") : ""}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.latestReport}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {latestReport?.title ?? (isArabic ? "لا يوجد بعد" : "None yet")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {latestReport ? formatDate(latestReport.createdAt, locale) : reportCount === 0 ? (isArabic ? "سيظهر بعد توليد أول تقرير." : "Appears after your first generated report.") : ""}
                  </p>
                </div>
              </div>

              <Button asChild variant="outline" className="mt-5 w-full">
                <Link href={prefixLocalePath("/account/billing", locale)}>
                  <CreditCard className="h-4 w-4" />
                  {copy.openBilling}
                </Link>
              </Button>
            </section>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  )
}
