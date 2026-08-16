"use client"

import React from "react"
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Zap,
  BarChart3,
  FileText,
  ArrowRight,
  Database,
  Lock,
  Boxes,
  Activity,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type EnterpriseDashboardProps = {
  summary: {
    total: number
    avgPrice: number | null
    avgYield: number | null
    buySignals: number
    highConfidence: number
  }
  intelligence?: {
    marketRegime: string
    marketSummary: string
    riskBias: number
    yieldVsSafety: number
  }
}

import { Attribution } from "@/lib/attribution/tracker"

export function EnterpriseDashboard({ summary, intelligence }: EnterpriseDashboardProps) {
  React.useEffect(() => {
    Attribution.logDashboardEntry("enterprise")
  }, [])

  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"

  const buySignalShare = summary.total > 0 ? Math.round((summary.buySignals / summary.total) * 100) : 0
  const highConfidenceShare = summary.total > 0 ? Math.round((summary.highConfidence / summary.total) * 100) : 0
  const yieldVerdict = (() => {
    if (summary.avgYield === null) return null
    if (summary.avgYield >= 7) return isArabic ? "فوق عتبة التدفق النقدي" : "Above cash-flow threshold"
    if (summary.avgYield >= 5.5) return isArabic ? "ضمن نطاق السوق" : "Within market band"
    return isArabic ? "دون خط المراقبة" : "Below watch line"
  })()

  const stats = [
    {
      label: isArabic ? "إجمالي المشاريع" : "Total Projects",
      value: summary.total.toLocaleString(),
      sub: isArabic
        ? `${highConfidenceShare}٪ ثقة عالية`
        : `${highConfidenceShare}% high-confidence`,
      icon: Boxes,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: isArabic ? "إشارات الشراء" : "Buy Signals",
      value: summary.buySignals.toLocaleString(),
      sub: isArabic
        ? `${buySignalShare}٪ من المخزون — ${buySignalShare >= 35 ? "انحياز للتنفيذ" : "انحياز للانتظار"}`
        : `${buySignalShare}% of inventory — ${buySignalShare >= 35 ? "bias to act" : "bias to wait"}`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: isArabic ? "متوسط السعر" : "Avg Price (AED)",
      value: summary.avgPrice ? summary.avgPrice.toLocaleString() : "—",
      sub: isArabic ? "الوسيط عبر المخزون المصنَّف" : "Median across scored inventory",
      icon: Database,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: isArabic ? "متوسط العائد" : "Avg Yield",
      value: summary.avgYield ? `${summary.avgYield}%` : "—",
      sub: yieldVerdict ?? (isArabic ? "قيد التجميع" : "Awaiting data"),
      icon: Activity,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ]

  const tunnelSteps = [
    {
      id: "intent",
      label: isArabic ? "الهدف" : "Intent",
      description: isArabic ? "تحديد الأهداف الاستثمارية بوضوح" : "Structured investment goals",
      icon: Zap,
      color: "text-blue-400",
      border: "border-blue-500/20",
    },
    {
      id: "evidence",
      label: isArabic ? "الأدلة" : "Evidence",
      description: isArabic ? "تحليل 5 طبقات من البيانات" : "5-layer data validation",
      icon: BarChart3,
      color: "text-violet-400",
      border: "border-violet-500/20",
    },
    {
      id: "judgment",
      label: isArabic ? "القرار" : "Judgment",
      description: isArabic ? "إشارات BUY/HOLD/WAIT" : "High-precision signaling",
      icon: ShieldCheck,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-slate-50 selection:bg-blue-500/30">
      {/* ── Background Mesh ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12 md:py-20 lg:px-8">
        {/* ── Header ── */}
        <header className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
              <Lock className="h-3 w-3" />
              {isArabic ? "وصول من الفئة المؤسسية" : "Institutional Tier Access"}
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              {isArabic ? "نظام تشغيل القرار" : "Decision Operating System"}
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl">
              {isArabic 
                ? "حول الفوضى العقارية إلى ميزة مؤسسية. استخدم نفق القرار المعتمد على الأدلة للاستثمار بيقين." 
                : "Transform real estate chaos into an institutional moat. Use evidence-backed decision tunnels to deploy capital with certainty."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CopilotEntryLink
              className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-slate-200"
            >
              {isArabic ? "تفعيل الاستراتيجية" : "Activate Strategy"}
              <Sparkles className="h-4 w-4" />
            </CopilotEntryLink>
          </div>
        </header>

        {/* ── Strategic Intelligence Synthesis ── */}
        {intelligence && (
          <section className="mb-12 rounded-3xl border border-blue-500/30 bg-blue-500/5 p-8 backdrop-blur-2xl">
            <div className="flex flex-col md:flex-row items-start justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">{isArabic ? "نظام القرار النشط" : "Active Intelligence Synthesis"}</span>
                </div>
                <h2 className="text-2xl font-bold">{intelligence.marketRegime}</h2>
                <p className="text-slate-400 leading-relaxed">
                  {intelligence.marketSummary} 
                  {isArabic 
                    ? " يتم تعديل استراتيجية النفوذ حالياً لتعظيم العوائد بناءً على ملفك الاستثماري المتوازن." 
                    : " Deployment strategy is currently modulated for optimized execution based on your Core-Plus risk profile."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="rounded-2xl bg-slate-950/50 p-4 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{isArabic ? "انحياز المخاطر" : "Risk Bias"}</p>
                  <p className="text-xl font-bold text-blue-400">{(intelligence.riskBias * 100).toFixed(0)}%</p>
                  <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                    {intelligence.riskBias >= 0.6
                      ? isArabic ? "ميل هجومي — توسع مرحب به" : "Offense-leaning · scaling welcome"
                      : intelligence.riskBias >= 0.4
                        ? isArabic ? "متوازن حول الوسيط" : "Balanced around median"
                        : isArabic ? "دفاعي — فضّل الأصول المثبتة" : "Defensive · prefer proven"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950/50 p-4 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{isArabic ? "العائد مقابل الأمان" : "Yield vs Safety"}</p>
                  <p className="text-xl font-bold text-emerald-400">{(intelligence.yieldVsSafety * 100).toFixed(0)}%</p>
                  <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                    {intelligence.yieldVsSafety >= 0.6
                      ? isArabic ? "يضغط نحو العائد" : "Tilts toward yield"
                      : intelligence.yieldVsSafety >= 0.4
                        ? isArabic ? "مزيج متوازن" : "Balanced blend"
                        : isArabic ? "يميل إلى الأمان" : "Leans toward safety"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Stats Grid ── */}
        <section className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:border-slate-700"
            >
              <div className="flex items-center justify-between gap-4">
                <div className={`rounded-xl p-2.5 ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-50 tracking-tight">{stat.value}</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">{stat.sub}</p>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ── Decision Tunnel ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-xl">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-50">{isArabic ? "نفق القرار" : "Decision Tunnel"}</h2>
                  <p className="text-sm text-slate-500">{isArabic ? "عملية تحويل النية إلى حكم استثماري" : "The transformation of intent into execution"}</p>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>

              <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
                {tunnelSteps.map((step, idx) => (
                  <div key={step.id} className="relative group">
                    <div className={`relative z-10 rounded-2xl border ${step.border} bg-slate-950/60 p-6 transition-all hover:-translate-y-1`}>
                      <step.icon className={`h-8 w-8 ${step.color} mb-4`} />
                      <h3 className="text-lg font-medium text-slate-50">{step.label}</h3>
                      <p className="mt-2 text-sm text-slate-500 leading-relaxed">{step.description}</p>
                    </div>
                    {idx < tunnelSteps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-20 text-slate-700">
                        <ArrowRight className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Automation Moat Summary ── */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-xl">
               <div className="flex items-center justify-between gap-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-50">{isArabic ? "خندق الأتمتة" : "Automation Moat"}</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {isArabic 
                        ? "راقب عمليات استخراج البيانات والتقارير المجدولة بنظام الشركة." 
                        : "Monitor company-wide data extraction and scheduled reporting flows."}
                    </p>
                  </div>
                  <Link
                    href={prefixLocalePath("/apps/agent-builder", locale)}
                    className="flex shrink-0 items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300"
                  >
                    {isArabic ? "افتح استوديو الأتمتة" : "Open Automation Studio"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
               </div>
               <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    {
                      label: isArabic ? "المخزون المصنَّف" : "Scored Inventory",
                      value: summary.total.toLocaleString(),
                      sub: isArabic ? "يتحدث كل ساعة" : "Refreshed hourly",
                    },
                    {
                      label: isArabic ? "إشارات نشطة" : "Live Signals",
                      value: summary.buySignals.toLocaleString(),
                      sub: isArabic ? `${buySignalShare}٪ من المخزون` : `${buySignalShare}% of inventory`,
                    },
                    {
                      label: isArabic ? "ثقة عالية" : "High Confidence",
                      value: `${highConfidenceShare}%`,
                      sub: isArabic ? "مصادر متقاطعة" : "Multi-source verified",
                    },
                    {
                      label: isArabic ? "طبقة الأدلة" : "Evidence Floor",
                      value: "L1",
                      sub: isArabic ? "DLD موثّق · جاهز للتدقيق" : "DLD-verified · audit-ready",
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-950/40 p-4 border border-slate-800/50">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">{item.label}</p>
                      <p className="mt-1 text-lg font-bold text-slate-200">{item.value}</p>
                      <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">{item.sub}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* ── API & Infrastructure ── */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-slate-50 mb-6">{isArabic ? "البنية التحتية للمطورين" : "Developer Substrate"}</h2>
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-blue-400">/api/timetables</span>
                    <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">GET</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Query the high-precision TableSpec compiler with cross-layer signals.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-emerald-400">/api/scores</span>
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">POST</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Retrieve composite buy/hold signals for custom project lists.
                  </p>
                </div>
              </div>
              <Link
                href={prefixLocalePath("/docs", locale)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-800/50 py-3 text-sm font-medium transition-all hover:bg-slate-800"
              >
                {isArabic ? "مرجع الـ API" : "API Reference"}
                <FileText className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 backdrop-blur-xl overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">
                  {isArabic ? "بروتوكول الأدلة" : "Evidence Protocol"}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {isArabic 
                    ? "جميع البيانات مشفرة ومؤمنة ببروتوكول L1 Canonical لضمان نزاهة القرار." 
                    : "All data is cryptographically signed and secured using the L1 Canonical protocol to ensure decision integrity."}
                </p>
                <Link
                  href={prefixLocalePath("/status", locale)}
                   className="flex items-center gap-2 text-xs font-semibold text-blue-400"
                >
                  {isArabic ? "عرض حالة النظام" : "System Health Status"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-blue-500/10 blur-3xl rounded-full" />
            </div>
          </aside>
        </div>
      </div>

      <footer className="mt-auto border-t border-slate-800 py-10 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-500">© 2026 Entrestate OS · Enterprise Edition</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href={prefixLocalePath("/terms", locale)} className="hover:text-slate-300">Terms</Link>
            <Link href={prefixLocalePath("/privacy", locale)} className="hover:text-slate-300">Privacy</Link>
            <Link href={prefixLocalePath("/compliance", locale)} className="hover:text-slate-300">Compliance</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
