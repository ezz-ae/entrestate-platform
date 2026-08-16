import { NextResponse } from "next/server"
import { cloneAgent } from "@/automation-builder/lib/store"
import { getRequestContext } from "@/automation-builder/lib/request-context"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { teamId } = getRequestContext(request)
  const agent = cloneAgent(teamId, params.id)
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }
  return NextResponse.json({ agent }, { status: 201 })
}
