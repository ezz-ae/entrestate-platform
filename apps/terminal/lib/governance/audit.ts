import crypto from "node:crypto"

export type AuditEvent = {
  id: string
  type: string
  actorId?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

const getStore = () => {
  if (!globalThis.__entrestateAuditStore) {
    globalThis.__entrestateAuditStore = [] as AuditEvent[]
  }
  return globalThis.__entrestateAuditStore as AuditEvent[]
}

declare global {
  // eslint-disable-next-line no-var
  var __entrestateAuditStore: AuditEvent[] | undefined
}

export function recordAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">): AuditEvent {
  const record: AuditEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...event,
  }
  getStore().push(record)
  return record
}

export function listAuditEvents(limit = 50): AuditEvent[] {
  const store = getStore()
  return store.slice(-limit).reverse()
}
