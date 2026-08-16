"use client"

import { Progress } from "@/components/ui/progress"
import { getScoreExplanation, type ScoreKey } from "@/lib/copy/trust"

type ScoreExplainerProps = {
  scoreKey: ScoreKey
  value: number
  showWhatItIsnt?: boolean
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export function ScoreExplainer({
  scoreKey,
  value,
  showWhatItIsnt = true,
}: ScoreExplainerProps) {
  const copy = getScoreExplanation(scoreKey)
  const clamped = clampScore(value)

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{copy.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.range}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-foreground">{clamped}</p>
          <p className="text-[11px] text-muted-foreground">out of 100</p>
        </div>
      </div>

      <Progress value={clamped} className="mt-4" />

      <div className="mt-4 space-y-2 text-sm">
        <p className="text-foreground">{copy.what_it_is}</p>
        {showWhatItIsnt ? (
          <p className="text-muted-foreground">{copy.what_it_isn_t}</p>
        ) : null}
      </div>
    </div>
  )
}
