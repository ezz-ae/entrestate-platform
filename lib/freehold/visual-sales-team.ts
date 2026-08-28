/**
 * THE VISUAL SALES TEAM — the salespeople a Leadform puts on the floor.
 *
 * A Leadform is a form that talks back, and the thing doing the talking is a
 * TEAM MEMBER: a named salesperson with a fixed voice, a hiring card, a price,
 * and a training level. The account owner picks one (or lets the rules pick —
 * see visual-sales-routing.ts), and once they pay for it they have not "enabled
 * a feature", they have HIRED someone onto their Visual Sales Team. That framing
 * is the product, so it is the data model too.
 *
 * THE HIRING CARD. Every member wears one, and the operator hires by reading it:
 * name, title, years of experience, the industries it knows, and its TOP THREE
 * rated skills. The three skill rates roll up into one headline number — the
 * member's TOTAL RATE — so the operator can SEARCH the team the way you'd search
 * a staffing agency: "an agent ≥ 88, strong in product-mastery, who speaks
 * French". The headline is the COMPOSITE (the average of the three rates), kept
 * on a 0–100 scale on purpose: a raw sum would run past 100 and stop meaning
 * "how good, as a percentage", which is the only thing a search like "≥ 88"
 * reads cleanly. One number to compare members by; the three skills underneath
 * are what a per-skill search filters on.
 *
 * Why this is a separate word from `persona`. `persona-audience.ts` already
 * owns "persona" — there it means a Meta AUDIENCE recipe ("doctors in the UAE"):
 * WHO an ad reaches. A team member is the opposite end of the funnel: WHO
 * answers the lead once they arrive. Same repo, two different people-shaped
 * nouns, kept apart on purpose so neither drifts into the other.
 *
 * Four rules carry their why in the fields below, because each one is a place a
 * future edit will "simplify" and quietly break the product:
 *
 *   1. VOICES ARE FIXED and stable. This is a call, not a chat. A caller trusts
 *      a steady voice; a voice that changes between turns is the tell that
 *      there is no one there. A member's voice id never changes across its life
 *      — swap it and you have a new member, not a new setting.
 *   2. CLONE SKILLS, NEVER IDENTITY OR VOICE. A premium "clone" copies a
 *      CAPABILITY sourced from studied material — persuasion craft, category
 *      product depth — and never claims to be a real person or imitates their
 *      voice. Right of publicity is not a detail; the two clone flags are
 *      always false and the guard proves it.
 *   3. CALLS NEED EMPLOYMENT. An ad-token member appears in minutes and is the
 *      hook, but it cannot take calls: the moment a model steps off the account
 *      Note it goes offline. A callable member is on payroll
 *      (weekly/monthly/yearly), which is what keeps it online and learning.
 *   4. READINESS IS EARNED. A member trains up to READINESS_THRESHOLD before it
 *      may take live calls. A half-taught salesperson on a call burns a real
 *      lead, so the gate is a number, not a vibe.
 *
 * Pure data + pure helpers. No DB, no network — the employment records, the
 * per-account trained level, and the wallet all layer on top of this later.
 */

export type MemberTier = 'standard' | 'premium'

/**
 * Dialect / voice colour — a RAPPORT attribute so the member sounds like
 * someone the lead would actually talk to. It is NOT nationality targeting: it
 * colours how a member ALREADY talking to a lead sounds, never who is allowed
 * to see the form. The hard line ("narrow by language and behaviour, never
 * origin") lives in audience-pattern.ts and is re-asserted for routing in
 * visual-sales-routing.ts.
 */
export type MemberDialect = 'gulf' | 'levantine' | 'egyptian' | 'maghrebi' | 'neutral-ar' | 'english'

/**
 * SKILLS, not identities. Every skill is a capability the member was taught;
 * none of them is "be a specific famous person". This is the honest half of the
 * clone idea — you can give a member a top closer's *craft* without giving it a
 * real closer's *name or voice*.
 */
export type SkillId =
  | 'warm-open'        // first-touch warmth; turns a form into a hello
  | 'product-mastery'  // deep project / payment-plan grounding (from the account Note)
  | 'market-facts'     // live area / price / yield grounding (Hex's llm_context)
  | 'data-extraction'  // pulls the real need out — qualifying without an interrogation
  | 'objection-ease'   // humour + de-escalation; keeps a wary lead talking
  | 'persuasion-craft' // premium: structured persuasion learned from published craft, not a person
  | 'call-handoff'     // knows the moment to stop typing and convert to a call (kloom)

/** One of a member's top-three skills and how good they are at it (0–100). The
 *  three rates roll up into the member's headline totalRate (their average). */
export interface RatedSkill {
  skill: SkillId
  rate: number
}

/** Exactly how many rated skills sit on a hiring card. Three is the shortlist a
 *  buyer actually reads; a longer list is a CV nobody finishes. */
export const TOP_SKILLS = 3

/**
 * Which model powers the member. Premium tiers cost more and gate to premium
 * accounts. The model is SEPARATE from the voice — a premium brain can drive a
 * standard-priced voice and vice versa — and unlike the voice it can be swapped.
 */
export type ModelId = 'std-fast' | 'std-deep' | 'claude-fable-5'

export interface MemberPrice {
  /** Default list economics in AED. These are CATALOG defaults; the real
   *  operator-facing price list lives with pricing/wallet. Each figure is the
   *  price FOR that hire period, so a longer commitment is cheaper per month —
   *  the ladder (monthly < 4×weekly, yearly < 12×monthly) is asserted by the
   *  guard so a careless edit can't invert the discount. */
  weekly: number
  monthly: number
  yearly: number
  /** Hours beyond the contracted weekly hours. */
  overtimeHourly: number
  /** Ads-only hourly token — the hook: no employment, live in ~15 minutes, but
   *  it cannot take calls (see callsRequireEmployment). */
  adHourly: number
}

export interface TeamMember {
  id: string
  name: string
  /** Job title on the hiring card — what this member is, in one role. */
  title: string
  /** Years of experience the member presents — a search and trust facet. */
  yearsExperience: number
  /** The industries this member knows. The horizontal switch: a member can be a
   *  real-estate consultant or an automotive one — the search is by industry. */
  industries: string[]
  /** The one line an operator reads when choosing — the member's brief. */
  brief: string
  tier: MemberTier
  model: ModelId
  dialect: MemberDialect
  /** Languages the member actually converses in — a real, honest signal
   *  (language is a Meta field and a true rapport fact; origin is neither). */
  languages: string[]
  /** Presentation, used ONLY for conversational rapport routing — never a Meta
   *  gender target (that is persona-audience.ts, a different layer). */
  presents: 'f' | 'm'
  /** The top-three rated skills. Their average is the member's totalRate; a
   *  search filters on the total AND on any single skill's rate. */
  topSkills: RatedSkill[]
  /** Where each skill's competence is SOURCED — capability, never identity.
   *  Kept as plain provenance so "clone the skills, not the person" stays legible. */
  skillSources: string[]
  /** Always false. A member never claims a real person's identity … */
  identityClone: false
  /** … and never imitates a real person's voice. Both proven by the guard. */
  voiceClone: false
  /** THE VOICE IS FIXED. High stability on purpose: sales on a call, not a chat. */
  voice: { id: string; stability: number }
  /** Starting competence 0–100. Must be trained to READINESS_THRESHOLD before
   *  live calls — training raises the opportunity ratio. */
  baseLevel: number
  /** Calls need EMPLOYMENT (a hired, always-online member). Always true; the
   *  guard proves no member pretends to take calls without being employed. */
  callsRequireEmployment: true
  /** Contracted hours per week for an employed hire (overtime is billed above this). */
  weeklyHours: number
  price: MemberPrice
}

/**
 * A voice must be at least this stable to ship. Below this a voice audibly
 * wobbles between turns, which on a call reads as "no one is really there" —
 * the one impression a sales voice cannot afford. Chosen high, held high.
 */
export const VOICE_STABILITY_MIN = 0.85

/**
 * Train-to-live gate. A member under this level may practise and answer chat,
 * but may not take live CALLS: an under-taught member on the phone spends a real
 * lead. The number is the same 85% the operator trains toward so the
 * opportunity ratio climbs before the member ever dials.
 */
export const READINESS_THRESHOLD = 85

/**
 * The transparency line — law and marketing at once. If a lead ever asks who
 * they are talking to, the member says it is an AI salesperson on the account's
 * company's Visual Sales Team, and offers "report an issue" and "delete my
 * data". (This is the "who's this? — Ali is an AI hired by X" card, and it
 * doubles as the product's own advertising.)
 */
export const AI_DISCLOSURE =
  "If a lead asks who they're speaking to, disclose plainly: you are an AI salesperson on {company}'s Visual Sales Team. Offer 'report an issue' and 'delete my data'. Never pretend to be a specific real person."

/**
 * The liability line, stated once so it is never argued from scratch: anything
 * the client wrote INSIDE the account Note is the client's responsibility;
 * anything the model says from OUTSIDE the Note is ours. Employment is what
 * keeps active learning inside the Note.
 */
export const NOTE_LIABILITY =
  "Inside the account Note = the client's words, the client's responsibility. Outside the Note = the model's words, our responsibility. Stay inside the Note."

// ─────────────────────────────────────────────────────────────────────────────
// THE TEAM. Four starters the operator will recognise, plus two premium members
// that show the honest shape of a "clone": craft copied, person not.
// ─────────────────────────────────────────────────────────────────────────────

export const SALES_TEAM: TeamMember[] = [
  {
    id: 'sara',
    name: 'Sara',
    title: 'Lead Concierge',
    yearsExperience: 6,
    industries: ['real-estate', 'hospitality'],
    brief: 'Warm Moroccan opener — turns a cold form into a conversation and pulls the real need out gently.',
    tier: 'standard',
    model: 'std-fast',
    dialect: 'maghrebi',
    languages: ['ar', 'fr', 'en'],
    presents: 'f',
    topSkills: [
      { skill: 'warm-open', rate: 88 },
      { skill: 'data-extraction', rate: 80 },
      { skill: 'objection-ease', rate: 72 },
    ],
    skillSources: ['hospitality-grade rapport training', 'consultative qualification scripts'],
    identityClone: false,
    voiceClone: false,
    voice: { id: 'voice_sara_maghrebi', stability: 0.9 },
    baseLevel: 72,
    callsRequireEmployment: true,
    weeklyHours: 40,
    price: { weekly: 500, monthly: 1500, yearly: 15000, overtimeHourly: 20, adHourly: 12 },
  },
  {
    id: 'saeed',
    name: 'Saeed',
    title: 'Senior Property Consultant',
    yearsExperience: 11,
    industries: ['real-estate', 'off-plan', 'investment'],
    brief: 'Emirati product authority — knows the building, the payment plan and the yield cold.',
    tier: 'standard',
    model: 'std-deep',
    dialect: 'gulf',
    languages: ['ar', 'en'],
    presents: 'm',
    topSkills: [
      { skill: 'product-mastery', rate: 91 },
      { skill: 'market-facts', rate: 86 },
      { skill: 'data-extraction', rate: 74 },
    ],
    skillSources: ['project & payment-plan mastery from the account Note', 'market-data grounding'],
    identityClone: false,
    voiceClone: false,
    voice: { id: 'voice_saeed_gulf', stability: 0.92 },
    baseLevel: 78,
    callsRequireEmployment: true,
    weeklyHours: 40,
    price: { weekly: 560, monthly: 1700, yearly: 16800, overtimeHourly: 24, adHourly: 14 },
  },
  {
    id: 'hessa',
    name: 'Hessa',
    title: 'Qualification Specialist',
    yearsExperience: 8,
    industries: ['real-estate', 'mortgage'],
    brief: 'Gentle but relentless — makes qualifying feel like care, and knows exactly when to bring a human on.',
    tier: 'standard',
    model: 'std-deep',
    dialect: 'gulf',
    languages: ['ar', 'en'],
    presents: 'f',
    topSkills: [
      { skill: 'data-extraction', rate: 90 },
      { skill: 'warm-open', rate: 82 },
      { skill: 'call-handoff', rate: 80 },
    ],
    skillSources: ['consultative qualification', 'handoff-timing judgement'],
    identityClone: false,
    voiceClone: false,
    voice: { id: 'voice_hessa_gulf', stability: 0.93 },
    baseLevel: 80,
    callsRequireEmployment: true,
    weeklyHours: 40,
    price: { weekly: 560, monthly: 1700, yearly: 16800, overtimeHourly: 24, adHourly: 14 },
  },
  {
    id: 'wael',
    name: 'Wael',
    title: 'Relationship Rep',
    yearsExperience: 7,
    industries: ['real-estate', 'brokerage'],
    brief: 'Light Egyptian charm — eases objections with humour and keeps a wary lead talking.',
    tier: 'standard',
    model: 'std-fast',
    dialect: 'egyptian',
    languages: ['ar', 'en'],
    presents: 'm',
    topSkills: [
      { skill: 'objection-ease', rate: 88 },
      { skill: 'warm-open', rate: 84 },
      { skill: 'data-extraction', rate: 70 },
    ],
    skillSources: ['objection-handling drills', 'rapport & humour calibration'],
    identityClone: false,
    voiceClone: false,
    voice: { id: 'voice_wael_egyptian', stability: 0.9 },
    baseLevel: 74,
    callsRequireEmployment: true,
    weeklyHours: 40,
    price: { weekly: 500, monthly: 1500, yearly: 15000, overtimeHourly: 20, adHourly: 12 },
  },

  // ── Premium: the clone done honestly — craft copied, person not ──
  {
    id: 'closer',
    name: 'The Closer',
    title: 'Closing Specialist',
    yearsExperience: 14,
    industries: ['real-estate', 'luxury', 'investment'],
    brief: 'Premium closer — persuasion craft learned from the published literature, never a borrowed name or voice.',
    tier: 'premium',
    model: 'claude-fable-5',
    dialect: 'neutral-ar',
    languages: ['ar', 'en'],
    presents: 'm',
    topSkills: [
      { skill: 'persuasion-craft', rate: 94 },
      { skill: 'call-handoff', rate: 88 },
      { skill: 'product-mastery', rate: 85 },
    ],
    // The honest shape of a "Belfort clone": the SKILLS of persuasion, sourced
    // from published craft — not the identity, not the voice, of any real person.
    skillSources: ['published persuasion & negotiation craft (skills only — no real individual imitated)'],
    identityClone: false,
    voiceClone: false,
    voice: { id: 'voice_closer_neutral', stability: 0.95 },
    baseLevel: 84,
    callsRequireEmployment: true,
    weeklyHours: 40,
    price: { weekly: 1400, monthly: 4200, yearly: 42000, overtimeHourly: 60, adHourly: 35 },
  },
  {
    id: 'authority',
    name: 'Product Authority',
    title: 'Product Authority',
    yearsExperience: 15,
    industries: ['real-estate', 'automotive', 'luxury'],
    brief: 'Category-leader product depth — masters the product like a top exec would, without ever claiming to be one.',
    tier: 'premium',
    model: 'claude-fable-5',
    dialect: 'gulf',
    languages: ['ar', 'en'],
    presents: 'f',
    // The car example, made safe: knowledge equal to a category leader's, with
    // the identity claim removed. It can know what a Mercedes CEO knows; it will
    // never say it is one.
    topSkills: [
      { skill: 'product-mastery', rate: 95 },
      { skill: 'market-facts', rate: 90 },
      { skill: 'data-extraction', rate: 84 },
    ],
    skillSources: ['category-leader product depth (capability sourced; identity never claimed)'],
    identityClone: false,
    voiceClone: false,
    voice: { id: 'voice_authority_gulf', stability: 0.94 },
    baseLevel: 85,
    callsRequireEmployment: true,
    weeklyHours: 40,
    price: { weekly: 1400, monthly: 4200, yearly: 42000, overtimeHourly: 60, adHourly: 35 },
  },
]

export const memberIds = (): string[] => SALES_TEAM.map((m) => m.id)
export const getMember = (id: string): TeamMember | undefined => SALES_TEAM.find((m) => m.id === id)
export const standardTeam = (): TeamMember[] => SALES_TEAM.filter((m) => m.tier === 'standard')
export const premiumTeam = (): TeamMember[] => SALES_TEAM.filter((m) => m.tier === 'premium')
export const memberSkills = (m: TeamMember): SkillId[] => m.topSkills.map((s) => s.skill)

/**
 * The headline rate on the hiring card — the COMPOSITE of the member's top-three
 * skill rates, kept on a 0–100 scale (their average, rounded). One number to
 * compare members by and to search with ("≥ 88"); the three skills underneath
 * are what a per-skill search filters on.
 */
export function totalRate(m: TeamMember): number {
  if (!m.topSkills.length) return 0
  return Math.round(m.topSkills.reduce((sum, s) => sum + s.rate, 0) / m.topSkills.length)
}

/** How an operator searches the team, staffing-agency style. Every facet is
 *  optional and ANDed: give the ones you care about, ignore the rest. */
export interface MemberSearch {
  /** Minimum headline rate (totalRate) — "an agent ≥ 88". */
  minTotal?: number
  /** A skill the member must have in its top three … */
  skill?: SkillId
  /** … at least this good (0–100). Defaults to 1 — "has the skill at all". */
  minSkillRate?: number
  /** Speaks in this dialect. */
  dialect?: MemberDialect
  /** Converses in this language code. */
  language?: string
  /** Knows this industry. */
  industry?: string
  tier?: MemberTier
}

/** Search the team. Members matching EVERY supplied facet, in roster order. */
export function searchTeam(q: MemberSearch): TeamMember[] {
  return SALES_TEAM.filter((m) => {
    if (q.minTotal !== undefined && totalRate(m) < q.minTotal) return false
    if (q.skill !== undefined) {
      const hit = m.topSkills.find((s) => s.skill === q.skill)
      if (!hit) return false
      if (hit.rate < (q.minSkillRate ?? 1)) return false
    }
    if (q.dialect !== undefined && m.dialect !== q.dialect) return false
    if (q.language !== undefined && !m.languages.includes(q.language)) return false
    if (q.industry !== undefined && !m.industries.includes(q.industry)) return false
    if (q.tier !== undefined && m.tier !== q.tier) return false
    return true
  })
}

/** Can this member take a LIVE CALL right now, given its trained level and
 *  whether it is employed? Both gates in one honest predicate: readiness is
 *  earned (>= threshold) AND calls need employment. Ad-token hires answer forms,
 *  never phones. */
export function canTakeCalls(member: TeamMember, trainedLevel: number, employed: boolean): boolean {
  return employed && trainedLevel >= READINESS_THRESHOLD
}
