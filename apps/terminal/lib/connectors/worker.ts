import "server-only"
import { prisma } from "@/lib/prisma"
import { getConnector } from "@/lib/connectors/registry"

/**
 * Connector ingestion worker — invoked by:
 *   - cron job (Vercel Cron) for scheduled connectors
 *   - on-demand from /me/connections (refresh button)
 *   - inbound webhooks (the connector itself triggers a re-pull)
 *
 * Per connector type:
 *   - portal connectors: pull listings via vendor API → upsert into UserListing
 *   - crm connectors: bidirectional contact + deal sync
 *   - feed connectors: route JSON / file payloads into UserListing
 *
 * This is the orchestrator; the per-vendor adapters live in
 * /lib/connectors/adapters/*.ts and are loaded lazily based on connector.id.
 */

export interface IngestionResult {
  connectorId: string
  credentialId: string
  status: "ok" | "partial" | "failed"
  itemsPulled: number
  itemsUpserted: number
  itemsFailed: number
  startedAt: string
  finishedAt: string
  error?: string
}

export async function ingestForCredential(credentialId: string): Promise<IngestionResult> {
  const startedAt = new Date().toISOString()
  const credential = await prisma.connectorCredential.findUnique({
    where: { id: credentialId },
    include: {} as any,
  })
  if (!credential) {
    return failure(credentialId, "unknown", "credential_not_found", startedAt)
  }

  const connector = getConnector(credential.connectorId)
  if (!connector) {
    return failure(credentialId, credential.connectorId, "connector_not_in_registry", startedAt)
  }

  try {
    // Lazy-load the adapter so a missing adapter only fails its own connector,
    // not the whole worker.
    const adapter = await loadAdapter(connector.id)
    const out = await adapter.ingest({
      teamId: credential.teamId,
      config: credential.config as Record<string, unknown>,
    })

    await prisma.auditEvent.create({
      data: {
        teamId: credential.teamId,
        actor: "system:connector-worker",
        action: "connector.ingest.completed",
        target: connector.id,
        detail: { ...out, credentialId } as any,
      },
    }).catch(() => {})

    return {
      connectorId: connector.id,
      credentialId,
      status: out.itemsFailed === 0 ? "ok" : "partial",
      itemsPulled: out.itemsPulled,
      itemsUpserted: out.itemsUpserted,
      itemsFailed: out.itemsFailed,
      startedAt,
      finishedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    return failure(credentialId, connector.id, error?.message ?? String(error), startedAt)
  }
}

function failure(credentialId: string, connectorId: string, error: string, startedAt: string): IngestionResult {
  return {
    connectorId,
    credentialId,
    status: "failed",
    itemsPulled: 0,
    itemsUpserted: 0,
    itemsFailed: 0,
    startedAt,
    finishedAt: new Date().toISOString(),
    error,
  }
}

interface ConnectorAdapter {
  ingest(input: { teamId: string; config: Record<string, unknown> }): Promise<{ itemsPulled: number; itemsUpserted: number; itemsFailed: number }>
}

async function loadAdapter(connectorId: string): Promise<ConnectorAdapter> {
  // Each adapter file should export `default { ingest }`. Stub implementation
  // returns zeros — replace with real per-vendor SDK calls.
  switch (connectorId) {
    case "bayut":
    case "property-finder":
    case "dubizzle":
      return stubAdapter("portal")
    case "hubspot":
    case "pipedrive":
    case "bitrix24":
    case "salesforce":
      return stubAdapter("crm")
    case "webhook-inbound":
    case "webhook-outbound":
    case "sftp-drop":
      return stubAdapter("feed")
    default:
      throw new Error(`No adapter registered for connector "${connectorId}"`)
  }
}

function stubAdapter(_kind: string): ConnectorAdapter {
  return {
    async ingest() {
      // TODO: per-vendor implementation. For now return zeros — the wiring is the
      // important part; adapters can be filled in incrementally without changing
      // the API surface.
      return { itemsPulled: 0, itemsUpserted: 0, itemsFailed: 0 }
    },
  }
}
