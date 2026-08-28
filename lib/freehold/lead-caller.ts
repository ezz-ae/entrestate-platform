/**
 * LEAD CALLER — who, of the people you employ, places this call.
 *
 * Two rosters grew up apart, and this module is where they stop being two.
 *
 *   call-templates.ts owns the CALL: the seven scripts, the fields the call
 *   must come back with, the consent gate, the Dubai hours, the refusals. It
 *   is the compliance core and nothing here weakens it.
 *
 *   visual-sales-team.ts owns the PEOPLE: hiring cards, rated skills, training
 *   level, employment, and a fixed voice per member.
 *
 * call-templates carries its own four-voice list because it was written before
 * the team existed. That list also carries a rule the team never had, and it is
 * the best rule either file contains: "a lead who turned down Sara three months
 * ago should not hear Sara open the re-engagement — same script, different
 * person on the line." It is preserved below as `avoidMemberIds`, promoted from
 * a voice-picking convenience to a refusal with a name.
 *
 * THE ORDER IS THE POINT. The lead gate runs first and untouched: a lead who
 * may not be called may not be called, and it does not matter who is free.
 * Only once planCall() says go does this module ask who may speak — and every
 * gate that follows is one this codebase already stated somewhere:
 *
 *   · EMPLOYED AND TRAINED — canTakeCalls(): an ad-token hire answers forms,
 *     never phones, and a member under READINESS_THRESHOLD spends a real lead.
 *   · A VOICE OF THEIR OWN — voiceAllowsCalls() plus no collision: a voice
 *     nobody curated says "not a person" before the pitch starts, and two
 *     colleagues sharing one voice is the failure the fixed-voice rule exists
 *     to prevent.
 *   · SPEAKS THE LANGUAGE — call-templates already refuses "a voice reading
 *     Russian out of an English mouth". Same refusal, made explicit.
 *   · NOT THE ONE THEY ALREADY TURNED DOWN.
 *
 * The tie-break is totalRate(), highest first: when several colleagues are free
 * and allowed, the strongest one takes the call. Deterministic, so the same
 * inputs always name the same caller — a call that cannot be reproduced cannot
 * be explained to a lead who complains about it.
 *
 * Pure. No dialler, no network, no clock of its own — the instant, the roster
 * state and the voice bindings are all passed in.
 */

import {
  planCall, type CallType, type CallTemplate, type CallableLead, type CallLanguage,
} from './call-templates'
import {
  SALES_TEAM, canTakeCalls, totalRate, READINESS_THRESHOLD, type TeamMember,
} from './visual-sales-team'
import {
  bindTeamVoices, voiceCollisions, voiceAllowsCalls, type VoiceBinding,
} from './visual-sales-voice'

/**
 * Why nobody could take this call. Separate from CallRefusal on purpose: those
 * are facts about the LEAD and are permanent or dated; these are facts about
 * the ROSTER, and every one of them is fixed by hiring, training, curating a
 * voice, or waiting. An operator must not read "we employ nobody who speaks
 * Arabic" as "this lead may not be called".
 */
export const CALLER_REFUSALS = [
  'noneEmployed',
  'noneTrained',
  'noVoice',
  'voiceShared',
  'noLanguage',
  'onlyRefusedCaller',
] as const
export type CallerRefusal = (typeof CALLER_REFUSALS)[number]

export const CALLER_REFUSAL_SENTENCES: Readonly<Record<CallerRefusal, string>> = {
  noneEmployed: 'Nobody on the team is employed. An ads-only hire answers forms; a call needs someone on payroll.',
  noneTrained: `Nobody employed is trained to ${READINESS_THRESHOLD}% yet. Keep teaching — an under-taught caller spends a real lead.`,
  noVoice: 'Nobody available has a curated voice. Set the voice keys before anyone dials.',
  voiceShared: 'The only people free share one voice with a colleague. Give each their own before they call the same buyer.',
  noLanguage: 'Nobody on the team holds a conversation in this lead’s language. This one is a human call.',
  onlyRefusedCaller: 'The only person free is the one this lead already turned down. Wait, or put someone else on it.',
}

/** What this module needs to know about the lead, beyond the call gate's own
 *  input: the language they actually speak, and who has already called them. */
export interface CallerLead extends CallableLead {
  /** The language this conversation happens in. */
  readonly language: CallLanguage
  /** Members who have already called this lead and were turned down. */
  readonly avoidMemberIds?: readonly string[]
}

/** Employment and training are per account, not per catalogue — passed in. */
export interface RosterState {
  /** Member ids currently on payroll. Absent = not employed. */
  readonly employed: readonly string[]
  /** Trained level per member id, 0–100. Absent = the catalogue's baseLevel. */
  readonly trained?: Readonly<Record<string, number>>
}

export type CallerAssignment =
  | {
      readonly go: true
      readonly memberId: string
      readonly template: CallTemplate
      readonly maxDurationSec: number
      /** The provider reference the dialler speaks with. */
      readonly voiceRefId: string
      /** Colleagues who were also allowed, best first — the operator's override list. */
      readonly alternates: readonly string[]
    }
  | {
      readonly go: false
      /** A fact about the LEAD (from planCall) or about the ROSTER. */
      readonly refusal: string
      readonly sentence: string
      /** True when the lead itself is the reason — nothing about hiring fixes it. */
      readonly leadRefused: boolean
    }

const trainedLevel = (m: TeamMember, roster: RosterState): number =>
  roster.trained?.[m.id] ?? m.baseLevel

/**
 * Who may place this call, and why not.
 *
 * Refusals are reported in the order the operator can act on them: the lead
 * gate first (nothing about the team changes it), then employment, training,
 * voice, language, and last the already-refused rule — so "hire somebody" is
 * never reported when the real answer is "train the one you have".
 */
export function assignCaller(
  lead: CallerLead,
  type: CallType,
  at: Date,
  roster: RosterState,
  env: Record<string, string | undefined> = process.env,
  team: TeamMember[] = SALES_TEAM,
): CallerAssignment {
  // 1. THE LEAD GATE, FIRST AND UNTOUCHED.
  const plan = planCall(lead, type, at)
  if (!plan.go) {
    return { go: false, refusal: plan.refusal, sentence: plan.sentence, leadRefused: true }
  }

  const refuse = (r: CallerRefusal): CallerAssignment => ({
    go: false, refusal: r, sentence: CALLER_REFUSAL_SENTENCES[r], leadRefused: false,
  })

  // 2. EMPLOYED — a call needs someone on payroll (an ad-token hire goes offline).
  const employed = team.filter((m) => roster.employed.includes(m.id))
  if (employed.length === 0) return refuse('noneEmployed')

  // 3. TRAINED — canTakeCalls() carries both gates; employment is already true here.
  const trained = employed.filter((m) => canTakeCalls(m, trainedLevel(m, roster), true))
  if (trained.length === 0) return refuse('noneTrained')

  // 4. A VOICE OF THEIR OWN. Collisions are computed across the WHOLE roster,
  //    not just the trained few: a voice shared with a colleague who is not
  //    free today is still shared with them tomorrow.
  const bindings = bindTeamVoices(env, team)
  const byId = new Map<string, VoiceBinding>(bindings.map((b) => [b.memberId, b]))
  const colliding = new Set(voiceCollisions(bindings).flatMap((c) => c.memberIds))

  const voiced = trained.filter((m) => {
    const b = byId.get(m.id)
    return !!b && voiceAllowsCalls(b)
  })
  if (voiced.length === 0) return refuse('noVoice')

  const distinct = voiced.filter((m) => !colliding.has(m.id))
  if (distinct.length === 0) return refuse('voiceShared')

  // 5. SPEAKS THE LANGUAGE — never a voice reading Russian out of an English mouth.
  const speaks = distinct.filter((m) => m.languages.includes(lead.language))
  if (speaks.length === 0) return refuse('noLanguage')

  // 6. NOT THE ONE THEY ALREADY TURNED DOWN.
  const avoid = new Set(lead.avoidMemberIds ?? [])
  const fresh = speaks.filter((m) => !avoid.has(m.id))
  if (fresh.length === 0) return refuse('onlyRefusedCaller')

  // Best available takes it; ties break by id so the choice is reproducible.
  const ranked = [...fresh].sort((a, b) => totalRate(b) - totalRate(a) || a.id.localeCompare(b.id))
  const chosen = ranked[0]

  return {
    go: true,
    memberId: chosen.id,
    template: plan.template,
    maxDurationSec: plan.maxDurationSec,
    voiceRefId: byId.get(chosen.id)!.refId,
    alternates: ranked.slice(1).map((m) => m.id),
  }
}

/**
 * The roster as an operator screen would show it: everyone, and for each the
 * one thing standing between them and the phone. Not derived from assignCaller
 * — that answers "who takes THIS call"; this answers "what is my team's state".
 */
export interface CallerReadiness {
  readonly memberId: string
  readonly ready: boolean
  /** The first unmet requirement, or null when ready. */
  readonly blocker: CallerRefusal | null
}

export function rosterReadiness(
  roster: RosterState,
  env: Record<string, string | undefined> = process.env,
  team: TeamMember[] = SALES_TEAM,
): CallerReadiness[] {
  const bindings = bindTeamVoices(env, team)
  const byId = new Map<string, VoiceBinding>(bindings.map((b) => [b.memberId, b]))
  const colliding = new Set(voiceCollisions(bindings).flatMap((c) => c.memberIds))

  return team.map((m) => {
    const isEmployed = roster.employed.includes(m.id)
    if (!isEmployed) return { memberId: m.id, ready: false, blocker: 'noneEmployed' as const }
    if (!canTakeCalls(m, trainedLevel(m, roster), true)) {
      return { memberId: m.id, ready: false, blocker: 'noneTrained' as const }
    }
    const b = byId.get(m.id)
    if (!b || !voiceAllowsCalls(b)) return { memberId: m.id, ready: false, blocker: 'noVoice' as const }
    if (colliding.has(m.id)) return { memberId: m.id, ready: false, blocker: 'voiceShared' as const }
    return { memberId: m.id, ready: true, blocker: null }
  })
}
