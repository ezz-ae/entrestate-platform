"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight } from "lucide-react"

type ProfileSuggestionProps = {
  userId: string
  context: string // e.g. "ROI analysis"
}

export function ProfileSuggestion({ userId, context }: ProfileSuggestionProps) {
  const [suggestion, setSuggestion] = useState<{ text: string, action: string } | null>(null)

  useEffect(() => {
    // In a real implementation, this would call /api/profile/infer with behavioral signals
    // For now, we stub the "Coin Flip" logic
    if (context.toLowerCase().includes("roi") || context.toLowerCase().includes("yield")) {
      setSuggestion({
        text: "You emphasized ROI, but you haven't checked exit velocity for this area yet.",
        action: "Show Liquidity Risk"
      })
    } else if (context.toLowerCase().includes("safety") || context.toLowerCase().includes("risk")) {
      setSuggestion({
        text: "You prioritized safety, but there's a high-yield opportunity in a nearby emerging area.",
        action: "Compare with Arjan"
      })
    }
  }, [context])

  if (!suggestion) return null

  return (
    <Card className="p-4 bg-primary/5 border-primary/20 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm font-medium">{suggestion.text}</p>
      </div>
      <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
        {suggestion.action} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  )
}
