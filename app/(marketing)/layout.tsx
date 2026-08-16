import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { MarketingProviders } from "./marketing-providers"
import "./seq.css"

export const metadata: Metadata = {
  title: "Media Creator - Entrestate",
  description:
    "Create storyboards, visuals, and launch-ready video timelines from project media.",
}

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="seq-scope font-sans antialiased">
      <header className="app-header fixed top-0 left-0 right-0 z-50 h-14 border-b border-[var(--border-default)] bg-[var(--surface-0)]/90 backdrop-blur">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-[var(--text-primary)]">
            <div className="flex gap-0.5" aria-hidden="true">
              <div className="w-2.5 h-2.5 rounded-sm bg-[var(--text-primary)]" />
              <div className="w-2.5 h-2.5 rounded-sm bg-[var(--text-tertiary)]" />
              <div className="w-2.5 h-2.5 rounded-sm bg-[var(--accent)]" />
            </div>
            <span className="text-sm font-semibold tracking-tight">entrestate</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-xs text-[var(--text-tertiary)]">
            <Link href="/markets" className="hover:text-[var(--text-primary)] transition-colors">Explorer</Link>
            <Link href="/top-data" className="hover:text-[var(--text-primary)] transition-colors">Top Data</Link>
            <Link href="/library" className="hover:text-[var(--text-primary)] transition-colors">Library</Link>
            <Link href="/workspace" className="hover:text-[var(--text-primary)] transition-colors">Workspace</Link>
            <Link href="/apps" className="hover:text-[var(--text-primary)] transition-colors">Apps</Link>
          </nav>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline text-[var(--text-tertiary)]">Media Creator</span>
            <Link
              href="/account"
              className="rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
            >
              Account
            </Link>
          </div>
        </div>
      </header>
      <MarketingProviders>{children}</MarketingProviders>
    </div>
  )
}
