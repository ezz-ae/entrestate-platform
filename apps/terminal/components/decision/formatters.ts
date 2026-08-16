import { formatAed as formatAedValue } from "@/lib/format/currency"
import { formatDecimal } from "@/lib/format/number"

export function formatAed(value: unknown, locale?: string | null, options?: { compact?: boolean; fallback?: string }) {
  return formatAedValue(value, locale, options)
}

export function formatYield(value: unknown, locale?: string | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—"
  return `${formatDecimal(value, locale, 1, 1)}%`
}

export function formatScore(value: unknown, locale?: string | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—"
  return formatDecimal(value, locale, 1, 1)
}
