import { NextRequest, NextResponse } from 'next/server'
import { listTenants } from '@/lib/ctrl/tenants'
import { ingestTenantLeads } from '@/lib/ctrl/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * The heartbeat (Vercel Cron): pull new leads for every partner so pricing
 * happens near arrival. The partner-facing endpoints also ingest lazily — this
 * sweep is the floor under them, not the only path. (Ziina reconciliation is
 * deferred with self-serve top-up; nothing here touches payments.)
 */
export async function GET(req: NextRequest) {
  const secret = (process.env.CRON_SECRET ?? '').trim()
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenants = await listTenants()
  let ingested = 0
  for (const t of tenants) {
    ingested += (await ingestTenantLeads(t.id).catch(() => ({ ingested: 0 }))).ingested
  }
  return NextResponse.json({ ok: true, tenants: tenants.length, ingested })
}
