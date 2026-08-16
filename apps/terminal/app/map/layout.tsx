import type { Metadata } from "next"
import { absoluteUrl, getLocaleAlternates, getOpenGraphLocale } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const alternates = getLocaleAlternates("/map", locale)
  const title = isArabic ? "خريطة Entrestate — قراءة مكانية للسوق" : "Entrestate Map — Spatial market intelligence"
  const description = isArabic
    ? "استكشف المناطق بحسب العائد والسعر وضغط المعروض داخل خريطة سوق مرتبطة بنفس طبقة البيانات."
    : "Explore area clusters by yield, price, and supply pressure from a spatial market surface linked to the same data spine."

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
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/seq-poster.svg")],
    },
  }
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children
}
