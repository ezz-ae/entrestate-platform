export type TrustCategory = "verified" | "derived" | "estimated" | "inferred" | "demo"

export type TrustCategoryCopy = {
  en: { label: string; tone: string }
  ar: { label: string; tone: string }
}

export const TRUST_CATEGORY_COPY: Record<TrustCategory, TrustCategoryCopy> = {
  verified: {
    en: { label: "Verified", tone: "Source row exists and can be inspected" },
    ar: { label: "موثّق", tone: "السجل المصدر موجود وقابل للتدقيق" },
  },
  derived: {
    en: { label: "Derived", tone: "Calculated from verified or structured inputs" },
    ar: { label: "مشتق", tone: "محسوب من مدخلات موثّقة أو منظمة" },
  },
  estimated: {
    en: { label: "Estimated", tone: "Produced by a model or fallback" },
    ar: { label: "مقدَّر", tone: "ناتج عن نموذج أو احتساب احتياطي" },
  },
  inferred: {
    en: { label: "Inferred", tone: "Reasoned from indirect signals" },
    ar: { label: "مستنتَج", tone: "مستنبط من إشارات غير مباشرة" },
  },
  demo: {
    en: { label: "Demo / Sample", tone: "Present for product demonstration only" },
    ar: { label: "نموذج / عينة", tone: "للعرض المنتجي فقط" },
  },
}

export function getTrustCopy(category: TrustCategory, locale: string | null | undefined) {
  const isArabic = locale === "ar" || (typeof locale === "string" && locale.startsWith("ar-"))
  return isArabic ? TRUST_CATEGORY_COPY[category].ar : TRUST_CATEGORY_COPY[category].en
}

export function categoryFromEvidenceLevel(level: string | null | undefined): TrustCategory {
  const value = (level ?? "").toUpperCase()
  if (value.startsWith("L1")) return "verified"
  if (value.startsWith("L2")) return "derived"
  if (value.startsWith("L3")) return "estimated"
  if (value.startsWith("L4")) return "inferred"
  if (value.startsWith("L5")) return "demo"
  return "estimated"
}
