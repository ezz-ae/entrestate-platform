import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { getRequestLocale } from "@/i18n/request"
import { ArabicDocPage } from "@/components/docs/arabic-doc-page"
import { getArabicDocsPage } from "@/lib/docs-arabic-pages"
const registryFields = [
  "metric_name",
  "source_system",
  "query_or_method",
  "owner",
  "last_refresh_at",
  "confidence_rule",
  "audit_link",
]

export default async function SourceOfTruthRegistryDocsPage() {
  const locale = await getRequestLocale()
  if (locale === "ar") {
    return <ArabicDocPage locale={locale} content={getArabicDocsPage("source-of-truth-registry")} />
  }

  return (
    <>
      <Link href="/docs/data-information" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Data & Information
      </Link>

      <header className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Platform Docs / Data Governance</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">Source of Truth Registry</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Registry that maps each KPI to source, calculation method, owner, freshness, and audit reference.
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-border/70 bg-card/70 p-6">
        <h2 className="text-lg font-semibold text-foreground">Schema Contract</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {registryFields.map((field) => (
            <div key={field} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground">
              {field}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
        <h2 className="text-lg font-semibold text-foreground">Data Files</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Primary artifacts are stored in `data/source-of-truth-registry.csv` and `data/source-of-truth-registry.schema.json`.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/docs/investor-metrics-audit"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            Open investor metrics audit
          </Link>
          <Link
            href="/docs/data-information"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Return to data model docs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
