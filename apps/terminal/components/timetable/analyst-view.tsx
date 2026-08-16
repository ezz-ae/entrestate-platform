"use client"

import { useState } from "react"
import { TimeTableRow } from "@/lib/timetable/model"
import { TimeTableView } from "./table-view"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Evidence } from "@/lib/timetable/evidence"
import { Badge } from "@/components/ui/badge"

type AnalystViewProps = {
  narrative: string
  citations: any[]
  rows: TimeTableRow[]
  columns: { key: string; label: string }[]
  evidence?: Evidence
}

export function AnalystView({ narrative, citations, rows, columns, evidence }: AnalystViewProps) {
  const [highlightedRowIds, setHighlightedRowIds] = useState<string[]>([])
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false)
  const [activeCitationDescription, setActiveCitationDescription] = useState<string | null>(null)

  const handleCitationClick = (citationId: string) => {
    const citation = citations.find(c => c.id === citationId)
    if (citation) {
      setHighlightedRowIds(citation.rowIds)
      setActiveCitationDescription(typeof citation.description === "string" ? citation.description : null)
      setIsEvidenceOpen(true)
    }
  }

  // Simple parser to make [cit-X] clickable in narrative
  const renderNarrative = () => {
    const parts = narrative.split(/(\[cit-\d+\])/g)
    return parts.map((part, i) => {
      const match = part.match(/\[cit-(\d+)\]/)
      if (match) {
        const citId = `cit-${match[1]}`
        return (
          <button
            key={i}
            onClick={() => handleCitationClick(citId)}
            className="mx-1 rounded bg-primary/10 px-1 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
          >
            {part}
          </button>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4 overflow-hidden">
      {/* Left Pane: Narrative & Evidence */}
      <div className="flex w-1/3 flex-col gap-4">
        <Card className="flex-1 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Market Note</h3>
          <ScrollArea className="h-full pr-4 text-sm leading-relaxed">
            {renderNarrative()}
          </ScrollArea>
        </Card>

        {isEvidenceOpen && evidence && (
          <Card className="h-1/3 p-6 bg-secondary/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Evidence Drawer</h3>
              <button onClick={() => setIsEvidenceOpen(false)} className="text-xs hover:underline">Close</button>
            </div>
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 text-xs">
                {activeCitationDescription ? (
                  <div>
                    <p className="font-bold mb-1">Active citation:</p>
                    <p className="opacity-70">{activeCitationDescription}</p>
                  </div>
                ) : null}
                <div>
                  <p className="font-bold mb-1">Sources:</p>
                  <ul className="list-disc list-inside opacity-70">
                    {evidence.sources.map((s, i) => <li key={i}>{s.name} ({new Date(s.timestamp).toLocaleDateString()})</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-bold mb-1">Exclusions:</p>
                  <ul className="list-disc list-inside opacity-70">
                    {evidence.exclusions.map((e, i) => <li key={i}>{e.rule}: {e.count} records removed</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-bold mb-1">Assumptions:</p>
                  <ul className="list-disc list-inside opacity-70">
                    {evidence.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-bold mb-1">Calculations:</p>
                  <ul className="list-disc list-inside opacity-70">
                    {evidence.calculations.map((calc, i) => <li key={i}>{calc.metric}: {calc.formula}</li>)}
                  </ul>
                </div>
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>

      {/* Right Pane: Table Data */}
      <div className="flex-1">
        <Card className="h-full overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-card flex justify-between items-center">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Time Table Results</h3>
            {highlightedRowIds.length > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {highlightedRowIds.length} rows cited
              </Badge>
            )}
          </div>
          <ScrollArea className="flex-1">
            <TimeTableView 
              rows={rows} 
              columns={columns} 
              highlightedRowIds={highlightedRowIds}
            />
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}
