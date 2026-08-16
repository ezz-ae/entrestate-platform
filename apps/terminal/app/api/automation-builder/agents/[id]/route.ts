import { NextResponse } from "next/server"
import { deleteAgent, getAgent, updateAgent } from "@/automation-builder/lib/store"
import { getRequestContext } from "@/automation-builder/lib/request-context"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { teamId } = getRequestContext(request)
  const agent = getAgent(teamId, params.id)
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }
  return NextResponse.json({ agent })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { teamId } = getRequestContext(request)
  const patch = await request.json()
  const agent = updateAgent(teamId, params.id, patch)
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }
  return NextResponse.json({ agent })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { teamId } = getRequestContext(request)
  deleteAgent(teamId, params.id)
  return NextResponse.json({ ok: true })
}
