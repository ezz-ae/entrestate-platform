"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { TrendingUp, Clock, ArrowRight } from "lucide-react"
import { libraryArticles } from "@/lib/library-data"
import { ReadingControls } from "@/components/reading-controls"
import { ExplainWithChat } from "@/components/explain-with-chat"
import { useLocale } from "next-intl"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

export default function ReportsPage() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const reports = libraryArticles.filter((article) => article.category === "reports")

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">{isArabic ? "المكتبة" : "Library"}</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              {isArabic ? "تقارير السوق" : "Market reports"}
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              {isArabic ? "دراسات معمقة في حركة الصفقات، والتسعير، وإشارات السوق الأهم." : "Deep dives into transaction volume, pricing behavior, and market signals."}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 mb-12">
            <ReadingControls />
            <div className="mt-3">
              <ExplainWithChat prompt={isArabic ? "اشرح لي كيف أستخدم تقارير Entrestate وما الذي يجب أن أبحث عنه داخل كل تقرير." : "Explain how to use Entrestate market reports and what to look for."} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((article) => (
              <Link
                key={article.slug}
                href={prefixLocalePath(`/library/${article.slug}`, locale)}
                className="group p-6 bg-card border border-border rounded-lg hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">
                    {article.tag}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  <span>{article.date}</span>
                </div>
                <h3 className="text-base font-medium text-foreground mb-2 leading-snug group-hover:text-accent transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {article.description}
                </p>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
                  {isArabic ? "اقرأ التقرير" : "Read report"}
                  <ArrowRight className="w-3 h-3" />
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
