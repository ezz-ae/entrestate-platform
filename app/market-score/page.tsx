"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ExplainWithChat } from "@/components/explain-with-chat"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { useIsAdmin } from "@/lib/auth/client"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Download,
  Filter,
  ShieldCheck,
  SlidersHorizontal,
  Copy,
  Maximize2,
  X,
} from "lucide-react"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { pickLocalizedText } from "@/lib/format/entities"
import { getDateLocale, getNumberLocale } from "@/lib/format/locale"
import type {
  MarketScoreCharts,
  MarketScoreInventoryResponse,
  MarketScoreSummary,
  OverrideDisclosure,
  SystemHealthcheckRow,
  TruthChecks,
} from "@/lib/market-score/types"

const RISK_PROFILES = [
  { value: "Conservative", en: "Conservative", ar: "محافظ" },
  { value: "Balanced", en: "Balanced", ar: "متوازن" },
  { value: "Aggressive", en: "Aggressive", ar: "هجومي" },
]
const HORIZON_OPTIONS = [
  { value: "Ready", en: "Ready", ar: "جاهز" },
  { value: "6-12mo", en: "6-12mo", ar: "6-12 أشهر" },
  { value: "1-2yr", en: "1-2yr", ar: "1-2 سنة" },
  { value: "2-4yr", en: "2-4yr", ar: "2-4 سنوات" },
  { value: "4yr+", en: "4yr+", ar: "4 سنوات +" },
]
const INTENT_OPTIONS = [
  { value: "invest", en: "Invest", ar: "استثمار" },
  { value: "live", en: "Live", ar: "سكن" },
  { value: "rent", en: "Rent", ar: "تأجير" },
]

const CITY_LABELS: Record<string, string> = {
  dubai: "دبي",
  "abu dhabi": "أبوظبي",
  sharjah: "الشارقة",
  ajman: "عجمان",
  fujairah: "الفجيرة",
  "ras al khaimah": "رأس الخيمة",
  "umm al quwain": "أم القيوين",
  "al ain": "العين",
}

const formatStatusBand = (value?: string | null, locale: AppLocale = "en") => {
  if (!value) return "—"
  const normalized = value.toLowerCase()
  if (normalized.includes("completed")) return locale === "ar" ? "جاهز أو مكتمل" : "Completed / ready"
  if (normalized.includes("handover2025") || normalized === "2025") return locale === "ar" ? "تسليم 2025" : "2025 delivery"
  if (normalized.includes("handover2026") || normalized === "2026") return locale === "ar" ? "تسليم 2026" : "2026 delivery"
  if (normalized.includes("handover2027") || normalized === "2027") return locale === "ar" ? "تسليم 2027" : "2027 delivery"
  if (normalized.includes("handover2028_29") || normalized.includes("2028") || normalized.includes("2029")) {
    return locale === "ar" ? "تسليم 2028-29" : "2028-29 delivery"
  }
  if (normalized.includes("handover2030plus") || normalized.includes("2030")) {
    return locale === "ar" ? "تسليم 2030+" : "2030+ delivery"
  }
  return value
}

function localizeCityName(value: string | null | undefined, locale: AppLocale) {
  if (!value) return "—"
  if (locale !== "ar") return value

  return CITY_LABELS[value.trim().toLowerCase()] ?? value
}

function toggleValue(list: string[], value: string) {
  if (list.includes(value)) {
    return list.filter((item) => item !== value)
  }
  return [...list, value]
}

export default function MarketScorePage() {
  const [summary, setSummary] = useState<MarketScoreSummary | null>(null)
  const [charts, setCharts] = useState<MarketScoreCharts | null>(null)
  const [inventory, setInventory] = useState<MarketScoreInventoryResponse | null>(null)
  const [healthcheck, setHealthcheck] = useState<SystemHealthcheckRow | null>(null)
  const [truthChecks, setTruthChecks] = useState<TruthChecks | null>(null)
  const [tableLoading, setTableLoading] = useState(false)
  const [showInventory, setShowInventory] = useState(false)

  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [selectedStatusBands, setSelectedStatusBands] = useState<string[]>([])
  const [selectedPriceTiers, setSelectedPriceTiers] = useState<string[]>([])
  const [selectedSafetyBands, setSelectedSafetyBands] = useState<string[]>([])
  const [riskProfile, setRiskProfile] = useState<string>("")
  const [horizon, setHorizon] = useState<string>("")
  const [useRanked, setUseRanked] = useState(false)
  const [budgetAed, setBudgetAed] = useState("")
  const [preferredArea, setPreferredArea] = useState("")
  const [bedsPref, setBedsPref] = useState("")
  const [intent, setIntent] = useState<string>("")

  const [override2030, setOverride2030] = useState(false)
  const [overrideSpeculative, setOverrideSpeculative] = useState(false)
  const [overrideReason, setOverrideReason] = useState("")
  const [overrideAssetId, setOverrideAssetId] = useState("")
  const [overrideDisclosure, setOverrideDisclosure] = useState<OverrideDisclosure | null>(null)
  const [overrideActive, setOverrideActive] = useState(false)
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [disclosureLoading, setDisclosureLoading] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showAdminOverride, setShowAdminOverride] = useState(false)
  const [expandedChart, setExpandedChart] = useState<null | "safety" | "status" | "safetyBand" | "priceTier" | "city">(null)

  const [page, setPage] = useState(1)
  const pageSize = 20
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [compareLeft, setCompareLeft] = useState("")
  const [compareRight, setCompareRight] = useState("")
  const [compareResult, setCompareResult] = useState<{ left: MarketScoreSummary; right: MarketScoreSummary } | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)

  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const numberLocale = getNumberLocale(locale)
  const dateLocale = getDateLocale(locale)
  const { isAdmin } = useIsAdmin()

  const copy = isArabic
    ? {
        eyebrow: "قراءة المشروع",
        heroTitle: "اقرأ مستوى الأمان قبل أن تدخل أي مشروع.",
        heroBody: "هنا ترى درجة المشروع، فئة الأمان، وتوقيت الدخول المناسب، بلغة واضحة وبالأرقام.",
        explainPrompt: "اشرح لي كيف أقرأ صفحة قراءة المشروع وفئات الأمان وكيف أستخدمها في التصفية.",
        lastHealthcheck: "آخر فحص للنظام",
        noHealthcheck: "لا توجد قراءة تشغيلية بعد",
        passing: "ناجح",
        projectsScored: "مشاريع مفحوصة",
        safetyMix: "توزيع الأمان",
        buyerFitMix: "أنماط الملاءمة",
        overallQuality: "متوسط الجودة",
        breakdowns: "تفصيل الأمان والتسليم يظهر في الرسوم أدناه.",
        conservativeReady: "محافظ · جاهز الآن",
        cautiousMatches: "أنسب ما يظهر للمشتري المحافظ",
        balancedShort: "متوازن · خلال سنة إلى سنتين",
        balancedMatches: "أنسب ما يظهر للمشتري المتوازن",
        findProjects: "ابحث عن مشروع",
        hideExtraFilters: "إخفاء التوسعات",
        moreFilters: "تفاصيل أكثر",
        stepOne: "الخطوة 1 · أسلوب الشراء",
        stepOneHint: "اختر درجة التحفظ المناسبة.",
        stepTwo: "الخطوة 2 · موعد التسليم",
        stepThree: "الخطوة 3 · النطاق المكاني",
        stepThreeHint: "يمكنك تضييق النتائج حسب المدينة.",
        areas: "المناطق",
        selectCityFirst: "اختر مدينة أولًا لتظهر المناطق.",
        deliveryTiming: "موعد التسليم",
        safetyGroup: "فئة الأمان",
        budgetBand: "الشريحة السعرية",
        clientMatchTitle: "مطابقة مع عميلك",
        clientMatchButton: "فعّل المطابقة",
        clientMatchOn: "المطابقة مفعلة",
        clientMatchHint: "أضف الميزانية ليبدأ ترتيب الترشيحات.",
        budgetPlaceholder: "الميزانية بالدرهم",
        preferredAreaPlaceholder: "المنطقة المفضلة",
        bedsPlaceholder: "عدد الغرف أو النوع",
        addBudgetHint: "أدخل الميزانية لتفعيل المطابقة.",
        profileHint: "اختر أسلوب المستثمر والإطار الزمني أولًا.",
        powerOverride: "استثناء تشغيلي",
        open: "فتح",
        hide: "إخفاء",
        allow2030: "السماح بمشاريع تسليم 2030+",
        allowSpeculative: "السماح بفئة أمان عالية المخاطرة",
        disclosureAssetPlaceholder: "رقم الأصل لمعاينة الإفصاح",
        disclosureReasonPlaceholder: "اشرح سبب هذا الاستثناء",
        previewing: "جارٍ تجهيز المعاينة...",
        previewDisclosure: "معاينة الإفصاح",
        logging: "جارٍ التسجيل...",
        submitOverride: "تسجيل الاستثناء",
        overrideActive: "الاستثناء مفعّل",
        overrideInactive: "لن يُفعّل الاستثناء قبل تسجيله.",
        overrideDisclosure: "إفصاح الاستثناء",
        zoom: "تكبير",
        compareTitle: "قارن بين منطقتين",
        compareBody: "شاهد الأمان ومتوسط الدرجة جنبًا إلى جنب قبل القرار.",
        swap: "بدّل",
        areaA: "المنطقة الأولى",
        areaB: "المنطقة الثانية",
        selectArea: "اختر منطقة",
        comparing: "جارٍ المقارنة...",
        compare: "قارن",
        compareHint: "اختر منطقتين لتقرأ الجودة وتوزيع الأمان بينهما.",
        area: "المنطقة",
        assets: "المشاريع",
        averageScore: "متوسط الدرجة",
        topSafetyBand: "أعلى فئة أمان",
        classificationLeader: "أعلى فئة ملاءمة",
        continueComparison: "يمكنك متابعة المقارنة بأسئلة موجّهة داخل المستكشف.",
        openInExplorer: "افتح في المستكشف",
        projectList: "قائمة المشاريع",
        matchedRecommendations: "ترشيحات مرتبة بحسب بيانات العميل التي أدخلتها.",
        openListHint: "افتح القائمة بعد تضييق النتائج.",
        hideList: "أخفِ القائمة",
        showList: "أظهر القائمة",
        exportCsv: "تصدير CSV",
        loadingProjects: "جارٍ تحميل المشاريع...",
        noProjects: "لا توجد مشاريع تطابق الفلاتر الحالية.",
        evidenceTags: "إشارات داعمة",
        riskNotes: "ملاحظات المخاطر",
        whyScored: "لماذا أخذ هذه النتيجة",
        copySummary: "انسخ ملخص واتساب",
        projectCount: "مشروع",
        page: "الصفحة",
        of: "من",
        previous: "السابق",
        next: "التالي",
        openListPrompt: "استخدم الفلاتر بالأعلى ثم افتح القائمة عندما تريد مراجعة كل مشروع.",
        validationChecks: "فحوص التحقق",
        conservativeReadyShort: "محافظ · جاهز",
        balancedShortLabel: "متوازن · 1-2 سنة",
        timingCheck: "فحص التوقيت",
        noViolations: "لا توجد مخالفات",
        violations: "مخالفات",
        speculativeCheck: "فحص المضاربة",
        noneDetected: "لا شيء ظاهر",
        flagged: "حالات",
        chartFocus: "تركيز الرسم",
        closeChart: "إغلاق الرسم",
        chartLoading: "جارٍ تحميل الرسم.",
        none: "لا شيء ظاهر",
      }
    : {
        eyebrow: "Market Score",
        heroTitle: "See which projects are safe, steady, or high-risk.",
        heroBody: "Use this page to read the score, the safety group, and the best-fit timing for each project. Everything is plain language with evidence visible.",
        explainPrompt: "Explain Market Score, safety bands, and how to use this page.",
        lastHealthcheck: "Last healthcheck",
        noHealthcheck: "No healthcheck data yet",
        passing: "passing",
        projectsScored: "Projects scored",
        safetyMix: "Safety mix",
        buyerFitMix: "Buyer fit mix",
        overallQuality: "Overall quality score",
        breakdowns: "Delivery and safety breakdowns below.",
        conservativeReady: "Conservative buyers · Ready now",
        cautiousMatches: "Matches for cautious buyers",
        balancedShort: "Balanced buyers · 1-2 years",
        balancedMatches: "Matches for balanced buyers",
        findProjects: "Find projects",
        hideExtraFilters: "Hide extra filters",
        moreFilters: "More filters",
        stepOne: "Step 1 · Buyer profile",
        stepOneHint: "Pick how cautious the buyer is.",
        stepTwo: "Step 2 · Delivery window",
        stepThree: "Step 3 · Location focus",
        stepThreeHint: "Optional: narrow by city.",
        areas: "Areas",
        selectCityFirst: "Select a city to show areas.",
        deliveryTiming: "Delivery timing",
        safetyGroup: "Safety group",
        budgetBand: "Budget band",
        clientMatchTitle: "Match to a client (optional)",
        clientMatchButton: "Match to a client",
        clientMatchOn: "Client match on",
        clientMatchHint: "Add a budget to sort recommendations.",
        budgetPlaceholder: "Budget AED",
        preferredAreaPlaceholder: "Preferred area",
        bedsPlaceholder: "Beds (Studio, 1BR...)",
        addBudgetHint: "Add a budget to activate client matching.",
        profileHint: "Select an investor profile and timeframe to match a client.",
        powerOverride: "Power user override",
        open: "Open",
        hide: "Hide",
        allow2030: "Allow 2030+ delivery assets",
        allowSpeculative: "Allow speculative safety band",
        disclosureAssetPlaceholder: "Asset ID for disclosure preview",
        disclosureReasonPlaceholder: "Required: why this override is needed",
        previewing: "Previewing...",
        previewDisclosure: "Preview disclosure",
        logging: "Logging...",
        submitOverride: "Submit override",
        overrideActive: "Override active",
        overrideInactive: "Override not active until logged.",
        overrideDisclosure: "Override disclosure",
        zoom: "Zoom",
        compareTitle: "Compare two areas",
        compareBody: "See safety mix and average score side by side before you decide.",
        swap: "Swap",
        areaA: "Area A",
        areaB: "Area B",
        selectArea: "Select an area",
        comparing: "Comparing...",
        compare: "Compare",
        compareHint: "Select two areas to compare market quality and safety mix.",
        area: "Area",
        assets: "Assets",
        averageScore: "Average score",
        topSafetyBand: "Top safety band",
        classificationLeader: "Classification leader",
        continueComparison: "Continue the comparison with guided requests inside Explorer.",
        openInExplorer: "Open in Explorer",
        projectList: "Project list",
        matchedRecommendations: "Client-matched recommendations based on the details you shared.",
        openListHint: "Open the detailed list after you narrow the filters.",
        hideList: "Hide list",
        showList: "Show list",
        exportCsv: "Export CSV",
        loadingProjects: "Loading projects...",
        noProjects: "No projects match the current filters.",
        evidenceTags: "Evidence tags",
        riskNotes: "Risk notes",
        whyScored: "Why it scored this way",
        copySummary: "Copy WhatsApp summary",
        projectCount: "projects",
        page: "Page",
        of: "of",
        previous: "Previous",
        next: "Next",
        openListPrompt: "Use the filters above, then open the list when you want to review every project.",
        validationChecks: "Validation checks",
        conservativeReadyShort: "Conservative · Ready",
        balancedShortLabel: "Balanced · 1-2yr",
        timingCheck: "Timing check",
        noViolations: "No violations",
        violations: "violations",
        speculativeCheck: "Speculative check",
        noneDetected: "None detected",
        flagged: "flagged",
        chartFocus: "Chart focus",
        closeChart: "Close chart",
        chartLoading: "Chart data is loading.",
        none: "None",
      }

  const riskProfiles = RISK_PROFILES.map((item) => ({ value: item.value, label: isArabic ? item.ar : item.en }))
  const horizonOptions = HORIZON_OPTIONS.map((item) => ({ value: item.value, label: isArabic ? item.ar : item.en }))
  const intentOptions = INTENT_OPTIONS.map((item) => ({ value: item.value, label: isArabic ? item.ar : item.en }))
  const presets = isArabic
    ? [
        { label: "محافظ · جاهز الآن", profile: "Conservative", window: "Ready" },
        { label: "متوازن · سنة إلى سنتين", profile: "Balanced", window: "1-2yr" },
        { label: "هجومي · سنتان إلى أربع", profile: "Aggressive", window: "2-4yr" },
      ]
    : [
        { label: "Conservative · Ready now", profile: "Conservative", window: "Ready" },
        { label: "Balanced · 1-2 years", profile: "Balanced", window: "1-2yr" },
        { label: "Aggressive · 2-4 years", profile: "Aggressive", window: "2-4yr" },
      ]

  const isRankedReady = useRanked && Boolean(budgetAed) && Boolean(riskProfile) && Boolean(horizon)
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    selectedCities.forEach((city) => params.append("city", city))
    selectedAreas.forEach((area) => params.append("area", area))
    selectedStatusBands.forEach((band) => params.append("status_band", band))
    selectedPriceTiers.forEach((tier) => params.append("price_tier", tier))
    selectedSafetyBands.forEach((band) => params.append("safety_band", band))
    if (riskProfile) params.set("risk_profile", riskProfile)
    if (horizon) params.set("horizon", horizon)
    if (isRankedReady) params.set("ranked", "true")
    if (useRanked && budgetAed) params.set("budget_aed", budgetAed)
    if (useRanked && preferredArea) params.set("preferred_area", preferredArea)
    if (useRanked && bedsPref) params.set("beds_pref", bedsPref)
    if (useRanked && intent) params.set("intent", intent)
    if (overrideActive && override2030) params.set("override_2030", "true")
    if (overrideActive && overrideSpeculative) params.set("override_speculative", "true")
    return params
  }, [
    selectedCities,
    selectedAreas,
    selectedStatusBands,
    selectedPriceTiers,
    selectedSafetyBands,
    riskProfile,
    horizon,
    useRanked,
    budgetAed,
    preferredArea,
    bedsPref,
    intent,
    overrideActive,
    override2030,
    overrideSpeculative,
    isRankedReady,
  ])

  const availableAreas = summary?.available.areas ?? []
  const compareQuery = compareLeft && compareRight ? `${compareLeft}|${compareRight}` : ""
  const qualityNarrative = useMemo(() => {
    if (!summary) return null
    const score = summary.avgScore
    const dist = summary.safetyDistribution ?? []
    const top = [...dist].sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))[0]
    const bandLabel = top ? String(top.label) : null
    const bandShare = top ? Math.round(top.percent ?? 0) : 0
    const threshold = score >= 65 ? "above" : score >= 50 ? "near" : "below"
    if (isArabic) {
      const thresholdCopy = threshold === "above" ? "فوق أرضية الثقة" : threshold === "near" ? "قرب خط المراقبة" : "دون خط المراقبة"
      if (bandLabel && bandShare > 0) {
        return `${thresholdCopy} — مدفوع بأن ${bandShare}٪ من المعروض ضمن فئة ${bandLabel}.`
      }
      return thresholdCopy
    }
    const thresholdCopy = threshold === "above" ? "Above confidence floor" : threshold === "near" ? "Near watch line" : "Below watch line"
    if (bandLabel && bandShare > 0) {
      return `${thresholdCopy} — driven by ${bandShare}% of inventory sitting in the ${bandLabel} band.`
    }
    return thresholdCopy
  }, [summary, isArabic])
  const chartDetails = isArabic ? {
    safety: {
      title: "توزيع الأمان",
      description: "كيف تتوزع المشاريع بين فئات الأمان المختلفة.",
    },
    status: {
      title: "متوسط الدرجة حسب التسليم",
      description: "مقارنة جودة المشاريع عبر مواعيد التسليم المختلفة.",
    },
    safetyBand: {
      title: "متوسط الدرجة حسب فئة الأمان",
      description: "يوضح قوة الدرجة داخل كل فئة أمان.",
    },
    priceTier: {
      title: "متوسط الدرجة حسب الشريحة السعرية",
      description: "مقارنة الجودة بين الشرائح السعرية المتاحة.",
    },
    city: {
      title: "المشاريع حسب المدينة",
      description: "توزيع المشاريع المفحوصة بين المدن الرئيسية.",
    },
  } : {
    safety: {
      title: "Safety mix",
      description: "Shows how inventory splits across safety bands.",
    },
    status: {
      title: "Average score by delivery band",
      description: "Compare score quality across delivery timelines.",
    },
    safetyBand: {
      title: "Average score by safety band",
      description: "Highlights score strength within each safety band.",
    },
    priceTier: {
      title: "Average score by price tier",
      description: "Compare quality across pricing tiers when available.",
    },
    city: {
      title: "Assets by city",
      description: "Distribution of scored assets across major cities.",
    },
  }

  const getTopDistributionLabel = (rows: { label: string; count: number }[] = []) => {
    if (rows.length === 0) return "—"
    return rows.reduce((max, row) => (row.count > max.count ? row : max), rows[0]).label
  }

  const applyPreset = (profile: string, window: string) => {
    setRiskProfile(profile)
    setHorizon(window)
    setShowAdvancedFilters(false)
  }

  const handleSwapCompare = () => {
    setCompareLeft(compareRight)
    setCompareRight(compareLeft)
    setCompareResult(null)
    setCompareError(null)
  }

  const handleCompare = async () => {
    if (!compareLeft || !compareRight) return
    setCompareLoading(true)
    setCompareError(null)
    setCompareResult(null)
    try {
      const leftParams = new URLSearchParams({ area: compareLeft })
      const rightParams = new URLSearchParams({ area: compareRight })
      const [leftRes, rightRes] = await Promise.all([
        fetch(`/api/market-score/summary?${leftParams.toString()}`),
        fetch(`/api/market-score/summary?${rightParams.toString()}`),
      ])
      if (!leftRes.ok || !rightRes.ok) throw new Error("Comparison failed")
      const [leftData, rightData] = await Promise.all([leftRes.json(), rightRes.json()])
      setCompareResult({ left: leftData, right: rightData })
    } catch (error) {
      console.error("Compare error:", error)
      setCompareError(isArabic ? "تعذّرت المقارنة الآن. جرّب مرة أخرى بعد قليل." : "Unable to compare those areas right now.")
    } finally {
      setCompareLoading(false)
    }
  }

  useEffect(() => {
    if (availableAreas.length === 0) return
    setSelectedAreas((current) => current.filter((area) => availableAreas.includes(area)))
  }, [availableAreas])

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const [summaryRes, chartsRes] = await Promise.all([
          fetch(`/api/market-score/summary?${queryParams.toString()}`),
          fetch(`/api/market-score/charts?${queryParams.toString()}`),
        ])
        if (!summaryRes.ok || !chartsRes.ok) throw new Error("Summary fetch failed")
        const summaryData = await summaryRes.json()
        const chartsData = await chartsRes.json()
        setSummary(summaryData)
        setCharts(chartsData)
      } catch (error) {
        console.error("Market score summary error:", error)
      }
    }

    fetchSummary()
  }, [queryParams])

  useEffect(() => {
    const fetchHealthcheck = async () => {
      try {
        const res = await fetch("/api/market-score/healthcheck")
        if (!res.ok) throw new Error("Healthcheck failed")
        const data = await res.json()
        setHealthcheck(data.healthcheck || null)
      } catch (error) {
        console.error("Healthcheck error:", error)
      }
    }

    fetchHealthcheck()
  }, [])

  useEffect(() => {
    const fetchTruthChecks = async () => {
      try {
        const res = await fetch("/api/market-score/truth-checks")
        if (!res.ok) throw new Error("Truth checks failed")
        const data = await res.json()
        setTruthChecks(data)
      } catch (error) {
        console.error("Truth checks error:", error)
      }
    }

    fetchTruthChecks()
  }, [])

  useEffect(() => {
    const fetchInventory = async () => {
      if (!showInventory) {
        setTableLoading(false)
        return
      }
      setTableLoading(true)
      try {
        const params = new URLSearchParams(queryParams)
        params.set("page", page.toString())
        params.set("pageSize", pageSize.toString())
        const res = await fetch(`/api/market-score/inventory?${params.toString()}`)
        if (!res.ok) throw new Error("Inventory fetch failed")
        const data = await res.json()
        setInventory(data)
      } catch (error) {
        console.error("Market score inventory error:", error)
      } finally {
        setTableLoading(false)
      }
    }

    fetchInventory()
  }, [queryParams, page, showInventory])

  useEffect(() => {
    setPage(1)
  }, [queryParams])

  const renderExpandedChart = () => {
    if (!expandedChart) return null
    if (!charts) {
      return <div className="text-sm text-muted-foreground">{copy.chartLoading}</div>
    }

    switch (expandedChart) {
      case "safety":
        return (
          <ChartContainer
            config={{
              count: { label: copy.assets, color: "hsl(var(--chart-1))" },
            }}
            className="h-[360px]"
          >
            <BarChart data={charts?.safetyDistribution ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickFormatter={(value) => localizeCityName(String(value), locale)} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} labelFormatter={(value) => localizeCityName(String(value), locale)} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )
      case "status":
        return (
          <ChartContainer
            config={{
              avgScore: { label: isArabic ? "النتيجة" : "Score", color: "hsl(var(--chart-2))" },
            }}
            className="h-[360px]"
          >
            <BarChart data={charts?.avgScoreByStatus ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickFormatter={(value) => formatStatusBand(String(value), locale)} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} labelFormatter={(value) => formatStatusBand(String(value), locale)} />
              <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )
      case "safetyBand":
        return (
          <ChartContainer
            config={{
              avgScore: { label: isArabic ? "النتيجة" : "Score", color: "hsl(var(--chart-3))" },
            }}
            className="h-[360px]"
          >
            <BarChart data={charts?.avgScoreBySafetyBand ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )
      case "priceTier":
        return (
          <ChartContainer
            config={{
              avgScore: { label: isArabic ? "النتيجة" : "Score", color: "hsl(var(--chart-4))" },
            }}
            className="h-[360px]"
          >
            <BarChart data={charts?.avgScoreByPriceTier ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )
      case "city":
        return (
          <ChartContainer
            config={{
              count: { label: copy.assets, color: "hsl(var(--chart-5))" },
            }}
            className="h-[360px]"
          >
            <BarChart data={charts?.countByCity ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )
      default:
        return null
    }
  }

  const handleOverrideLog = async () => {
    if (!overrideReason.trim() || !overrideAssetId) return
    setOverrideLoading(true)
    try {
      const res = await fetch("/api/market-score/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          risk_profile: riskProfile || undefined,
          horizon: horizon || undefined,
          override_flags: {
            allow_2030_plus: override2030,
            allow_speculative: overrideSpeculative,
          },
          reason: overrideReason,
          selected_asset_id: overrideAssetId,
        }),
      })
      if (!res.ok) throw new Error("Override log failed")
      const data = await res.json()
      setOverrideDisclosure(data.disclosure || null)
      setOverrideActive(true)
    } catch (error) {
      console.error("Override audit error:", error)
    } finally {
      setOverrideLoading(false)
    }
  }

  const handleOverrideToggle = (setter: (value: boolean) => void, value: boolean) => {
    setter(value)
    setOverrideActive(false)
  }

  const handleDisclosurePreview = async () => {
    if (!overrideAssetId || !riskProfile) return
    setDisclosureLoading(true)
    try {
      const overrideType = override2030 && overrideSpeculative
        ? "allow_2030_plus_and_speculative"
        : override2030
          ? "allow_2030_plus"
          : overrideSpeculative
            ? "allow_speculative"
            : ""
      if (!overrideType) return
      const params = new URLSearchParams({
        asset_id: overrideAssetId,
        override_type: overrideType,
        profile: riskProfile,
      })
      const res = await fetch(`/api/market-score/override-disclosure?${params.toString()}`)
      if (!res.ok) throw new Error("Disclosure preview failed")
      const data = await res.json()
      setOverrideDisclosure(data.disclosure || null)
    } catch (error) {
      console.error("Disclosure preview error:", error)
    } finally {
      setDisclosureLoading(false)
    }
  }

  const buildWhatsAppSummary = (row: MarketScoreInventoryResponse["rows"][number]) => {
    const localizedArea = pickLocalizedText(locale, row.area_ar, row.area)
    const localizedCity = localizeCityName(row.city, locale)
    const location = [localizedArea, localizedCity].filter((value) => value && value !== "—").join("، ")

    if (isArabic) {
      const status = row.status_band ? `التسليم: ${formatStatusBand(row.status_band, locale)}` : "التسليم: غير متاح"
      const price = row.price_aed ? `السعر: AED ${row.price_aed.toLocaleString(numberLocale)}` : "السعر: غير متاح"
      const score = row.score_0_100 ? `النتيجة: ${row.score_0_100}` : "النتيجة: غير متاحة"
      const safety = row.safety_band ? `فئة الأمان: ${row.safety_band}` : "فئة الأمان: غير متاحة"
      return `${row.name || row.asset_id}\n${location || "الموقع غير متاح"}\n${status} · ${price}\n${score} · ${safety}`
    }

    const status = row.status_band ? `Status: ${formatStatusBand(row.status_band, locale)}` : "Status: Not available"
    const price = row.price_aed ? `Price: AED ${row.price_aed.toLocaleString(numberLocale)}` : "Price: Not available"
    const score = row.score_0_100 ? `Score: ${row.score_0_100}` : "Score: Not available"
    const safety = row.safety_band ? `Safety: ${row.safety_band}` : "Safety: Not available"
    return `Project ${row.name || row.asset_id} · ${location || "Location: Not available"}\n${status} · ${price}\n${score} · ${safety}`
  }

  const handleCopySummary = async (row: MarketScoreInventoryResponse["rows"][number]) => {
    const message = buildWhatsAppSummary(row)
    try {
      await navigator.clipboard.writeText(message)
    } catch (error) {
      console.error("Clipboard error:", error)
    }
  }

  const renderBadges = (values?: unknown) => {
    const list = Array.isArray(values) ? values : []
    if (list.length === 0) {
      return <span className="text-xs text-muted-foreground">{copy.none}</span>
    }
    return (
      <div className="flex flex-wrap gap-2">
        {list.map((item) => (
          <span
            key={String(item)}
            className="rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {String(item)}
          </span>
        ))}
      </div>
    )
  }

  const handleExport = async () => {
    const params = new URLSearchParams(queryParams)
    params.set("format", "csv")
    const res = await fetch(`/api/market-score/inventory?${params.toString()}`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "market-score-inventory.csv"
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  const totalPages = inventory ? Math.ceil(inventory.total / pageSize) : 1
  const showRankedColumns = isRankedReady
  const tableColumns = [
    isArabic ? "رقم المشروع" : "Project ID",
    isArabic ? "المشروع" : "Project",
    isArabic ? "المطور" : "Developer",
    isArabic ? "المدينة" : "City",
    isArabic ? "المنطقة" : "Area",
    isArabic ? "التسليم" : "Delivery",
    isArabic ? "السعر (AED)" : "Price (AED)",
    isArabic ? "الغرف" : "Beds",
    isArabic ? "النتيجة" : "Score",
    ...(showRankedColumns ? [isArabic ? "درجة المطابقة" : "Match score", isArabic ? "الأولوية" : "Priority"] : []),
    isArabic ? "فئة الأمان" : "Safety band",
    isArabic ? "ملاءمة المشتري" : "Buyer fit",
    isArabic ? "العائد" : "ROI band",
    isArabic ? "السيولة" : "Liquidity",
    isArabic ? "مخاطر التوقيت" : "Timing risk",
  ]

  return (
    <main id="main-content" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="mx-auto w-full max-w-[1440px] px-6">
          <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-slate-800/40 via-slate-900/50 to-slate-950/70 p-8 mb-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(720px_circle_at_20%_-20%,rgba(59,130,246,0.12),transparent_60%),radial-gradient(640px_circle_at_85%_0%,rgba(148,163,184,0.12),transparent_55%)]" />
            <div className="relative">
              <div className="max-w-3xl mb-10">
                <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">{copy.eyebrow}</p>
                <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
                  {copy.heroTitle}
                </h1>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  {copy.heroBody}
                </p>
                <div className="mt-5">
                  <ExplainWithChat prompt={copy.explainPrompt} />
                </div>
              </div>

              <section className="rounded-xl border border-border/60 bg-muted/40 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{copy.lastHealthcheck}</p>
                  <p className="text-sm text-foreground">
                    {healthcheck?.created_at
                      ? new Date(String(healthcheck.created_at)).toLocaleString(dateLocale)
                      : copy.noHealthcheck}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>
                    {healthcheck?.passing_count ?? "—"} / {healthcheck?.total_count ?? "—"} {copy.passing}
                  </span>
                </div>
              </section>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
            <div className="rounded-xl border border-border/70 bg-card/80 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{copy.projectsScored}</p>
              <p className="text-2xl font-semibold text-foreground">
                {summary?.totalAssets.toLocaleString(numberLocale) ?? "—"}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                <Database className="h-4 w-4" />
                {summary?.source === "routed"
                  ? isArabic
                    ? "مطابق للفلاتر التي اخترتها"
                    : "Matched to your filters"
                  : isArabic
                    ? "كامل المعروض"
                    : "Full inventory"}
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/40 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{copy.safetyMix}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                {(summary?.safetyDistribution ?? []).map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span>{row.label}</span>
                    <span className="font-medium text-foreground">
                      {row.count.toLocaleString(numberLocale)} · {row.percent ?? 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/40 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{copy.buyerFitMix}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                {(summary?.classificationDistribution ?? []).map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span>{row.label}</span>
                    <span className="font-medium text-foreground">
                      {row.count.toLocaleString(numberLocale)} · {row.percent ?? 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{copy.overallQuality}</p>
              <p className="text-2xl font-semibold text-foreground">
                {summary ? summary.avgScore.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {qualityNarrative ?? copy.breakdowns}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{copy.conservativeReady}</p>
              <p className="text-2xl font-semibold text-foreground">
                {summary?.conservativeReadyPool.toLocaleString(numberLocale) ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{copy.cautiousMatches}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{copy.balancedShort}</p>
              <p className="text-2xl font-semibold text-foreground">
                {summary?.balancedDefaultPool.toLocaleString(numberLocale) ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{copy.balancedMatches}</p>
            </div>
          </section>

          <section className="sticky top-[var(--app-header-height)] z-20 bg-background/95 backdrop-blur-xl border border-border/70 rounded-xl p-5 mb-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Filter className="h-4 w-4 text-accent" />
                {copy.findProjects}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
              >
                {showAdvancedFilters ? copy.hideExtraFilters : copy.moreFilters}
              </Button>
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.profile, preset.window)}
                  className="rounded-full border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.stepOne}</p>
                <div className="grid grid-cols-3 gap-2">
                  {riskProfiles.map((profile) => (
                    <button
                      key={profile.value}
                      type="button"
                      onClick={() => setRiskProfile(profile.value === riskProfile ? "" : profile.value)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        profile.value === riskProfile
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {profile.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{copy.stepOneHint}</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.stepTwo}</p>
                <div className="grid grid-cols-2 gap-2">
                  {horizonOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setHorizon(option.value === horizon ? "" : option.value)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        option.value === horizon
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.stepThree}</p>
                <div className="flex flex-wrap gap-2">
                  {(summary?.available.cities ?? []).map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCities((prev) => toggleValue(prev, city))}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        selectedCities.includes(city)
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {localizeCityName(city, locale)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{copy.stepThreeHint}</p>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.areas}</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pe-2">
                    {availableAreas.map((area) => (
                      <label key={area} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={selectedAreas.includes(area)}
                          onCheckedChange={() => setSelectedAreas((prev) => toggleValue(prev, area))}
                        />
                        {pickLocalizedText(locale, null, area)}
                      </label>
                    ))}
                    {availableAreas.length === 0 && (
                      <p className="text-xs text-muted-foreground">{copy.selectCityFirst}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.deliveryTiming}</p>
                  <div className="space-y-2">
                    {(summary?.available.statusBands ?? []).map((band) => (
                      <label key={band} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={selectedStatusBands.includes(band)}
                          onCheckedChange={() => setSelectedStatusBands((prev) => toggleValue(prev, band))}
                        />
                        {formatStatusBand(band, locale)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.safetyGroup}</p>
                  <div className="space-y-2">
                    {(summary?.available.safetyBands ?? []).map((band) => (
                      <label key={band} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={selectedSafetyBands.includes(band)}
                          onCheckedChange={() => setSelectedSafetyBands((prev) => toggleValue(prev, band))}
                        />
                        {band}
                      </label>
                    ))}
                  </div>
                </div>
                {summary?.available.priceTiers.length ? (
                  <div className="space-y-3 lg:col-span-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.budgetBand}</p>
                    <div className="flex flex-wrap gap-2">
                      {(summary?.available.priceTiers ?? []).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setSelectedPriceTiers((prev) => toggleValue(prev, tier))}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            selectedPriceTiers.includes(tier)
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-6 rounded-lg border border-border bg-card/60 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <SlidersHorizontal className="h-4 w-4 text-accent" />
                {copy.clientMatchTitle}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant={useRanked ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseRanked((prev) => !prev)}
                >
                  {useRanked ? copy.clientMatchOn : copy.clientMatchButton}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {copy.clientMatchHint}
                </span>
              </div>
              {useRanked && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <Input
                      value={budgetAed}
                      onChange={(event) => setBudgetAed(event.target.value)}
                      placeholder={copy.budgetPlaceholder}
                      type="number"
                      className="bg-background"
                    />
                    <Input
                      value={preferredArea}
                      onChange={(event) => setPreferredArea(event.target.value)}
                      placeholder={copy.preferredAreaPlaceholder}
                      className="bg-background"
                    />
                    <Input
                      value={bedsPref}
                      onChange={(event) => setBedsPref(event.target.value)}
                      placeholder={copy.bedsPlaceholder}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {intentOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setIntent(option.value === intent ? "" : option.value)}
                        className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                          option.value === intent
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {useRanked && !budgetAed && (
                <p className="text-xs text-amber-200 mt-3">
                  {copy.addBudgetHint}
                </p>
              )}
              {useRanked && (!riskProfile || !horizon) && (
                <p className="text-xs text-amber-200 mt-2">
                  {copy.profileHint}
                </p>
              )}
            </div>

            {isAdmin && (
              <div className="mt-6 rounded-lg border border-border bg-card/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <SlidersHorizontal className="h-4 w-4 text-accent" />
                    {copy.powerOverride}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdminOverride((prev) => !prev)}
                  >
                    {showAdminOverride ? copy.hide : copy.open}
                  </Button>
                </div>
                {showAdminOverride && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={override2030}
                          onCheckedChange={(value) => handleOverrideToggle(setOverride2030, Boolean(value))}
                        />
                        {copy.allow2030}
                      </label>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={overrideSpeculative}
                          onCheckedChange={(value) => handleOverrideToggle(setOverrideSpeculative, Boolean(value))}
                        />
                        {copy.allowSpeculative}
                      </label>
                    </div>
                    {(override2030 || overrideSpeculative) && (
                      <div className="mt-4 space-y-3">
                        <Input
                          value={overrideAssetId}
                          onChange={(event) => setOverrideAssetId(event.target.value)}
                          placeholder={copy.disclosureAssetPlaceholder}
                          className="bg-background"
                        />
                        <Textarea
                          value={overrideReason}
                          onChange={(event) => setOverrideReason(event.target.value)}
                          placeholder={copy.disclosureReasonPlaceholder}
                          className="min-h-[90px]"
                        />
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDisclosurePreview}
                            disabled={!overrideAssetId || !riskProfile || disclosureLoading}
                          >
                            {disclosureLoading ? copy.previewing : copy.previewDisclosure}
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleOverrideLog}
                            disabled={!overrideReason.trim() || !overrideAssetId || overrideLoading}
                          >
                            {overrideLoading ? copy.logging : copy.submitOverride}
                          </Button>
                          {overrideActive ? (
                            <span className="text-xs text-emerald-500">{copy.overrideActive}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{copy.overrideInactive}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {overrideDisclosure && (
              <div className="mt-4 rounded-lg border border-border bg-amber-500/10 p-4 text-sm text-amber-200">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {copy.overrideDisclosure}
                </div>
                <pre className="mt-2 text-xs text-amber-100 whitespace-pre-wrap break-words">
                  {JSON.stringify(overrideDisclosure, null, 2)}
                </pre>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-foreground">{chartDetails.safety.title}</p>
                <button
                  type="button"
                  onClick={() => setExpandedChart("safety")}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copy.zoom}
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{chartDetails.safety.description}</p>
              <ChartContainer
                config={{
                  count: { label: copy.assets, color: "hsl(var(--chart-1))" },
                }}
                className="h-[220px]"
              >
                <BarChart data={charts?.safetyDistribution ?? []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickFormatter={(value) => localizeCityName(String(value), locale)} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} labelFormatter={(value) => localizeCityName(String(value), locale)} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-foreground">{chartDetails.status.title}</p>
                <button
                  type="button"
                  onClick={() => setExpandedChart("status")}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copy.zoom}
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{chartDetails.status.description}</p>
              <ChartContainer
                config={{
                  avgScore: { label: isArabic ? "النتيجة" : "Score", color: "hsl(var(--chart-2))" },
                }}
                className="h-[220px]"
              >
                <BarChart data={charts?.avgScoreByStatus ?? []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickFormatter={(value) => formatStatusBand(String(value), locale)} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} labelFormatter={(value) => formatStatusBand(String(value), locale)} />
                  <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-foreground">{chartDetails.safetyBand.title}</p>
                <button
                  type="button"
                  onClick={() => setExpandedChart("safetyBand")}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copy.zoom}
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{chartDetails.safetyBand.description}</p>
              <ChartContainer
                config={{
                  avgScore: { label: isArabic ? "النتيجة" : "Score", color: "hsl(var(--chart-3))" },
                }}
                className="h-[220px]"
              >
                <BarChart data={charts?.avgScoreBySafetyBand ?? []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
            {charts?.avgScoreByPriceTier?.length ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-foreground">{chartDetails.priceTier.title}</p>
                  <button
                    type="button"
                    onClick={() => setExpandedChart("priceTier")}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copy.zoom}
                    <Maximize2 className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{chartDetails.priceTier.description}</p>
                <ChartContainer
                  config={{
                    avgScore: { label: isArabic ? "النتيجة" : "Score", color: "hsl(var(--chart-4))" },
                  }}
                  className="h-[220px]"
                >
                  <BarChart data={charts?.avgScoreByPriceTier ?? []}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : null}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-foreground">{chartDetails.city.title}</p>
                <button
                  type="button"
                  onClick={() => setExpandedChart("city")}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copy.zoom}
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{chartDetails.city.description}</p>
              <ChartContainer
                config={{
                  count: { label: copy.assets, color: "hsl(var(--chart-5))" },
                }}
                className="h-[220px]"
              >
                <BarChart data={charts?.countByCity ?? []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card/70 p-6 mb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-medium text-foreground">{copy.compareTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  {copy.compareBody}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSwapCompare} disabled={!compareLeft && !compareRight}>
                {copy.swap}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.areaA}</label>
                <select
                  value={compareLeft}
                  onChange={(event) => setCompareLeft(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">{copy.selectArea}</option>
                  {availableAreas.map((area) => (
                    <option key={area} value={area}>{pickLocalizedText(locale, null, area)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.areaB}</label>
                <select
                  value={compareRight}
                  onChange={(event) => setCompareRight(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">{copy.selectArea}</option>
                  {availableAreas.map((area) => (
                    <option key={area} value={area}>{pickLocalizedText(locale, null, area)}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleCompare}
                disabled={!compareLeft || !compareRight || compareLoading}
                className="h-10"
              >
                {compareLoading ? copy.comparing : copy.compare}
              </Button>
            </div>

            {compareError && (
              <div className="mt-4 text-sm text-amber-200">{compareError}</div>
            )}

            {!compareResult && !compareError && (
              <div className="mt-6 text-sm text-muted-foreground">
                {copy.compareHint}
              </div>
            )}

            {compareResult && (
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[{ label: compareLeft, data: compareResult.left }, { label: compareRight, data: compareResult.right }].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-background/60 p-5">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.area}</p>
                      <p className="text-lg font-semibold text-foreground mt-2">{pickLocalizedText(locale, null, item.label)}</p>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">{copy.assets}</p>
                          <p className="text-foreground font-medium">{item.data.totalAssets.toLocaleString(numberLocale)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{copy.averageScore}</p>
                          <p className="text-foreground font-medium">{item.data.avgScore.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{copy.topSafetyBand}</p>
                          <p className="text-foreground font-medium">
                            {getTopDistributionLabel(item.data.safetyDistribution)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{copy.classificationLeader}</p>
                          <p className="text-foreground font-medium">
                            {getTopDistributionLabel(item.data.classificationDistribution)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {compareQuery ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm">
                    <span className="text-muted-foreground">
                      {copy.continueComparison}
                    </span>
                    <Link
                      href={prefixLocalePath(`/markets?compare=${encodeURIComponent(compareQuery)}`, locale)}
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
                    >
                      {copy.openInExplorer}
                      <ArrowRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                    </Link>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6 mb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-medium text-foreground">{copy.projectList}</h2>
                <p className="text-sm text-muted-foreground">
                  {useRanked
                    ? copy.matchedRecommendations
                    : copy.openListHint}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInventory((prev) => !prev)}
                >
                  {showInventory ? copy.hideList : copy.showList}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={!showInventory}
                >
                  <Download className="h-4 w-4" />
                  {copy.exportCsv}
                </Button>
              </div>
            </div>

            {showInventory ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                        {tableColumns.map((label) => (
                          <th key={label} className="py-3 px-3 text-left whitespace-nowrap">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableLoading && (
                        <tr>
                          <td colSpan={tableColumns.length} className="py-6 text-center text-muted-foreground">
                            {copy.loadingProjects}
                          </td>
                        </tr>
                      )}
                      {!tableLoading && inventory?.rows.length === 0 && (
                        <tr>
                          <td colSpan={tableColumns.length} className="py-6 text-center text-muted-foreground">
                            {copy.noProjects}
                          </td>
                        </tr>
                      )}
                      {inventory?.rows.map((row) => {
                        const rowId = String(row.asset_id ?? row.name ?? "")
                        const isExpanded = Boolean(expandedRows[rowId])
                        return (
                          <Fragment key={rowId}>
                            <tr
                              className="border-b border-border/60 hover:bg-secondary/40 cursor-pointer"
                              onClick={() =>
                                setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }))
                              }
                            >
                              <td className="py-3 px-3 text-foreground">{row.asset_id}</td>
                              <td className="py-3 px-3 text-foreground">{row.name}</td>
                              <td className="py-3 px-3 text-muted-foreground">{pickLocalizedText(locale, row.developer_ar, row.developer)}</td>
                              <td className="py-3 px-3 text-muted-foreground">{localizeCityName(row.city, locale)}</td>
                              <td className="py-3 px-3 text-muted-foreground">{pickLocalizedText(locale, row.area_ar, row.area)}</td>
                              <td className="py-3 px-3 text-muted-foreground">
                                {formatStatusBand(row.status_band, locale)}
                              </td>
                              <td className="py-3 px-3 text-muted-foreground">
                                {row.price_aed ? row.price_aed.toLocaleString(numberLocale) : "—"}
                              </td>
                              <td className="py-3 px-3 text-muted-foreground">{row.beds ?? "—"}</td>
                              <td className="py-3 px-3 text-foreground">{row.score_0_100 ?? "—"}</td>
                              {showRankedColumns && (
                                <>
                                  <td className="py-3 px-3 text-muted-foreground">{row.match_score ?? "—"}</td>
                                  <td className="py-3 px-3 text-muted-foreground">{row.final_rank ?? "—"}</td>
                                </>
                              )}
                              <td className="py-3 px-3 text-muted-foreground">{row.safety_band}</td>
                              <td className="py-3 px-3 text-muted-foreground">{row.classification}</td>
                              <td className="py-3 px-3 text-muted-foreground">{row.roi_band}</td>
                              <td className="py-3 px-3 text-muted-foreground">{row.liquidity_band}</td>
                              <td className="py-3 px-3 text-muted-foreground">{row.timeline_risk_band}</td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-secondary/30 border-b border-border/60">
                                <td colSpan={tableColumns.length} className="px-4 py-4">
                                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 text-xs text-muted-foreground">
                                    <div className="rounded-lg border border-border bg-card/80 p-3">
                                      <p className="text-xs font-semibold text-foreground mb-2">{copy.evidenceTags}</p>
                                      {renderBadges(row.reason_codes)}
                                    </div>
                                    <div className="rounded-lg border border-border bg-card/80 p-3">
                                      <p className="text-xs font-semibold text-foreground mb-2">{copy.riskNotes}</p>
                                      {renderBadges(row.risk_flags)}
                                    </div>
                                    <div className="rounded-lg border border-border bg-card/80 p-3 lg:col-span-2">
                                      <p className="text-xs font-semibold text-foreground mb-2">{copy.whyScored}</p>
                                      <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(row.drivers ?? {}, null, 2)}
                                      </pre>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          handleCopySummary(row)
                                        }}
                                      >
                                        <Copy className="h-4 w-4" />
                                        {copy.copySummary}
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <div>
                    {inventory
                      ? isArabic
                        ? `${inventory.total.toLocaleString(numberLocale)} ${copy.projectCount} · ${copy.page} ${page} ${copy.of} ${totalPages}`
                        : `${inventory.total.toLocaleString(numberLocale)} ${copy.projectCount} · ${copy.page} ${page} ${copy.of} ${totalPages}`
                      : "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    >
                      {copy.previous}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    >
                      {copy.next}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                {copy.openListPrompt}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
              <ShieldCheck className="h-4 w-4 text-accent" />
              {copy.validationChecks}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  {copy.conservativeReadyShort}
                </p>
                {(truthChecks?.conservativeReady ?? []).map((row: { label: string; count: number }) => (
                  <div key={row.label} className="flex items-center justify-between text-muted-foreground">
                    <span>{row.label}</span>
                    <span className="text-foreground font-medium">{row.count.toLocaleString(numberLocale)}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  {copy.balancedShortLabel}
                </p>
                {(truthChecks?.balancedShort ?? []).map((row: { label: string; count: number }) => (
                  <div key={row.label} className="flex items-center justify-between text-muted-foreground">
                    <span>{row.label}</span>
                    <span className="text-foreground font-medium">{row.count.toLocaleString(numberLocale)}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{copy.timingCheck}</p>
                <div className="flex items-center gap-2 text-sm">
                  {truthChecks?.horizonViolations === 0 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-foreground">{copy.noViolations}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-foreground">
                        {truthChecks?.horizonViolations ?? "—"} {copy.violations}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{copy.speculativeCheck}</p>
                <div className="flex items-center gap-2 text-sm">
                  {truthChecks?.speculativeLeak === 0 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-foreground">{copy.noneDetected}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-foreground">
                        {truthChecks?.speculativeLeak ?? "—"} {copy.flagged}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      {expandedChart && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{copy.chartFocus}</p>
                <h3 className="text-lg font-medium text-foreground mt-2">
                  {chartDetails[expandedChart].title}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {chartDetails[expandedChart].description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedChart(null)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label={copy.closeChart}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6">{renderExpandedChart()}</div>
          </div>
        </div>
      )}
      <Footer />
    </main>
  )
}
