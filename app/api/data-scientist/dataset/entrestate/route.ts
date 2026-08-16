import { NextResponse } from "next/server"
import "server-only"
import { createProfile, sampleRows } from "@/data-scientist/lib/profiler"
import { setDataset } from "@/data-scientist/lib/dataset-store"
import type { StoredDataset, UploadResponse } from "@/data-scientist/lib/types"
import { getEntrestateRows } from "@/lib/daas/data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const { rows, source } = await getEntrestateRows({ maxRows: 50000, preferTable: "entrestate_master" })

    if (rows.length === 0) {
      return NextResponse.json({ error: "Failed to load Entrestate dataset" }, { status: 500 })
    }

    const datasetId = `ds_entrestate_${Date.now()}`
    const profile = createProfile(datasetId, rows)
    const sampledRows = sampleRows(rows)

    const dataset: StoredDataset = {
      datasetId,
      profile,
      rows,
      sampleRows: sampledRows,
    }
    setDataset(dataset)

    const response: UploadResponse = {
      datasetId,
      profile,
      storedDataset: dataset,
    }

    return NextResponse.json({ ...response, source })
  } catch (error) {
    console.error("Entrestate dataset error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dataset" },
      { status: 500 },
    )
  }
}
