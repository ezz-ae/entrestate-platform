/**
 * ONESTATE — THE DECK, AND WHY THE SETUP IS A GAME AND NOT A FORM.
 *
 * The owner's brief, in his words: "the main thing is not to make them read
 * and not to ask this or that — always ask individually, that's less headache
 * and feels more easy". And underneath the game, the thing it exists to
 * decide: "it will set the account up with the tools matching his level of
 * knowledge, experience, team, needs — so we don't give him a full Meta
 * account while he doesn't understand it, and we don't give someone a one-page
 * finance while it's his career."
 *
 * So this module holds no screens and no copy about itself. It holds ATOMS —
 * one fact each — and the rules for choosing which one to show next. A card is
 * made from an atom and a phrasing AT THE MOMENT IT IS SHOWN, so the page a
 * visitor sees was not built before they arrived and two visitors never get
 * the same deck.
 *
 * THE THREE SHAPES A CARD TAKES, and each is a different kind of truth:
 *
 *   · a GRADIENT card, where the click position is the answer. "Palm Jumeirah"
 *     can be warm or lukewarm, and a yes/no button throws that away.
 *   · a FLAT card with ✕ and ○, for atoms marked `plain`. "It is just me" is
 *     true or it is not; a gradient under it invents a precision that does not
 *     exist.
 *   · a DIAL, 0 to 10, which is the only number this product shows a person,
 *     because it is not a score being given TO them — it is how much of their
 *     own money and name the machine may spend without asking. See
 *     `levelSay`; the bands are the four real answers, not a mood.
 *
 * Nothing here imports React or touches the DOM. `composeNext` is pure and
 * deterministic given the same state and random draw, which is what lets
 * scripts/onestate-test.ts assert the rules that matter — that nobody is asked
 * their ad budget before they have said they run ads, that a tool is always
 * followed by its own level question, and that no atom is shown twice.
 *
 * In the product the composer can be replaced by a model choosing the next
 * card outright; `composeNext` is the seam, and the shape it returns is the
 * contract.
 */

export type CardKind =
  | 'what you sell'
  | 'where you work'
  | 'developers you know'
  | 'where leads come from'
  | 'money'
  | 'ad budget'
  | 'your team'
  | 'what you run on'
  | 'who buys from you'
  | 'what hurts'
  | 'the thing you actually want'
  | 'how you would run it'
  | 'shall we include it?'
  | 'how far should it drive itself?'
  | 'when you like'

export type Atom = {
  /** The fact, as a person would say it. */
  w: string
  k: CardKind
  /** What a warm answer teaches us. */
  t: string[]
  /** Gates this atom behind something already said — how an answer picks the next question. */
  needs?: string
  /** True when the fact does not admit a degree, so the card arrives flat with ✕ and ○. */
  plain?: boolean
  area?: string
  dev?: string
}

export type Card = {
  w: string
  k: CardKind
  t: string[]
  plain?: boolean
  area?: string
  dev?: string
  /** Set when the card was built out of two things the visitor already said. */
  composed?: boolean
  /** The tool this card offers to include. */
  tool?: string
  /** The tool this card is setting the level for. */
  dialFor?: string
  /** The card that ends the game, which is a card and not a button in a corner. */
  stop?: boolean
}

/* ── the atoms ─────────────────────────────────────────────────────────── */

export const ATOMS: Atom[] = [
  { w: 'Off-plan', k: 'what you sell', t: ['offplan'] },
  { w: 'Secondary', k: 'what you sell', t: ['secondary'] },
  { w: 'Rentals', k: 'what you sell', t: ['rentals'] },
  { w: 'Commercial', k: 'what you sell', t: ['commercial'] },
  { w: 'Holiday homes', k: 'what you sell', t: ['shortterm'] },

  { w: 'Palm Jumeirah', k: 'where you work', t: ['area', 'luxury'], area: 'Palm Jumeirah' },
  { w: 'Dubai Marina', k: 'where you work', t: ['area'], area: 'Dubai Marina' },
  { w: 'Business Bay', k: 'where you work', t: ['area'], area: 'Business Bay' },
  { w: 'Downtown', k: 'where you work', t: ['area', 'luxury'], area: 'Downtown' },
  { w: 'JVC', k: 'where you work', t: ['area', 'volume'], area: 'JVC' },
  { w: 'Dubai Hills', k: 'where you work', t: ['area'], area: 'Dubai Hills' },
  { w: 'MBR City', k: 'where you work', t: ['area'], area: 'MBR City' },
  { w: 'Dubai South', k: 'where you work', t: ['area', 'volume'], area: 'Dubai South' },

  { w: 'Emaar', k: 'developers you know', t: ['developer'], dev: 'Emaar' },
  { w: 'Azizi', k: 'developers you know', t: ['developer', 'volume'], dev: 'Azizi' },
  { w: 'Damac', k: 'developers you know', t: ['developer'], dev: 'Damac' },
  { w: 'Sobha', k: 'developers you know', t: ['developer', 'luxury'], dev: 'Sobha' },
  { w: 'Nakheel', k: 'developers you know', t: ['developer', 'luxury'], dev: 'Nakheel' },
  { w: 'Binghatti', k: 'developers you know', t: ['developer', 'volume'], dev: 'Binghatti' },
  { w: 'Danube', k: 'developers you know', t: ['developer', 'volume'], dev: 'Danube' },

  { w: 'Facebook and Instagram', k: 'where leads come from', t: ['meta', 'ads'] },
  { w: 'WhatsApp', k: 'where leads come from', t: ['whatsapp'] },
  { w: 'Property Finder', k: 'where leads come from', t: ['portal'] },
  { w: 'Bayut', k: 'where leads come from', t: ['portal'] },
  { w: 'Dubizzle', k: 'where leads come from', t: ['portal'] },
  { w: 'TikTok', k: 'where leads come from', t: ['social'] },
  { w: 'Google', k: 'where leads come from', t: ['google', 'ads'] },
  { w: 'Referrals', k: 'where leads come from', t: ['referral'] },
  { w: 'Cold calls', k: 'where leads come from', t: ['outbound'] },

  { w: 'I spend on ads already', k: 'money', t: ['spending', 'ads'], plain: true },
  { w: 'I have never run an ad', k: 'money', t: ['noads'], plain: true },
  // Nobody is asked their budget before they have said they have one.
  { w: 'Under AED 5,000 a month', k: 'ad budget', t: ['budget-s'], needs: 'spending', plain: true },
  { w: 'AED 5,000 to 20,000', k: 'ad budget', t: ['budget-m'], needs: 'spending', plain: true },
  { w: 'More than AED 20,000', k: 'ad budget', t: ['budget-l'], needs: 'spending', plain: true },

  { w: 'It is just me', k: 'your team', t: ['solo'], plain: true },
  { w: 'Two to five agents', k: 'your team', t: ['small'], plain: true },
  { w: 'Ten agents or more', k: 'your team', t: ['big'], plain: true },
  { w: 'Someone does our marketing', k: 'your team', t: ['marketer'], plain: true },
  { w: 'Someone manages listings', k: 'your team', t: ['lister'], plain: true },

  { w: 'A CRM', k: 'what you run on', t: ['crm'] },
  { w: 'Spreadsheets', k: 'what you run on', t: ['sheets'] },
  { w: 'A designer', k: 'what you run on', t: ['designer'] },
  { w: 'Our own website', k: 'what you run on', t: ['site'] },

  { w: 'Investors', k: 'who buys from you', t: ['investor'] },
  { w: 'People buying a home', k: 'who buys from you', t: ['enduser'] },
  { w: 'Buyers outside the country', k: 'who buys from you', t: ['overseas'] },
  { w: 'Russian speakers', k: 'who buys from you', t: ['lang-ru', 'lang'] },
  { w: 'Arabic speakers', k: 'who buys from you', t: ['lang-ar', 'lang'] },

  { w: 'Leads I never manage to reach', k: 'what hurts', t: ['speed'], plain: true },
  { w: 'No idea which ad actually worked', k: 'what hurts', t: ['attribution'], plain: true },
  { w: 'Listings that go stale', k: 'what hurts', t: ['stale'], plain: true },
  { w: 'Agents who do not follow up', k: 'what hurts', t: ['followup'], plain: true },
  { w: 'Too many portals to keep current', k: 'what hurts', t: ['portals'], plain: true },
]

/**
 * The same atom, worded differently from visit to visit. This is the line
 * between a page that was generated for this person and a form somebody filled
 * in once — and it costs nothing, because the meaning is carried by the atom,
 * not by the sentence around it. `plain` atoms are never re-phrased: they are
 * already the plainest form of themselves, and dressing up "It is just me"
 * would make a flat fact sound like an opinion.
 */
export const PHRASINGS: Partial<Record<CardKind, string[]>> = {
  'where you work': ['{x}', 'Mostly {x}', '{x}, more than anywhere', '{x} is my patch'],
  'developers you know': ['{x}', '{x}, well', 'I have sold {x}', '{x} — I know their stock'],
  'where leads come from': ['{x}', 'Most of it is {x}', '{x}, when it works'],
  'what you sell': ['{x}', '{x}, mainly', 'Nearly all {x}'],
  'what you run on': ['{x}', 'We run on {x}', '{x}, and that is it'],
  'who buys from you': ['{x}', 'Mostly {x}', '{x}, usually'],
}

/* ── cards that cannot exist before the conversation does ──────────────── */

export type Composite = {
  id: string
  needs: string[]
  make: (p: Profile) => Card
}

export const COMPOSITES: Composite[] = [
  {
    id: 'dev-in-area',
    needs: ['devs', 'areas'],
    make: (p) => ({ w: `${p.devs[0]} in ${p.areas[0]}`, k: 'the thing you actually want', t: ['composite'] }),
  },
  {
    id: 'resale-area',
    needs: ['secondary', 'areas'],
    make: (p) => ({ w: `A ${p.areas[0]} resale, this week`, k: 'the thing you actually want', t: ['composite'] }),
  },
  {
    id: 'offplan-dev',
    needs: ['offplan', 'devs'],
    make: (p) => ({ w: `Everything ${p.devs[0]} launches, first`, k: 'the thing you actually want', t: ['composite'] }),
  },
  {
    id: 'ads-area',
    needs: ['ads', 'areas'],
    make: (p) => ({ w: `Spend only on ${p.areas[0]}`, k: 'how you would run it', t: ['composite'] }),
  },
  {
    id: 'lang-buyer',
    needs: ['lang', 'areas'],
    make: (p) => ({ w: `${p.areas[0]}, answered in their language`, k: 'how you would run it', t: ['composite'] }),
  },
]

/* ── the tools, and how far each may drive ─────────────────────────────── */

/**
 * A straight question, because this one cannot be read off a mood. The owner:
 * "sometimes you will ask direct questions — shall we include Google Ads
 * dashboard? then, how out of ten AI should be able to ride it."
 *
 * `id` is what gets written down and what provisioning reads; `w` is only what
 * the card says, so the sentence can be rewritten without moving a capability.
 */
export type Tool = { id: string; w: string }

export const TOOLS: Tool[] = [
  { id: 'google-ads', w: 'Google Ads' },
  { id: 'meta-ads', w: 'Meta Ads Manager' },
  { id: 'crm', w: 'The CRM' },
  { id: 'pages', w: 'Landing pages' },
  { id: 'leadformer', w: 'Leadformer — the form that talks back' },
  { id: 'portals', w: 'Portal sync — Bayut, Property Finder' },
  { id: 'whatsapp', w: 'WhatsApp replies' },
  { id: 'audiences', w: 'The audience builder' },
  { id: 'scoring', w: 'Listing scoring' },
  { id: 'report', w: 'The month-end report' },
]

/**
 * FOUR BANDS, AND EACH IS A DIFFERENT AMOUNT OF SOMEBODY ELSE'S MONEY.
 *
 * These are not personality settings and they are not a slider for its own
 * sake. They are the only place this product asks a person how much it may do
 * alone, and the wording is deliberately about consequence rather than
 * capability — "nothing moves until you say so" is a promise about spend, and
 * "you hear the same minute" is a promise about notice. Changing these words
 * changes what the product owes somebody, so they live here and nowhere else.
 */
export function levelSay(n: number): string {
  if (n <= 2) return 'you press every button · it only shows you'
  if (n <= 5) return 'it drafts · nothing moves until you say so'
  if (n <= 8) return 'it acts inside your rules · you hear the same minute'
  return 'it runs · you read the report'
}

/** The level a tool gets when the person never set one — the careful end. */
export const DEFAULT_LEVEL = 3

/* ── what the game has learned ─────────────────────────────────────────── */

export type Profile = {
  /** tag → the warmest answer given for it, 0…1. */
  warmth: Record<string, number>
  areas: string[]
  devs: string[]
  /** tool id → 0…10. */
  tools: Record<string, number>
  /** tool ids answered with ✕ — wanted later, not now. */
  later: string[]
}

export function emptyProfile(): Profile {
  return { warmth: {}, areas: [], devs: [], tools: {}, later: [] }
}

/** Reads like a tag lookup so the rules below stay readable. */
export function has(p: Profile, tag: string): boolean {
  return typeof p.warmth[tag] === 'number'
}

export type ComposerState = {
  profile: Profile
  usedAtoms: Set<number>
  usedComposites: Set<string>
  toolsLeft: Tool[]
  queue: Card[]
  lastKind: CardKind | null
  kindRun: number
  kindsShown: Set<CardKind>
  taps: number
  sinceTool: number
  stopOffered: boolean
}

export function emptyComposerState(): ComposerState {
  return {
    profile: emptyProfile(),
    usedAtoms: new Set(),
    usedComposites: new Set(),
    toolsLeft: TOOLS.slice(),
    queue: [],
    lastKind: null,
    kindRun: 0,
    kindsShown: new Set(),
    taps: 0,
    sinceTool: 0,
    stopOffered: false,
  }
}

/** How many cards pass between one tool question and the next. */
const TOOL_EVERY = 3
/** Nothing is offered a stop before this many answers — it would read as a door. */
const STOP_AFTER = 9

/**
 * The next card, chosen rather than listed.
 *
 * Order matters and each step answers a different question:
 *   1. a QUEUED card first — a level question belongs to the tool just taken,
 *      not to three cards from now.
 *   2. a TOOL, on a rhythm, once enough is known to place the answer.
 *   3. the STOP, offered as a card.
 *   4. a COMPOSITE built from his own words, when two of them are in hand.
 *   5. otherwise an atom, scored.
 *
 * `rand` is injected so a test can pin the draw and so the page can seed it
 * per visit.
 */
export function composeNext(s: ComposerState, rand: () => number): Card | null {
  if (s.queue.length) return s.queue.shift()!

  if (s.taps >= 3 && s.toolsLeft.length && s.sinceTool >= TOOL_EVERY) {
    s.sinceTool = 0
    const i = Math.floor(rand() * s.toolsLeft.length)
    const tool = s.toolsLeft.splice(i, 1)[0]
    return { w: tool.w, k: 'shall we include it?', t: [], tool: tool.id, plain: true }
  }

  if (s.taps >= STOP_AFTER && !s.stopOffered && rand() < 0.5) {
    s.stopOffered = true
    return { w: 'Enough for today', k: 'when you like', t: [], plain: true, stop: true }
  }

  s.sinceTool += 1

  const made = nextComposite(s, rand)
  if (made) return made
  return nextAtom(s, rand)
}

function nextComposite(s: ComposerState, rand: () => number): Card | null {
  for (const c of COMPOSITES) {
    if (s.usedComposites.has(c.id)) continue
    const ready = c.needs.every((n) =>
      n === 'devs' ? s.profile.devs.length > 0 : n === 'areas' ? s.profile.areas.length > 0 : has(s.profile, n),
    )
    if (!ready) continue
    // Not the first moment it becomes possible: a sentence made of his own
    // words lands harder when it is not predictable.
    if (rand() < 0.45) continue
    s.usedComposites.add(c.id)
    return { ...c.make(s.profile), composed: true }
  }
  return null
}

function nextAtom(s: ComposerState, rand: () => number): Card | null {
  const pool: number[] = []
  for (let i = 0; i < ATOMS.length; i++) {
    const a = ATOMS[i]
    if (s.usedAtoms.has(i)) continue
    if (a.needs && !has(s.profile, a.needs)) continue
    pool.push(i)
  }
  if (!pool.length) return null

  let best = -1
  let bestScore = -Infinity
  for (const i of pool) {
    const a = ATOMS[i]
    let score = rand() * 1.6
    // Stay in one dimension for a beat — it reads as listening — then move on,
    // so nobody is asked eight areas in a row.
    if (a.k === s.lastKind) score += s.kindRun < 2 ? 3.4 : -4
    if (!s.kindsShown.has(a.k)) score += 2.6
    // Warmth carries: a tag answered warmly pulls its neighbours forward.
    for (const tag of a.t) {
      const w = s.profile.warmth[tag]
      if (typeof w === 'number') score += 1.2 + w * 1.8
    }
    // A card unlocked by one of his own answers jumps the queue.
    if (a.needs) score += 4.2
    if (score > bestScore) {
      bestScore = score
      best = i
    }
  }

  s.usedAtoms.add(best)
  const a = ATOMS[best]
  const forms = a.plain ? null : PHRASINGS[a.k]
  const w = forms ? forms[Math.floor(rand() * forms.length)].replace('{x}', a.w) : a.w
  return { w, k: a.k, t: a.t, area: a.area, dev: a.dev, plain: a.plain }
}

/** Records one answer and, when a tool is taken, queues its level question. */
export function record(s: ComposerState, card: Card, score: number): void {
  s.taps += 1
  s.kindRun = card.k === s.lastKind ? s.kindRun + 1 : 0
  s.lastKind = card.k
  s.kindsShown.add(card.k)

  if (card.dialFor) {
    s.profile.tools[card.dialFor] = Math.round(score * 10)
    return
  }

  const warm = score >= WARM_AT

  if (card.tool) {
    if (warm) {
      const tool = TOOLS.find((t) => t.id === card.tool)
      s.queue.push({
        w: tool ? tool.w : card.w,
        k: 'how far should it drive itself?',
        t: [],
        dialFor: card.tool,
      })
    } else if (!s.profile.later.includes(card.tool)) {
      s.profile.later.push(card.tool)
    }
    return
  }

  if (!warm) return
  for (const tag of card.t) {
    s.profile.warmth[tag] = Math.max(s.profile.warmth[tag] ?? 0, score)
  }
  if (card.area && !s.profile.areas.includes(card.area)) s.profile.areas.push(card.area)
  if (card.dev && !s.profile.devs.includes(card.dev)) s.profile.devs.push(card.dev)
}

/**
 * Below this a click counts as "not us". It is not 0.5: the left quarter of
 * the card is visibly dying under the hand before the click lands, so a person
 * who wanted to say a faint yes does not land there by accident.
 */
export const WARM_AT = 0.22
