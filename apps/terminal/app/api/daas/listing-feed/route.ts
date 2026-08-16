import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/api-errors"
import { listProperties } from "@/lib/decision-infrastructure"
import { hasTierAccess } from "@/lib/tier-access"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  if (!await hasTierAccess(request, "institutional")) {
    return NextResponse.json({ error: "Institutional tier required", requestId }, { status: 403 })
  }

  const feed = await listProperties({ page: 1, pageSize: 2000, sortBy: "god_metric" })
  return NextResponse.json({ ...feed, requestId })
}

