"use client"

import Link from "next/link"
import { useLocale } from "next-intl"
import { ArrowRight, Database, MapPin, Search, ShieldCheck } from "lucide-react"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { formatAed } from "@/lib/format/currency"
import { formatInteger } from "@/lib/format/number"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { LiveSignalCard } from "@/components/platform/live-signal-card"

type Props = {
  avgMarketPrice: number | null
  totalProjects: number
  buySignals: number
  totalAreas: number
  ratedDevelopers: number
  dldTransactions: number
  topProject: {
    slug: string
    name: string
    area?: string | null
    developer?: string | null
    timing?: string | null
    stress?: string | null
    yieldValue?: number | null
    score?: number | null
    price?: number | null
  } | null
  syncLabel?: string | null
}

const COPY = {
  en: {
    eyebrow: "UAE Real Estate Intelligence",
    titleLineOne: "Dubai real estate is moving fast.",
    titleLineTwo: "Your data should too.",
    subtitle: "Scored projects, area context, and developer signals in one evidence-backed decision surface.",
    primaryActions: {
      chat: "Open Chat",
      search: "Open Search",
      map: "Open Map",
    },
    trustTitle: "Every verdict links back to source.",
    trustBody:
      "Confidence, timing, yield, and drivers stay visible so the output can be reviewed before it is used.",
    trustPills: ["DLD Sourced", "Cross-referenced Records", "Auditable Lineage", "Governed Access"],
    stats: {
      projects: "Projects scored",
      avgPrice: "Avg. entry price",
      buySignals: "BUY/STRONG_BUY timing",
      dld: "DLD transactions",
      areas: "Area profiles",
      developers: "Tracked developers",
    },
  },
  ar: {
    eyebrow: "استخبارات العقار في الإمارات",
    titleLineOne: "سوق دبي العقاري يتحرك بسرعة.",
    titleLineTwo: "ويجب أن تتحرك بياناتك بالسرعة نفسها.",
    subtitle: "مشاريع مصنفة، وسياق مناطق، وإشارات مطورين داخل سطح قرار واحد ومدعوم بالأدلة.",
    primaryActions: {
      chat: "افتح المحادثة",
      search: "افتح البحث",
      map: "افتح الخريطة",
    },
    trustTitle: "كل حكم مرتبط بمصدره.",
    trustBody:
      "الثقة والتوقيت والعائد ومحركات النتيجة تبقى ظاهرة حتى يمكن مراجعة المخرج قبل استخدامه.",
    trustPills: ["مصدر DLD", "سجلات متقاطعة المراجع", "تتبّع كامل", "وصول محكوم"],
    stats: {
      projects: "مشروع مقيّم",
      avgPrice: "متوسط سعر الدخول",
      buySignals: "إشارات توقيت BUY/STRONG_BUY",
      dld: "معاملة DLD",
      areas: "ملف منطقة",
      developers: "مطور متابع",
    },
  },
} as const

export function HeroSection({
  avgMarketPrice,
  totalProjects,
  buySignals,
  totalAreas,
  ratedDevelopers,
  dldTransactions,
  topProject,
  syncLabel,
}: Props) {
  const locale = useLocale() as AppLocale
  const copy = COPY[locale] ?? COPY.en

  const stats = [
    {
      label: copy.stats.projects,
      value: totalProjects,
      sublabel: locale === "ar" ? "٩٧٪ تغطية درجة A/B" : "97% Grade A/B coverage",
    },
    avgMarketPrice && avgMarketPrice > 0
      ? {
          label: copy.stats.avgPrice,
          value: formatAed(avgMarketPrice, locale, { compact: true }),
          sublabel: locale === "ar" ? `الوسيط عبر ${formatInteger(totalAreas, locale)} منطقة` : `Median across ${formatInteger(totalAreas, locale)} areas`,
        }
      : null,
    {
      label: copy.stats.buySignals,
      value: buySignals,
      sublabel: locale === "ar" ? "يُحدَّث مع كل دورة ETL" : "Refreshed each ETL pass",
    },
    {
      label: copy.stats.dld,
      value: dldTransactions,
      sublabel: locale === "ar" ? "سجل مرجعي موثق" : "Canonical registry",
    },
    {
      label: copy.stats.areas,
      value: totalAreas,
      sublabel: locale === "ar" ? "ثنائية اللغة، معيارية" : "Bilingual, benchmarked",
    },
    {
      label: copy.stats.developers,
      value: ratedDevelopers,
      sublabel: locale === "ar" ? "مصنّفة بالموثوقية" : "Reliability-graded",
    },
  ].filter(Boolean) as Array<{ label: string; value: number | string; sublabel: string }>
  const primaryActions = [
    {
      href: "/chat",
      label: copy.primaryActions.chat,
      icon: Database,
      copilot: true,
    },
    {
      href: "/search",
      label: copy.primaryActions.search,
      icon: Search,
    },
    {
      href: "/map",
      label: copy.primaryActions.map,
      icon: MapPin,
    },
  ]

  return (
    <section className="relative">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
        <div className="flex-1">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" />
            {copy.eyebrow}
          </p>

          <h1 className="font-serif text-4xl font-medium leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {copy.titleLineOne}
            <br />
            <span className="text-primary">{copy.titleLineTwo}</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-[17px]">
            {copy.subtitle}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {primaryActions.map((action) => {
              const Icon = action.icon
              const className =
                "flex items-center justify-between rounded-2xl border border-border/70 bg-card/60 px-5 py-4 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              const content = (
                <>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {action.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </>
              )

              return action.copilot ? (
                <CopilotEntryLink key={action.label} className={className}>
                  {content}
                </CopilotEntryLink>
              ) : (
                <Link
                  key={action.label}
                  href={prefixLocalePath(action.href, locale)}
                  className={className}
                >
                  {content}
                </Link>
              )
            })}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/60 bg-card/50 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">{item.label}</p>
                <span className="mt-2 block text-xl font-semibold tabular-nums text-foreground">
                  {typeof item.value === "number" ? formatInteger(item.value, locale) : item.value}
                </span>
                <span className="mt-1 block text-[11px] text-muted-foreground/60">{item.sublabel}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full shrink-0 space-y-4 lg:w-[360px] xl:w-[420px]">
          {topProject ? (
            <LiveSignalCard
              title={topProject.name}
              area={topProject.area}
              developer={topProject.developer}
              timing={topProject.timing}
              stress={topProject.stress}
              yieldValue={topProject.yieldValue}
              score={topProject.score}
              price={topProject.price}
              updatedLabel={syncLabel}
              slug={topProject.slug}
            />
          ) : null}
          <div className="relative rounded-2xl border border-border/60 bg-card/50 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{copy.trustTitle}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy.trustBody}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {copy.trustPills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-primary"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
