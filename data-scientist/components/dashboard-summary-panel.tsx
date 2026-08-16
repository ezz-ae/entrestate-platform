"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/data-scientist/components/ui/card"
import type { DashboardSummary, SummaryItem } from "@/data-scientist/lib/dashboard-summary"

interface DashboardSummaryPanelProps {
  summary: DashboardSummary
}

const formatNumber = (value: number) => value.toLocaleString()

export function DashboardSummaryPanel({ summary }: DashboardSummaryPanelProps) {
  const topBand = summary.priceBands.reduce<SummaryItem | null>((acc, band) => {
    if (!acc || band.count > acc.count) return band
    return acc
  }, null)
  const topCity = summary.topCities[0]?.label
  const topDelivery = summary.deliveryDistribution[0]?.label
  const topRisk = summary.riskDistribution[0]?.label

  const briefLines = [
    `Tracking ${formatNumber(summary.rowCount)} projects across ${formatNumber(summary.uniqueCities)} cities.`,
    summary.uniqueDevelopers > 0
      ? `Active coverage across ${formatNumber(summary.uniqueDevelopers)} developer groups.`
      : null,
    topCity ? `Largest concentration sits in ${topCity}.` : null,
    topBand ? `Most inventory sits in the ${topBand.label} pricing band.` : null,
    topDelivery ? `Most common delivery window: ${topDelivery}.` : null,
    topRisk ? `Risk mix leans toward ${topRisk}.` : null,
  ]
    .filter(Boolean)
    .slice(0, 4) as string[]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Market brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {briefLines.map((line, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-foreground/50">•</span>
                <span>{line}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-border/60 bg-secondary/40 p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Snapshot</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Projects", value: formatNumber(summary.rowCount) },
              { label: "Cities", value: formatNumber(summary.uniqueCities) },
              { label: "Areas", value: formatNumber(summary.uniqueAreas) },
              { label: "Developers", value: formatNumber(summary.uniqueDevelopers) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border/50 bg-card/40 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="text-lg font-semibold text-foreground mt-2">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-foreground">Pricing lens</p>
            <span className="text-xs text-muted-foreground">AED bands</span>
          </div>
          {summary.priceStats ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Average", value: formatNumber(summary.priceStats.avg) },
                { label: "Median", value: formatNumber(summary.priceStats.median) },
                { label: "Min", value: formatNumber(summary.priceStats.min) },
                { label: "Max", value: formatNumber(summary.priceStats.max) },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Pricing not available.</p>
          )}
          {summary.priceBands.length > 0 && (
            <div className="mt-4 space-y-2">
              {summary.priceBands.map((band) => (
                <div key={band.label} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{band.label}</span>
                  <span>{formatNumber(band.count)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
          <p className="text-sm font-medium text-foreground mb-4">Concentration</p>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Top cities</p>
              {summary.topCities.map((city) => (
                <div key={city.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{city.label}</span>
                  <span className="text-foreground">{formatNumber(city.count)}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Top areas</p>
              {summary.topAreas.map((area) => (
                <div key={area.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{area.label}</span>
                  <span className="text-foreground">{formatNumber(area.count)}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Top developers</p>
              {summary.topDevelopers.map((dev) => (
                <div key={dev.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{dev.label}</span>
                  <span className="text-foreground">{formatNumber(dev.count)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
          <p className="text-sm font-medium text-foreground mb-3">Risk mix</p>
          {summary.riskDistribution.map((risk) => (
            <div key={risk.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{risk.label}</span>
              <span className="text-foreground">{formatNumber(risk.count)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/60 bg-secondary/40 p-5">
          <p className="text-sm font-medium text-foreground mb-3">Delivery windows</p>
          {summary.deliveryDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">Delivery windows not available.</p>
          ) : (
            summary.deliveryDistribution.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-foreground">{formatNumber(item.count)}</span>
              </div>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/40 p-5">
          <p className="text-sm font-medium text-foreground mb-3">Evidence confidence</p>
          {summary.confidenceDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">Confidence markers not available.</p>
          ) : (
            summary.confidenceDistribution.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-foreground">{formatNumber(item.count)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top ranked projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.topProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Rankings not available.</p>
          ) : (
            summary.topProjects.map((project) => (
              <div key={project.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{project.name}</span>
                  <span className="text-muted-foreground">{project.score.toFixed(1)}</span>
                </div>
                {(project.city || project.area) && (
                  <p className="text-xs text-muted-foreground">
                    {[project.city, project.area].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
