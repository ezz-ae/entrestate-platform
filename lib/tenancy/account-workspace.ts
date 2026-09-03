/**
 * ONE ACCOUNT, ONE PASSWORD — the workspace opened by the Terminal identity.
 *
 * Phase 5 of docs/ACCOUNT-FOUNDATION.md. Everything before it made the
 * business site RECOGNISE the Terminal account (session, account row, wallet,
 * catalogue economics). None of it made the account able to OPEN anything:
 * a workspace lived behind `lib/tenancy/onboard.ts`, which asks for a name, an
 * email and a password — a second identity, with a second password to forget.
 *
 * So the owner could sign in to the Terminal, see his account on
 * entrestate.com, and still have no way into the workspace that account owns.
 * That is the bug this module closes, and it closes it by REMOVING an
 * identity, not by adding a bridge.
 *
 * ── How a person gets in ────────────────────────────────────────────────
 *
 * Not by a new cookie. Session cookies are host-only, so a session minted on
 * entrestate.com can never be read on {sub}.entrestate.com — that is a fact of
 * the web, not a limitation to engineer around. `lib/tenancy/onboard.ts`
 * already solved it for signup with a short-lived HMAC claim token that
 * /api/wl/claim verifies ON THE TENANT HOST, and that endpoint already refuses
 * a token whose tenant claim does not match the host it arrived on.
 *
 * This module mints the same token for the same endpoint. Nothing here writes
 * a cookie, and no new session shape exists — the replay window is the token's
 * two minutes on the one host it names, exactly as it was.
 *
 * ── The three conditions ────────────────────────────────────────────────
 *
 * A token is minted only when ALL of these hold:
 *
 *   1. A Neon session is present on this request (the caller proves this by
 *      passing a TerminalUser it read from `getTerminalUser()`).
 *   2. The workspace exists and is not suspended.
 *   3. `saas_tenants.owner_email` equals that session's email, lowercased.
 *
 * Condition 3 has a trap the schema documents and this module enforces:
 * `owner_email` is NULLABLE, and NULL means "we do not know who owns this",
 * never "anybody may". A tenant created before that column existed must not be
 * claimable by the first person to guess its subdomain, so a null owner is
 * compared against nothing and always loses.
 *
 * ── What a refusal says ─────────────────────────────────────────────────
 *
 * `not_found`, for every reason: no such workspace, suspended, owned by
 * somebody else. Whether a brokerage exists on this platform, and who runs it,
 * is not a fact this path discloses to someone typing subdomains. The caller
 * must not widen that into "this one is not yours".
 *
 * ── The known limitation, stated rather than hidden ─────────────────────
 *
 * Ownership is keyed by EMAIL, because `owner_email` is the only column the
 * control plane has and `tenantsOwnedByEmail()` is the only lookup that works
 * from a host that is not the tenant's. An owner who changes their email in
 * Neon Auth stops matching their own workspace. That is a real gap; the fix is
 * a `neon_user_id` column carried alongside the email, and it belongs in the
 * same change that first lets an email be edited — not in a silent assumption
 * here.
 */

import { randomUUID } from 'node:crypto'
import { runWithSchema } from '@/lib/db'
import { signSession } from '@/lib/freehold/auth-edge'
import { upsertUserProfile } from '@/lib/data'
import type { SessionUser } from '@/lib/freehold/session-types'
import { CLAIM_TOKEN_TTL_MS } from './onboard'
import { TENANT_BASE_DOMAIN } from './config'
import {
  createTenant,
  getTenantBySubdomain,
  tenantsOwnedByEmail,
  type SaasTenant,
} from './store'
import { provisionTenantSchema } from './provision'

/** What the account page shows for one workspace. Never carries a secret. */
export type AccountWorkspace = {
  subdomain: string
  company: string
  product: string
  plan: SaasTenant['plan']
  status: SaasTenant['status']
  trialEndsAt: string | null
  createdAt: string
  /** Absolute URL of the workspace itself, for display. */
  url: string
}

const initialsOf = (name: string, email: string): string =>
  (name || email)
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'WS'

/** `https://{sub}.entrestate.com`, or a bare label when tenancy is dormant. */
export function workspaceUrl(subdomain: string): string {
  if (!TENANT_BASE_DOMAIN) return `/${subdomain}`
  if (TENANT_BASE_DOMAIN === 'localhost') return `http://${subdomain}.localhost:3000`
  return `https://${subdomain}.${TENANT_BASE_DOMAIN}`
}

const toWorkspace = (t: SaasTenant): AccountWorkspace => ({
  subdomain: t.subdomain,
  company: t.company,
  product: t.product,
  plan: t.plan,
  status: t.status,
  trialEndsAt: t.trialEndsAt,
  createdAt: t.createdAt,
  url: workspaceUrl(t.subdomain),
})

/**
 * Every workspace this account owns.
 *
 * The email comes from a VERIFIED Neon session, not from a form — that is the
 * difference between this call and the warning on `tenantsOwnedByEmail()`,
 * which exists because an attacker can type any email into a sign-in box. Here
 * the identity was proved before we got here, so the list is safe to render.
 */
export async function workspacesForAccount(email: string | null): Promise<AccountWorkspace[]> {
  if (!email) return []
  const tenants = await tenantsOwnedByEmail(email).catch(() => [])
  return tenants.map(toWorkspace)
}

export type EnterResult =
  | { ok: true; claimUrl: string }
  | { ok: false; reason: 'not_found' }

/**
 * A claim URL that opens this workspace, or `not_found`.
 *
 * `not_found` covers every refusal on purpose — see the module header. The
 * returned URL is single-use in practice and expires in two minutes; it is a
 * credential, so it belongs in a redirect, never in a page body or a log.
 */
export async function enterWorkspace(input: {
  subdomain: string
  user: { email: string | null; name: string | null }
}): Promise<EnterResult> {
  const email = (input.user.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) return { ok: false, reason: 'not_found' }

  const tenant = await getTenantBySubdomain(input.subdomain).catch(() => null)
  if (!tenant) return { ok: false, reason: 'not_found' }
  if (tenant.status === 'suspended') return { ok: false, reason: 'not_found' }

  // A null owner loses every comparison. Written as an explicit guard rather
  // than relying on `null !== email`, because the day someone "helpfully"
  // defaults ownerEmail to '' upstream, that expression starts handing out
  // workspaces and this line is what stops it.
  const owner = (tenant.ownerEmail ?? '').trim().toLowerCase()
  if (!owner || owner !== email) return { ok: false, reason: 'not_found' }

  const name = input.user.name?.trim() || tenant.company
  const session: SessionUser = {
    email,
    name,
    initials: initialsOf(name, email),
    role: 'ceo',
    home: '/freehold-intelligence',
    tenant: tenant.subdomain,
  }
  const token = await signSession(session, CLAIM_TOKEN_TTL_MS)
  return {
    ok: true,
    claimUrl: `${workspaceUrl(tenant.subdomain)}/api/wl/claim?token=${encodeURIComponent(token)}`,
  }
}

export type CreateWorkspaceResult =
  | { ok: true; workspace: AccountWorkspace; claimUrl: string }
  | { ok: false; reason: 'invalid_subdomain' | 'reserved' | 'taken' | 'company_required' | 'store_unreachable' }

/**
 * Create a workspace owned by the signed-in account — with no password.
 *
 * This is `signupTenant()` minus the second identity. The owner row inside the
 * tenant schema is written WITHOUT a `password_hash`, deliberately: there is
 * one password on this account and it is Neon's. A null hash cannot be
 * verified by `verifyPassword`, so the tenant's own sign-in form can never let
 * anyone in as this owner — the only door is the claim token minted above,
 * which requires the Neon session first.
 *
 * The consequence is worth stating: this owner CANNOT sign in at
 * {sub}.entrestate.com by typing a password, ever. That is the intended
 * shape, not an oversight, and it is why /business/account has to stay the
 * door people are pointed at.
 */
export async function createWorkspaceForAccount(input: {
  subdomain: string
  company: string
  user: { email: string | null; name: string | null }
}): Promise<CreateWorkspaceResult> {
  const email = (input.user.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) return { ok: false, reason: 'store_unreachable' }

  const company = input.company.trim()
  if (!company) return { ok: false, reason: 'company_required' }

  const created = await createTenant({
    subdomain: input.subdomain,
    company,
    // 'account' is the plan the foundation already named for a workspace that
    // hangs off one Entrestate account rather than a brokerage roster.
    plan: 'account',
    ownerEmail: email,
  }).catch(() => null)

  if (!created) return { ok: false, reason: 'store_unreachable' }
  if (!created.ok) return { ok: false, reason: created.reason }
  const tenant = created.tenant

  // Same posture as signup: non-fatal, never silent. A workspace that goes
  // live with an empty catalogue is a real outcome and this log is the only
  // trace it leaves.
  await provisionTenantSchema(tenant.schemaName).catch((err) => {
    console.error(
      '[account-workspace] catalogue provisioning failed — workspace is live with an empty catalogue',
      tenant.schemaName,
      err,
    )
  })

  const name = input.user.name?.trim() || tenant.company
  await runWithSchema(tenant.schemaName, async () => {
    await upsertUserProfile({
      id: `user_${randomUUID()}`,
      name,
      email,
      role: 'ceo',
      // No password. See the doc comment above — this is the whole point.
      password_hash: null,
    })
  })

  const session: SessionUser = {
    email,
    name,
    initials: initialsOf(name, email),
    role: 'ceo',
    home: '/freehold-intelligence',
    tenant: tenant.subdomain,
  }
  const token = await signSession(session, CLAIM_TOKEN_TTL_MS)

  return {
    ok: true,
    workspace: toWorkspace(tenant),
    claimUrl: `${workspaceUrl(tenant.subdomain)}/api/wl/claim?token=${encodeURIComponent(token)}`,
  }
}
