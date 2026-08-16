import { NextResponse } from "next/server"
import { Prisma, dbQuery } from "@/lib/db"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { resolveLeasingSchema, tableExists, tableSql } from "@/lib/demo/leasing"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const FALLBACK_TRANSITIONS = [
  { from: "draft", to: "review_needed" },
  { from: "draft", to: "ready" },
  { from: "review_needed", to: "ready" },
  { from: "ready", to: "published" },
  { from: "published", to: "held_primary" },
  { from: "held_primary", to: "published" },
  { from: "held_primary", to: "pending_yield_decision" },
  { from: "held_primary", to: "in_negotiation" },
  { from: "in_negotiation", to: "in_contact_consent" },
  { from: "in_contact_consent", to: "in_contract" },
  { from: "in_contract", to: "signed" },
  { from: "signed", to: "deposit_pending" },
  { from: "deposit_pending", to: "rented" },
  { from: "rented", to: "archived" },
]

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const startedAt = Date.now()
  try {
    const schema = await resolveLeasingSchema()
    if (!schema || !(await tableExists(schema, "folder_state_transitions"))) {
      return NextResponse.json({
        requestId,
        transitions: FALLBACK_TRANSITIONS,
        duration_ms: Date.now() - startedAt,
      })
    }

    const rows = await dbQuery<{ from_state: string | null; to_state: string | null }>(Prisma.sql`
      SELECT
        COALESCE(
          NULLIF(to_jsonb(t) ->> 'from_state', ''),
          NULLIF(to_jsonb(t) ->> 'state_from', ''),
          NULLIF(to_jsonb(t) ->> 'from', '')
        ) AS from_state,
        COALESCE(
          NULLIF(to_jsonb(t) ->> 'to_state', ''),
          NULLIF(to_jsonb(t) ->> 'state_to', ''),
          NULLIF(to_jsonb(t) ->> 'to', '')
        ) AS to_state
      FROM ${tableSql(schema, "folder_state_transitions")} t
    `)

    const transitions = rows
      .filter((row) => row.from_state && row.to_state)
      .map((row) => ({ from: row.from_state as string, to: row.to_state as string }))

    return NextResponse.json({
      requestId,
      transitions: transitions.length > 0 ? transitions : FALLBACK_TRANSITIONS,
      duration_ms: Date.now() - startedAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to load transitions."), requestId },
      { status: 500 },
    )
  }
}
