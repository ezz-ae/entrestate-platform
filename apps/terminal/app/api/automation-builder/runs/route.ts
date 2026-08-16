import { NextResponse } from "next/server"
import { getRequestContext } from "@/automation-builder/lib/request-context"
import { getAgent, listRuns, saveRun } from "@/automation-builder/lib/store"
import { executeAgentRun } from "@/automation-builder/lib/execution/engine"

export async function POST(request: Request) {
  const { teamId } = getRequestContext(request)
  const body = await request.json()
  const { agentId, input } = body as { agentId?: string; input?: Record<string, string> }

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 })
  }

  const agent = getAgent(teamId, agentId)
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  const run = await executeAgentRun(agent, { inputs: input })
  saveRun(teamId, run)
  return NextResponse.json({ run }, { status: 201 })
}

export async function GET(request: Request) {
  const { teamId } = getRequestContext(request)
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get("agentId") || undefined
  return NextResponse.json({ runs: listRuns(teamId, agentId) })
}
