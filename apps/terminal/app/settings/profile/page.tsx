"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Brain, Check, Gauge, Loader2, Save, Target } from "lucide-react"
import { useLocale } from "next-intl"

import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { AccountSectionNav } from "@/components/account/account-section-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type AppLocale, prefixLocalePath } from "@/i18n/locale"

function getHorizonOptions(locale: AppLocale) {
  if (locale === "ar") {
    return [
      { value: "ready", label: "جاهز الآن" },
      { value: "6-12mo", label: "خلال 6-12 شهر" },
      { value: "1-2yr", label: "خلال 1-2 سنة" },
      { value: "2-4yr", label: "خلال 2-4 سنوات" },
      { value: "4yr+", label: "أكثر من 4 سنوات" },
    ]
  }

  return [
    { value: "ready", label: "Ready now" },
    { value: "6-12mo", label: "6-12 months" },
    { value: "1-2yr", label: "1-2 years" },
    { value: "2-4yr", label: "2-4 years" },
    { value: "4yr+", label: "4+ years" },
  ]
}

function yieldDescription(value: number, locale: AppLocale) {
  if (locale === "ar") {
    if (value < 35) return "حذر: الأولوية للأمان وحماية رأس المال."
    if (value < 65) return "متوازن: عائد منضبط مع قدر مناسب من الأمان."
    return "نمائي: عائد أعلى مع استعداد أكبر لتحمل المخاطر."
  }

  if (value < 35) return "Conservative: prioritize safety and capital preservation."
  if (value < 65) return "Balanced: optimize for risk-adjusted returns."
  return "Growth: prioritize yield and upside potential."
}

function archetypeLabel(value: number, locale: AppLocale) {
  if (locale === "ar") {
    if (value < 35) return "حذر"
    if (value < 65) return "متوازن"
    if (value < 85) return "نمائي"
    return "انتهازي"
  }

  if (value < 35) return "Conservative"
  if (value < 65) return "Balanced"
  if (value < 85) return "Growth"
  return "Opportunistic"
}

const COPY = {
  en: {
    back: "Back to account",
    eyebrow: "Account settings",
    title: "Decision profile",
    subtitle:
      "These settings shape how the platform weighs market evidence, timing, and preference-based matching for your account.",
    riskTitle: "Risk and horizon",
    riskLabel: (value: number) => `Market weight bias (${value}%)`,
    riskBody: "Higher means more weight on verified market signals than on personal preference.",
    personal: "Personal match",
    market: "Market data",
    horizon: "Investment horizon",
    styleTitle: "Investment style",
    styleLabel: (value: number) => `Yield vs safety (${value}%)`,
    stylePrefix: "Current archetype:",
    safety: "Capital safety",
    yield: "Yield growth",
    preferencesTitle: "Market preferences",
    preferencesLabel: "Preferred markets",
    preferencesBody: "Comma-separated areas or cities to prioritize by default.",
    preferencesPlaceholder: "Dubai Marina, JVC, Downtown",
    preferencesFootnote:
      "These preferences influence default filters and match scoring across search, chat, and reports.",
    summaryTitle: "Profile summary",
    summaryDescription: "A quick read on how your account is currently tuned.",
    loading: "Loading profile...",
    saving: "Saving...",
    saved: "Saved",
    save: "Save profile",
    saveError: "Failed to save profile.",
    loadError: "Failed to load profile.",
    statusReady: "Ready to save",
    statusSaved: "Profile saved",
  },
  ar: {
    back: "العودة إلى الحساب",
    eyebrow: "إعدادات الحساب",
    title: "ملف القرار",
    subtitle:
      "هذه الإعدادات تضبط كيف توازن المنصة بين قراءة السوق والإطار الزمني والمطابقة المعتمدة على تفضيلاتك.",
    riskTitle: "المخاطر والإطار الزمني",
    riskLabel: (value: number) => `وزن السوق (${value}%)`,
    riskBody: "كلما ارتفع المؤشر زاد اعتماد المنصة على إشارات السوق الموثقة أكثر من التفضيلات الشخصية.",
    personal: "التفضيل الشخصي",
    market: "قراءة السوق",
    horizon: "الإطار الزمني",
    styleTitle: "أسلوب الاستثمار",
    styleLabel: (value: number) => `العائد مقابل الأمان (${value}%)`,
    stylePrefix: "الطابع الحالي:",
    safety: "الأمان",
    yield: "العائد",
    preferencesTitle: "تفضيلات السوق",
    preferencesLabel: "الأسواق المفضلة",
    preferencesBody: "اكتب المناطق أو المدن المفضلة وافصل بينها بفواصل.",
    preferencesPlaceholder: "دبي مارينا، JVC، وسط دبي",
    preferencesFootnote:
      "تؤثر هذه التفضيلات في الفلاتر الافتراضية ودرجة المطابقة عبر البحث والشات والتقارير.",
    summaryTitle: "ملخص الملف",
    summaryDescription: "قراءة سريعة لكيفية ضبط هذا الحساب حالياً.",
    loading: "جارٍ تحميل الملف...",
    saving: "جارٍ الحفظ...",
    saved: "تم الحفظ",
    save: "حفظ الملف",
    saveError: "تعذر حفظ الملف.",
    loadError: "تعذر تحميل الملف.",
    statusReady: "جاهز للحفظ",
    statusSaved: "تم حفظ الملف",
  },
} as const

type ProfileResponse = {
  riskBias?: number
  yieldVsSafety?: number
  horizon?: string | null
  preferredMarkets?: string[]
  error?: string
}

export default function ProfileSettingsPage() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const copy = COPY[locale] ?? COPY.en
  const horizonOptions = getHorizonOptions(locale)

  const [riskBias, setRiskBias] = useState(65)
  const [yieldVsSafety, setYieldVsSafety] = useState(50)
  const [horizon, setHorizon] = useState("ready")
  const [preferredMarkets, setPreferredMarkets] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/profile", { cache: "no-store" })
        const data = (await response.json().catch(() => ({}))) as ProfileResponse

        if (!active) return

        if (response.status === 404) {
          return
        }

        if (!response.ok) {
          throw new Error(data.error ?? copy.loadError)
        }

        setRiskBias(Math.round((data.riskBias ?? 0.65) * 100))
        setYieldVsSafety(Math.round((data.yieldVsSafety ?? 0.5) * 100))
        setHorizon(data.horizon ?? "ready")
        setPreferredMarkets((data.preferredMarkets ?? []).join(", "))
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : copy.loadError)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [copy.loadError])

  async function saveProfile() {
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskBias: riskBias / 100,
          yieldVsSafety: yieldVsSafety / 100,
          horizon,
          preferredMarkets: preferredMarkets
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      })

      const data = (await response.json().catch(() => ({}))) as ProfileResponse
      if (!response.ok) {
        throw new Error(data.error ?? copy.saveError)
      }

      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : copy.saveError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-background" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 md:pt-28">
        <header className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <Link
            href={prefixLocalePath("/account", locale)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {copy.eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                {copy.title}
              </h1>
              <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
                {copy.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {saved ? copy.statusSaved : copy.statusReady}
              </Badge>
              <Button onClick={saveProfile} disabled={loading || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saving ? copy.saving : saved ? copy.saved : copy.save}
              </Button>
            </div>
          </div>

          <AccountSectionNav active="profile" locale={locale} />
        </header>

        {error ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-10 flex items-center justify-center rounded-3xl border border-border bg-card px-6 py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
            {copy.loading}
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr),320px]">
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">{copy.riskTitle}</h2>
                </div>

                <div className="mt-5 space-y-6">
                  <div>
                    <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {copy.riskLabel(riskBias)}
                    </label>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.riskBody}</p>
                    <input
                      type="range"
                      min={30}
                      max={90}
                      value={riskBias}
                      onChange={(event) => setRiskBias(Number(event.target.value))}
                      className="mt-4 w-full accent-foreground"
                    />
                    <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                      <span>{copy.personal}</span>
                      <span>{copy.market}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {copy.horizon}
                    </label>
                    <select
                      value={horizon}
                      onChange={(event) => setHorizon(event.target.value)}
                      className="border-input dark:bg-input/30 mt-2 h-11 w-full rounded-xl border bg-transparent px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    >
                      {horizonOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">{copy.styleTitle}</h2>
                </div>

                <div className="mt-5 space-y-6">
                  <div>
                    <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {copy.styleLabel(yieldVsSafety)}
                    </label>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {yieldDescription(yieldVsSafety, locale)}
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={yieldVsSafety}
                      onChange={(event) => setYieldVsSafety(Number(event.target.value))}
                      className="mt-4 w-full accent-foreground"
                    />
                    <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                      <span>{copy.safety}</span>
                      <span>{copy.yield}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{copy.stylePrefix} </span>
                      {archetypeLabel(yieldVsSafety, locale)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">{copy.preferencesTitle}</h2>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {copy.preferencesLabel}
                    </label>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {copy.preferencesBody}
                    </p>
                    <Input
                      value={preferredMarkets}
                      onChange={(event) => setPreferredMarkets(event.target.value)}
                      placeholder={copy.preferencesPlaceholder}
                      className="mt-3 h-11 rounded-xl"
                    />
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm leading-6 text-muted-foreground">
                    {copy.preferencesFootnote}
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">{copy.summaryTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {copy.summaryDescription}
                </p>

                <dl className="mt-5 space-y-4 text-sm">
                  <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.horizon}</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {horizonOptions.find((option) => option.value === horizon)?.label ?? horizon}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.styleTitle}</dt>
                    <dd className="mt-1 font-semibold text-foreground">{archetypeLabel(yieldVsSafety, locale)}</dd>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{copy.preferencesLabel}</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {preferredMarkets.trim().length > 0 ? preferredMarkets : isArabic ? "غير محدد" : "Not set"}
                    </dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
