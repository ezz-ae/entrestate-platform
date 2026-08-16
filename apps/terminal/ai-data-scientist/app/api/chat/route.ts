import { NextResponse } from "next/server"
import { getDataset } from "@/lib/dataset-store"
import { buildDashboardSummary } from "@/lib/dashboard-summary"

type ChatResponse = {
  reply: string
  data?: {
    type: "list" | "stats"
    items?: Array<{ label: string; value: string }>
  }
}

function normalize(value: string): string {
  return value.toLowerCase().trim()
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim()
    const parsed = Number.parseFloat(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { datasetId, message } = body as { datasetId?: string; message?: string }

    if (!datasetId || !message) {
      return NextResponse.json({ error: "datasetId and message are required" }, { status: 400 })
    }

    const dataset = getDataset(datasetId)
    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }

    const summary = buildDashboardSummary(dataset.rows)
    const msg = normalize(message)

    const respondList = (title: string, items: Array<{ label: string; count: number }>): ChatResponse => ({
      reply: title,
      data: {
        type: "list",
        items: items.map((item) => ({ label: item.label, value: item.count.toLocaleString() })),
      },
    })

    if (msg.includes("top city") || msg.includes("top cities")) {
      return NextResponse.json(respondList("Top cities by project count.", summary.topCities))
    }

    if (msg.includes("top area") || msg.includes("top areas")) {
      return NextResponse.json(respondList("Top areas by project count.", summary.topAreas))
    }

    if (msg.includes("top developer") || msg.includes("top developers")) {
      return NextResponse.json(respondList("Top developers by project count.", summary.topDevelopers))
    }

    if (msg.includes("risk")) {
      return NextResponse.json(respondList("Risk mix across the market desk.", summary.riskDistribution))
    }

    if (msg.includes("delivery") || msg.includes("handover") || msg.includes("status")) {
      return NextResponse.json(respondList("Delivery window mix.", summary.deliveryDistribution))
    }

    if (msg.includes("confidence")) {
      return NextResponse.json(respondList("Evidence confidence mix.", summary.confidenceDistribution))
    }

    if (msg.includes("price") || msg.includes("pricing") || msg.includes("budget") || msg.includes("band")) {
      if (!summary.priceStats) {
        return NextResponse.json({ reply: "Pricing is not available in this view." })
      }
      return NextResponse.json({
        reply: "Pricing summary across the market desk.",
        data: {
          type: "stats",
          items: [
            { label: "Avg price", value: summary.priceStats.avg.toLocaleString() },
            { label: "Median price", value: summary.priceStats.median.toLocaleString() },
            { label: "Min price", value: summary.priceStats.min.toLocaleString() },
            { label: "Max price", value: summary.priceStats.max.toLocaleString() },
          ],
        },
      })
    }

    const cityMatch = summary.topCities.find((city) => msg.includes(normalize(city.label)))
    if (cityMatch && summary.columnsUsed.city) {
      const cityKey = summary.columnsUsed.city
      const rowsInCity = dataset.rows.filter((row) => {
        const value = row[cityKey] ? String(row[cityKey]).toLowerCase().trim() : ""
        return value === normalize(cityMatch.label)
      })

      const priceKey = summary.columnsUsed.price
      const prices = priceKey
        ? rowsInCity
            .map((row) => toNumber(row[priceKey]))
            .filter((value): value is number => value !== null)
        : []

      const avgPrice = prices.length
        ? (prices.reduce((a, b) => a + b, 0) / prices.length).toLocaleString()
        : "n/a"

      return NextResponse.json({
        reply: `Summary for ${cityMatch.label}.`,
        data: {
          type: "stats",
          items: [
            { label: "Projects", value: rowsInCity.length.toLocaleString() },
            { label: "Avg price", value: avgPrice },
          ],
        },
      })
    }

    if (msg.includes("summary") || msg.includes("overview")) {
      return NextResponse.json({
        reply: "Market overview snapshot.",
        data: {
          type: "stats",
          items: [
            { label: "Projects", value: summary.rowCount.toLocaleString() },
            { label: "Cities", value: summary.uniqueCities.toLocaleString() },
            { label: "Areas", value: summary.uniqueAreas.toLocaleString() },
            { label: "Developers", value: summary.uniqueDevelopers.toLocaleString() },
          ],
        },
      })
    }

    return NextResponse.json({
      reply:
        "Try asking about top cities, top areas, top developers, risk mix, delivery windows, or pricing bands.",
    })
  } catch (error) {
    console.error("Market chat error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to answer" },
      { status: 500 },
    )
  }
}
