import { formatDecimal, formatInteger } from "@/lib/format/number"

type AedOptions = {
  compact?: boolean
  fallback?: string
}

function normalizeLocalizedDigits(value: string) {
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩"
  const easternArabicIndic = "۰۱۲۳۴۵۶۷۸۹"

  return value
    .replace(/[٠-٩]/g, (digit) => String(arabicIndic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(easternArabicIndic.indexOf(digit)))
    .replace(/٫/g, ".")
    .replace(/٬/g, "")
}

function toFiniteNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === "bigint") {
    const asNumber = Number(value)
    return Number.isFinite(asNumber) ? asNumber : null
  }

  if (typeof value === "string") {
    const normalized = normalizeLocalizedDigits(value)
    const cleaned = normalized.replace(/[^0-9.-]/g, "")
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (value && typeof value === "object" && "toNumber" in value) {
    try {
      const parsed = (value as { toNumber: () => number }).toNumber()
      return Number.isFinite(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  return null
}

export function formatAed(value: unknown, locale?: string | null, options: AedOptions = {}) {
  const fallback = options.fallback ?? "AED —"
  const numericValue = toFiniteNumber(value)
  if (numericValue === null || numericValue <= 0) return fallback

  if (options.compact) {
    if (numericValue >= 1_000_000_000) {
      return `AED ${formatDecimal(numericValue / 1_000_000_000, locale, 1, 1, fallback)}B`
    }
    if (numericValue >= 1_000_000) {
      return `AED ${formatDecimal(numericValue / 1_000_000, locale, 1, 1, fallback)}M`
    }
    if (numericValue >= 1_000) {
      return `AED ${formatDecimal(numericValue / 1_000, locale, 0, 0, fallback)}K`
    }
  }

  return `AED ${formatInteger(Math.round(numericValue), locale, fallback)}`
}
