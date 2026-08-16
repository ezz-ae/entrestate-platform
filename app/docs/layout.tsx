import type React from "react"
import type { Metadata } from "next"
import { PlatformDocsShell } from "@/components/docs/platform-docs-shell"
import { getRequestLocale } from "@/i18n/request"
import { getLocaleAlternates } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const alternates = getLocaleAlternates("/docs", locale)

  return {
    title: isArabic ? "وثائق المنصة - Entrestate" : "Platform Docs - Entrestate",
    description: isArabic
      ? "توثيق منصة Entrestate للشركاء والواجهات والسياق السوقي وعلاقات المستثمرين."
      : "Comprehensive platform documentation for partners, APIs, industry context, careers, and investor relations.",
    alternates,
    openGraph: {
      title: isArabic ? "وثائق المنصة - Entrestate" : "Platform Docs - Entrestate",
      description: isArabic
        ? "توثيق شامل للمنصة ومعمارية التشغيل."
        : "Comprehensive platform documentation and operating architecture.",
      url: alternates.languages?.[locale],
    },
  }
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PlatformDocsShell>{children}</PlatformDocsShell>
}
