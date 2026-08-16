import Link from "next/link"
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  LineChart,
  Target,
  Layers,
  Zap,
  Building2,
  Users,
  BarChart3,
  Lock,
  Globe,
} from "lucide-react"
import { getRequestLocale } from "@/i18n/request"
import { ArabicDocPage } from "@/components/docs/arabic-doc-page"
import { getArabicDocsPage } from "@/lib/docs-arabic-pages"

// Bands rather than fixed counts. Live numbers exposed via /api/platform-metrics.
const marketNumbers = [
  { value: "Multi-thousand", label: "Active Projects", detail: "Scored UAE inventory tracked across live refreshes" },
  { value: "Hundreds", label: "Canonical Developers", detail: "Normalized & verified identities" },
  { value: "Hundreds", label: "Decision-Label BUY Signals", detail: "Evidence-backed opportunities passing all gates" },
  { value: "L1–L5", label: "Evidence Coverage", detail: "Each project tagged with provenance level; recovery to L1 is ongoing" },
]

const competitiveEdges = [
  {
    icon: Layers,
    title: "5-Layer Evidence Stack",
    detail:
      "Every data point tagged from L1 Canonical (audited truth) to L5 Raw (unprocessed), creating an epistemic foundation no listing portal can replicate.",
  },
  {
    icon: Target,
    title: "4-Stage Decision Tunnel",
    detail:
      "Intent parsing, evidence collection, judgment calibration, and defensible action — a deterministic path from query to Decision Object.",
  },
  {
    icon: Zap,
    title: "10-Phase Data Pipeline",
    detail:
      "Sequential factory that transforms raw HTML/JSON into verified inventory. Each phase has exactly one downstream consumer in the tunnel.",
  },
  {
    icon: ShieldCheck,
    title: "Investment Score Engine",
    detail:
      "65/35 weighting (Market Score vs Profile Match) with profile-calibrated weights that shift between Conservative, Aggressive, and Speculative archetypes.",
  },
  {
    icon: Lock,
    title: "Intent Collapse Prevention",
    detail:
      'The system HALTS on ambiguous queries — it refuses to guess. "Best property" for a retiree vs. a hedge fund produces completely different Decision Objects.',
  },
  {
    icon: Globe,
    title: "Volatility-Gated Refreshes",
    detail:
      "Prices update based on market events and pressure, not clock schedules. Data reacts to reality, eliminating stale snapshots.",
  },
]

const revenueStreams = [
  {
    tier: "Free",
    users: "Individual investors",
    features: "Basic search, limited Decision Objects, community-grade evidence",
    model: "Lead generation + brand trust",
  },
  {
    tier: "Pro",
    users: "Active investors & brokers",
    features: "Full evidence drawer, profile calibration, PDF export, priority scoring",
    model: "Subscription (monthly/annual)",
  },
  {
    tier: "Enterprise",
    users: "Brokerages, funds, developers",
    features: "API access, white-label embed SDK, custom scoring, dedicated support",
    model: "Contract + usage-based",
  },
]

const diligenceItems = [
  {
    category: "Product & Architecture",
    items: [
      "Pipeline-to-Tunnel unified architecture documentation",
      "10-Phase Pipeline technical specification",
      "5-Layer Evidence Stack data governance model",
      "Decision Tunnel workflow and scoring methodology",
      "Investment Score calibration and weight logic",
    ],
  },
  {
    category: "Data & Integrity",
    items: [
      "Scored project inventory with L1–L5 provenance tags (live count via /api/platform-metrics)",
      "Canonical developer registry with normalized identities",
      "Exclusion policy: distressed sales, internal transfers, duplicates",
      "Static Truth Recovery roadmap and completion metrics",
      "DLD, RERA, Property Finder integration contracts",
    ],
  },
  {
    category: "Commercial & Operations",
    items: [
      "Tier-based pricing model and unit economics",
      "Embed SDK and attribution engine architecture",
      "Partnership pipeline and co-build lane strategy",
      "Broker Empowerment Suite and lead scoring model",
      "Growth metrics and adoption dashboard",
    ],
  },
]

export default async function InvestorsRelationsDocsPage() {
  const locale = await getRequestLocale()
  if (locale === "ar") {
    return <ArabicDocPage locale={locale} content={getArabicDocsPage("investors-relations")} />
  }

  return (
    <>
      {/* Hero */}
      <header className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-10">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Platform Docs / Investor Relations
        </p>
        <h1 className="mt-3 text-3xl font-bold text-foreground md:text-5xl">Investor Relations</h1>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground leading-relaxed">
          Entrestate is building the <strong className="text-foreground">decision infrastructure layer</strong> for
          UAE real estate — replacing passive listing portals with an Intelligence OS that transforms raw market noise
          into defensible, institutional-grade investment outcomes.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground leading-relaxed">
          This page is structured for strategic partners, angels, and institutional capital evaluating the opportunity.
        </p>
      </header>

      {/* Market Numbers */}
      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {marketNumbers.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/70 bg-card/70 p-5 text-center">
            <p className="text-2xl font-bold text-foreground md:text-3xl">{item.value}</p>
            <p className="mt-1 text-sm font-medium text-foreground">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </section>

      {/* Investor KPI Audit Trail */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Investor KPI Audit Trail</h2>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground leading-relaxed">
          Investor-facing metrics are now seeded in a month-by-month audit dataset covering ARR, pipeline value,
          retention, CAC payback, gross margin, and runway. This creates a reproducible baseline for diligence
          conversations and KPI governance.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Format</p>
            <p className="mt-1 text-sm text-foreground">Monthly rows (`YYYY-MM`) with deterministic formulas</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Coverage</p>
            <p className="mt-1 text-sm text-foreground">6 metrics × 6 periods (seed: 2025-10 to 2026-03)</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Auditability</p>
            <p className="mt-1 text-sm text-foreground">Schema-enforced fields with evidence links per KPI row</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/docs/investor-metrics-audit"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            KPI Audit Documentation
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs/source-of-truth-registry"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            Source-of-Truth Registry
          </Link>
        </div>
      </section>

      {/* Investment Thesis */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Investment Thesis</h2>
        </div>
        <div className="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            The traditional real estate model is broken. &quot;Search-and-browse&quot; paradigms force users to
            manually parse noisy listings — treating every raw data point as absolute truth. In the UAE, where{" "}
            <strong className="text-foreground">7,000+ active projects</strong> compete for liquidity and{" "}
            <strong className="text-foreground">71% of inventory is classified Speculative</strong>, this creates
            market noise that obscures institutional intent and misallocates capital.
          </p>
          <p>
            Entrestate solves this with a{" "}
            <strong className="text-foreground">unified Pipeline-to-Tunnel architecture</strong> — a single mechanical
            progression where the data factory (10-Phase Pipeline) fills the evidence warehouse (5-Layer Stack), which
            stocks the decision storefront (4-Stage Tunnel). Every recommendation is a{" "}
            <strong className="text-foreground">Decision Object</strong> — an auditable memo with footnoted evidence,
            not a black-box suggestion.
          </p>
          <p>
            The competitive moat is <strong className="text-foreground">epistemic</strong>: our 5-Layer Evidence Stack
            treats external sources (DLD, RERA, Property Finder) as sensors, not judges. Data is adjudicated through
            sequential verification gates before entering the Decision Tunnel. This creates a trust architecture that
            scales — each new data source strengthens the evidence graph rather than adding noise.
          </p>
        </div>
      </section>

      {/* Competitive Moat */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Competitive Moat: Six Architectural Advantages</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {competitiveEdges.map((edge) => (
            <article key={edge.title} className="rounded-2xl border border-border/70 bg-card/70 p-5">
              <div className="flex items-center gap-2">
                <edge.icon className="h-4 w-4 text-accent" />
                <h3 className="text-base font-semibold text-foreground">{edge.title}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{edge.detail}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Market Opportunity</h2>
        </div>
        <div className="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            The UAE real estate market is characterized by a{" "}
            <strong className="text-foreground">severe scarcity of safety</strong>. Our data shows that{" "}
            <strong className="text-foreground">71% of projects are Speculative</strong>, while only{" "}
            <strong className="text-foreground">99 projects nationwide</strong> meet Conservative play criteria.
            Identifying &quot;Safe Yield&quot; is mathematically difficult — it requires an overlap between
            Conservative Risk and Yield Seeker personas that rarely aligns in raw data.
          </p>
          <p>
            Performance analysis reveals a stark divide:{" "}
            <strong className="text-foreground">Growth Areas deliver 12.3% median annual ROI</strong> while{" "}
            <strong className="text-foreground">Premium Areas lag at 7.1%</strong>. Without a scoring engine that
            resolves intent and calibrates for risk profile, investors either overpay for perceived safety or take
            unquantified risk for yield.
          </p>
          <p>
            Entrestate addresses this gap with profile-calibrated scoring: the same query produces fundamentally
            different Decision Objects for Conservative vs. Speculative investors, backed by the same evidence graph
            but weighted through different Decision Lenses.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-center">
            <p className="text-lg font-bold text-foreground">71%</p>
            <p className="text-xs text-muted-foreground">Projects classified Speculative</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-center">
            <p className="text-lg font-bold text-foreground">12.3%</p>
            <p className="text-xs text-muted-foreground">Growth Areas median ROI</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-center">
            <p className="text-lg font-bold text-foreground">99</p>
            <p className="text-xs text-muted-foreground">Conservative plays nationwide</p>
          </div>
        </div>
      </section>

      {/* Revenue Model */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Revenue Model: Three-Tier Architecture</h2>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="pb-3 pr-4 font-medium text-foreground">Tier</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Target Users</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Key Features</th>
                <th className="pb-3 font-medium text-muted-foreground">Revenue Model</th>
              </tr>
            </thead>
            <tbody>
              {revenueStreams.map((stream) => (
                <tr key={stream.tier} className="border-b border-border/30">
                  <td className="py-3 pr-4 font-medium text-foreground">{stream.tier}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{stream.users}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{stream.features}</td>
                  <td className="py-3 text-muted-foreground">{stream.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Traction Signals */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Traction Signals</h2>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Data Infrastructure</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>Active scored projects in canonical inventory (live count: /api/platform-metrics)</li>
              <li>Developer identities normalized and verified across the registry</li>
              <li>10-phase pipeline operational end-to-end</li>
              <li>5-layer evidence tagging on all data points</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Product & Platform</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>Decision Tunnel operational with profile calibration</li>
              <li>AI assistant with evidence-grounded responses</li>
              <li>PDF Decision Object generation live</li>
              <li>Market scoring and stress testing active</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Broker Empowerment</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>Brochure-to-Listing AI automation (Gemini 1.5)</li>
              <li>AI Lead Scoring (Hot/Warm/Cold prioritization)</li>
              <li>Sales Communication Coach for international buyers</li>
              <li>Market Intelligence Analytics dashboard</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Growth Metrics</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>Active decision desks and artifact generation volume</li>
              <li>Evidence confidence coverage across inventory</li>
              <li>API utilization and partner pipeline conversion</li>
              <li>Embed SDK adoption and attribution events</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Diligence Package */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Diligence Package</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The following materials are available for qualified partners and investors evaluating the Entrestate
          opportunity. Each item links to detailed platform documentation.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {diligenceItems.map((group) => (
            <div key={group.category} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <h3 className="text-sm font-semibold text-foreground">{group.category}</h3>
              <ul className="mt-3 space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="text-xs text-muted-foreground leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Reading Path */}
      <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Recommended Reading Path</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          For a complete understanding: start with the{" "}
          <strong className="text-foreground">Platform Architecture</strong> (technical foundation), then{" "}
          <strong className="text-foreground">Data & Evidence Model</strong> (epistemic integrity), followed by{" "}
          <strong className="text-foreground">Partners & APIs</strong> (commercial architecture), and conclude with
          the <strong className="text-foreground">Industry</strong> section for market context.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/docs/documentation"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Platform Architecture
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs/data-information"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            Data & Evidence
          </Link>
          <Link
            href="/docs/partners-apis"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            Partners & APIs
          </Link>
        </div>
      </section>
    </>
  )
}
