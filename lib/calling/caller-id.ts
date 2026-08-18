/**
 * CALLER ID — whose number shows on the lead's screen.
 *
 * The owner's requirement is plain: the call comes FROM THE CLIENT'S OWN
 * NUMBER. A Dubai buyer who answers a call from an unknown UAE mobile hangs
 * up; a buyer who sees the brokerage's number, the one on the listing and on
 * the WhatsApp thread, picks up. So a tenant is in exactly one of two states:
 *
 *   (a) tenant_verified — the brokerage brought its own number and completed
 *       the provider's verification for it. Calls originate from it.
 *   (b) platform        — no number of their own, so calls originate from a
 *       number the vendor owns. Honest, and clearly not the brokerage's, which
 *       is why it is a fallback and never a silent default.
 *
 * THE PROHIBITION, and its why:
 *
 *   An UNVERIFIED number can NEVER be used as caller ID. Not as a fallback,
 *   not "just for testing", not when the tenant insists it is their number.
 *   Presenting a number you have not proven you control is caller-ID spoofing.
 *   It is illegal in most jurisdictions this product sells into — the UAE, the
 *   UK, the US among them — and every voice provider terminates the account on
 *   the first complaint, which takes down every other tenant on the same
 *   provider account with it. The refusal is therefore not a policy preference
 *   we could relax under pressure from one customer; it is the condition of
 *   the platform continuing to exist.
 *
 * Verification is not a flag this app can set. It is a fact held by the
 * provider: the number appears in the provider's own number list, which means
 * the provider will originate from it. `verifiedAt` in our table records WHEN
 * we last saw that, never that we decided it.
 *
 * The resolution functions below are pure — no clock, no network, no DB — so
 * the guard suite can prove the refusals rather than assert their shape.
 */

import { ensureOnce, query } from '@/lib/db'
import type { ProviderNumber } from './provider'

// ── Model ────────────────────────────────────────────────────────────────────

export const CALLER_ID_ORIGINS = ['tenant_verified', 'platform'] as const
export type CallerIdOrigin = (typeof CALLER_ID_ORIGINS)[number]

export interface CallerId {
  /** E.164, normalised. The display value and the comparison value are the same. */
  e164: string
  origin: CallerIdOrigin
  /** Provider-side id. Null means the provider does not hold this number. */
  providerNumberId: string | null
  /** ISO timestamp of the last time the provider confirmed it holds this number. */
  verifiedAt: string | null
  label: string | null
}

/**
 * A number a tenant has entered but the provider has not confirmed. Kept as a
 * separate type from CallerId so it is impossible to hand one to placeCall by
 * mistake — the compiler, not a reviewer, enforces the prohibition above.
 */
export interface PendingCallerId {
  e164: string
  label: string | null
  claimedBy: string
  claimedAt: string
}

/**
 * Walkable const array — `pnpm i18n` cannot see t(`pcall.refuse.${r}`), so
 * scripts/dynamic-keys-test.ts enumerates the family from here.
 */
export const CALLER_ID_REFUSALS = [
  'caller_id_unverified',  // the number exists in our table, the provider does not hold it
  'caller_id_unknown',     // the requested number is not on this tenant's list at all
  'caller_id_none',        // the tenant has no verified number and no platform fallback
] as const
export type CallerIdRefusal = (typeof CALLER_ID_REFUSALS)[number]

export type CallerIdResolution =
  | { ok: true; callerId: CallerId }
  | { ok: false; refusal: CallerIdRefusal }

// ── Normalisation ────────────────────────────────────────────────────────────

/**
 * One spelling of a number, everywhere. "+971 50 123 4567" and "+971501234567"
 * are the same phone and must compare equal — otherwise a genuinely verified
 * number reads as unverified purely because a broker typed spaces. That
 * mistake fails closed (a refusal, not a spoofed call), which is safe but
 * looks like a bug to the person who typed it correctly.
 *
 * Returns null for anything that is not E.164: leading +, 8–15 digits. We do
 * not guess a country code — guessing dials a stranger.
 */
export function normaliseE164(raw: string): string | null {
  const trimmed = String(raw ?? '').replace(/[\s\-().]/g, '')
  if (!/^\+[1-9]\d{7,14}$/.test(trimmed)) return null
  return trimmed
}

/** Same number, whatever the typing. Both sides normalise or it is not a match. */
export function sameNumber(a: string, b: string): boolean {
  const na = normaliseE164(a)
  const nb = normaliseE164(b)
  return na !== null && na === nb
}

// ── The prohibition, as a function ───────────────────────────────────────────

/**
 * The single gate every call path must pass. A CallerId is usable only when
 * the provider holds the number (providerNumberId) AND we have recorded the
 * confirmation (verifiedAt). Both, because one without the other means our
 * table and the provider disagree, and a disagreement about who owns a phone
 * number is exactly the case that must not dial.
 */
export function usableAsCallerId(c: CallerId | null | undefined): c is CallerId {
  return !!c && !!c.providerNumberId && !!c.verifiedAt
}

/**
 * Pick the number a call originates from.
 *
 * `requested` names a specific number (a brokerage with two lines choosing the
 * sales line over the leasing line). Omit it to take the tenant's own verified
 * number, and only then the platform number.
 *
 * The order is deliberate: the tenant's own number always beats the platform
 * number, because a call from the vendor's number is a worse call — the lead
 * does not recognise it and the brokerage does not own the callback.
 *
 * `allowPlatformFallback` gates the SILENT fall-through only. Naming the
 * platform number in `requested` is a person choosing it on purpose, and that
 * stays allowed — the flag exists so nobody gets the vendor's number by
 * default and finds out from a lead who called it back.
 */
export function resolveCallerId(args: {
  requested?: string | null
  available: readonly CallerId[]
  /** Off by default: falling back to the vendor's number silently changes who the lead thinks called. */
  allowPlatformFallback?: boolean
}): CallerIdResolution {
  const { requested, available, allowPlatformFallback = false } = args

  if (requested) {
    const match = available.find((c) => sameNumber(c.e164, requested))
    if (!match) return { ok: false, refusal: 'caller_id_unknown' }
    if (!usableAsCallerId(match)) return { ok: false, refusal: 'caller_id_unverified' }
    return { ok: true, callerId: match }
  }

  const own = available.find((c) => c.origin === 'tenant_verified' && usableAsCallerId(c))
  if (own) return { ok: true, callerId: own }

  if (allowPlatformFallback) {
    const platform = available.find((c) => c.origin === 'platform' && usableAsCallerId(c))
    if (platform) return { ok: true, callerId: platform }
  }

  // A tenant whose only numbers are unverified lands here, and the message the
  // route renders must say "verify it with the provider", not "add a number" —
  // they already added it.
  return { ok: false, refusal: 'caller_id_none' }
}

// ── Which of the provider's numbers belong to the vendor ─────────────────────

/**
 * Provider-side ids of numbers the VENDOR owns, comma separated. Unset on a
 * customer deployment, which is the safe direction: with no platform number
 * configured, a tenant that has not registered its own number cannot call at
 * all. Compare that to the alternative — inheriting whatever number the
 * provider account happens to list, which would put an unrelated brokerage's
 * verified line on this tenant's outbound calls.
 */
function platformNumberIds(): Set<string> {
  return new Set(
    (process.env.CALLING_PLATFORM_NUMBER_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )
}

/**
 * Merge what the provider holds with what this tenant claimed, into the list
 * the UI shows and `resolveCallerId` reads.
 *
 * The provider list is the authority on verification. A claim the provider
 * does not list stays in the result with verifiedAt null so the screen can
 * show it as pending — showing nothing would look like the claim was lost.
 */
export function mergeCallerIds(args: {
  providerNumbers: readonly ProviderNumber[]
  claims: readonly PendingCallerId[]
  /** Passed in rather than read from env inside, so the guard suite can drive it. */
  platformIds?: ReadonlySet<string>
  /** Injected for the same reason — a pure function must not read the clock. */
  now?: string
}): CallerId[] {
  const platform = args.platformIds ?? platformNumberIds()
  const at = args.now ?? new Date().toISOString()

  const out: CallerId[] = []
  for (const p of args.providerNumbers) {
    const e164 = normaliseE164(p.e164)
    if (!e164) continue // a number we cannot normalise is a number we will not dial
    const claim = args.claims.find((c) => sameNumber(c.e164, e164))
    out.push({
      e164,
      origin: platform.has(p.id) ? 'platform' : 'tenant_verified',
      providerNumberId: p.id,
      verifiedAt: p.verified ? at : null,
      label: claim?.label ?? p.label ?? null,
    })
  }

  for (const c of args.claims) {
    const e164 = normaliseE164(c.e164)
    if (!e164) continue
    if (out.some((x) => x.e164 === e164)) continue
    out.push({
      e164,
      origin: 'tenant_verified',
      providerNumberId: null,
      verifiedAt: null,
      label: c.label,
    })
  }

  return out
}

// ── Tenant claims store ──────────────────────────────────────────────────────

/**
 * Numbers a tenant says are theirs. Per-tenant by construction: the table
 * lives in whichever schema the request resolved to, so one brokerage can
 * never read — or dial from — another's line.
 *
 * This table records a CLAIM. It has no verified column on purpose: a verified
 * column here would be a place for our code to mark a number verified, and the
 * only thing allowed to do that is the provider's own number list.
 */
const ensureTable = async (): Promise<void> => {
  await ensureOnce('freehold_calling_caller_ids', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS freehold_calling_caller_ids (
        e164       text PRIMARY KEY,
        label      text,
        claimed_by text NOT NULL,
        claimed_at timestamptz NOT NULL DEFAULT now()
      )
    `)
  })
}

export async function listCallerIdClaims(): Promise<PendingCallerId[]> {
  await ensureTable()
  const rows = await query<{ e164: string; label: string | null; claimed_by: string; claimed_at: Date }>(
    `SELECT e164, label, claimed_by, claimed_at FROM freehold_calling_caller_ids ORDER BY claimed_at`,
  )
  return rows.map((r) => ({
    e164: r.e164,
    label: r.label,
    claimedBy: r.claimed_by,
    claimedAt: new Date(r.claimed_at).toISOString(),
  }))
}

/** Record a claim. Returns null when the number is not E.164 — we store no guesses. */
export async function claimCallerId(raw: string, label: string | null, claimedBy: string): Promise<string | null> {
  const e164 = normaliseE164(raw)
  if (!e164) return null
  await ensureTable()
  await query(
    `INSERT INTO freehold_calling_caller_ids (e164, label, claimed_by, claimed_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (e164) DO UPDATE SET label = $2, claimed_by = $3, claimed_at = now()`,
    [e164, label, claimedBy],
  )
  return e164
}

export async function removeCallerIdClaim(raw: string): Promise<void> {
  const e164 = normaliseE164(raw)
  if (!e164) return
  await ensureTable()
  await query(`DELETE FROM freehold_calling_caller_ids WHERE e164 = $1`, [e164])
}
