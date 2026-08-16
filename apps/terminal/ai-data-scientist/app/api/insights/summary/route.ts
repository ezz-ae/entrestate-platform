import { NextResponse } from "next/server"
import { getDataset } from "@/lib/dataset-store"
import { buildDashboardSummary } from "@/lib/dashboard-summary"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { datasetId } = body as { datasetId?: string }

    if (!datasetId) {
      return NextResponse.json({ error: "datasetId is required" }, { status: 400 })
    }

    const dataset = getDataset(datasetId)
    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }

    const summary = buildDashboardSummary(dataset.rows)
    return NextResponse.json(summary)
  } catch (error) {
    console.error("Dashboard summary error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to build dashboard summary" },
      { status: 500 },
    )
  }
}
