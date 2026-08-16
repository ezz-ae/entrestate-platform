import type { Metadata } from "next"
import { TimeMachineRolodex } from "@/components/time-machine-rolodex"
import { SEO, absoluteUrl } from "@/lib/seo"
import { getRequestLocale } from "@/i18n/request"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const title = isArabic ? "أبحاث وتقارير عقارات دبي | Entrestate" : "Dubai Real Estate Research & Reports | Entrestate"
  const description = isArabic
    ? "تقارير موقعة من محللي Entrestate، مبنية على بيانات DLD ومصادر القوائم الموثقة، من دون ملخصات عامة بلا مصدر."
    : "Research and reports signed by Entrestate analysts, built from DLD data and verified listing feeds rather than generic AI summaries."

  return {
    title,
    description,
    alternates: {
      canonical: "/reports/library",
    },
    openGraph: {
      title: `${title} | ${SEO.siteName}`,
      description,
      url: "/reports/library",
      images: [absoluteUrl(SEO.defaultOgImagePath)],
      type: "website",
    },
  }
}

export default function ReportsLibraryPage() {
  return <TimeMachineRolodex />
}
