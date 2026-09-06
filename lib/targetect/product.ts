/**
 * TARGETECT — where is my audience today?
 *
 * THE SENTENCE THE PRODUCT IS BUILT ON, in the owner's words: "I know Ali is
 * my target, but I need him to register before I can call him — so I target
 * every Ali, Aliaa and Aliiaa. That is what is happening now. We will spot
 * Ali, reach Ali, and touch Aliaa."
 *
 * Read it twice, because two different failures are in it.
 *
 *   1. THE TOLL. A phone number is only earned by a form. So the whole machine
 *      is built backwards: buy a crowd, pay for the crowd, and wait for one of
 *      them to register before anybody may say a word to them.
 *   2. THE CROWD. Since the crowd is the only way through the toll, targeting
 *      becomes name-shaped — everyone who resembles the person you meant. The
 *      resemblance is bought at full price and counted as if it were him.
 *
 * Targetect is not a better way to buy that crowd. It is the question asked
 * the other way round: not "build me an audience", but WHERE IS HE TODAY —
 * which surface, which moment, what he is doing right now — and then reach
 * him there. The people around him are not deleted and not promoted: Aliaa
 * gets a lighter touch, as Aliaa, and is never counted as Ali.
 *
 * IT STANDS ALONE. Targetect is not a fifth Entrestate product and does not
 * belong to the four. Its own name, its own apex (targetect.com), its own
 * paradigm. It shares this deployment the way a young company shares an
 * office — the address is separate, the product is separate, and nothing in
 * the platform's menu sells it. What it pairs with is named below, because a
 * spotted person is worth nothing until somebody speaks to them, and the two
 * things that speak already exist here.
 *
 * WHAT IS TRUE TODAY IS MARKED. Most of this is `specified`: designed, written
 * down, not built. A product page carrying ten green claims on its first day
 * is the least believable page a reader can be handed, and this repository has
 * a legend for exactly this reason (see README.md). Every claim below states
 * its own status, and scripts/targetect-test.ts refuses the two lies that
 * matter: a shipped claim whose engine does not exist, and a specified claim
 * that reaches the page without saying it is not built yet.
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
  'You know it is Ali. To call him, he has to register — so today you buy every Ali, Aliaa and Aliiaa in the city and wait. Targetect spots Ali, reaches Ali, and touches Aliaa as Aliaa.'

/**
 * THE RULE THAT DECIDES WHAT SPOTTING MEANS, and it is a limit, not a feature.
 *
 * A product that resolves a stranger to a named individual from bought data is
 * surveillance wearing a marketing name, and it also breaks: identity brokers
 * get shut, platforms close the door, and the whole thing stops working in a
 * week that nobody chose. Targetect spots a person from what they did WITH YOU
 * — your pages, your forms, your calls, your CRM — and from what the ad
 * platforms genuinely sell. It never buys, brokers, or infers identity from
 * purchased personal data, and it never hands one person's identity to another
 * advertiser. That is the difference between finding your buyer and following
 * a stranger, and it is written here so nobody has to guess later.
 */
export const TARGETECT_IDENTITY_RULE =
  'Targetect spots a person from what they did with you and from what the platforms actually sell. It never buys or brokers identity data, and one advertiser never sees another’s people.'

/** The three acts, in the order they happen. */
export type TargetectAct = 'spot' | 'reach' | 'touch'

export const TARGETECT_ACTS: Readonly<Record<TargetectAct, { title: string; body: string }>> = {
  spot: {
    title: 'Spot',
    body: 'Find the one person, not the thousand who share his name. The evidence is what he did — the page he came back to, the second enquiry, the question he asked — never a resemblance somebody sold you.',
  },
  reach: {
    title: 'Reach',
    body: 'Go to where he is today: the surface he is on now, at the moment he is on it. Registration is a toll, and the whole point is to stop paying it before anyone is allowed to speak.',
  },
  touch: {
    title: 'Touch',
    body: 'The people around him are real and they are not him. They get a lighter touch, they are counted as themselves, and the one you meant is never averaged into them.',
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
  // ── SPOT ───────────────────────────────────────────────────────────────
  {
    act: 'spot',
    title: 'The name is not the person',
    body: 'A name is the weakest thing you know about a buyer and the only thing today’s targeting can hold. Targetect resolves to the one person, and says how it knows.',
    status: 'specified',
  },
  {
    act: 'spot',
    title: 'What he did',
    body: 'Time parked on the payment plan, the tab that went idle and was chosen again, how far he read. A person who returns to one property with nobody prompting him has told you more than any interest list can.',
    status: 'shipped',
    engine: 'lib/freehold/behavioral-telemetry.ts',
    guard: 'scripts/behavioral-telemetry-test.ts',
  },
  {
    act: 'spot',
    title: 'The second enquiry',
    body: 'Asking twice about the same kind of home in the same area is a decision being made. Asking about six areas is a browse. The two are read differently and only one of them is escalated.',
    status: 'shipped',
    engine: 'lib/freehold/intent-convergence.ts',
    guard: 'scripts/intent-convergence-test.ts',
  },
  // ── REACH ──────────────────────────────────────────────────────────────
  {
    act: 'reach',
    title: 'Where he is today',
    body: 'Not a segment he belongs to — the surfaces he is actually reachable on now, and which of them is worth the next dirham.',
    status: 'specified',
  },
  {
    act: 'reach',
    title: 'No form first',
    body: 'The form is the toll that made all of this necessary. Reaching a person before they register is the product; everything else here is in service of it.',
    status: 'specified',
  },
  // ── TOUCH ──────────────────────────────────────────────────────────────
  {
    act: 'touch',
    title: 'Aliaa is a halo',
    body: 'The near-matches are worth something and they are worth less. They are touched as themselves, on their own budget, and never counted as the person you were looking for.',
    status: 'specified',
  },
  {
    act: 'touch',
    title: 'The form that talks back',
    body: 'Where a spotted person lands: a form with a named member of the sales team inside it, asking one thing at a time in the language the person used.',
    status: 'partial',
    engine: 'lib/freehold/visual-sales-team.ts',
    guard: 'scripts/visual-sales-team-test.ts',
    missing: 'the conversation runtime — the team, the voices and the caller exist; no endpoint runs the form’s turns yet',
  },
  {
    act: 'touch',
    title: 'A person on the line',
    body: 'The call is placed by somebody with a name, a fixed voice and a script, inside consent and calling hours — and never by whoever the lead already turned down.',
    status: 'shipped',
    engine: 'lib/freehold/lead-caller.ts',
    guard: 'scripts/lead-caller-test.ts',
  },
]

/**
 * What Targetect works best beside. Spotting a person is worth nothing until
 * someone speaks to them, and both of the things that speak already run in
 * this deployment — which is the whole reason the two products share an
 * address while staying separate names.
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
