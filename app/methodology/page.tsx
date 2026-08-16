import type { Metadata } from "next"
import { PolicyPage } from "@/components/policy-page"
import { getMethodology } from "@/lib/policy-copy"
import { getLocaleAlternates } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title: locale === "ar" ? "المنهجية | Entrestate" : "Methodology | Entrestate",
    description:
      locale === "ar"
        ? "كيف تُحوّل Entrestate المدخلات إلى أحكام قابلة للمراجعة: طبقات الأدلة L1–L5، عتبات Decision Label، والحواجز الصلبة."
        : "How Entrestate turns inputs into inspectable verdicts: the L1–L5 evidence model, Decision Label thresholds, and hard guards.",
    alternates: getLocaleAlternates("/methodology", locale),
  }
}

export default async function MethodologyPage() {
  const locale = await getRequestLocale()
  return <PolicyPage document={getMethodology(locale)} />
}
