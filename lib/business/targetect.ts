/**
 * TARGETECT — the audience half of this platform, sold under its own name.
 *
 * targetect.com is a domain this company owns, and what it sells is audience
 * planning and analytics: describe the buyer, get an audience that can be
 * bought, and afterwards find out which audience actually produced buyers.
 * Every one of those is already an engine in this repository. Targetect is
 * not new code pretending to be a product — it is the name, the door and the
 * page for the loop that lib/freehold/audience-*.ts has been running.
 *
 * WHY THIS FILE EXISTS RATHER THAN THE PAGE SAYING IT.
 *
 * A marketing page that types its own claims drifts from the product the week
 * after it ships, and nothing fails when it does. So every claim Targetect
 * makes is listed here beside the module that implements it and the guard that
 * holds it, and scripts/targetect-test.ts opens both files. A claim whose
 * engine is renamed or deleted fails the build in the same breath — the same
 * rule the app-store catalog runs on, where a dangling reference is a defect
 * rather than a stale sentence.
 *
 * THE LIMIT IS PART OF THE PRODUCT, so it is typed here too. These engines
 * plan PROPERTY audiences: every persona and every pattern carries the
 * real-estate anchor group (hardenRealEstate in lib/freehold/audience-pattern.ts),
 * because a doctor who has never shown Meta a property signal is a doctor and
 * not a buyer. Targetect on its own domain does not quietly become a general
 * interest picker; when it sells outside this vertical, the anchor becomes a
 * choice in code first and a sentence on the page second.
 *
 * Pure data — no I/O, no React. The page renders it, the guard reads it.
 */

/** Where Targetect lives: its own apex, and its page inside the platform site. */
export const TARGETECT = {
  /** The apex this company owns. Routed in lib/tenancy/vendor-host.ts (BRAND_DOMAINS). */
  domain: 'targetect.com',
  /** The canonical page. The apex and the door both serve THIS path, so two
   *  hostnames can never split it in search. */
  href: '/business/targetect',
  /** The short address inside the platform: targetect.entrestate.com.
   *  Reserved in lib/tenancy/reserved.ts so no tenant can shadow the product. */
  door: 'targetect',
} as const

/**
 * How many personas the library holds, and how many may stack into one
 * audience. TYPED HERE RATHER THAN IMPORTED: lib/freehold/persona-audience.ts
 * resolves its recipes against Meta's live vocabulary, so it pulls the Meta
 * client and the database behind it — a public marketing route has no business
 * importing that to print a count. scripts/targetect-test.ts asserts both
 * numbers against PERSONAS.length and MAX_STACK, so the shortcut cannot drift
 * into a lie.
 */
export const TARGETECT_PERSONA_COUNT = 21
export const TARGETECT_PERSONA_STACK = 3

/** The three things the product does, in the order a campaign does them. */
export type TargetectStage = 'plan' | 'buy' | 'learn'

export const TARGETECT_STAGES: Readonly<Record<TargetectStage, { title: string; body: string }>> = {
  plan: {
    title: 'Plan',
    body: 'Describe the buyer in the words a salesperson uses. The audience is built from the description, not from a list of forty thousand interests.',
  },
  buy: {
    title: 'Buy',
    body: 'Before the money moves, the audience is checked against the budget it will be bought with — and against where it is allowed to run.',
  },
  learn: {
    title: 'Learn',
    body: 'The definition every lead arrived through is frozen at arrival, so months later the question "which audience produced buyers" has an answer nobody edited.',
  },
}

export interface TargetectCapability {
  stage: TargetectStage
  /** The name of the thing. Short enough to retell over a phone. */
  title: string
  /** What it does, in one line, with no number in it that is a result. */
  body: string
  /** The module that implements it, repo-relative. Opened by the guard. */
  engine: string
  /** The suite that holds it, repo-relative. Opened by the guard. */
  guard: string
}

export const TARGETECT_CAPABILITIES: TargetectCapability[] = [
  {
    stage: 'plan',
    title: 'The pattern',
    body: 'A Levantine family renting in Dubai, two children, upgrading, mortgage, actively looking. None of that is a Meta field; the translation into locales, behaviours, interests and exclusions happens out of sight.',
    engine: 'lib/freehold/audience-pattern.ts',
    guard: 'scripts/audience-pattern-test.ts',
  },
  {
    stage: 'plan',
    title: 'One dial',
    body: 'Strictness runs 0 to 100 and it is the only knob: at 0 every trait is a hint, at 100 every trait must be true. Reach against precision, as one trade-off a person can feel.',
    engine: 'lib/freehold/audience-pattern.ts',
    guard: 'scripts/audience-pattern-test.ts',
  },
  {
    stage: 'plan',
    title: 'Personas',
    body: 'Doctors, pilots, business owners, Golden Visa seekers. Meta sells none of them as a checkbox, so each is a recipe of several interests and behaviours resolved against Meta’s live vocabulary — and a persona that resolves to nothing refuses to build instead of quietly matching nobody.',
    engine: 'lib/freehold/persona-audience.ts',
    guard: 'scripts/persona-audience-test.ts',
  },
  {
    stage: 'plan',
    title: 'Language, never nationality',
    body: 'An ad written in Arabic cannot sell to someone who does not read Arabic — that is a real Meta field and the only honest reason to narrow. Nationality is not a field; every tool that offers it is stacking proxies and getting the edges wrong where nobody can see.',
    engine: 'lib/freehold/audience-pattern.ts',
    guard: 'scripts/audience-language-test.ts',
  },
  {
    stage: 'buy',
    title: 'The budget check',
    body: 'Meta needs about fifty results a week per ad set before it stops guessing. An audience split four ways on one budget is four ad sets that each learn nothing, so the plan is judged on whether it can be bought before it is bought.',
    engine: 'lib/freehold/audience-fit.ts',
    guard: 'scripts/audience-fit-test.ts',
  },
  {
    stage: 'buy',
    title: 'The ladder',
    body: 'Lookalikes widen one rung at a time — and only when frequency and reach say the last rung is spent. Widening early throws away the targeting that was working.',
    engine: 'lib/freehold/lookalike-ladder.ts',
    guard: 'scripts/audience-depth-test.ts',
  },
  {
    stage: 'buy',
    title: 'Where it ran',
    body: 'Feed, Reels, Stories and the rest are read back per surface, with the shape of the creative next to them: a vertical video judged on a feed placement it never fitted is a verdict about nothing.',
    engine: 'lib/freehold/placement-audit.ts',
    guard: 'scripts/placement-audit-test.ts',
  },
  {
    stage: 'learn',
    title: 'The frozen definition',
    body: 'Targeting is editable; history is not. The definition a lead arrived through is copied at arrival and never touched, so an interest added today cannot take credit for a lead that closed last month.',
    engine: 'lib/freehold/audience-snapshot.ts',
    guard: 'scripts/relevance-test.ts',
  },
  {
    stage: 'learn',
    title: 'Who actually bought',
    body: 'Every audience carries its own leads, how many qualified and how many closed — with a few of the real people beside the count, because a targeting choice is easier to make against faces than against a percentage.',
    engine: 'lib/freehold/audience-outcomes.ts',
    guard: 'scripts/audience-outcomes-test.ts',
  },
  {
    stage: 'learn',
    title: 'Withheld',
    body: 'A number is shown as the bound facing its threshold, or it is not shown at all. Four leads cannot produce a cost per lead worth acting on, and a product that prints one anyway has taught you to trust the next one.',
    engine: 'lib/freehold/min-evidence.ts',
    guard: 'scripts/min-evidence-test.ts',
  },
]

/**
 * The sentence the page has to keep saying. Typed here so the guard can check
 * the page still carries it: a product sold on its own domain is exactly where
 * a vertical limit stops being mentioned.
 */
export const TARGETECT_VERTICAL_NOTE =
  'Targetect plans property audiences. Every plan carries a property signal underneath it, which is what keeps a doctor who has never looked at a listing out of a buyer audience.'
