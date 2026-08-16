import { Server, GitBranch, RefreshCw, Shield, Database, Layers, ArrowRight, CheckCircle, AlertTriangle, Zap } from "lucide-react"

import { getRequestLocale } from "@/i18n/request"
import { ArabicDocPage } from "@/components/docs/arabic-doc-page"
import { getArabicDocsPage } from "@/lib/docs-arabic-pages"
const environments = [
  {
    name: "Production",
    url: "entrestate.com",
    provider: "Vercel (Edge Network)",
    branch: "main",
    database: "Neon — Primary (pooled, 20 connections)",
    status: "Live",
    color: "border-emerald-500/40 bg-emerald-500/8 text-emerald-400",
    dot: "bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]",
  },
  {
    name: "Preview / Staging",
    url: "entrestate-git-*.vercel.app",
    provider: "Vercel (Preview Deployments)",
    branch: "Any PR branch",
    database: "Neon — Branched DB (schema-isolated)",
    status: "Auto-deployed",
    color: "border-amber-500/40 bg-amber-500/8 text-amber-400",
    dot: "bg-amber-400",
  },
  {
    name: "Development",
    url: "localhost:3000",
    provider: "Local Next.js dev server",
    branch: "Feature branches",
    database: "Neon — Dev branch or local PG",
    status: "Manual",
    color: "border-blue-500/40 bg-blue-500/8 text-blue-400",
    dot: "bg-blue-400",
  },
]

const infraStack = [
  { layer: "Compute", component: "Next.js 15 (App Router)", note: "Server components, streaming RSC, edge runtime for API routes", icon: Zap },
  { layer: "Hosting", component: "Vercel", note: "Global edge CDN, instant rollback, PR preview deployments, ISR", icon: Server },
  { layer: "Database", component: "Neon (PostgreSQL 16)", note: "Serverless Postgres with branching; Prisma ORM for schema + queries", icon: Database },
  { layer: "Auth", component: "Clerk", note: "Managed auth, JWT session tokens, role-based access (free/pro/enterprise)", icon: Shield },
  { layer: "AI / LLM", component: "Anthropic Claude + AI SDK", note: "claude-sonnet-4-6 for decision copilot; streaming via Vercel AI SDK", icon: Layers },
  { layer: "Storage", component: "Vercel Blob / Neon JSONB", note: "Report artifacts in Blob; evidence payloads in Neon JSONB columns", icon: Database },
]

const releaseSteps = [
  { step: "1", name: "Feature branch", detail: "Developer opens PR against main. Vercel creates an isolated preview deployment with a Neon DB branch." },
  { step: "2", name: "Preview review", detail: "Stakeholder verifies the preview URL. Automated build checks (type-check, lint) must pass before merge is unblocked." },
  { step: "3", name: "Merge to main", detail: "PR is squash-merged. Vercel triggers a production build. Zero-downtime deployment with atomic swap." },
  { step: "4", name: "Smoke check", detail: "Post-deploy smoke script hits /api/health, /api/market-pulse, and /api/copilot/sessions to verify live service integrity." },
  { step: "5", name: "Rollback (if needed)", detail: "Vercel dashboard: one-click 'Promote to production' on the previous deployment. RTO < 60 seconds." },
]

const dataRefreshPolicy = [
  { signal: "Pipeline cadence", value: "Daily (off-peak UAE, ~02:00 GST)", color: "text-sky-400" },
  { signal: "L1 Canonical refresh", value: "Weekly batch + triggered on RERA/DLD delta", color: "text-emerald-400" },
  { signal: "L3 Dynamic signals", value: "Hourly recalculation (BUY/HOLD/WAIT timing)", color: "text-amber-400" },
  { signal: "Market pulse", value: "Realtime query at request time (force-dynamic)", color: "text-violet-400" },
  { signal: "Report artifacts", value: "Immutable once generated; re-generated on demand", color: "text-sky-400" },
  { signal: "AI session history", value: "Persisted per-user in Neon on every completion", color: "text-emerald-400" },
]

export default async function DeploymentArchitecturePage() {
  const locale = await getRequestLocale()
  if (locale === "ar") {
    return <ArabicDocPage locale={locale} content={getArabicDocsPage("deployment-architecture")} />
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
          Platform Docs · Engineering
        </p>
        <h1 className="mt-3 font-serif text-3xl font-medium text-foreground md:text-4xl">
          Deployment Architecture
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
          Infrastructure topology, environment separation, release policy, and data refresh schedule for the Entrestate platform.
        </p>
      </header>

      {/* Environment separation */}
      <section className="mb-12">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">01</h2>
        <h3 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary/70" />
          Environment Separation
        </h3>
        <div className="space-y-3">
          {environments.map((env) => (
            <div key={env.name} className={`rounded-2xl border p-5 ${env.color}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${env.dot}`} />
                  <p className="text-sm font-semibold text-foreground">{env.name}</p>
                </div>
                <span className="rounded-full border border-current/20 bg-current/10 px-2.5 py-0.5 text-xs font-medium">
                  {env.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] text-muted-foreground sm:grid-cols-2 md:grid-cols-3">
                <div><span className="font-medium text-foreground/60">URL: </span>{env.url}</div>
                <div><span className="font-medium text-foreground/60">Host: </span>{env.provider}</div>
                <div><span className="font-medium text-foreground/60">Branch: </span>{env.branch}</div>
                <div className="sm:col-span-2 md:col-span-3"><span className="font-medium text-foreground/60">Database: </span>{env.database}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Infrastructure stack */}
      <section className="mb-12">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">02</h2>
        <h3 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
          <Server className="h-5 w-5 text-primary/70" />
          Infrastructure Stack
        </h3>
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-card/60">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Layer</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Component</th>
                <th className="hidden px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 md:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {infraStack.map((row) => {
                const Icon = row.icon
                return (
                  <tr key={row.layer} className="bg-card/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                        <span className="text-xs font-medium text-muted-foreground">{row.layer}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{row.component}</td>
                    <td className="hidden px-5 py-3.5 text-xs text-muted-foreground md:table-cell">{row.note}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Release policy */}
      <section className="mb-12">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">03</h2>
        <h3 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary/70" />
          Release Policy & Rollback
        </h3>
        <div className="relative space-y-0">
          {releaseSteps.map((step, i) => (
            <div key={step.step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card text-xs font-bold text-primary">
                  {step.step}
                </div>
                {i < releaseSteps.length - 1 && (
                  <div className="w-px flex-1 bg-border/40 my-1" />
                )}
              </div>
              <div className={`pb-6 ${i === releaseSteps.length - 1 ? "pb-0" : ""}`}>
                <p className="text-sm font-semibold text-foreground">{step.name}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-300">Rollback policy</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Vercel preserves the last 10 production deployments. Any can be instantly promoted back.
                Database schema rollbacks require Prisma migration down-steps — run before promoting if schema changed.
                Target RTO: &lt;60 seconds for compute. RPO: zero (Neon PITR to any point within 30 days).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data refresh schedule */}
      <section className="mb-12">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">04</h2>
        <h3 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
          <Database className="h-5 w-5 text-primary/70" />
          Data Refresh Schedule
        </h3>
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <div className="divide-y divide-border/40">
            {dataRefreshPolicy.map((row) => (
              <div key={row.signal} className="flex items-center justify-between bg-card/30 px-5 py-3.5">
                <p className="text-sm text-muted-foreground">{row.signal}</p>
                <p className={`text-sm font-medium tabular-nums ${row.color}`}>{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Health check endpoints */}
      <section>
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">05</h2>
        <h3 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary/70" />
          Health Check Endpoints
        </h3>
        <div className="space-y-2">
          {[
            { path: "GET /api/health", desc: "Basic liveness probe — returns 200 OK when compute is healthy", tag: "Liveness" },
            { path: "GET /api/market-pulse", desc: "Verifies database connectivity and data freshness", tag: "Readiness" },
            { path: "GET /api/copilot/sessions", desc: "Auth + DB read path — confirms Clerk + Neon integration", tag: "Readiness" },
            { path: "GET /properties", desc: "Full render path including decision-infrastructure query", tag: "Smoke" },
          ].map((item) => (
            <div key={item.path} className="flex flex-wrap items-start gap-3 rounded-xl border border-border/50 bg-card/40 px-5 py-3.5">
              <code className="shrink-0 rounded bg-background/60 px-2 py-0.5 text-xs font-mono text-primary/80">{item.path}</code>
              <p className="flex-1 text-sm text-muted-foreground">{item.desc}</p>
              <span className="shrink-0 rounded-full border border-border/50 bg-card/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">{item.tag}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}