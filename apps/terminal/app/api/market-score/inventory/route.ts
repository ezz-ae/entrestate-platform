import { NextResponse } from "next/server"
import { parseMarketScoreFilters } from "@/lib/market-score/filters"
import { getMarketScoreInventory } from "@/lib/market-score/service"
import { filtersSchema, paginationSchema, rankedRequirementsSchema, routingSchema } from "@/lib/market-score/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    const asNumber = Number(value)
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString()
  }
  if (value instanceof Date) return value.toISOString()
  if (value && typeof value === "object" && "toNumber" in value) {
    try {
      return (value as { toNumber: () => number }).toNumber()
    } catch {
      return value
    }
  }
  if (Array.isArray(value)) return value.map((item) => normalizeValue(item))
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, normalizeValue(val)]),
    )
  }
  return value
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const escapeValue = (value: unknown) => {
    if (value === null || value === undefined) return ""
    const stringValue = typeof value === "string" ? value : JSON.stringify(value)
    if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }
  const lines = rows.map((row) => headers.map((header) => escapeValue(row[header])).join(","))
  return [headers.join(","), ...lines].join("\n")
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const { filters, routing, overrideFlags, pagination } = parseMarketScoreFilters(searchParams)
    const format = searchParams.get("format")
    const exportMode = format === "csv"
    const exportPagination = exportMode ? { page: 1, pageSize: 5000 } : pagination

    filtersSchema.parse(filters)
    routingSchema.parse(routing)
    paginationSchema.parse(exportPagination)

    if (routing.ranked) {
      const required = rankedRequirementsSchema.safeParse(routing)
      if (!required.success) {
        return NextResponse.json(
          { error: "Ranked recommendations require risk profile, horizon, and budget." },
          { status: 400 },
        )
      }
    }

    const effectiveOverrides = routing.ranked ? { allow2030Plus: false, allowSpeculative: false } : overrideFlags

    const inventory = await getMarketScoreInventory(filters, routing, effectiveOverrides, exportPagination)
    const normalizedInventory = normalizeValue(inventory) as typeof inventory

    if (exportMode) {
      const csv = toCsv(normalizedInventory.rows as Record<string, unknown>[])
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=market-score-inventory.csv",
        },
      })
    }

    return NextResponse.json(normalizedInventory)
  } catch (error) {
    console.error("Market score inventory error:", error)
    return NextResponse.json({ error: "Failed to load market score inventory." }, { status: 500 })
  }
}
