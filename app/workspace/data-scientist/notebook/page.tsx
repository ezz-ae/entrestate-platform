"use client"

import Link from "next/link"
import { ArrowLeft, NotebookPen } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { NotebookPanel } from "@/data-scientist/components/notebook-panel"
import { Button } from "@/data-scientist/components/ui/button"

export default function DataScientistNotebookPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="min-h-screen bg-background pt-24">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-[var(--app-header-height)] z-40">
          <div className="container mx-auto flex items-center justify-between h-14 px-4">
            <Link
              href="/workspace/data-scientist"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to desk
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/workspace/data-scientist">Open desk</Link>
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-accent mb-2">
              <NotebookPen className="h-4 w-4" />
              Notebook
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Saved snapshots</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Reuse saved views to build briefs for clients, teams, and market reviews.
            </p>
          </div>

          <div className="max-w-3xl">
            <NotebookPanel />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
