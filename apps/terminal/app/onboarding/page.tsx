"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { Building2, TrendingUp, Briefcase, Shield, Rocket, BarChart3, ArrowRight, SkipForward } from "lucide-react"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { authClient } from "@/lib/auth/client"

type Role = "broker" | "investor" | "developer" | "analyst"

function getRoles(locale: AppLocale) {
  if (locale === "ar") {
    return [
      { key: "broker" as const, label: "وسيط", description: "أطابق المشترين مع الفرص المناسبة", icon: Building2 },
      { key: "investor" as const, label: "مستثمر", description: "أفحص الأصول من زاوية العائد والمخاطر", icon: TrendingUp },
      { key: "developer" as const, label: "مطور", description: "أدير المشاريع والتسعير والإطلاق", icon: Briefcase },
      { key: "analyst" as const, label: "باحث", description: "أقرأ السوق وأبني تقارير واستنتاجات", icon: BarChart3 },
    ]
  }

  return [
    { key: "broker" as const, label: "Broker", description: "I find and match buyers with the right properties", icon: Building2 },
    { key: "investor" as const, label: "Investor", description: "I evaluate assets for capital growth or yield", icon: TrendingUp },
    { key: "developer" as const, label: "Developer", description: "I build and sell residential or commercial projects", icon: Briefcase },
    { key: "analyst" as const, label: "Analyst", description: "I research markets and produce reports", icon: BarChart3 },
  ]
}

function getHorizons(locale: AppLocale) {
  if (locale === "ar") {
    return [
      { key: "ready", label: "جاهز الآن", description: "مكتمل أو قريب من التسليم" },
      { key: "6-12mo", label: "خلال 6-12 شهر", description: "قيد التنفيذ وقريب" },
      { key: "1-2yr", label: "خلال 1-2 سنة", description: "مسار متوسط المدى" },
      { key: "2-4yr", label: "خلال 2-4 سنوات", description: "قراءة طويلة المدى" },
      { key: "4yr+", label: "أكثر من 4 سنوات", description: "رأسمال صبور واستراتيجي" },
    ]
  }

  return [
    { key: "ready", label: "Ready now", description: "Completed or near handover" },
    { key: "6-12mo", label: "6-12 months", description: "Under construction, soon" },
    { key: "1-2yr", label: "1-2 years", description: "Medium-term pipeline" },
    { key: "2-4yr", label: "2-4 years", description: "Long-term plays" },
    { key: "4yr+", label: "4+ years", description: "Strategic, patient capital" },
  ]
}

function getBudgetRanges(locale: AppLocale) {
  if (locale === "ar") {
    return [
      { key: "under1m", label: "أقل من 1M AED", min: 0, max: 1_000_000 },
      { key: "1m-3m", label: "1M - 3M AED", min: 1_000_000, max: 3_000_000 },
      { key: "3m-10m", label: "3M - 10M AED", min: 3_000_000, max: 10_000_000 },
      { key: "10m+", label: "أكثر من 10M AED", min: 10_000_000, max: undefined },
    ]
  }

  return [
    { key: "under1m", label: "Under 1M AED", min: 0, max: 1_000_000 },
    { key: "1m-3m", label: "1M - 3M AED", min: 1_000_000, max: 3_000_000 },
    { key: "3m-10m", label: "3M - 10M AED", min: 3_000_000, max: 10_000_000 },
    { key: "10m+", label: "10M+ AED", min: 10_000_000, max: undefined },
  ]
}

function yieldDescription(value: number, locale: AppLocale) {
  if (locale === "ar") {
    if (value < 35) return "حذر — يميل إلى الأمان واستقرار القرار"
    if (value < 65) return "متوازن — يوازن بين العائد والانضباط"
    return "نمائي — يطارد العائد والفرص الأسرع"
  }

  if (value < 35) return "Conservative — prioritize safety and capital preservation"
  if (value < 65) return "Balanced — optimize for risk-adjusted returns"
  return "Growth — prioritize yield and upside potential"
}

const COPY = {
  en: {
    step: (current: number) => `Step ${current} of 3`,
    titleOne: "What best describes you?",
    bodyOne: "This helps tailor market signals and report formats to your workflow.",
    titleTwo: "Budget and timeline",
    bodyTwo: "Optional. This helps shape the first view and default filters.",
    budget: "Budget range",
    horizon: "Investment horizon",
    skip: "Skip",
    continue: "Continue",
    titleThree: "Investment style",
    bodyThree: "Optional. This tells the scoring engine how to weigh opportunities for you.",
    safety: "Capital preservation",
    yield: "Yield maximization",
    finish: "Start exploring",
    finishing: "Setting up...",
  },
  ar: {
    step: (current: number) => `الخطوة ${current} من 3`,
    titleOne: "ما الدور الأقرب لطريقتك في العمل؟",
    bodyOne: "نضبط القراءة الأولى للسوق وطريقة عرض الفرص بما يناسب دورك.",
    titleTwo: "الميزانية والإطار الزمني",
    bodyTwo: "اختياري. يساعدنا في فتح الشاشة الأولى على قراءة أقرب لما تبحث عنه.",
    budget: "الميزانية",
    horizon: "الإطار الزمني",
    skip: "تخطي",
    continue: "التالي",
    titleThree: "أسلوب القرار",
    bodyThree: "اختياري. يساعدنا في وزن الفرص بين الأمان والعائد.",
    safety: "حماية رأس المال",
    yield: "تعظيم العائد",
    finish: "ابدأ الآن",
    finishing: "جارٍ التجهيز...",
  },
} as const

import { inferOnboardingProfile } from "@/lib/profile/inference"
import { Attribution } from "@/lib/attribution/tracker"
import { getFirstQuery } from "@/lib/onboarding/first-query"

type Objective = "yield" | "growth" | "visa"
type RiskLevel = "conservative" | "balanced" | "aggressive"

const ONBOARDING_COPY = {
  en: {
    step: (current: number) => `Phase ${current} of 3`,
    titleOne: "What is your primary investment objective?",
    bodyOne: "We optimize the infrastructure's intelligence layer based on your target outcome.",
    objectives: [
      { key: "yield" as const, label: "Yield Maximization", description: "Optimize for stable, high-yield rental income", icon: BarChart3 },
      { key: "growth" as const, label: "Capital Growth", description: "Target high-appreciation areas and emerging clusters", icon: TrendingUp },
      { key: "visa" as const, label: "Golden Visa Residency", description: "Identify eligible assets at the AED 2M+ threshold", icon: Shield },
    ],
    titleTwo: "Deployment constraints",
    bodyTwo: "Define your operational boundaries for budget and handover timing.",
    budget: "Budget liquidity",
    horizon: "Time horizon",
    titleThree: "Risk Appetite & Methodology",
    bodyThree: "Set your risk tolerance for asset selection and scoring weights.",
    riskLabels: {
      conservative: "Conservative: Institutional resilience focus",
      balanced: "Balanced: Risk-adjusted performance",
      aggressive: "Aggressive: High-upside emerging opportunities",
    },
    finish: "Initialize OS",
    finishing: "Deploying persona...",
    skip: "Skip profiling",
    continue: "Continue",
  },
  ar: {
    step: (current: number) => `المرحلة ${current} من 3`,
    titleOne: "ما هو هدفك الاستثماري الأساسي؟",
    bodyOne: "نقوم بضبط منطق النظام بناءً على النتيجة التي تسعى لتحقيقها.",
    objectives: [
      { key: "yield" as const, label: "تعظيم العائد", description: "التركيز على عوائد إيجارية مرتفعة ومستقرة", icon: BarChart3 },
      { key: "growth" as const, label: "نمو رأس المال", description: "استهداف المناطق ذات الارتفاع العالي في القيمة", icon: TrendingUp },
      { key: "visa" as const, label: "الإقامة الذهبية", description: "تحديد الأصول المؤهلة بحد 2 مليون درهم فأكثر", icon: Shield },
    ],
    titleTwo: "قيود التنفيذ",
    bodyTwo: "حدد حدودك التشغيلية للميزانية وتوقيت التسليم.",
    budget: "سيولة الميزانية",
    horizon: "الأفق الزمني",
    titleThree: "شهية المخاطرة والمنهجية",
    bodyThree: "حدد مستوى تحملك للمخاطر لاختيار الأصول وأوزان التقييم.",
    riskLabels: {
      conservative: "محافظ: التركيز على المرونة المؤسسية",
      balanced: "متوازن: أداء معدل حسب المخاطر",
      aggressive: "نمائي: فرص ناشئة ذات عائد مرتفع",
    },
    finish: "بدء النظام",
    finishing: "جارٍ الإعداد...",
    skip: "تخطي الملف الشخصي",
    continue: "التالي",
  },
} as const

export default function OnboardingPage() {
  const router = useRouter()
  const locale = useLocale() as AppLocale
  const copy = ONBOARDING_COPY[locale] ?? ONBOARDING_COPY.en
  const { data: session } = authClient.useSession()
  
  const [step, setStep] = useState(1)
  const [objective, setObjective] = useState<Objective | null>(null)
  const [horizon, setHorizon] = useState("")
  const [budget, setBudget] = useState("")
  const [riskTolerance, setRiskTolerance] = useState<RiskLevel>("balanced")
  const [saving, setSaving] = useState(false)

  const budgetRanges = getBudgetRanges(locale)
  const horizons = getHorizons(locale)

  async function finish() {
    setSaving(true)
    const profile = inferOnboardingProfile({
      objective: objective || undefined,
      budget: budget || undefined,
      horizon: horizon || undefined,
      riskTolerance,
    })

    try {
      Attribution.logOnboardingComplete(objective || undefined)
      if (session?.user?.id) {
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...profile,
            userId: session.user.id,
          }),
        })
      }
    } catch (e) {
      console.error("Onboarding profile sync failed", e)
    } finally {
      setSaving(false)
      const initialPlan = getFirstQuery({
        objective: objective || undefined,
        budget: budget || undefined,
      })
      router.push(
        prefixLocalePath(
          `/chat?q=${encodeURIComponent(initialPlan.query)}&goldenPath=${initialPlan.goldenPath}&onboarded=true`,
          locale,
        ),
      )
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-slate-200 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl relative">
        {/* Progress Orbit */}
        <div className="flex items-center gap-2 mb-12">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-0.5 flex-1 transition-all duration-500 ${
                i <= step ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-800"
              }`} 
            />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/80 font-semibold mb-4">
              {copy.step(1)}
            </p>
            <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight mb-4">
              {copy.titleOne}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-md">
              {copy.bodyOne}
            </p>
            
            <div className="grid gap-4">
              {copy.objectives.map((obj) => (
                <button
                  key={obj.key}
                  onClick={() => {
                    setObjective(obj.key)
                    setStep(2)
                  }}
                  className={`group relative flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-300 ${
                    objective === obj.key 
                      ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
                  }`}
                >
                  <div className={`p-3 rounded-xl transition-colors ${
                    objective === obj.key ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500 group-hover:text-slate-300"
                  }`}>
                    <obj.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-white group-hover:text-emerald-400 transition-colors">
                      {obj.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{obj.description}</p>
                  </div>
                  <ArrowRight className={`ml-auto w-4 h-4 transition-all duration-300 ${
                    objective === obj.key ? "text-emerald-500 translate-x-0 opacity-100" : "text-slate-700 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                  }`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/80 font-semibold mb-4">
              {copy.step(2)}
            </p>
            <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight mb-4">
              {copy.titleTwo}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-10">
              {copy.bodyTwo}
            </p>

            <div className="space-y-10">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 block">
                  {copy.budget}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {budgetRanges.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setBudget(item.key)}
                      className={`px-4 py-3 rounded-xl border text-xs font-medium transition-all ${
                        budget === item.key
                          ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-400"
                          : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 block">
                  {copy.horizon}
                </label>
                <div className="grid gap-2">
                  {horizons.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setHorizon(item.key)}
                      className={`flex items-center justify-between px-5 py-3.5 rounded-xl border text-xs transition-all ${
                        horizon === item.key
                          ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-400"
                          : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-[10px] opacity-60 font-normal">{item.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-center justify-between">
              <button 
                onClick={() => setStep(3)}
                className="text-xs text-slate-500 hover:text-white transition-colors"
              >
                {copy.skip}
              </button>
              <button 
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full text-sm font-bold hover:bg-emerald-400 transition-colors"
              >
                {copy.continue} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/80 font-semibold mb-4 text-left">
              {copy.step(3)}
            </p>
            <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight mb-4 text-left">
              {copy.titleThree}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-12 text-left">
              {copy.bodyThree}
            </p>

            <div className="grid gap-3 mb-12">
              {(["conservative", "balanced", "aggressive"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskTolerance(r)}
                  className={`px-5 py-4 rounded-2xl border text-sm transition-all text-left ${
                    riskTolerance === r
                      ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-400"
                      : "border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-bold tracking-wide">
                      {copy.riskLabels[r].split(":")[0]}
                    </span>
                    {riskTolerance === r && <Rocket className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-[10px] mt-1 opacity-70">
                    {copy.riskLabels[r].split(":")[1]?.trim()}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button 
                onClick={finish}
                className="text-xs text-slate-500 hover:text-white transition-colors"
              >
                {copy.skip}
              </button>
              <button 
                onClick={finish} 
                disabled={saving}
                className="flex items-center gap-3 bg-emerald-500 text-black px-8 py-3.5 rounded-full text-sm font-bold hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
              >
                {saving ? copy.finishing : copy.finish} 
                {!saving && <Rocket className="w-4 h-4" />}
                {saving && <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
