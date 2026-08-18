/**
 * THE GATES, as the rails see them.
 *
 * The decisions live in lib/freehold/call-templates.ts — CALL_TYPES, the
 * templates, CALL_WINDOWS, the consent rules and `planCall`, which that module
 * states is the one entry point everything that dials goes through. This file
 * does not re-decide any of it. It does the two jobs that module deliberately
 * left open:
 *
 *   1. WHERE THE CONSENT DATE LIVES. `CallableLead.marketing_consent_at` has
 *      no column on freehold_site_leads, and call-templates.ts says as much:
 *      undefined is refused, not assumed. `freehold_calling_consent` below is
 *      that record — its own table, because consent is a legal artifact with a
 *      date, a source and a withdrawal, and a lead row gets rewritten by
 *      imports and dedupe that have no business touching it.
 *
 *   2. WHERE THE DO-NOT-CALL LIST LIVES. Keyed by phone number, not lead id: a
 *      person who says "stop calling me" is telling you about their phone, and
 *      the same phone appears under three lead rows from three portals.
 *
 * Plus the refusals that are about the RAILS rather than the lead — nothing
 * connected, no verified caller ID — which call-templates.ts has no opinion on
 * because they are not facts about a person.
 *
 * FAIL CLOSED, everywhere. Every read here treats an error as the blocking
 * answer. A database that will not say whether this number is on the
 * do-not-call list has not said the number is allowed. A wrongly refused call
 * is a broker pressing the button again in ten minutes; a wrongly placed call
 * is a regulator, a terminated provider account, and a lead who never trusts
 * the brokerage again.
 */

import { ensureOnce, query } from '@/lib/db'
import {
  CALL_TYPES, CALL_WINDOWS, WEEKDAYS,
  type CallableLead, type CallType,
} from '@/lib/freehold/call-templates'
import { normaliseE164 } from './caller-id'

export { CALL_TYPES, CALL_WINDOWS, planCall, REFUSAL_SENTENCES } from '@/lib/freehold/call-templates'
export type { CallType, CallableLead, CallPlan, CallRefusal } from '@/lib/freehold/call-templates'

/** Narrowing guard — a template id off the wire is a string until proven otherwise. */
export function isCallType(id: string): id is CallType {
  return (CALL_TYPES as readonly string[]).includes(id)
}

/**
 * Refusals about the rails, not the lead. Separate const array from
 * call-templates' CALL_REFUSALS so neither list has to know about the other,
 * and walkable for the same reason: `pnpm i18n` cannot see a computed key, so
 * a new refusal cannot ship without a sentence to render for it.
 */
export const RAIL_REFUSALS = [
  'leadNotFound',
  'unknownTemplate',
  'phoneUnusable',
  'notConnected',
  'callerIdUnverified',
  'callerIdUnknown',
  'callerIdNone',
] as const
export type RailRefusal = (typeof RAIL_REFUSALS)[number]

/** One line a broker reads, in the same register as REFUSAL_SENTENCES. */
export const RAIL_REFUSAL_SENTENCES: Readonly<Record<RailRefusal, string>> = {
  leadNotFound: 'That lead is not in the CRM.',
  unknownTemplate: 'That call template does not exist.',
  phoneUnusable: 'The number on this lead is not in international format, so it cannot be dialled.',
  notConnected: 'No voice provider is connected. Connect one under Integrations → Calling.',
  callerIdUnverified: 'That number is not verified with the voice provider, so it cannot be the caller ID.',
  callerIdUnknown: 'That number is not on this account.',
  callerIdNone: 'No verified caller-id number. Add your number under Integrations → Calling and register it with the provider.',
}

// ── Calling hours, for the screen ────────────────────────────────────────────

const DAY_LABEL: Record<string, string> = {
  sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
}

/**
 * "Sun, Mon, Tue, Wed, Thu, Sat 10:00–20:00 · Fri 10:00–11:30, 14:00–20:00".
 *
 * Built from CALL_WINDOWS itself rather than typed out, so the sentence on the
 * screen cannot drift from the constant the gate reads. A screen that promises
 * hours the dialler does not honour is worse than a screen that says nothing.
 */
export function describeCallWindows(): string {
  const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
  const groups = new Map<string, string[]>()
  for (const day of WEEKDAYS) {
    const w = CALL_WINDOWS.find((x) => x.day === day)
    if (!w) continue
    const sig = w.segments.map((s) => `${hhmm(s.fromMin)}–${hhmm(s.toMin)}`).join(', ')
    const days = groups.get(sig) ?? []
    days.push(DAY_LABEL[day] ?? day)
    groups.set(sig, days)
  }
  return [...groups.entries()].map(([hours, days]) => `${days.join(', ')} ${hours}`).join(' · ')
}

// ── Consent store ────────────────────────────────────────────────────────────

export interface CallConsentRecord {
  /** ISO timestamp the lead agreed to be called. Null = never agreed. */
  grantedAt: string | null
  /** Where the agreement came from — form checkbox, WhatsApp reply, signed form. */
  source: string | null
  /** ISO timestamp the lead withdrew it. Any value here beats grantedAt. */
  withdrawnAt: string | null
}

const ensureConsentTable = async (): Promise<void> => {
  await ensureOnce('freehold_calling_consent', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS freehold_calling_consent (
        lead_id      text PRIMARY KEY,
        granted_at   timestamptz,
        source       text,
        withdrawn_at timestamptz,
        recorded_by  text,
        updated_at   timestamptz NOT NULL DEFAULT now()
      )
    `)
  })
}

/**
 * Consent for one lead, or null when there is no row — and null is read as
 * "not allowed", never as "unknown, proceed". A read failure returns null for
 * the same reason: the answer we could not get is not permission.
 */
export async function getCallConsent(leadId: string): Promise<CallConsentRecord | null> {
  try {
    await ensureConsentTable()
    const rows = await query<{ granted_at: Date | null; source: string | null; withdrawn_at: Date | null }>(
      `SELECT granted_at, source, withdrawn_at FROM freehold_calling_consent WHERE lead_id = $1 LIMIT 1`,
      [leadId],
    )
    const r = rows[0]
    if (!r) return null
    return {
      grantedAt: r.granted_at ? new Date(r.granted_at).toISOString() : null,
      source: r.source,
      withdrawnAt: r.withdrawn_at ? new Date(r.withdrawn_at).toISOString() : null,
    }
  } catch (err) {
    console.error('[calling] consent read failed, treating as no consent', leadId, err)
    return null
  }
}

/**
 * The date `planCall` reads, or null.
 *
 * Consent with no source is not consent: a date with nobody able to say where
 * it came from is what an audit finds and cannot defend. A withdrawal beats
 * any grant, whatever the dates say — someone who withdrew and then filled a
 * form again re-permissions through the desk, not through a race between two
 * timestamps.
 */
export function consentDateFor(record: CallConsentRecord | null): string | null {
  if (!record) return null
  if (record.withdrawnAt) return null
  if (!record.source) return null
  return record.grantedAt
}

export async function recordCallConsent(
  leadId: string,
  grantedAt: string,
  source: string,
  recordedBy: string,
): Promise<void> {
  await ensureConsentTable()
  await query(
    `INSERT INTO freehold_calling_consent (lead_id, granted_at, source, recorded_by, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (lead_id) DO UPDATE
       SET granted_at = $2, source = $3, recorded_by = $4, withdrawn_at = NULL, updated_at = now()`,
    [leadId, grantedAt, source, recordedBy],
  )
}

export async function withdrawCallConsent(leadId: string, recordedBy: string): Promise<void> {
  await ensureConsentTable()
  await query(
    `INSERT INTO freehold_calling_consent (lead_id, withdrawn_at, recorded_by, updated_at)
     VALUES ($1, now(), $2, now())
     ON CONFLICT (lead_id) DO UPDATE SET withdrawn_at = now(), recorded_by = $2, updated_at = now()`,
    [leadId, recordedBy],
  )
}

// ── Do-not-call list ─────────────────────────────────────────────────────────

const ensureDncTable = async (): Promise<void> => {
  await ensureOnce('freehold_calling_do_not_call', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS freehold_calling_do_not_call (
        e164     text PRIMARY KEY,
        reason   text,
        added_by text,
        added_at timestamptz NOT NULL DEFAULT now()
      )
    `)
  })
}

/**
 * True when this number must not be called.
 *
 * Returns TRUE on a read failure and TRUE on a number that will not normalise.
 * Both are the fail-closed direction: an unreadable list is not an empty list,
 * and a number we cannot parse is a number we cannot check against the list.
 */
export async function isDoNotCall(rawNumber: string): Promise<boolean> {
  const e164 = normaliseE164(rawNumber)
  if (!e164) return true
  try {
    await ensureDncTable()
    const rows = await query<{ e164: string }>(
      `SELECT e164 FROM freehold_calling_do_not_call WHERE e164 = $1 LIMIT 1`,
      [e164],
    )
    return rows.length > 0
  } catch (err) {
    console.error('[calling] do-not-call read failed, refusing the call', err)
    return true
  }
}

export async function addDoNotCall(rawNumber: string, reason: string | null, addedBy: string): Promise<boolean> {
  const e164 = normaliseE164(rawNumber)
  if (!e164) return false
  await ensureDncTable()
  await query(
    `INSERT INTO freehold_calling_do_not_call (e164, reason, added_by, added_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (e164) DO UPDATE SET reason = $2, added_by = $3, added_at = now()`,
    [e164, reason, addedBy],
  )
  return true
}

export async function countDoNotCall(): Promise<number> {
  try {
    await ensureDncTable()
    const rows = await query<{ n: string }>(`SELECT count(*)::text AS n FROM freehold_calling_do_not_call`)
    return Number(rows[0]?.n ?? 0)
  } catch {
    return 0
  }
}

// ── Assembling the lead the gate reads ───────────────────────────────────────

/**
 * The CRM row plus the two facts that live here. Field names below are the
 * freehold_site_leads column names, which is the shape CallableLead documents.
 *
 * Every failure path returns null and the route renders "that lead is not in
 * the CRM" — the wrong sentence for a database outage and the right outcome,
 * because the alternative is dialling a record we could not read. The error is
 * logged so the real cause stays recoverable.
 */
export async function loadCallableLead(leadId: string): Promise<CallableLead | null> {
  let row: {
    id: string
    phone: string | null
    blocked: boolean | null
    archived: boolean | null
    muted_until: Date | null
    snooze_until: Date | null
    last_contact_at: Date | null
  } | undefined

  try {
    const rows = await query<NonNullable<typeof row>>(
      `SELECT id, phone, blocked, archived, muted_until, snooze_until, last_contact_at
         FROM freehold_site_leads WHERE id = $1 LIMIT 1`,
      [leadId],
    )
    row = rows[0]
  } catch (err) {
    console.error('[calling] lead read failed, refusing the call', leadId, err)
    return null
  }
  if (!row) return null

  const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null)
  const consent = await getCallConsent(leadId)
  // Only ask the do-not-call list about a number it can answer for. A missing
  // or malformed number is refused by its own gate upstream, and reporting it
  // as "on the do-not-call list" would send someone to delete a row that is
  // not there.
  const e164 = row.phone ? normaliseE164(row.phone) : null
  const doNotCall = e164 ? await isDoNotCall(e164) : false

  return {
    id: row.id,
    phone: row.phone,
    blocked: row.blocked,
    archived: row.archived,
    muted_until: iso(row.muted_until),
    snooze_until: iso(row.snooze_until),
    last_contact_at: iso(row.last_contact_at),
    marketing_consent_at: consentDateFor(consent),
    do_not_call: doNotCall,
  }
}
