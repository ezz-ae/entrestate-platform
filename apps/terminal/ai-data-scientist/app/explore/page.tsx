"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DatasetSummary } from "@/components/dataset-summary"
import { ChartGrid } from "@/components/chart-grid"
import { ChartExpandedModal } from "@/components/chart-expanded-modal"
import { getDatasetFromLocalStorage, saveDatasetToLocalStorage } from "@/lib/local-storage"
import type { DatasetProfile, VisSpec } from "@/lib/types"
import type { DashboardSummary } from "@/lib/dashboard-summary"
import Loading from "./loading"
import { DashboardSummaryPanel } from "@/components/dashboard-summary-panel"
import { DashboardChat } from "@/components/dashboard-chat"

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

  // Fetch dataset profile and overview
  useEffect(() => {
    if (!datasetId) {
      router.push("/")
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // First, try to fetch profile from server
        let profileRes = await fetch(`/api/dataset/profile?datasetId=${datasetId}`)
        
        // If not found, try to restore from localStorage
        if (profileRes.status === 404) {
          const savedDataset = getDatasetFromLocalStorage()
          if (savedDataset && savedDataset.datasetId === datasetId) {
            if ("rows" in savedDataset) {
              const restoreRes = await fetch("/api/dataset/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(savedDataset),
              })
              if (restoreRes.ok) {
                profileRes = await fetch(`/api/dataset/profile?datasetId=${datasetId}`)
              }
            } else {
              const reloadRes = await fetch("/api/dataset/entrestate", { method: "POST" })
              if (reloadRes.ok) {
                const data = await reloadRes.json()
                if (data.storedDataset) {
                  saveDatasetToLocalStorage(data.storedDataset)
                }
                router.replace(`/explore?datasetId=${data.datasetId}`)
                return
              }
            }
          }
        }
        
        if (!profileRes.ok) {
          if (profileRes.status === 404) {
            throw new Error("Market desk not found. Return to reload.")
          }
          throw new Error("Couldn't load the market desk.")
        }
        const profileData = await profileRes.json()
        setProfile(profileData)

        // Fetch overview charts
        const overviewRes = await fetch("/api/recommend/overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ datasetId }),
        })
        if (!overviewRes.ok) throw new Error("Failed to generate overview")
        const overviewData = await overviewRes.json()
        setOverviewCharts(overviewData.charts)

        const summaryRes = await fetch("/api/insights/summary", {
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
          <p className="text-muted-foreground">Loading market desk...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">{error || "Market desk not found"}</p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to market desk
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Market desk
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary">{profile.rowCount.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">projects</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              {profile.columns.length} signals
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Market Intelligence Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Clear market signals for brokers.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_320px] gap-6">
          {/* Left Panel - Dataset Summary */}
          <aside className="hidden lg:block">
            <DatasetSummary profile={profile} />
          </aside>

          {/* Main Content - Charts */}
          <main className="space-y-8">
            {summary && <DashboardSummaryPanel summary={summary} />}

            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold">Market patterns</h2>
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {overviewCharts.length} views
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Click any view to explore deeper market patterns.
              </p>
              <ChartGrid
                charts={overviewCharts}
                selectedChartId={null}
                onSelectChart={handleChartClick}
                emptyMessage="No market views yet."
              />
            </div>
          </main>

          <aside className="hidden xl:block">
            {datasetId && <DashboardChat datasetId={datasetId} />}
          </aside>
        </div>

        {datasetId && (
          <div className="xl:hidden mt-8">
            <DashboardChat datasetId={datasetId} />
          </div>
        )}
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
    <Suspense fallback={<Loading />}>
      <ExploreContent />
    </Suspense>
  )
}
