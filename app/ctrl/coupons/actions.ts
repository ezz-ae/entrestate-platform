'use server'

/**
 * THE COUPON DESK's server half — the only writer of campaigns.
 *
 * Staff-gated twice: the /ctrl layout bounces anyone who is not management
 * and any tenant session, and each action checks again here, because a
 * server action is reachable without the page that rendered it. Every
 * outcome travels back as a query flag the page says in words.
 */
import { redirect } from 'next/navigation'
import { getSessionUser, isAdminRole } from '@/lib/auth'
import { onTenantHost } from '@/lib/ctrl/vendor-gate'
import { mintCampaign, setCampaignStatus } from '@/lib/coupon-campaigns'
import { isCreditScope, type CampaignKind, type CampaignStatus } from '@/lib/business/coupons'

async function requireDesk(): Promise<{ id: string; email?: string | null }> {
  const user = await getSessionUser()
  if (!user || !isAdminRole(user.role) || (await onTenantHost())) redirect('/server')
  return user
}

const num = (v: FormDataEntryValue | null): number | null => {
  const s = String(v ?? '').trim().replace(/[^0-9.]/g, '')
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** New coupon (one shared code) or voucher batch (many single-use codes). */
export async function mintCampaignAction(formData: FormData): Promise<void> {
  const user = await requireDesk()
  const kindRaw = String(formData.get('kind') ?? '')
  const kind: CampaignKind = kindRaw === 'voucher' ? 'voucher' : 'coupon'
  const scopeRaw = String(formData.get('scope') ?? 'bills')
  if (!isCreditScope(scopeRaw)) redirect('/ctrl/coupons?minted=bad_scope')
  const validUntilRaw = String(formData.get('validUntil') ?? '').trim()
  const out = await mintCampaign({
    kind,
    name: String(formData.get('name') ?? ''),
    source: String(formData.get('source') ?? ''),
    amountAed: num(formData.get('amountAed')) ?? 0,
    scope: scopeRaw,
    count: num(formData.get('count')),
    code: String(formData.get('code') ?? ''),
    validUntil: validUntilRaw ? new Date(validUntilRaw).toISOString() : null,
    createdBy: user.email ?? user.id,
  })
  if (!out.ok) redirect(`/ctrl/coupons?minted=${out.reason}`)
  redirect(`/ctrl/coupons/${out.campaign.id}?minted=ok`)
}

/** Pause, resume, or end. Ending is final. */
export async function setStatusAction(formData: FormData): Promise<void> {
  await requireDesk()
  const id = String(formData.get('id') ?? '')
  const statusRaw = String(formData.get('status') ?? '')
  const status: CampaignStatus | null = statusRaw === 'live' || statusRaw === 'paused' || statusRaw === 'ended' ? statusRaw : null
  if (!id || !status) redirect('/ctrl/coupons')
  await setCampaignStatus(id, status)
  redirect(`/ctrl/coupons/${id}`)
}
