/**
 * WHO PAYS for a launch — one answer, used by every launch route.
 *
 * The rule used to live inline in each route as `role === 'broker'`, which was
 * right for exactly one product and silently wrong for the other:
 *
 *   Company plan — the brokerage owns the Meta account and funds it. A broker
 *     spending the house's money draws on their own allowance, so they pay in
 *     credits; a manager launching from the same account does not, because the
 *     company already paid for that budget directly.
 *
 *   Realtor plan — Meta for Realtors is ONE person's workspace, and the
 *     marketing sells it as "tokens as you run ads, no monthly fee". That
 *     owner signs up as role 'ceo' (they own their workspace outright — see
 *     lib/tenancy/onboard.ts), so the broker-only test made every realtor
 *     launch FREE: brokerId undefined → creditsToSpend 0 → no reservation.
 *     A whole product billed nothing. Plan is the authority here, not role.
 *
 * Identity is the same string the ledger is keyed by everywhere else:
 * `brokerId ?? email`. onboard.ts seeds a realtor owner's account by EMAIL
 * (a 'ceo' has no brokerId), so email is where their money lives.
 */
import type { SessionUser } from '@/lib/freehold/session-types'
import type { TenantPlan } from '@/lib/freehold/apps'

/**
 * The credit account this user's ads are funded from, or undefined when they
 * are not credit-funded at all (company staff on the company's own ad
 * account). One name for one rule: the account a launch is CHARGED to is the
 * same account a balance screen READS — the two drifting apart is how a
 * realtor came to be charged nothing and shown "not a broker account".
 */
export function creditAccountId(
  user: Pick<SessionUser, 'role' | 'email'> & { brokerId?: string },
  plan?: TenantPlan | null,
): string | undefined {
  // A realtor workspace has exactly one payer: whoever is signed into it.
  // Every role inside it funds its own ads, so plan wins over role here.
  if (plan === 'realtor') return user.brokerId ?? user.email
  if (user.role === 'broker') return user.brokerId ?? user.email
  return undefined
}
