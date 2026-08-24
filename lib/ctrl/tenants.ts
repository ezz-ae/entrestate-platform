/**
 * Tenants and their tokens.
 *
 * A token is minted once, shown once, stored as a sha256 hash — the same
 * discipline as any API-key issuer. The bearer the tenant's system presents
 * (ORE's PARTNER_PLANE_TOKEN) is hashed and looked up; the plane can prove a
 * token, never recover one.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { ctrlQuery, ensureCtrlSchema } from './db'

export interface Tenant {
  id: string
  name: string
  topupSlug: string
  /** Capability URL for the lead-by-lead storefront. Regenerable. */
  portalSlug: string
  /** 'marketplace' — the client buys lead by lead (default) —
   *  or 'auto' — the API poll bills oldest-first automatically. */
  deliveryMode: 'marketplace' | 'auto'
  createdAt: string
}

const mode = (v: unknown): 'marketplace' | 'auto' => (v === 'auto' ? 'auto' : 'marketplace')

const hash = (raw: string): string => createHash('sha256').update(raw).digest('hex')

export async function createTenant(name: string): Promise<{ tenant: Tenant; token: string }> {
  await ensureCtrlSchema()
  const id = `t_${randomBytes(6).toString('hex')}`
  const token = `epk_${randomBytes(24).toString('hex')}`
  const topupSlug = randomBytes(12).toString('hex')
  const portalSlug = randomBytes(12).toString('hex')
  await ctrlQuery(
    `INSERT INTO ctrl_tenants (id, name, token_hash, topup_slug, portal_slug) VALUES ($1, $2, $3, $4, $5)`,
    [id, name.trim(), hash(token), topupSlug, portalSlug],
  )
  await ctrlQuery(
    `INSERT INTO ctrl_pricing_rules (tenant_id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [id],
  )
  return {
    tenant: { id, name: name.trim(), topupSlug, portalSlug, deliveryMode: 'marketplace', createdAt: new Date().toISOString() },
    token,
  }
}

export async function listTenants(): Promise<Tenant[]> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT id, name, topup_slug, portal_slug, delivery_mode, created_at::text FROM ctrl_tenants ORDER BY created_at`,
  )
  return r.rows.map((t) => ({
    id: t.id, name: t.name, topupSlug: t.topup_slug, portalSlug: t.portal_slug,
    deliveryMode: mode(t.delivery_mode), createdAt: t.created_at,
  }))
}

/** Resolve a Bearer token to its tenant, or null. Constant-time compare on
 *  the hash so a token can not be sniffed byte-by-byte. */
export async function tenantByToken(bearer: string | null): Promise<Tenant | null> {
  if (!bearer || !bearer.trim()) return null
  await ensureCtrlSchema()
  const h = hash(bearer.trim())
  const r = await ctrlQuery(
    `SELECT id, name, topup_slug, portal_slug, delivery_mode, created_at::text, token_hash FROM ctrl_tenants`,
  )
  for (const t of r.rows) {
    const a = Buffer.from(String(t.token_hash))
    const b = Buffer.from(h)
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return {
        id: t.id, name: t.name, topupSlug: t.topup_slug, portalSlug: t.portal_slug,
        deliveryMode: mode(t.delivery_mode), createdAt: t.created_at,
      }
    }
  }
  return null
}

const row2tenant = (t: Record<string, unknown> | undefined): Tenant | null => t ? {
  id: String(t.id), name: String(t.name), topupSlug: String(t.topup_slug),
  portalSlug: String(t.portal_slug), deliveryMode: mode(t.delivery_mode),
  createdAt: String(t.created_at),
} : null

export async function tenantByTopupSlug(slug: string): Promise<Tenant | null> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT id, name, topup_slug, portal_slug, delivery_mode, created_at::text FROM ctrl_tenants WHERE topup_slug = $1`,
    [slug],
  )
  return row2tenant(r.rows[0])
}

export async function tenantByPortalSlug(slug: string): Promise<Tenant | null> {
  if (!slug.trim()) return null
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT id, name, topup_slug, portal_slug, delivery_mode, created_at::text FROM ctrl_tenants WHERE portal_slug = $1`,
    [slug.trim()],
  )
  return row2tenant(r.rows[0])
}

/** A leaked storefront link dies here: one click, new capability URL. */
export async function regeneratePortalSlug(tenantId: string): Promise<void> {
  await ensureCtrlSchema()
  await ctrlQuery(`UPDATE ctrl_tenants SET portal_slug = $2 WHERE id = $1`,
    [tenantId, randomBytes(12).toString('hex')])
}

export async function setDeliveryMode(tenantId: string, m: 'marketplace' | 'auto'): Promise<void> {
  await ensureCtrlSchema()
  await ctrlQuery(`UPDATE ctrl_tenants SET delivery_mode = $2 WHERE id = $1`, [tenantId, m])
}

export async function tenantById(id: string): Promise<Tenant | null> {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT id, name, topup_slug, portal_slug, delivery_mode, created_at::text FROM ctrl_tenants WHERE id = $1`,
    [id],
  )
  return row2tenant(r.rows[0])
}
