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
 *   2. THE SESSION'S EMAIL IS VERIFIED. Added in review, and it is the one that
 *      matters most: Neon Auth allows email+password sign-up, and a session can
 *      exist before the address is proved. Without this check, anyone who typed
 *      owner@brokerage.com at the Terminal's sign-up form would hold a session
 *      whose email matches `owner_email`, and the door below would open the
 *      brokerage's workspace as its CEO. The provider is configured to require
 *      verification today; this code does not rely on that staying true.
 *   3. The workspace exists and is not suspended.
 *   4. `saas_tenants.owner_email` equals that session's email, lowercased.
 *
 * Condition 4 has a trap the schema documents and this module enforces:
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
import { ensureCreditAccount } from '@/lib/freehold/credits-db'
import { TENANT_BASE_DOMAIN } from './config'
import {
  createTenant,
  getTenantBySubdomain,
  tenantsOwnedByEmail,
  TENANT_LOGO_MAX_BYTES,
  type SaasTenant,
  type TenantPlan,
} from './store'
import { provisionTenantSchema } from './provision'

/**
 * The identity both doors accept, or null.
 *
 * One function so the two entry points cannot drift apart on what "proved"
 * means. Returns the lowercased email only when the session says the address
 * is verified; everything else — no email, no @, unverified — is null, and the
 * caller treats null exactly as it treats a stranger.
 */
function provedEmail(user: { email: string | null; emailVerified: boolean }): string | null {
  if (user.emailVerified !== true) return null
  const email = (user.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) return null
  return email
}

/**
 * Claim tokens are single-purpose and near-immediate — keep them short.
 *
 * Moved here from lib/tenancy/onboard.ts when the password sign-up path was
 * removed; this module is now the only thing that mints one.
 */
export const CLAIM_TOKEN_TTL_MS = 2 * 60 * 1000

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

/** Decoded byte length of a base64 data: URL payload. */
function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return 0
  return Math.floor(((dataUrl.length - comma - 1) * 3) / 4)
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
export async function workspacesForAccount(
  user: { email: string | null; emailVerified: boolean },
): Promise<AccountWorkspace[]> {
  // Listing discloses which brokerages an email owns. That is exactly the fact
  // an unverified session must not be able to learn by typing an address.
  const email = provedEmail(user)
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
  user: { email: string | null; name: string | null; emailVerified: boolean }
}): Promise<EnterResult> {
  // An unverified session is a stranger here, and gets the stranger's answer.
  const email = provedEmail(input.user)
  if (!email) return { ok: false, reason: 'not_found' }

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
  | {
      ok: false
      reason:
        | 'invalid_subdomain'
        | 'reserved'
        | 'taken'
        | 'company_required'
        | 'email_unverified'
        | 'store_unreachable'
    }

/** A workspace's brand and plan, as the sign-up form collects them. All optional. */
export type WorkspaceBrand = {
  product?: string
  accent?: string
  logo?: string
  plan?: TenantPlan
}

/**
 * Create a workspace owned by the signed-in account — with no password.
 *
 * THE ONLY WAY A WORKSPACE IS BORN. `signupTenant()` in lib/tenancy/onboard.ts
 * used to be the other way: a name, an email and a PASSWORD typed into a form,
 * hashed into the tenant schema as a second identity for the same human. It
 * was removed rather than gated, because a path that exists is a path someone
 * eventually re-opens. Every caller — /business/account's small form and
 * /signup's branded one — now lands here, with the identity coming from a
 * verified Neon session and never from a field.
 *
 * The owner row inside the tenant schema is written WITHOUT a `password_hash`,
 * deliberately: there is one password on this account and it is Neon's. A
 * null hash cannot be verified by `verifyPassword`, so the tenant's own
 * sign-in form can never let anyone in as this owner — the only door is the
 * claim token minted below, which requires the Neon session first.
 *
 * The consequence is worth stating: this owner CANNOT sign in at
 * {sub}.entrestate.com by typing a password, ever. That is the intended
 * shape, not an oversight, and it is why the tenant sign-in screen carries a
 * link back to the account page.
 *
 * `brand` carries what the sign-up form's live preview lets a person choose —
 * product word, accent, logo, plan. Nothing the old path could do was lost;
 * only the second password.
 */
export async function createWorkspaceForAccount(input: {
  subdomain: string
  company: string
  user: { email: string | null; name: string | null; emailVerified: boolean }
  brand?: WorkspaceBrand
}): Promise<CreateWorkspaceResult> {
  // Creating a workspace stamps this email as its owner for good, so an
  // unproved address must not get that far. This reason is its own value —
  // the first draft returned `store_unreachable` here, which told the person
  // "something broke on our side" when the fix was in their inbox.
  const email = provedEmail(input.user)
  if (!email) return { ok: false, reason: 'email_unverified' }

  const company = input.company.trim()
  if (!company) return { ok: false, reason: 'company_required' }

  // The logo is bounded here as well as at the API edge: this function is the
  // one place a workspace is born, so the cap belongs where it cannot be
  // bypassed by a second caller.
  const logo = (input.brand?.logo ?? '').startsWith('data:image/') && dataUrlBytes(input.brand?.logo ?? '') <= TENANT_LOGO_MAX_BYTES
    ? input.brand!.logo!
    : ''

  const created = await createTenant({
    subdomain: input.subdomain,
    company,
    product: input.brand?.product,
    accent: input.brand?.accent,
    logo,
    // 'account' is the plan the foundation named for a workspace that hangs off
    // one Entrestate account. The branded sign-up may still choose 'company' or
    // 'realtor' — those are SURFACE plans (what the workspace shows), and they
    // no longer imply a separate identity.
    plan: input.brand?.plan ?? 'account',
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
    // A realtor workspace bills in tokens on the per-broker credit rails, so
    // the owner gets their account at creation — opened at exactly 0, topped
    // up only when a human confirms a payment. Keyed by EMAIL: every credit
    // path resolves the account as `brokerId ?? email`, and the owner (role
    // 'ceo') has no brokerId. Carried over from the removed password path
    // unchanged: non-fatal and logged, because every credit path self-heals
    // the row on first touch and a failed seed must never sink the creation.
    if (tenant.plan === 'realtor') {
      const seeded = await ensureCreditAccount(email, { monthlyGrant: false }).catch(
        () => ({ ok: false as const, created: false }),
      )
      if (!seeded.ok) {
        console.error(
          '[account-workspace] token account seeding failed — owner has no credit account yet (self-heals on first credit touch)',
          tenant.schemaName, email,
        )
      }
    }
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
