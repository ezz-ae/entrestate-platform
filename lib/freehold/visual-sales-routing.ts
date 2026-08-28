/**
 * VISUAL SALES ROUTING — which member answers this lead, and how hard they lead.
 *
 * A Leadform can put a whole Visual Sales Team on the floor (visual-sales-team.ts).
 * This module decides, per conversation, WHICH member steps forward and how much
 * of the talking they take. The operator writes the rules ("if it's a woman, put
 * Saeed on it"; "anyone not from Dubai, keep them with me on a call"), or leaves
 * it DYNAMIC and lets the default member run.
 *
 * ── The one boundary that makes this safe ──────────────────────────────────
 * The inputs here are inferred, live, conversational signals — a sense of the
 * person forming from how they talk and what the browser already knows. Using
 * them to pick WHO greets a lead who has already arrived is rapport: a normal
 * sales-floor call ("put the Arabic speaker on this one"). Using them to pick
 * WHO is allowed to SEE an ad is the thing this platform refuses — origin is
 * not a Meta field, only a wrong-at-the-edges proxy stack (see
 * audience-pattern.ts, and the CLAUDE.md rule it enforces).
 *
 * So this module keeps the two apart STRUCTURALLY, not by good intentions:
 *   · It imports nothing from the Meta ad layer and builds no ad-targeting
 *     object. Routing signals physically cannot become ad targeting from here.
 *   · A RoutingDecision carries the CHOSEN MEMBER and nothing about the person —
 *     no gender, no age, no origin travels out of the decision, so a downstream
 *     caller can't forward a demographic it "found" here.
 *   · Unknown is unknown. A rule that needs a signal we don't have does NOT fire
 *     on a guess — it falls through. We never invent the person to match a rule.
 * The guard suite asserts all three.
 *
 * Natural-language rule specs ("if the client is a woman…") are compiled to the
 * structured RoutingRule[] below by the coordinator (agent-router.ts) at author
 * time; THIS module validates and executes them deterministically. LLM composes,
 * the core decides — the same split the rest of the platform uses.
 *
 * Pure. No DB, no network, no ad layer.
 */
import { MASTER_SYSTEM_PROMPT, autonomyGuidance, type AutonomyLevel } from '@/lib/freehold/agent-router'
import { AI_DISCLOSURE, NOTE_LIABILITY, type TeamMember } from '@/lib/freehold/visual-sales-team'

export type AgeBand = 'u30' | '30-50' | 'o50'
export type Experience = 'low' | 'mid' | 'high'

/**
 * What the system may sense about a lead mid-conversation. EVERY field is
 * optional and every field is a RAPPORT input, never an ad target. Absent means
 * unknown, and unknown never guesses (see the boundary note above).
 */
export interface ConversationSignals {
  /** Presented gender, as inferred from the conversation — for rapport routing. */
  gender?: 'f' | 'm'
  ageBand?: AgeBand
  /** BCP-47-ish short code the lead is writing/speaking in. Language is honest. */
  language?: string
  /** Whether the lead reads as based in Dubai. */
  fromDubai?: boolean
  /** Real-estate experience, sensed from how they talk about buying. */
  experience?: Experience
  /** Free behaviour tags observed (e.g. 'browsed-3-projects', 'asked-yield'). */
  behaviours?: string[]
}

/** The condition half of a rule. Every specified facet must match; unspecified
 *  facets are wildcards; a specified facet whose signal is UNKNOWN does not
 *  match (no guessing). */
export interface SignalMatch {
  gender?: 'f' | 'm'
  ageBand?: AgeBand | AgeBand[]
  language?: string | string[]
  fromDubai?: boolean
  experience?: Experience | Experience[]
  /** Matches when ANY of these behaviour tags is present on the signals. */
  behaviourAny?: string[]
}

export interface RoutingRule {
  id: string
  when: SignalMatch
  route: {
    memberId: string
    /** Share of voice, 0..1 — "استحواذ على الكلام": how much this member leads
     *  versus listens. 0.2 is a light touch; 0.8 takes the wheel. Clamped. */
    acquisition: number
  }
  /** Optional human note the operator wrote — surfaced back, never invented. */
  reason?: string
}

/**
 * The output. Deliberately small: the member to run, how hard they lead, the
 * rule that decided (or null for the dynamic default), and a readable reason.
 * NOTHING about the person is in here — that is the boundary, expressed as a type.
 */
export interface RoutingDecision {
  memberId: string
  acquisition: number
  matchedRuleId: string | null
  reason: string
}

export interface RouteOptions {
  /** The member that runs when no rule matches — the DYNAMIC default. */
  defaultMemberId: string
  /** Acquisition for the dynamic default (clamped). Defaults to 0.5. */
  defaultAcquisition?: number
  /** If given, only these member ids may be routed to (e.g. the ones this
   *  account has actually hired). A rule pointing elsewhere is SKIPPED, not
   *  obeyed — a decision must always name someone who can really answer. */
  availableIds?: string[]
}

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)

const inList = <T>(v: T | undefined, spec: T | T[] | undefined): boolean => {
  if (spec === undefined) return true          // facet not required → wildcard
  if (v === undefined) return false             // required but unknown → no guess
  return Array.isArray(spec) ? spec.includes(v) : v === spec
}

/** Does a rule's condition hold for these signals? Every specified facet must
 *  hold; unknown-but-required fails closed. Pure and total. */
export function matches(when: SignalMatch, s: ConversationSignals): boolean {
  if (!inList(s.gender, when.gender)) return false
  if (!inList(s.ageBand, when.ageBand)) return false
  if (!inList(s.language, when.language)) return false
  if (when.fromDubai !== undefined) {
    if (s.fromDubai === undefined || s.fromDubai !== when.fromDubai) return false
  }
  if (!inList(s.experience, when.experience)) return false
  if (when.behaviourAny && when.behaviourAny.length > 0) {
    const have = new Set(s.behaviours ?? [])
    if (!when.behaviourAny.some((b) => have.has(b))) return false
  }
  return true
}

/**
 * Pick the member. First rule (in order) whose condition holds and whose member
 * is available wins; otherwise the dynamic default. Order is the operator's
 * priority — the most specific rules go first, by their choice.
 */
export function route(signals: ConversationSignals, rules: RoutingRule[], opts: RouteOptions): RoutingDecision {
  const allowed = opts.availableIds ? new Set(opts.availableIds) : null
  for (const rule of rules) {
    if (allowed && !allowed.has(rule.route.memberId)) continue
    if (matches(rule.when, signals)) {
      return {
        memberId: rule.route.memberId,
        acquisition: clamp01(rule.route.acquisition),
        matchedRuleId: rule.id,
        reason: rule.reason?.trim() || `Matched rule "${rule.id}".`,
      }
    }
  }
  return {
    memberId: opts.defaultMemberId,
    acquisition: clamp01(opts.defaultAcquisition ?? 0.5),
    matchedRuleId: null,
    reason: 'No rule matched — running the account default (dynamic).',
  }
}

export interface RuleProblem {
  ruleId: string
  problem: string
}

/**
 * Validate authored rules before they run: every rule must point at a KNOWN
 * member and carry an in-range acquisition. A rule that routes to a member the
 * account never hired is a silent dead end — better a loud rejection at author
 * time than a lead handed to no one.
 */
export function validateRules(rules: RoutingRule[], knownMemberIds: string[]): RuleProblem[] {
  const known = new Set(knownMemberIds)
  const seen = new Set<string>()
  const problems: RuleProblem[] = []
  for (const r of rules) {
    if (seen.has(r.id)) problems.push({ ruleId: r.id, problem: 'duplicate rule id' })
    seen.add(r.id)
    if (!known.has(r.route.memberId)) {
      problems.push({ ruleId: r.id, problem: `routes to unknown member "${r.route.memberId}"` })
    }
    if (!Number.isFinite(r.route.acquisition) || r.route.acquisition < 0 || r.route.acquisition > 1) {
      problems.push({ ruleId: r.id, problem: `acquisition ${r.route.acquisition} is outside 0..1` })
    }
  }
  return problems
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT COMPOSITION — reuse the coordinator brain, don't fork it.
// ─────────────────────────────────────────────────────────────────────────────

export interface PromptContext {
  /** The hiring company's name — fills the transparency line. */
  company: string
  /** Server-set autonomy (1 advisory · 2 semi · 3 autopilot). Defaults to 1. */
  autonomy?: AutonomyLevel
  /** How hard this member leads this conversation (from the RoutingDecision). */
  acquisition?: number
  /** Knowledge already retrieved for this turn (account Note + market grounding).
   *  Passed in — this module never fetches. */
  groundingNote?: string
}

/** Map share-of-voice to one plain instruction. */
function acquisitionTone(a: number): string {
  if (a <= 0.34) return 'Let the lead lead. Short, warm, mostly listening — one gentle question at a time.'
  if (a <= 0.66) return 'Balanced: guide the conversation a step at a time, and always move it one notch toward a viewing or a call.'
  return 'Take the wheel. Drive assertively toward the booking — never rude, never pushy past a clear no.'
}

/**
 * Build the system prompt for one member on one turn. It STARTS from the
 * coordinator's MASTER_SYSTEM_PROMPT (same grounding-and-evidence brain the
 * whole platform runs on), then layers this member's voice, skills, the
 * transparency line, the Note-liability line, the lead-hardness, the autonomy
 * policy, and whatever grounding was retrieved for the turn. It authors no facts
 * of its own.
 */
export function memberSystemPrompt(member: TeamMember, ctx: PromptContext): string {
  const disclosure = AI_DISCLOSURE.replace('{company}', ctx.company || 'this company')
  const parts = [
    MASTER_SYSTEM_PROMPT,
    `\nYOU ARE ${member.name.toUpperCase()} — an AI salesperson on ${ctx.company || 'the company'}'s Visual Sales Team, answering leads inside a Leadform.`,
    `CHARACTER: ${member.brief}`,
    `VOICE: ${member.dialect}, fixed and steady. Languages: ${member.languages.join(', ')}.`,
    `SKILLS (what you were taught — never a claim to be a real person): ${member.topSkills.map((s) => `${s.skill} (${s.rate}%)`).join(', ')}.`,
    `SHARE OF VOICE: ${acquisitionTone(ctx.acquisition ?? 0.5)}`,
    `TRANSPARENCY: ${disclosure}`,
    `RESPONSIBILITY: ${NOTE_LIABILITY}`,
    ctx.groundingNote
      ? `WHAT YOU KNOW FOR THIS LEAD (ground every specific in this — invent nothing):\n${ctx.groundingNote}`
      : `WHAT YOU KNOW: nothing has been retrieved for this lead yet — ask, don't invent.`,
    autonomyGuidance(ctx.autonomy ?? 1),
  ]
  return parts.join('\n').trim()
}

/**
 * The signals above are CONVERSATION-ONLY. This constant exists so the intent is
 * greppable and the guard can point at it: nothing in this file may turn a lead
 * signal into an audience/targeting object. Rapport in, never a target out.
 */
export const SIGNALS_ARE_CONVERSATION_ONLY = true as const
