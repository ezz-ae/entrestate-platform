/**
 * GET /api/calling/preview — who would call this lead, and why not.
 *
 * The same decision POST /api/calling makes, without the call. It exists
 * because the product's real value on this screen is the REFUSAL: "no dated
 * consent record", "it is Friday prayer", "Hessa is trained to 61%" are three
 * different problems with three different people who fix them, and a broker
 * should read the one that applies BEFORE pressing anything.
 *
 * IT IS A GET, AND THAT IS THE SAFETY PROPERTY. A dry-run flag on the POST
 * would put the decision and the dial in one handler, one boolean apart — and
 * the day somebody defaults that boolean wrong, a preview places a call. This
 * file cannot dial: it never imports getCallingProvider, and the guard asserts
 * that it never does. A preview that could ring a stranger's phone is not a
 * preview.
 *
 * It reads the provider only for CONNECTION STATE (are we connected at all),
 * which is the same read GET /api/calling already does.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/freehold/api-auth'
import { MANAGEMENT_ROLES } from '@/lib/freehold/session-types'
import { callingConnection } from '@/lib/calling/provider'
import { isCallType, loadCallableLead, RAIL_REFUSAL_SENTENCES } from '@/lib/calling/gates'
import { normaliseE164 } from '@/lib/calling/caller-id'
import { assignCaller, CALLER_REFUSAL_SENTENCES, type CallerRefusal } from '@/lib/freehold/lead-caller'
import { getRosterState } from '@/lib/freehold/sales-employment'
import { resolveCallAgent, bindTeamAgents, agentReadyMembers } from '@/lib/freehold/visual-sales-voice'
import { getMember, totalRate } from '@/lib/freehold/visual-sales-team'

const ALLOWED = [...MANAGEMENT_ROLES, 'marketing', 'team_leader', 'broker'] as const

/** One shape for every answer, so the screen renders one component either way. */
interface Preview {
  ready: boolean
  /** Who would speak, when ready. */
  member: { id: string; name: string; title: string; rate: number } | null
  /** Colleagues also allowed — the operator's override list. */
  alternates: Array<{ id: string; name: string }>
  reason: string | null
  message: string | null
  /** True when the block is about the LEAD (consent, hours, do-not-call) rather
   *  than about the team. The screen sends the broker to a different fix. */
  aboutLead: boolean
}

const blocked = (reason: string, message: string, aboutLead: boolean): Preview => ({
  ready: false, member: null, alternates: [], reason, message, aboutLead,
})

export async function GET(req: NextRequest) {
  const auth = await requireSession([...ALLOWED])
  if ('res' in auth) return auth.res

  const url = new URL(req.url)
  const leadId = (url.searchParams.get('leadId') ?? '').trim()
  const templateId = (url.searchParams.get('templateId') ?? '').trim()
  const langParam = url.searchParams.get('language')
  const language = langParam === 'ar' || langParam === 'ru' ? langParam : 'en'
  const avoidMemberIds = (url.searchParams.get('avoid') ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean)

  if (!leadId || !isCallType(templateId)) {
    return NextResponse.json(blocked('unknownTemplate', RAIL_REFUSAL_SENTENCES.unknownTemplate, false), { status: 400 })
  }

  const lead = await loadCallableLead(leadId)
  if (!lead) {
    return NextResponse.json(blocked('leadNotFound', RAIL_REFUSAL_SENTENCES.leadNotFound, true), { status: 404 })
  }
  if (lead.phone && !normaliseE164(lead.phone)) {
    return NextResponse.json(blocked('phoneUnusable', RAIL_REFUSAL_SENTENCES.phoneUnusable, true))
  }

  // Connection state is a read. Reported before the roster because "nothing is
  // connected" is not the team's fault and has one obvious fix.
  const connection = await callingConnection()
  if (!connection.connected) {
    return NextResponse.json(blocked('notConnected', RAIL_REFUSAL_SENTENCES.notConnected, false))
  }

  const now = new Date()
  const decision = assignCaller(
    { ...lead, language, avoidMemberIds },
    templateId,
    now,
    await getRosterState(now),
  )

  if (!decision.go) {
    const message = decision.leadRefused
      ? decision.sentence
      : CALLER_REFUSAL_SENTENCES[decision.refusal as CallerRefusal] ?? decision.sentence
    return NextResponse.json(blocked(decision.refusal, message, decision.leadRefused))
  }

  // The chosen member must own their voice agent — the same refusal POST makes,
  // shown here so nobody presses a button that was always going to refuse.
  const member = getMember(decision.memberId)!
  const agent = resolveCallAgent(member)
  if (!agent.agentId || !agentReadyMembers(bindTeamAgents()).includes(member.id)) {
    return NextResponse.json(blocked(
      'memberAgentMissing',
      `${member.name} has no voice agent of their own. Set CALL_AGENT_MEMBER_${member.id.toUpperCase()} so they do not call as someone else.`,
      false,
    ))
  }

  const preview: Preview = {
    ready: true,
    member: { id: member.id, name: member.name, title: member.title, rate: totalRate(member) },
    alternates: decision.alternates
      .map((id) => getMember(id))
      .filter((m): m is NonNullable<typeof m> => !!m)
      .map((m) => ({ id: m.id, name: m.name })),
    reason: null,
    message: null,
    aboutLead: false,
  }
  return NextResponse.json(preview)
}
