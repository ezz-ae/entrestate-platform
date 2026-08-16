"use client"

import { useEffect, useMemo, useState } from "react"
import { Clipboard, NotebookPen, Trash2 } from "lucide-react"
import { Button } from "@/data-scientist/components/ui/button"
import type { DashboardSummary } from "@/data-scientist/lib/dashboard-summary"
import {
  clearNotebookEntries,
  getNotebookEntries,
  removeNotebookEntry,
  type NotebookEntry,
} from "@/data-scientist/lib/notebook"
import { buildReportDraft } from "@/data-scientist/lib/report-builder"

interface NotebookPanelProps {
  datasetId?: string | null
  summary?: DashboardSummary | null
  variant?: "default" | "embedded"
}

export function NotebookPanel({ datasetId, summary, variant = "default" }: NotebookPanelProps) {
  const [entries, setEntries] = useState<NotebookEntry[]>([])
  const [reportTitle, setReportTitle] = useState("Market Brief")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setEntries(getNotebookEntries())
  }, [])

  const filteredEntries = useMemo(() => {
    if (!datasetId) return entries
    return entries.filter((entry) => !entry.datasetId || entry.datasetId === datasetId)
  }, [datasetId, entries])

  const reportDraft = useMemo(
    () =>
      buildReportDraft({
        title: reportTitle.trim() || "Market Brief",
        summary,
        entries: filteredEntries,
      }),
    [reportTitle, summary, filteredEntries],
  )

  const handleRemove = (id: string) => {
    setEntries(removeNotebookEntry(id))
  }

  const handleClear = () => {
    clearNotebookEntries()
    setEntries([])
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportDraft)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const containerClass =
    variant === "embedded"
      ? "space-y-4"
      : "border border-border/50 bg-card/50 rounded-lg p-5 space-y-4"

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Notebook</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={entries.length === 0}>
          Clear
        </Button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wider">Brief title</label>
        <input
          value={reportTitle}
          onChange={(event) => setReportTitle(event.target.value)}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            Save a market view to start a brief. Your snapshots appear here.
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border/60 bg-background/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{entry.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{entry.summary}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(entry.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {entry.highlights.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {entry.highlights.slice(0, 3).map((item, index) => (
                    <li key={`${entry.id}-hl-${index}`} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>

      <div className="rounded-lg border border-border/60 bg-background/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Brief draft</p>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Clipboard className="mr-2 h-4 w-4" />
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
          {reportDraft}
        </pre>
      </div>
    </div>
  )
}
