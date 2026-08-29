import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { ensureCommentsTasksTable } from "@/lib/freehold/ensure-inherited-tables"
import { getReviewItems } from "@/src/features/freehold-intelligence/data-access"

export async function GET() {
  const comments = await getReviewItems("comment")
  return NextResponse.json({ comments })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { page_ref?: string; body?: string; author?: string }
  if (!body.body?.trim()) return NextResponse.json({ error: "body is required" }, { status: 400 })

  // On a database that did not inherit this table, the first comment anyone
  // leaves used to throw 42P01. Everything else in this codebase provisions
  // itself on first touch; this now does too.
  await ensureCommentsTasksTable()

  const rows = await query(
    `INSERT INTO freehold_comments_tasks (kind, page_ref, body, author, status)
     VALUES ('comment', $1, $2, $3, 'open')
     RETURNING *`,
    [body.page_ref || "freehold-intelligence", body.body.trim(), body.author || "Freehold stakeholder"]
  )
  return NextResponse.json({ comment: rows[0] }, { status: 201 })
}
