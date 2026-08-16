import Link from "next/link"
import { ArrowRight, Database, Layers, Shield, Filter, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"

import { getRequestLocale } from "@/i18n/request"
import { ArabicDocPage } from "@/components/docs/arabic-doc-page"
import { getArabicDocsPage } from "@/lib/docs-arabic-pages"
const evidenceLayers = [
  {
    layer: "L1",
    name: "Canonical (Audited Static Truths)",
    reliability: "Highest",
    description: "The single source of truth. Includes normalized developer identities (481 canonical developers), verified AED prices, confirmed handover dates, and geospatial coordinates. Static Truth Finalization requires five fields: Location, Developer, Prices (From/To), Dates (Launch/Handover), and Status.",
    examples: "Emaar Properties (normalized), AED 3,510,000 (PF verified), 25.1234/55.5678 (confirmed coordinates)",
    color: "border-emerald-500/40 bg-emerald-500/10",
  },
  {
    layer: "L2",
    name: "Derived (Calculated Truths)",
    reliability: "High",
    description: "Metrics mathematically calculated from L1 data. Investment Scores (0-100), Stress Grades (A-F), and verified rental yield percentages. Powers the objective 65% Market Score component used in the Decision Tunnel's Judgment stage.",
    examples: "Investment Score: 85, Stress Grade: B+, Verified Yield: 12.3%",
    color: "border-blue-500/40 bg-blue-500/10",
  },
  {
    layer: "L3",
    name: "Dynamic (Living States)",
    reliability: "Medium",
    description: "Live signals reflecting the current market state. Projects are treated as states moving through a lifecycle: Market Context, Developer Execution, Financial Logic, Delivery Risk, Exit Reality. Adjusts Data Confidence based on market events.",
    examples: "BUY/HOLD timing signals, price momentum indicators, inventory level changes",
    color: "border-amber-500/40 bg-amber-500/10",
  },
  {
    layer: "L4",
    name: "External (Market Sensors)",
    reliability: "Low-Medium",
    description: "Raw sensor data from external sources. In our framework, external sources are treated as sensors, not judges. Data remains in 'external belief' status until verified through the 10-Phase Pipeline to reach L1 Canonical status.",
    examples: "DLD transaction history, RERA registration data, Property Finder listings, Bayut feeds",
    color: "border-orange-500/40 bg-orange-500/10",
  },
  {
    layer: "L5",
    name: "Raw (Unprocessed Extraction)",
    reliability: "Lowest",
    description: "Unprocessed information from initial ingestion. Contains regex artifacts, location fragments, and raw HTML/JSON noise. The entry point for Static Truth Recovery. Never used for direct decisioning — exposing L5 data to decision-makers introduces unacceptable risk.",
    examples: "Raw HTML snippets, regex artifacts (e.g., developer: 's'), PDF brochure extracts",
    color: "border-red-500/40 bg-red-500/10",
  },
]

const exclusionRules = [
  {
    category: "Distressed Sales",
    reason: "Outliers that skew fair market value and corrupt L1 price integrity",
    impact: "Prevents false ROI projections from non-representative transactions",
  },
  {
    category: "Internal Transfers",
    reason: "Non-market movements within organizations that don't reflect real demand",
    impact: "Protects supply-demand analysis from artificial volume inflation",
  },
  {
    category: "Duplicates & Developer Noise",
    reason: "Regex artifacts, location fragments (e.g., 'At Aljada'), and identity collisions",
    impact: "Ensures canonical graph integrity and accurate developer track records",
  },
]

const dataSources = [
  {
    source: "Dubai Land Department (DLD)",
    role: "Transaction authority and historical rental data",
    usage: "L4 External sensor adjudicated to L1 for yield calculation (Phase 5). Historical occupancy data used as circuit breaker (>85% threshold for Conservative profiles).",
  },
  {
    source: "RERA",
    role: "Regulatory compliance and project registration",
    usage: "L4 External sensor for project lifecycle validation. Registration status feeds into Stress Testing (Phase 6) and Developer Registry (Phase 3).",
  },
  {
    source: "Property Finder",
    role: "Market listing sensor and price verification",
    usage: "L4 External sensor providing price signals. Verified against canonical values during Price Verification (Phase 4). Scrape dates attached as provenance metadata.",
  },
  {
    source: "Bayut",
    role: "Secondary market sensor and availability tracking",
    usage: "L4 External sensor for inventory tracking and price momentum signals. Feeds L3 Dynamic layer for live market movement detection.",
  },
]

const recoveryMetrics = [
  { field: "Developer Identity", raw: "18%", target: "100%", method: "URL pattern extraction + brochure AI parsing" },
  { field: "Area Normalization", raw: "54%", target: "100%", method: "Regex cleaning + geospatial coordinate verification" },
  { field: "Price Verification", raw: "34.3%", target: ">90%", method: "Cross-source adjudication (PF, DLD, RERA)" },
  { field: "Handover Dates", raw: "~40%", target: ">85%", method: "Developer registry + project timeline analysis" },
  { field: "Coordinates", raw: "~60%", target: ">95%", method: "Address parsing + satellite imagery confirmation" },
]

export default async function DataInformationPage() {
  const locale = await getRequestLocale()
  if (locale === "ar") {
    return <ArabicDocPage locale={locale} content={getArabicDocsPage("data-information")} />
  }

  return (
    <>
      {/* Hero */}
      <header className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-10">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Platform Docs / Data & Evidence</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground md:text-5xl">Data & Evidence Model</h1>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground leading-relaxed">
          The epistemic foundation of Entrestate — how raw market signals become institutional-grade truths through
          the <strong className="text-foreground">5-Layer Evidence Stack</strong>, strict exclusion policies, and
          deterministic data governance. In our framework, a number is never just a &quot;fact&quot; — it is a
          &quot;belief under pressure.&quot;
        </p>
      </header>

      {/* Core Philosophy */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Core Philosophy: Sensors, Not Judges</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          External platforms (Property Finder, DLD, RERA) are regarded as{" "}
          <strong className="text-foreground">sensors</strong> that detect market movement, but the Entrestate
          Adjudication Engine is the <strong className="text-foreground">final judge</strong>. We do not simply
          aggregate data — we adjudicate it. We move beyond showing raw facts to exposing confidence levels.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">Intent Collapse Risk</h3>
            <p className="mt-1 text-xs text-muted-foreground">Treating a high-risk speculative play as a safe yield opportunity because underlying data wasn&apos;t weighted for reliability.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">Signal Distortion Risk</h3>
            <p className="mt-1 text-xs text-muted-foreground">Allowing noise — distressed sales, internal transfers, duplicates — to skew ROI calculations and market averages.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">Accountability Risk</h3>
            <p className="mt-1 text-xs text-muted-foreground">Being unable to defend a multi-million AED decision because the source of &quot;truth&quot; is untraceable or unverified.</p>
          </div>
        </div>
      </section>

      {/* 5-Layer Evidence Stack */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">The 5-Layer Evidence Stack</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Data integrity increases as the layer number decreases. The Decision Tunnel only utilizes L1-L3 data for
          final recommendations. L4/L5 data is never presented as truth — it awaits adjudication.
        </p>
        <div className="mt-5 space-y-3">
          {evidenceLayers.map((layer) => (
            <div key={layer.layer} className={`rounded-xl border p-5 ${layer.color}`}>
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-background/60 px-2.5 py-1 font-mono text-sm font-bold text-foreground">
                  {layer.layer}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{layer.name}</h3>
                  <span className="text-xs text-muted-foreground">{layer.reliability} reliability</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{layer.description}</p>
              <p className="mt-2 text-xs text-muted-foreground italic">Examples: {layer.examples}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Exclusion Policy */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Exclusion Policy</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Maintaining data integrity requires a strict Exclusion Policy. The system automatically filters records that
          would corrupt the competitive landscape analysis or distort L1 pricing baselines.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Category</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Reason</th>
                <th className="pb-3 font-medium text-muted-foreground">Impact</th>
              </tr>
            </thead>
            <tbody>
              {exclusionRules.map((rule) => (
                <tr key={rule.category} className="border-b border-border/30">
                  <td className="py-3 pr-4 font-medium text-foreground">{rule.category}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{rule.reason}</td>
                  <td className="py-3 text-muted-foreground">{rule.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Data Sources */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Data Source Integration</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          All external sources enter the pipeline as L4 External sensors. They are never treated as truth until
          adjudicated through the 10-Phase Pipeline. Each source has a specific role in the evidence ecosystem.
        </p>
        <div className="mt-5 space-y-3">
          {dataSources.map((source) => (
            <div key={source.source} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <h3 className="text-sm font-semibold text-foreground">{source.source}</h3>
              <p className="mt-1 text-xs text-accent/80">{source.role}</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{source.usage}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Static Truth Recovery */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Static Truth Recovery</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The L1 layer is currently <strong className="text-foreground">34.3% complete</strong> in raw form. To reach
          institutional grade, we employ Aggressive Field Extraction — a deterministic process that recovers missing
          truths from URL patterns, project briefs, and official brochures using Gemini 1.5 AI.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Field</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Raw Coverage</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Target</th>
                <th className="pb-3 font-medium text-muted-foreground">Recovery Method</th>
              </tr>
            </thead>
            <tbody>
              {recoveryMetrics.map((metric) => (
                <tr key={metric.field} className="border-b border-border/30">
                  <td className="py-2.5 pr-4 font-medium text-foreground">{metric.field}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{metric.raw}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-foreground">{metric.target}</td>
                  <td className="py-2.5 text-muted-foreground">{metric.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Evidence Drawer */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">The Evidence Drawer</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Every Decision Object includes an Evidence Drawer — the transparency layer that exposes the &quot;why&quot;
          behind every recommendation. This allows stakeholders to audit the decision readiness of any asset.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Auditability</h3>
            <p className="mt-1 text-xs text-muted-foreground">Every number footnoted to its specific L-layer to prove it is a &quot;static truth.&quot;</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Data Confidence</h3>
            <p className="mt-1 text-xs text-muted-foreground">Score reflecting completeness, freshness, and source agreement of underlying data.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Strategic Rationale</h3>
            <p className="mt-1 text-xs text-muted-foreground">Explicit listing of filters, weights, and profile lens used to resolve the query.</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-4">
          <h3 className="text-sm font-semibold text-foreground">Evidence Package Checklist</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Verified Footnotes: L-layer provenance for every value</li>
            <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Source Provenance: Original sensors (DLD, RERA) with adjudication dates</li>
            <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Decision Lens Transparency: Explicit 65/35 weights applied</li>
            <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Stress Test Confirmation: L2 Stress Grade (A/B) proving volatility resistance</li>
          </ul>
        </div>
      </section>

      {/* Navigation */}
      <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
        <h2 className="text-lg font-semibold text-foreground">Related Documentation</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/docs/documentation"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Platform Architecture
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs/industry"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            Industry & Market Intelligence
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