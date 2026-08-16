import { NextResponse } from "next/server"
import { Prisma, dbQuery } from "@/lib/db"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { extractFolderId, resolveLeasingSchema, tableSql } from "@/lib/demo/leasing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function toText(value: unknown) {
  if (typeof value === "string") return value.trim().toLowerCase()
  return ""
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "true" || normalized === "1" || normalized === "yes"
  }
  return false
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
      return NextResponse.json({
        requestId,
        status: "published",
        message: "Published to Entrestate Transaction Layer",
        folderId,
        duration_ms: Date.now() - startedAt,
      })
    }

    const rows = await dbQuery<{ record: Record<string, unknown> }>(Prisma.sql`
      SELECT to_jsonb(t) AS record
      FROM ${tableSql(schema, "folders")} t
      WHERE to_jsonb(t) ->> 'id' = ${folderId}
         OR to_jsonb(t) ->> 'folder_id' = ${folderId}
      LIMIT 1
    `)

    const record = rows[0]?.record ?? null
    const resolvedId = extractFolderId(record) ?? folderId
    const statusValue = toText(record?.status ?? record?.state ?? record?.folder_state)
    const needsVerification =
      toBoolean(record?.verification_required) ||
      toBoolean(record?.collision_detected) ||
      toBoolean(record?.sybil_flag) ||
      statusValue.includes("collision") ||
      statusValue.includes("blocked") ||
      statusValue.includes("verify")

    if (needsVerification) {
      return NextResponse.json({
        requestId,
        status: "verification_required",
        message: "Upload Title Deed to verify ownership.",
        folderId: resolvedId,
        duration_ms: Date.now() - startedAt,
      })
    }

    return NextResponse.json({
      requestId,
      status: "published",
      message: "Published to Entrestate Transaction Layer",
      folderId: resolvedId,
      duration_ms: Date.now() - startedAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Publish attempt failed."), requestId },
      { status: 500 },
    )
  }
}
