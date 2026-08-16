import { NextResponse } from "next/server"
import { getRequestContext } from "@/automation-builder/lib/request-context"
import { listAuditEvents } from "@/automation-builder/lib/audit-log"

export async function GET(request: Request) {
  const { teamId } = getRequestContext(request)
  return NextResponse.json({ events: listAuditEvents(teamId) })
}
