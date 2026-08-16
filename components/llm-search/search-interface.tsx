"use client"

import { LlmSidebar } from "./sidebar"
import { LlmSearchBar } from "./search-bar"
import { LlmWidgetCards } from "./widget-cards"

export function LlmSearchInterface() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <LlmSidebar />
      <main className="relative flex flex-1 items-center justify-center">
        <section className="relative w-full max-w-4xl px-4 py-16 text-center">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(34,211,238,0.12),_transparent_45%)]" />
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
            Ask Anything Real Estate
          </h1>
          <div className="mt-6">
            <LlmSearchBar />
          </div>
          <div className="mt-10">
            <LlmWidgetCards />
          </div>
        </section>
      </main>
    </div>
  )
}
