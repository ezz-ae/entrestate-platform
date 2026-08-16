import Link from "next/link"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export default async function MemoToolPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 pb-20 pt-28 md:pt-36">
        <header className="rounded-2xl border border-border/70 bg-card/70 p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "أدوات القرار" : "Tools"}</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">
            {isArabic ? "مذكرة الاستثمار" : "Investor Memo Generator"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic
              ? "اجمع مبررات القرار في مذكرة واحدة: السعر، المنطقة، المطور، والضغط."
              : "Generate project memos with price reality, area risk, developer diligence, and stress-test sections."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <CopilotEntryLink>{isArabic ? "ابدأ من المساعد" : "Open Decision Tunnel"}</CopilotEntryLink>
            </Button>
            <Button variant="outline" asChild>
              <Link href={prefixLocalePath("/properties", locale)}>{isArabic ? "اختر مشروعًا أولًا" : "Select project first"}</Link>
            </Button>
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-border/70 bg-card/70 p-6 text-sm text-muted-foreground">
          <ol className="space-y-2">
            {isArabic ? (
              <>
                <li>1. اختر المشروع الذي تريد كتابة المذكرة عنه.</li>
                <li>2. حدّد المحاور التي تريد إظهارها: السعر، المنطقة، المطور، والضغط.</li>
                <li>3. أنشئ المذكرة من أداة `generate_investor_memo` داخل المسار.</li>
                <li>4. صدّر النسخة النهائية إلى PDF داخل مسارات الفريق.</li>
              </>
            ) : (
              <>
                <li>1. Select a project from inventory.</li>
                <li>2. Choose sections: price reality, area risk, developer DD, stress test.</li>
                <li>3. Generate memo using `generate_investor_memo` tool.</li>
                <li>4. Export final memo to PDF in Team tier workflows.</li>
              </>
            )}
          </ol>
        </section>
      </div>
      <Footer />
    </main>
  )
}
