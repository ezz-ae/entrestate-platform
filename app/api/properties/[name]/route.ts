import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getProjectBySlug } from "@/lib/decision-infrastructure"
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
    const detail = await getProjectBySlug(decodeURIComponent(name))

    if (!detail) {
      return NextResponse.json({ error: "Project not found", requestId }, { status: 404 })
    }

    return NextResponse.json({ ...detail, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to load project details."), requestId },
      { status: 500 },
    )
  }
}

