import Link from "next/link"
import { ArrowRight, Bot, Layers, Target, Zap, Factory, FileText, Shield } from "lucide-react"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { DocumentationMindMap } from "@/components/docs/documentation-mind-map"

import { getRequestLocale } from "@/i18n/request"
import { ArabicDocPage } from "@/components/docs/arabic-doc-page"
import { getArabicDocsPage } from "@/lib/docs-arabic-pages"
const pipelinePhases = [
  { phase: "1", name: "Source Ingestion", output: "Raw HTML / JSON Objects", consumer: "Internal Data Layer" },
  { phase: "2", name: "Entity Extraction", output: "Project Names, Initial Prices", consumer: "Stage 2: Evidence (L5 Raw)" },
  { phase: "3", name: "Developer Registry", output: "481 Canonical Developers", consumer: "Stage 2: Evidence (L1 Verified)" },
  { phase: "4", name: "Price Verification", output: "Verified AED Prices", consumer: "Stage 2: Evidence (L1 Canonical)" },
  { phase: "5", name: "Yield Calculation", output: "Rental Yield % (from L4 DLD)", consumer: "Stage 2: Evidence (L1 Canonical)" },
  { phase: "6", name: "Stress Testing", output: "Grade A-F Resilience Scores", consumer: "Stage 3: Judgment (Circuit Breaker)" },
  { phase: "7", name: "Investment Score", output: "Composite Score (0-100)", consumer: "Stage 3: Judgment (Ranking Signal)" },
  { phase: "8", name: "Intent Tagging", output: "outcome_intent[] Array", consumer: "Stage 1: Intent (Query Routing)" },
  { phase: "9", name: "Quality Scoring", output: "quality_score (0-100)", consumer: "Stage 4: Action (Display Filter)" },
  { phase: "10", name: "Evidence Compilation", output: "evidence_sources JSONB", consumer: "Stage 4: Action (Transparency Footnotes)" },
]

const evidenceLayers = [
  {
    layer: "L1",
    name: "Canonical",
    reliability: "Highest",
    description: "Audited static truths: normalized developer names, verified AED prices, confirmed handover dates, geospatial coordinates. No ROI calculation occurs without finalized L1 values.",
    color: "border-emerald-500/40 bg-emerald-500/10",
  },
  {
    layer: "L2",
    name: "Derived",
    reliability: "High",
    description: "Calculated truths from L1 data: Investment Scores (0-100), Stress Grades (A-F), and verified rental yield percentages. Powers the objective Market Score component.",
    color: "border-blue-500/40 bg-blue-500/10",
  },
  {
    layer: "L3",
    name: "Dynamic",
    reliability: "Medium",
    description: "Living states responding to market pressure: live inventory levels, price momentum, BUY/HOLD timing signals. Adjusts Data Confidence based on market events.",
    color: "border-amber-500/40 bg-amber-500/10",
  },
  {
    layer: "L4",
    name: "External",
    reliability: "Low-Medium",
    description: "Raw sensor data from DLD, RERA, Property Finder, and Bayut. Provides context but is never the final judge of truth — awaits internal adjudication to reach L1 status.",
    color: "border-orange-500/40 bg-orange-500/10",
  },
  {
    layer: "L5",
    name: "Raw",
    reliability: "Lowest",
    description: "Unprocessed HTML/JSON artifacts, regex snippets, and raw PDF brochures before AI extraction. Entry point for Static Truth Recovery. Never used for direct decisioning.",
    color: "border-red-500/40 bg-red-500/10",
  },
]

const tunnelStages = [
  {
    stage: "1",
    name: "Intent Parsing",
    subtitle: "The HALTS Mechanism",
    description: "Natural language is converted into a structured TableSpec JSON via the TableSpec Compiler. If a query is ambiguous, the system HALTS — it refuses to guess and becomes an active interrogator, forcing profile calibration before execution.",
    key: "Prevents Intent Collapse: 'best property' resolves differently for Conservative vs Speculative profiles.",
  },
  {
    stage: "2",
    name: "Evidence Collection",
    subtitle: "Exclusion Policy",
    description: "The system retrieves records from the canonical graph while applying a strict Exclusion Policy. Distressed sales, internal transfers, and duplicates are filtered to protect L1 price integrity. Only projects passing L1 verification advance.",
    key: "Data hygiene is the non-negotiable prerequisite for judgment.",
  },
  {
    stage: "3",
    name: "Judgment",
    subtitle: "The 65/35 Engine",
    description: "Properties are ranked via a 65/35 weighting engine: 65% Market Score (objective quality based on timing, yield, stress resilience) and 35% Match Score (subjective alignment with the user's risk profile and time horizon).",
    key: "The Investment Score (Phase 7) provides the primary ranking signal for this stage.",
  },
  {
    stage: "4",
    name: "Action",
    subtitle: "Decision Object Factory",
    description: "Evaluated data is transformed into Decision Objects — professional artifacts (PDFs, memos, decks) ready for executive presentation. Every number is footnoted to its specific L-layer, scrape date, and algorithm version.",
    key: "Three-page output: Portfolio Summary, Risk Matrix, Evidence Appendix.",
  },
]

const scoringWeights = [
  { metric: "L1 Canonical Price", aggressive: "0.15", conservative: "0.35", impact: "Entry-point safety/margin" },
  { metric: "L1 Canonical Yield", aggressive: "0.10", conservative: "0.30", impact: "Cash-on-cash returns" },
  { metric: "L2 Investment Score", aggressive: "0.35", conservative: "0.15", impact: "Algorithmic upside potential" },
  { metric: "L2 Stress Grade", aggressive: "0.05", conservative: "0.25", impact: "Circuit breaker for safety" },
  { metric: "L3 Timing Signal", aggressive: "0.25", conservative: "0.05", impact: "Entry-window heat" },
  { metric: "L3 Price Momentum", aggressive: "0.10", conservative: "-0.10", impact: "Rewards/penalizes market heat" },
]

export default async function DocumentationDocsPage() {
  const locale = await getRequestLocale()
  if (locale === "ar") {
    return <ArabicDocPage locale={locale} content={getArabicDocsPage("documentation")} />
  }

  return (
    <>
      {/* Hero */}
      <header className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-10">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Platform Docs / Architecture</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground md:text-5xl">Platform Architecture</h1>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground leading-relaxed">
          The complete technical blueprint of the Entrestate Decision Infrastructure — a unified
          &quot;Pipeline-to-Tunnel&quot; operating model that transforms raw market signals into defensible,
          institutional-grade outcomes.
        </p>
      </header>

      {/* One-System Model */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foreground">The One-System Model</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The Entrestate architecture is not a collection of competing modules — it is a single, linear deterministic
          flow. The 10-Phase Pipeline serves as the <strong className="text-foreground">factory</strong> where raw
          data is refined. The 5-Layer Evidence Stack acts as the{" "}
          <strong className="text-foreground">warehouse</strong> for high-integrity inventory. The 4-Stage Decision
          Tunnel functions as the <strong className="text-foreground">storefront</strong> where complexity is hidden
          to expose defensible outcomes.
        </p>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The critical architectural link: Phase 7 (Investment Score) directly produces the ranking signal used in
          Stage 3 (Judgment), while Phase 8 (Intent Tagging) feeds Stage 1 (Intent Parsing). Every phase in the
          pipeline has exactly one downstream consumer in the tunnel, ensuring a deterministic path from raw sensor
          ingestion to the final Decision Object.
        </p>
      </section>

      {/* 10-Phase Pipeline */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Factory className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">The 10-Phase Sequential Data Pipeline</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The foundational Data Layer that transforms chaotic market signals into a structured inventory of
          scored UAE projects. Each phase refines data from &quot;Raw Sensors&quot; toward
          &quot;Actionable Belief.&quot;
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="pb-3 pr-3 font-medium text-muted-foreground">Phase</th>
                <th className="pb-3 pr-3 font-medium text-muted-foreground">Name</th>
                <th className="pb-3 pr-3 font-medium text-muted-foreground">Output</th>
                <th className="pb-3 font-medium text-muted-foreground">Downstream Consumer</th>
              </tr>
            </thead>
            <tbody>
              {pipelinePhases.map((p) => (
                <tr key={p.phase} className="border-b border-border/30">
                  <td className="py-2.5 pr-3 font-mono text-xs text-accent">{p.phase}</td>
                  <td className="py-2.5 pr-3 font-medium text-foreground">{p.name}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{p.output}</td>
                  <td className="py-2.5 text-muted-foreground">{p.consumer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 rounded-xl border border-border/60 bg-background/40 p-4">
          <h3 className="text-sm font-semibold text-foreground">Key Pipeline Mechanics</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <li><strong className="text-foreground">Phases 1-5</strong>: Transform Raw Sensors into L1 Canonical Verified Truths. Developer Registry (Phase 3) normalizes 481 developers. Price Verification and Yield Calculation establish L1 baseline against L4 DLD historical data.</li>
            <li><strong className="text-foreground">Phases 6-7</strong>: Stress Testing assigns A-F grades based on market pressure resilience. The Investment Score synthesizes timing, resilience, and yield into the primary 0-100 ranking signal.</li>
            <li><strong className="text-foreground">Phases 8-10</strong>: Intent Tagging enables query routing. Evidence Compilation packages all sources into JSONB for footnoted transparency.</li>
          </ul>
        </div>
      </section>

      {/* 5-Layer Evidence Stack */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">The 5-Layer Evidence Stack</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Our &quot;Sensor vs. Judge&quot; philosophy: external platforms (Property Finder, DLD, RERA) are sensors
          that detect market movement. The Entrestate Adjudication Engine is the final judge. Data integrity increases
          as the layer number decreases.
        </p>
        <div className="mt-5 space-y-3">
          {evidenceLayers.map((layer) => (
            <div key={layer.layer} className={`rounded-xl border p-4 ${layer.color}`}>
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-background/60 px-2 py-1 font-mono text-xs font-bold text-foreground">
                  {layer.layer}
                </span>
                <h3 className="text-sm font-semibold text-foreground">{layer.name}</h3>
                <span className="text-xs text-muted-foreground">({layer.reliability} reliability)</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{layer.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4-Stage Decision Tunnel */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">The 4-Stage Decision Tunnel</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The tunnel hides data complexity to expose only defensible outcomes. It moves the system from a
          &quot;search bar&quot; to a &quot;decision engine,&quot; preventing Intent Collapse — the failure to
          distinguish between users with identical queries but divergent goals.
        </p>
        <div className="mt-5 space-y-4">
          {tunnelStages.map((stage) => (
            <div key={stage.stage} className="rounded-xl border border-border/60 bg-background/40 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 font-mono text-sm font-bold text-accent">
                  {stage.stage}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
                  <p className="text-xs text-muted-foreground">{stage.subtitle}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{stage.description}</p>
              <p className="mt-2 text-xs text-accent/80 italic">{stage.key}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Profile Calibration & Scoring */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Profile Calibration & Scoring Engine</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The scoring engine shifts weights based on the calibrated investor profile. A project&apos;s
          &quot;value&quot; is never an objective constant — it is a variable function of the user&apos;s risk/return
          profile and time horizon. The translation mechanism is fully auditable:{" "}
          <strong className="text-foreground">Profile → Weights → Query → Artifact → Footnoted PDF</strong>.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="pb-3 pr-3 font-medium text-muted-foreground">Metric</th>
                <th className="pb-3 pr-3 font-medium text-muted-foreground">Aggressive</th>
                <th className="pb-3 pr-3 font-medium text-muted-foreground">Conservative</th>
                <th className="pb-3 font-medium text-muted-foreground">Impact</th>
              </tr>
            </thead>
            <tbody>
              {scoringWeights.map((w) => (
                <tr key={w.metric} className="border-b border-border/30">
                  <td className="py-2.5 pr-3 font-medium text-foreground">{w.metric}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">{w.aggressive}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">{w.conservative}</td>
                  <td className="py-2.5 text-muted-foreground">{w.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Conservative Focus</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Targets &quot;Safe Yield.&quot; Filters for completed projects with verified L1 yields. L2 Stress Grade
              acts as a mandatory circuit breaker (only A/B). Requires L4 DLD historical occupancy &gt;85%.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Aggressive/Speculative Focus</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Prioritizes capital growth with disproportionate weight on L2 Investment Score (0.35) and L3 Timing
              Signals (0.25). Identifies market leaders before peak pricing. 71% of UAE inventory is eligible.
            </p>
          </div>
        </div>
      </section>

      {/* Decision Object Factory */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">The Decision Object Factory</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Final outputs are rendered as three-page high-trust PDFs with full evidence footnotes:
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Portfolio Summary</h3>
            <p className="mt-1 text-xs text-muted-foreground">Top 5 projects ranked by profile_score with key metrics and scoring rationale.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Risk Matrix</h3>
            <p className="mt-1 text-xs text-muted-foreground">Visual cross-reference of stress grades vs development timelines with circuit breaker flags.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Evidence Appendix</h3>
            <p className="mt-1 text-xs text-muted-foreground">Full Evidence Drawer: every number footnoted to its L-layer, scrape date, and algorithm version.</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-4">
          <h3 className="text-sm font-semibold text-foreground">Footnote Examples</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground font-mono">
            <li>1 Price: L1 canonical (PF verified, last scraped 2026-03-01)</li>
            <li>2 Yield: L1 canonical (calculated from L4 DLD rental data)</li>
            <li>3 Score: L2 derived (investor_score_v1 algorithm v1.0)</li>
          </ul>
        </div>
      </section>

      {/* AI Support */}
      <section className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
        <div className="flex items-center gap-2 text-emerald-200">
          <Bot className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">AI Documentation Support</h2>
        </div>
        <p className="mt-2 text-sm text-emerald-100/90">
          Ask the AI assistant to explain any architectural component, compare scoring profiles, or generate
          investor-ready summaries from this documentation.
        </p>
        <CopilotEntryLink className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-100">
          Open AI assistant
          <ArrowRight className="h-4 w-4" />
        </CopilotEntryLink>
      </section>

      {/* Interactive Mind Map */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Interactive Architecture Map</h2>
        <DocumentationMindMap />
      </section>

      {/* Article Directory Link */}
      <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Deep-Dive Articles</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Each node in the architecture map has a dedicated article with scope, execution details, and operational
          context.
        </p>
        <Link href="/docs/articles" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent">
          Open all articles
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  )
}
