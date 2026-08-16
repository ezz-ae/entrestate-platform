"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import QRCode from "qrcode"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  PhoneCall,
  Globe,
  QrCode,
  Copy,
  Sparkles,
  Mail,
  ShieldCheck,
} from "lucide-react"

const qualificationFlow = [
  {
    step: "1",
    title: "Intent capture",
    detail: "Buyer vs investor, preferred city, and target property type.",
  },
  {
    step: "2",
    title: "Budget + timeline",
    detail: "Range, down payment comfort, and delivery window.",
  },
  {
    step: "3",
    title: "Qualification gates",
    detail: "Readiness score, financing clarity, and decision urgency.",
  },
  {
    step: "4",
    title: "Lead handoff",
    detail: "Push qualified leads to your CRM and notify your team.",
  },
]

const deploymentChannels = [
  {
    title: "Instagram DM",
    description: "Connect to your business inbox and auto-qualify inbound DMs.",
    icon: MessageCircle,
  },
  {
    title: "Website widget",
    description: "Embed the agent on your site to convert browsing traffic.",
    icon: Globe,
  },
  {
    title: "QR codes",
    description: "Add to business cards, brochures, and sales decks.",
    icon: QrCode,
  },
  {
    title: "Landing page",
    description: "Share a dedicated agent page for instant lead capture.",
    icon: Sparkles,
  },
]

export default function LeadAgentPage() {
  const [agentName, setAgentName] = useState("Entrestate Lead Agent")
  const [agentSlug, setAgentSlug] = useState("entrestate-dm")
  const [origin, setOrigin] = useState("https://entrestate.ai")
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const agentUrl = useMemo(() => `${origin}/lead-agent?agent=${agentSlug}`, [origin, agentSlug])

  useEffect(() => {
    let isMounted = true
    QRCode.toDataURL(agentUrl, { width: 180, margin: 1 })
      .then((url) => {
        if (isMounted) setQrDataUrl(url)
      })
      .catch(() => setQrDataUrl(null))

    return () => {
      isMounted = false
    }
  }, [agentUrl])

  const widgetSnippet = `<script src="${origin}/agent-widget.js" data-agent="${agentSlug}" data-name="${agentName}" data-theme="dark" data-host="${origin}"></script>`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(widgetSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="mx-auto w-full max-w-[1440px] px-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-10 items-start mb-14">
            <div>
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Insta DM Lead Agent</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              Turn Instagram DMs into qualified real estate leads.
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
              Offer a fast, professional lead desk that asks the right questions, verifies intent, and routes serious
              buyers to your team. No technical language, just clear qualification.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Connect Instagram DM
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={agentUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-border rounded-md hover:border-accent/40 transition-colors"
              >
                Open agent page
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">What it delivers</p>
              <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                  <span>Captures intent, budget, and timing without feeling like a form.</span>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5" />
                  <span>Only qualified leads reach your team, with evidence attached.</span>
                </div>
                <div className="flex items-start gap-3">
                  <PhoneCall className="w-4 h-4 text-emerald-400 mt-0.5" />
                  <span>Ready for follow-up calls, CRM, and inbox alerts.</span>
                </div>
              </div>
              <div className="mt-6 rounded-xl border border-border/60 bg-secondary/40 p-4 text-xs text-muted-foreground">
                Built for brokers and developers who want a clear qualification path, not a chatbot.
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-border/70 bg-background/40 p-7 mb-10">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Understanding</p>
                <h2 className="text-xl font-semibold text-foreground">How the lead desk qualifies</h2>
              </div>
              <div className="text-xs text-muted-foreground">
                A short, guided conversation with no heavy forms.
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {qualificationFlow.map((item) => (
                <div key={item.step} className="rounded-xl border border-border/60 bg-card/70 p-5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                    {item.step}
                  </div>
                  <p className="text-sm font-medium text-foreground mt-4">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Decision</p>
                <h2 className="text-xl font-semibold text-foreground">Choose how buyers reach you</h2>
              </div>
              <p className="text-xs text-muted-foreground">Pick one or combine multiple entry points.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {deploymentChannels.map((channel) => (
                <div key={channel.title} className="rounded-2xl border border-border/70 bg-card/70 p-6">
                  <channel.icon className="w-5 h-5 text-accent" />
                  <p className="text-sm font-medium text-foreground mt-3">{channel.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">{channel.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/60 p-7 mb-12">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">After service</p>
                <h2 className="text-xl font-semibold text-foreground">Implementation kit</h2>
              </div>
              <p className="text-xs text-muted-foreground">For your web team or admin.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
              <div className="rounded-xl border border-border/60 bg-background/40 p-5">
                <h3 className="text-sm font-medium text-foreground mb-3">Instagram DM setup</h3>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                  <li>Connect your Instagram Business account to Meta Business Suite.</li>
                  <li>Authorize Entrestate Lead Agent to read and reply to DMs.</li>
                  <li>Set qualification rules and escalation alerts.</li>
                  <li>Launch and monitor qualified leads.</li>
                </ul>
              </div>
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-5">
                <h3 className="text-sm font-medium text-foreground mb-3">Website widget</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Paste this snippet on your website to launch the lead desk widget.
                </p>
                <div className="bg-background/60 border border-border rounded-md p-3 text-xs font-mono text-muted-foreground break-all">
                  {widgetSnippet}
                </div>
                <button
                  onClick={handleCopy}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-foreground hover:text-accent transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied" : "Copy snippet"}
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-[0.7fr_1.3fr] gap-6">
              <div className="rounded-xl border border-border/60 bg-background/40 p-5">
                <h3 className="text-sm font-medium text-foreground mb-3">QR code</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Use on cards, flyers, or booths for instant lead capture.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-md border border-border bg-secondary/40 flex items-center justify-center">
                    {qrDataUrl ? (
                      <Image src={qrDataUrl} alt="Lead agent QR" width={80} height={80} unoptimized />
                    ) : (
                      <span className="text-xs text-muted-foreground">QR unavailable</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Link</p>
                    <p className="break-all">{agentUrl}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/70 p-5">
                <h3 className="text-sm font-medium text-foreground mb-3">Agent identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="text-xs text-muted-foreground">
                    Agent name
                    <input
                      value={agentName}
                      onChange={(event) => setAgentName(event.target.value)}
                      className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Agent slug
                    <input
                      value={agentSlug}
                      onChange={(event) => setAgentSlug(event.target.value)}
                      className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Primary channel
                    <select className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                      <option>Instagram DM</option>
                      <option>Website widget</option>
                      <option>Landing page</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-background/40 p-7">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Knowledge base</p>
            <h2 className="text-lg font-semibold text-foreground mb-4">What the lead desk knows</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                <p className="text-foreground font-medium mb-1">Inventory intelligence</p>
                <p>Project inventory, unit types, pricing bands, and delivery windows.</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                <p className="text-foreground font-medium mb-1">Developer execution</p>
                <p>Delivery confidence, historical completion, and trust signals.</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                <p className="text-foreground font-medium mb-1">Market demand</p>
                <p>Area velocity, absorption trends, and live intent signals.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
