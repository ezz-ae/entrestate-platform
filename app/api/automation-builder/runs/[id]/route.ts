import { NextResponse } from "next/server"
import { getRequestContext } from "@/automation-builder/lib/request-context"
import { getRun } from "@/automation-builder/lib/store"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { teamId } = getRequestContext(request)
  const run = getRun(teamId, params.id)
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 })
  }
  return NextResponse.json({ run })
}
