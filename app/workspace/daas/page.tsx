"use client"

import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ExplainWithChat } from "@/components/explain-with-chat"
import {
  ArrowRight,
  Database,
  Plug,
  Download,
  LineChart,
  ShieldCheck,
  Building2,
  Activity,
  Home,
  Wallet,
} from "lucide-react"
import { formatAed } from "@/lib/format/currency"
import { formatInteger } from "@/lib/format/number"

type DashboardResponse = {
  source: string
  overview: {
    total_projects: number
    portfolio_value: number
    avg_price: number | null
    avg_yield: number | null
    avg_appreciation: number | null
  }
  market_health: {
    undersupplied_pct: number | null
    high_confidence_pct: number | null
    avg_liquidity: number | null
  }
  top_areas_by_yield: Array<{ label: string; value: number | null }>
  alerts: string[]
}

const products = [
  {
    title: "Market Listing Feed",
    description: "Full market inventory with pricing, delivery bands, and liquidity signals.",
    icon: Database,
    outputs: ["Project inventory", "Pricing bands", "Delivery windows", "Liquidity signals"],
  },
  {
    title: "Market Analysis Pack",
    description: "Deep analytics for any area, city, or developer with comparisons.",
    icon: LineChart,
    outputs: ["Area snapshots", "Pricing pressure", "Yield bands", "Market change flags"],
  },
  {
    title: "Developer Intelligence",
    description: "Execution history, delivery confidence, and project behavior.",
    icon: Building2,
    outputs: ["Execution history", "Delivery confidence", "Portfolio behavior"],
  },
  {
    title: "Rental Pricing Signals",
    description: "Rent estimates, ranges, and demand signals by project or area.",
    icon: Home,
    outputs: ["Rent bands", "Occupancy signals", "Pricing comparisons"],
  },
  {
    title: "Secondary Market Signals",
    description: "Resale pricing, liquidity, and comparable performance.",
    icon: Wallet,
    outputs: ["Resale bands", "Liquidity scores", "Comparable deals"],
  },
  {
    title: "Market Intelligence Briefing",
    description: "KPIs, distributions, and alerts for leadership reporting.",
    icon: Activity,
    outputs: ["City KPIs", "Risk mix", "Delivery outlook"],
  },
]

const deliveryOptions = [
  {
    title: "Data feed access",
    description: "Pull data directly into your CRM, BI, or internal platform.",
    icon: Plug,
  },
  {
    title: "Plug-ins",
    description: "Use ready connectors for reporting, dashboards, and teams.",
    icon: Database,
  },
  {
    title: "Data packs",
    description: "Download structured files for offline modeling and reports.",
    icon: Download,
  },
]

const outcomes = [
  {
    title: "Higher trust with clients",
    detail: "Show evidence, not opinions. Every recommendation is backed by data.",
    icon: ShieldCheck,
  },
  {
    title: "Faster response time",
    detail: "Instantly answer pricing, yield, and delivery questions.",
    icon: Activity,
  },
  {
    title: "Better inventory match",
    detail: "Use safety and liquidity signals to guide buyers correctly.",
    icon: LineChart,
  },
]

const requestTemplate = `POST /api/daas
{
  "product": "listing_feed",
  "params": {
    "city": "Dubai",
    "area": "Business Bay",
    "min_price": 900000,
    "max_price": 1800000,
    "status": "2025"
  }
}`

export default function MarketDataIntegrationPage() {
  const locale = useLocale()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const loadDashboard = async () => {
      try {
        const res = await fetch("/api/daas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: "dashboard", params: {} }),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("Live feed unavailable")
        const data = await res.json()
        setDashboard(data.result as DashboardResponse)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setDashboardError(error instanceof Error ? error.message : "Live feed unavailable")
      } finally {
        setIsLoadingDashboard(false)
      }
    }

    loadDashboard()
    return () => controller.abort()
  }, [])

  const formatNumber = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return "—"
    return formatInteger(value, locale)
  }

  const formatPercent = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) return "—"
    return `${value.toFixed(1)}%`
  }

  const liveExample = dashboard
    ? {
        total_projects: dashboard.overview.total_projects,
        avg_price_aed: dashboard.overview.avg_price,
        avg_yield: dashboard.overview.avg_yield,
        avg_appreciation: dashboard.overview.avg_appreciation,
        top_areas_by_yield: dashboard.top_areas_by_yield.slice(0, 3),
        alerts: dashboard.alerts.slice(0, 3),
      }
    : null

  const metricTones = ["bg-muted/30", "bg-card/60", "bg-secondary/30", "bg-muted/20"]

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="mx-auto w-full max-w-[1440px] px-6">
          <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-10 items-start mb-14">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">
                Market Data Integration
              </p>
              <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
                Structured market data for operating teams.
              </h1>
              <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
                Use Entrestate data across your site, CRM, and reporting stack. Structured delivery, reusable outputs,
                and live coverage in one layer.
              </p>
              <div className="mt-4">
                <ExplainWithChat prompt="Explain the Market Data Integration product, what it includes, and who it is for." />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/contact">
                    Request access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/docs">View data schema</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">What you receive</p>
              <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Database className="w-4 h-4 text-accent mt-0.5" />
                  <span>Clean inventory data with delivery, liquidity, and safety bands.</span>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-accent mt-0.5" />
                  <span>Verified developer execution signals and market pressure indicators.</span>
                </div>
                <div className="flex items-start gap-3">
                  <LineChart className="w-4 h-4 text-accent mt-0.5" />
                  <span>Ready for decision teams, sales desks, and client reporting.</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/60 p-7 mb-12">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Live data coverage</p>
                <h2 className="text-xl font-semibold text-foreground">Verified market feed</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard ? `Source: ${dashboard.source}` : isLoadingDashboard ? "Connecting…" : "Feed not ready"}
              </p>
            </div>

            {dashboard ? (
              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Projects covered", value: formatNumber(dashboard.overview.total_projects) },
                    { label: "Average price", value: formatAed(dashboard.overview.avg_price, locale, { compact: true, fallback: "—" }) },
                    { label: "Average yield", value: formatPercent(dashboard.overview.avg_yield) },
                    { label: "Average appreciation", value: formatPercent(dashboard.overview.avg_appreciation) },
                  ].map((item, index) => (
                    <div
                      key={item.label}
                      className={`rounded-xl border border-border/60 p-4 ${metricTones[index % metricTones.length]}`}
                    >
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-semibold text-foreground mt-2">{item.value}</p>
                    </div>
                  ))}
                  <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 md:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Market health</p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                        <p className="text-xs text-muted-foreground">Undersupplied</p>
                        <p className="text-sm font-medium text-foreground mt-1">
                          {formatPercent(dashboard.market_health.undersupplied_pct)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                        <p className="text-xs text-muted-foreground">High confidence</p>
                        <p className="text-sm font-medium text-foreground mt-1">
                          {formatPercent(dashboard.market_health.high_confidence_pct)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                        <p className="text-xs text-muted-foreground">Avg liquidity</p>
                        <p className="text-sm font-medium text-foreground mt-1">
                          {formatNumber(dashboard.market_health.avg_liquidity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Top areas by yield</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {dashboard.top_areas_by_yield.length === 0 ? (
                        <p>No yield signals available yet.</p>
                      ) : (
                        dashboard.top_areas_by_yield.map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <span>{item.label}</span>
                            <span className="text-foreground">
                              {item.value === null ? "—" : `${item.value.toFixed(1)}%`}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Signals to watch</p>
                    {dashboard.alerts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No alerts generated yet.</p>
                    ) : (
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {dashboard.alerts.map((alert) => (
                          <li key={alert} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent/80" />
                            <span>{alert}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                {isLoadingDashboard ? "Loading live coverage..." : dashboardError ?? "Live feed unavailable."}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border/70 bg-background/40 p-7 mb-12">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Delivery options</p>
                <h2 className="text-xl font-semibold text-foreground">Choose how you receive the data</h2>
              </div>
              <p className="text-xs text-muted-foreground">Data feed, plug-ins, or downloadable packs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {deliveryOptions.map((option) => (
                <div key={option.title} className="rounded-2xl border border-border/60 bg-card/70 p-6">
                  <option.icon className="h-5 w-5 text-accent" />
                  <p className="text-sm font-medium text-foreground mt-3">{option.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">{option.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Data products</p>
                <h2 className="text-xl font-semibold text-foreground">Six core data products</h2>
              </div>
              <p className="text-xs text-muted-foreground">Each one solves a specific desk question.</p>
            </div>
            <div className="space-y-4">
              {products.map((product, index) => (
                <div
                  key={product.title}
                  className="rounded-2xl border border-border/60 bg-card/70 p-6 flex flex-col xl:flex-row xl:items-center gap-6"
                >
                  <div className="flex items-start gap-4 xl:w-[360px]">
                    <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <product.icon className="h-5 w-5 text-accent" />
                      <h3 className="text-base font-semibold text-foreground mt-2">{product.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.outputs.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 mb-12">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-7">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Impact</p>
              <h2 className="text-xl font-semibold text-foreground mt-2">Why it improves your rank</h2>
              <p className="text-sm text-muted-foreground mt-3">
                Better data means better positioning. You answer faster, show evidence, and guide buyers with clarity.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {outcomes.map((item) => (
                  <div key={item.title} className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <item.icon className="h-4 w-4 text-accent" />
                    <p className="text-sm font-medium text-foreground mt-3">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-2">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/40 p-7">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Live call</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Request</p>
                  <pre className="rounded-xl border border-border/60 bg-card/70 p-4 text-xs text-muted-foreground whitespace-pre-wrap">
                    {requestTemplate}
                  </pre>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Response</p>
                  {isLoadingDashboard ? (
                    <div className="rounded-xl border border-border/60 bg-card/70 p-4 text-xs text-muted-foreground">
                      Connecting to the live feed...
                    </div>
                  ) : dashboardError ? (
                    <div className="rounded-xl border border-border/60 bg-card/70 p-4 text-xs text-amber-200">
                      {dashboardError}
                    </div>
                  ) : liveExample ? (
                    <pre className="rounded-xl border border-border/60 bg-card/70 p-4 text-xs text-muted-foreground whitespace-pre-wrap">
                      {JSON.stringify(liveExample, null, 2)}
                    </pre>
                  ) : (
                    <div className="rounded-xl border border-border/60 bg-card/70 p-4 text-xs text-muted-foreground">
                      Live response will appear once the feed is available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-primary/15 via-background/40 to-background/60 p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                  Ready to integrate Market Data Integration?
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Share your use case and we will recommend the best delivery option.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/contact">
                    Request access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Talk to data team</Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
