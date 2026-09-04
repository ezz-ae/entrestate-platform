import { redirect } from 'next/navigation'
import { SAAS_TENANCY } from '@/lib/tenancy/config'
import { getTerminalUser } from '@/lib/terminal-session'
import SignupClient from './signup-client'

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
 * Dormant without tenancy, like everything else on this path: on a deployment
 * with no NEXT_PUBLIC_TENANT_BASE_DOMAIN the client form never renders — there
 * is no Terminal to send anyone to and no owner to show.
 */

const TERMINAL_SIGNUP = 'https://terminal.entrestate.com/signup?next=%2Fme'

export default async function SignupPage() {
  if (!SAAS_TENANCY) redirect('/')

  const user = await getTerminalUser()
  if (!user) redirect(TERMINAL_SIGNUP)

  // The form needs an email to display and the API needs one to own the
  // workspace. Verification is enforced by the API on submit — it returns
  // `email_unverified` and the form says what to do — so an unverified person
  // still sees the form rather than a wall, and learns the one step they owe.
  return <SignupClient signedInAs={{ name: user.name, email: user.email ?? '' }} />
}
