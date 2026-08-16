import Link from "next/link"
import { LeadAgentChat } from "@/components/lead-agent-chat"
import { CheckCircle2, ArrowRight, PhoneCall, MessageCircle, Globe, QrCode } from "lucide-react"

const features = [
  "Instant qualification and lead scoring",
  "Scripts tailored to real estate intent",
  "Routes qualified leads to your team",
]

const channels = [
  { label: "Instagram DM", icon: MessageCircle },
  { label: "Website widget", icon: Globe },
  { label: "QR codes", icon: QrCode },
]

export default function LeadAgentLandingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="container mx-auto px-6 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Insta DM Lead Desk
            </div>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              Chat with the real estate lead desk.
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Answer a few questions, and our team will match you with the right inventory. This flow is designed to
              qualify intent and route serious leads quickly.
            </p>

            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  {feature}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {channels.map((channel) => (
                <div key={channel.label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground">
                  <channel.icon className="w-3.5 h-3.5 text-accent" />
                  {channel.label}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/apps/lead-agent"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Lead desk setup
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md hover:border-accent/40 transition-colors"
              >
                Talk to sales
                <PhoneCall className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div>
            <LeadAgentChat />
          </div>
        </div>
      </div>
    </main>
  )
}
