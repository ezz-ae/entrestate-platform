import Link from "next/link"
import { ArrowRight, Building2, TrendingUp, Shield, BarChart3, AlertTriangle, Zap, Eye } from "lucide-react"

import { getRequestLocale } from "@/i18n/request"
import { ArabicDocPage } from "@/components/docs/arabic-doc-page"
import { getArabicDocsPage } from "@/lib/docs-arabic-pages"
// Use directional bands rather than fixed numbers; canonical counts live in /api/platform-metrics.
const marketMetrics = [
  { value: "Multi-thousand", label: "Active Projects", detail: "Tracked across UAE — current count exposed via /api/platform-metrics" },
  { value: "~70%", label: "Speculative", detail: "Of scored inventory (recent snapshot)" },
  { value: "~100", label: "Conservative Plays", detail: "Projects meeting low-risk + capital-preservation overlap" },
  { value: "Thousands", label: "Timing BUY Signals", detail: "Of currently scored projects — refreshed on each ETL pass" },
]

const roiComparison = [
  { segment: "Growth Areas", roi: "12.3%", description: "High-growth zones outperforming international markets (e.g., Ras Al Khaimah, emerging Dubai corridors)" },
  { segment: "Premium Areas", roi: "7.1%", description: "Established premium segments with lower yield but higher capital preservation (e.g., Downtown Dubai, Palm Jumeirah)" },
]

const stressFactors = [
  {
    title: "Market Context",
    description: "Macro-economic environment, regulatory changes, and demand-supply dynamics affecting the area and segment.",
  },
  {
    title: "Developer Execution",
    description: "Historical delivery consistency, project completion rates, and quality track record of the developer.",
  },
  {
    title: "Financial Logic",
    description: "Price-to-value fundamentals, payment plan structure, and exit liquidity based on comparable transactions.",
  },
  {
    title: "Delivery Risk",
    description: "Construction progress, timeline adherence, and developer financial stability for off-plan projects.",
  },
  {
    title: "Exit Reality",
    description: "Secondary market depth, flip patterns, and realized vs projected returns for comparable completed projects.",
  },
]

export default async function IndustryDocsPage() {
  const locale = await getRequestLocale()
  if (locale === "ar") {
    return <ArabicDocPage locale={locale} content={getArabicDocsPage("industry")} />
  }

  return (
    <>
      {/* Hero */}
      <header className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-10">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Platform Docs / Industry</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground md:text-5xl">Industry & Market Intelligence</h1>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground leading-relaxed">
          Deep analysis of the UAE real estate landscape — market structure, performance gaps, stress resilience
          scoring, and Entrestate&apos;s positioning as the decision infrastructure layer for the industry.
        </p>
      </header>

      {/* Market Numbers */}
      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {marketMetrics.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/70 bg-card/70 p-5 text-center">
            <p className="text-2xl font-bold text-foreground md:text-3xl">{item.value}</p>
            <p className="mt-1 text-sm font-medium text-foreground">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </section>

      {/* Market Reality */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">The UAE Real Estate Landscape</h2>
        </div>
        <div className="mt-4 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            The UAE market is currently characterized by a{" "}
            <strong className="text-foreground">severe scarcity of safety</strong>. Across the active scored
            inventory tracked by Entrestate, the majority of projects fall into a{" "}
            <strong className="text-foreground">Speculative</strong> band, while only a small subset meet the
            criteria for a &quot;Conservative&quot; play — where low-risk profiles overlap with high capital
            preservation. Live counts are surfaced through the <code className="font-mono text-xs">/api/platform-metrics</code> endpoint.
          </p>
          <p>
            In this environment, identifying &quot;Safe Yield&quot; is mathematically difficult. It requires an overlap
            between &quot;Conservative Risk&quot; and &quot;Yield Seeker&quot; personas — two archetypes that rarely
            align in raw data. This is precisely where Entrestate&apos;s profile-calibrated Decision Tunnel provides
            institutional-grade differentiation.
          </p>
          <p>
            The traditional &quot;search-and-browse&quot; paradigm treats every user as a generic browser. In a market
            with 7,000+ projects competing for liquidity, this creates market noise that obscures institutional intent
            and leads to capital misallocation.
          </p>
        </div>
      </section>

      {/* ROI Performance Gap */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Market ROI Performance Gap</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Our deep analysis reveals a stark divide in performance across UAE market segments. Growth areas significantly
          outperform premium segments, but require sophisticated scoring to separate quality from noise.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {roiComparison.map((segment) => (
            <div key={segment.segment} className="rounded-xl border border-border/60 bg-background/40 p-5">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-foreground">{segment.roi}</span>
                <span className="text-sm font-medium text-foreground">{segment.segment}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{segment.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground italic">
          Median annual ROI based on L1 Canonical pricing and L4 DLD historical rental data.
        </p>
      </section>

      {/* Stress Resilience */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Stress Resilience Scoring (Grade A-F)</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Every project is assigned a stress resilience grade (A-F) based on its ability to withstand market pressure.
          Projects are evaluated not as static cards but as states moving through a lifecycle. The grade acts as a
          &quot;circuit breaker&quot; — Conservative profiles require Grade A or B to pass to the Judgment stage.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {stressFactors.map((factor) => (
            <div key={factor.title} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <h3 className="text-sm font-semibold text-foreground">{factor.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{factor.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Volatility-Gated Refreshes */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Volatility-Gated Price Refreshes</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Unlike traditional clock-based updates, Entrestate utilizes volatility-gated refreshes. Prices update based
          on market events and pressure, not a fixed schedule. This provides three critical advantages:
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">Stale Data Mitigation</h3>
            <p className="mt-1 text-xs text-muted-foreground">Essential during secondary market surges or rapid flip patterns.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <BarChart3 className="h-4 w-4 text-accent" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">Resource Efficiency</h3>
            <p className="mt-1 text-xs text-muted-foreground">No unnecessary polling during market lulls; high-integrity signals during volatility.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <TrendingUp className="h-4 w-4 text-accent" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">Yield Sensitivity</h3>
            <p className="mt-1 text-xs text-muted-foreground">Rental projections react instantly to live price shifts.</p>
          </div>
        </div>
      </section>

      {/* Investor Personas */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Investor Archetype Resolution</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The same query — &quot;Show me the best properties in Abu Dhabi&quot; — produces fundamentally different
          Decision Objects depending on the investor&apos;s calibrated profile. This is the core anti-thesis to
          Intent Collapse.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/40 p-5">
            <h3 className="text-sm font-semibold text-foreground">Conservative Investor</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              System resolves &quot;best&quot; as <strong className="text-foreground">safest yield</strong>.
              Recommends projects like Jumeirah Residences Emira (15.0% yield) and Cala Del Mar. Evidence Drawer
              cites L1 verified yields and L4 DLD historical occupancy &gt;85%.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-5">
            <h3 className="text-sm font-semibold text-foreground">Speculative Investor</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              System resolves &quot;best&quot; as <strong className="text-foreground">highest short-term upside</strong>.
              Recommends projects like Golf Ville Apartments (Investment Score 85). Selected based on L2 score peaks,
              L3 BUY signals, and positive momentum.
            </p>
          </div>
        </div>
      </section>

      {/* Responsible Intelligence */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Responsible Intelligence Posture</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Evidence Transparency</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Every figure is footnoted to its specific L-layer, scrape date, and algorithm version. No black-box
              recommendations.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Confidence Disclosure</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Clear distinction between data fact and model judgment. Confidence scores reflect completeness,
              freshness, and source agreement.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Low-Coverage Guardrails</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              System guards against over-claiming confidence in zones where L1 coverage is incomplete. Static values
              without provenance are treated as misrepresentation.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
        <h2 className="text-lg font-semibold text-foreground">Related Documentation</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/docs/data-information"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Data & Evidence Model
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs/documentation"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            Platform Architecture
          </Link>
          <Link
            href="/docs/investors-relations"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            Investor Relations
          </Link>
        </div>
      </section>
    </>
  )
}