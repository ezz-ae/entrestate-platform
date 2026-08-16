import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getMarketPulse } from "@/lib/decision-infrastructure"
import { getRequestLocale } from "@/i18n/request"

export const dynamic = "force-dynamic"

export default async function PortfolioToolPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const pulse = await getMarketPulse()

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "أدوات القرار" : "Tools"}</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">
            {isArabic ? "بناء المحفظة" : "Portfolio Builder"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic
              ? "ركّب سلة محافظة أو متوازنة أو جريئة مع مراعاة التوقيت والضغط قبل توزيع رأس المال."
              : "Build conservative, balanced, or opportunistic baskets with timing and stress constraints."}
          </p>
        </header>

        <section className="rounded-2xl border border-border/70 bg-card/70 p-4">
          <p className="text-sm text-muted-foreground">
            {isArabic ? "هذه لقطة السوق التي يبدأ منها بناء المحفظة:" : "Baseline market pulse for portfolio construction:"}
          </p>
          <pre className="mt-2 overflow-auto text-xs text-muted-foreground">{JSON.stringify(pulse.summary ?? {}, null, 2)}</pre>
        </section>
      </div>
      <Footer />
    </main>
  )
}
