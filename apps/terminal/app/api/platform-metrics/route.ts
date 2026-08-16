import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getPlatformMetrics } from "@/lib/platform-metrics.server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    const metrics = await getPlatformMetrics()
    return NextResponse.json(
      { ...metrics, requestId, request_id: requestId },
      { headers: { "x-request-id": requestId } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: getPublicErrorMessage(error, "Failed to load platform metrics."),
        requestId,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    )
  }
}
