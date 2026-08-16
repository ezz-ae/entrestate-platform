import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const startedAt = Date.now()
  try {
    const body = await request.json().catch(() => ({}))
    const partyA = Array.isArray(body?.partyA) ? body.partyA.filter((item: unknown) => typeof item === "string") : []
    const partyB = Array.isArray(body?.partyB) ? body.partyB.filter((item: unknown) => typeof item === "string") : []

    const shared = partyA.filter((channel: string) => partyB.includes(channel))

    return NextResponse.json({
      requestId,
      shared,
      duration_ms: Date.now() - startedAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Consent check failed."), requestId },
      { status: 500 },
    )
  }
}
