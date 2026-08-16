"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowRight, Bookmark, Trash2 } from "lucide-react"
import { getSavedSearches, removeSavedSearch, type SavedSearch } from "@/lib/saved-searches"

import { useLocale } from "next-intl"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

export default function SavedSearchesPage() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const [saved, setSaved] = useState<SavedSearch[]>([])

  useEffect(() => {
    setSaved(getSavedSearches())
  }, [])

  const handleRemove = (id: string) => {
    setSaved(removeSavedSearch(id))
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">{isArabic ? "مساحة العمل" : "Workspace"}</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              {isArabic ? "عمليات البحث المحفوظة" : "Saved searches"}
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              {isArabic ? "عد إلى الفلاتر الأكثر استخدامًا بنقرة واحدة." : "Return to your most-used filters with one click."}
            </p>
          </div>

          {saved.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card/60 p-8">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Bookmark className="w-4 h-4 text-accent" />
                {isArabic ? "ستظهر عمليات البحث المحفوظة هنا" : "Saved searches will appear here"}
              </div>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? "احفظ أي بحث من المستكشف للعودة إليه لاحقًا. يتم تخزين الأبحاث المحفوظة محليًا على هذا الجهاز."
                  : "Save any Explorer search to return to it later. Saved searches are stored locally on this device."}
              </p>
              <Link
                href={prefixLocalePath("/markets", locale)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {isArabic ? "فتح المستكشف" : "Open Explorer"}
                <ArrowRight className={`w-4 h-4 ${isArabic ? "rotate-180" : ""}`} />
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                {saved.map((item) => (
                  <div key={item.id} className="p-6 bg-card border border-border rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Bookmark className="w-4 h-4 text-accent" />
                          <h2 className="text-lg font-medium text-foreground">{item.label}</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{item.detail}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {isArabic ? "تم الحفظ" : "Saved"} {new Date(item.createdAt).toLocaleDateString(isArabic ? "ar-AE" : "en-US")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={prefixLocalePath(`/markets?saved=${encodeURIComponent(item.id)}`, locale)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
                        >
                          {isArabic ? "فتح في المستكشف" : "Open in Explorer"}
                          <ArrowRight className={`w-3.5 h-3.5 ${isArabic ? "rotate-180" : ""}`} />
                        </Link>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground border border-border rounded-md hover:text-foreground hover:border-foreground/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {isArabic ? "حذف" : "Remove"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={prefixLocalePath("/markets", locale)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {isArabic ? "فتح المستكشف" : "Open Explorer"}
                <ArrowRight className={`w-4 h-4 ${isArabic ? "rotate-180" : ""}`} />
              </Link>
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
