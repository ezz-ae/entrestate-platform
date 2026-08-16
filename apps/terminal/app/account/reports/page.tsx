import type { Metadata } from "next"
export const dynamic = "force-dynamic"

import Link from "next/link"
import { ArrowLeft, Download, ExternalLink, FileText, MessageSquare, Sparkles } from "lucide-react"
import { redirect } from "next/navigation"

import { AccountSectionNav } from "@/components/account/account-section-nav"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { buildLoginHref } from "@/lib/auth/navigation"
import { getSyncedUser } from "@/lib/auth/sync"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Reports & Downloads - Entrestate",
  description: "Browse and download your generated decision objects, memos, and reports.",
}

const AUDIENCE_LABEL: Record<string, { en: string; ar: string }> = {
  investor: { en: "Investor brief", ar: "موجز مستثمر" },
  client: { en: "Client report", ar: "تقرير عميل" },
  executive: { en: "Executive summary", ar: "ملخص تنفيذي" },
  social: { en: "Market update", ar: "تحديث سوقي" },
}

const STOPWORDS = new Set([
  "with", "from", "that", "this", "and", "the", "for", "are", "have",
  "report", "analysis", "brief", "summary", "overview", "review",
])

function deriveTopics(title: string, payload: unknown, locale: AppLocale): string[] {
  const parsedPayload = payload as Record<string, unknown> | null
  const profile = parsedPayload?.profile as Record<string, unknown> | undefined
  const topics: string[] = []

  const audience = typeof profile?.audience === "string" ? profile.audience : null
  if (audience && AUDIENCE_LABEL[audience]) {
    topics.push(AUDIENCE_LABEL[audience][locale])
  }

  const templateName = typeof profile?.templateName === "string" ? profile.templateName : null
  if (templateName) topics.push(templateName)

  const clientName = typeof profile?.clientName === "string" ? profile.clientName : null
  if (clientName) topics.push(clientName)

  const words = title
    .split(/[\s·—\-:,]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !STOPWORDS.has(word.toLowerCase()))

  for (const word of words) {
    if (topics.length >= 5) break
    if (!topics.some((topic) => topic.toLowerCase().includes(word.toLowerCase()))) {
      topics.push(word)
    }
  }

  return topics.slice(0, 5)
}

function formatDate(value: Date, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value)
}

export default async function ReportsPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const user = await getSyncedUser()

  if (!user) redirect(buildLoginHref(locale, "/account/reports"))
  const terminalHref = prefixLocalePath("/me?openChat=true", locale)

  const reports = await prisma.assistantReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  const latestReportDate = reports[0] ? formatDate(reports[0].createdAt, locale) : isArabic ? "لا يوجد" : "None yet"

  return (
    <main className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 md:pt-28">
        <header className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <Link
            href={prefixLocalePath("/account", locale)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {isArabic ? "العودة إلى الحساب" : "Back to account"}
          </Link>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {isArabic ? "مخرجات القرار" : "Decision Outputs"}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                {isArabic ? "التقارير والتنزيلات" : "Reports and downloads"}
              </h1>
              <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
                {isArabic
                  ? "هنا تجد التقارير التي تم توليدها من جلسات القرار، مع فتح مباشر، تنزيل، وسياق واضح لكل ملف."
                  : "This is the working library for reports generated from your decision sessions, with direct open and download actions for each file."}
              </p>
            </div>

            <Button asChild>
              <Link href={terminalHref}>
                <MessageSquare className="h-4 w-4" />
                {isArabic ? "افتح محطة القرار" : "Open decision terminal"}
              </Link>
            </Button>
          </div>

          <AccountSectionNav active="reports" locale={locale} />
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {isArabic ? "إجمالي التقارير" : "Total reports"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{reports.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {isArabic ? "أحدث إنشاء" : "Latest generated"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{latestReportDate}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {isArabic ? "المصدر" : "Source"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {isArabic ? "جلسات القرار" : "Decision sessions"}
            </p>
          </div>
        </section>

        {reports.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold text-foreground">
              {isArabic ? "لا توجد تقارير بعد" : "No reports yet"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {isArabic
                ? "ابدأ جلسة قرار أو ولّد تقريراً من الدفتر ليظهر هنا تلقائياً ضمن مكتبة الحساب."
                : "Start a decision session or generate a notebook memo and it will appear here automatically in your account library."}
            </p>
            <Button asChild className="mt-6">
              <Link href={terminalHref}>
                <Sparkles className="h-4 w-4" />
                {isArabic ? "ابدأ أول تقرير" : "Generate your first report"}
              </Link>
            </Button>
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            {reports.map((report) => {
              const topics = deriveTopics(report.title, report.payload, locale)

              return (
                <article
                  key={report.id}
                  className="rounded-3xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 max-w-3xl">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {formatDate(report.createdAt, locale)}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-foreground">{report.title}</h2>
                      {topics.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {topics.map((topic) => (
                            <Badge key={topic} variant="outline">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline">
                        <a href={`/api/reports/${report.id}/download`}>
                          <Download className="h-4 w-4" />
                          {isArabic ? "تنزيل" : "Download"}
                        </a>
                      </Button>
                      <Button asChild>
                        <Link href={prefixLocalePath(`/reports/${report.publicId}`, locale)}>
                          {isArabic ? "فتح التقرير" : "Open report"}
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>

      <Footer />
    </main>
  )
}
