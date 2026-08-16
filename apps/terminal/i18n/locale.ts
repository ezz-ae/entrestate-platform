export const locales = ["en", "ar"] as const

export type AppLocale = (typeof locales)[number]

export const defaultLocale: AppLocale = "en"
export const localeCookieName = "entrestate-locale"

export function isLocale(value: string | null | undefined): value is AppLocale {
  return typeof value === "string" && (locales as readonly string[]).includes(value)
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  return isLocale(value) ? value : defaultLocale
}

export function getLocaleDirection(locale: AppLocale) {
  return locale === "ar" ? "rtl" : "ltr"
}

export function stripLocalePrefix(pathname: string | null | undefined) {
  if (!pathname) return "/"

  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return "/"

  if (isLocale(segments[0])) {
    const remainder = segments.slice(1).join("/")
    return remainder.length > 0 ? `/${remainder}` : "/"
  }

  return pathname || "/"
}

export function prefixLocalePath(href: string, locale: AppLocale) {
  if (!href.startsWith("/")) return href

  const [pathWithQuery, hashPart] = href.split("#")
  const [pathname, queryPart] = pathWithQuery.split("?")
  const strippedPath = stripLocalePrefix(pathname || "/")
  const localizedPath = strippedPath === "/" ? `/${locale}` : `/${locale}${strippedPath}`

  return `${localizedPath}${queryPart ? `?${queryPart}` : ""}${hashPart ? `#${hashPart}` : ""}`
}
