import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight } from "lucide-react"
import { prefixLocalePath } from "@/i18n/locale"
import { getRequestLocale } from "@/i18n/request"

export default async function NotFound() {
  const locale = await getRequestLocale()
  const t = await getTranslations({ locale, namespace: "notFound" })

  return (
    <main id="main-content" className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-24 md:py-32">
        <div className="text-center px-6 max-w-xl mx-auto">
          <p className="text-8xl md:text-9xl font-serif text-border mb-8">404</p>
          <h1 className="text-2xl md:text-3xl font-serif text-foreground mb-4">{t("title")}</h1>
          <p className="text-muted-foreground mb-10">{t("body")}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={prefixLocalePath("/", locale)}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {t("backHome")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={prefixLocalePath("/markets", locale)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("exploreMarkets")}
            </Link>
          </div>

          <div className="mt-16">
            <p className="text-xs text-muted-foreground mb-4">{t("quickLinks")}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: t("markets"), href: "/markets" },
                { label: t("library"), href: "/library" },
                { label: t("workspace"), href: "/workspace" },
                { label: t("about"), href: "/about" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={prefixLocalePath(link.href, locale)}
                  className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-accent/30 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
