"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConfidenceBadge, ConfidenceLevel } from "@/components/trust/confidence-badge"
import { Database, Clock, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/format/date"
import { TRUST_COPY } from "@/lib/copy/trust"

type EvidenceDrawerProps = {
  sources?: unknown[]
  exclusions?: unknown[]
  assumptions?: unknown[]
  steps?: unknown[]
  title?: string
  confidenceScore?: number
  confidenceLevel?: ConfidenceLevel
  snapshotId?: string
  timestamp?: string
  runId?: string
  snapshotTs?: string
  locale?: string
}

function renderEntry(entry: unknown): { primary: string; secondary?: string } {
  if (entry === null || entry === undefined) return { primary: "—" }
  if (typeof entry === "string") return { primary: entry }
  if (typeof entry === "number" || typeof entry === "boolean") return { primary: String(entry) }
  if (typeof entry === "object") {
    const obj = entry as Record<string, unknown>
    const primary =
      (typeof obj.label === "string" && obj.label) ||
      (typeof obj.name === "string" && obj.name) ||
      (typeof obj.title === "string" && obj.title) ||
      (typeof obj.field === "string" && obj.field) ||
      (typeof obj.metric === "string" && obj.metric) ||
      (typeof obj.source === "string" && obj.source) ||
      "Entry"
    const secondary =
      (typeof obj.detail === "string" && obj.detail) ||
      (typeof obj.description === "string" && obj.description) ||
      (typeof obj.value === "string" && obj.value) ||
      (typeof obj.formula === "string" && obj.formula) ||
      (typeof obj.note === "string" && obj.note) ||
      undefined
    return { primary, secondary }
  }
  return { primary: String(entry) }
}

export function EvidenceDrawer({ 
  sources, 
  exclusions, 
  assumptions, 
  steps,
  title = "Evidence Drawer",
  confidenceScore,
  confidenceLevel,
  snapshotId = "v1.0.4-inventory-spine",
  timestamp,
  runId,
  snapshotTs,
  locale = "en",
}: EvidenceDrawerProps) {
  const [open, setOpen] = useState(false)
  const resolvedTimestamp = snapshotTs || timestamp || new Date().toISOString()
  const isArabic = locale === "ar"
  const copy = {
    title: isArabic ? "درج الأدلة" : TRUST_COPY.evidence_drawer.header,
    expose: isArabic ? "عرض الأدلة" : "Expose Evidence",
    collapse: isArabic ? "إخفاء الأدلة" : "Collapse Intelligence",
    sources: isArabic ? "المصادر" : TRUST_COPY.evidence_drawer.sources_label,
    exclusions: isArabic ? "الاستبعادات" : TRUST_COPY.evidence_drawer.exclusions_label,
    assumptions: isArabic ? "الافتراضات" : TRUST_COPY.evidence_drawer.assumptions_label,
    steps: isArabic ? "خطوات الحساب" : TRUST_COPY.evidence_drawer.steps_label,
    snapshot: isArabic ? "اللقطة" : "Snapshot",
    verified: isArabic ? "التحقق" : "Verified",
    run: isArabic ? "التشغيل" : "Run",
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm">
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/10" />
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">{title || copy.title}</h3>
          <ConfidenceBadge 
            score={confidenceScore} 
            level={confidenceLevel} 
            showLabel={false}
          />
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setOpen((prev) => !prev)}
          className="h-8 text-xs hover:bg-primary/5 hover:text-primary transition-colors"
        >
          {open ? copy.collapse : copy.expose}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {([
              { items: sources, label: copy.sources, dot: "bg-emerald-500", emptyEn: "No source row attached", emptyAr: "لا توجد سجلات مصدر مرفقة" },
              { items: exclusions, label: copy.exclusions, dot: "bg-amber-500", emptyEn: "No exclusions applied", emptyAr: "لا توجد استبعادات مطبَّقة" },
              { items: assumptions, label: copy.assumptions, dot: "bg-sky-500", emptyEn: "No assumptions declared", emptyAr: "لا توجد افتراضات مُعلنة" },
              { items: steps, label: copy.steps, dot: "bg-violet-500", emptyEn: "No calculation trace", emptyAr: "لا يوجد أثر حساب" },
            ] as const).map((column) => {
              const items = Array.isArray(column.items) ? column.items : []
              return (
                <div key={column.label} className="space-y-2">
                  <p className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${column.dot}`} /> {column.label}
                  </p>
                  <div className="rounded-lg border border-border/40 bg-background/40 p-3 max-h-48 overflow-auto custom-scrollbar">
                    {items.length === 0 ? (
                      <p className="text-[11px] italic text-muted-foreground/70">
                        {isArabic ? column.emptyAr : column.emptyEn}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {items.map((entry, i) => {
                          const { primary, secondary } = renderEntry(entry)
                          return (
                            <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                              <ChevronRight className="mt-[2px] h-3 w-3 shrink-0 text-muted-foreground/50" />
                              <span className="min-w-0">
                                <span className="font-medium text-foreground/90">{primary}</span>
                                {secondary ? (
                                  <span className="ml-1 text-muted-foreground/70">— {secondary}</span>
                                ) : null}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Provenance Footer */}
          <div className="pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted-foreground/60 italic">
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3" />
              <span>{copy.snapshot}: <span className="font-mono text-foreground/70">{snapshotId}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>{copy.verified}: {formatDate(
                resolvedTimestamp,
                locale,
                { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
              )}</span>
            </div>
            {runId ? (
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3" />
                <span>{copy.run}: <span className="font-mono text-foreground/70">{runId}</span></span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
