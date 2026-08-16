"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Database, ShieldCheck, LineChart, BookOpen, FileText, Sparkles } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ExplainWithChat } from "@/components/explain-with-chat"
import { Button } from "@/data-scientist/components/ui/button"
import { getDatasetFromLocalStorage, clearDatasetFromLocalStorage } from "@/data-scientist/lib/local-storage"
import { saveDatasetToLocalStorage } from "@/data-scientist/lib/local-storage"
import type { MarketScoreSummary } from "@/lib/market-score/types"

export default function DataScientistPage() {
  const router = useRouter()
  const [savedDatasetId, setSavedDatasetId] = useState<string | null>(null)
  const [isLoadingEntrestate, setIsLoadingEntrestate] = useState(false)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [snapshot, setSnapshot] = useState<MarketScoreSummary | null>(null)
  const [snapshotError, setSnapshotError] = useState<string | null>(null)
  const topSafetyBand = snapshot?.safetyDistribution?.reduce<{ label: string; count: number } | null>(
    (best, item) => (!best || item.count > best.count ? item : best),
    null,
  )?.label

  // Check for saved dataset on mount
  useEffect(() => {
    const saved = getDatasetFromLocalStorage()
    if (saved?.datasetId) {
      setSavedDatasetId(saved.datasetId)
    }
  }, [])

  useEffect(() => {
    const loadSnapshot = async () => {
      try {
        const res = await fetch("/api/market-score/summary")
        if (!res.ok) throw new Error("Snapshot unavailable")
        const data = await res.json()
        setSnapshot(data)
      } catch (error) {
        setSnapshotError(error instanceof Error ? error.message : "Snapshot unavailable")
      }
    }

    loadSnapshot()
  }, [])

  const handleContinue = () => {
    if (savedDatasetId) {
      router.push(`/workspace/data-scientist/explore?datasetId=${savedDatasetId}`)
    }
  }

  const handleClearSaved = () => {
    clearDatasetFromLocalStorage()
    setSavedDatasetId(null)
  }

  const handleLoadEntrestate = async () => {
    setIsLoadingEntrestate(true)
    try {
      const res = await fetch("/api/data-scientist/dataset/entrestate", { method: "POST" })
      if (!res.ok) throw new Error("Failed to load the Entrestate market engine")
      const data = await res.json()

      if (data.storedDataset) {
        saveDatasetToLocalStorage(data.storedDataset)
      }

      router.push(`/workspace/data-scientist/explore?datasetId=${data.datasetId}`)
    } catch (error) {
      console.error("Failed to load the Entrestate market engine:", error)
    } finally {
      setIsLoadingEntrestate(false)
    }
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="min-h-screen bg-background relative overflow-hidden pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 via-transparent to-slate-400/10 pointer-events-none" />

        <div className="relative mx-auto w-full max-w-[1440px] px-6 py-16 lg:py-20">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1 text-sm text-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/50 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground/70" />
              </span>
              Market Intelligence Desk
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
              Market Intelligence Desk
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Move step by step: activate the desk, explore signals, then build briefs and reuse them.
            </p>
            <ExplainWithChat prompt="Explain how the Market Intelligence Desk works and what each step means." />
          </div>

          <div className="mt-10 rounded-2xl border border-border/70 bg-card/60 p-6">
            <div className="flex flex-wrap gap-3">
              {[
                { id: 1, label: "1. Activate" },
                { id: 2, label: "2. Explore" },
                { id: 3, label: "3. Briefs" },
              ].map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id as 1 | 2 | 3)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    activeStep === step.id
                      ? "border-foreground/30 bg-muted/60 text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/20"
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>

          <section className="mt-8 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-7">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Live market snapshot</p>
              <h2 className="text-lg font-semibold text-foreground mt-2">Connected to the market spine</h2>
              <p className="text-sm text-muted-foreground mt-2">
                A quick read from the live scoring feed so you know the data is live.
              </p>
              {snapshot && snapshot.totalAssets && snapshot.conservativeReadyPool ? (
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Projects scored</p>
                    <p className="text-lg font-semibold text-foreground mt-2">{snapshot.totalAssets.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Overall quality score</p>
                    <p className="text-lg font-semibold text-foreground mt-2">
                      {Number.isFinite(snapshot.avgScore) ? snapshot.avgScore.toFixed(1) : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Top safety band</p>
                    <p className="text-sm font-medium text-foreground mt-2">
                      {topSafetyBand ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Conservative ready set</p>
                    <p className="text-sm font-medium text-foreground mt-2">
                      {snapshot.conservativeReadyPool.toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-sm text-muted-foreground">
                  {snapshotError ?? "Loading snapshot..."}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-7">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Activation status</p>
              <p className="text-sm text-muted-foreground">
                {savedDatasetId
                  ? "Your desk is active. Continue where you left off."
                  : "Activate the desk to unlock market views and notebooks."}
              </p>
              {savedDatasetId && (
                <div className="mt-6 rounded-xl border border-border/60 bg-muted/40 p-4 text-sm text-foreground">
                  Last session ready · Session ID {savedDatasetId}
                </div>
              )}
            </div>
          </section>

          {activeStep === 1 && (
            <section className="mt-8 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-7">
                <h2 className="text-lg font-semibold text-foreground">Activate the market desk</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Load the market record once. This unlocks the live views and briefs.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleLoadEntrestate}
                    disabled={isLoadingEntrestate}
                    className="border-border/60 hover:bg-muted/40 hover:border-foreground/20 bg-transparent"
                  >
                    {isLoadingEntrestate ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4 text-foreground" />
                        Activate desk
                      </>
                    )}
                  </Button>
                  {savedDatasetId && (
                    <Button size="sm" onClick={handleContinue} className="bg-primary hover:bg-primary/90">
                      Open desk
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
                {savedDatasetId && (
                  <div className="mt-6 rounded-xl border border-border/60 bg-muted/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-muted/50 p-2">
                          <Database className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Desk is active</p>
                          <p className="text-xs text-muted-foreground">Continue with your last session</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handleClearSaved}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/60 p-7">
                <h3 className="text-sm font-medium text-foreground mb-3">What this unlocks</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <LineChart className="h-4 w-4 text-foreground mt-0.5" />
                    <span>Market views that summarize price, delivery, and risk in one pass.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-4 w-4 text-foreground mt-0.5" />
                    <span>Verified signals so you focus on the strongest evidence.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-4 w-4 text-foreground mt-0.5" />
                    <span>Notebook-ready snapshots with client-ready language.</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeStep === 2 && (
            <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-7">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <LineChart className="h-4 w-4 text-foreground" />
                  Market views
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Slice pricing bands, delivery windows, liquidity timelines, and safety bands in one screen.
                </p>
                <Button
                  size="sm"
                  className="mt-6 bg-primary hover:bg-primary/90"
                  onClick={handleContinue}
                  disabled={!savedDatasetId}
                >
                  Open market views
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {!savedDatasetId && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Activate the desk first to unlock views.
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-7">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  Focus signals
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    "Delivery confidence",
                    "Price pressure",
                    "Developer execution",
                    "Liquidity timeline",
                    "Capital efficiency",
                    "Market discount markers",
                  ].map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 rounded-full border border-border/60 text-muted-foreground bg-muted/40"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeStep === 3 && (
            <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-7">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <BookOpen className="h-4 w-4 text-foreground" />
                  Notebook flow
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Save snapshots with notes and reuse them in client briefs or team updates.
                </p>
                <Button size="sm" variant="secondary" asChild className="mt-6">
                  <Link href="/workspace/data-scientist/notebook">Open notebook</Link>
                </Button>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-7 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-foreground" />
                  <p className="text-sm font-medium text-foreground">Brief builder</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Every snapshot becomes a reusable paragraph. Combine them into a client brief in minutes.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-foreground" />
                  Notebook-ready briefs with market language.
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
