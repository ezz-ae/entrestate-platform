import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowRight, PhoneCall, ClipboardCheck, LineChart, ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Cold Calling - Entrestate",
  description:
    "Run outbound calling with scripts, lead queues, and outcome logging in one console.",
}

export default function ColdCallingPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Cold Calling</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              Outbound calling, structured for outcomes.
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
              Queue-based dialing, script guidance, and disposition tracking in a single workspace. Keep every call
              consistent, measurable, and tied to the right next action.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-12">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-7">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <PhoneCall className="h-4 w-4 text-accent" />
                Call flow
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                {[
                  "Select lead list and call priority.",
                  "Follow the script with consistent questions.",
                  "Log outcome and next action in one click.",
                  "Send follow-up summary to the team.",
                ].map((step, index) => (
                  <div key={step} className="rounded-xl border border-border/60 bg-background/50 p-4">
                    <p className="text-xs text-muted-foreground">Step {index + 1}</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-7">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <LineChart className="h-4 w-4 text-accent" />
                Operator metrics
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Track call volume, qualification rate, and handoff quality without spreadsheets.
              </p>
              <div className="mt-4 space-y-3 text-xs text-muted-foreground">
                <div>• Calls per session</div>
                <div>• Qualified vs unqualified outcomes</div>
                <div>• Follow-up actions due this week</div>
              </div>
              <div className="mt-6 rounded-xl border border-border/60 bg-background/50 p-4 text-xs text-muted-foreground">
                No new tooling required — the call desk logs everything automatically.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6 mb-12">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-7">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ClipboardCheck className="h-4 w-4 text-accent" />
                What gets captured
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>Budget range, intent, and timing notes.</li>
                <li>Call outcomes with next action.</li>
                <li>Lead status updates for your CRM.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/50 p-7">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Best practice
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Keep scripts short, avoid jargon, and always end with a clear next step. The desk keeps the
                language consistent so your team stays aligned.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/apps"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Apps
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/apps/docs/cold-calling"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-border rounded-md hover:border-accent/40 transition-colors"
            >
              Read the call guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
