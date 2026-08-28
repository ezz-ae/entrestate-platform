/**
 * PLACING A CALL — one implementation, however many doors.
 *
 * POST /api/calling was the only thing that could dial, so the coordinator chat
 * — the single face this product speaks through — could plan a campaign, design
 * a creative and build a form, and could not make a phone ring. Giving the chat
 * its own dialler would have meant a second copy of the gate order: consent,
 * do-not-call, Dubai hours, the roster, the member's own voice agent. Two copies
 * of a compliance sequence is one copy that gets edited and one that does not,
 * and "duplicate agent brains are how this codebase got its built-twice scars"
 * (agent-router.ts) applies with more force when the duplicate can ring a
 * stranger at 2am.
 *
 * So the sequence lives here, once. The HTTP route is a thin wrapper that maps
 * the result onto status codes; the chat tool calls the same function with the
 * same arguments. Neither can dial without the other's gates.
 *
 * THE ORDER IS THE PRODUCT, and it is preserved exactly:
 *   1. the template must exist          → unknownTemplate
 *   2. the lead must exist and be dialable → leadNotFound / phoneUnusable
 *   3. planCall(): consent, DNC, hours  → the lead's own refusals
 *   4. a provider must be connected     → notConnected
 *   5. assignCaller(): the roster gates → employed / trained / voiced / language
 *   6. the member must own their agent  → memberAgentMissing
 *   7. a verified caller-id             → callerId*
 *   8. and only then, one dial.
 */

import { planCall, type CallType } from '@/lib/freehold/call-templates'
import {
  isCallType, loadCallableLead, RAIL_REFUSAL_SENTENCES, type RailRefusal,
} from '@/lib/calling/gates'
import { normaliseE164, listCallerIdClaims, mergeCallerIds, resolveCallerId, type CallerId } from '@/lib/calling/caller-id'
import {
  callingConnection, getCallingProvider, CallingConfigError, CallingApiError,
} from '@/lib/calling/provider'
import { recordPlacedCall } from '@/lib/calling/call-log'
import { assignCaller, CALLER_REFUSAL_SENTENCES, type CallerRefusal } from '@/lib/freehold/lead-caller'
import { getRosterState } from '@/lib/freehold/sales-employment'
import { resolveCallAgent, bindTeamAgents, agentReadyMembers } from '@/lib/freehold/visual-sales-voice'
import { getMember } from '@/lib/freehold/visual-sales-team'

export type CallLang = 'en' | 'ar' | 'ru'

export interface PlaceLeadCallInput {
  leadId: string
  templateId: string
  language?: CallLang
  /** Members this lead already turned down — they do not call back. */
  avoidMemberIds?: string[]
  /** Recorded on the call row; the person or agent that triggered it. */
  placedBy: string
  callerId?: string | null
  allowPlatformFallback?: boolean
  /** When true, run every gate and STOP before dialling. The preview endpoint
   *  and the chat's read-only tool use this; nothing rings. */
  dryRun?: boolean
}

/** Where a refusal came from, so a caller can send someone to the right fix. */
export type RefusalKind = 'rail' | 'lead' | 'roster' | 'provider'

export type PlaceLeadCallResult =
  | {
      placed: true
      callId: string
      status: string
      from: string
      to: string
      templateId: string
      maxDurationSec: number
      memberId: string
      memberName: string
      alternates: string[]
    }
  | {
      /** dryRun only: every gate passed, nothing was dialled. */
      placed: false
      wouldPlace: true
      to: string
      templateId: string
      maxDurationSec: number
      memberId: string
      memberName: string
      alternates: string[]
    }
  | { placed: false; wouldPlace: false; kind: RefusalKind; reason: string; message: string; status: number }

const refuse = (kind: RefusalKind, reason: string, message: string, status = 409): PlaceLeadCallResult =>
  ({ placed: false, wouldPlace: false, kind, reason, message, status })

const rail = (reason: RailRefusal, status: number) =>
  refuse('rail', reason, RAIL_REFUSAL_SENTENCES[reason], status)

export async function placeLeadCall(input: PlaceLeadCallInput): Promise<PlaceLeadCallResult> {
  const leadId = String(input.leadId ?? '').trim()
  const templateId = String(input.templateId ?? '').trim()
  if (!leadId || !templateId) {
    return refuse('rail', 'unknownTemplate', 'leadId and templateId are required.', 400)
  }
  if (!isCallType(templateId)) return rail('unknownTemplate', 400)

  // ── Decided from our own data. Nothing has been sent anywhere yet. ───────
  const lead = await loadCallableLead(leadId)
  if (!lead) return rail('leadNotFound', 404)

  const to = lead.phone ? normaliseE164(lead.phone) : null
  if (lead.phone && !to) return rail('phoneUnusable', 409)

  const now = new Date()
  const plan = planCall(lead, templateId as CallType, now)
  if (!plan.go) return refuse('lead', plan.refusal, plan.sentence)
  if (!to) return rail('phoneUnusable', 409)

  const connection = await callingConnection()
  if (!connection.connected) return rail('notConnected', 503)

  // ── WHO makes this call. ─────────────────────────────────────────────────
  const language: CallLang = input.language === 'ar' || input.language === 'ru' ? input.language : 'en'
  const assigned = assignCaller(
    { ...lead, language, avoidMemberIds: input.avoidMemberIds ?? [] },
    templateId as CallType,
    now,
    await getRosterState(now),
  )
  if (!assigned.go) {
    return assigned.leadRefused
      ? refuse('lead', assigned.refusal, assigned.sentence)
      : refuse('roster', assigned.refusal,
          CALLER_REFUSAL_SENTENCES[assigned.refusal as CallerRefusal] ?? assigned.sentence)
  }

  const member = getMember(assigned.memberId)!
  const agent = resolveCallAgent(member)
  if (!agent.agentId || !agentReadyMembers(bindTeamAgents()).includes(member.id)) {
    return refuse('roster', 'memberAgentMissing',
      `${member.name} has no voice agent of their own. Set CALL_AGENT_MEMBER_${member.id.toUpperCase()} so they do not call as someone else.`)
  }

  // ── The caller-id. A READ against the provider, never a dial. ────────────
  let callerIds: CallerId[]
  try {
    const [provider, claims] = await Promise.all([getCallingProvider(), listCallerIdClaims().catch(() => [])])
    callerIds = mergeCallerIds({ providerNumbers: await provider.listNumbers(), claims })
  } catch (e) {
    if (e instanceof CallingConfigError) return rail('notConnected', 503)
    const status = e instanceof CallingApiError ? e.status : 502
    return refuse('provider', 'providerUnreachable',
      e instanceof Error ? e.message : 'The voice provider did not answer.',
      status >= 400 && status < 600 ? status : 502)
  }

  const resolved = resolveCallerId({
    requested: input.callerId ?? null,
    available: callerIds,
    allowPlatformFallback: input.allowPlatformFallback === true,
  })
  if (!resolved.ok) {
    const map = {
      caller_id_unverified: 'callerIdUnverified',
      caller_id_unknown: 'callerIdUnknown',
      caller_id_none: 'callerIdNone',
    } as const
    return rail(map[resolved.refusal], 409)
  }
  const from = resolved.callerId
  // Belt and braces: a future edit to resolveCallerId cannot make a spoofed
  // number reachable from here without also deleting an obvious guard.
  if (!from.providerNumberId || !from.verifiedAt) return rail('callerIdUnverified', 409)

  const shape = {
    to, templateId, maxDurationSec: plan.maxDurationSec,
    memberId: member.id, memberName: member.name, alternates: [...assigned.alternates],
  }

  // Every gate passed. A dry run stops HERE — this is the last line before a
  // phone rings, and the preview must never cross it.
  if (input.dryRun) return { placed: false, wouldPlace: true, ...shape }

  try {
    const provider = await getCallingProvider()
    const call = await provider.placeCall({
      to,
      fromNumberId: from.providerNumberId,
      templateId,
      agentId: agent.agentId,
      metadata: { lead_id: lead.id, template_id: templateId, placed_by: input.placedBy, member_id: member.id },
    })
    await recordPlacedCall({
      callId: call.callId, provider: provider.id, leadId: lead.id, templateId,
      fromE164: from.e164, toE164: to, status: call.status, placedBy: input.placedBy,
    })
    return { placed: true, callId: call.callId, status: call.status, from: from.e164, ...shape }
  } catch (e) {
    if (e instanceof CallingConfigError) return rail('notConnected', 503)
    const status = e instanceof CallingApiError ? e.status : 502
    return refuse('provider', 'providerRejected',
      e instanceof Error ? e.message : 'The call could not be placed.',
      status >= 400 && status < 600 ? status : 502)
  }
}
