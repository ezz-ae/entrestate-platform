"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { StickyNote, Link2, FileText, Loader2, Plus } from "lucide-react"
import Link from "next/link"

type ChatSession = {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  _count?: { messages: number }
}

export default function NotesPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/chat/sessions")
      .then((res) => (res.ok ? res.json() : { sessions: [] }))
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Market Files</p>
              <h1 className="mt-3 text-3xl md:text-5xl font-serif text-foreground">Notes with proof, not opinions.</h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
                Market Files capture narrative and evidence side-by-side so decisions remain auditable.
              </p>
            </div>
            <CopilotEntryLink
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" /> New note
            </CopilotEntryLink>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-border/70 bg-card/30 p-12 text-center">
                <StickyNote className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No market files yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Start a chat session to create your first market file with evidence.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Market Files", detail: "Narratives tied to Time Tables, with citations preserved.", icon: StickyNote },
                  { title: "Linked Evidence", detail: "Every note references rows, columns, and provenance metadata.", icon: Link2 },
                  { title: "Client Briefs", detail: "Draft memos for investors, brokers, and internal teams.", icon: FileText },
                ].map((card) => (
                  <div key={card.title} className="rounded-2xl border border-border/70 bg-card/70 p-6">
                    <card.icon className="h-5 w-5 text-accent" />
                    <h2 className="mt-4 text-lg font-semibold text-foreground">{card.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/chat?session=${session.id}`}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 p-5 transition hover:border-primary/30"
                >
                  <div>
                    <h3 className="text-sm font-medium text-foreground">
                      {session.title || "Untitled session"}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(session.updatedAt).toLocaleDateString()}
                      {session._count?.messages ? ` \u00b7 ${session._count.messages} messages` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
