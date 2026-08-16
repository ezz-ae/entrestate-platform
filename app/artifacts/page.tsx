"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FileOutput, Presentation, FileSpreadsheet, Loader2, Download } from "lucide-react"

type DecisionObj = {
  id: string
  type: string
  version: number
  status: string
  createdAt: string
  timetable?: { title: string } | null
}

const typeLabels: Record<string, string> = {
  report: "PDF Report",
  presentation: "PPT Deck",
  memo: "Memo",
  widget: "Embed Widget",
  contract: "Contract Draft",
}

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<DecisionObj[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/artifacts")
      .then((res) => (res.ok ? res.json() : { artifacts: [] }))
      .then((data) => setArtifacts(data.artifacts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Artifacts</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-serif text-foreground">Outputs that travel with evidence.</h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
              Artifacts package Time Tables and notes into shareable formats with tier-aware branding.
            </p>
          </header>

          <section className="mb-8 rounded-2xl border border-border/70 bg-card/60 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Embed Widgets</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Distribution surfaces with locked free-tier branding.</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Use `/api/embed` to deliver overlay-first widgets that preserve the broker page, expose only approved columns, and keep the Entrestate badge locked on free tier.
                </p>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                Overlay mode • 1h cache • dual capture ready
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                { name: "market_card", detail: "Single-asset signal card for pages and sidebars." },
                { name: "area_table", detail: "Compact area comparison table with exposed columns only." },
                { name: "score_badge", detail: "Confidence-safe score chip for listings and CRM views." },
                { name: "market_pulse", detail: "Live market pulse summary for portals and newsletters." },
              ].map((widget) => (
                <div key={widget.name} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <p className="font-mono text-xs text-primary">{widget.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{widget.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-border/60 bg-background/30 p-4 text-xs text-muted-foreground">
              `data-interaction="overlay"` and `data-lead-magnet="true"` are supported in `packages/embed`, with broker webhook dual-capture through `data-lead-webhook`.
            </div>
          </section>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : artifacts.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-border/70 bg-card/30 p-12 text-center">
                <FileOutput className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No artifacts generated yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use the terminal to generate PDFs, decks, or widgets from your Time Tables.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "PDF Reports", detail: "Investor-ready briefs with provenance and citations.", icon: FileOutput },
                  { title: "PPT Decks", detail: "Slides synced to Time Tables and Market Files.", icon: Presentation },
                  { title: "CSV + Embed", detail: "Exports and widgets for client portals.", icon: FileSpreadsheet },
                ].map((card) => (
                  <div key={card.title} className="rounded-2xl border border-border/70 bg-card/70 p-6">
                    <card.icon className="h-5 w-5 text-accent" />
                    <h2 className="mt-4 text-lg font-semibold text-foreground">{card.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 p-5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {typeLabels[artifact.type] ?? artifact.type}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          artifact.status === "ready"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {artifact.status}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-sm font-medium text-foreground">
                      {artifact.timetable?.title ?? `Artifact v${artifact.version}`}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Created {new Date(artifact.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
