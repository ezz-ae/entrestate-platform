/**
 * POST /api/calling — place one call to one lead with one template.
 * GET  /api/calling — what is connected, which numbers may originate, what is blocked.
 *
 * THE ORDER OF THE GATES IS THE POINT. Consent, the do-not-call list and the
 * calling window are decided by `planCall` in lib/freehold/call-templates.ts —
 * the one entry point that module says everything which dials goes through —
 * from our own data, before a single byte goes to the voice provider. A
 * refused call costs nothing and rings nobody.
 *
 * The caller-id check runs afterwards against the provider's number list. That
 * is a READ, never a dial: verification is a fact the provider holds and this
 * app is not allowed to decide it (see lib/calling/caller-id.ts for what
 * deciding it ourselves would be).
 *
 * Every refusal returns its own `reason` code and its own sentence. "Call
 * blocked" is useless to a broker: "this lead has no dated consent record" and
 * "it is Friday prayer" have different fixes and different people who fix them.
 *
 * There is no branch in this file that dials without passing all of them, and
 * no fallback that dials when a check cannot be evaluated.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/freehold/api-auth'
import { MANAGEMENT_ROLES } from '@/lib/freehold/session-types'
import { CALL_REFUSALS } from '@/lib/freehold/call-templates'
import {
  callingConnection, getCallingProvider, CallingConfigError, CallingApiError,
} from '@/lib/calling/provider'
import {
  listCallerIdClaims, mergeCallerIds, resolveCallerId, normaliseE164, type CallerId,
} from '@/lib/calling/caller-id'
import {
  RAIL_REFUSALS, RAIL_REFUSAL_SENTENCES, countDoNotCall, describeCallWindows,
  isCallType, loadCallableLead, planCall, type RailRefusal,
} from '@/lib/calling/gates'
import { recordPlacedCall, countPlacedCalls } from '@/lib/calling/call-log'
import { assignCaller, CALLER_REFUSAL_SENTENCES, type CallerRefusal } from '@/lib/freehold/lead-caller'
import { getRosterState } from '@/lib/freehold/sales-employment'
import { resolveCallAgent, bindTeamAgents, agentReadyMembers } from '@/lib/freehold/visual-sales-voice'
import { getMember } from '@/lib/freehold/visual-sales-team'

// Brokers place their own calls; management and marketing place them on behalf
// of a team. Nobody outside this list can reach a lead's phone through the
// product, which is why the list is written out rather than defaulted to "any
// authenticated user".
const ALLOWED = [...MANAGEMENT_ROLES, 'marketing', 'team_leader', 'broker'] as const

// 409 for "the state says no" — the request was well formed and the answer is
// still no. 400 is a malformed request, 404 a missing lead, 503 nothing
// connected. A broker reading a 409 knows to fix the lead, not the button.
const RAIL_STATUS: Record<RailRefusal, number> = {
  leadNotFound: 404,
  unknownTemplate: 400,
  phoneUnusable: 409,
  notConnected: 503,
  callerIdUnverified: 409,
  callerIdUnknown: 409,
  callerIdNone: 409,
}

/** Refusals that belong to the rails — nothing connected, no verified number. */
function refuseRail(reason: RailRefusal) {
  return NextResponse.json(
    { placed: false, reason, message: RAIL_REFUSAL_SENTENCES[reason] },
    { status: RAIL_STATUS[reason] },
  )
}

/**
 * Refusals that belong to the ROSTER — nobody employed, trained, voiced or
 * speaking this language. 409 like the lead refusals, because the request was
 * well formed and the answer is still no; but the message points at hiring and
 * training rather than at the lead, so a broker fixes the right thing.
 */
function refuseRoster(reason: CallerRefusal | 'memberAgentMissing', message?: string) {
  return NextResponse.json(
    {
      placed: false,
      reason,
      message: message ?? CALLER_REFUSAL_SENTENCES[reason as CallerRefusal],
    },
    { status: 409 },
  )
}

/** Refusals that belong to the lead — consent, hours, do-not-call, cadence. */
function refuseLead(reason: string, sentence: string) {
  return NextResponse.json({ placed: false, reason, message: sentence }, { status: 409 })
}

/**
 * The tenant's caller-id numbers: the provider's list (authoritative on
 * verification) merged with the numbers this tenant claimed. Throws when
 * nothing is connected — the caller checks that first, so an empty list here
 * never reads as "you have no numbers".
 */
async function callerIdsForTenant(): Promise<CallerId[]> {
  const [provider, claims] = await Promise.all([
    getCallingProvider(),
    listCallerIdClaims().catch(() => []),
  ])
  const numbers = await provider.listNumbers()
  return mergeCallerIds({ providerNumbers: numbers, claims })
}

export async function GET() {
  const auth = await requireSession([...ALLOWED])
  if ('res' in auth) return auth.res

  const connection = await callingConnection()

  let callerIds: CallerId[] = []
  let providerError: string | null = null
  if (connection.connected) {
    try {
      callerIds = await callerIdsForTenant()
    } catch (e) {
      // Say the provider would not answer. An empty list here would read as
      // "you have no numbers", which sends the tenant out to buy one they own.
      providerError = e instanceof CallingApiError ? e.message : 'The voice provider did not answer.'
    }
  }

  const verified = callerIds.filter((c) => c.verifiedAt && c.providerNumberId)
  const [doNotCall, placed] = await Promise.all([countDoNotCall(), countPlacedCalls()])

  return NextResponse.json({
    connection,
    providerError,
    callerIds,
    // Exact counts of rows we hold. Nothing here is an estimate, so nothing
    // here needs a bound or a Withheld.
    counts: {
      callerIdsVerified: verified.length,
      callerIdsPending: callerIds.length - verified.length,
      doNotCall,
      callsPlaced: placed,
    },
    callWindows: describeCallWindows(),
    timeZone: 'Asia/Dubai',
    // What a broker cannot do right now, and why. Same codes POST returns.
    blocked: connection.connected
      ? (verified.length === 0 ? (['callerIdNone'] satisfies RailRefusal[]) : [])
      : (['notConnected'] satisfies RailRefusal[]),
    refusals: [...CALL_REFUSALS, ...RAIL_REFUSALS],
  })
}

interface PlaceBody {
  leadId?: string
  /** A CALL_TYPES id — the template that will be spoken. */
  templateId?: string
  /** Optional: a brokerage with two lines choosing which one shows. */
  callerId?: string
  /** Opt in to the vendor's number. Off by default — it is not the client's number. */
  allowPlatformFallback?: boolean
  /** The language this call happens in. Anything else is read as English —
   *  a guess about a language nobody on the team speaks would be refused by
   *  assignCaller anyway, and refusing early on a typo helps nobody. */
  language?: 'en' | 'ar' | 'ru'
  /** Members this lead has already turned down, so the re-engagement is a
   *  different person on the line (lib/freehold/lead-caller.ts). */
  avoidMemberIds?: string[]
}

export async function POST(req: NextRequest) {
  const auth = await requireSession([...ALLOWED])
  if ('res' in auth) return auth.res

  const body = (await req.json().catch(() => ({}))) as PlaceBody
  const leadId = String(body.leadId ?? '').trim()
  const templateId = String(body.templateId ?? '').trim()
  if (!leadId || !templateId) {
    return NextResponse.json({ placed: false, error: 'leadId and templateId are required' }, { status: 400 })
  }
  if (!isCallType(templateId)) return refuseRail('unknownTemplate')

  // ── Decided from our own data. Nothing has been sent anywhere yet. ───────

  const lead = await loadCallableLead(leadId)
  if (!lead) return refuseRail('leadNotFound')

  // A number that will not normalise is refused on its own terms. planCall
  // would call it present and the provider would reject it after we had
  // already spent a request saying the lead was callable.
  const to = lead.phone ? normaliseE164(lead.phone) : null
  if (lead.phone && !to) return refuseRail('phoneUnusable')

  const now = new Date()
  const plan = planCall(lead, templateId, now)
  if (!plan.go) return refuseLead(plan.refusal, plan.sentence)
  if (!to) return refuseRail('phoneUnusable') // planCall proved phone is present; this proves it is dialable

  // ── WHO makes this call. ─────────────────────────────────────────────────
  // Until this block existed the answer was "the connection's single default
  // agent", so every member of the Visual Sales Team reached every lead in the
  // same voice — the fixed-voice promise broken at the one place a lead can
  // hear it. assignCaller() runs the roster gates (employed, trained to
  // READINESS_THRESHOLD, own voice, speaks the language, not the person this
  // lead already turned down); the lead gate above still outranks all of them.
  const roster = await getRosterState(now)
  const language = (body.language === 'ar' || body.language === 'ru') ? body.language : 'en'
  const assigned = assignCaller(
    { ...lead, language, avoidMemberIds: Array.isArray(body.avoidMemberIds) ? body.avoidMemberIds.map(String) : [] },
    templateId,
    now,
    roster,
  )
  if (!assigned.go) {
    // A lead-side refusal can only come from planCall, which already returned
    // above; anything reaching here is about the roster.
    return assigned.leadRefused
      ? refuseLead(assigned.refusal, assigned.sentence)
      : refuseRoster(assigned.refusal as CallerRefusal)
  }

  // The chosen member must have their OWN provider agent. No fallback to the
  // connection default on purpose: dialling as somebody else is the failure
  // this whole block exists to end, and a wrong voice is worse than a refusal
  // an operator can fix in one environment variable.
  const member = getMember(assigned.memberId)!
  const agent = resolveCallAgent(member)
  if (!agent.agentId || !agentReadyMembers(bindTeamAgents()).includes(member.id)) {
    return refuseRoster(
      'memberAgentMissing',
      `${member.name} has no voice agent of their own. Set CALL_AGENT_MEMBER_${member.id.toUpperCase()} so they do not call as someone else.`,
    )
  }

  // ── Provider state. Reads only — nothing here dials. ─────────────────────

  const connection = await callingConnection()
  if (!connection.connected) return refuseRail('notConnected')

  let callerIds: CallerId[]
  try {
    callerIds = await callerIdsForTenant()
  } catch (e) {
    if (e instanceof CallingConfigError) return refuseRail('notConnected')
    const status = e instanceof CallingApiError ? e.status : 502
    return NextResponse.json(
      { placed: false, error: e instanceof Error ? e.message : 'The voice provider did not answer.' },
      { status: status >= 400 && status < 600 ? status : 502 },
    )
  }

  const resolved = resolveCallerId({
    requested: body.callerId ?? null,
    available: callerIds,
    allowPlatformFallback: body.allowPlatformFallback === true,
  })
  if (!resolved.ok) {
    const map = {
      caller_id_unverified: 'callerIdUnverified',
      caller_id_unknown: 'callerIdUnknown',
      caller_id_none: 'callerIdNone',
    } as const
    return refuseRail(map[resolved.refusal])
  }

  // Belt and braces. resolveCallerId already refuses an unverified number;
  // this line means a future edit to that function cannot make a spoofed call
  // reachable from here without also deleting an obvious guard.
  const from = resolved.callerId
  if (!from.providerNumberId || !from.verifiedAt) return refuseRail('callerIdUnverified')

  // ── Every gate passed. This is the only line in the file that dials. ─────

  try {
    const provider = await getCallingProvider()
    const call = await provider.placeCall({
      to,
      fromNumberId: from.providerNumberId,
      templateId,
      agentId: agent.agentId,
      metadata: { lead_id: lead.id, template_id: templateId, placed_by: auth.user.email, member_id: member.id },
    })

    await recordPlacedCall({
      callId: call.callId,
      provider: provider.id,
      leadId: lead.id,
      templateId,
      fromE164: from.e164,
      toE164: to,
      status: call.status,
      placedBy: auth.user.email,
    })

    return NextResponse.json({
      placed: true,
      callId: call.callId,
      status: call.status,
      from: from.e164,
      to,
      templateId,
      maxDurationSec: plan.maxDurationSec,
      // Who the lead actually spoke to, and who else was free — so a second
      // call can avoid the same person (lead-caller.ts, avoidMemberIds).
      memberId: member.id,
      alternates: assigned.alternates,
    })
  } catch (e) {
    if (e instanceof CallingConfigError) return refuseRail('notConnected')
    const status = e instanceof CallingApiError ? e.status : 502
    return NextResponse.json(
      { placed: false, error: e instanceof Error ? e.message : 'The call could not be placed.' },
      { status: status >= 400 && status < 600 ? status : 502 },
    )
  }
}
