import { NextResponse } from "next/server"
import { parseMarketScoreFilters } from "@/lib/market-score/filters"
import { getMarketScoreCharts } from "@/lib/market-score/service"
import { filtersSchema, routingSchema } from "@/lib/market-score/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const { filters, routing, overrideFlags } = parseMarketScoreFilters(searchParams)
    filtersSchema.parse(filters)
    routingSchema.parse(routing)
    const charts = await getMarketScoreCharts(filters, routing, overrideFlags)
    return NextResponse.json(charts)
  } catch (error) {
    console.error("Market score charts error:", error)
    return NextResponse.json({ error: "Failed to load market score charts." }, { status: 500 })
  }
}
