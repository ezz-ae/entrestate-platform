import { NextResponse } from "next/server"
import { getRequestContext } from "@/automation-builder/lib/request-context"
import { updateAgent } from "@/automation-builder/lib/store"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { teamId } = getRequestContext(request)
  const agent = updateAgent(teamId, params.id, { status: "active" })
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }
  return NextResponse.json({ agent })
}
