/**
 * ONESTATE — WHAT THE GAME DECIDES, AND HOW IT SURVIVES THE ROUND TRIP.
 *
 * The picking is not a survey somebody reads afterwards. It is the
 * provisioning: the level a person puts on a tool is the amount of their own
 * money and name the machine may spend without asking them first, and this
 * module is where that number stops being a number and becomes a setting.
 *
 * THE ONE RULE THIS FILE EXISTS TO KEEP. `capFor` never returns a level higher
 * than the person's own evidence supports, whatever they slid the dial to.
 * Somebody who has just told us they have never run an ad can drag Google Ads
 * to ten out of enthusiasm; handing them a machine that moves budget on its
 * own is how a first month becomes a refund and a story. So the dial is a
 * ceiling they choose and `capFor` is a second ceiling the evidence chooses,
 * and the lower one wins. It is written down here rather than in a screen
 * because a screen can be redesigned by somebody who never read this comment.
 *
 * WHY A COOKIE. The account is born in the Terminal — one identity, the rule
 * in app/signup/page.tsx — and the Terminal's `next` parameter takes relative
 * paths only, so nothing can be carried across in the URL. app/signup/start
 * already proved the shape with the plan cookie; this is the same trick with a
 * bigger payload, and the same thirty minutes, because an abandoned game
 * should not colour a workspace created next week.
 */

import { DEFAULT_LEVEL, TOOLS, type Profile } from './deck'

/** The cookie the game's answers ride home in. */
export const ONESTATE_COOKIE = 'es_onestate'

/** Long enough to sign up, short enough that a stale game never provisions. */
export const ONESTATE_COOKIE_MAX_AGE = 30 * 60

/**
 * A cookie has about 4KB and every request afterwards carries it, so the
 * payload is trimmed hard: the game's own bookkeeping never travels, only what
 * provisioning reads. The cap is enforced rather than hoped for — `encode`
 * drops the least load-bearing parts before it drops the cookie.
 */
export const ONESTATE_MAX_BYTES = 3500

/** What survives the trip. Keys are short because every byte is a byte. */
export type KeptProfile = {
  /** first name, as typed — the only personal thing here */
  n?: string
  /** company name, as typed */
  c?: string
  /** tool id → level 0…10 */
  t: Record<string, number>
  /** tool ids answered "not now" */
  l: string[]
  /** areas named */
  a: string[]
  /** developers named */
  d: string[]
  /** warm tags, without their warmth — provisioning asks "did they" not "how much" */
  w: string[]
}

export function keep(profile: Profile, name: string, company: string): KeptProfile {
  return {
    n: name.slice(0, 60) || undefined,
    c: company.slice(0, 80) || undefined,
    t: profile.tools,
    l: profile.later,
    a: profile.areas.slice(0, 12),
    d: profile.devs.slice(0, 12),
    w: Object.keys(profile.warmth).slice(0, 40),
  }
}

export function encode(kept: KeptProfile): string | null {
  let value = kept
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const packed = Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
    if (packed.length <= ONESTATE_MAX_BYTES) return packed
    // Shed the parts a workspace can live without, in order of how little they
    // decide: the loose tags first, then the named lists.
    value =
      attempt === 0
        ? { ...value, w: value.w.slice(0, 12) }
        : { ...value, a: value.a.slice(0, 4), d: value.d.slice(0, 4), w: [] }
  }
  return null
}

export function decode(raw: string | undefined | null): KeptProfile | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const p = parsed as Partial<KeptProfile>
    // Everything is re-checked. This value came back from a browser, and a
    // browser is a place other people can write.
    return {
      n: typeof p.n === 'string' ? p.n.slice(0, 60) : undefined,
      c: typeof p.c === 'string' ? p.c.slice(0, 80) : undefined,
      t: sanitiseLevels(p.t),
      l: sanitiseIds(p.l),
      a: sanitiseStrings(p.a),
      d: sanitiseStrings(p.d),
      w: sanitiseStrings(p.w),
    }
  } catch {
    return null
  }
}

const TOOL_IDS = new Set(TOOLS.map((t) => t.id))

function sanitiseLevels(value: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (!value || typeof value !== 'object') return out
  for (const [id, level] of Object.entries(value as Record<string, unknown>)) {
    if (!TOOL_IDS.has(id)) continue
    const n = Number(level)
    if (!Number.isFinite(n)) continue
    out[id] = Math.max(0, Math.min(10, Math.round(n)))
  }
  return out
}

function sanitiseIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string' && TOOL_IDS.has(v)).slice(0, TOOLS.length)
}

function sanitiseStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((v): v is string => typeof v === 'string' && v.length > 0 && v.length <= 40)
    .slice(0, 40)
}

/* ── the ceiling the evidence sets ─────────────────────────────────────── */

/**
 * What the answers, not the dial, say this person can be handed today.
 *
 * Reading it: an ads tool can only run on its own for somebody who already
 * runs ads — never for a person who has just said they never have. Anything
 * that writes to the outside world (a page published, a portal updated, a
 * reply sent in your name) is held at "it drafts" for a desk of one, because
 * there is nobody there to catch it. Reading tools have no ceiling at all:
 * scoring a listing or writing a report spends nothing and says nothing to
 * anybody.
 */
export function capFor(toolId: string, w: Set<string>): number {
  const solo = w.has('solo')
  const staffed = w.has('marketer') || w.has('big') || w.has('lister')

  switch (toolId) {
    case 'google-ads':
    case 'meta-ads':
    case 'audiences': {
      if (w.has('noads') && !w.has('spending')) return 3 // never run one: it drafts, and we press go together
      if (w.has('budget-l') || staffed) return 10
      if (w.has('spending')) return 8
      return 5
    }
    case 'whatsapp':
    case 'leadformer':
      // It answers a stranger in the company's name. A person on their own
      // should see what went out before it goes out.
      return solo ? 5 : 8
    case 'pages':
    case 'portals':
      return solo ? 5 : 10
    case 'crm':
    case 'scoring':
    case 'report':
      return 10
    default:
      return 8
  }
}

export type Provisioned = {
  id: string
  /** What the tool was given, after the evidence ceiling. */
  level: number
  /** The level the person asked for, when it was higher than they can be given. */
  asked?: number
  /** Why it was held, in words a person can be shown. */
  held?: string
}

/**
 * The setup, decided. `now` is what the workspace switches on and how far each
 * one may go; `later` is everything held back, which is said out loud rather
 * than quietly omitted — a person who is told "not before your first guided
 * campaign" has been given a next step, and a person who is told nothing has
 * been given a missing feature.
 */
export function provision(kept: KeptProfile): { now: Provisioned[]; later: string[] } {
  const w = new Set(kept.w)
  const now: Provisioned[] = []

  for (const [id, asked] of Object.entries(kept.t)) {
    const cap = capFor(id, w)
    const level = Math.min(asked, cap)
    now.push(
      level < asked
        ? { id, level, asked, held: heldBecause(id, w) }
        : { id, level },
    )
  }

  now.sort((a, b) => b.level - a.level)
  return { now, later: kept.l }
}

function heldBecause(toolId: string, w: Set<string>): string {
  if ((toolId === 'google-ads' || toolId === 'meta-ads' || toolId === 'audiences') && w.has('noads')) {
    return 'it drafts and you press go, until your first campaign has run'
  }
  if (w.has('solo')) return 'it drafts and you send, while there is one of you'
  return 'it acts inside your rules and tells you the same minute'
}

/** The level a tool runs at when it was switched on without a dial being set. */
export function levelOrDefault(kept: KeptProfile, toolId: string): number {
  const asked = kept.t[toolId]
  return typeof asked === 'number' ? Math.min(asked, capFor(toolId, new Set(kept.w))) : DEFAULT_LEVEL
}
