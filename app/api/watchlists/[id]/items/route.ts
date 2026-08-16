import { NextResponse } from "next/server"
import { z } from "zod"
import { getRequestId } from "@/lib/api-errors"
import { addWatchlistItem } from "@/lib/runtime-store"
import { hasTierAccess } from "@/lib/tier-access"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  name: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(180).optional(),
})

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)
  if (!await hasTierAccess(request, "team")) {
    return NextResponse.json({ error: "Team tier required", requestId }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid watchlist item payload", requestId }, { status: 400 })
  }

  const { id } = await context.params
  const watchlist = addWatchlistItem(id, parsed.data)
  if (!watchlist) {
    return NextResponse.json({ error: "Watchlist not found", requestId }, { status: 404 })
  }

  return NextResponse.json({ watchlist, requestId })
}

