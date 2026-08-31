'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomBytes } from 'node:crypto'
import { ctrlQuery, ensureCtrlSchema } from '@/lib/ctrl/db'
import { createTenant, regeneratePortalSlug, setDeliveryMode } from '@/lib/ctrl/tenants'
import { credit } from '@/lib/ctrl/wallet'
import { ingestTenantLeads } from '@/lib/ctrl/sync'

/** The freshly minted token rides ONE redirect in an httpOnly cookie and is
 *  cleared on render — never a query string, never stored. */
export async function createTenantAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) redirect('/ctrl')
  const { tenant, token } = await createTenant(name)
  const jar = await cookies()
  jar.set('ctrl_flash_token', `${tenant.name}::${token}`, { httpOnly: true, maxAge: 60, path: '/ctrl' })
  redirect('/ctrl')
}

export async function setPricingAction(formData: FormData) {
  const tenantId = String(formData.get('tenantId') ?? '')
  const multiplier = Number(formData.get('multiplier'))
  const floorAed = Number(formData.get('floorAed'))
  const fixedAedRaw = String(formData.get('fixedAed') ?? '').trim()
  const fixedAed = fixedAedRaw === '' ? null : Number(fixedAedRaw)
  await ensureCtrlSchema()
  await ctrlQuery(
    `INSERT INTO ctrl_pricing_rules (tenant_id, multiplier, floor_fils, fixed_fils)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (tenant_id) DO UPDATE SET multiplier = $2, floor_fils = $3, fixed_fils = $4`,
    [
      tenantId,
      // 1.25 = the submission's 25 % margin, the owner's ruling (2026-08-31).
      Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1.25,
      Number.isFinite(floorAed) && floorAed > 0 ? Math.round(floorAed * 100) : 15000,
      fixedAed !== null && Number.isFinite(fixedAed) && fixedAed > 0 ? Math.round(fixedAed * 100) : null,
    ],
  )
  redirect(`/ctrl/tenant/${tenantId}`)
}

export async function addMappingAction(formData: FormData) {
  const tenantId = String(formData.get('tenantId') ?? '')
  const kind = String(formData.get('kind') ?? '')
  const refId = String(formData.get('refId') ?? '').trim()
  const name = String(formData.get('name') ?? '').trim()
  const campaignRef = String(formData.get('campaignRef') ?? '').trim() || null
  const projectRef = String(formData.get('projectRef') ?? '').trim() || null
  const access = String(formData.get('access') ?? 'read_write')
  const kinds = ['campaign', 'form', 'facebook_page', 'instagram']
  if (!tenantId || !refId || !kinds.includes(kind)) redirect(`/ctrl/tenant/${tenantId}`)
  await ensureCtrlSchema()
  await ctrlQuery(
    `INSERT INTO ctrl_mappings (tenant_id, kind, ref_id, name, campaign_ref, access, project_ref)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (kind, ref_id) DO UPDATE SET tenant_id = $1, name = $4, campaign_ref = $5, access = $6, project_ref = $7`,
    [tenantId, kind, refId, name, campaignRef,
     ['read_write', 'read', 'none'].includes(access) ? access : 'read_write',
     kind === 'form' ? projectRef : null],
  )
  redirect(`/ctrl/tenant/${tenantId}`)
}

export async function removeMappingAction(formData: FormData) {
  const id = Number(formData.get('id'))
  const tenantId = String(formData.get('tenantId') ?? '')
  await ensureCtrlSchema()
  if (Number.isFinite(id)) await ctrlQuery(`DELETE FROM ctrl_mappings WHERE id = $1`, [id])
  redirect(`/ctrl/tenant/${tenantId}`)
}

/** Manual money is still ledger money: positive only, ref-stamped, noted.
 *  Corrections DOWN are a debit entry with an explicit note, never an edit.
 *  This is the top-up door while self-serve Ziina is deferred. */
export async function manualEntryAction(formData: FormData) {
  const tenantId = String(formData.get('tenantId') ?? '')
  const amountAed = Number(formData.get('amountAed'))
  const kind = String(formData.get('kind') ?? 'credit')
  const note = String(formData.get('note') ?? '').trim() || 'manual adjustment'
  if (tenantId && Number.isFinite(amountAed) && amountAed > 0) {
    const fils = Math.round(amountAed * 100)
    if (kind === 'credit') {
      await credit(tenantId, fils, `manual:${randomBytes(8).toString('hex')}`, note)
    } else {
      await ensureCtrlSchema()
      await ctrlQuery(
        `INSERT INTO ctrl_wallet_entries (tenant_id, kind, amount_fils, ref, note)
         VALUES ($1, 'debit', $2, $3, $4) ON CONFLICT (ref) DO NOTHING`,
        [tenantId, fils, `manual:${randomBytes(8).toString('hex')}`, note],
      )
    }
  }
  redirect(`/ctrl/tenant/${tenantId}`)
}

export async function syncTenantAction(formData: FormData) {
  const tenantId = String(formData.get('tenantId') ?? '')
  if (tenantId) await ingestTenantLeads(tenantId).catch(() => undefined)
  redirect(`/ctrl/tenant/${tenantId}`)
}

// ── Marketplace controls ────────────────────────────────────────────────────

export async function setDeliveryModeAction(formData: FormData) {
  const tenantId = String(formData.get('tenantId') ?? '')
  const m = String(formData.get('mode') ?? '')
  if (tenantId && (m === 'marketplace' || m === 'auto')) await setDeliveryMode(tenantId, m)
  redirect(`/ctrl/tenant/${tenantId}`)
}

export async function regenPortalSlugAction(formData: FormData) {
  const tenantId = String(formData.get('tenantId') ?? '')
  if (tenantId) await regeneratePortalSlug(tenantId)
  redirect(`/ctrl/tenant/${tenantId}`)
}

// ── Catalog CRUD ────────────────────────────────────────────────────────────

export async function createProjectAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const priceAedRaw = String(formData.get('priceAed') ?? '').trim()
  const priceAed = priceAedRaw === '' ? null : Number(priceAedRaw)
  if (!name) redirect('/ctrl/projects')
  await ensureCtrlSchema()
  await ctrlQuery(
    `INSERT INTO ctrl_projects (id, name, description, price_fils_override) VALUES ($1, $2, $3, $4)`,
    [
      `p_${randomBytes(5).toString('hex')}`, name, description,
      priceAed !== null && Number.isFinite(priceAed) && priceAed > 0 ? Math.round(priceAed * 100) : null,
    ],
  )
  redirect('/ctrl/projects')
}

export async function updateProjectAction(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const priceAedRaw = String(formData.get('priceAed') ?? '').trim()
  const priceAed = priceAedRaw === '' ? null : Number(priceAedRaw)
  const active = String(formData.get('active') ?? '') === 'on'
  if (!id || !name) redirect('/ctrl/projects')
  await ensureCtrlSchema()
  await ctrlQuery(
    `UPDATE ctrl_projects SET name = $2, description = $3, price_fils_override = $4, active = $5 WHERE id = $1`,
    [
      id, name, description,
      priceAed !== null && Number.isFinite(priceAed) && priceAed > 0 ? Math.round(priceAed * 100) : null,
      active,
    ],
  )
  redirect('/ctrl/projects')
}
