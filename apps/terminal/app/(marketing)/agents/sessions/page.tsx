import Link from "next/link"
import { Calendar, MessageSquare, PhoneCall, ArrowRight } from "lucide-react"
import { AppShell } from "@/seq/components/app-shell"

const sessionTypes = [
  {
    title: "Discovery Session",
    description: "Capture lead intent, budget range, and timing signals in a structured flow.",
    icon: MessageSquare,
  },
  {
    title: "Market Brief",
    description: "Deliver a guided market snapshot with pricing, supply, and velocity signals.",
    icon: Calendar,
  },
  {
    title: "Closing Call",
    description: "Document readiness, next actions, and contract timelines in one record.",
    icon: PhoneCall,
  },
]

export default function AgentSessionsPage() {
  return (
    <AppShell>
      <div className="page-container space-y-10">
        <div className="space-y-3">
          <p className="text-label uppercase tracking-wider text-[var(--text-tertiary)]">Agent Platform</p>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Sessions</h1>
          <p className="text-body max-w-2xl">
            Sessions structure every broker interaction. Each flow captures signals, outcomes, and next actions.
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
              href="/storyboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-accent-text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
            >
              Launch Storyboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sessionTypes.map((session) => (
            <div key={session.title} className="p-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)]">
              <session.icon className="w-5 h-5 text-[var(--accent-primary)]" />
              <h2 className="text-lg font-medium text-[var(--text-primary)] mt-4">{session.title}</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{session.description}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
