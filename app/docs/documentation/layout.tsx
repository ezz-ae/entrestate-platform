import type { Metadata } from "next"
import { absoluteUrl, getLocaleAlternates, getOpenGraphLocale } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const alternates = getLocaleAlternates("/docs/documentation", locale)
  const title = isArabic ? "توثيق بنية Entrestate — طبقة الأدلة ومحرك القرار" : "Entrestate Architecture Docs — Evidence stack and decision engine"
  const description = isArabic
    ? "اقرأ المعمارية الكاملة للمنصة: خط البيانات، طبقة الأدلة، Decision Tunnel، وأوزان التقييم."
    : "Read the full platform blueprint: data pipeline, evidence stack, Decision Tunnel, and scoring model."

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      locale: getOpenGraphLocale(locale),
      url: alternates.languages?.[locale],
      images: [absoluteUrl("/seq-poster.svg")],
    },
  }
}

export default function DocumentationLayout({ children }: { children: React.ReactNode }) {
  return children
}
