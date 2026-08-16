import { NextResponse } from "next/server"
import { connectorRegistry } from "@/automation-builder/lib/connectors/registry"

export async function POST(request: Request) {
  const body = await request.json()
  const { connectorId } = body as { connectorId?: string }

  if (!connectorId) {
    return NextResponse.json({ error: "connectorId is required" }, { status: 400 })
  }

  const connector = connectorRegistry.find((item) => item.id === connectorId)
  if (!connector) {
    return NextResponse.json({ error: "Connector not found" }, { status: 404 })
  }

  const result = await connector.query({}, { teamId: "team_default", strictMode: true })
  return NextResponse.json({ status: "ok", summary: result.summary })
}
