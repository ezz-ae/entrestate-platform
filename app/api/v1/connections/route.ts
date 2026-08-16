import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/api-errors"
import { listConnectors } from "@/lib/connectors/registry"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { tierMeets } from "@/lib/entitlement-gates"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/v1/connections — returns the connector catalogue with allowed/locked
 * per the caller's current tier. Useful for embedding the picker in UIs.
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const entitlement = await getCurrentEntitlement()
  const items = listConnectors().map((c) => ({
    id: c.id,
    name: c.name,
    family: c.family,
    minTier: c.minTier,
    description: c.description,
    capabilities: c.capabilities,
    allowed: tierMeets(entitlement.tier, c.minTier),
    docsUrl: c.docsUrl ?? null,
  }))
  return NextResponse.json({ tier: entitlement.tier, connectors: items, requestId })
}
