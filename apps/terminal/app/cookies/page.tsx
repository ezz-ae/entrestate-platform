import type { Metadata } from "next"
import { PolicyPage } from "@/components/policy-page"
import { getCookiePolicy } from "@/lib/policy-copy"
import { getLocaleAlternates } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title: locale === "ar" ? "سياسة ملفات الارتباط | Entrestate" : "Cookie Policy | Entrestate",
    description:
      locale === "ar"
        ? "كيف تستخدم Entrestate ملفات الارتباط والتخزين المحلي لتثبيت الجلسة وتحسين الأداء وحفظ التفضيلات."
        : "How Entrestate uses cookies and browser storage to keep sessions stable, improve performance, and remember preferences.",
    alternates: getLocaleAlternates("/cookies", locale),
  }
}

export default async function CookiesPage() {
  const locale = await getRequestLocale()
  return <PolicyPage document={getCookiePolicy(locale)} />
}
