import Link from "next/link"
import { ArrowRight, Users, Code, Database, Handshake, Briefcase, GraduationCap, Target, Zap } from "lucide-react"

import { getRequestLocale } from "@/i18n/request"
import { ArabicDocPage } from "@/components/docs/arabic-doc-page"
import { getArabicDocsPage } from "@/lib/docs-arabic-pages"
const engineeringRoles = [
  {
    title: "Platform Engineer",
    focus: "Full-stack development on the Intelligence OS — Next.js, TypeScript, Neon PostgreSQL, live data surfaces.",
    skills: ["React/Next.js", "TypeScript", "PostgreSQL", "API design", "Live systems"],
  },
  {
    title: "AI Infrastructure Engineer",
    focus: "Decision Tunnel implementation, TableSpec compiler, scoring engine, and evidence-grounded AI assistant development.",
    skills: ["LLM integration", "Prompt engineering", "Deterministic systems", "Structured output"],
  },
  {
    title: "Data Engineer",
    focus: "10-Phase Pipeline operations, 5-Layer Evidence Stack management, Static Truth Recovery, and canonical data governance.",
    skills: ["Data pipelines", "ETL/ELT", "Python/SQL", "Data quality", "Pipeline orchestration"],
  },
]

const businessRoles = [
  {
    title: "Partnership Development",
    focus: "Building and managing relationships with data partners, brokerages, and distribution ecosystem partners across UAE and GCC.",
    skills: ["B2B sales", "Partnership strategy", "Real estate industry", "API partnerships"],
  },
  {
    title: "Enterprise Solutions",
    focus: "Working with institutional clients (funds, developers, brokerages) to deploy Entrestate decision infrastructure within their operations.",
    skills: ["Enterprise sales", "Solution architecture", "Client success", "Revenue operations"],
  },
  {
    title: "Operations & Customer Success",
    focus: "Ensuring platform adoption, managing broker onboarding, and maintaining evidence quality standards across the Decision Tunnel.",
    skills: ["Operations management", "Customer success", "Process optimization", "Analytics"],
  },
]

const internTracks = [
  {
    title: "AI Operations Intern",
    description: "Work on the AI assistant's evidence grounding, prompt evaluation, and response quality. Help refine how the Decision Tunnel communicates with users.",
    duration: "3-6 months",
  },
  {
    title: "Market Data Research Intern",
    description: "Support Static Truth Recovery — extracting and verifying L1 Canonical data from brochures, developer websites, and regulatory databases.",
    duration: "3-6 months",
  },
  {
    title: "Investor & Partner Materials Intern",
    description: "Help produce investor-ready documentation, partnership decks, and diligence packages grounded in platform data and architecture documentation.",
    duration: "3-6 months",
  },
  {
    title: "Internal Tooling Intern",
    description: "Build automation prototypes for pipeline operations, evidence quality dashboards, and developer productivity tools.",
    duration: "3-6 months",
  },
]

const cultureValues = [
  {
    icon: Target,
    title: "Evidence Over Opinion",
    description: "Every claim is backed by data with provenance. We don't guess — we adjudicate. The same epistemic rigor in our product applies to how we make decisions as a team.",
  },
  {
    icon: Zap,
    title: "Systems Thinking",
    description: "We build unified architectures, not feature soup. Every team member understands how their work connects to the Pipeline-to-Tunnel flow and the Evidence Stack.",
  },
  {
    icon: Users,
    title: "Execution Discipline",
    description: "We ship deterministic outcomes. Code is reviewed for correctness, not just functionality. We measure confidence levels, not just completion rates.",
  },
]

export default async function CareersInternDocsPage() {
  const locale = await getRequestLocale()
  if (locale === "ar") {
    return <ArabicDocPage locale={locale} content={getArabicDocsPage("careers-intern")} />
  }

  return (
    <>
      {/* Hero */}
      <header className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-10">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Platform Docs / Careers</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground md:text-5xl">Careers & Internships</h1>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground leading-relaxed">
          Join the team building the <strong className="text-foreground">operating system for UAE real estate</strong>.
          We&apos;re replacing listing portals with decision infrastructure — and we need engineers, data scientists,
          and business builders who think in systems, not features.
        </p>
      </header>

      {/* Culture */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foreground">How We Work</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {cultureValues.map((value) => (
            <div key={value.title} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <value.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">{value.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Engineering Roles */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Engineering & Data</h2>
        </div>
        <div className="mt-5 space-y-4">
          {engineeringRoles.map((role) => (
            <div key={role.title} className="rounded-xl border border-border/60 bg-background/40 p-5">
              <h3 className="text-base font-semibold text-foreground">{role.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{role.focus}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {role.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Business Roles */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Handshake className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Business & Operations</h2>
        </div>
        <div className="mt-5 space-y-4">
          {businessRoles.map((role) => (
            <div key={role.title} className="rounded-xl border border-border/60 bg-background/40 p-5">
              <h3 className="text-base font-semibold text-foreground">{role.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{role.focus}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {role.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Internship Program */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Internship Program</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Structured internship tracks with mentorship and real project ownership. Interns work on production systems —
          not toy projects. Each track connects directly to the platform&apos;s core operations.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {internTracks.map((track) => (
            <div key={track.title} className="rounded-xl border border-border/60 bg-background/40 p-5">
              <h3 className="text-sm font-semibold text-foreground">{track.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{track.description}</p>
              <p className="mt-2 text-xs text-accent/80">{track.duration}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What You'll Work On */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">What You&apos;ll Work On</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Decision Infrastructure</h3>
            <p className="mt-1 text-xs text-muted-foreground">The 4-Stage Decision Tunnel, TableSpec compiler, and profile calibration engine that transforms queries into Decision Objects.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Data Pipeline</h3>
            <p className="mt-1 text-xs text-muted-foreground">The 10-Phase Pipeline processing the active UAE inventory through entity extraction, price verification, stress testing, and evidence compilation.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Evidence Stack</h3>
            <p className="mt-1 text-xs text-muted-foreground">5-Layer trust hierarchy, Static Truth Recovery, canonical data governance, and the Evidence Drawer transparency layer.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Market Intelligence</h3>
            <p className="mt-1 text-xs text-muted-foreground">Scoring engines, stress resilience models, volatility-gated refreshes, and AI-powered broker tools.</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Get in Touch</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          We hire for systems thinking, evidence discipline, and execution quality. If you&apos;re excited about
          building infrastructure that transforms how capital flows in UAE real estate, we want to hear from you.
        </p>
        <Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent">
          Contact the team
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  )
}