"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale } from "next-intl"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { type AppLocale } from "@/i18n/locale"
import { Settings2, SlidersHorizontal, Palette, Save, Loader2, Check } from "lucide-react"

type PromptConfig = {
  voice: string
  constraints: string[]
  temperature: number
  language: string
}

type HoldTypesConfig = {
  inquiryMinutes: number
  viewingMinutes: number
  decisionMinutes: number
  contractMinutes: number
}

type BrandConfig = {
  brand_name: string
  tone: string
  language: string
}

const COPY = {
  en: {
    eyebrow: "Settings - Configuration",
    title: "Enterprise runtime configuration",
    subtitle: "Control prompt behavior, hold windows, and branding without redeploying.",
    promptTitle: "Prompt Configuration",
    promptVoice: "Voice",
    promptConstraints: "Constraints (one per line)",
    promptTemperature: "Temperature",
    holdTitle: "Hold Type Configuration",
    inquiry: "Inquiry hold (minutes)",
    viewing: "Viewing hold (minutes)",
    decision: "Decision hold (minutes)",
    contract: "Contract hold (minutes)",
    brandTitle: "Brand Configuration",
    brandName: "Brand name",
    tone: "Tone",
    language: "Language",
    savePrompt: "Save prompt",
    saveHold: "Save hold types",
    saveBrand: "Save brand",
    loading: "Loading configuration...",
    saving: "Saving...",
    saved: "Saved",
    updatedAt: "Updated",
  },
  ar: {
    eyebrow: "الإعدادات — التهيئة",
    title: "تهيئة بيئة التشغيل المؤسسية",
    subtitle: "تحكم في سلوك المساعد وأنواع الحجز وهوية العلامة دون إعادة النشر.",
    promptTitle: "تهيئة البرومبت",
    promptVoice: "الصوت",
    promptConstraints: "القيود (سطر لكل قيد)",
    promptTemperature: "الحرارة",
    holdTitle: "تهيئة أنواع الحجز",
    inquiry: "مدة حجز الاستفسار (دقيقة)",
    viewing: "مدة حجز المعاينة (دقيقة)",
    decision: "مدة حجز القرار (دقيقة)",
    contract: "مدة حجز العقد (دقيقة)",
    brandTitle: "تهيئة العلامة",
    brandName: "اسم العلامة",
    tone: "النبرة",
    language: "اللغة",
    savePrompt: "حفظ البرومبت",
    saveHold: "حفظ أنواع الحجز",
    saveBrand: "حفظ العلامة",
    loading: "جارٍ تحميل التهيئة...",
    saving: "جارٍ الحفظ...",
    saved: "تم الحفظ",
    updatedAt: "آخر تحديث",
  },
} as const

const DEFAULT_PROMPT: PromptConfig = {
  voice: "Institutional, analytical, execution-focused",
  constraints: [
    "Never invent numbers.",
    "Always include confidence + evidence context.",
    "Prefer deterministic tool output over prose.",
  ],
  temperature: 0.2,
  language: "en",
}

const DEFAULT_HOLD_TYPES: HoldTypesConfig = {
  inquiryMinutes: 120,
  viewingMinutes: 240,
  decisionMinutes: 720,
  contractMinutes: 1440,
}

const DEFAULT_BRAND: BrandConfig = {
  brand_name: "Entrestate",
  tone: "technical",
  language: "en",
}

type SaveState = "idle" | "saving" | "saved"

const HOLD_TYPE_FIELDS: Array<{ key: keyof HoldTypesConfig; labelKey: "inquiry" | "viewing" | "decision" | "contract" }> = [
  { key: "inquiryMinutes", labelKey: "inquiry" },
  { key: "viewingMinutes", labelKey: "viewing" },
  { key: "decisionMinutes", labelKey: "decision" },
  { key: "contractMinutes", labelKey: "contract" },
]

export default function ConfigurationSettingsPage() {
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en

  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const [prompt, setPrompt] = useState<PromptConfig>(DEFAULT_PROMPT)
  const [holdTypes, setHoldTypes] = useState<HoldTypesConfig>(DEFAULT_HOLD_TYPES)
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND)

  const [promptSaveState, setPromptSaveState] = useState<SaveState>("idle")
  const [holdSaveState, setHoldSaveState] = useState<SaveState>("idle")
  const [brandSaveState, setBrandSaveState] = useState<SaveState>("idle")

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [promptRes, holdRes, brandRes] = await Promise.all([
          fetch("/api/config/prompt"),
          fetch("/api/config/hold-types"),
          fetch("/api/config/brand"),
        ])

        const promptData = promptRes.ok ? await promptRes.json() : null
        const holdData = holdRes.ok ? await holdRes.json() : null
        const brandData = brandRes.ok ? await brandRes.json() : null

        if (promptData?.prompt) {
          setPrompt({
            voice: promptData.prompt.voice ?? DEFAULT_PROMPT.voice,
            constraints: Array.isArray(promptData.prompt.constraints)
              ? promptData.prompt.constraints
              : DEFAULT_PROMPT.constraints,
            temperature:
              typeof promptData.prompt.temperature === "number"
                ? promptData.prompt.temperature
                : DEFAULT_PROMPT.temperature,
            language: promptData.prompt.language ?? DEFAULT_PROMPT.language,
          })
        }

        if (holdData?.holdTypes) {
          setHoldTypes({
            inquiryMinutes: Number(holdData.holdTypes.inquiryMinutes ?? DEFAULT_HOLD_TYPES.inquiryMinutes),
            viewingMinutes: Number(holdData.holdTypes.viewingMinutes ?? DEFAULT_HOLD_TYPES.viewingMinutes),
            decisionMinutes: Number(holdData.holdTypes.decisionMinutes ?? DEFAULT_HOLD_TYPES.decisionMinutes),
            contractMinutes: Number(holdData.holdTypes.contractMinutes ?? DEFAULT_HOLD_TYPES.contractMinutes),
          })
        }

        if (brandData?.brand) {
          setBrand({
            brand_name: brandData.brand.brand_name ?? DEFAULT_BRAND.brand_name,
            tone: brandData.brand.tone ?? DEFAULT_BRAND.tone,
            language: brandData.brand.language ?? DEFAULT_BRAND.language,
          })
        }

        setUpdatedAt(promptData?.updatedAt ?? holdData?.updatedAt ?? brandData?.updatedAt ?? null)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const constraintsText = useMemo(() => prompt.constraints.join("\n"), [prompt.constraints])

  async function savePrompt() {
    setPromptSaveState("saving")
    try {
      const response = await fetch("/api/config/prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prompt),
      })
      const data = response.ok ? await response.json() : null
      setUpdatedAt(data?.updatedAt ?? updatedAt)
      setPromptSaveState("saved")
      setTimeout(() => setPromptSaveState("idle"), 1400)
    } catch {
      setPromptSaveState("idle")
    }
  }

  async function saveHoldTypes() {
    setHoldSaveState("saving")
    try {
      const response = await fetch("/api/config/hold-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(holdTypes),
      })
      const data = response.ok ? await response.json() : null
      setUpdatedAt(data?.updatedAt ?? updatedAt)
      setHoldSaveState("saved")
      setTimeout(() => setHoldSaveState("idle"), 1400)
    } catch {
      setHoldSaveState("idle")
    }
  }

  async function saveBrand() {
    setBrandSaveState("saving")
    try {
      const response = await fetch("/api/config/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brand),
      })
      const data = response.ok ? await response.json() : null
      setUpdatedAt(data?.updatedAt ?? updatedAt)
      setBrandSaveState("saved")
      setTimeout(() => setBrandSaveState("idle"), 1400)
    } catch {
      setBrandSaveState("idle")
    }
  }

  function renderSaveLabel(state: SaveState, idleLabel: string) {
    if (state === "saving") {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> {copy.saving}
        </>
      )
    }

    if (state === "saved") {
      return (
        <>
          <Check className="h-4 w-4" /> {copy.saved}
        </>
      )
    }

    return (
      <>
        <Save className="h-4 w-4" /> {idleLabel}
      </>
    )
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">{copy.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
          {updatedAt ? (
            <p className="mt-3 text-xs text-muted-foreground/70">
              {copy.updatedAt}: {new Date(updatedAt).toLocaleString(locale === "ar" ? "ar-AE" : "en-AE")}
            </p>
          ) : null}
        </header>

        {loading ? (
          <div className="rounded-2xl border border-border/60 bg-card/70 px-6 py-10 text-sm text-muted-foreground">
            {copy.loading}
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border/60 bg-card/70 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{copy.promptTitle}</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.promptVoice}</label>
                  <input
                    value={prompt.voice}
                    onChange={(event) => setPrompt((prev) => ({ ...prev, voice: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.promptConstraints}</label>
                  <textarea
                    value={constraintsText}
                    onChange={(event) =>
                      setPrompt((prev) => ({
                        ...prev,
                        constraints: event.target.value
                          .split("\n")
                          .map((entry) => entry.trim())
                          .filter(Boolean),
                      }))
                    }
                    className="mt-1.5 min-h-32 w-full rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.promptTemperature}</label>
                    <input
                      type="number"
                      step="0.05"
                      min={0}
                      max={1}
                      value={prompt.temperature}
                      onChange={(event) => setPrompt((prev) => ({ ...prev, temperature: Number(event.target.value) }))}
                      className="mt-1.5 w-full rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.language}</label>
                    <input
                      value={prompt.language}
                      onChange={(event) => setPrompt((prev) => ({ ...prev, language: event.target.value }))}
                      className="mt-1.5 w-full rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={savePrompt}
                  className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
                >
                  {renderSaveLabel(promptSaveState, copy.savePrompt)}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/70 p-6">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{copy.holdTitle}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {HOLD_TYPE_FIELDS.map(({ key, labelKey }) => (
                  <div key={key}>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy[labelKey]}</label>
                    <input
                      type="number"
                      min={5}
                      max={1440}
                      value={holdTypes[key]}
                      onChange={(event) =>
                        setHoldTypes((prev) => ({
                          ...prev,
                          [key]: Number(event.target.value),
                        }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={saveHoldTypes}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
              >
                {renderSaveLabel(holdSaveState, copy.saveHold)}
              </button>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/70 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{copy.brandTitle}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.brandName}</label>
                  <input
                    value={brand.brand_name}
                    onChange={(event) => setBrand((prev) => ({ ...prev, brand_name: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.tone}</label>
                  <input
                    value={brand.tone}
                    onChange={(event) => setBrand((prev) => ({ ...prev, tone: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">{copy.language}</label>
                  <input
                    value={brand.language}
                    onChange={(event) => setBrand((prev) => ({ ...prev, language: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={saveBrand}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
              >
                {renderSaveLabel(brandSaveState, copy.saveBrand)}
              </button>
            </section>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
