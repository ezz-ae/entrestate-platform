"use client"

import { useEffect, useRef, useState } from "react"
import { useLocale } from "next-intl"
import { Zap, BarChart3, ShieldCheck, FileText, ArrowRight, ChevronRight } from "lucide-react"
import Link from "next/link"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

type StepConfig = {
  step: string
  label: string
  tagline: string
  detail: string
  icon: typeof Zap
  accentClass: string
  borderClass: string
  bgClass: string
  glowClass: string
  barClass: string
  example: string
  proofLabel?: string
  proofItems?: string[]
  proofSequence?: boolean
}

const STEP_COPY: Record<AppLocale, StepConfig[]> = {
  en: [
    {
      step: "01",
      label: "Intent",
      tagline: "What does this investor actually need?",
      detail:
        "The terminal converts a natural language brief, budget, horizon, and risk tolerance into a structured mandate before any scoring begins. Ambiguity is resolved at the start, not after a result appears.",
      icon: Zap,
      accentClass: "text-blue-400",
      borderClass: "border-blue-500/30",
      bgClass: "bg-blue-500/8",
      glowClass: "shadow-blue-500/10",
      barClass: "bg-blue-400",
      example: "Mandate: AED 2M–3M, resilient downside, BUY/HOLD only, no weak evidence.",
      proofLabel: "What gets locked in first",
      proofItems: ["Budget and target", "Horizon and liquidity", "Risk guardrails"],
    },
    {
      step: "02",
      label: "Evidence",
      tagline: "Is the data trustworthy?",
      detail:
        "Stage 2 houses the five-layer evidence stack so raw inputs never become recommendations. Only L2 and L1 evidence fed by L3-L5 validation enters the judgment engine.",
      icon: BarChart3,
      accentClass: "text-violet-400",
      borderClass: "border-violet-500/30",
      bgClass: "bg-violet-500/8",
      glowClass: "shadow-violet-500/10",
      barClass: "bg-violet-400",
      example: "Only L1-L2 evidence can move a project into a decision queue.",
      proofLabel: "Stage 2 evidence stack (L5 → L1)",
      proofItems: [
        "L5 Raw inputs (sparse/scraped)",
        "L4 External benchmarks & crowds",
        "L3 Dynamic market behavior",
        "L2 Cross-validated signals",
        "L1 Canonical truth (auditable)",
      ],
      proofSequence: true,
    },
    {
      step: "03",
      label: "Judgment",
      tagline: "What should the investor do?",
      detail:
        "The scoring engine weighs timing, stress, yield, and evidence to produce a ranked verdict with the drivers behind it and the conditions that could change it.",
      icon: ShieldCheck,
      accentClass: "text-emerald-400",
      borderClass: "border-emerald-500/30",
      bgClass: "bg-emerald-500/8",
      glowClass: "shadow-emerald-500/10",
      barClass: "bg-emerald-400",
      example: "BUY · Stress B · Timing 78 · Evidence 84 · Driver: DLD velocity + pricing discipline.",
      proofLabel: "Signal dimensions",
      proofItems: ["Timing (0–100)", "Stress (A–F)", "Yield (0–100)", "Evidence grade", "Verdict + drivers"],
    },
    {
      step: "04",
      label: "Action",
      tagline: "How do they execute?",
      detail:
        "Stage 4 surfaces execution across six pathways—Screen, Compare, Memo, Monitor, Execute, Recover—so operators, analysts, and leadership all act from the same canonical dataset.",
      icon: FileText,
      accentClass: "text-amber-400",
      borderClass: "border-amber-500/30",
      bgClass: "bg-amber-500/8",
      glowClass: "shadow-amber-500/10",
      barClass: "bg-amber-400",
      example: "One dataset, six operational paths, full evidence continuity.",
      proofLabel: "Execution surfaces",
      proofItems: ["Screen", "Compare", "Memo", "Monitor", "Execute", "Recover"],
    },
  ],
  ar: [
    {
      step: "01",
      label: "الهدف",
      tagline: "ماذا يحتاج هذا المستثمر فعلاً؟",
      detail:
        "تحوّل المحطة الطلب المكتوب بلغة طبيعية، مع الميزانية والأفق وحدود المخاطر، إلى تفويض منظم قبل أي تقييم. يُحل الغموض في البداية لا بعد ظهور النتيجة.",
      icon: Zap,
      accentClass: "text-blue-400",
      borderClass: "border-blue-500/30",
      bgClass: "bg-blue-500/8",
      glowClass: "shadow-blue-500/10",
      barClass: "bg-blue-400",
      example: "تفويض: AED 2M–3M، حماية هبوط، قرارات BUY/HOLD فقط.",
      proofLabel: "ما يتم تثبيته أولاً",
      proofItems: ["الميزانية والهدف", "الأفق والسيولة", "ضوابط المخاطر"],
    },
    {
      step: "02",
      label: "الأدلة",
      tagline: "هل البيانات موثوقة؟",
      detail:
        "المرحلة الثانية تضم طبقة الأدلة الخمس حتى لا تتحول المدخلات الخام إلى توصية؛ فقط L1 و L2 المدعومة بـ L3-L5 تخرج للحكم.",
      icon: BarChart3,
      accentClass: "text-violet-400",
      borderClass: "border-violet-500/30",
      bgClass: "bg-violet-500/8",
      glowClass: "shadow-violet-500/10",
      barClass: "bg-violet-400",
      example: "فقط L1 و L2 يدخلان محرك القرار.",
      proofLabel: "طبقة الأدلة في المرحلة 2 (L5 → L1)",
      proofItems: [
        "L5 مدخلات خام ومتفرقة",
        "L4 معايير خارجية",
        "L3 سلوك سوق ديناميكي",
        "L2 إشارات متقاطعة",
        "L1 حقيقة موثقة قابلة للتدقيق",
      ],
      proofSequence: true,
    },
    {
      step: "03",
      label: "الحكم",
      tagline: "ما الذي يجب فعله؟",
      detail:
        "يقيس محرك التقييم التوقيت والضغط والعائد وقوة الأدلة ليخرج حكماً مرتباً مع الأسباب التي تقف خلفه وما الذي يمكن أن يغيره.",
      icon: ShieldCheck,
      accentClass: "text-emerald-400",
      borderClass: "border-emerald-500/30",
      bgClass: "bg-emerald-500/8",
      glowClass: "shadow-emerald-500/10",
      barClass: "bg-emerald-400",
      example: "BUY · ضغط B · توقيت 78 · أدلة 84 · السبب: سرعة DLD + انضباط التسعير.",
      proofLabel: "أبعاد الإشارة",
      proofItems: ["التوقيت (0–100)", "الضغط (A–F)", "العائد (0–100)", "درجة الأدلة", "الحكم + الأسباب"],
    },
    {
      step: "04",
      label: "التنفيذ",
      tagline: "كيف ينفّذون؟",
      detail:
        "المرحلة الرابعة تعرض ستة مسارات تنفيذية (Screen، Compare، Memo، Monitor، Execute، Recover) كلها تعتمد نفس مجموعة البيانات الكنسية حتى يعمل الجميع على نفس الحقيقة.",
      icon: FileText,
      accentClass: "text-amber-400",
      borderClass: "border-amber-500/30",
      bgClass: "bg-amber-500/8",
      glowClass: "shadow-amber-500/10",
      barClass: "bg-amber-400",
      example: "بيانات واحدة، ستة مسارات تنفيذ، واستمرارية أدلة كاملة.",
      proofLabel: "واجهات التنفيذ",
      proofItems: ["Screen", "Compare", "Memo", "Monitor", "Execute", "Recover"],
    },
  ],
}

const AUTO_INTERVAL = 4000

export function DecisionTunnelStepper() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const steps = STEP_COPY[locale] ?? STEP_COPY.en
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const step = steps[active]

  const startCycle = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (progressRef.current) clearInterval(progressRef.current)

    setProgress(0)
    const startTime = Date.now()

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setProgress(Math.min((elapsed / AUTO_INTERVAL) * 100, 100))
    }, 30)

    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length)
    }, AUTO_INTERVAL)
  }

  useEffect(() => {
    if (!paused) {
      startCycle()
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
      setProgress(0)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused])

  const handleStepClick = (index: number) => {
    setActive(index)
    setPaused(false)
  }

  const Icon = step.icon

  return (
    <div className="w-full">
      <div className="relative mb-6 flex items-center justify-between gap-0">
        {steps.map((currentStep, index) => {
          const StepIcon = currentStep.icon
          const isActive = index === active
          const isPast = index < active

          return (
            <div key={currentStep.step} className="flex flex-1 items-center">
              <button
                onClick={() => handleStepClick(index)}
                className={`group relative flex flex-1 flex-col items-center gap-1.5 py-3 transition-all duration-300 ${isActive ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? `${currentStep.borderClass} ${currentStep.bgClass} shadow-lg ${currentStep.glowClass}`
                      : isPast
                        ? "border-border/60 bg-card"
                        : "border-border/30 bg-background"
                  }`}
                >
                  <StepIcon
                    className={`h-4 w-4 ${isActive ? currentStep.accentClass : "text-muted-foreground/50"} transition-colors duration-300`}
                  />
                </div>

                <span className={`text-[11px] font-semibold transition-colors duration-300 ${isActive ? currentStep.accentClass : "text-muted-foreground/50"}`}>
                  {currentStep.label}
                </span>

                {isActive && !paused ? (
                  <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 overflow-hidden rounded-full bg-border/40">
                    <div className={`h-full transition-none ${currentStep.barClass}`} style={{ width: `${progress}%` }} />
                  </div>
                ) : null}
              </button>

              {index < steps.length - 1 ? (
                <div className={`flex shrink-0 items-center transition-colors duration-500 ${index < active ? "text-muted-foreground/40" : "text-border/40"}`}>
                  <ChevronRight className="h-4 w-4" />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl border ${step.borderClass} ${step.bgClass} p-6 md:p-8 shadow-xl ${step.glowClass} transition-all duration-500`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="pointer-events-none absolute -right-3 -top-4 select-none font-black leading-none opacity-[0.04]"
          aria-hidden
          style={{ fontSize: "120px", WebkitTextStroke: "2px currentColor" }}
        >
          {step.step}
        </div>

        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
          <div className="flex shrink-0 flex-col items-start gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${step.borderClass} ${step.bgClass}`}>
              <Icon className={`h-7 w-7 ${step.accentClass}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{isArabic ? `${step.step} من 04` : `${step.step} of 04`}</p>
              <p className={`mt-0.5 font-serif text-2xl font-medium ${step.accentClass}`}>{step.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground/60">{step.tagline}</p>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-sm leading-relaxed text-foreground/80 md:text-[15px] md:leading-7">
              {step.detail}
            </p>

            {step.proofItems && step.proofItems.length > 0 ? (
              <div className={`mt-5 rounded-xl border ${step.borderClass} bg-background/45 px-4 py-3`}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/45">
                  {step.proofLabel ?? (isArabic ? "تفاصيل" : "Details")}
                </p>

                {step.proofSequence ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {step.proofItems.map((item, index) => (
                      <div key={item} className="flex items-center gap-1.5">
                        <span className={`rounded-full border ${step.borderClass} px-2.5 py-1 text-[10px] font-semibold ${step.accentClass}`}>
                          {item}
                        </span>
                        {index < step.proofItems!.length - 1 ? <ArrowRight className="h-3 w-3 text-muted-foreground/50" /> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {step.proofItems.map((item) => (
                      <span key={item} className={`rounded-full border ${step.borderClass} px-2.5 py-1 text-[10px] font-semibold ${step.accentClass}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className={`mt-5 rounded-xl border ${step.borderClass} bg-background/40 px-4 py-3`}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">{isArabic ? "مثال تشغيلي" : "Operating example"}</p>
              <p className={`text-xs font-mono leading-relaxed ${step.accentClass} opacity-80`}>{step.example}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border/20 pt-4">
          <div className="flex items-center gap-1.5">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`h-1 rounded-full transition-all duration-300 ${index === active ? `w-6 ${step.barClass}` : "w-1.5 bg-border/50"}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleStepClick((active - 1 + steps.length) % steps.length)}
              className="text-[11px] text-muted-foreground/40 transition-colors hover:text-muted-foreground"
            >
              {isArabic ? "السابق ←" : "← Prev"}
            </button>
            {active < steps.length - 1 ? (
              <button
                onClick={() => handleStepClick(active + 1)}
                className={`flex items-center gap-1.5 rounded-lg border ${step.borderClass} px-4 py-1.5 text-xs font-medium ${step.accentClass} transition-colors hover:bg-background/50`}
              >
                {isArabic ? "المرحلة التالية" : "Next stage"}
                <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <CopilotEntryLink
                className={`flex items-center gap-1.5 rounded-lg border ${step.borderClass} px-4 py-1.5 text-xs font-medium ${step.accentClass} transition-colors hover:bg-background/50`}
              >
                {isArabic ? "جرّب التنفيذ" : "Run a live workflow"}
                <ArrowRight className="h-3 w-3" />
              </CopilotEntryLink>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
