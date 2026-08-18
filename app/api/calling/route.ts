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

  const plan = planCall(lead, templateId, new Date())
  if (!plan.go) return refuseLead(plan.refusal, plan.sentence)
  if (!to) return refuseRail('phoneUnusable') // planCall proved phone is present; this proves it is dialable

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
      agentId: connection.agentId ?? '',
      metadata: { lead_id: lead.id, template_id: templateId, placed_by: auth.user.email },
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
