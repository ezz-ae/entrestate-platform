import type { Metadata } from "next"
import { defaultLocale, locales, prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { SEO, absoluteUrl, getSiteUrl } from "@/lib/seo"

const LOCALE_TO_OG: Record<AppLocale, string> = {
  en: "en_AE",
  ar: "ar_AE",
}

export type MetadataLocale = AppLocale

export const SITE = {
  url: getSiteUrl(),
  name: SEO.siteName,
  twitter: "@entrestate",
  ogImage: SEO.defaultOgImagePath,
} as const

export type BuildMetadataInput = {
  title: string
  description: string
  path: string
  locale: MetadataLocale
  ogImage?: string
  noindex?: boolean
  keywords?: string[]
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const canonicalPath = prefixLocalePath(input.path, input.locale)
  const canonical = `${SITE.url}${canonicalPath}`
  const ogImage = absoluteUrl(input.ogImage ?? SITE.ogImage)

  return {
    metadataBase: new URL(SITE.url),
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...locales.map((locale) => [locale, `${SITE.url}${prefixLocalePath(input.path, locale)}`]),
        ...locales.map((locale) => [locale === "ar" ? "ar-AE" : "en-AE", `${SITE.url}${prefixLocalePath(input.path, locale)}`]),
        ["x-default", `${SITE.url}${prefixLocalePath(input.path, defaultLocale)}`],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      url: canonical,
      title: input.title,
      description: input.description,
      locale: LOCALE_TO_OG[input.locale],
      alternateLocale: locales.filter((locale) => locale !== input.locale).map((locale) => LOCALE_TO_OG[locale]),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${input.title} | ${SITE.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE.twitter,
      title: input.title,
      description: input.description,
      images: [ogImage],
    },
    robots: input.noindex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  }
}
