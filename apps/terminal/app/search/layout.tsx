import type { Metadata } from "next"
import { absoluteUrl, getLocaleAlternates, getOpenGraphLocale } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const alternates = getLocaleAlternates("/search", locale)
  const title = isArabic ? "بحث Entrestate — تصفية المشاريع والإشارات" : "Entrestate Search — Filter projects and signals"
  const description = isArabic
    ? "صفِّ المشاريع والمطورين والمناطق والإشارات داخل سطح بحث موصول بنفس طبقة الأدلة."
    : "Filter projects, developers, areas, and signals from a search surface tied to the same evidence layer."

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

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
