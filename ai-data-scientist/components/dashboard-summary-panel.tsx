"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardSummary, SummaryItem } from "@/lib/dashboard-summary"

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
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Market brief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {briefLines.map((line, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{line}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-[6px] border border-border/60 bg-card/60 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Projects</p>
          <p className="text-2xl font-semibold text-foreground mt-2">{formatNumber(summary.rowCount)}</p>
        </div>
        <div className="rounded-[6px] border border-border/60 bg-card/60 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Cities</p>
          <p className="text-2xl font-semibold text-foreground mt-2">{formatNumber(summary.uniqueCities)}</p>
        </div>
        <div className="rounded-[6px] border border-border/60 bg-card/60 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Areas</p>
          <p className="text-2xl font-semibold text-foreground mt-2">{formatNumber(summary.uniqueAreas)}</p>
        </div>
        <div className="rounded-[6px] border border-border/60 bg-card/60 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Developers</p>
          <p className="text-2xl font-semibold text-foreground mt-2">{formatNumber(summary.uniqueDevelopers)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
          <CardTitle className="text-sm font-medium">Pricing bands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.priceStats ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Average</span>
                  <span className="font-medium text-foreground">{formatNumber(summary.priceStats.avg)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Median</span>
                  <span className="font-medium text-foreground">{formatNumber(summary.priceStats.median)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Pricing not available.</p>
            )}
            {summary.priceBands.length > 0 && (
              <div className="space-y-2 pt-2">
                {summary.priceBands.map((band) => (
                  <div key={band.label} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{band.label}</span>
                    <span>{formatNumber(band.count)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top cities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.topCities.map((city) => (
              <div key={city.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{city.label}</span>
                <span className="font-medium text-foreground">{formatNumber(city.count)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.topAreas.map((area) => (
              <div key={area.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{area.label}</span>
                <span className="font-medium text-foreground">{formatNumber(area.count)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top developers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.topDevelopers.map((dev) => (
              <div key={dev.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{dev.label}</span>
                <span className="font-medium text-foreground">{formatNumber(dev.count)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Risk mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.riskDistribution.map((risk) => (
              <div key={risk.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{risk.label}</span>
                <span className="font-medium text-foreground">{formatNumber(risk.count)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Delivery windows</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.deliveryDistribution.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground">{formatNumber(item.count)}</span>
              </div>
            ))}
            {summary.deliveryDistribution.length === 0 && (
              <p className="text-sm text-muted-foreground">Delivery windows not available.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Evidence confidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.confidenceDistribution.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground">{formatNumber(item.count)}</span>
              </div>
            ))}
            {summary.confidenceDistribution.length === 0 && (
              <p className="text-sm text-muted-foreground">Confidence markers not available.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
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
    </div>
  )
}
