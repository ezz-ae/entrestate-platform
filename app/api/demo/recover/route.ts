import { NextResponse } from "next/server"
import { Prisma, dbQuery } from "@/lib/db"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { extractFolderId, normalizeString, parseNumber, resolveLeasingSchema, tableSql } from "@/lib/demo/leasing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

function computeSimilarity(basePrice: number | null, candidatePrice: number | null) {
  if (!basePrice || !candidatePrice) return 0.92
  const diff = Math.abs(basePrice - candidatePrice)
  const pct = diff / basePrice
  return Math.max(0.82, Number((1 - pct).toFixed(2)))
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const startedAt = Date.now()
  try {
    const body = await request.json().catch(() => ({}))
    const folderId = typeof body?.folderId === "string" || typeof body?.folderId === "number"
      ? String(body.folderId)
      : null

    if (!folderId) {
      return NextResponse.json({ error: "Missing folderId", requestId }, { status: 400 })
    }

    const schema = await resolveLeasingSchema()
    if (!schema) {
      return NextResponse.json({ requestId, matches: [], duration_ms: Date.now() - startedAt })
    }

    const baseRows = await dbQuery<{ record: Record<string, unknown> }>(Prisma.sql`
      SELECT to_jsonb(t) AS record
      FROM ${tableSql(schema, "folders")} t
      WHERE to_jsonb(t) ->> 'id' = ${folderId}
         OR to_jsonb(t) ->> 'folder_id' = ${folderId}
      LIMIT 1
    `)

    const baseRecord = baseRows[0]?.record ?? null
    const baseArea = pickText(baseRecord, ["area", "community", "location", "city"])
    const basePrice = pickPrice(baseRecord)

    const areaClause = baseArea ? Prisma.sql`to_jsonb(t)::text ILIKE ${`%${baseArea}%`}` : Prisma.sql`TRUE`

    const rows = await dbQuery<{ record: Record<string, unknown> }>(Prisma.sql`
      SELECT to_jsonb(t) AS record
      FROM ${tableSql(schema, "folders")} t
      WHERE ${areaClause}
        AND (to_jsonb(t) ->> 'id' IS DISTINCT FROM ${folderId})
      LIMIT 3
    `)

    const matches = rows.map((row) => {
      const record = row.record
      const candidatePrice = pickPrice(record)
      return {
        id: extractFolderId(record) ?? "",
        name: pickText(record, ["name", "title", "project_name", "listing_title"]) || "Untitled",
        area: pickText(record, ["area", "community", "location", "city"]),
        price: candidatePrice,
        similarity: computeSimilarity(basePrice, candidatePrice),
      }
    }).filter((entry) => entry.id)

    return NextResponse.json({
      requestId,
      matches,
      duration_ms: Date.now() - startedAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Recovery failed."), requestId },
      { status: 500 },
    )
  }
}
