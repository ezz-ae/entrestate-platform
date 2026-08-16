import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { listAreas } from "@/lib/decision-infrastructure"
import { buildDataSyncMeta } from "@/lib/data-sync-contract"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const data = await listAreas()
    return NextResponse.json(
      {
        ...data,
        sync: buildDataSyncMeta("areas", data.data_as_of),
        requestId,
        request_id: requestId,
      },
      { headers: { "x-request-id": requestId } },
    )
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to load area profiles."), requestId, request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    )
  }
}
