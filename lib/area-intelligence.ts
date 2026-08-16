export type AreaSignalSnapshot = {
  avg_price?: number | null
  avg_yield?: number | null
  efficiency?: number | null
  projects?: number | null
  area_type?: string | null
}

export type AreaBenchmarks = {
  medianPrice: number | null
  medianYield: number | null
  maxEfficiency: number | null
}

export type AreaPositionKey = "value-yield" | "premium-carry" | "accessible-soft" | "selective" | "balanced"
export type InventoryDepthKey = "deep" | "established" | "forming"

type LocalizedCopy = {
  label: string
  labelAr: string
  sentence: string
  sentenceAr: string
}

const AREA_TYPE_COPY: Record<string, { en: string; ar: string }> = {
  "city-core": { en: "City core", ar: "قلب المدينة" },
  community: { en: "Community", ar: "مجتمع سكني" },
  "growth-frontier": { en: "Growth frontier", ar: "جبهة نمو" },
  "mid-market": { en: "Mid-market", ar: "سوق متوسط" },
  "ultra-premium": { en: "Ultra-premium", ar: "فائق الفخامة" },
  waterfront: { en: "Waterfront", ar: "واجهة مائية" },
}

const POSITION_COPY: Record<AreaPositionKey, LocalizedCopy> = {
  "value-yield": {
    label: "Value yield",
    labelAr: "قيمة وعائد",
    sentence: "Below-market entry with above-market yield. Capital efficiency is visible here.",
    sentenceAr: "دخول أدنى من السوق مع عائد أعلى من السوق. الكفاءة الرأسمالية واضحة هنا.",
  },
  "premium-carry": {
    label: "Premium carry",
    labelAr: "فئة ممتازة بعائد",
    sentence: "Entry cost is above market, but yield still holds. Premium pricing is carrying.",
    sentenceAr: "تكلفة الدخول أعلى من السوق لكن العائد ما زال ثابتاً. التسعير الممتاز ما زال يحمل العائد.",
  },
  "accessible-soft": {
    label: "Accessible, softer carry",
    labelAr: "دخول أسهل بعائد أضعف",
    sentence: "Pricing is easier to enter, but yield trails the market. This needs selective screening.",
    sentenceAr: "التسعير أسهل للدخول لكن العائد أقل من السوق. هذا يحتاج انتقاءً أدق.",
  },
  selective: {
    label: "Selective capital",
    labelAr: "رأس مال انتقائي",
    sentence: "Higher capital entry with softer yield. Location alone is not enough here.",
    sentenceAr: "دخول رأسمالي أعلى مع عائد أضعف. الموقع وحده لا يكفي هنا.",
  },
  balanced: {
    label: "Balanced market",
    labelAr: "سوق متوازن",
    sentence: "Price and yield are close to the market median. The edge depends on project selection.",
    sentenceAr: "السعر والعائد قريبان من وسيط السوق. الأفضلية هنا تعتمد على اختيار المشروع.",
  },
}

const INVENTORY_DEPTH_COPY: Record<InventoryDepthKey, { en: string; ar: string }> = {
  deep: { en: "Deep inventory", ar: "مخزون عميق" },
  established: { en: "Established coverage", ar: "تغطية مستقرة" },
  forming: { en: "Early coverage", ar: "تغطية أولية" },
}

export function computeMedian(values: Array<number | null | undefined>) {
  const sorted = values
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .sort((left, right) => left - right)

  if (sorted.length === 0) return null

  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[middle] ?? null

  const left = sorted[middle - 1]
  const right = sorted[middle]
  if (left === undefined || right === undefined) return sorted[middle] ?? null
  return (left + right) / 2
}

export function normalizeAreaType(areaType: string | null | undefined) {
  if (typeof areaType !== "string") return null
  const normalized = areaType.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

export function getAreaTypeLabel(areaType: string | null | undefined, locale?: string | null) {
  const normalized = normalizeAreaType(areaType)
  if (!normalized) return null
  const copy = AREA_TYPE_COPY[normalized]
  if (!copy) return normalized.replace(/-/g, " ")
  return locale === "ar" ? copy.ar : copy.en
}

export function getAreaPosition(snapshot: AreaSignalSnapshot, benchmarks: AreaBenchmarks): AreaPositionKey {
  const avgPrice = snapshot.avg_price ?? null
  const avgYield = snapshot.avg_yield ?? null
  const medianPrice = benchmarks.medianPrice
  const medianYield = benchmarks.medianYield

  if (
    avgPrice === null ||
    avgYield === null ||
    medianPrice === null ||
    medianYield === null ||
    !Number.isFinite(avgPrice) ||
    !Number.isFinite(avgYield)
  ) {
    return "balanced"
  }

  const belowMedianPrice = avgPrice <= medianPrice
  const aboveMedianYield = avgYield >= medianYield

  if (belowMedianPrice && aboveMedianYield) return "value-yield"
  if (!belowMedianPrice && aboveMedianYield) return "premium-carry"
  if (belowMedianPrice && !aboveMedianYield) return "accessible-soft"
  if (avgPrice >= medianPrice * 1.2 && avgYield <= medianYield * 0.96) return "selective"
  return "balanced"
}

export function getAreaPositionLabel(
  snapshot: AreaSignalSnapshot,
  benchmarks: AreaBenchmarks,
  locale?: string | null,
) {
  const key = getAreaPosition(snapshot, benchmarks)
  const copy = POSITION_COPY[key]
  return locale === "ar" ? copy.labelAr : copy.label
}

export function getAreaNarrative(
  snapshot: AreaSignalSnapshot,
  benchmarks: AreaBenchmarks,
  locale?: string | null,
) {
  const key = getAreaPosition(snapshot, benchmarks)
  const copy = POSITION_COPY[key]
  return locale === "ar" ? copy.sentenceAr : copy.sentence
}

export function getInventoryDepth(projects: number | null | undefined): InventoryDepthKey {
  if (typeof projects !== "number" || !Number.isFinite(projects)) return "forming"
  if (projects >= 50) return "deep"
  if (projects >= 12) return "established"
  return "forming"
}

export function getInventoryDepthLabel(projects: number | null | undefined, locale?: string | null) {
  const copy = INVENTORY_DEPTH_COPY[getInventoryDepth(projects)]
  return locale === "ar" ? copy.ar : copy.en
}

export function getEfficiencyWidth(
  efficiency: number | null | undefined,
  maxEfficiency: number | null | undefined,
) {
  if (
    typeof efficiency !== "number" ||
    !Number.isFinite(efficiency) ||
    typeof maxEfficiency !== "number" ||
    !Number.isFinite(maxEfficiency) ||
    maxEfficiency <= 0
  ) {
    return 0
  }

  return Math.max(10, Math.min((efficiency / maxEfficiency) * 100, 100))
}

