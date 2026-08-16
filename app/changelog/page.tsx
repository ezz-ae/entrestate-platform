import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const releases = [
  {
    version: "v1.8",
    date: "Feb 2026",
    title: "Media brief library and project selector",
    notes: [
      "Brief cards flow directly into storyboard, image, and timeline creation.",
      "Project media is injected into creation flows.",
      "Unified studio palette with market dashboard colors.",
    ],
  },
  {
    version: "v1.7",
    date: "Jan 2026",
    title: "Market research desk",
    notes: [
      "Market snapshot loader connected to the Entrestate data spine.",
      "Market profiling and sampling improvements.",
      "New dashboard entry points for market exploration.",
    ],
  },
  {
    version: "v1.6",
    date: "Dec 2025",
    title: "Workflow hub and cold-calling desk",
    notes: [
      "Workflow hub refreshed with clearer descriptions and matching.",
      "Cold-calling desk added for outbound execution.",
    ],
  },
]

export default function ChangelogPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Changelog</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              Product updates
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Every release is focused on operational clarity and real estate execution.
            </p>
          </div>

          <div className="space-y-6">
            {releases.map((release) => (
              <div key={release.version} className="p-6 bg-card border border-border rounded-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{release.version}</p>
                    <h2 className="text-lg font-medium text-foreground">{release.title}</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{release.date}</span>
                </div>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                  {release.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link
              href="/roadmap"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              View roadmap
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
