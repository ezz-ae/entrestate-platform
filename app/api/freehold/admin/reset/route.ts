import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireSession } from '@/lib/freehold/api-auth'
import { query, resolveActiveSchema, DEFAULT_SCHEMA } from '@/lib/db'
import { tenantSubdomainFromHost } from '@/lib/tenancy/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Only the top of the house can wipe operational data.
const RESET_ROLES = ['ceo', 'admin'] as const

// Lead lifecycle data — cleared by the default ("leads") scope so the team can
// start from a clean pipeline without touching the property catalog or accounts.
const LEAD_TABLES = [
  'freehold_site_lead_activity',
  'freehold_site_lp_analytics',
  'freehold_site_deals',
  'freehold_site_leads',
]

// Everything else that accumulates during demos/testing. Cleared only by the
// explicit "all-demo" scope. The property catalog (projects, areas, developers,
// landing pages, microsites, web content), team accounts and API keys are never
// touched here.
const DEMO_TABLES = [
  'freehold_site_contracts',
  'freehold_site_finance_entries',
  'freehold_site_tasks',
  'freehold_site_review_comments',
  'freehold_site_review_resolutions',
  'freehold_site_activity_log',
  'freehold_site_whatsapp_messages',
  'freehold_site_notebook_outputs',
  'freehold_site_ai_conversations',
  'freehold_site_ai_training_requests',
  'freehold_site_ai_project_updates',
  'freehold_site_ad_requests',
  'freehold_site_meta_campaigns',
  'freehold_site_google_campaigns',
  'freehold_site_google_entities',
]

// The sequence behind the FH-#### lead codes (created in lib/data.ts).
const LEAD_SEQUENCE = 'freehold_site_lead_seq'

// Every destructive statement in this route is schema-qualified, and that is a
// privilege boundary rather than a style preference. lib/db.ts runs a tenant
// request with search_path "<tenant_schema>, <DEFAULT_SCHEMA>" and the app
// creates its tables LAZILY, so for any table a tenant has not created yet an
// unqualified `DELETE FROM freehold_site_leads` falls through to the DEFAULT
// schema and deletes ITS rows — on a deployment with a shared default schema
// that is a trial customer's own 'ceo' account reaching the vendor's data. The
// sequence restart is worse than the deletes: lead_code is a STORED generated
// column over LEAD_SEQUENCE (lib/data.ts), so restarting a shared sequence
// mints duplicate FH-#### codes that persist long after this request, even when
// every DELETE matched nothing. Do not "simplify" these back to bare names.
//
// Both halves are ours — object names come from the allow-lists above, the
// schema from resolveActiveSchema() — but quotes are doubled anyway so a later
// edit that widens either source cannot turn this into an injection point.
const qualify = (schemaName: string, object: string) =>
  `"${schemaName.replace(/"/g, '""')}"."${object.replace(/"/g, '""')}"`

async function purge(schemaName: string, tables: string[]): Promise<Record<string, number | string>> {
  const result: Record<string, number | string> = {}
  for (const table of tables) {
    const target = qualify(schemaName, table)
    try {
      const rows = await query<{ count: string }>(`SELECT count(*)::text AS count FROM ${target}`)
      const before = Number(rows[0]?.count ?? 0)
      await query(`DELETE FROM ${target}`)
      result[table] = before
    } catch {
      // Table may not exist in THIS schema yet — skip silently. Before the
      // qualification above this branch was mostly unreachable: the miss
      // resolved against the default schema and "succeeded" there instead.
      result[table] = 'skipped'
    }
  }
  return result
}

/**
 * Wipe operational/demo data so the platform is ready for live operation.
 *
 * POST body:
 *   { "confirm": "RESET", "scope": "leads" | "all-demo" }
 *
 * - scope "leads" (default): clears leads, deals, lead activity and landing
 *   analytics, and restarts the FH-#### lead numbering at 1.
 * - scope "all-demo": additionally clears tasks, finance entries, contracts,
 *   AI conversations, notebook outputs, ad requests and campaign mirrors.
 *
 * Never touches: projects/inventory, area & developer profiles, landing pages,
 * microsites, web content, team accounts or API keys — and never anything
 * outside the schema this request resolves to.
 */
export async function POST(req: Request) {
  const auth = await requireSession(RESET_ROLES)
  if ('res' in auth) return auth.res

  const body = (await req.json().catch(() => ({}))) as { confirm?: string; scope?: string }
  if (body.confirm !== 'RESET') {
    return NextResponse.json(
      { error: 'Confirmation required. Send { "confirm": "RESET" } to proceed.' },
      { status: 400 },
    )
  }

  const scope = body.scope === 'all-demo' ? 'all-demo' : 'leads'
  const tables = scope === 'all-demo' ? [...DEMO_TABLES, ...LEAD_TABLES] : LEAD_TABLES

  // Resolve the schema this request actually writes to BEFORE touching
  // anything. resolveActiveSchema() fails closed on an unknown or suspended
  // tenant host; a reset is the last operation that should proceed on a guess.
  let activeSchema: string
  try {
    activeSchema = await resolveActiveSchema()
  } catch (err) {
    console.error('[admin/reset] could not resolve the active schema', err)
    return NextResponse.json(
      { error: 'Reset refused: the data schema for this request could not be resolved.' },
      { status: 409 },
    )
  }

  // A tenant host landing on the shared/default schema means the tenant's own
  // schema was NOT resolved — the request would otherwise wipe the schema every
  // other tenant (and the vendor) reads from. There is no safe reading of that
  // combination, so refuse the whole operation instead of clearing anything.
  const onTenantHost = tenantSubdomainFromHost((await headers()).get('host')) !== null
  if (onTenantHost && activeSchema === DEFAULT_SCHEMA) {
    return NextResponse.json(
      { error: 'Reset refused: this tenant resolves to the shared schema.' },
      { status: 409 },
    )
  }

  try {
    const cleared = await purge(activeSchema, tables)
    // Restart lead numbering so the first new lead is FH-0001 again — qualified
    // for the same reason as the deletes, and more urgently: an unqualified
    // restart hits the shared sequence and duplicates other tenants' codes.
    try {
      await query(`ALTER SEQUENCE IF EXISTS ${qualify(activeSchema, LEAD_SEQUENCE)} RESTART WITH 1`)
    } catch { /* sequence may not exist in this schema yet */ }

    return NextResponse.json({ ok: true, scope, cleared })
  } catch (err) {
    console.error('[admin/reset] purge failed', err)
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}
