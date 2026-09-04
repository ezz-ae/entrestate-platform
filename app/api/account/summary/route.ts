/**
 * PHASE 5 OF THE ACCOUNT FOUNDATION — the account, served to its own
 * surfaces.
 *
 * The Terminal's account area (/me on terminal.entrestate.com) is a surface
 * of the SAME account this platform keeps: the ruling is one account, and
 * phase 5 is "nothing rebuilt, everything re-pointed". This endpoint is the
 * re-pointing: one GET that answers "who am I here, what is my balance,
 * which apps are on my account" — the Terminal renders it server-side by
 * relaying the shared .entrestate.com session cookie, the way the store
 * page already recognises the same session.
 *
 * SELF-AUTHENTICATING AND FAIL-CLOSED, like /api/auth/whoami beside it on
 * the public allowlist: the API wall reads the WORKSPACE cookie, which a
 * Terminal caller correctly does not carry — the gate that matters here is
 * the Neon session itself (getTerminalUser), and without it the answer is
 * 401 with nothing in it. What it returns is the account's OWN summary and
 * only that: no other account's rows, no engine internals, no client data.
 *
 * The response never caches (a balance is a live fact) and states amounts
 * as display strings the ledger produced — the Terminal renders, never
 * recomputes.
 */
import { NextResponse } from 'next/server'
import { getTerminalUser } from '@/lib/terminal-session'
import { ensureBusinessAccount, listAccountApps } from '@/lib/terminal-account'
import { readAccountWallet } from '@/lib/account-wallet'
import { STORE, BILLING_LABELS } from '@/lib/freehold/app-store'
import { SAAS_TENANCY } from '@/lib/tenancy/config'
import { workspacesForAccount } from '@/lib/tenancy/account-workspace'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getTerminalUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await ensureBusinessAccount(user)
  if (!account) return NextResponse.json({ error: 'Account unavailable' }, { status: 503 })

  const [wallet, apps, workspaces] = await Promise.all([
    readAccountWallet(account),
    listAccountApps(account.id),
    // The workspaces this account owns, so the Terminal's /me can offer the
    // door instead of only describing what is behind it. Read through the same
    // guard the account page uses: an unverified email lists nothing.
    SAAS_TENANCY ? workspacesForAccount(user) : Promise.resolve([]),
  ])

  return NextResponse.json(
    {
      account: { name: account.name, email: account.email },
      wallet: wallet
        ? {
            accountNo: wallet.accountNo,
            balanceAed: wallet.balanceAed,
            heldAed: wallet.heldAed,
            pendingTopUps: wallet.pendingRequests.length,
          }
        : null,
      apps: [...apps.entries()].flatMap(([id, status]) => {
        const product = STORE.find((p) => p.id === id)
        return product
          ? [{ id, name: product.name, status, billing: product.billing, billingLabel: BILLING_LABELS[product.billing] }]
          : []
      }),
      // Each workspace carries the one link that opens it. `enterUrl` is the
      // apex route that verifies ownership and mints the claim token — it is a
      // LINK to a door, not a credential, so it is safe to return in a body.
      workspaces: workspaces.map((w) => ({
        subdomain: w.subdomain,
        company: w.company,
        status: w.status,
        url: w.url,
        enterUrl: `https://entrestate.com/api/account/workspace/enter?sub=${encodeURIComponent(w.subdomain)}`,
      })),
      // Whether the Terminal may show a "create one" prompt: only when the
      // identity could actually complete it.
      canCreateWorkspace: SAAS_TENANCY && user.emailVerified && workspaces.length === 0,
      links: {
        account: 'https://entrestate.com/business/account',
        store: 'https://entrestate.com/business/store',
      },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
