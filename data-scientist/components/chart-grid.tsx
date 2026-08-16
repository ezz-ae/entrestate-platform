"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/data-scientist/components/ui/card"
import { VegaChart } from "@/data-scientist/components/vega-chart"
import { cn } from "@/data-scientist/lib/utils"
import type { VisSpec } from "@/data-scientist/lib/types"

interface ChartGridProps {
  charts: VisSpec[]
  selectedChartId: string | null
  onSelectChart: (chart: VisSpec) => void
  emptyMessage?: string
}

// Extract width from Vega-Lite spec
function getChartWidth(spec: object): number {
  const vegaSpec = spec as { width?: number | string }
  if (typeof vegaSpec.width === "number") {
    return vegaSpec.width
  }
  return 300 // Default width
}

export function ChartGrid({
  charts,
  selectedChartId,
  onSelectChart,
  emptyMessage = "No views available",
}: ChartGridProps) {
  if (charts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  const tileTones = [
    "bg-card/60",
    "bg-muted/30",
    "bg-secondary/40",
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {charts.map((chart, index) => (
        <Card
          key={chart.id}
          className={cn(
            "cursor-pointer transition-all border-border/60 backdrop-blur-sm hover:border-foreground/20 hover:shadow-lg",
            tileTones[index % tileTones.length],
            selectedChartId === chart.id && "ring-1 ring-foreground/30 border-foreground/30"
          )}
          onClick={() => onSelectChart(chart)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium truncate" title={chart.title}>
              {chart.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VegaChart spec={chart.vegaLite} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
