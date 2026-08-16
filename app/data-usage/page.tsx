import type { Metadata } from "next"
import { PolicyPage } from "@/components/policy-page"
import { getDataUsage } from "@/lib/policy-copy"
import { getLocaleAlternates } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title: locale === "ar" ? "كيف نتعامل مع بيانات السوق | Entrestate" : "Data Usage | Entrestate",
    description:
      locale === "ar"
        ? "كيف تنتقل بيانات السوق داخل Entrestate من المصدر إلى اللوحات والتقارير والواجهات النهائية."
        : "How market data moves through Entrestate from source systems to dashboards, reports, and published interfaces.",
    alternates: getLocaleAlternates("/data-usage", locale),
  }
}

export default async function DataUsagePage() {
  const locale = await getRequestLocale()
  return <PolicyPage document={getDataUsage(locale)} />
}
