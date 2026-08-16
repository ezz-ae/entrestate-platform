import { z } from "zod"

export const developerNoisePatterns = [/^s$/i, /^at\s/i, /^in\s/i]
export const cityAsDeveloperList = ["dubai", "sharjah", "abu dhabi", "ajman", "rak"]

const rawRecordSchema = z
  .object({
    id: z.string().optional(),
    developer_name: z.string().optional(),
    developer: z.string().optional(),
    city: z.string().optional(),
    area: z.string().optional(),
    unit_types: z.string().optional(),
    launch_year: z.union([z.number(), z.string(), z.null()]).optional(),
    completion_year: z.union([z.number(), z.string(), z.null()]).optional(),
    price_from_aed: z.union([z.number(), z.string(), z.null()]).optional(),
  })
  .passthrough()

export type RawInventoryRecord = z.infer<typeof rawRecordSchema>

export type SanitizationFlags = {
  price_outlier: boolean
}

export type SanitizedInventoryRecord = {
  id: string | null
  developer_name: string
  city: string
  area: string
  unit_types: string | null
  launch_year: number | null
  completion_year: number | null
  price_from_aed: number | null
  flags: SanitizationFlags
}

export type SanitizationIssue = {
  index: number
  reason: string
}

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/,/g, ""))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const isDeveloperNoise = (developerName: string) => developerNoisePatterns.some((pattern) => pattern.test(developerName))

const isCityAsDeveloper = (developerName: string) =>
  cityAsDeveloperList.includes(developerName.toLowerCase().trim())

const isLaunchYearValid = (year: number | null) => year === null || (year >= 2000 && year <= 2030)

const isCompletionYearValid = (year: number | null) => year === null || (year >= 2010 && year <= 2035)

const isPriceOutlier = (price: number | null) => price !== null && (price < 1000 || price > 100000000)

export function sanitizeInventoryRecord(record: unknown): { record: SanitizedInventoryRecord | null; reason?: string } {
  const parsed = rawRecordSchema.safeParse(record)
  if (!parsed.success) {
    return { record: null, reason: "invalid_record_shape" }
  }

  const data = parsed.data
  const developerName = normalizeString(data.developer_name ?? data.developer)
  const city = normalizeString(data.city)
  const area = normalizeString(data.area)

  if (!developerName) {
    return { record: null, reason: "missing_developer" }
  }
  if (!city) {
    return { record: null, reason: "missing_city" }
  }
  if (!area) {
    return { record: null, reason: "missing_area" }
  }
  if (isDeveloperNoise(developerName)) {
    return { record: null, reason: "developer_noise" }
  }
  if (isCityAsDeveloper(developerName)) {
    return { record: null, reason: "developer_city_name" }
  }

  const launchYear = toNumberOrNull(data.launch_year)
  const completionYear = toNumberOrNull(data.completion_year)

  if (!isLaunchYearValid(launchYear)) {
    return { record: null, reason: "launch_year_out_of_range" }
  }
  if (!isCompletionYearValid(completionYear)) {
    return { record: null, reason: "completion_year_out_of_range" }
  }

  const priceFromAed = toNumberOrNull(data.price_from_aed)
  const flags: SanitizationFlags = {
    price_outlier: isPriceOutlier(priceFromAed),
  }

  return {
    record: {
      id: normalizeString(data.id),
      developer_name: developerName,
      city,
      area,
      unit_types: normalizeString(data.unit_types),
      launch_year: launchYear,
      completion_year: completionYear,
      price_from_aed: priceFromAed,
      flags,
    },
  }
}

export function sanitizeInventoryRecords(records: unknown[]): {
  records: SanitizedInventoryRecord[]
  rejected: SanitizationIssue[]
} {
  const sanitized: SanitizedInventoryRecord[] = []
  const rejected: SanitizationIssue[] = []

  records.forEach((record, index) => {
    const result = sanitizeInventoryRecord(record)
    if (result.record) {
      sanitized.push(result.record)
    } else {
      rejected.push({ index, reason: result.reason || "unknown_error" })
    }
  })

  return { records: sanitized, rejected }
}
