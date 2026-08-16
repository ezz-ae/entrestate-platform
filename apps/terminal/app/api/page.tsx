import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getApiContentRows } from "@/lib/frontend-content"
import { getRequestLocale } from "@/i18n/request"
import { formatDate } from "@/lib/format/date"

export const dynamic = "force-dynamic"

const FALLBACK_ENDPOINTS = [
  {
    endpoint: "/api/top-data",
    method: "GET",
    description: "Top-data dashboard sections from entrestate_top_data",
    tier_required: "starter",
  },
  {
    endpoint: "/api/market-pulse",
    method: "GET",
    description: "Aggregate market pulse from inventory_full",
    tier_required: "starter",
  },
  {
    endpoint: "/api/deal-screener",
    method: "POST",
    description: "Rank projects with deterministic filters",
    tier_required: "pro",
  },
  {
    endpoint: "/api/evidence-drawer/:projectName",
    method: "GET",
    description: "Project evidence, confidence, and source coverage",
    tier_required: "pro",
  },
]

const ARABIC_DESCRIPTIONS: Record<string, string> = {
  "/api/top-data": "أقسام لوحات السوق المباشرة من top-data.",
  "/api/market-pulse": "لقطة السوق المجمعة من المخزون الحالي.",
  "/api/deal-screener": "فرز المشاريع بمعايير حتمية واضحة.",
  "/api/evidence-drawer/:projectName": "ملف الأدلة والثقة وتغطية المصادر للمشروع.",
}

function tierClassName(tier: string | null) {
  const normalized = tier?.toLowerCase().trim() ?? "starter"
  if (normalized === "institutional") return "border-indigo-500/50 bg-indigo-500/10 text-indigo-200"
  if (normalized === "team") return "border-sky-500/50 bg-sky-500/10 text-sky-200"
  if (normalized === "pro") return "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
  return "border-amber-500/50 bg-amber-500/10 text-amber-300"
}

function tierLabel(tier: string | null, isArabic: boolean) {
  const normalized = tier?.toLowerCase().trim() ?? "starter"
  if (!isArabic) return normalized
  if (normalized === "institutional") return "المؤسسية"
  if (normalized === "team") return "Team"
  if (normalized === "pro") return "Pro"
  return "الأساسية"
}

function localizeDescription(endpoint: string, description: string | null | undefined, isArabic: boolean) {
  if (!isArabic) return description ?? "—"
  return ARABIC_DESCRIPTIONS[endpoint] ?? description ?? "—"
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return {
    title: locale === "ar" ? "واجهات البيانات - Entrestate" : "API - Entrestate",
    description:
      locale === "ar"
        ? "مسارات بيانات السوق، الفرز، وملفات الأدلة بحسب الباقة." 
        : "Live route coverage for market data, screening, and evidence access by subscription tier.",
  }
}

export default async function ApiPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const payload = await getApiContentRows()
  const rows = payload.rows.length > 0 ? payload.rows : FALLBACK_ENDPOINTS

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "واجهات البيانات" : "Data Access"}</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">
            {isArabic ? "مسارات بيانات السوق" : "Market Data Routes"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            {isArabic
              ? "عرض مباشر للمسارات المتاحة بحسب الباقة: السوق، الفرز، وملفات الأدلة."
              : "Live route coverage for market data, screening, and evidence access by subscription tier."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {isArabic ? "آخر تحديث:" : "Data as of:"} {formatDate(payload.data_as_of, locale, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/70">
          <div className="overflow-x-auto">
            <table className="min-w-full text-start text-sm">
              <thead className="border-b border-border/60 bg-background/70 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{isArabic ? "النوع" : "Access"}</th>
                  <th className="px-4 py-3">{isArabic ? "المسار" : "Route"}</th>
                  <th className="px-4 py-3">{isArabic ? "الوصف" : "Description"}</th>
                  <th className="px-4 py-3">{isArabic ? "الباقة" : "Tier"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.method}-${row.endpoint}`} className="border-b border-border/50 last:border-b-0">
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-border/60 bg-background/60 px-2 py-1 text-xs font-semibold text-foreground">
                        {row.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{row.endpoint}</td>
                    <td className="px-4 py-3 text-muted-foreground">{localizeDescription(row.endpoint, row.description, isArabic)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${tierClassName(row.tier_required)}`}
                      >
                        {tierLabel(row.tier_required, isArabic)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
