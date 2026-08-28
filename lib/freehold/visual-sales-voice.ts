/**
 * THE VOICE BINDING — turning a team member's voice slot into a real one.
 *
 * visual-sales-team.ts says every member has a FIXED, high-stability voice and
 * gives it a logical slot id. It deliberately does not name a provider voice:
 * on a live sales call the voice is the credibility, and the ids that make a
 * voice real belong in configuration, not in a catalogue committed to git.
 *
 * This module is the join. It resolves a member to a provider reference using
 * the SAME environment convention kloom already uses for its own cast —
 * FISH_VOICE_<ISO>[_<GENDER>] — so one curated Fish Audio account serves both
 * products and a voice curated once is curated everywhere.
 *
 * Three rules, each with the failure it answers to:
 *
 *   1. NEVER BAKE IN A VOICE ID. kloom learned this first and wrote it down:
 *      the top Fish voices per language are mostly public figures, so a
 *      hardcoded id is "a likeness landmine". Ours is the same rule the cast
 *      already states as voiceClone: false — a member never imitates a real
 *      person. Configuration keeps the choice with whoever curated it.
 *
 *   2. TWO SALESPEOPLE MUST NEVER SHARE A VOICE. This is not tidiness. Our
 *      roster is mostly Arabic-speaking, so a naive language+gender lookup
 *      hands Sara, Hessa and the Product Authority the SAME
 *      FISH_VOICE_AR_FEMALE — three colleagues, one voice, on calls with the
 *      same lead. The per-member key exists to make each one distinct, and
 *      collisions are reported rather than shipped.
 *
 *   3. A FALLBACK VOICE MAY CHAT, NEVER CALL. When nothing is curated for a
 *      member's language, Fish still renders the words — in an English-pool
 *      voice. For kloom's rooms that is an acceptable degrade. For a Gulf
 *      salesperson phoning a real buyer it is worse than silence: the accent
 *      says "this is not a person" before the pitch starts. So the binding
 *      carries its QUALITY, and the call gate refuses anything but native —
 *      the same shape as canTakeCalls(), which already refuses an untrained or
 *      unemployed member.
 *
 * Pure resolution over env + the catalogue. No network, no provider SDK: the
 * caller that actually speaks takes the returned reference.
 */

import { SALES_TEAM, type TeamMember } from './visual-sales-team'

/** The only provider wired today. Kept explicit so a second one is an addition,
 *  never a silent swap of what a voice id means. */
export type VoiceProvider = 'fish'

/**
 * `native`   — a voice curated FOR this member, or for their language.
 * `fallback` — nothing curated; the provider will render the language in a
 *              voice that was not chosen for it. Chat only (rule 3).
 */
export type VoiceQuality = 'native' | 'fallback'

export interface VoiceBinding {
  memberId: string
  provider: VoiceProvider
  /** The provider's reference id. Empty only when quality is 'fallback'. */
  refId: string
  /** ISO-639-1 of the language this voice was curated for. */
  iso: string
  quality: VoiceQuality
  /** Which env key supplied it — for the operator's settings screen, so a
   *  missing voice names the variable to set instead of failing silently. */
  sourceKey: string | null
}

/**
 * The member's primary language: the first in their `languages` list. That
 * ordering is meaningful in the catalogue — Sara is ar/fr/en because she opens
 * in Arabic — so the voice follows the language she actually greets in.
 */
export function primaryIso(member: TeamMember): string {
  return (member.languages[0] || 'en').toLowerCase()
}

/**
 * Env keys tried in order, most specific first:
 *
 *   FISH_VOICE_MEMBER_<ID>        this member's own voice — the only key that
 *                                 can guarantee rule 2, so it wins
 *   FISH_VOICE_<ISO>_<GENDER>     kloom's convention, shared verbatim
 *   FISH_VOICE_<ISO>              kloom's convention, shared verbatim
 */
export function voiceKeysFor(member: TeamMember): string[] {
  const iso = primaryIso(member).toUpperCase()
  const gender = member.presents === 'f' ? 'FEMALE' : 'MALE'
  return [
    `FISH_VOICE_MEMBER_${member.id.toUpperCase().replace(/-/g, '_')}`,
    `FISH_VOICE_${iso}_${gender}`,
    `FISH_VOICE_${iso}`,
  ]
}

/** Resolve one member's voice from the environment. Pure apart from env reads. */
export function resolveVoice(
  member: TeamMember,
  env: Record<string, string | undefined> = process.env,
): VoiceBinding {
  const iso = primaryIso(member)
  for (const key of voiceKeysFor(member)) {
    const value = (env[key] || '').trim()
    if (value) {
      return { memberId: member.id, provider: 'fish', refId: value, iso, quality: 'native', sourceKey: key }
    }
  }
  // Nothing curated. Honest about it rather than quietly borrowing a voice that
  // was chosen for another language.
  return { memberId: member.id, provider: 'fish', refId: '', iso, quality: 'fallback', sourceKey: null }
}

/**
 * RULE 3, as a predicate. A member may take a live call only with a voice that
 * was actually curated for them or their language. Composed with — never
 * instead of — canTakeCalls(), which covers training and employment.
 */
export function voiceAllowsCalls(binding: VoiceBinding): boolean {
  return binding.quality === 'native' && binding.refId.length > 0
}

export interface VoiceCollision {
  refId: string
  memberIds: string[]
}

/**
 * RULE 2, as a check. Any provider voice bound to more than one member is a
 * collision: two colleagues who sound identical on a call with the same lead.
 * Reported for the operator's settings screen — and, because a shared voice is
 * exactly the failure the fixed-voice rule exists to prevent, a colliding
 * member is not call-ready either (see callReadyVoices below).
 */
export function voiceCollisions(bindings: VoiceBinding[]): VoiceCollision[] {
  const byRef = new Map<string, string[]>()
  for (const b of bindings) {
    if (!b.refId) continue
    byRef.set(b.refId, [...(byRef.get(b.refId) ?? []), b.memberId])
  }
  return [...byRef.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([refId, memberIds]) => ({ refId, memberIds }))
}

/** Bind the whole roster. */
export function bindTeamVoices(
  env: Record<string, string | undefined> = process.env,
  team: TeamMember[] = SALES_TEAM,
): VoiceBinding[] {
  return team.map((m) => resolveVoice(m, env))
}

/**
 * The member ids whose VOICE clears them for a live call: curated, and not
 * shared with anyone else. Employment and training are separate gates in
 * visual-sales-team.ts — all three must pass before a member dials.
 */
export function callReadyVoices(bindings: VoiceBinding[]): string[] {
  const colliding = new Set(voiceCollisions(bindings).flatMap((c) => c.memberIds))
  return bindings.filter((b) => voiceAllowsCalls(b) && !colliding.has(b.memberId)).map((b) => b.memberId)
}

/**
 * What an operator must set to put the whole roster on the phone — the exact
 * variable names, so a settings screen can say "set this" instead of "voice
 * unavailable". Ordered by member so the list reads like the roster.
 */
export function missingVoiceKeys(
  env: Record<string, string | undefined> = process.env,
  team: TeamMember[] = SALES_TEAM,
): Array<{ memberId: string; suggestedKey: string }> {
  return team
    .filter((m) => resolveVoice(m, env).quality === 'fallback')
    .map((m) => ({ memberId: m.id, suggestedKey: voiceKeysFor(m)[0] }))
}

// ─────────────────────────────────────────────────────────────────────────────
// THE CALLING PROVIDER'S OWN HANDLE.
//
// The block above resolves a Fish Audio VOICE — the reference the form and the
// chat speak with. A live phone call goes through a different seam
// (lib/calling/provider.ts) whose unit is an AGENT: a provider-side object that
// already carries a voice plus its conversational configuration. The two are
// not interchangeable, and pretending they were would put a voice id in a field
// the provider reads as an agent id and fail at dial time.
//
// This is the addition the VoiceProvider type was left explicit for: "a second
// one is an addition, never a silent swap".
//
// ONE AGENT PER MEMBER, OR NO CALL. The connection carries a single default
// agent, and until now every call in the product went out as that one agent —
// so Sara, Saeed and Hessa all reached the buyer in the same voice, which is
// the fixed-voice promise broken at the only place it is audible. There is
// deliberately no language-level fallback here (unlike the voice block above):
// a shared agent is exactly the failure, so an unset member has no agent and
// the caller refuses rather than dialling as somebody else.
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentBinding {
  memberId: string
  /** The provider's agent id. Empty when nothing is configured for this member. */
  agentId: string
  sourceKey: string | null
}

/** The one key that can give a member their own agent. */
export function agentKeyFor(member: TeamMember): string {
  return `CALL_AGENT_MEMBER_${member.id.toUpperCase().replace(/-/g, '_')}`
}

/** Resolve one member's provider agent. Pure apart from the env read. */
export function resolveCallAgent(
  member: TeamMember,
  env: Record<string, string | undefined> = process.env,
): AgentBinding {
  const key = agentKeyFor(member)
  const value = (env[key] || '').trim()
  return value
    ? { memberId: member.id, agentId: value, sourceKey: key }
    : { memberId: member.id, agentId: '', sourceKey: null }
}

/** Bind the whole roster's agents. */
export function bindTeamAgents(
  env: Record<string, string | undefined> = process.env,
  team: TeamMember[] = SALES_TEAM,
): AgentBinding[] {
  return team.map((m) => resolveCallAgent(m, env))
}

/**
 * Two members pointed at ONE provider agent. Same failure as a shared voice and
 * reported the same way, because on a call it is the same thing the lead hears.
 */
export function agentCollisions(bindings: AgentBinding[]): VoiceCollision[] {
  const byAgent = new Map<string, string[]>()
  for (const b of bindings) {
    if (!b.agentId) continue
    byAgent.set(b.agentId, [...(byAgent.get(b.agentId) ?? []), b.memberId])
  }
  return [...byAgent.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([refId, memberIds]) => ({ refId, memberIds }))
}

/** Members whose provider agent is set and unshared — the ones a dialler may
 *  actually speak as. */
export function agentReadyMembers(bindings: AgentBinding[]): string[] {
  const colliding = new Set(agentCollisions(bindings).flatMap((c) => c.memberIds))
  return bindings.filter((b) => b.agentId && !colliding.has(b.memberId)).map((b) => b.memberId)
}
