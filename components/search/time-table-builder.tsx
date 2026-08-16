"use client"

import { useMemo, useState } from "react"
import { Route, Loader2, Sparkles, Table2 } from "lucide-react"
import { AnalystView } from "@/components/timetable/analyst-view"
import { Badge } from "@/components/ui/badge"
import type { AppLocale } from "@/i18n/locale"
import type { Evidence } from "@/lib/timetable/evidence"
import type { TableSpec, TableSpecGoldenPath } from "@/lib/tablespec"
import type { TimeTableMaterializedRow } from "@/lib/time-table/types"
import {
  buildTimeTableCitations,
  buildTimeTableColumns,
  buildTimeTableNarrative,
  type TimeTableCitation,
  type TimeTableColumn,
} from "@/lib/time-table/presentation"

type BuilderPreviewPayload = {
  metadata: {
    hash: string
    rowCount: number
    spec: TableSpec
  }
  rows: TimeTableMaterializedRow[]
  requestId?: string
}

type BuilderSummaryPayload = {
  summary: string
  highlights: string[]
  nextActions: string[]
  narrative: string
  citations: TimeTableCitation[]
  evidence?: Evidence
  degraded?: boolean
  warning?: string
  requestId?: string
}

const GOLDEN_PATHS: Array<{
  id: TableSpecGoldenPath
  label: { en: string; ar: string }
  description: { en: string; ar: string }
}> = [
  {
    id: "underwrite_development_site",
    label: { en: "Underwrite site", ar: "تقييم موقع التطوير" },
    description: {
      en: "Build a site-underwriting table with price, handover, risk, and area size signals.",
      ar: "ابنِ جدول تقييم لموقع التطوير مع إشارات السعر والتسليم والمخاطر والمساحة.",
    },
  },
  {
    id: "compare_area_yields",
    label: { en: "Compare yields", ar: "مقارنة العوائد" },
    description: {
      en: "Compile an area-level yield comparison table for fast market screening.",
      ar: "أنشئ جدول مقارنة عوائد على مستوى المناطق لفرز السوق بسرعة.",
    },
  },
  {
    id: "draft_spa_contract",
    label: { en: "Draft SPA scope", ar: "صياغة نطاق SPA" },
    description: {
      en: "Build an asset-level table for purchase and SPA review workstreams.",
      ar: "أنشئ جدولًا على مستوى الأصل لمسارات الشراء ومراجعة عقد SPA.",
    },
  },
]

function buildLocalNarrative(preview: BuilderPreviewPayload) {
  const citations = buildTimeTableCitations(preview.metadata.spec, preview.rows)
  return {
    citations,
    narrative: buildTimeTableNarrative({
      spec: preview.metadata.spec,
      summary: `Built a live Time Table for ${preview.metadata.spec.intent}.`,
      highlights: [
        `The current preview contains ${preview.rows.length} rows ready for analyst review.`,
        preview.metadata.spec.reasoning ?? "The table is ready for evidence-backed review.",
      ],
      citations,
    }),
  }
}

export function SearchTimeTableBuilder({ locale }: { locale: AppLocale }) {
  const isArabic = locale === "ar"
  const [intent, setIntent] = useState("")
  const [selectedPath, setSelectedPath] = useState<TableSpecGoldenPath>("compare_area_yields")
  const [preview, setPreview] = useState<BuilderPreviewPayload | null>(null)
  const [summary, setSummary] = useState<BuilderSummaryPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copy = {
    eyebrow: isArabic ? "منشئ Time Table" : "Time Table Builder",
    title: isArabic ? "حوّل البحث إلى جدول قابل للدفاع" : "Turn search into a defensible Time Table",
    body: isArabic
      ? "ابدأ بمسار جاهز أو اكتب نية مخصصة. ستحصل على مذكرة قصيرة مع citations قابلة للنقر وجدول صفوف يمكن تمييزه."
      : "Start with a Golden Path or write a custom intent. You get a short analyst note, clickable citations, and a row-highlightable table.",
    inputPlaceholder: isArabic
      ? "مثال: قارن عوائد دبي مارينا وJVC تحت 2.5M"
      : "Example: Compare Dubai Marina and JVC yields under 2.5M",
    build: isArabic ? "بناء الجدول" : "Build table",
    loading: isArabic ? "جارٍ بناء الجدول..." : "Building table...",
    rowCount: isArabic ? "صفوف" : "Rows",
    hash: isArabic ? "بصمة" : "Hash",
    source: isArabic ? "مصدر" : "Source",
    note: isArabic ? "مذكرة" : "Notebook note",
    nextActions: isArabic ? "الخطوات التالية" : "Next actions",
    fallback: isArabic ? "ملخص احتياطي" : "Deterministic fallback",
  }

  const columns = useMemo<TimeTableColumn[]>(
    () => buildTimeTableColumns(preview?.rows ?? [], preview?.metadata.spec?.signals ?? []),
    [preview],
  )

  const resolvedSummary = useMemo(() => {
    if (summary) return summary
    if (!preview) return null
    const local = buildLocalNarrative(preview)
    return {
      summary: "",
      highlights: [],
      nextActions: [],
      narrative: local.narrative,
      citations: local.citations,
    } satisfies BuilderSummaryPayload
  }, [preview, summary])

  async function buildTable(params: { goldenPath?: TableSpecGoldenPath; intent?: string }) {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        goldenPath: params.goldenPath,
        intent: params.intent,
        useLLM: false,
        limit: 8,
      }

      const [previewResponse, summaryResponse] = await Promise.all([
        fetch("/api/time-table/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch("/api/time-table/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ])

      const previewPayload = await previewResponse.json().catch(() => ({}))
      const summaryPayload = await summaryResponse.json().catch(() => ({}))

      if (!previewResponse.ok) {
        throw new Error(typeof previewPayload?.error === "string" ? previewPayload.error : "Failed to build Time Table.")
      }

      setPreview(previewPayload as BuilderPreviewPayload)
      if (summaryResponse.ok) {
        setSummary(summaryPayload as BuilderSummaryPayload)
      } else {
        const local = buildLocalNarrative(previewPayload as BuilderPreviewPayload)
        setSummary({
          summary: "",
          highlights: [],
          nextActions: [],
          narrative: local.narrative,
          citations: local.citations,
          degraded: true,
          warning: typeof summaryPayload?.error === "string" ? summaryPayload.error : undefined,
        })
      }
    } catch (buildError) {
      setPreview(null)
      setSummary(null)
      setError(buildError instanceof Error ? buildError.message : "Failed to build Time Table.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-10 rounded-3xl border border-border/60 bg-card/60 p-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground md:text-3xl">{copy.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
        </div>
        {resolvedSummary?.requestId ? (
          <Badge variant="outline" className="w-fit text-[10px] font-mono">
            request {resolvedSummary.requestId}
          </Badge>
        ) : preview?.requestId ? (
          <Badge variant="outline" className="w-fit text-[10px] font-mono">
            request {preview.requestId}
          </Badge>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {GOLDEN_PATHS.map((path) => (
          <button
            key={path.id}
            onClick={() => {
              setSelectedPath(path.id)
              void buildTable({ goldenPath: path.id })
            }}
            disabled={loading}
            className={`rounded-2xl border p-4 text-left transition ${
              selectedPath === path.id
                ? "border-primary/40 bg-primary/10"
                : "border-border/50 bg-background/50 hover:border-border"
            }`}
          >
            <div className="flex items-center gap-2 text-primary">
              <Route className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {isArabic ? path.label.ar : path.label.en}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isArabic ? path.description.ar : path.description.en}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Sparkles className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && intent.trim()) {
                void buildTable({ intent: intent.trim() })
              }
            }}
            placeholder={copy.inputPlaceholder}
            className="h-12 w-full rounded-2xl border border-border/60 bg-background/60 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <button
          onClick={() => void buildTable(intent.trim() ? { intent: intent.trim() } : { goldenPath: selectedPath })}
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Table2 className="h-4 w-4" />}
          {loading ? copy.loading : copy.build}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-rose-500">{error}</p>
      ) : null}

      {preview ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">{copy.rowCount}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{preview.rows.length}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">{copy.hash}</p>
              <p className="mt-2 font-mono text-sm text-foreground">{preview.metadata.hash.slice(0, 12)}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">{copy.source}</p>
              <p className="mt-2 text-sm text-foreground">{preview.metadata.spec.dataSource ?? "L2 Derived"}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">{copy.note}</p>
              <p className="mt-2 text-sm text-foreground">{preview.metadata.spec.intent}</p>
            </div>
          </div>

          {resolvedSummary?.degraded ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <span className="font-medium">{copy.fallback}.</span> {resolvedSummary.warning ?? ""}
            </div>
          ) : null}

          <AnalystView
            narrative={resolvedSummary?.narrative ?? ""}
            citations={resolvedSummary?.citations ?? []}
            rows={preview.rows}
            columns={columns}
            evidence={resolvedSummary?.evidence}
          />

          {resolvedSummary?.nextActions?.length ? (
            <div className="rounded-2xl border border-border/50 bg-background/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                {copy.nextActions}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {resolvedSummary.nextActions.map((action) => (
                  <Badge key={action} variant="outline" className="text-xs">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
