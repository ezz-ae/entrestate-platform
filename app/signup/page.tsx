import { redirect } from 'next/navigation'
import { SAAS_TENANCY } from '@/lib/tenancy/config'
import { getTerminalUser } from '@/lib/terminal-session'
import SignupClient from './signup-client'

/**
 * THE PUBLIC SIGN-UP DOOR, WITH A CHECK FOR WHO IS ALREADY INSIDE.
 *
 * The form in ./signup-client.tsx asks for a name, an email and a PASSWORD,
 * and creates the owner inside the new tenant's schema with that password.
 * That is the right door for a stranger. For someone who is already signed in
 * on the Terminal it is a second account: the same person, a second password,
 * a workspace whose `owner_email` may not even match the identity they sign in
 * with — which is the exact split /business/account was built to close.
 *
 * So a signed-in person never sees this form. They are sent to the account
 * page, where the workspace is created against the identity they already hold
 * and no password is asked. Verified or not — the account page is the surface
 * that knows how to explain an unverified email; this one would only bounce.
 *
 * Dormant without tenancy, like everything else on this path: on a deployment
 * with no NEXT_PUBLIC_TENANT_BASE_DOMAIN there is no Neon session to read and
 * the form renders exactly as before.
 */
export default async function SignupPage() {
  if (SAAS_TENANCY) {
    const user = await getTerminalUser()
    if (user) redirect('/business/account')
  }
  return <SignupClient />
}
