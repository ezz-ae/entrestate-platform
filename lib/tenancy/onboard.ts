/**
 * Self-serve trial onboarding — everything that happens between "Create my
 * workspace" and the broker standing inside their own branded instance.
 *
 * The signup request arrives on the APEX host, but the instance lives on
 * {sub}.TENANT_BASE_DOMAIN — and session cookies are host-only by design. So
 * instead of setting a cookie the tenant host would never see, signup returns
 * a short-lived HMAC claim token; /api/wl/claim on the TENANT host verifies
 * it (host must match the token's tenant), mints the real session cookie
 * there, and lands the admin on their home screen.
 */

import { randomUUID } from 'node:crypto'
import { runWithSchema } from '@/lib/db'
import { signSession } from '@/lib/freehold/auth-edge'
import { hashPassword } from '@/lib/auth'
import { upsertUserProfile } from '@/lib/data'
import { ensureCreditAccount } from '@/lib/freehold/credits-db'
import type { SessionUser } from '@/lib/freehold/session-types'
import { createTenant, type SaasTenant, type TenantPlan } from './store'
import { provisionTenantSchema } from './provision'

/** Claim tokens are single-purpose and near-immediate — keep them short. */
export const CLAIM_TOKEN_TTL_MS = 2 * 60 * 1000

export type SignupResult =
  | { ok: true; tenant: SaasTenant; claimToken: string }
  | { ok: false; reason: 'invalid_subdomain' | 'reserved' | 'taken' }

const initialsOf = (name: string, email: string): string =>
  (name || email).split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'WS'

/**
 * Create the tenant, provision its schema, create its first (owner) account
 * inside that schema, and mint the claim token that logs them in on their
 * own subdomain.
 */
export async function signupTenant(input: {
  subdomain: string
  company: string
  product?: string
  accent?: string
  logo?: string
  plan?: TenantPlan
  adminName: string
  adminEmail: string
  password: string
}): Promise<SignupResult> {
  const created = await createTenant({
    subdomain: input.subdomain,
    company: input.company,
    product: input.product,
    accent: input.accent,
    logo: input.logo,
    plan: input.plan,
    // Recorded on the tenant row, in the CONTROL PLANE, because that is the
    // only table reachable from a host that is not theirs. The same email also
    // becomes the owner inside the tenant schema below, with the password —
    // but nothing on entrestate.com can read a tenant schema without first
    // knowing which one to open, which is exactly what this answers.
    ownerEmail: input.adminEmail,
  })
  if (!created.ok) return { ok: false, reason: created.reason }
  const tenant = created.tenant

  // Private catalogue copy — still non-fatal (idempotent; lazy DDL covers the
  // rest, and an operator retry can finish it), but never silent. Swallowing
  // the error is how a workspace goes live with an EMPTY catalogue: signup
  // returns 200, the claim token mints a working session, and the broker lands
  // on a blank product with nothing anywhere saying why. There is no
  // re-provision route either — POST /api/wl/tenants rejects the subdomain as
  // taken long before it reaches provisioning — so this log is the only trace a
  // misconfigured database will ever leave.
  await provisionTenantSchema(tenant.schemaName).catch((err) => {
    console.error(
      '[tenancy] catalogue provisioning failed — workspace is live with an empty catalogue',
      tenant.schemaName,
      err,
    )
  })

  // The owner account lives INSIDE the tenant schema: their users table,
  // their roster, their login. A 'realtor' owner is still 'ceo' — they own
  // their one-person workspace outright; the few-clicks UX comes from plan
  // surface gating, never from a weaker role.
  const email = input.adminEmail.trim().toLowerCase()
  const name = input.adminName.trim() || tenant.company
  await runWithSchema(tenant.schemaName, async () => {
    await upsertUserProfile({
      id: `user_${randomUUID()}`,
      name,
      email,
      role: 'ceo',
      password_hash: await hashPassword(input.password),
    })
    // A realtor workspace bills in tokens on the per-broker credit rails, so
    // the owner gets their account at signup — opened at exactly 0, topped up
    // only when a human confirms a payment. Keyed by EMAIL: every credit path
    // resolves the account as `brokerId ?? email`, and the owner (role 'ceo')
    // has no brokerId, so email is the identity their money lives under.
    // Runs INSIDE this schema scope — the account belongs to THEIR ledger, not
    // the shared one. Non-fatal and logged, same posture as provisioning: a
    // failed seed self-heals on first touch (every credit path creates the
    // account row if missing), so it must never sink the signup.
    if (tenant.plan === 'realtor') {
      const seeded = await ensureCreditAccount(email, { monthlyGrant: false }).catch(
        () => ({ ok: false as const, created: false }),
      )
      if (!seeded.ok) {
        console.error(
          '[tenancy] token account seeding failed — owner has no credit account yet (self-heals on first credit touch)',
          tenant.schemaName, email,
        )
      }
    }
  })

  const owner: SessionUser = {
    email,
    name,
    initials: initialsOf(name, email),
    role: 'ceo',
    home: '/freehold-intelligence',
    tenant: tenant.subdomain,
  }
  const claimToken = await signSession(owner, CLAIM_TOKEN_TTL_MS)

  return { ok: true, tenant, claimToken }
}
