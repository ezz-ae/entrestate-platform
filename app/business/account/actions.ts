'use server'

import { redirect } from 'next/navigation'
import { getTerminalUser } from '@/lib/terminal-session'
import { ensureBusinessAccount } from '@/lib/terminal-account'
import { requestTopUp } from '@/lib/account-wallet'
import { getLeadershipLeadRecipients, sendSystemEmail } from '@/lib/transactional-email'
import { SAAS_TENANCY } from '@/lib/tenancy/config'
import { createWorkspaceForAccount } from '@/lib/tenancy/account-workspace'
import { checkRateLimit } from '@/lib/freehold/rate-limit'
import { headers } from 'next/headers'
import { redeemCode, type Human } from '@/lib/account-credit'
import { redeemCampaignCode } from '@/lib/coupon-campaigns'
import { offerOfCode } from '@/lib/business/offers'

/** The device and the network behind this request — for the once-per-human rule. */
export async function humanFromHeaders(): Promise<Human> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for') ?? ''
  const address = (forwarded.split(',')[0] || h.get('x-real-ip') || 'unknown').trim()
  return { userAgent: h.get('user-agent') ?? '', address }
}

/**
 * Redeem a code — one form, two ledgers behind it. A code whose family is
 * a house offer (WELCOME500…) was minted for this account by the page, and
 * lib/account-credit.ts refuses a second landing for the same account,
 * device+network or address. Any other code is a coupon or a voucher
 * (lib/coupon-campaigns.ts): a coupon site's shared code, once per account
 * and once per human, or a bought voucher, once per code. Rate-limited so a
 * code cannot be guessed. The outcome travels back as a query flag the page
 * renders in words.
 */
export async function redeemOffer(formData: FormData): Promise<void> {
  const user = await getTerminalUser()
  if (!user) redirect('/business/account')
  const account = await ensureBusinessAccount(user)
  if (!account) redirect('/business/account?credit=failed')
  const human = await humanFromHeaders()
  const limit = await checkRateLimit(`redeem:${account.id}`, { limit: 10, windowSec: 300 })
  if (!limit.ok) redirect('/business/account?credit=slow_down')
  const code = String(formData.get('code') ?? '')
  if (offerOfCode(code)) {
    const out = await redeemCode(account, code, human)
    if (out.ok) redirect(`/business/account?credit=${out.already ? 'already' : 'landed'}`)
    redirect(`/business/account?credit=${out.reason}`)
  }
  const out = await redeemCampaignCode(account, code, human)
  if (out.ok) redirect(`/business/account?credit=${out.already ? 'already' : out.scope === 'ads' ? 'landed_ads' : 'landed'}`)
  redirect(`/business/account?credit=${out.reason === 'human_already' ? 'already_claimed' : out.reason}`)
}

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

/**
 * Create the account's workspace — no password asked, because the account
 * already has one and it is Neon's.
 *
 * The redirect at the end goes to the tenant host's claim endpoint, which is
 * where the workspace session cookie can actually be set (cookies are
 * host-only). That URL carries a two-minute signed token, so it travels as a
 * redirect and is never rendered, returned or logged.
 *
 * A failure lands back on the account page with a reason the page says in
 * words. `taken` and `reserved` are the two a person can act on; the rest are
 * ours to fix, and the copy says so rather than blaming the typing.
 */
export async function createWorkspace(formData: FormData): Promise<void> {
  if (!SAAS_TENANCY) redirect('/business/account')

  const user = await getTerminalUser()
  if (!user) redirect('/business/account')

  // Schema creation is expensive and irreversible-ish (a claimed subdomain is
  // gone from the namespace), so the ceiling here is tight and keyed to the
  // verified identity.
  const limit = await checkRateLimit(`ws-create:${user.id}`, { limit: 5, windowSec: 3600 })
  if (!limit.ok) redirect('/business/account?workspace=slow_down')

  // The subdomain grammar is enforced in createTenant; normalising here keeps
  // an ordinary typo (spaces, capitals, a trailing dot) from being reported as
  // an invalid name when the person meant something perfectly valid.
  const subdomain = String(formData.get('subdomain') ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
  const company = String(formData.get('company') ?? '').trim()

  if (!subdomain) redirect('/business/account?workspace=invalid_subdomain')
  if (!company) redirect('/business/account?workspace=company_required')

  const result = await createWorkspaceForAccount({ subdomain, company, user }).catch(() => null)
  if (!result) redirect('/business/account?workspace=store_unreachable')
  if (!result.ok) redirect(`/business/account?workspace=${result.reason}`)

  redirect(result.claimUrl)
}
