import Link from "next/link"
import { CheckCircle2, ArrowRight, Users } from "lucide-react"
import { AppShell } from "@/seq/components/app-shell"

const onboardingSteps = [
  "Verify brokerage identity and licensing",
  "Map preferred markets and inventory focus",
  "Connect marketing surfaces and data sources",
  "Activate first decision workflow",
]

export default function AgentOnboardingPage() {
  return (
    <AppShell>
      <div className="page-container space-y-10">
        <div className="space-y-3">
          <p className="text-label uppercase tracking-wider text-[var(--text-tertiary)]">Agent Platform</p>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Onboarding</h1>
          <p className="text-body max-w-2xl">
            Structured onboarding ensures every team has data, governance, and execution paths configured.
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
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-accent-text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
            >
              Request onboarding
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)]">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-lg font-medium text-[var(--text-primary)]">Launch checklist</h2>
          </div>
          <ul className="space-y-3">
            {onboardingSteps.map((step) => (
              <li key={step} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-primary)] mt-0.5" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
