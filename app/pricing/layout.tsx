import type { Metadata } from "next"
import { absoluteUrl, getLocaleAlternates, getOpenGraphLocale } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const alternates = getLocaleAlternates("/pricing", locale)
  const title = isArabic
    ? "أسعار Entrestate — من الوصول المجاني إلى النشر المؤسسي"
    : "Entrestate Pricing — Free access to enterprise deployment"
  const description = isArabic
    ? "افهم ما هو مجاني، وما الذي يفتح التقارير المخصصة، العلامة التجارية، الـ API، ومساحة الفريق داخل Entrestate."
    : "See free access, analyst plans, branded outputs, and enterprise deployment options across Entrestate."

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

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
