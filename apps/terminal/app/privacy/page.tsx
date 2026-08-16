import type { Metadata } from "next"
import { PolicyPage } from "@/components/policy-page"
import { getPrivacyPolicy } from "@/lib/policy-copy"
import { getLocaleAlternates } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title: locale === "ar" ? "سياسة الخصوصية | Entrestate" : "Privacy Policy | Entrestate",
    description:
      locale === "ar"
        ? "كيف تتعامل Entrestate مع بيانات الحساب واستخدام المنصة وطلبات الدعم ومخرجات الأدوات."
        : "How Entrestate handles account data, platform activity, support requests, and product outputs.",
    alternates: getLocaleAlternates("/privacy", locale),
  }
}

export default async function PrivacyPage() {
  const locale = await getRequestLocale()

  return (
    <PolicyPage
      document={getPrivacyPolicy(locale, {
        termsHref: prefixLocalePath("/terms", locale),
      })}
    />
  )
}
