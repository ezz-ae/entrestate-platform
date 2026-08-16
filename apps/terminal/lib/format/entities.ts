import { resolveAppLocale } from "@/lib/format/locale"
import entityTranslations from "@/docs/arabic_entity_translations.json"

const developerTranslations = entityTranslations.developers as Record<string, string>
const areaTranslations = entityTranslations.areas as Record<string, string>
const extendedAreaTranslations = entityTranslations.areas_extended as Record<string, string>

function normalizeEntityKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\b(pjsc|llc|ltd)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function createNormalizedIndex(source: Record<string, string>) {
  const index = new Map<string, string>()

  for (const [key, value] of Object.entries(source)) {
    const trimmedKey = key.trim()
    if (!trimmedKey || !value?.trim()) continue

    if (!index.has(trimmedKey)) index.set(trimmedKey, value)

    const normalizedKey = normalizeEntityKey(trimmedKey)
    if (normalizedKey && !index.has(normalizedKey)) {
      index.set(normalizedKey, value)
    }
  }

  return index
}

const normalizedDeveloperTranslations = createNormalizedIndex(developerTranslations)
const normalizedAreaTranslations = createNormalizedIndex(areaTranslations)
const normalizedExtendedAreaTranslations = createNormalizedIndex(extendedAreaTranslations)

function resolveArabicEntityLabel(value: string) {
  const normalized = value.trim()
  if (!normalized) return null

  const normalizedKey = normalizeEntityKey(normalized)

  return (
    developerTranslations[normalized]
    ?? areaTranslations[normalized]
    ?? extendedAreaTranslations[normalized]
    ?? extendedAreaTranslations[normalized.toUpperCase()]
    ?? normalizedDeveloperTranslations.get(normalizedKey)
    ?? normalizedAreaTranslations.get(normalizedKey)
    ?? normalizedExtendedAreaTranslations.get(normalizedKey)
    ?? null
  )
}

export function pickLocalizedText(
  locale: string | null | undefined,
  arabicValue: unknown,
  defaultValue: unknown,
  fallback = "—",
) {
  const normalizedLocale = resolveAppLocale(locale)
  const primary = normalizedLocale === "ar" ? arabicValue : defaultValue
  const secondary = normalizedLocale === "ar" ? defaultValue : arabicValue

  if (typeof primary === "string" && primary.trim().length > 0) return primary.trim()
  if (normalizedLocale === "ar" && typeof defaultValue === "string") {
    const resolvedArabicLabel = resolveArabicEntityLabel(defaultValue)
    if (resolvedArabicLabel) return resolvedArabicLabel
  }
  if (typeof secondary === "string" && secondary.trim().length > 0) return secondary.trim()
  return fallback
}
