import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { Button } from "@/components/ui/button"
import { TrustBar } from "@/components/decision/trust-bar"
import { getMarketPulse } from "@/lib/decision-infrastructure"
import { formatAed } from "@/lib/format/currency"
import { getNumberLocale } from "@/lib/format/locale"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { BarChart3, MessageSquare, FileText, TrendingUp, ShieldCheck, Clock } from "lucide-react"

import { getTranslations } from "next-intl/server"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const locale = await getRequestLocale()
  const t = await getTranslations({ locale, namespace: "dashboard" })
  const isArabic = locale === "ar"
  const numberLocale = getNumberLocale(locale)
  const pulse = await getMarketPulse()

  const summary = pulse.summary as Record<string, unknown> | null
  const projects = typeof summary?.projects === "number" ? summary.projects : 0
  const avgPrice = typeof summary?.avg_price === "number" ? summary.avg_price : null
  const avgYield = typeof summary?.avg_yield === "number" ? summary.avg_yield : null

  const buySignals = pulse.timing_signals.find((item) => String(item.label ?? "").toUpperCase() === "BUY")
  const holdSignals = pulse.timing_signals.find((item) => String(item.label ?? "").toUpperCase() === "HOLD")
  const waitSignals = pulse.timing_signals.find((item) => String(item.label ?? "").toUpperCase() === "WAIT")

  const highConfidence = pulse.confidence_distribution.find((item) => String(item.label ?? "").toUpperCase() === "HIGH")
  const mediumConfidence = pulse.confidence_distribution.find((item) => String(item.label ?? "").toUpperCase() === "MEDIUM")
  const highConfidencePct =
    projects > 0 && typeof highConfidence?.count === "number" ? (highConfidence.count / projects) * 100 : undefined

  const timingTotal =
    (typeof buySignals?.count === "number" ? buySignals.count : 0) +
    (typeof holdSignals?.count === "number" ? holdSignals.count : 0) +
    (typeof waitSignals?.count === "number" ? waitSignals.count : 0)

  const buyPct = timingTotal > 0 && typeof buySignals?.count === "number" ? (buySignals.count / timingTotal) * 100 : 0
  const holdPct = timingTotal > 0 && typeof holdSignals?.count === "number" ? (holdSignals.count / timingTotal) * 100 : 0
  const waitPct = timingTotal > 0 && typeof waitSignals?.count === "number" ? (waitSignals.count / timingTotal) * 100 : 0

  const stats = [
    {
      title: t("totalProjects"),
      value: projects.toLocaleString(numberLocale),
      subtitle: t("qualifiedInventory"),
      icon: BarChart3,
      accent: "text-sky-400",
    },
    {
      title: t("avgPrice"),
      value: formatAed(avgPrice, locale, { compact: true, fallback: "AED —" }),
      subtitle: t("acrossInventory"),
      icon: TrendingUp,
      accent: "text-violet-400",
    },
    {
      title: t("avgYield"),
      value: avgYield === null ? "—" : `${avgYield.toFixed(1)}%`,
      subtitle: t("currentGrossYield"),
      icon: ShieldCheck,
      accent: "text-emerald-400",
    },
    {
      title: t("buySignals"),
      value: typeof buySignals?.count === "number" ? buySignals.count.toLocaleString(numberLocale) : "—",
      subtitle: t("activeOpportunities"),
      icon: Clock,
      accent: "text-emerald-400",
    },
  ]

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("title")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">
            {t("investorDashboard")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </header>

        <TrustBar verifiedRows={projects} highConfidencePct={highConfidencePct} updatedAt={pulse.data_as_of} />

        <section className="relative mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(950px_circle_at_50%_-15%,rgba(59,130,246,0.2),transparent_58%)]" />
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <article
                key={stat.title}
                className="flex items-start justify-between rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)]"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className={`rounded-xl border border-border/40 bg-muted/40 p-2 ${stat.accent}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </article>
            )
          })}
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="relative isolate col-span-1 overflow-hidden rounded-2xl border border-border/60 bg-card/75 p-5 md:col-span-2">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/[0.10] via-indigo-500/[0.06] to-transparent" />
            <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-sky-300/60 via-indigo-300/35 to-transparent" />
            <div className="relative z-10">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {isArabic ? "توزيع إشارات التوقيت" : "Timing Signal Distribution"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isArabic
                  ? `${timingTotal.toLocaleString(numberLocale)} مشروعًا داخل القراءة الحالية`
                  : `${timingTotal.toLocaleString(numberLocale)} projects analysed`}
              </p>

              <div className="mt-4 space-y-3">
                {[
                  { label: "BUY", count: buySignals?.count, pct: buyPct, bar: "bg-emerald-500", text: "text-emerald-300", border: "border-emerald-500/40" },
                  { label: "HOLD", count: holdSignals?.count, pct: holdPct, bar: "bg-amber-500", text: "text-amber-300", border: "border-amber-500/40" },
                  { label: "WAIT", count: waitSignals?.count, pct: waitPct, bar: "bg-red-500", text: "text-red-300", border: "border-red-500/40" },
                ].map((signal) => (
                  <div key={signal.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${signal.border} ${signal.text} bg-background/20`}>
                        {signal.label}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {typeof signal.count === "number" ? signal.count.toLocaleString(numberLocale) : "—"}
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">{signal.pct > 0 ? `${signal.pct.toFixed(1)}%` : ""}</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                      <div className={`h-full rounded-full ${signal.bar} transition-all duration-700`} style={{ width: `${signal.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-border/50 pt-4">
                {[
                  { label: isArabic ? "ثقة عالية" : "High confidence", count: highConfidence?.count, color: "text-emerald-300" },
                  { label: isArabic ? "ثقة متوسطة" : "Medium confidence", count: mediumConfidence?.count, color: "text-amber-300" },
                ].map((confidence) => (
                  <div key={confidence.label} className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold tabular-nums ${confidence.color}`}>
                      {typeof confidence.count === "number" ? confidence.count.toLocaleString(numberLocale) : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">{confidence.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="relative isolate overflow-hidden rounded-2xl border border-border/60 bg-card/75 p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.12] via-fuchsia-500/[0.07] to-transparent" />
            <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-violet-300/60 via-fuchsia-300/35 to-transparent" />
            <div className="relative z-10">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{isArabic ? "انطلق من هنا" : "Quick Actions"}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild className="w-full justify-start gap-2">
                  <CopilotEntryLink>
                    <MessageSquare className="h-4 w-4" />
                    {isArabic ? "ابدأ من المساعد" : "New AI chat"}
                  </CopilotEntryLink>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start gap-2">
                  <Link href={prefixLocalePath("/properties", locale)}>
                    <BarChart3 className="h-4 w-4" />
                    {isArabic ? "تصفح المشاريع" : "Browse properties"}
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start gap-2">
                  <Link href={prefixLocalePath("/tools/memo", locale)}>
                    <FileText className="h-4 w-4" />
                    {isArabic ? "جهّز مذكرة" : "Generate report"}
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start gap-2">
                  <Link href={prefixLocalePath("/top-data", locale)}>
                    <TrendingUp className="h-4 w-4" />
                    {isArabic ? "افتح بيانات السوق" : "Market data"}
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        </section>
      </div>
      <Footer />
    </main>
  )
}
