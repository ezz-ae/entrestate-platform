/**
 * TARGETECT — target casting.
 *
 * THE OWNER'S SENTENCE, and the product is in it: "I cast your audience and
 * distribute reach depending on the consuming opportunities and recognition
 * score." Before that one: "I know Ali is my target, but I need him to
 * register before I can call him — so I target every Ali, Aliaa and Aliiaa.
 * We will spot Ali, reach Ali, and touch Aliaa."
 *
 * WHAT IT IS. Targetect builds the sets that come BEFORE a lookalike — the
 * seeds — inside the account's own ad accounts. It reverses the interests an
 * account already runs into data sets and customer studies, casts each
 * resulting audience into one part, and distributes the reach across those
 * parts by two numbers: how sure we are these are the people you meant
 * (recognition) and whether they can be reached today at a price worth paying
 * (opportunity).
 *
 * WHAT IT IS NOT, and this is not modesty — it is the boundary that makes it
 * safe to install. It is not an agency and not a team. It does not run ads, it
 * does not touch the budget, and it does not own the audiences it makes: they
 * are built in YOUR ad account, under your name, and they stay there if
 * Targetect goes away tomorrow.
 *
 * WHY CASTING IS THE WORD. Ali sits in the doctors set, the Golden Visa set,
 * the lookalike and the retargeting set. All four bid for him, the account
 * pays the raised price, and one person is reached four times. Casting gives
 * every audience ONE part, in one order, and every part excludes the parts
 * above it — so a person is bought once. lib/meta/audience-overlap.ts already
 * detects that competition; lib/targetect/casting.ts is the decision that ends
 * it, and it is the one piece of this product that runs today.
 *
 * IT STANDS ALONE. Not a fifth Entrestate product and not one of the four: its
 * own name, its own apex (targetect.com), its own paradigm. It shares this
 * deployment the way a young company shares an office. What it works beside is
 * named below — a cast audience is worth nothing until somebody speaks to the
 * people in it, and the two things that speak already run here.
 *
 * WHAT IS TRUE TODAY IS MARKED. Most of this is `specified`: designed, written
 * down, not built. A page of ten green ticks on a product's first day is the
 * least believable thing a reader can be handed, and this repository has a
 * legend for exactly that (README.md). Every claim below carries its status,
 * and scripts/targetect-test.ts refuses the two lies that matter: a shipped
 * claim whose engine does not exist, and a specified claim reaching the page
 * without saying it is not built yet.
 *
 * Pure data — no I/O, no React. The page renders it; the guard reads it.
 */

/** Where Targetect lives. */
export const TARGETECT = {
  /** Its own apex. Routed by BRAND_DOMAINS in lib/tenancy/vendor-host.ts. */
  domain: 'targetect.com',
  /** The page, top-level and outside /business on purpose: /business is the
   *  Entrestate platform site, and Targetect is not one of its products. */
  href: '/targetect',
  /** targetect.entrestate.com — the address that works before DNS does.
   *  Reserved in lib/tenancy/reserved.ts so no tenant can claim the name. */
  door: 'targetect',
} as const

/** The whole product in one line, as it is said out loud. */
export const TARGETECT_PROMISE =
  'I cast your audience and distribute the reach. Ali gets one part and is bought once, instead of being bought in every set you run — and Aliaa gets a part of her own, at her own price.'

/**
 * The boundary, stated as plainly as the promise. An audience tool that also
 * runs the ads is an agency with a login, and the account can never leave it.
 * Targetect writes sets into the customer's own ad account and stops there.
 */
export const TARGETECT_NOT =
  'Not an agency, not a team, and not a thing that runs your ads. Targetect builds the sets inside your own ad accounts, under your name — they are yours the day it arrives and yours the day it leaves.'

/**
 * THE TWO NUMBERS THE WHOLE ORDER COMES FROM. Named here because the page, the
 * engine (lib/targetect/casting.ts) and any conversation about a plan have to
 * mean the same thing by them.
 */
export const TARGETECT_SCORES = [
  {
    name: 'Recognition',
    body: 'How sure we are that these are the people you meant — from evidence the account owns: what they did on your pages, in your forms, on your calls, in your CRM. Not a resemblance somebody sold you.',
  },
  {
    name: 'Opportunity',
    body: 'Whether they can be reached today: impressions available, on a surface that exists, at a price worth paying. A perfect audience with nowhere to run is not a part worth casting.',
  },
] as const

/**
 * The rule that decides what recognition may be built from, and it is a limit
 * rather than a feature. A product that resolves a stranger to a named person
 * out of bought data is surveillance wearing a marketing name, and it also
 * breaks: identity brokers get shut and platforms close doors in weeks nobody
 * chose. Targetect recognises YOUR people, from what they did with you and
 * from what the ad platforms genuinely sell.
 */
export const TARGETECT_IDENTITY_RULE =
  'Targetect recognises a person from what they did with you and from what the platforms actually sell. It never buys or brokers identity data, and one advertiser never sees another’s people.'

/** The three acts, in the order they happen. */
export type TargetectAct = 'study' | 'cast' | 'distribute'

export const TARGETECT_ACTS: Readonly<Record<TargetectAct, { title: string; body: string }>> = {
  study: {
    title: 'Study',
    body: 'The interests and audiences your account already runs are read back into data sets and customer studies: who is really in them, what those people did, and which of them ever produced a buyer. That study is the seed — the thing a lookalike should have been built from in the first place.',
  },
  cast: {
    title: 'Cast',
    body: 'Every audience gets one part, in one order, built inside your own ad account. Casting is the word because it is the same decision: this person plays this role, and nobody plays two.',
  },
  distribute: {
    title: 'Distribute',
    body: 'The reach is shared across the parts by recognition and opportunity, and every part excludes the parts above it. Ali is bought once, at one price, instead of four ad sets bidding for him and the account paying the difference.',
  },
}

/**
 * What a claim's status means. Same legend as README.md, one vocabulary
 * across the repository so a reader never has to reconcile two.
 */
export type ClaimStatus =
  /** Working code, a named file, held by a guard. */
  | 'shipped'
  /** Part of it exists and the missing half is named in `missing`. */
  | 'partial'
  /** Designed and written down. No code yet, and the page says so. */
  | 'specified'

export interface TargetectClaim {
  act: TargetectAct
  /** The name of the thing, short enough to retell over a phone. */
  title: string
  /** What it does, one line, no number in it that is a result. */
  body: string
  status: ClaimStatus
  /** The module that implements it — required for shipped and partial. */
  engine?: string
  /** The suite that holds it — required for shipped and partial. */
  guard?: string
  /** The half that does not exist — required for partial. */
  missing?: string
}

export const TARGETECT_CLAIMS: TargetectClaim[] = [
  // ── STUDY ──────────────────────────────────────────────────────────────
  {
    act: 'study',
    title: 'Your interests, reversed',
    body: 'An interest list is a guess written as a target. Read backwards — against the people it actually delivered and what they did next — it becomes a data set and a customer study, which is a different kind of object entirely.',
    status: 'specified',
  },
  {
    act: 'study',
    title: 'The seed before the lookalike',
    body: 'A lookalike is only ever as good as the seed it was grown from, and most seeds are a thin export nobody examined. Targetect builds the seed sets, and the lookalike comes after them.',
    status: 'specified',
  },
  {
    act: 'study',
    title: 'What they did',
    body: 'Time parked on the payment plan, the tab that went idle and was chosen again, how far they read. A person who returns to one property with nobody prompting them has told you more than any interest list can — and that is what recognition is built from.',
    status: 'shipped',
    engine: 'lib/freehold/behavioral-telemetry.ts',
    guard: 'scripts/behavioral-telemetry-test.ts',
  },
  {
    act: 'study',
    title: 'The second enquiry',
    body: 'Asking twice about the same kind of home in the same area is a decision being made. Asking about six areas is a browse. The two are read differently, and only one of them raises recognition.',
    status: 'shipped',
    engine: 'lib/freehold/intent-convergence.ts',
    guard: 'scripts/intent-convergence-test.ts',
  },
  // ── CAST ───────────────────────────────────────────────────────────────
  {
    act: 'cast',
    title: 'One part each',
    body: 'Every audience is cast into one part, ordered by recognition times opportunity — multiplied, never averaged, because a set you are sure of with nowhere to run and a cheap crowd nobody recognises are both worth nothing, and an average hides that.',
    status: 'shipped',
    engine: 'lib/targetect/casting.ts',
    guard: 'scripts/targetect-casting-test.ts',
  },
  {
    act: 'cast',
    title: 'Built in your account',
    body: 'The sets are created in your own ad account, under your name. Nothing is rented: if Targetect goes away tomorrow, the audiences it built are still yours and still running.',
    status: 'partial',
    engine: 'lib/freehold/audiences.ts',
    guard: 'scripts/audience-language-test.ts',
    missing: 'the casting plan is not written to the account yet — what exists creates a custom audience and a lookalike from a rated list, not a cast with its exclusions',
  },
  // ── DISTRIBUTE ─────────────────────────────────────────────────────────
  {
    act: 'distribute',
    title: 'Nobody is bought twice',
    body: 'Each part excludes every part cast above it, so a person who belongs to three of your audiences is reached inside one of them. That exclusion list is the product; a report about overlap is not.',
    status: 'shipped',
    engine: 'lib/targetect/casting.ts',
    guard: 'scripts/targetect-casting-test.ts',
  },
  {
    act: 'distribute',
    title: 'Nothing starves',
    body: 'A budget split across more parts than it can carry produces parts that each learn nothing and a report made of noise. The parts that do not fit are held, by name and with a reason, rather than cast into starvation.',
    status: 'shipped',
    engine: 'lib/targetect/casting.ts',
    guard: 'scripts/targetect-casting-test.ts',
  },
  {
    act: 'distribute',
    title: 'Aliaa gets her own part',
    body: 'The near-matches are real people and they are not the one you meant. They are cast as themselves, on their own share of the reach, and never counted as him.',
    status: 'specified',
  },
  {
    act: 'distribute',
    title: 'It refuses rather than guesses',
    body: 'No cost per event, no plan. A set the platform will not size is held rather than estimated into existence. A number that arrived from an assumption is worse than no number, because it is spent.',
    status: 'shipped',
    engine: 'lib/targetect/casting.ts',
    guard: 'scripts/targetect-casting-test.ts',
  },
]

/**
 * What Targetect works best beside. A cast audience is worth nothing until
 * somebody speaks to the people in it, and both of the things that speak
 * already run in this deployment — which is the whole reason the two products
 * share an address while staying separate names.
 */
export const TARGETECT_PAIRS = [
  {
    name: 'Leadformer',
    body: 'The form that talks back, so a spotted person meets a conversation instead of nine fields.',
    href: '/business/leadformer',
  },
  {
    name: 'The caller',
    body: 'A member of the sales team places the call, in consent and in hours, with the fixed voice that person already knows.',
    href: '/business/lead-machine',
  },
] as const
