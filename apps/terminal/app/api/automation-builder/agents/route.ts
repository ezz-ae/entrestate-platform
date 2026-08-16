import { NextResponse } from "next/server"
import { createAgent, listAgents } from "@/automation-builder/lib/store"
import { getRequestContext } from "@/automation-builder/lib/request-context"
import { AgentDefinitionSchema } from "@/automation-builder/lib/agent-types"

export async function GET(request: Request) {
  const { teamId } = getRequestContext(request)
  return NextResponse.json({ agents: listAgents(teamId) })
}

export async function POST(request: Request) {
  const { teamId } = getRequestContext(request)
  const body = await request.json()
  const parsed = AgentDefinitionSchema.omit({ id: true, teamId: true, createdAt: true, updatedAt: true, version: true }).safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid agent definition" }, { status: 400 })
  }

  const agent = createAgent(teamId, parsed.data)
  return NextResponse.json({ agent }, { status: 201 })
}
