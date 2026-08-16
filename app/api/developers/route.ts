import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { listDevelopers } from "@/lib/decision-infrastructure"
import { buildDataSyncMeta } from "@/lib/data-sync-contract"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const data = await listDevelopers()
    return NextResponse.json({
      ...data,
      sync: buildDataSyncMeta("developers", data.data_as_of),
      requestId,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to load developer profiles."), requestId },
      { status: 500 },
    )
  }
}
