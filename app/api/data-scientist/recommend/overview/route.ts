import { NextResponse } from "next/server"
import { getDataset } from "@/data-scientist/lib/dataset-store"
import { generateOverview } from "@/data-scientist/lib/recommender"
import type { RecommendResponse } from "@/data-scientist/lib/types"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { datasetId } = body

    if (!datasetId) {
      return NextResponse.json({ error: "datasetId is required" }, { status: 400 })
    }

    const dataset = getDataset(datasetId)

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }

    const rows = dataset.rows
    const charts = generateOverview(dataset.profile, rows)

    const response: RecommendResponse = { charts }
    return NextResponse.json(response)
  } catch (error) {
    console.error("Overview error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate overview" },
      { status: 500 }
    )
  }
}
