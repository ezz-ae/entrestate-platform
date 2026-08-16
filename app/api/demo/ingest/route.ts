import { NextResponse } from "next/server"
import { Prisma, dbQuery } from "@/lib/db"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { extractFolderId, resolveLeasingSchema, tableExists, tableSql } from "@/lib/demo/leasing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DELTA_FIELDS = [
  { label: "price", keys: ["price_from_aed", "price_from", "price", "asking_price"] },
  { label: "bedrooms", keys: ["bedrooms", "beds", "bedrooms_min", "bedrooms_max"] },
  { label: "bathrooms", keys: ["bathrooms", "baths"] },
  { label: "size", keys: ["size_sqft", "size", "area_sqft", "unit_size"] },
  { label: "area", keys: ["area", "community", "location"] },
  { label: "developer", keys: ["developer", "developer_name", "company"] },
]

function pickValue(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) return null
  for (const key of keys) {
    const value = record[key]
    if (value !== null && value !== undefined && String(value).trim() !== "") return value
  }
  return null
}

function buildDeltas(raw: Record<string, unknown> | null, workspace: Record<string, unknown> | null) {
  return DELTA_FIELDS.map((field) => {
    const rawValue = pickValue(raw, field.keys)
    const workspaceValue = pickValue(workspace, field.keys)
    const status = workspaceValue ? "resolved" : rawValue ? "missing" : "unknown"
    return {
      field: field.label,
      status,
      rawValue: rawValue ?? null,
      workspaceValue: workspaceValue ?? null,
    }
  })
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const startedAt = Date.now()
  try {
    const body = await request.json().catch(() => ({}))
    const url = typeof body?.url === "string" ? body.url.trim() : ""
    if (!url) {
      return NextResponse.json({ error: "Missing url", requestId }, { status: 400 })
    }

    const schema = await resolveLeasingSchema()
    if (!schema) {
      return NextResponse.json(
        {
          requestId,
          folderId: null,
          raw: { url },
          workspace: { status: "pending" },
          deltas: buildDeltas({ url }, null),
          duration_ms: Date.now() - startedAt,
        },
        { status: 200 },
      )
    }

    const listingTable = (await tableExists(schema, "listing_imports")) ? "listing_imports" : null
    const listingRows = listingTable
      ? await dbQuery<{ record: Record<string, unknown> }>(Prisma.sql`
          SELECT to_jsonb(t) AS record
          FROM ${tableSql(schema, listingTable)} t
          WHERE to_jsonb(t)::text ILIKE ${`%${url}%`}
          LIMIT 1
        `)
      : []

    const listingRecord = listingRows[0]?.record ?? null
    const folderId = extractFolderId(listingRecord)

    const folderRows = await dbQuery<{ record: Record<string, unknown> }>(Prisma.sql`
      SELECT to_jsonb(t) AS record
      FROM ${tableSql(schema, "folders")} t
      WHERE (
        ${folderId ? Prisma.sql`to_jsonb(t) ->> 'id' = ${folderId} OR to_jsonb(t) ->> 'folder_id' = ${folderId}` : Prisma.sql`FALSE`}
        OR to_jsonb(t)::text ILIKE ${`%${url}%`}
      )
      LIMIT 1
    `)

    const workspaceRecord = folderRows[0]?.record ?? null

    return NextResponse.json({
      requestId,
      folderId: folderId ?? extractFolderId(workspaceRecord),
      raw: listingRecord ?? { url },
      workspace: workspaceRecord ?? { status: "pending" },
      deltas: buildDeltas(listingRecord ?? { url }, workspaceRecord),
      duration_ms: Date.now() - startedAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to ingest URL."), requestId },
      { status: 500 },
    )
  }
}
