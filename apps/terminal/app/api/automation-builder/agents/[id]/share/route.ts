import { NextResponse } from "next/server"
import { getRequestContext } from "@/automation-builder/lib/request-context"
import { shareAgent } from "@/automation-builder/lib/store"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { teamId } = getRequestContext(request)
  const shareId = shareAgent(teamId, params.id)
  if (!shareId) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }
  return NextResponse.json({ shareId })
}
