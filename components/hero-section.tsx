import Link from "next/link"
import { ArrowRight, BarChart3, FileText, Users } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
      <div className="container mx-auto px-6">
        {/* Badge */}
        <div className="animate-fade-in-up mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-secondary rounded-full border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Real Estate Market Technology
          </span>
        </div>

        {/* Headline */}
        <div className="max-w-3xl">
          <h1 className="animate-fade-in-up-1 text-4xl md:text-6xl lg:text-7xl font-serif text-foreground leading-[1.1] tracking-tight text-balance">
            Study markets.
            <br />
            <span className="text-muted-foreground">Operate decisions.</span>
          </h1>

          <p className="animate-fade-in-up-2 mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
            A professional workspace for understanding price behavior, analyzing areas, and acting through verified agents.
          </p>

          <div className="animate-fade-in-up-3 mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/workspace"
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Open Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/markets"
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-foreground border border-border rounded-md hover:bg-secondary transition-colors"
            >
              Explore Markets
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="animate-fade-in-up-4 mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-4 p-6 bg-card border border-border rounded-lg">
            <div className="p-2.5 bg-secondary rounded-md">
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-serif text-foreground">Market Analysis</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">Cities, areas, projects. Market views with scenario-aware comparisons.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-card border border-border rounded-lg">
            <div className="p-2.5 bg-secondary rounded-md">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-serif text-foreground">Agent Execution</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">Verified professionals draft contracts, manage sessions, and execute safely.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-card border border-border rounded-lg">
            <div className="p-2.5 bg-secondary rounded-md">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-serif text-foreground">Knowledge Library</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">Market reports, pricing behavior, transaction patterns. What we learned.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
