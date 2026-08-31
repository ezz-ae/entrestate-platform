'use server'

import { redirect } from 'next/navigation'
import { getTerminalUser } from '@/lib/terminal-session'
import { ensureBusinessAccount } from '@/lib/terminal-account'
import { requestTopUp } from '@/lib/account-wallet'
import { getLeadershipLeadRecipients, sendSystemEmail } from '@/lib/transactional-email'

/**
 * The top-up form's server half. Session-gated (the shared .entrestate.com
 * session is the identity), bounds enforced in lib/account-wallet.ts, and the
 * outcome travels back as a query flag the page renders in words. A top-up
 * request is money intent — leadership hears about it like an app request.
 * No coin moves here; approval lives in the finance screen.
 */
export async function submitTopUp(formData: FormData): Promise<void> {
  const user = await getTerminalUser()
  if (!user) redirect('/business/account')
  const account = await ensureBusinessAccount(user)
  if (!account) redirect('/business/account?topup=failed')

  const amountAed = Number(String(formData.get('amount') ?? '').replace(/[^0-9.]/g, ''))
  const outcome = await requestTopUp(account, amountAed)

  if (outcome.ok) {
    void (async () => {
      try {
        const { emails } = await getLeadershipLeadRecipients()
        if (emails.length) {
          await sendSystemEmail({
            to: emails,
            subject: `Wallet top-up request: AED ${outcome.amountAed}`,
            headline: `${account.name ?? account.email ?? 'A Terminal account'} asked to top up AED ${outcome.amountAed}`,
            lines: [
              `Account: ${account.email ?? account.neonUserId}`,
              'Pending in the finance screen — approving it moves the coin in the same breath.',
            ],
          })
        }
      } catch (err) {
        console.error('[account] top-up alert failed', err)
      }
    })()
    redirect('/business/account?topup=requested')
  }
  redirect(`/business/account?topup=${outcome.reason === 'amount_out_of_bounds' ? 'bounds' : 'failed'}`)
}
