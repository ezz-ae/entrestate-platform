import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getTopDataRows } from "@/lib/frontend-content"
import { buildDataSyncMeta } from "@/lib/data-sync-contract"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    const data = await getTopDataRows()
    return NextResponse.json({
      ...data,
      sync: buildDataSyncMeta("topData", data.data_as_of),
      requestId,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to load top data."), requestId },
      { status: 500 },
    )
  }
}
