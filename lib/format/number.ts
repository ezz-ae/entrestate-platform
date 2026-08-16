import { getNumberLocale } from "@/lib/format/locale"

type NumberOptions = Intl.NumberFormatOptions & {
  fallback?: string
}

export function formatNumber(value: unknown, locale?: string | null, options: NumberOptions = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) return options.fallback ?? "—"

  const { fallback: _fallback, ...intlOptions } = options
  return new Intl.NumberFormat(getNumberLocale(locale), intlOptions).format(value)
}

export function formatInteger(value: unknown, locale?: string | null, fallback = "—") {
  return formatNumber(value, locale, {
    fallback,
    maximumFractionDigits: 0,
  })
}

export function formatDecimal(
  value: unknown,
  locale?: string | null,
  minimumFractionDigits = 1,
  maximumFractionDigits = minimumFractionDigits,
  fallback = "—",
) {
  return formatNumber(value, locale, {
    fallback,
    minimumFractionDigits,
    maximumFractionDigits,
  })
}

