import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Play, Sparkles, Film, Layers } from "lucide-react"
import { Button } from "@/seq/components/ui/button"
import { SeqLogo } from "@/seq/components/ui/logo"

export const metadata: Metadata = {
  title: "Media Creator Demo - Entrestate",
  description: "A cinematic demo sequence produced inside the Entrestate Media Creator.",
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-24">
      {/* Header */}
      <header className="sticky top-[var(--app-header-height)] z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/agents">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <SeqLogo className="w-6 h-6 text-foreground" />
              <div className="flex items-baseline gap-2">
                <h1 className="text-base font-semibold tracking-tight">Demo</h1>
                <span className="text-xs text-muted-foreground hidden sm:inline">Made with Seq</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/storyboard">
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs bg-transparent">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Try Storyboard
                </Button>
              </Link>
              <Link href="/timeline">
                <Button size="sm" className="h-8 px-3 text-xs">
                  Open Editor
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-bg-subtle)] border border-[var(--accent-border)] text-xs font-medium text-[var(--accent-text)] mb-6">
            <Play className="w-3 h-3" />
            Demo Showcase
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Waterfront Launch Film</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
            A sample launch montage that demonstrates the full Media Creator flow. Replace this footage with your
            project media for a client-ready release.
          </p>
        </div>

        {/* Video Player */}
        <div className="relative mb-12 group">
          <div className="absolute -inset-1 bg-gradient-to-b from-[var(--accent-primary)]/20 to-transparent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
          <div className="relative bg-[var(--surface-0)] border border-[var(--border-default)] rounded-xl shadow-2xl overflow-hidden">
            <video
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_y6denQY7uSeu9lM3GpnpQCz5KYdE/fbU5DYKN4uclkGtJg_2gXP/public/demo.mp4"
              controls
              className="w-full aspect-video bg-black"
              poster="/seq-poster.svg"
            />
          </div>
        </div>

        {/* How It Was Made Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">How we built this</h3>
            <p className="text-muted-foreground text-sm">A simple launch flow from brief to final cut</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Storyboard Tool */}
            <div className="p-6 rounded-xl bg-secondary/50 border border-border hover:border-[var(--accent-border)] transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--accent-bg-subtle)] rounded-lg flex items-center justify-center text-[var(--accent-text)] shrink-0 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-2">Storyboard Builder</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    We mapped the launch story from arrival to amenities and skyline. The master board set the tone,
                    then we refined each panel and added smooth transitions for pacing.
                  </p>
                  <Link href="/storyboard">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-[var(--accent-text)] hover:text-[var(--accent-primary)]"
                    >
                      Try Storyboard
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Timeline Editor */}
            <div className="p-6 rounded-xl bg-secondary/50 border border-border hover:border-[var(--accent-border)] transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--accent-secondary)]/20 rounded-lg flex items-center justify-center text-[var(--accent-secondary)] shrink-0 group-hover:scale-110 transition-transform">
                  <Film className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-2">Timeline Editor</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    We arranged the clips on the timeline, pacing the arrival, lobby, amenities, and skyline moments.
                    Added ambient audio and exported the final cut for launch use.
                  </p>
                  <Link href="/timeline">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-[var(--accent-secondary)] hover:text-[var(--accent-primary)]"
                    >
                      Open Editor
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Studio Stack */}
          <div className="text-center pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">Studio stack</p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                Storyboard flow
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-secondary)]" />
                Timeline editor
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Export engine
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <footer className="border-t border-border bg-secondary/30 py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h3 className="text-xl font-semibold mb-3">Ready to create your own?</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
            Start with a simple brief and let the studio handle the rest — from storyboard to final cut.
          </p>
          <Link href="/storyboard">
            <Button size="lg" className="h-11 px-8">
              <Sparkles className="w-4 h-4 mr-2" />
              Start Creating
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  )
}
