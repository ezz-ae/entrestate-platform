/**
 * VOICE CALLING — the provider seam.
 *
 * A call costs money the moment it connects and it reaches a real person's
 * phone, so this module is written to do nothing at all until a tenant has
 * actually connected a provider. There is no demo mode, no mock call, no
 * "pretend it worked" branch. When credentials are missing every entry point
 * throws `CallingConfigError`, which is the same shape `MetaConfigError`
 * already has in lib/meta/client.ts — every screen in this product knows how
 * to render that as "not connected" instead of inventing a result.
 *
 * The interface is narrow on purpose: placeCall / getCall / listNumbers. Those
 * three are the whole surface the CRM needs, and keeping it to three means the
 * day the owner swaps ElevenLabs for Twilio, Vonage or an on-prem SIP bridge,
 * the swap is one file and not a search through the app.
 *
 * Server-side only. The API key never reaches the browser: it is read from the
 * tenant's sealed credential store (AES-256-GCM, see lib/freehold/secure-store.ts)
 * or from an env var when ops wants an override.
 */

import { getStoredCreds, setStoredCreds, clearStoredCreds } from '@/lib/freehold/integration-credentials'

// ── Errors ───────────────────────────────────────────────────────────────────

/**
 * Raised when calling is not connected. Mirrors MetaConfigError deliberately:
 * the "not connected" state is a normal, expected state of this product (most
 * tenants never connect voice), not an exception the operator must debug.
 */
export class CallingConfigError extends Error {
  constructor(public readonly missing: string) {
    super(
      `Calling is not connected: ${missing} is missing. ` +
      `Connect a voice provider under Integrations → Calling.`,
    )
    this.name = 'CallingConfigError'
  }
}

/** Raised when the provider answered, and said no. Carries its HTTP status. */
export class CallingApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly providerCode?: string,
  ) {
    super(message)
    this.name = 'CallingApiError'
  }
}

// ── Call status vocabulary ───────────────────────────────────────────────────

/**
 * Walkable const array, not a bare union — `pnpm i18n` cannot see a computed
 * key like t(`pcall.status.${s}`), so scripts/dynamic-keys-test.ts enumerates
 * the family from this array. Adding a status without adding its key is the
 * defect that rule exists to catch.
 */
export const CALL_STATUSES = [
  'queued',      // accepted by the provider, no carrier leg yet
  'ringing',
  'in_progress',
  'completed',
  'no_answer',
  'busy',
  'failed',
] as const
export type CallStatus = (typeof CALL_STATUSES)[number]

// ── Provider contract ────────────────────────────────────────────────────────

export interface PlaceCallInput {
  /** Destination, E.164 with the leading +. The provider rejects anything else. */
  to: string
  /**
   * The PROVIDER's id for the caller-id number — not the number itself.
   * Passing a raw number would let a caller pick any string; passing an id
   * means the provider has the number on file and has verified it.
   */
  fromNumberId: string
  /** Which script runs. Resolved against lib/freehold/call-templates.ts upstream. */
  templateId: string
  /** The provider-side voice agent that speaks the script. */
  agentId: string
  /** Echoed back on the call record — lead id, user who triggered it. */
  metadata?: Record<string, string>
}

export interface PlacedCall {
  callId: string
  status: CallStatus
  /** ISO timestamp, or null when the provider has not dialled yet. */
  startedAt: string | null
}

export interface CallRecord {
  callId: string
  status: CallStatus
  durationSec: number | null
  endedAt: string | null
  /** Present only when the tenant enabled recording with the provider. */
  recordingUrl: string | null
  transcript: string | null
}

export interface ProviderNumber {
  /** Provider-side id — this is what PlaceCallInput.fromNumberId carries. */
  id: string
  e164: string
  label: string | null
  /**
   * The provider holds this number and will originate from it. A number the
   * provider does not hold can never be true here — see lib/calling/caller-id.ts
   * for why that distinction is load-bearing.
   */
  verified: boolean
}

export interface CallingProvider {
  /** Stable id used in logs and stored on call rows. */
  readonly id: string
  placeCall(input: PlaceCallInput): Promise<PlacedCall>
  /** Null when the provider has no record of that id. */
  getCall(callId: string): Promise<CallRecord | null>
  listNumbers(): Promise<ProviderNumber[]>
}

// ── Credentials ──────────────────────────────────────────────────────────────

export interface CallingStoredCreds {
  apiKey: string
  /** The ElevenLabs Conversational AI agent that speaks. */
  agentId: string
}

/** Provider key in freehold_site_integration_credentials. Sealed at rest. */
export const CALLING_PROVIDER_KEY = 'elevenlabs'

export interface CallingConnection {
  connected: boolean
  /** Where the credentials came from, so a stale env override is visible. */
  source: 'env' | 'db' | null
  agentId: string | null
}

/**
 * Env wins over the stored connection, matching lib/meta/client.ts. The reason
 * that order is stated out loud: when an env var is set, reconnecting in the UI
 * changes nothing, which looks exactly like the app ignoring you. The status
 * endpoint returns `source` so the screen can say which one is live.
 */
async function creds(): Promise<CallingStoredCreds & { source: 'env' | 'db' }> {
  const envKey = process.env.ELEVENLABS_API_KEY
  const envAgent = process.env.ELEVENLABS_AGENT_ID
  if (envKey && envAgent) return { apiKey: envKey, agentId: envAgent, source: 'env' }

  const stored = await getStoredCreds<CallingStoredCreds>(CALLING_PROVIDER_KEY)
  const apiKey = envKey || stored?.apiKey
  const agentId = envAgent || stored?.agentId

  if (!apiKey) throw new CallingConfigError('ELEVENLABS_API_KEY')
  if (!agentId) throw new CallingConfigError('ELEVENLABS_AGENT_ID')
  return { apiKey, agentId, source: envKey && envAgent ? 'env' : 'db' }
}

/** Connection state for the integration screen. Never throws. */
export async function callingConnection(): Promise<CallingConnection> {
  try {
    const c = await creds()
    return { connected: true, source: c.source, agentId: c.agentId }
  } catch {
    return { connected: false, source: null, agentId: null }
  }
}

/** True when a call could be placed at all. Distinct from "this call is allowed". */
export async function isCallingConfigured(): Promise<boolean> {
  return (await callingConnection()).connected
}

export async function saveCallingCreds(c: CallingStoredCreds, updatedBy: string): Promise<void> {
  await setStoredCreds(CALLING_PROVIDER_KEY, c as unknown as Record<string, unknown>, updatedBy)
}

export async function clearCallingCreds(): Promise<void> {
  await clearStoredCreds(CALLING_PROVIDER_KEY)
}

// ── ElevenLabs implementation ────────────────────────────────────────────────

const ELEVENLABS_BASE = 'https://api.elevenlabs.io'

/**
 * ElevenLabs reports its own state words. Anything not listed maps to 'failed'
 * rather than to a guess: a call whose outcome we cannot read is not a call we
 * may report as completed, because "completed" is what stops the CRM retrying
 * and what a broker reads as "the lead has been spoken to".
 */
const ELEVENLABS_STATUS: Record<string, CallStatus> = {
  initiated: 'queued',
  queued: 'queued',
  ringing: 'ringing',
  'in-progress': 'in_progress',
  in_progress: 'in_progress',
  processing: 'in_progress',
  done: 'completed',
  completed: 'completed',
  ended: 'completed',
  'no-answer': 'no_answer',
  no_answer: 'no_answer',
  busy: 'busy',
  failed: 'failed',
  canceled: 'failed',
  cancelled: 'failed',
}

function mapStatus(raw: unknown): CallStatus {
  const key = String(raw ?? '').toLowerCase()
  return ELEVENLABS_STATUS[key] ?? 'failed'
}

interface ElevenLabsErrorBody {
  detail?: { message?: string; status?: string } | string
  message?: string
}

async function el<T>(
  path: string,
  apiKey: string,
  init: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${ELEVENLABS_BASE}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'xi-api-key': apiKey,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    })
  } catch (e) {
    // A network failure is not a placed call. Say so with a status the caller
    // can branch on instead of letting a TypeError reach a route handler.
    throw new CallingApiError(`Could not reach the voice provider: ${String(e)}`, 502)
  }

  const text = await res.text()
  let json: unknown = null
  try { json = text ? JSON.parse(text) : null } catch { /* provider sent non-JSON */ }

  if (!res.ok) {
    const body = (json ?? {}) as ElevenLabsErrorBody
    const detail = typeof body.detail === 'string' ? body.detail : body.detail?.message
    const code = typeof body.detail === 'object' ? body.detail?.status : undefined
    // 401 means the stored key no longer works. Name that plainly — the fix is
    // reconnecting, not retrying.
    const message = res.status === 401
      ? 'The voice provider rejected the API key. Reconnect under Integrations → Calling.'
      : detail || body.message || `Voice provider returned ${res.status}`
    throw new CallingApiError(message, res.status, code)
  }

  return (json ?? {}) as T
}

interface ElOutboundCallResponse {
  success?: boolean
  message?: string
  conversation_id?: string
  callSid?: string
  status?: string
}

interface ElConversationResponse {
  conversation_id?: string
  status?: string
  call_duration_secs?: number
  metadata?: { call_duration_secs?: number; start_time_unix_secs?: number }
  transcript?: Array<{ role?: string; message?: string }> | string
  has_audio?: boolean
}

interface ElPhoneNumber {
  phone_number_id?: string
  phone_number?: string
  label?: string
  provider?: string
  assigned_agent?: { agent_id?: string } | null
}

/**
 * ElevenLabs Conversational AI. The three endpoint paths below are the only
 * ElevenLabs-shaped knowledge in this repo; if they move, they move here.
 */
export class ElevenLabsProvider implements CallingProvider {
  readonly id = 'elevenlabs'

  constructor(private readonly apiKey: string, private readonly defaultAgentId: string) {}

  async placeCall(input: PlaceCallInput): Promise<PlacedCall> {
    const res = await el<ElOutboundCallResponse>('/v1/convai/twilio/outbound-call', this.apiKey, {
      method: 'POST',
      body: {
        agent_id: input.agentId || this.defaultAgentId,
        agent_phone_number_id: input.fromNumberId,
        to_number: input.to,
        // Carried through so a call row can be traced back to the lead that
        // caused it without a second lookup table.
        ...(input.metadata ? { conversation_initiation_client_data: { dynamic_variables: input.metadata } } : {}),
      },
    })

    const callId = res.conversation_id || res.callSid
    if (!callId) {
      // No id means we cannot poll it, cannot show it, and cannot stop it. That
      // is a failure even when the provider answered 200.
      throw new CallingApiError('The voice provider accepted the call but returned no call id.', 502)
    }
    return { callId, status: mapStatus(res.status ?? 'initiated'), startedAt: null }
  }

  async getCall(callId: string): Promise<CallRecord | null> {
    try {
      const res = await el<ElConversationResponse>(
        `/v1/convai/conversations/${encodeURIComponent(callId)}`,
        this.apiKey,
      )
      const duration = res.call_duration_secs ?? res.metadata?.call_duration_secs ?? null
      const start = res.metadata?.start_time_unix_secs
      const endedAt = start != null && duration != null
        ? new Date((start + duration) * 1000).toISOString()
        : null
      const transcript = Array.isArray(res.transcript)
        ? res.transcript.map((l) => `${l.role ?? ''}: ${l.message ?? ''}`).join('\n')
        : (res.transcript ?? null)
      return {
        callId,
        status: mapStatus(res.status),
        durationSec: duration,
        endedAt,
        recordingUrl: null, // fetched separately and only when the tenant enabled recording
        transcript,
      }
    } catch (e) {
      if (e instanceof CallingApiError && e.status === 404) return null
      throw e
    }
  }

  async listNumbers(): Promise<ProviderNumber[]> {
    const res = await el<ElPhoneNumber[] | { phone_numbers?: ElPhoneNumber[] }>(
      '/v1/convai/phone-numbers',
      this.apiKey,
    )
    const rows = Array.isArray(res) ? res : (res.phone_numbers ?? [])
    return rows
      .filter((r): r is ElPhoneNumber & { phone_number_id: string; phone_number: string } =>
        !!r.phone_number_id && !!r.phone_number)
      .map((r) => ({
        id: r.phone_number_id,
        e164: r.phone_number,
        label: r.label ?? null,
        // The provider holds it and will originate from it. That IS the
        // verification — there is no second signal to consult.
        verified: true,
      }))
  }
}

/**
 * The provider for the current tenant. Throws CallingConfigError when nothing
 * is connected — callers must let that reach the screen rather than swallow it
 * into an empty list, because an empty list reads as "no numbers yet" and a
 * refusal reads as "connect this first". Those are different problems.
 */
export async function getCallingProvider(): Promise<CallingProvider> {
  const c = await creds()
  return new ElevenLabsProvider(c.apiKey, c.agentId)
}
