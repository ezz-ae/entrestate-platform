import { defaultLocale, locales, prefixLocalePath, type AppLocale } from "@/i18n/locale"

const DEFAULT_SITE_URL = "https://entrestate.com"

export const SEO = {
  siteName: "Entrestate",
  defaultTitle: "Entrestate | UAE Real Estate Intelligence Platform",
  defaultDescription:
    "Entrestate is a UAE real estate intelligence platform for evidence-backed market analysis, project scoring, and investor-grade reports.",
  defaultOgImagePath: "/seq-poster.svg",
}

const SEO_COPY: Record<AppLocale, { defaultTitle: string; defaultDescription: string; homeTitle: string; homeDescription: string; ogAlt: string }> = {
  en: {
    defaultTitle: SEO.defaultTitle,
    defaultDescription: SEO.defaultDescription,
    homeTitle: "Dubai Real Estate Intelligence — DLD Data and Scored Projects | Entrestate",
    homeDescription:
      "Evidence-backed UAE real estate intelligence with DLD-linked market analysis, scored projects, area coverage, and auditable verdicts.",
    ogAlt: "Entrestate platform overview",
  },
  ar: {
    defaultTitle: "Entrestate | منصة قرار واستثمار عقاري في الإمارات",
    defaultDescription:
      "حلّل أسواق العقارات في الإمارات عبر تقييمات مدعومة بالأدلة، مؤشرات موثوقية المطورين، ومسارات قرار استثمارية احترافية.",
    homeTitle: "استخبارات عقارات دبي — بيانات DLD ومشاريع مقيّمة | Entrestate",
    homeDescription:
      "بيانات DLD، ومشاريع مقيّمة، وملفات مناطق في منصة واحدة تحول ضوضاء السوق إلى أحكام مدعومة بالأدلة في سوق دبي العقاري.",
    ogAlt: "نظرة عامة على منصة Entrestate",
  },
}

export function getSeoCopy(locale: AppLocale) {
  return SEO_COPY[locale]
}

export function getOpenGraphLocale(locale: AppLocale) {
  return locale === "ar" ? "ar_AE" : "en_AE"
}

export function getLocaleAlternates(path: string = "/", currentLocale: AppLocale = defaultLocale) {
  const localizedEntries = locales.map((locale) => [locale, prefixLocalePath(path, locale)] as const)

  return {
    canonical: prefixLocalePath(path, currentLocale),
    languages: Object.fromEntries([
      ...localizedEntries,
      ...localizedEntries.map(([locale, href]) => [locale === "ar" ? "ar-AE" : "en-AE", href]),
      ["x-default", prefixLocalePath(path, defaultLocale)],
    ]),
  }
}

export function getSiteUrl(): string {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    DEFAULT_SITE_URL

  const withProtocol = candidate.startsWith("http") ? candidate : `https://${candidate}`
  return withProtocol.replace(/\/$/, "")
}

export function absoluteUrl(path: string = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${getSiteUrl()}${normalizedPath}`
}
