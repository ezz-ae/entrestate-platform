import { NextResponse } from "next/server"
import { Prisma, dbQuery } from "@/lib/db"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { buildInsertSql, resolveLeasingSchema, tableExists, tableSql } from "@/lib/demo/leasing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const WRITE_THROUGH = process.env.DEMO_WRITE_THROUGH === "true"

function parseExpiry(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value
  if (value instanceof Date) return value.toISOString()
  return null
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
        status: "held",
        hold_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        folderId,
        duration_ms: Date.now() - startedAt,
      })
    }

    let existingHold: Record<string, unknown> | null = null
    const hasHoldTable = await tableExists(schema, "folder_holds")
    if (hasHoldTable) {
      const holdRows = await dbQuery<{ record: Record<string, unknown> }>(Prisma.sql`
        SELECT to_jsonb(t) AS record
        FROM ${tableSql(schema, "folder_holds")} t
        WHERE to_jsonb(t) ->> 'folder_id' = ${folderId}
        ORDER BY to_jsonb(t) ->> 'created_at' DESC NULLS LAST
        LIMIT 1
      `)
      existingHold = holdRows[0]?.record ?? null
    }

    const expiresAt = parseExpiry(existingHold?.expires_at ?? existingHold?.expiresAt ?? existingHold?.expiry)
    if (expiresAt && new Date(expiresAt).getTime() > Date.now()) {
      return NextResponse.json({
        requestId,
        status: "held",
        hold_expires_at: expiresAt,
        folderId,
        duration_ms: Date.now() - startedAt,
      })
    }

    let queueDepth = 0
    const hasQueueTable = await tableExists(schema, "folder_queue_entries")
    if (hasQueueTable) {
      const queueRows = await dbQuery<{ depth: number }>(Prisma.sql`
        SELECT COUNT(*)::int AS depth
        FROM ${tableSql(schema, "folder_queue_entries")} t
        WHERE to_jsonb(t) ->> 'folder_id' = ${folderId}
      `)
      queueDepth = queueRows[0]?.depth ?? 0
    }

    if (queueDepth > 0) {
      if (WRITE_THROUGH && hasQueueTable) {
        const now = new Date()
        const queueInsert = await buildInsertSql(schema, "folder_queue_entries", {
          folder_id: folderId,
          created_at: now,
          updated_at: now,
          status: "queued",
          queue_status: "queued",
          position: queueDepth + 1,
          priority: 1,
          source: "demo",
        })
        if (queueInsert) {
          try {
            await dbQuery(queueInsert)
          } catch {
            // Non-blocking demo write-through
          }
        }
      }
      return NextResponse.json({
        requestId,
        status: "queued",
        queue_position: queueDepth + 1,
        folderId,
        duration_ms: Date.now() - startedAt,
      })
    }

    if (WRITE_THROUGH && hasHoldTable) {
      const now = new Date()
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
      const holdInsert = await buildInsertSql(schema, "folder_holds", {
        folder_id: folderId,
        created_at: now,
        updated_at: now,
        expires_at: expiresAt,
        expiry: expiresAt,
        status: "held",
        hold_status: "active",
        source: "demo",
      })
      if (holdInsert) {
        try {
          await dbQuery(holdInsert)
        } catch {
          // Non-blocking demo write-through
        }
      }
    }

    return NextResponse.json({
      requestId,
      status: "held",
      hold_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      folderId,
      duration_ms: Date.now() - startedAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Hold request failed."), requestId },
      { status: 500 },
    )
  }
}
