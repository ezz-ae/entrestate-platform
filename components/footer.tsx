"use client"

import { useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useNewReport, markReportSeen } from "@/hooks/use-new-report"
import { usePlatformMetrics } from "@/hooks/use-platform-metrics"
import { useRuntimeShell } from "@/hooks/use-runtime-shell"
import { authClient } from "@/lib/auth/client"
import { LATEST_LIBRARY_REPORT } from "@/lib/latest-library-report"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  Database,
  ExternalLink,
  CheckCircle2,
  FileText,
  Mail,
  BookOpen,
  Linkedin,
  Instagram,
  Youtube,
  Twitter,
} from "lucide-react"

// ── Navigation structure ──────────────────────────────────────────────────────

const columns = [
  {
    heading: "Product",
    headingAr: "المنتج",
    links: [
      { label: "Decision Terminal", labelAr: "محطة القرار", href: "/chat" },
      { label: "Search & Screening", labelAr: "البحث والفرز", href: "/search" },
      { label: "Projects & Scoring", labelAr: "المشاريع والتقييم", href: "/properties" },
      { label: "Area Intelligence", labelAr: "ملف المناطق", href: "/areas" },
      { label: "Developer Reliability", labelAr: "موثوقية المطورين", href: "/developers" },
      { label: "Market Score", labelAr: "قراءة السوق", href: "/market-score" },
      { label: "Signal Feed", labelAr: "بث الإشارات", href: "/top-data" },
    ],
  },
  {
    heading: "Workflows",
    headingAr: "مسارات العمل",
    links: [
      { label: "Workspace", labelAr: "مساحة العمل", href: "/workspace" },
      { label: "Account Center", labelAr: "مركز الحساب", href: "/account" },
      { label: "Research Notebooks", labelAr: "دفاتر الأبحاث", href: "/account/book" },
      { label: "Reports Library", labelAr: "مكتبة التقارير", href: "/reports/library" },
      { label: "Pricing", labelAr: "التسعير", href: "/pricing" },
      { label: "Contact Sales", labelAr: "مبيعات المؤسسات", href: "/contact" },
    ],
  },
  {
    heading: "Documentation",
    headingAr: "التوثيق",
    links: [
      { label: "Documentation", labelAr: "التوثيق", href: "/docs/documentation" },
      { label: "Evidence Model", labelAr: "نموذج الأدلة", href: "/docs/data-information" },
      { label: "Source Registry", labelAr: "سجل مصدر الحقيقة", href: "/docs/source-of-truth-registry" },
      { label: "API Docs", labelAr: "وثائق الـ API", href: "/docs/partners-apis" },
      { label: "Status", labelAr: "الحالة", href: "/status" },
    ],
  },
  {
    heading: "Company",
    headingAr: "الشركة",
    links: [
      { label: "About", labelAr: "من نحن", href: "/about" },
      { label: "Enterprise", labelAr: "المؤسسات", href: "/enterprise" },
      { label: "Infrastructure", labelAr: "البنية", href: "/infrastructure" },
      { label: "Investor Relations", labelAr: "علاقات المستثمرين", href: "/investor-relations" },
      { label: "Careers", labelAr: "الوظائف", href: "/careers" },
      { label: "Media", labelAr: "الإعلام", href: "/media" },
    ],
  },
  {
    heading: "Trust Center",
    headingAr: "مركز الثقة",
    links: [
      { label: "Privacy Policy", labelAr: "سياسة الخصوصية", href: "/privacy" },
      { label: "Terms of Service", labelAr: "شروط الخدمة", href: "/terms" },
      { label: "Cookie Policy", labelAr: "سياسة ملفات الارتباط", href: "/cookies" },
      { label: "Data Usage", labelAr: "استخدام البيانات", href: "/data-usage" },
      { label: "Methodology", labelAr: "المنهجية", href: "/methodology" },
      { label: "Subprocessors", labelAr: "المعالِجون الفرعيون", href: "/subprocessors" },
      { label: "Data Residency", labelAr: "إقامة البيانات", href: "/data-residency" },
      { label: "DPA Template", labelAr: "ملحق معالجة البيانات", href: "/dpa" },
      { label: "Support", labelAr: "الدعم", href: "/support" },
    ],
  },
]

const trustBadges = [
  {
    icon: Database,
    label: "DLD Sourced",
    labelAr: "مصدر DLD",
    sub: "Where DLD records exist, they're surfaced as L1",
    subAr: "حيث تتوفر سجلات DLD تُعرض كطبقة L1",
  },
  {
    icon: ShieldCheck,
    label: "Governed Access",
    labelAr: "وصول محكوم",
    sub: "Signed requests, access controls, audit log",
    subAr: "طلبات موقعة، ضوابط وصول، سجل تدقيق",
  },
  {
    icon: CheckCircle2,
    label: "Cross-referenced Listings",
    labelAr: "قوائم متقاطعة المراجع",
    sub: "PropertyFinder + Bayut + DLD reconciled",
    subAr: "PropertyFinder + Bayut + DLD متطابقة",
  },
  {
    icon: MapPin,
    label: "UAE Market Focus",
    labelAr: "تركيز على سوق الإمارات",
    sub: "Dubai · Abu Dhabi · Sharjah",
    subAr: "دبي · أبوظبي · الشارقة",
  },
]

const socialLinks = [
  { label: "X", href: "https://x.com/entrestate", icon: Twitter },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/entrestate", icon: Linkedin },
  { label: "Instagram", href: "https://www.instagram.com/entrestate", icon: Instagram },
  { label: "YouTube", href: "https://www.youtube.com/@entrestate", icon: Youtube },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function Footer() {
  const locale = useLocale() as AppLocale
  const runtimeShell = useRuntimeShell()
  const isDedicatedMobileShell = runtimeShell === "mobile"
  const isArabic = locale === "ar"
  const t = (en: string, ar: string) => (isArabic ? ar : en)
  const toHref = (href: string) => (href.endsWith(".xml") ? href : prefixLocalePath(href, locale))
  const { data: session } = authClient.useSession()
  const decisionTerminalHref = session?.user
    ? prefixLocalePath("/me?openChat=true", locale)
    : prefixLocalePath("/chat", locale)
  const localizedColumns = columns.map((col) => ({
    heading: isArabic ? col.headingAr : col.heading,
    links: col.links.map((link) => ({
      label: isArabic ? link.labelAr : link.label,
      href: link.href === "/chat" ? decisionTerminalHref : toHref(link.href),
    })),
  }))
  const localizedTrustBadges = trustBadges.map((badge) => ({
    ...badge,
    label: isArabic ? badge.labelAr : badge.label,
    sub: isArabic ? badge.subAr : badge.sub,
  }))
  const { report, dismiss } = useNewReport()
  const [reportEmailSent, setReportEmailSent] = useState(false)
  const [reportSending, setReportSending] = useState(false)
  const metrics = usePlatformMetrics()

  // Library report email state
  const [libraryEmail, setLibraryEmail] = useState("")
  const [libraryEmailSent, setLibraryEmailSent] = useState(false)
  const [libraryEmailSending, setLibraryEmailSending] = useState(false)
  const formatter = new Intl.NumberFormat(isArabic ? "ar-AE" : "en-US")
  const projectCountText = formatter.format(metrics.totalProjects)
  const dldTransactionsText = formatter.format(metrics.dldTransactions)
  const buySignalsText = formatter.format(metrics.buySignals)

  if (isDedicatedMobileShell) {
    return (
      <footer className="border-t border-border/60 bg-background/95">
        <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
          <Link href={toHref("/")} className="flex items-center gap-2">
            <div className="flex gap-0.5" aria-hidden="true">
              <div className="h-3 w-3 rounded-sm bg-foreground" />
              <div className="h-3 w-3 rounded-sm bg-foreground/50" />
              <div className="h-3 w-3 rounded-sm bg-primary" />
            </div>
            <span className="text-base font-medium tracking-tight text-foreground">entrestate</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {t(
              "Direct access to scored inventory, market evidence, and the decision terminal.",
              "وصول مباشر إلى المخزون المصنّف، وأدلة السوق، ومحطة القرار.",
            )}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: t("DLD", "DLD"), value: dldTransactionsText },
              { label: t("Projects", "المشاريع"), value: projectCountText },
              { label: t("BUY", "BUY"), value: buySignalsText },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/60 bg-card/60 px-3 py-3">
                <p className="text-lg font-semibold text-foreground">{item.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
            {[
              { label: t("Pricing", "التسعير"), href: "/pricing" },
              { label: t("Reports", "التقارير"), href: "/reports/library" },
              { label: t("Account", "الحساب"), href: "/account" },
              { label: t("Support", "الدعم"), href: "/support" },
            ].map((item) => (
              <Link
                key={item.href}
                href={toHref(item.href)}
                className="rounded-2xl border border-border/60 bg-card/50 px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/30"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    )
  }

  const handleEmailReport = async () => {
    if (!report || reportSending) return
    setReportSending(true)
    try {
      await fetch(`/api/reports/${report.id}/email`, { method: "POST" })
      setReportEmailSent(true)
      markReportSeen(report.id)
    } catch {
      setReportEmailSent(true)
    } finally {
      setReportSending(false)
    }
  }

  const handleLibraryEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!libraryEmail.trim() || libraryEmailSending) return
    setLibraryEmailSending(true)
    try {
      await fetch("/api/library-report/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: libraryEmail }),
      })
      setLibraryEmailSent(true)
      setLibraryEmail("")
    } catch {
      setLibraryEmailSent(true)
    } finally {
      setLibraryEmailSending(false)
    }
  }

  return (
    <footer className="border-t border-border/60 bg-background">

      {/* ── CTA / Newsletter strip ─────────────────────────────────────── */}
      <div className="border-b border-border/40">
        <div className="container mx-auto px-6 py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* Left */}
            <div className="max-w-lg">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
                {t("Platform snapshot", "لقطة المنصة")}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {t(
                  "One platform for scored inventory, evidence, and research.",
                  "منصة واحدة للمخزون المصنّف، والأدلة، والأبحاث.",
                )}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t(
                  `${dldTransactionsText} DLD transactions. ${projectCountText} scored projects. Research, reports, and enterprise delivery stay connected in one system.`,
                  `${dldTransactionsText} معاملة DLD. ${projectCountText} مشروعاً مقيّماً. تبقى الأبحاث والتقارير وتسليم المؤسسات متصلة داخل نظام واحد.`,
                )}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    value: dldTransactionsText,
                    label: t("DLD transactions", "معاملات DLD"),
                    sub: t("Canonical source", "مصدر مرجعي"),
                  },
                  {
                    value: projectCountText,
                    label: t("Scored projects", "مشاريع مصنفة"),
                    sub: t("Engine refreshed hourly", "المحرّك يُحدَّث كل ساعة"),
                  },
                  {
                    value: buySignalsText,
                    label: t("BUY signals", "إشارات BUY"),
                    sub: t("Evidence-backed windows", "نوافذ مدعومة بالأدلة"),
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/60 bg-card/40 px-4 py-4">
                    <p className="text-lg font-semibold text-foreground">{item.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/50">{item.sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <Link href={toHref("/pricing")} className="text-foreground transition hover:text-primary">
                  {t("View Pricing", "عرض التسعير")}
                </Link>
                <Link href={toHref("/contact")} className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-foreground">
                  {t("Enterprise enquiry", "استفسار مؤسسي")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right — report card OR newsletter, never both */}
            <div className="w-full max-w-sm shrink-0">
              {report && !reportEmailSent ? (
                /* ── New report available ── */
                <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">{t("Report ready", "التقرير جاهز")}</p>
                        <p className="mt-0.5 line-clamp-2 text-sm font-medium text-foreground leading-snug">
                          {report.title}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => dismiss(report.id)}
                      className="mt-0.5 shrink-0 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                    {t(
                      "Your AI-generated report is saved in your library. Want a copy sent directly to your inbox?",
                      "تم حفظ تقريرك الذي أنشأه الذكاء الاصطناعي في مكتبتك. هل تريد نسخة تُرسل مباشرة إلى بريدك؟",
                    )}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleEmailReport}
                      disabled={reportSending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {reportSending ? t("Sending…", "جارٍ الإرسال…") : t("Email me this report", "أرسل هذا التقرير إلى بريدي")}
                    </button>
                    <Link
                      href={`/reports/${report.publicId}`}
                      onClick={() => dismiss(report.id)}
                      className="flex items-center justify-center rounded-lg border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t("View", "عرض")}
                    </Link>
                  </div>

                  <p className="mt-3 text-[10px] text-muted-foreground/40">
                    {t("Generated", "تم الإنشاء")} {new Date(report.createdAt).toLocaleDateString(locale === "ar" ? "ar-AE-u-nu-latn" : "en-US", { month: "long", day: "numeric" })}
                    {" · "}
                    <Link href={toHref("/account/reports")} className="underline underline-offset-2 hover:text-muted-foreground/60">
                      {t("All reports", "كل التقارير")}
                    </Link>
                  </p>
                </div>
              ) : reportEmailSent ? (
                /* ── Email sent confirmation ── */
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("Report on its way", "التقرير في الطريق")}</p>
                      <p className="text-xs text-muted-foreground">{t("Check your inbox shortly.", "تحقق من بريدك بعد قليل.")}</p>
                    </div>
                  </div>
                  <Link
                    href={toHref("/account/reports")}
                    className="text-xs text-muted-foreground/50 underline underline-offset-2 hover:text-muted-foreground"
                  >
                    {t("View all reports →", "عرض كل التقارير ←")}
                  </Link>
                </div>
              ) : (
                /* ── Default: latest published library report ── */
                <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
                  {/* Header */}
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">{t("Latest Research", "أحدث الأبحاث")}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/50">{LATEST_LIBRARY_REPORT.date} · {LATEST_LIBRARY_REPORT.category}</p>
                    </div>
                  </div>

                  <p className="mb-1 font-serif text-sm font-medium leading-snug text-foreground line-clamp-2">
                    {LATEST_LIBRARY_REPORT.title}
                  </p>
                  <p className="mb-4 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {LATEST_LIBRARY_REPORT.subtitle}
                  </p>

                  {/* Read button */}
                  <Link
                    href={toHref(LATEST_LIBRARY_REPORT.href)}
                    className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-secondary/60"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    {t("Read the report", "اقرأ التقرير")}
                  </Link>

                  {/* Email form */}
                  {libraryEmailSent ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <p className="text-xs text-emerald-400">{t("Report sent — check your inbox.", "تم إرسال التقرير — تحقق من بريدك.")}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleLibraryEmail} className="flex gap-2">
                      <input
                        type="email"
                        value={libraryEmail}
                        onChange={(e) => setLibraryEmail(e.target.value)}
                        placeholder={t("you@company.com", "you@company.com")}
                        required
                        className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="submit"
                        disabled={libraryEmailSending}
                        className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                      >
                        <Mail className="h-3 w-3 shrink-0" />
                        {libraryEmailSending ? "…" : t("Send to my email", "أرسل إلى بريدي")}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust badges ──────────────────────────────────────────────── */}
      <div className="border-b border-border/30">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {localizedTrustBadges.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2.5 text-muted-foreground/60">
                <Icon className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <div>
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <span className="mx-1.5 text-muted-foreground/30">·</span>
                  <span className="text-[11px] text-muted-foreground/50">{sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main link grid ────────────────────────────────────────────── */}
      <div className="container mx-auto px-6 py-14">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr]">

          {/* Brand column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href={toHref("/")} className="mb-5 flex items-center gap-2">
              <div className="flex gap-0.5" aria-hidden="true">
                <div className="h-3 w-3 rounded-sm bg-foreground" />
                <div className="h-3 w-3 rounded-sm bg-foreground/50" />
                <div className="h-3 w-3 rounded-sm bg-primary" />
              </div>
              <span className="text-base font-medium tracking-tight text-foreground">entrestate</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(
                "The decision infrastructure for UAE real estate — market data, project intelligence, and investor workflows in one place.",
                "البنية التحتية لاتخاذ القرار في عقارات الإمارات — بيانات السوق، وملفات المشاريع، وسير عمل المستثمر في مكان واحد.",
              )}
            </p>
            <div className="mt-5 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_2px_rgba(52,211,153,0.4)]" />
              <span className="text-[11px] text-muted-foreground/60">{t("All systems operational", "جميع الأنظمة تعمل")}</span>
              <Link href={toHref("/status")} className="ms-1 text-[11px] text-muted-foreground/40 underline underline-offset-2 hover:text-muted-foreground">
                {t("Status", "الحالة")}
              </Link>
            </div>

            <div className="mt-5">
              <Link
                href={toHref("/contact")}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                {t("Contact enterprise sales", "تواصل مع مبيعات المؤسسات")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {t("Follow Entrestate", "تابع Entrestate")}
              </p>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Region badge */}
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-card/40 px-2.5 py-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-[11px] text-muted-foreground/60">{t("Dubai, United Arab Emirates", "دبي، الإمارات العربية المتحدة")}</span>
            </div>
          </div>

          {/* Link columns */}
          {localizedColumns.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Honest disclaimer ─────────────────────────────────────────── */}
      <div className="border-t border-border/30">
        <div className="container mx-auto px-6 py-4">
          <p className="text-[11px] leading-relaxed text-muted-foreground/60">
            {t(
              "Entrestate is a market-intelligence layer, not a property listing marketplace, broker, or financial advisor. Verdicts and scores are evidence-backed reads of public and licensed data — they are not investment advice and do not replace legal or due-diligence review. Live counts and snapshots refresh on each ETL pass; canonical numbers are exposed via /api/platform-metrics.",
              "Entrestate طبقة استخبارات سوقية، وليست منصة قوائم عقارية أو وسيطاً أو مستشاراً مالياً. الأحكام والدرجات قراءات مدعومة بالأدلة من البيانات العامة والمرخّصة، وليست توصيات استثمارية ولا تُغني عن المراجعة القانونية. تتحدّث اللقطات مع كل دورة ETL؛ الأرقام المرجعية متاحة عبر /api/platform-metrics."
            )}
          </p>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────── */}
      <div className="border-t border-border/30">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <p className="text-[11px] text-muted-foreground/50">
                &copy; {new Date().getFullYear()} {t("Entrestate Technologies. All rights reserved.", "Entrestate Technologies. جميع الحقوق محفوظة.")}
              </p>
              <span className="hidden text-muted-foreground/20 sm:inline">·</span>
              <p className="text-[11px] text-muted-foreground/40">
                {t("Registered in the United Arab Emirates", "مسجلة في دولة الإمارات العربية المتحدة")}
              </p>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary/80">
                {t("Powered by Entrestate API", "مدعوم عبر Entrestate API")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {[
                { label: t("Privacy", "الخصوصية"), href: "/privacy" },
                { label: t("Terms", "الشروط"), href: "/terms" },
                { label: t("Cookies", "الكوكيز"), href: "/cookies" },
                { label: t("Sitemap", "خريطة الموقع"), href: "/sitemap.xml" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={toHref(link.href)}
                  className="text-[11px] text-muted-foreground/40 transition-colors hover:text-muted-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <div className="hidden sm:block w-px h-3 bg-border/40" />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>

    </footer>
  )
}
