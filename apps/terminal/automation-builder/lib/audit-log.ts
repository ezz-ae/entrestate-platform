import { nanoid } from "nanoid"

export type AuditEvent = {
  id: string
  teamId: string
  action: string
  agentId?: string
  runId?: string
  createdAt: string
  metadata?: Record<string, unknown>
}

const auditByTeam = new Map<string, AuditEvent[]>()

export function logAuditEvent(event: Omit<AuditEvent, "id" | "createdAt">) {
  const record: AuditEvent = {
    ...event,
    id: `audit_${nanoid(8)}`,
    createdAt: new Date().toISOString(),
  }
  const list = auditByTeam.get(event.teamId) || []
  auditByTeam.set(event.teamId, [record, ...list].slice(0, 200))
  return record
}

export function listAuditEvents(teamId: string) {
  return auditByTeam.get(teamId) || []
}
