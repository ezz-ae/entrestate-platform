import { CheckCircle2, AlertTriangle, XCircle, ArrowRight } from "lucide-react"

import { getRequestLocale } from "@/i18n/request"
import { ArabicDocPage } from "@/components/docs/arabic-doc-page"
import { getArabicDocsPage } from "@/lib/docs-arabic-pages"
type ScoreColor = "green" | "amber" | "red"

const scoreConfig: Record<ScoreColor, { label: string; dot: string; badge: string; row: string }> = {
  green: {
    label: "GREEN",
    dot: "bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.35)]",
    badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    row: "border-emerald-500/20 bg-emerald-500/5",
  },
  amber: {
    label: "AMBER",
    dot: "bg-amber-400",
    badge: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    row: "border-amber-500/20 bg-amber-500/5",
  },
  red: {
    label: "RED",
    dot: "bg-red-400",
    badge: "border-red-500/40 bg-red-500/10 text-red-300",
    row: "border-red-500/20 bg-red-500/5",
  },
}

const scoreCategories: {
  category: string
  score: ScoreColor
  rating: string
  summary: string
  evidence: string[]
  gaps: string[]
  recommendation: string
}[] = [
  {
    category: "Product Deployment Status",
    score: "green",
    rating: "8 / 10",
    summary: "Production surface is live, multi-surface, and interconnected. Core modules — Decision Terminal, Projects, Developers, Areas, Reports, Docs, Roadmap, Changelog — are all deployed and publicly reachable.",
    evidence: [
      "Active UAE scored inventory indexed and queryable (current snapshot exposed via /api/platform-metrics)",
      "Canonical developer registry with reliability scoring",
      "Decision Terminal streaming in production with cooldown-based rate limiting",
      "Report generation pipeline persisting to Neon assistant_reports table",
      "Public changelog with entries through Feb 2026",
    ],
    gaps: [
      "No formal SLA publication (uptime target, error budget)",
      "Status page exists but lacks automated service probe data",
    ],
    recommendation: "Connect /status to real health probe endpoints. Publish a formal SLA for enterprise and partner tiers.",
  },
  {
    category: "Release Discipline",
    score: "green",
    rating: "7 / 10",
    summary: "Active versioned release cadence with documented changelog. Vercel's PR preview + branch deployment model is in place. Recent releases show consistent shipping across Dec 2025–Feb 2026.",
    evidence: [
      "Vercel deployment pipeline with per-PR preview environments",
      "Post-deploy smoke scripts exist (/scripts/smoke.ts)",
      "Changelog lists monthly feature batches with specifics",
      "Prisma migration history provides schema version trail",
    ],
    gaps: [
      "No formal release notes template or sign-off gate",
      "Rollback procedure not documented in-product (now addressed in /docs/deployment-architecture)",
      "No automated integration test suite observed in CI",
    ],
    recommendation: "Add a pre-merge checklist (lint, type-check, smoke) enforced as a required GitHub Actions status check.",
  },
  {
    category: "Architecture Maturity",
    score: "green",
    rating: "9 / 10",
    summary: "One-system model is genuinely senior-grade. The 10-phase pipeline → 5-layer evidence stack → 4-stage decision tunnel is architecturally coherent, documented, and implemented — not just described in marketing copy.",
    evidence: [
      "10-phase pipeline with explicit phase outputs and consumers",
      "L1–L5 evidence hierarchy with adjudication rules",
      "Static Truth Finalization requiring 5 confirmed fields",
      "Decision tunnel with Intent → Evidence → Judgment → Action stages",
      "JSONB evidence payloads persisted on each report artifact",
    ],
    gaps: [
      "No public architecture decision record (ADR) format",
      "Mind-map and documentation exist but not cross-linked to source code",
    ],
    recommendation: "Maintain this standard. Consider publishing an ADR log as decisions accumulate around AI model routing and data source adjudication.",
  },
  {
    category: "Operational Transparency",
    score: "amber",
    rating: "5 / 10",
    summary: "Status page exists and shows live data snapshot. Incident log is maintained manually. However, there is no automated health probe pipeline, no SLO publication, and no public uptime history beyond the two manually recorded incidents.",
    evidence: [
      "/status page with live market data snapshot (force-dynamic)",
      "Incident log with two resolved entries",
      "Data freshness timestamp surfaced to users",
    ],
    gaps: [
      "No automated health monitoring (no external uptime monitor e.g. Better Uptime, UptimeRobot)",
      "No SLO/SLA publication (target uptime % not declared)",
      "No error budget or burn rate tracking",
      "Incident history is sparse — cannot verify operational continuity",
    ],
    recommendation: "Wire an external uptime monitor to /api/health and /api/market-pulse. Publish monthly uptime data on /status. Define and publish SLOs: 99.5% uptime, <500ms p95 API response.",
  },
  {
    category: "Deployment Assurance / SRE Readiness",
    score: "amber",
    rating: "5 / 10",
    summary: "Vercel's atomic deployment model provides compute rollback in <60 seconds. Neon provides 30-day PITR for database rollback. However, no on-call model, alerting runbook, or observable health probe dashboard exists in the accessible codebase.",
    evidence: [
      "Vercel atomic swap guarantees zero-downtime deploys",
      "Neon 30-day point-in-time recovery for data rollback",
      "Post-deploy smoke script validates critical paths",
      "Prisma migration system provides schema version control",
    ],
    gaps: [
      "No on-call rotation or escalation policy documented",
      "No alerting for data pipeline failures (silent failure risk)",
      "No p95 latency or error rate dashboards (no Datadog / Grafana observed)",
      "RTO/RPO targets not formally published",
    ],
    recommendation: "Set up Vercel monitoring + Sentry for error tracking. Add a pipeline health webhook that alerts on stale data (>24h without a successful refresh). Document RTO/RPO formally.",
  },
  {
    category: "Enterprise Readiness",
    score: "amber",
    rating: "7 / 10",
    summary: "Documentation is strong. Partner API surface and embed SDK are described in docs. Clerk provides managed auth with enterprise SSO support. However, SOC 2 compliance is claimed but not yet independently verifiable from the public surface.",
    evidence: [
      "Partner API docs with attribution engine and rate-limit tiers",
      "Embed SDK described for broker and media surfaces",
      "Clerk managed auth supports SAML SSO for enterprise plans",
      "Role-based entitlement system (free/pro/enterprise) implemented",
      "Comprehensive FAQ documentation published",
    ],
    gaps: [
      "SOC 2 report not publicly linked or verifiable",
      "No DPA (Data Processing Agreement) template published",
      "No API versioning strategy published (risk of breaking changes for partners)",
      "Enterprise SLA (dedicated support, incident response time) not defined",
    ],
    recommendation: "Publish SOC 2 attestation letter (or link to trust portal). Publish a DPA template. Define API versioning policy (e.g., /api/v1/ prefix with 6-month deprecation window).",
  },
]

const greenCount = scoreCategories.filter((c) => c.score === "green").length
const amberCount = scoreCategories.filter((c) => c.score === "amber").length
const redCount = scoreCategories.filter((c) => c.score === "red").length

export default async function CTODeploymentReviewPage() {
  const locale = await getRequestLocale()
  if (locale === "ar") {
    return <ArabicDocPage locale={locale} content={getArabicDocsPage("cto-deployment-review")} />
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <header className="mb-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
          Platform Docs · Governance
        </p>
        <h1 className="mt-3 font-serif text-3xl font-medium text-foreground md:text-4xl">
          CTO Deployment Review
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
          Formal deployment readiness assessment. Green / Amber / Red scoring across six governance categories. Updated March 2026.
        </p>
      </header>

      {/* Executive summary */}
      <section className="mb-12 rounded-2xl border border-border/60 bg-card/50 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">Executive Summary</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Entrestate is a live, multi-surface production system with coherent architecture, active release cadence, and a documented one-system model. The platform scores strongly on product deployment and architecture maturity. Operational transparency and SRE readiness are functional but not yet at enterprise audit standard — the primary gaps are the absence of automated uptime monitoring, published SLOs, and a formal on-call policy. Enterprise readiness is strong in documentation and auth but requires SOC 2 public attestation and a DPA to close the compliance gap.
        </p>
        <p className="mt-3 text-sm font-medium text-foreground">
          Verdict: <span className="text-amber-300">CONDITIONAL PASS</span> — deploy-real, operationally functional, enterprise-readiness requires three targeted actions.
        </p>

        {/* Score summary */}
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">{greenCount} Green</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">{amberCount} Amber</span>
          </div>
          {redCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-2.5">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-semibold text-red-300">{redCount} Red</span>
            </div>
          )}
        </div>
      </section>

      {/* Score categories */}
      <section className="mb-12 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">Category Scores</h2>
        {scoreCategories.map((cat, i) => {
          const cfg = scoreConfig[cat.score]
          return (
            <div key={cat.category} className={`rounded-2xl border p-5 ${cfg.row}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{String(i + 1).padStart(2, "0")}</p>
                    <p className="text-sm font-semibold text-foreground">{cat.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}>{cfg.label}</span>
                  <span className="rounded-full border border-border/50 bg-card/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{cat.rating}</span>
                </div>
              </div>

              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{cat.summary}</p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">Evidence</p>
                  <ul className="space-y-1">
                    {cat.evidence.map((e) => (
                      <li key={e} className="flex gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/60" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-400/70">Gaps</p>
                  <ul className="space-y-1">
                    {cat.gaps.map((g) => (
                      <li key={g} className="flex gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500/60" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/40 bg-background/40 px-4 py-3">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Action: </span>{cat.recommendation}</p>
              </div>
            </div>
          )
        })}
      </section>

      {/* Priority actions */}
      <section className="mb-12">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">Priority Actions for Full Sign-Off</h2>
        <div className="space-y-3">
          {[
            { priority: "P1", action: "Connect an external uptime monitor to /api/health", why: "Required for any published SLA — without it, uptime claims are unverifiable.", timeline: "1 week" },
            { priority: "P1", action: "Publish formal SLOs on /status page", why: "Customers and partners need a declared uptime target to hold the platform accountable.", timeline: "1 week" },
            { priority: "P1", action: "Publish SOC 2 attestation or trust portal link", why: "Enterprise and institutional clients require this before contract signature.", timeline: "2–4 weeks" },
            { priority: "P2", action: "Add pipeline health alerting (stale data webhook)", why: "Silent pipeline failures are the highest-risk gap in the data integrity model.", timeline: "2 weeks" },
            { priority: "P2", action: "Publish DPA template for partners and enterprise", why: "GDPR / UAE PDPL compliance — required for any B2B data sharing agreement.", timeline: "2 weeks" },
            { priority: "P3", action: "Define and publish API versioning policy", why: "Prevents breaking changes from disrupting partner integrations at scale.", timeline: "1 month" },
          ].map((item) => (
            <div key={item.action} className="flex items-start gap-4 rounded-xl border border-border/50 bg-card/40 px-5 py-4">
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                item.priority === "P1"
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : item.priority === "P2"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-border/50 bg-card/60 text-muted-foreground"
              }`}>{item.priority}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.action}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.why}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground/60">{item.timeline}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Scores summary table */}
      <section>
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">Board Summary</h2>
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-card/60">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Category</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Score</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {scoreCategories.map((cat) => {
                const cfg = scoreConfig[cat.score]
                return (
                  <tr key={cat.category} className="bg-card/30">
                    <td className="px-5 py-3 text-sm text-foreground">{cat.category}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}>{cfg.label}</span>
                    </td>
                    <td className="px-5 py-3 text-center text-sm font-medium text-muted-foreground">{cat.rating}</td>
                  </tr>
                )
              })}
              <tr className="border-t border-border/60 bg-card/60">
                <td className="px-5 py-3 text-sm font-semibold text-foreground">Overall</td>
                <td className="px-5 py-3 text-center">
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-300">CONDITIONAL PASS</span>
                </td>
                <td className="px-5 py-3 text-center text-sm font-medium text-muted-foreground">7.0 / 10</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground/60">
          Reviewed: March 2026 · Next review: June 2026 or after P1 actions are completed.
        </p>
      </section>
    </div>
  )
}
