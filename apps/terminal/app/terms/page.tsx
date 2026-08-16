import type { Metadata } from "next"
import { PolicyPage } from "@/components/policy-page"
import { getTermsOfService } from "@/lib/policy-copy"
import { getLocaleAlternates } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title: locale === "ar" ? "شروط الاستخدام | Entrestate" : "Terms of Service | Entrestate",
    description:
      locale === "ar"
        ? "الإطار الذي ينظم استخدام Entrestate ولوحات السوق وأدوات القرار والحسابات المؤسسية."
        : "The framework that governs use of Entrestate, market dashboards, decision tools, and enterprise workflows.",
    alternates: getLocaleAlternates("/terms", locale),
  }
}

export default async function TermsPage() {
  const locale = await getRequestLocale()

  return (
    <PolicyPage
      document={getTermsOfService(locale, {
        privacyHref: prefixLocalePath("/privacy", locale),
      })}
    />
  )
}
