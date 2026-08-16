import { NextResponse } from "next/server"
import "server-only"
import { createProfile, sampleRows } from "@/lib/profiler"
import { setDataset } from "@/lib/dataset-store"
import type { StoredDataset, UploadResponse } from "@/lib/types"
import { prisma } from "@/lib/prisma"
const QUERY_TIMEOUT_MS = 20000

export async function POST() {
  try {
    let rows: Record<string, unknown>[] = []
    let source = "neon"

    const hasDatabaseUrl = Boolean(
      process.env.DATABASE_URL ||
        process.env.DATABASE_URL_UNPOOLED ||
        process.env.NEON_DATABASE_URL ||
        process.env.NEON_DATABASE_URL_UNPOOLED,
    )

    if (hasDatabaseUrl) {
      try {
        const rawRows = await withTimeout(
          prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM entrestate_master`,
          QUERY_TIMEOUT_MS,
          "entrestate_master",
        )
        rows = rawRows.map((row) =>
          Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, normalizeValue(value)]),
          ),
        )
      } catch (error) {
        console.error("Neon dataset error:", error)
        source = "neon"
      }
    } else {
      source = "neon"
    }

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

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms (${label})`)), ms)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId!)
  }
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    const asNumber = Number(value)
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (value && typeof value === "object" && "toNumber" in value) {
    try {
      return (value as { toNumber: () => number }).toNumber()
    } catch {
      return value
    }
  }

  return value
}
