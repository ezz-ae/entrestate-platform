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
import { countPlacedCalls } from '@/lib/calling/call-log'
import { placeLeadCall } from '@/lib/calling/place'
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

  // The whole gate sequence lives in lib/calling/place.ts so the coordinator
  // chat can run the SAME one — two copies of a compliance order is one copy
  // that gets edited and one that does not.
  const r = await placeLeadCall({
    leadId: String(body.leadId ?? '').trim(),
    templateId: String(body.templateId ?? '').trim(),
    language: body.language,
    avoidMemberIds: Array.isArray(body.avoidMemberIds) ? body.avoidMemberIds.map(String) : [],
    placedBy: auth.user.email,
    callerId: body.callerId ?? null,
    allowPlatformFallback: body.allowPlatformFallback === true,
  })

  if (!r.placed) {
    if (r.wouldPlace) {
      // Unreachable here — this route never dry-runs — but typed so a future
      // edit that passes dryRun cannot silently return a 200 "placed".
      return NextResponse.json({ placed: false, reason: 'dryRun', message: 'Preview only.' }, { status: 409 })
    }
    return NextResponse.json({ placed: false, reason: r.reason, message: r.message }, { status: r.status })
  }

  return NextResponse.json({
    placed: true,
    callId: r.callId,
    status: r.status,
    from: r.from,
    to: r.to,
    templateId: r.templateId,
    maxDurationSec: r.maxDurationSec,
    // Who the lead actually spoke to, and who else was free — so a second call
    // can avoid the same person (lib/freehold/lead-caller.ts, avoidMemberIds).
    memberId: r.memberId,
    alternates: r.alternates,
  })
}
