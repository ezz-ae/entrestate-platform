import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SAAS_TENANCY } from '@/lib/tenancy/config'
import { getTerminalUser } from '@/lib/terminal-session'
import SignupClient from './signup-client'
import Onestate from '@/components/onestate/onestate'
import { SIGNUP_PLAN_COOKIE } from './start/route'

/**
 * THE PUBLIC SIGN-UP DOOR — ONE IDENTITY, SO IT OPENS ONTO THE TERMINAL FIRST.
 *
 * The owner's ruling: there cannot be two accounts. It is one account, arranged
 * properly. So this page no longer has a way to create an identity of its own.
 *
 *   · A stranger — no Neon session — is sent to the Terminal's sign-up. That is
 *     where an Entrestate account is born, once. They land on /me afterwards,
 *     and /me carries "Create the workspace" back to the account page.
 *   · A signed-in person gets the branded form, with themselves shown as the
 *     owner and nothing to type about who they are.
 *
 * The Terminal's `next` parameter accepts relative paths only (its open-
 * redirect guard), which is why the return is /me rather than this page. One
 * extra step for a stranger, and in exchange there is exactly one place a
 * person can be created, and it is not here.
 *
 * That same guard is why ?plan=realtor cannot ride along, and why the
 * stranger goes out through /signup/start, which writes the plan down first.
 * Read back here so the form opens on the door the buyer actually clicked.
 *
 * Dormant without tenancy, like everything else on this path: on a deployment
 * with no NEXT_PUBLIC_TENANT_BASE_DOMAIN the client form never renders — there
 * is no Terminal to send anyone to and no owner to show.
 */

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (!SAAS_TENANCY) redirect('/')

  const params = await searchParams
  const askedFor = Array.isArray(params.plan) ? params.plan[0] : params.plan

  const user = await getTerminalUser()

  /**
   * A STRANGER PLAYS THE SETUP FIRST — the owner's ruling on the order:
   * "the first thing they should have once they open the system is AI
   * conversation, their one — this makes it theirs", and the identity box
   * comes only "once the system is built in front of him".
   *
   * So the instant redirect to the Terminal is gone from the stranger's path.
   * They meet Onestate, and it is Onestate that hands them off at the end,
   * with what it learned written into a cookie (app/api/onestate/keep).
   * /signup/start stays exactly where it was for every other caller — the
   * realtor door, and anyone arriving with a plan already decided.
   */
  if (!user) return <Onestate plan={askedFor === 'realtor' ? 'realtor' : 'company'} />

  // The plan the buyer clicked: this visit's parameter first, then what
  // /signup/start remembered across the Terminal round trip.
  const remembered = (await cookies()).get(SIGNUP_PLAN_COOKIE)?.value
  const plan: 'realtor' | 'company' = askedFor === 'realtor' || remembered === 'realtor' ? 'realtor' : 'company'

  // The form needs an email to display and the API needs one to own the
  // workspace. Verification is enforced by the API on submit — it returns
  // `email_unverified` and the form says what to do — so an unverified person
  // still sees the form rather than a wall, and learns the one step they owe.
  return <SignupClient signedInAs={{ name: user.name, email: user.email ?? '' }} plan={plan} />
}
