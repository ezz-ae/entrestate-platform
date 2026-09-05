/**
 * THE FULL SYSTEM — the one thing entrestate.com/business sells.
 *
 * The owner's ruling on how the family is arranged: the Entrestate ACCOUNT
 * (/me on the Terminal) is everything a person has — the market, the apps
 * they install, their wallet. The SERVER is the full system: the complete
 * operation a real-estate company runs on, installed under its own name on
 * its own address, and it is sold on one page — /business — to the company
 * that takes the whole of it. The apps are not sold there; they live on the
 * account.
 *
 * This module is the one place the full system's commercial facts are typed
 * in THIS repository. The home page, the plans page and the printed one-pager
 * all read from here, so a price cannot say one thing on the door and another
 * on the till. The subscription price is ALSO the Terminal's Team tier literal
 * in ezz-ae/Entrestate_os (lib/pricing/plans.ts, charged by lib/payments/tap.ts
 * and frozen by tests/pricing-money.test.ts); no guard can reach across the
 * repository boundary, so the rule is written: change it there FIRST, then
 * here, in one sitting.
 *
 * The trial length is the same 14 days the sign-up screen promises
 * (app/signup/signup-client.tsx, TRIAL_DAYS) and provisioning grants.
 */

/** The welcome credit, in AED — the number the landing page says. lib/business/offers.ts carries the offer itself. */
export const WELCOME_CREDIT_AED = 500

export const FULL_SYSTEM = {
  /** The subscription, per workspace. */
  monthlyAed: 999,
  yearlyAed: 9_588,
  /** Days a new workspace runs before the subscription is due. */
  trialDays: 14,
  /** Where the full system is sold, absolute — /me on the Terminal links here. */
  url: 'https://entrestate.com/business',
  /** Where buying starts. The sign-up screen provisions plan 'company'. */
  startHref: '/signup',
} as const

const aed = (n: number) => `AED ${n.toLocaleString('en-US')}`

/** "AED 999 / month · AED 9,588 / year" — the line every surface prints. */
export const FULL_SYSTEM_PRICE_LINE = `${aed(FULL_SYSTEM.monthlyAed)} / month · ${aed(FULL_SYSTEM.yearlyAed)} / year`

/** "AED 999/month" — the short form for tight places (the one-pager). */
export const FULL_SYSTEM_PRICE_SHORT = `${aed(FULL_SYSTEM.monthlyAed)}/month`

/** "Start with your own address" — the one call to action, everywhere. */
export const FULL_SYSTEM_CTA = 'Start with your own address'

/**
 * The line under every start button. The owner's school: no trial, no
 * discount, no gift — "take these, spend them on me." So the line is the
 * welcome credit (lib/business/offers.ts, WELCOME): an amount in AED that
 * comes off the account's bills, said the way money is said, and never with
 * the banned word. `trialDays` above is a provisioning fact (the grace
 * before the subscription is due) and no selling surface prints it.
 */
export const FULL_SYSTEM_START_NOTE = `AED ${WELCOME_CREDIT_AED} on your account when you start — it comes off your bills. Your own address and your own database from the first screen.`
