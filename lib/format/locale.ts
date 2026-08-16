import { defaultLocale, normalizeLocale, type AppLocale } from "@/i18n/locale"

export function resolveAppLocale(locale?: string | null): AppLocale {
  return normalizeLocale(locale ?? defaultLocale)
}

export function getNumberLocale(locale?: string | null) {
  return resolveAppLocale(locale) === "ar" ? "ar-AE-u-nu-latn" : "en-AE"
}

export function getDateLocale(locale?: string | null) {
  return resolveAppLocale(locale) === "ar" ? "ar-AE" : "en-AE"
}

