import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getStressTestByProjectName } from "@/lib/decision-infrastructure"
import { hasTierAccess } from "@/lib/tier-access"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, context: { params: Promise<{ name: string }> }) {
  const requestId = getRequestId(request)

  if (!await hasTierAccess(request, "pro")) {
    return NextResponse.json({ error: "Pro tier required", requestId }, { status: 403 })
  }

  try {
    const { name } = await context.params
    const data = await getStressTestByProjectName(decodeURIComponent(name))
    return NextResponse.json({ ...data, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to load stress test."), requestId },
      { status: 500 },
    )
  }
}

