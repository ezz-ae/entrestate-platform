import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getEvidenceByProjectName } from "@/lib/decision-infrastructure"
import { getRequestLocale } from "@/i18n/request"

export const dynamic = "force-dynamic"

export default async function EvidenceToolPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const sample = await getEvidenceByProjectName("marina")

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "أدوات القرار" : "Tools"}</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">
            {isArabic ? "ملف الأدلة" : "Evidence Drawer Tool"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic
              ? "راجع المصادر والاستبعادات والافتراضات ومستوى الثقة قبل تثبيت القرار على مستوى المشروع."
              : "Inspect sources, exclusions, assumptions, and confidence for project-level decisions."}
          </p>
        </header>

        <section className="rounded-2xl border border-border/70 bg-card/70 p-4">
          <pre className="overflow-auto text-xs text-muted-foreground">{JSON.stringify(sample.rows.slice(0, 5), null, 2)}</pre>
        </section>
      </div>
      <Footer />
    </main>
  )
}
