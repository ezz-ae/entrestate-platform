import Link from "next/link"
import { FileText, ShieldCheck, ArrowRight } from "lucide-react"
import { AppShell } from "@/seq/components/app-shell"

const contractSteps = [
  {
    title: "Intent Capture",
    description: "Standardize buyer intent, documentation, and deposit expectations.",
  },
  {
    title: "MOU Drafting",
    description: "Draft consistent MOU clauses with legal checkpoints and timelines.",
  },
  {
    title: "Execution Review",
    description: "Validate closing conditions, escrow status, and transfer windows.",
  },
]

export default function AgentContractsPage() {
  return (
    <AppShell>
      <div className="page-container space-y-10">
        <div className="space-y-3">
          <p className="text-label uppercase tracking-wider text-[var(--text-tertiary)]">Agent Platform</p>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Contracts</h1>
          <p className="text-body max-w-2xl">
            Contracts are structured with risk controls and compliance gates, keeping every transaction lawful.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-default)] text-sm text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] transition-colors"
            >
              Back to Studio
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/library/contracts-explained"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-accent-text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
            >
              Contract guides
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contractSteps.map((step) => (
            <div key={step.title} className="p-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)]">
              <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
              <h2 className="text-lg font-medium text-[var(--text-primary)] mt-4">{step.title}</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-xl bg-[var(--surface-3)] border border-[var(--border-default)] flex items-start gap-4">
          <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)] mt-1" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Compliance gating</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Every contract flow includes escalation checks for identity, escrow, and timeline validation.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
