import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/api-errors"
import { listAreas, listDevelopers, getMarketPulse } from "@/lib/decision-infrastructure"
import { hasTierAccess } from "@/lib/tier-access"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  if (!await hasTierAccess(request, "institutional")) {
    return NextResponse.json({ error: "Institutional tier required", requestId }, { status: 403 })
  }

  const [areas, developers, pulse] = await Promise.all([listAreas(), listDevelopers(), getMarketPulse()])

  return NextResponse.json(
    {
      data_as_of: pulse.data_as_of,
      areas: areas.areas,
      developers: developers.developers,
      pulse,
      requestId,
    },
    { status: 200 },
  )
}

