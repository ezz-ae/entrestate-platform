import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"

import { getRequestLocale } from "@/i18n/request"
import { ArabicDocPage } from "@/components/docs/arabic-doc-page"
import { getArabicDocsPage } from "@/lib/docs-arabic-pages"
const requiredFields = ["metric", "value", "period", "definition", "calculation", "evidence_link"]

const seededMetrics = ["ARR", "Pipeline Value", "Retention Rate", "CAC Payback", "Gross Margin", "Runway"]

export default async function InvestorMetricsAuditDocsPage() {
  const locale = await getRequestLocale()
  if (locale === "ar") {
    return <ArabicDocPage locale={locale} content={getArabicDocsPage("investor-metrics-audit")} />
  }

  return (
    <>
      <Link href="/docs/investors-relations" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Investor Relations
      </Link>

      <header className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Platform Docs / Investor Metrics</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">Investor Metrics Audit Trail</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Operational KPI dataset for investor communication with monthly history and deterministic formulas.
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-border/70 bg-card/70 p-6">
        <h2 className="text-lg font-semibold text-foreground">Required Fields</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {requiredFields.map((field) => (
            <div key={field} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground">
              {field}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-border/70 bg-card/70 p-6">
        <h2 className="text-lg font-semibold text-foreground">Seeded Coverage</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Seeded periods: <strong className="text-foreground">2025-10 to 2026-03</strong>.
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {seededMetrics.map((metric) => (
            <li key={metric} className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
              <span>{metric}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
        <h2 className="text-lg font-semibold text-foreground">Data Files</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Primary artifacts are stored in `data/investor-metrics-audit.csv` and `data/investor-metrics-audit.schema.json`.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/docs/source-of-truth-registry"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            Open source-of-truth registry
          </Link>
          <Link
            href="/docs/investors-relations"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Return to IR page
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
