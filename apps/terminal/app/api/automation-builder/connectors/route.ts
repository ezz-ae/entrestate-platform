import { NextResponse } from "next/server"
import { listConnectors, listCredentials } from "@/automation-builder/lib/store"
import { getRequestContext } from "@/automation-builder/lib/request-context"

export async function GET(request: Request) {
  const { teamId } = getRequestContext(request)
  return NextResponse.json({
    connectors: listConnectors(),
    credentials: listCredentials(teamId),
  })
}
