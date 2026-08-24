/**
 * Ingestion: pull leads for a tenant's mapped forms, price them at arrival,
 * hold them until the wallet covers them.
 *
 * PRICE AT ARRIVAL, NOT AT DELIVERY. The cost basis is our campaign's cost
 * per lead at the moment the lead exists — pricing at delivery would let a
 * tenant's empty wallet ride a cheap week and pay last month's price for
 * this month's lead. The price is frozen onto the row and never recomputed.
 */
import { ctrlQuery, ensureCtrlSchema } from './db'
import { getFormLeads, listCampaigns } from './meta'
import { priceLeadFils, DEFAULT_RULE, type PricingRule } from './pricing'

export async function pricingRuleFor(tenantId: string): Promise<PricingRule> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT multiplier, floor_fils::text AS floor, fixed_fils::text AS fixed
       FROM ctrl_pricing_rules WHERE tenant_id = $1`,
    [tenantId],
  )
  const row = r.rows[0]
  if (!row) return DEFAULT_RULE
  return {
    multiplier: Number(row.multiplier) || DEFAULT_RULE.multiplier,
    floorFils: Number(row.floor) || DEFAULT_RULE.floorFils,
    fixedFils: row.fixed === null || row.fixed === undefined ? null : Number(row.fixed),
  }
}

export interface FormMapping {
  refId: string
  name: string
  campaignRef: string | null
  projectRef: string | null
}

export async function formMappings(tenantId: string): Promise<FormMapping[]> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT ref_id, name, campaign_ref, project_ref FROM ctrl_mappings WHERE tenant_id = $1 AND kind = 'form'`,
    [tenantId],
  )
  return r.rows.map((m) => ({
    refId: m.ref_id, name: m.name,
    campaignRef: m.campaign_ref ?? null, projectRef: m.project_ref ?? null,
  }))
}

/**
 * Pull new Meta leads for one tenant's forms into the leads table.
 *
 * Watermark per form from what we already hold, with a 10-minute overlap;
 * the primary-key insert absorbs the refetch. Cost basis: the mapped
 * campaign's current spend/leads, in fils; no campaign or no data → null,
 * and the pricing floor speaks.
 */
export async function ingestTenantLeads(tenantId: string, onlyFormId?: string): Promise<{ ingested: number }> {
  await ensureCtrlSchema()
  const all = await formMappings(tenantId)
  // The tenant's sweep asks form by form — ingesting only the asked form
  // keeps one poll from costing one Graph call per OTHER form every time.
  const forms = onlyFormId ? all.filter((f) => f.refId === onlyFormId) : all
  if (!forms.length) return { ingested: 0 }

  const rule = await pricingRuleFor(tenantId)

  // One campaign read per sweep, not one per form.
  const campaigns = await listCampaigns()
  const cplFils = new Map<string, number>()
  for (const c of campaigns) {
    if (c.spendFils !== null && c.leads > 0) cplFils.set(c.id, Math.round(c.spendFils / c.leads))
  }

  // Catalog prices, once per sweep. A project's pinned price outranks the
  // tenant's arithmetic — a catalog price is a promise, and a promise beats
  // a formula.
  const overrides = new Map<string, number>()
  const projs = await ctrlQuery(`SELECT id, price_fils_override::text AS o FROM ctrl_projects`)
  for (const p of projs.rows) {
    const o = Number(p.o)
    if (Number.isFinite(o) && o > 0) overrides.set(p.id, Math.round(o))
  }

  let ingested = 0
  for (const form of forms) {
    const wm = await ctrlQuery(
      `SELECT EXTRACT(EPOCH FROM MAX(created_time))::bigint::text AS newest
         FROM ctrl_leads WHERE tenant_id = $1 AND form_id = $2`,
      [tenantId, form.refId],
    )
    const newest = Number(wm.rows[0]?.newest)
    const since = Number.isFinite(newest) && newest > 0 ? newest - 600 : undefined

    const metaLeads = await getFormLeads(form.refId, since)
    for (const lead of metaLeads) {
      const cost = form.campaignRef ? (cplFils.get(form.campaignRef) ?? null) : null
      const pinned = form.projectRef ? (overrides.get(form.projectRef) ?? null) : null
      const price = pinned ?? priceLeadFils(cost, rule)
      const r = await ctrlQuery(
        `INSERT INTO ctrl_leads (id, tenant_id, form_id, created_time, field_data, cost_fils, price_fils, project_id)
         VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()), $5::jsonb, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [lead.id, tenantId, form.refId, lead.createdTime, JSON.stringify(lead.fieldData), cost, price, form.projectRef],
      )
      if (r.rows.length) ingested += 1
    }
  }
  return { ingested }
}
