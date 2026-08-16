import type { Metadata } from "next"
import { absoluteUrl, getLocaleAlternates, getOpenGraphLocale } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const alternates = getLocaleAlternates("/status", locale)
  const title = isArabic ? "حالة Entrestate — صحة المنصة وحداثة البيانات" : "Entrestate Status — Platform health and data freshness"
  const description = isArabic
    ? "راجع صحة المساعد، حداثة البيانات، واستقرار الخدمات قبل الاعتماد أو التكامل."
    : "Review AI, data pipeline, and platform service health before rollout or integration."

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

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children
}
