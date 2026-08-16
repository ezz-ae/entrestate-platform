"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, AlertCircle, Compass, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/data-scientist/components/ui/button"
import { DatasetSummary } from "@/data-scientist/components/dataset-summary"
import { ChartGrid } from "@/data-scientist/components/chart-grid"
import { ChartExpandedModal } from "@/data-scientist/components/chart-expanded-modal"
import { getDatasetFromLocalStorage, saveDatasetToLocalStorage } from "@/data-scientist/lib/local-storage"
import type { DatasetProfile, VisSpec } from "@/data-scientist/lib/types"
import type { DashboardSummary } from "@/data-scientist/lib/dashboard-summary"
import Loading from "./loading"
import { DashboardSummaryPanel } from "@/data-scientist/components/dashboard-summary-panel"
import { DashboardChat } from "@/data-scientist/components/dashboard-chat"
import { NotebookPanel } from "@/data-scientist/components/notebook-panel"

function ExploreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const datasetId = searchParams.get("datasetId")

  const [profile, setProfile] = useState<DatasetProfile | null>(null)
  const [overviewCharts, setOverviewCharts] = useState<VisSpec[]>([])
  const [expandedChart, setExpandedChart] = useState<VisSpec | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [rightPanel, setRightPanel] = useState<"briefs" | "chat">("briefs")

  // Fetch dataset profile and overview
  useEffect(() => {
    if (!datasetId) {
      router.push("/workspace/data-scientist")
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // First, try to fetch profile from server
        let profileRes = await fetch(`/api/data-scientist/dataset/profile?datasetId=${datasetId}`)
        
        // If not found, try to restore from localStorage
        if (profileRes.status === 404) {
          const savedDataset = getDatasetFromLocalStorage()
          if (savedDataset && savedDataset.datasetId === datasetId) {
            if ("rows" in savedDataset) {
              // Restore to server memory
              const restoreRes = await fetch("/api/data-scientist/dataset/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(savedDataset),
              })
              if (restoreRes.ok) {
                // Retry fetching profile
                profileRes = await fetch(`/api/data-scientist/dataset/profile?datasetId=${datasetId}`)
              }
            } else {
              const reloadRes = await fetch("/api/data-scientist/dataset/entrestate", { method: "POST" })
              if (reloadRes.ok) {
                const data = await reloadRes.json()
                if (data.storedDataset) {
                  saveDatasetToLocalStorage(data.storedDataset)
                }
                router.replace(`/workspace/data-scientist/explore?datasetId=${data.datasetId}`)
                return
              }
            }
          }
        }
        
        if (!profileRes.ok) {
          if (profileRes.status === 404) {
            throw new Error("Desk not ready. Return home to reload.")
          }
          throw new Error("Failed to load the desk")
        }
        const profileData = await profileRes.json()
        setProfile(profileData)

        // Fetch overview charts
        const overviewRes = await fetch("/api/data-scientist/recommend/overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ datasetId }),
        })
        if (!overviewRes.ok) throw new Error("Failed to generate overview")
        const overviewData = await overviewRes.json()
        setOverviewCharts(overviewData.charts)

        const summaryRes = await fetch("/api/data-scientist/insights/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ datasetId }),
        })
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json()
          setSummary(summaryData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [datasetId, router])

  // Handle chart click - open expanded modal
  const handleChartClick = useCallback((chart: VisSpec) => {
    setExpandedChart(chart)
  }, [])

  // Close modal
  const handleCloseModal = useCallback(() => {
    setExpandedChart(null)
  }, [])

  // Navigate to a new chart from within the modal
  const handleNavigateToChart = useCallback((chart: VisSpec) => {
    // Add the new chart to overview if it's not already there
    setOverviewCharts((prev) => {
      const exists = prev.some((c) => c.id === chart.id)
      if (exists) return prev
      return [chart, ...prev]
    })
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">Loading desk...</p>
        </div>

        {datasetId && (
          <div className="xl:hidden mt-8">
            <NotebookPanel datasetId={datasetId} summary={summary} />
            <div className="mt-6">
              <DashboardChat datasetId={datasetId} />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">{error || "Desk not found"}</p>
          <Button asChild>
            <Link href="/workspace/data-scientist">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to desk home
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-[var(--app-header-height)] z-40">
        <div className="mx-auto flex items-center justify-between h-14 px-6 max-w-[1440px]">
          <div className="flex items-center gap-4">
            <Link
              href="/workspace/data-scientist"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Desk home
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{profile.rowCount ? profile.rowCount.toLocaleString() : "—"}</span>
              <span className="text-sm text-muted-foreground">projects</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              {profile.columns.length} data points
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto px-6 py-6 max-w-[1440px]">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Market Intelligence Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Market signals, saved snapshots, and reusable briefs in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_360px] gap-6">
          {/* Left Panel - Dataset Summary */}
          <aside className="hidden lg:block">
            <DatasetSummary profile={profile} />
          </aside>

          {/* Main Content - Charts */}
          <main className="space-y-8">
            {summary && <DashboardSummaryPanel summary={summary} />}

            <section className="rounded-2xl border border-border/60 bg-muted/30 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Desk flow</p>
                  <h2 className="text-lg font-semibold text-foreground mt-2">Work in three passes</h2>
                </div>
                <span className="text-xs text-muted-foreground">Live desk</span>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                {[
                  {
                    title: "Scan",
                    detail: "Use the market brief to spot the strongest themes.",
                    icon: Compass,
                  },
                  {
                    title: "Compare",
                    detail: "Click a view to compare areas and delivery bands.",
                    icon: BarChart3,
                  },
                  {
                    title: "Brief",
                    detail: "Save a client-ready brief in your notebook.",
                    icon: FileText,
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-border/60 bg-card/60 p-4">
                    <div className="flex items-center gap-2 text-foreground">
                      <item.icon className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold">Market views</h2>
                <span className="text-xs text-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  {overviewCharts.length} views
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Click any view to explore deeper and save snapshots.
              </p>
              <ChartGrid
                charts={overviewCharts}
                selectedChartId={null}
                onSelectChart={handleChartClick}
                emptyMessage="No market views yet."
              />
            </div>

            <div className="xl:hidden space-y-4">
              <div className="flex items-center gap-2">
                {[
                  { id: "briefs", label: "Briefs" },
                  { id: "chat", label: "Chat" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRightPanel(tab.id as "briefs" | "chat")}
                    className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                      rightPanel === tab.id
                        ? "border-foreground/30 bg-muted/60 text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/20"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {datasetId && rightPanel === "briefs" && (
                <NotebookPanel datasetId={datasetId} summary={summary} variant="embedded" />
              )}
              {datasetId && rightPanel === "chat" && (
                <DashboardChat datasetId={datasetId} variant="embedded" />
              )}
            </div>
          </main>

          <aside className="hidden xl:flex flex-col gap-4">
            <div className="flex items-center gap-2">
              {[
                { id: "briefs", label: "Briefs" },
                { id: "chat", label: "Chat" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRightPanel(tab.id as "briefs" | "chat")}
                  className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                    rightPanel === tab.id
                      ? "border-foreground/30 bg-muted/60 text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/20"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {datasetId && rightPanel === "briefs" && (
              <NotebookPanel datasetId={datasetId} summary={summary} variant="embedded" />
            )}
            {datasetId && rightPanel === "chat" && (
              <DashboardChat datasetId={datasetId} variant="embedded" />
            )}
          </aside>
        </div>
      </div>

      {/* Expanded Chart Modal */}
      {expandedChart && profile && datasetId && (
        <ChartExpandedModal
          chart={expandedChart}
          profile={profile}
          datasetId={datasetId}
          onClose={handleCloseModal}
          onNavigateToChart={handleNavigateToChart}
        />
      )}
    </div>
  )
}

export default function ExplorePage() {
  return (
    <main id="main-content">
      <Navbar />
      <Suspense fallback={<Loading />}>
        <ExploreContent />
      </Suspense>
      <Footer />
    </main>
  )
}
