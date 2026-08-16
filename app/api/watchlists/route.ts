import { NextResponse } from "next/server"
import { z } from "zod"
import { getRequestId } from "@/lib/api-errors"
import { createWatchlist } from "@/lib/runtime-store"
import { hasTierAccess } from "@/lib/tier-access"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  name: z.string().trim().min(1).max(120),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  if (!await hasTierAccess(request, "team")) {
    return NextResponse.json({ error: "Team tier required", requestId }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid watchlist payload", requestId }, { status: 400 })
  }

  const watchlist = createWatchlist(parsed.data.name)
  return NextResponse.json({ watchlist, requestId })
}

