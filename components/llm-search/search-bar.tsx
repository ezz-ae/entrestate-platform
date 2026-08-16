"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function LlmSearchBar({ onSearch }: { onSearch?: () => void }) {
  const [query, setQuery] = useState("")

  return (
    <div className="rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-[0_4px_20px_rgb(0,0,0,0.22)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label htmlFor="llm-search" className="sr-only">
          Ask anything about real estate
        </label>
        <input
          id="llm-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && query.trim()) {
              onSearch?.()
            }
          }}
          placeholder="Ask anything about real estate..."
          className="h-11 w-full rounded-lg border border-border/60 bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <Button
          className="h-11 w-full md:w-32"
          onClick={() => {
            if (query.trim()) onSearch?.()
          }}
        >
          Ask
        </Button>
      </div>
    </div>
  )
}
