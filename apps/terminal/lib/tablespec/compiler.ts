import { tableSpecSchema } from "./schema"
import { getTableSpecTemplate } from "./templates"
import {
  TableSpec,
  TableSpecCompilation,
  TableSpecCompileInput,
  TableSpecFilter,
  TableSpecGoldenPath,
  TableSpecRowGrain,
  TableSpecTimeRange,
} from "./types"
import { enforceTableSpec } from "./validation"

const defaultSignals = ["price_from_aed", "yield_pct", "risk_band", "liquidity_band"]
const areaKeywords = [
  "jvc",
  "dubai marina",
  "downtown",
  "business bay",
  "palm jumeirah",
  "dubai hills",
  "arjan",
  "jlt",
  "jbr",
  "yas island",
]
const cityKeywords = ["dubai", "abu dhabi", "sharjah", "ajman", "rak", "ras al khaimah"]

const safeIntent = (intent?: string) => {
  if (!intent) return "Untitled request"
  const trimmed = intent.trim()
  return trimmed.length > 0 ? trimmed : "Untitled request"
}

const normalizeText = (value: string) => value.toLowerCase().trim()

const parseBudgetAed = (intent: string): number | null => {
  const normalized = normalizeText(intent)
  const match = normalized.match(/(?:under|below|<)\s*([\d.]+)\s*(m|million|k|thousand)?\s*(aed)?/i)
  if (!match) return null
  const raw = Number.parseFloat(match[1])
  if (!Number.isFinite(raw)) return null
  const unit = match[2]
  if (unit === "m" || unit === "million") return Math.round(raw * 1_000_000)
  if (unit === "k" || unit === "thousand") return Math.round(raw * 1_000)
  return Math.round(raw)
}

const parseBeds = (intent: string): number | null => {
  const normalized = normalizeText(intent)
  const match = normalized.match(/(\d+)\s*br/) || normalized.match(/(\d+)\s*bed/)
  if (!match) return null
  const beds = Number.parseInt(match[1], 10)
  return Number.isFinite(beds) ? beds : null
}

const parseScope = (intent: string) => {
  const normalized = normalizeText(intent)
  const areas = areaKeywords.filter((area) => normalized.includes(area))
  const cities = cityKeywords.filter((city) => normalized.includes(city))
  return {
    areas: areas.length ? areas.map((area) => (area === "jvc" ? "JVC" : area)) : undefined,
    cities: cities.length ? cities : undefined,
  }
}

const parseRowGrain = (intent: string): TableSpecRowGrain => {
  const normalized = normalizeText(intent)
  if (normalized.includes("transaction")) return "transaction"
  if (normalized.includes("asset") || normalized.includes("unit")) return "asset"
  if (/\d+\s*br/.test(normalized) || /\d+\s*bed/.test(normalized)) return "asset"
  return "project"
}

const parseTimeRangeFromHorizon = (horizon?: string): TableSpecTimeRange => {
  if (!horizon) return { mode: "relative", last: 24, unit: "months" }
  const normalized = normalizeText(horizon)
  if (normalized.includes("ready")) return { mode: "relative", last: 6, unit: "months" }
  const match = normalized.match(/(\d+)\s*-\s*(\d+)\s*(yr|year)/)
  if (match) {
    const upper = Number.parseInt(match[2], 10)
    if (Number.isFinite(upper)) {
      return { mode: "relative", last: upper, unit: "years" }
    }
  }
  const single = normalized.match(/(\d+)\s*(yr|year)/)
  if (single) {
    const years = Number.parseInt(single[1], 10)
    if (Number.isFinite(years)) return { mode: "relative", last: years, unit: "years" }
  }
  return { mode: "relative", last: 24, unit: "months" }
}

const buildSignals = (intent: string): string[] => {
  const normalized = normalizeText(intent)
  const signals = new Set(defaultSignals)
  if (normalized.includes("price")) signals.add("price_from_aed")
  if (normalized.includes("yield")) signals.add("yield_pct")
  if (normalized.includes("risk")) signals.add("risk_band")
  if (normalized.includes("liquidity")) signals.add("liquidity_band")
  if (normalized.includes("handover") || normalized.includes("ready")) signals.add("handover_date")
  return Array.from(signals)
}

const buildFilters = (intent: string, profile?: TableSpecCompileInput["profile"]): TableSpecFilter[] => {
  const normalized = normalizeText(intent)
  const filters: TableSpecFilter[] = []
  const budget = parseBudgetAed(normalized)
  if (budget) {
    filters.push({ field: "price_from_aed", op: "lte", value: budget })
  }
  const beds = parseBeds(normalized)
  if (beds) {
    filters.push({ field: "beds", op: "eq", value: beds })
  }
  if (normalized.includes("ready") || normalized.includes("completed")) {
    filters.push({ field: "status_band", op: "eq", value: "Completed" })
  }
  if (profile?.riskProfile) {
    filters.push({ field: "classification", op: "eq", value: profile.riskProfile })
  }
  return filters
}

const createIntentSpec = (input: TableSpecCompileInput): TableSpec => {
  const intent = safeIntent(input.intent)
  const scope = parseScope(intent)
  return {
    version: "v1",
    intent,
    row_grain: parseRowGrain(intent),
    scope,
    time_grain: "monthly",
    time_range: parseTimeRangeFromHorizon(input.profile?.horizon),
    signals: buildSignals(intent),
    filters: buildFilters(intent, input.profile),
    sort: { field: "yield_pct", direction: "desc" },
    limit: 50,
  }
}

const resolveGoldenPath = (path: TableSpecGoldenPath): TableSpec => {
  return getTableSpecTemplate(path)
}

const applyOverrides = (spec: TableSpec, overrides?: Partial<TableSpec>): TableSpec => {
  if (!overrides) return spec
  return {
    ...spec,
    ...overrides,
    scope: {
      ...spec.scope,
      ...overrides.scope,
    },
    time_range: {
      ...spec.time_range,
      ...overrides.time_range,
    },
  }
}

const ensureProvenance = (spec: TableSpec): TableSpec => {
  const reasoning = spec.reasoning?.trim().length
    ? spec.reasoning
    : `Intent mapped to TableSpec signals: ${spec.signals.join(", ")}.`
  const dataSource = spec.dataSource?.trim().length ? spec.dataSource : "L2 Derived"

  return {
    ...spec,
    reasoning,
    dataSource,
  }
}

export function compileTableSpec(input: TableSpecCompileInput): TableSpecCompilation {
  const warnings: string[] = []

  if (input.goldenPath) {
    const spec = ensureProvenance(applyOverrides(resolveGoldenPath(input.goldenPath), input.overrides))
    const parsed = tableSpecSchema.parse(spec)
    const validated = enforceTableSpec(parsed, input.entitlements)
    return { spec: validated, warnings, source: "golden_path" }
  }

  if (!input.intent) warnings.push("missing_intent")
  const spec = ensureProvenance(applyOverrides(createIntentSpec(input), input.overrides))
  const parsed = tableSpecSchema.parse(spec)
  const validated = enforceTableSpec(parsed, input.entitlements)
  return { spec: validated, warnings, source: "intent" }
}
