"use client"

import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowRight, BarChart3, Activity, Layers, ShieldCheck, Database } from "lucide-react"
import type { MarketScoreSummary } from "@/lib/market-score/types"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { getNumberLocale } from "@/lib/format/locale"

function getDashboards(isArabic: boolean) {
  return [
    {
      title: isArabic ? "لقطة السوق" : "Market Snapshot",
      description: isArabic ? "حركة الأسعار والحجم والامتصاص عبر المدن المتابعة." : "Price movement, volume, and absorption across tracked cities.",
      icon: Activity,
      href: "/top-data",
    },
    {
      title: isArabic ? "مراقب السيناريو" : "Scenario Monitor",
      description: isArabic ? "تتبع حالات السيناريو وإشارات التعافي عبر الحملات." : "Track scenario states and recovery signals across campaigns.",
      icon: Layers,
      href: "/markets",
    },
    {
      title: isArabic ? "صحة المحفظة" : "Portfolio Health",
      description: isArabic ? "قارن مخاطر المحفظة والعائد وثقة التسليم." : "Compare portfolio risk, yield, and delivery confidence.",
      icon: BarChart3,
      href: "/markets",
    },
  ]
}

export default function DashboardsPage() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const numberLocale = getNumberLocale(locale)
  const dashboards = getDashboards(isArabic)
  const [summary, setSummary] = useState<MarketScoreSummary | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const res = await fetch("/api/market-score/summary", { signal: controller.signal })
        if (!res.ok) throw new Error(isArabic ? "التغذية الحية غير متاحة" : "Live feed unavailable")
        const data = await res.json()
        setSummary(data)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setSummaryError(error instanceof Error ? error.message : (isArabic ? "التغذية الحية غير متاحة" : "Live feed unavailable"))
      }
    }

    load()
    return () => controller.abort()
  }, [isArabic])

  return (
    <main id="main-content" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">{isArabic ? "مساحة العمل" : "Workspace"}</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              {isArabic ? "لوحات المتابعة" : "Dashboards"}
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              {isArabic ? "راقب سرعة السوق وحالة السيناريوهات وصحة المحفظة في عرض واحد." : "Monitor market velocity, scenario status, and portfolio health in one view."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 mb-10">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Database className="w-4 h-4 text-accent" />
                {isArabic ? "لقطة السوق" : "Market snapshot"}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isArabic ? "بيانات حية من محرك التصنيف." : "Live counts pulled from the scoring feed."}
              </p>
              {summary ? (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">{isArabic ? "أصول مصنّفة" : "Assets scored"}</p>
                    <p className="text-lg font-semibold text-foreground mt-1">
                      {summary.totalAssets.toLocaleString(numberLocale)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">{isArabic ? "متوسط الدرجة" : "Average score"}</p>
                    <p className="text-lg font-semibold text-foreground mt-1">
                      {summary.avgScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{isArabic ? "جاهز محافظ" : "Conservative ready"}</p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {summary.conservativeReadyPool.toLocaleString(numberLocale)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{isArabic ? "متوازن ١-٢ سنة" : "Balanced 1-2yr"}</p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {summary.balancedDefaultPool.toLocaleString(numberLocale)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  {summaryError ?? (isArabic ? "جارٍ تحميل اللقطة الحية..." : "Loading live snapshot...")}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="w-4 h-4 text-accent" />
                {isArabic ? "لماذا لوحات المتابعة مهمة" : "Why dashboards matter"}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {isArabic
                  ? "استخدم لوحات المتابعة للتأكد من توقيت التسليم ومزيج الأمان والسيولة قبل اتخاذ قرار بناءً على التسعير."
                  : "Use dashboards to confirm delivery timing, safety mix, and liquidity before you act on pricing."}
              </p>
              <div className="mt-4 text-xs text-muted-foreground space-y-2">
                <div>{isArabic ? "• تأكد من ضغط العرض في ممرك المستهدف." : "• Confirm supply pressure in your target corridor."}</div>
                <div>{isArabic ? "• اكتشف انحراف نطاق الأمان قبل أن يصل للعروض." : "• Spot safety band drift before it hits listings."}</div>
                <div>{isArabic ? "• حافظ على توصيات العملاء مبنية على دليل." : "• Keep client recommendations grounded in evidence."}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <Link
                key={dashboard.title}
                href={prefixLocalePath(dashboard.href, locale)}
                className="group p-6 bg-card border border-border rounded-lg hover:border-accent/30 transition-colors"
              >
                <dashboard.icon className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-medium text-foreground mt-4">{dashboard.title}</h2>
                <p className="text-sm text-muted-foreground mt-2">{dashboard.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  {isArabic ? "افتح اللوحة" : "Open dashboard"}
                  <ArrowRight className={`w-3 h-3 ${isArabic ? "rotate-180" : ""}`} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
