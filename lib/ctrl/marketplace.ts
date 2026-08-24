/**
 * THE STOREFRONT'S ONE HARD RULE: a lead you have not bought is a person you
 * cannot reach.
 *
 * The masked preview exists to let a buyer JUDGE a lead — which door of the
 * form they came through, what they wrote in their own words, when they want
 * to be called, how fresh they are, what they cost. It must never let a
 * buyer REACH the lead: no phone, no email, no full name, and the free-text
 * answers are scrubbed of anything phone- or email-shaped, because people
 * sometimes type their number into an open question.
 *
 * The mask is a WHITELIST projection, not a blacklist filter: contact fields
 * are dropped by key, and what survives is additionally scrubbed by value.
 * A field this module does not understand is NOT shown — unknown data leans
 * closed, the same direction every wall in this service leans.
 */
import { ctrlQuery, ensureCtrlSchema } from './db'

/** Same intent as the client CRM's own contact classifier — one rule,
 *  mirrored: fields that identify or reach the person. */
const CONTACT_KEY = /(phone|mobile|whatsapp|tel|mail|name)/

/** Digit runs long enough to be a dialable number, with or without spacing,
 *  and email-shaped tokens. Applied to VALUES that survive the key filter. */
const PHONE_SHAPE = /(\+?\d[\d\s\-().]{6,}\d)/g
const EMAIL_SHAPE = /[\w.+-]+@[\w-]+\.[\w.]+/g

const scrub = (text: string): string =>
  text.replace(EMAIL_SHAPE, '[…]').replace(PHONE_SHAPE, '[…]')

/** "أحمد محمد" → "أحمد م." — enough to feel real, useless to search. */
export function maskName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  const first = parts[0]
  const initial = parts.length > 1 ? ` ${parts[parts.length - 1].slice(0, 1)}.` : ''
  return `${first}${initial}`
}

export interface MaskedAnswer { question: string; answer: string }

export interface MaskedLead {
  id: string
  formId: string
  createdTime: string
  priceFils: number
  /** First name + last initial, from the contact fields — never the full name. */
  displayName: string
  /** Non-contact answers, values scrubbed of phone/email shapes. */
  answers: MaskedAnswer[]
  /** Catalog project this lead came through, when the form is mapped to one. */
  projectId: string | null
}

interface RawField { name?: string; values?: string[] }

export function maskLead(input: {
  id: string
  formId: string
  createdTime: string
  priceFils: number
  fieldData: unknown
  projectId?: string | null
}): MaskedLead {
  const fields: RawField[] = Array.isArray(input.fieldData) ? (input.fieldData as RawField[]) : []
  let displayName = ''
  const answers: MaskedAnswer[] = []
  for (const f of fields) {
    const key = String(f?.name ?? '').trim()
    const value = String(f?.values?.[0] ?? '').trim()
    if (!key || !value) continue
    const norm = key.toLowerCase().replace(/[^a-z]/g, '')
    if (CONTACT_KEY.test(norm)) {
      // The only thing a contact field contributes is the masked name.
      if (norm.includes('name') && !displayName) displayName = maskName(value)
      continue
    }
    answers.push({ question: key.replace(/[_-]+/g, ' '), answer: scrub(value) })
  }
  return {
    id: input.id,
    formId: input.formId,
    createdTime: input.createdTime,
    priceFils: input.priceFils,
    displayName,
    answers,
    projectId: input.projectId ?? null,
  }
}

/**
 * The shelf: this tenant's held leads, masked, freshest first.
 *
 * A lead that belongs to a catalog project is on the shelf ONLY when the
 * tenant has chosen that project — before that, the project card in the
 * catalog is the whole story. Leads with no project are always shown.
 */
export async function availableLeads(tenantId: string): Promise<MaskedLead[]> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT id, form_id, created_time::text AS created, price_fils::text AS price, field_data, project_id
       FROM ctrl_leads
      WHERE tenant_id = $1 AND state = 'held'
        AND (project_id IS NULL
             OR project_id IN (SELECT project_id FROM ctrl_subscriptions WHERE tenant_id = $1))
      ORDER BY created_time DESC
      LIMIT 200`,
    [tenantId],
  )
  return r.rows.map((l) => maskLead({
    id: l.id, formId: l.form_id, createdTime: l.created,
    priceFils: Number(l.price) || 0, fieldData: l.field_data,
    projectId: l.project_id ?? null,
  }))
}

export interface OwnedLead {
  id: string
  formId: string
  createdTime: string
  priceFils: number
  deliveredAt: string | null
  fieldData: Array<{ name: string; values: string[] }>
}

/** What the tenant has BOUGHT — full details; they own these people now. */
export async function purchasedLeads(tenantId: string): Promise<OwnedLead[]> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT id, form_id, created_time::text AS created, price_fils::text AS price,
            delivered_at::text AS delivered, field_data
       FROM ctrl_leads
      WHERE tenant_id = $1 AND state = 'delivered'
      ORDER BY delivered_at DESC NULLS LAST
      LIMIT 200`,
    [tenantId],
  )
  return r.rows.map((l) => ({
    id: l.id, formId: l.form_id, createdTime: l.created,
    priceFils: Number(l.price) || 0, deliveredAt: l.delivered ?? null,
    fieldData: Array.isArray(l.field_data) ? l.field_data : [],
  }))
}

// ── The catalog ─────────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  description: string
  active: boolean
  priceFilsOverride: number | null
}

export interface ProjectCard extends Project {
  /** How many of this project's leads are on this tenant's shelf right now. */
  availableCount: number
  /** The tenant's chosen ceiling, or null when they have not picked it yet. */
  leadLimit: number | null
  /** Delivered leads of this project — what counts against the limit. */
  taken: number
}

export async function listProjects(activeOnly = true): Promise<Project[]> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT id, name, description, active, price_fils_override::text AS o
       FROM ctrl_projects ${activeOnly ? 'WHERE active' : ''} ORDER BY created_at DESC`,
  )
  return r.rows.map((p) => ({
    id: p.id, name: p.name, description: p.description, active: p.active,
    priceFilsOverride: p.o === null || p.o === undefined ? null : Number(p.o) || null,
  }))
}

/** Every active project as this tenant sees it: chosen or not, how far along
 *  its limit is, and how many of its leads are waiting on the shelf. */
export async function projectCards(tenantId: string): Promise<ProjectCard[]> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT p.id, p.name, p.description, p.active, p.price_fils_override::text AS o,
            s.lead_limit,
            (SELECT COUNT(*) FROM ctrl_leads l WHERE l.tenant_id = $1 AND l.project_id = p.id AND l.state = 'held')::text AS avail,
            (SELECT COUNT(*) FROM ctrl_leads l WHERE l.tenant_id = $1 AND l.project_id = p.id AND l.state = 'delivered')::text AS taken
       FROM ctrl_projects p
       LEFT JOIN ctrl_subscriptions s ON s.project_id = p.id AND s.tenant_id = $1
      WHERE p.active
      ORDER BY p.created_at DESC`,
    [tenantId],
  )
  return r.rows.map((p) => ({
    id: p.id, name: p.name, description: p.description, active: p.active,
    priceFilsOverride: p.o === null || p.o === undefined ? null : Number(p.o) || null,
    availableCount: Number(p.avail) || 0,
    leadLimit: p.lead_limit === null || p.lead_limit === undefined ? null : Number(p.lead_limit),
    taken: Number(p.taken) || 0,
  }))
}

/** Choosing a project IS setting its ceiling; choosing again re-sets it. */
export async function subscribe(tenantId: string, projectId: string, leadLimit: number): Promise<void> {
  const limit = Math.floor(leadLimit)
  if (!Number.isFinite(limit) || limit <= 0) return
  await ensureCtrlSchema()
  await ctrlQuery(
    `INSERT INTO ctrl_subscriptions (tenant_id, project_id, lead_limit)
     SELECT $1, id, $3 FROM ctrl_projects WHERE id = $2 AND active
     ON CONFLICT (tenant_id, project_id) DO UPDATE SET lead_limit = $3`,
    [tenantId, projectId, limit],
  )
}

/**
 * The limit gate, checked BEFORE money moves. A project lead is buyable only
 * when the tenant chose the project and has room under their own ceiling;
 * a lead with no project is always buyable. Unknown lead → not buyable —
 * leaning closed, as everywhere else.
 */
export async function canBuy(tenantId: string, leadId: string): Promise<boolean> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT l.project_id, s.lead_limit,
            (SELECT COUNT(*) FROM ctrl_leads t
              WHERE t.tenant_id = $1 AND t.project_id = l.project_id AND t.state = 'delivered')::text AS taken
       FROM ctrl_leads l
       LEFT JOIN ctrl_subscriptions s ON s.tenant_id = $1 AND s.project_id = l.project_id
      WHERE l.id = $2 AND l.tenant_id = $1 AND l.state = 'held'`,
    [tenantId, leadId],
  )
  const row = r.rows[0]
  if (!row) return false
  if (!row.project_id) return true
  const limit = Number(row.lead_limit)
  if (!Number.isFinite(limit) || limit <= 0) return false
  return (Number(row.taken) || 0) < limit
}

export interface ConnectedAsset { kind: string; refId: string; name: string; access: string }

/** The tenant's own pages, as mapped: where OUR ads run under THEIR name. */
export async function connectedAssets(tenantId: string): Promise<ConnectedAsset[]> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT kind, ref_id, name, access FROM ctrl_mappings
      WHERE tenant_id = $1 AND kind IN ('facebook_page', 'instagram')
      ORDER BY kind, id`,
    [tenantId],
  )
  return r.rows.map((m) => ({ kind: m.kind, refId: m.ref_id, name: m.name, access: m.access }))
}
