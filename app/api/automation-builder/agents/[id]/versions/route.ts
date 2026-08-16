import { NextResponse } from "next/server"
import { createVersion, listVersions } from "@/automation-builder/lib/store"
import { getRequestContext } from "@/automation-builder/lib/request-context"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { teamId } = getRequestContext(request)
  return NextResponse.json({ versions: listVersions(teamId, params.id) })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { teamId } = getRequestContext(request)
  const version = createVersion(teamId, params.id)
  if (!version) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }
  return NextResponse.json({ version }, { status: 201 })
}
