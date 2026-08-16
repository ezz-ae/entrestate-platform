import { getDateLocale } from "@/lib/format/locale"

export function formatDate(
  value: string | number | Date | null | undefined,
  locale?: string | null,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
  fallback = "—",
) {
  if (!value) return fallback

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return fallback

  return new Intl.DateTimeFormat(getDateLocale(locale), options).format(date)
}

