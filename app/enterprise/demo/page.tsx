import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TransactionDemo } from "@/components/enterprise/transaction-demo"
import { getRequestLocale } from "@/i18n/request"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { prefixLocalePath } from "@/i18n/locale"

export const dynamic = "force-dynamic"

export default async function EnterpriseDemoPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {isArabic ? "ديمو التنفيذ" : "Execution Demo"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">
            {isArabic ? "ديمو التنفيذ - 8 خطوات" : "8-Step Execution Demo"}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {isArabic
              ? "تدفق مباشر يستدعي الـ API ويعرض المخرجات الحقيقية."
              : "A live flow that calls the API and renders real output."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={prefixLocalePath("/infrastructure", locale)}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-5 py-2.5 text-sm font-semibold text-foreground"
            >
              {isArabic ? "شرح النظام" : "System overview"}
            </Link>
            <Link
              href={prefixLocalePath("/enterprise", locale)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              {isArabic ? "دليل الـ API" : "API guide"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <TransactionDemo />
      </div>
      <Footer />
    </main>
  )
}
