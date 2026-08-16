import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"

const PHASES = [
  {
    title: "Signal Vigilance",
    body:
      "Agents monitor canonical inventory, DLD transactions, and leasing intent to spot actionable momentum and guardrails for every mandate.",
  },
  {
    title: "Evidence Orchestration",
    body:
      "The five-layer evidence stack validates each signal, flags exclusions, and produces the audit trail that feeds the Evidence Drawer and downstream actions.",
  },
  {
    title: "Deal Room Assembly",
    body:
      "Structured Deal Rooms (SDRs) materialize every listing, leasing specification, document, and approval checklist into a governed folder for execution.",
  },
  {
    title: "Contract Drafting",
    body:
      "Once approvals align, the platform drafts the leasing agreement, attaches provenance, and routes it to legal for signature—closing the execution loop.",
  },
]

export default function ExecutionPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-28">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">Execution Platform</p>
        <h1 className="mt-3 text-3xl font-serif font-semibold tracking-tight text-foreground lg:text-4xl">
          Autonomous execution that finishes with a drafted leasing contract
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-muted-foreground leading-relaxed">
          Entrestate turns the portfolio signal into a fully auditable execution path. Every step—from post-listing surveillance to SDR collations and final contract draft—runs on the same canonical dataset and Evidence Drawer record.
        </p>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          {PHASES.map((phase) => (
            <article key={phase.title} className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
              <h2 className="text-lg font-medium text-foreground">{phase.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{phase.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <h3 className="text-lg font-semibold text-foreground">Deal Room folders</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Every structured Deal Room (SDR) collects media, approvals, pricing, leasing metrics, and contract history inside a dedicated folder. Use the “Deal Room” signal to trigger downstream automations or share the folder link with investors, legal, or brokers.
          </p>
          <Link
            href="/apps/agent-builder"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-primary transition hover:bg-primary/10"
          >
            View automation blueprint
          </Link>
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-card/60 p-6">
          <h3 className="text-lg font-semibold text-foreground">Post-listing structure</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Once a listing is live, the execution layer tracks leasing progress, tenant approvals, and contract edits. Agents only advance to “Contract Drafted” when the Evidence Drawer is sealed, pricing is confirmed, and downstream legal gates are satisfied.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Leasing velocity dashboards refresh through canonical data every minute.</li>
            <li>• Deal Room folders link the SDR, automation logs, and Evidence Drawer snapshots.</li>
            <li>• Contract drafts export the verified terms plus a traceable provenance hash.</li>
          </ul>
        </section>
      </div>
      <Footer />
    </main>
  )
}
