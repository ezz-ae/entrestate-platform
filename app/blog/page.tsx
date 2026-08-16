import type { Metadata } from "next"
import { BlogIndexPage } from "@/components/blog/blog-index-page"
import { getRequestLocale } from "@/i18n/request"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return {
    title: locale === "ar" ? "مقالات المنصة - Entrestate" : "Blog - Entrestate",
    description:
      locale === "ar"
        ? "قراءات ومتابعات من داخل السوق ومن داخل المنتج." 
        : "Real estate strategy, market evidence, and execution insights from the Entrestate team.",
  }
}

export default function BlogPage() {
  return <BlogIndexPage />
}
