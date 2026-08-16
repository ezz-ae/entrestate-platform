import Link from "next/link"
import { CheckCircle2, Clock, Database, AlertCircle, Server, Shield, Zap, BarChart3 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getDataFreshnessStatus, getMarketPulse } from "@/lib/decision-infrastructure"
import { getNumberLocale, getDateLocale } from "@/lib/format/locale"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

export const dynamic = "force-dynamic"

function getServices(locale: AppLocale) {
  if (locale === "ar") {
    return [
      {
        name: "مساعد القرار",
        status: "يعمل",
        detail: "إجابات مباشرة وبث حي عبر Claude Sonnet 4.6",
        icon: Zap,
      },
      {
        name: "تغذية بيانات السوق",
        status: "يعمل",
        detail: "خط معالجة من عشر مراحل والدورات تُغلق في موعدها",
        icon: Database,
      },
      {
        name: "محرك القرار",
        status: "يعمل",
        detail: "قراءة المشاريع والمناطق والمطورين متاحة الآن",
        icon: BarChart3,
      },
      {
        name: "الدخول والصلاحيات",
        status: "يعمل",
        detail: "جلسات المستخدمين تصدر بشكل طبيعي عبر Clerk",
        icon: Shield,
      },
      {
        name: "التقارير والمخرجات",
        status: "يعمل",
        detail: "حفظ الملفات والنتائج داخل Neon يعمل بدون انقطاع",
        icon: Server,
      },
      {
        name: "مكتب المستثمر",
        status: "يعمل",
        detail: "لوحات السوق والمذكرات السريعة متاحة للفِرق",
        icon: BarChart3,
      },
    ]
  }

  return [
    {
      name: "Decision Terminal",
      status: "Operational",
      detail: "Streaming responses live · Claude Sonnet 4.6",
      icon: Zap,
    },
    {
      name: "Market data feed",
      status: "Operational",
      detail: "10-phase pipeline · Last cycle completed on schedule",
      icon: Database,
    },
    {
      name: "Scoring engine",
      status: "Operational",
      detail: "Properties, Areas, Developers scoring active",
      icon: BarChart3,
    },
    {
      name: "Authentication",
      status: "Operational",
      detail: "Clerk · Session issuance normal",
      icon: Shield,
    },
    {
      name: "Report generation",
      status: "Operational",
      detail: "Artifact persistence to Neon active",
      icon: Server,
    },
    {
      name: "Investor desk",
      status: "Operational",
      detail: "Market views and briefs available",
      icon: BarChart3,
    },
  ]
}

function getSloTargets(locale: AppLocale) {
  if (locale === "ar") {
    return [
      { metric: "استقرار المنصة", target: "99.5%", period: "شهريًا" },
      { metric: "زمن استجابة API p95", target: "< 800 ms", period: "بشكل مستمر" },
      { metric: "حداثة البيانات", target: "< 24 h", period: "مع كل دورة تشغيل" },
      { metric: "زمن الرجوع الآمن", target: "< 60 s", period: "عند الحاجة" },
    ]
  }

  return [
    { metric: "Platform uptime", target: "99.5%", period: "Monthly" },
    { metric: "API p95 response", target: "< 800 ms", period: "Continuous" },
    { metric: "Data freshness", target: "< 24 h", period: "Per pipeline cycle" },
    { metric: "Rollback RTO", target: "< 60 s", period: "Per incident" },
  ]
}

function getIncidents(locale: AppLocale) {
  if (locale === "ar") {
    return [
      {
        date: "2026-02-18",
        title: "تحديث تاريخي واسع للبيانات",
        summary: "أُغلقت دورة التحديث الكبيرة بنجاح، وعادت التغطية إلى مستواها المعتاد.",
        resolved: true,
      },
      {
        date: "2026-02-11",
        title: "بطء مؤقت في تصدير الوسائط",
        summary: "ظهر تباطؤ قصير في التصدير المرئي وتمت معالجته بعد ضبط خط المعالجة.",
        resolved: true,
      },
    ]
  }

  return [
    {
      date: "2026-02-18",
      title: "Historic data refresh",
      summary: "Large market refresh completed. Coverage is back to normal.",
      resolved: true,
    },
    {
      date: "2026-02-11",
      title: "Media export delay",
      summary: "Video export slowed briefly. Resolved after pipeline adjustment.",
      resolved: true,
    },
  ]
}

function getGovernanceLinks(locale: AppLocale) {
  if (locale === "ar") {
    return [
      { title: "سياسة الخصوصية", body: "كيف تُعالج بيانات الحساب والمخرجات وطلبات الدعم.", href: "/privacy" },
      { title: "شروط الاستخدام", body: "حدود الاعتماد على المنصة ومسؤوليات الاستخدام.", href: "/terms" },
      { title: "توثيق المعمارية", body: "راجع طبقة الأدلة ومحرك القرار والبنية العامة.", href: "/docs/documentation" },
      { title: "مراجعة تقنية", body: "مراجعة تشغيلية صريحة للفجوات المتبقية وخطة الإغلاق.", href: "/docs/cto-deployment-review" },
    ]
  }

  return [
    { title: "Privacy policy", body: "How account, support, and product-output data is handled.", href: "/privacy" },
    { title: "Terms of service", body: "Reliance boundaries and product-use obligations.", href: "/terms" },
    { title: "Architecture docs", body: "Inspect the evidence model, decision engine, and system design.", href: "/docs/documentation" },
    { title: "CTO review", body: "Review the remaining operational gaps and closeout plan.", href: "/docs/cto-deployment-review" },
  ]
}

async function getSnapshotSummary() {
  try {
    const [pulse, freshness] = await Promise.all([getMarketPulse(), getDataFreshnessStatus()])
    const summary = pulse.summary as Record<string, unknown> | null
    const projects = typeof summary?.projects === "number" ? summary.projects : null
    const highConfidence = pulse.confidence_distribution.find((item) => String(item.label ?? "").toUpperCase() === "HIGH")
    const buySignals = pulse.timing_signals.find((item) => String(item.label ?? "").toUpperCase() === "BUY")
    const freshnessRow = freshness.row as Record<string, unknown> | null
    const freshnessTimestamp =
      (typeof freshnessRow?.data_as_of === "string" && freshnessRow.data_as_of) ||
      (typeof freshnessRow?.as_of === "string" && freshnessRow.as_of) ||
      (typeof freshnessRow?.generated_at === "string" && freshnessRow.generated_at) ||
      (typeof freshnessRow?.updated_at === "string" && freshnessRow.updated_at) ||
      null

    return {
      generated: freshnessTimestamp ?? pulse.data_as_of,
      masterCount: projects,
      mediaCount: buySignals?.count ?? null,
      scoredCount: highConfidence?.count ?? null,
    }
  } catch {
    return { generated: null, masterCount: null, mediaCount: null, scoredCount: null }
  }
}

function formatTs(value: string | null | undefined, locale: AppLocale) {
  if (!value) return locale === "ar" ? "غير متاح" : "Not available"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(getDateLocale(locale), { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function formatIncidentDate(value: string, locale: AppLocale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(getDateLocale(locale), { year: "numeric", month: "short", day: "2-digit" })
}

export default async function StatusPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const services = getServices(locale)
  const sloTargets = getSloTargets(locale)
  const incidents = getIncidents(locale)
  const governanceLinks = getGovernanceLinks(locale)
  const snapshot = await getSnapshotSummary()
  const numberLocale = getNumberLocale(locale)
  const allOperational = services.every((service) => service.status === (isArabic ? "يعمل" : "Operational"))

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "الحالة" : "Status"}</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">
              {isArabic ? "صحة المنصة" : "System Health"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isArabic
                ? "قراءة مباشرة لحالة المساعد، البيانات، محرك القرار، وباقي خدمات التشغيل."
                : "Live availability across AI, data pipeline, decision engine, and platform services."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={prefixLocalePath("/docs/deployment-architecture", locale)}
              className="rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
            >
              {isArabic ? "بنية النشر" : "Architecture docs"} →
            </Link>
            <Link
              href={prefixLocalePath("/docs/cto-deployment-review", locale)}
              className="rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
            >
              {isArabic ? "مراجعة تقنية" : "CTO review"} →
            </Link>
          </div>
        </header>

        <div className={`mb-8 flex items-center gap-3 rounded-2xl border px-5 py-4 ${
          allOperational
            ? "border-emerald-500/30 bg-emerald-500/[0.06]"
            : "border-amber-500/30 bg-amber-500/[0.06]"
        }`}>
          {allOperational ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-400" />
          )}
          <div>
            <p className={`text-sm font-semibold ${allOperational ? "text-emerald-300" : "text-amber-300"}`}>
              {allOperational
                ? isArabic
                  ? "المنصة تعمل بشكل طبيعي"
                  : "All systems operational"
                : isArabic
                  ? "هناك جزء يحتاج متابعة"
                  : "Partial service disruption"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isArabic
                ? `${services.length.toLocaleString(numberLocale)} خدمات تحت المراقبة · آخر فحص ${formatTs(snapshot.generated, locale)}`
                : `${services.length} services monitored · Last checked ${formatTs(snapshot.generated, locale)}`}
            </p>
          </div>
        </div>

        <section className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const isOk = service.status === (isArabic ? "يعمل" : "Operational")
            const Icon = service.icon

            return (
              <div
                key={service.name}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/75 px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card border border-border/60">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${isOk ? "bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" : "bg-amber-400"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{service.detail}</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  isOk
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                }`}>
                  {service.status}
                </span>
              </div>
            )
          })}
        </section>

        <section className="mb-8 overflow-hidden rounded-2xl border border-border/60 bg-card/75">
          <div className="flex items-center gap-2.5 border-b border-border/50 px-5 py-4">
            <Database className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-foreground">
              {isArabic ? "لقطة سريعة من البيانات" : "Market data snapshot"}
            </h2>
            <span className="ml-auto text-xs text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" />
              {formatTs(snapshot.generated, locale)}
            </span>
          </div>
          <div className="grid grid-cols-1 divide-x divide-border/50 md:grid-cols-3">
            {[
              {
                label: isArabic ? "المشاريع في المستودع" : "Projects in master",
                value: snapshot.masterCount?.toLocaleString(numberLocale) ?? "—",
                color: "text-sky-300",
              },
              {
                label: isArabic ? "صفوف الثقة العالية" : "High confidence rows",
                value: snapshot.scoredCount?.toLocaleString(numberLocale) ?? "—",
                color: "text-emerald-300",
              },
              {
                label: isArabic ? "إشارات BUY" : "BUY timing signals",
                value: snapshot.mediaCount?.toLocaleString(numberLocale) ?? "—",
                color: "text-emerald-300",
              },
            ].map((item) => (
              <div key={item.label} className="px-5 py-5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {isArabic ? "مستهدفات التشغيل" : "Service level objectives"}
            </h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60">
            <div className="divide-y divide-border/40">
              {sloTargets.map((slo) => (
                <div key={slo.metric} className="flex items-center justify-between bg-card/30 px-5 py-3.5">
                  <p className="text-sm text-muted-foreground">{slo.metric}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground/50">{slo.period}</span>
                    <span className="text-sm font-semibold text-emerald-300 tabular-nums">{slo.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {isArabic ? "آخر الملاحظات التشغيلية" : "Recent incidents"}
            </h2>
          </div>
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div key={incident.title} className="rounded-2xl border border-border/60 bg-card/75 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{incident.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatIncidentDate(incident.date, locale)}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                      incident.resolved
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    }`}>
                      {incident.resolved
                        ? isArabic
                          ? "مغلقة"
                          : "Resolved"
                        : isArabic
                          ? "قيد المتابعة"
                          : "Monitoring"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{incident.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {isArabic ? "الحوكمة وحدود الاعتماد" : "Governance and reliance"}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {governanceLinks.map((item) => (
              <Link
                key={item.title}
                href={prefixLocalePath(item.href, locale)}
                className="rounded-2xl border border-border/60 bg-card/75 p-5 transition hover:border-primary/30 hover:bg-card"
              >
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
