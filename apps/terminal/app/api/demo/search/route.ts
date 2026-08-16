import { NextResponse } from "next/server"
import { Prisma, dbQuery } from "@/lib/db"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { extractFolderId, normalizeString, parseNumber, resolveLeasingSchema, tableExists, tableSql } from "@/lib/demo/leasing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parseMaxPrice(query: string): number | null {
  const cleaned = query.replace(/,/g, " ").toLowerCase()
  const match = cleaned.match(/(\d+(?:\.\d+)?)(\s*)(m|mn|million|k|thousand)?/)
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value)) return null
  const unit = match[3]
  if (unit === "m" || unit === "mn" || unit === "million") return value * 1_000_000
  if (unit === "k" || unit === "thousand") return value * 1_000
  if (value > 1000) return value
  return null
}

function pickText(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) return ""
  for (const key of keys) {
    const value = normalizeString(record[key])
    if (value) return value
  }
  return ""
}

function pickPrice(record: Record<string, unknown> | null): number | null {
  if (!record) return null
  return (
    parseNumber(record.price_from_aed) ??
    parseNumber(record.price_from) ??
    parseNumber(record.price) ??
    parseNumber(record.asking_price) ??
    parseNumber(record.rent) ??
    null
  )
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const startedAt = Date.now()
  try {
    const body = await request.json().catch(() => ({}))
    const query = typeof body?.query === "string" ? body.query.trim() : ""
    if (!query) {
      return NextResponse.json({ error: "Missing query", requestId }, { status: 400 })
    }

    const schema = await resolveLeasingSchema()
    if (!schema) {
      return NextResponse.json({
        requestId,
        results: [],
        duration_ms: Date.now() - startedAt,
      })
    }

    const priceLimit = parseMaxPrice(query)
    const priceExpr = Prisma.sql`
      COALESCE(
        NULLIF(to_jsonb(t) ->> 'price_from_aed', '')::numeric,
        NULLIF(to_jsonb(t) ->> 'price_from', '')::numeric,
        NULLIF(to_jsonb(t) ->> 'price', '')::numeric,
        NULLIF(to_jsonb(t) ->> 'asking_price', '')::numeric
      )
    `
    const whereClause = priceLimit
      ? Prisma.sql`to_jsonb(t)::text ILIKE ${`%${query}%`} AND ${priceExpr} <= ${priceLimit}`
      : Prisma.sql`to_jsonb(t)::text ILIKE ${`%${query}%`}`

    const rows = await dbQuery<{ record: Record<string, unknown> }>(Prisma.sql`
      SELECT to_jsonb(t) AS record
      FROM ${tableSql(schema, "folders")} t
      WHERE ${whereClause}
      LIMIT 5
    `)

    const results = rows.map((row) => {
      const record = row.record
      return {
        id: extractFolderId(record) ?? "",
        name: pickText(record, ["name", "title", "project_name", "listing_title"]) || "Untitled",
        area: pickText(record, ["area", "community", "location", "city"]),
        price: pickPrice(record),
      }
    }).filter((entry) => entry.id)

    let queueDepthMap = new Map<string, number>()
    if (results.length > 0 && await tableExists(schema, "folder_queue_entries")) {
      const ids = results.map((entry) => entry.id)
      const queueRows = await dbQuery<{ folder_id: string | null; depth: number }>(Prisma.sql`
        SELECT (to_jsonb(t) ->> 'folder_id') AS folder_id, COUNT(*)::int AS depth
        FROM ${tableSql(schema, "folder_queue_entries")} t
        WHERE (to_jsonb(t) ->> 'folder_id') IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}`))})
        GROUP BY 1
      `)
      queueDepthMap = new Map(queueRows.map((row) => [String(row.folder_id), row.depth]))
    }

    const resultsWithQueue = results.map((entry) => ({
      ...entry,
      queueDepth: queueDepthMap.get(entry.id) ?? 0,
    }))

    return NextResponse.json({
      requestId,
      results: resultsWithQueue,
      duration_ms: Date.now() - startedAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Search failed."), requestId },
      { status: 500 },
    )
  }
}
