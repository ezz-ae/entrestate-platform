/**
 * PHASE 3 OF THE ACCOUNT FOUNDATION — the ONE wallet, on the account.
 *
 * The ruling (docs/ACCOUNT-FOUNDATION.md): Ads Coin is THE account wallet —
 * the double-entry ledger in lib/freehold/wallet.ts / wallet-db.ts, the one
 * with the treasury, the conservation audit and the single write path. The
 * credit ledger and the /ctrl ledger remain feeders settled through it, not
 * rivals to it. This module attaches that wallet to the business account
 * phase 2 created, and gives the account its top-up flow.
 *
 * WHY THE ACCOUNT WALLET IS kind: 'broker' AND NOT A NEW KIND. A new
 * WalletKind means opening the money core — the type union, KIND_CODE, the
 * account-number vocabulary, and every wallet-test pin — to gain nothing the
 * account needs today: it needs an ADDRESS and a BALANCE with one-per-owner
 * enforced, and 'broker' + ownerId = the business-account id gives exactly
 * that through the existing partial unique index (kind, owner_id). The day
 * the account wallet needs different RULES from a broker wallet is the day
 * the new kind earns its place in the core, with its guards.
 *
 * NO COIN MOVES FROM HERE — the standing money rule. A top-up is a REQUEST
 * (freehold_wallet_requests, state 'pending'); the coin moves only when a
 * person approves it in the finance screen, through decideRequest, which
 * issues from the treasury in the same breath as it marks the request
 * approved. This module never imports postTransfer or decideRequest, and the
 * guard (scripts/account-wallet-test.ts) holds it to that.
 */
import { randomUUID } from 'node:crypto'
import { runWithDefaultSchema } from '@/lib/db'
import { filsToAed, aedToFils, type Wallet } from '@/lib/freehold/wallet'
import { openWallet, createRequest, listRequests, listPostings } from '@/lib/freehold/wallet-db'
import type { BusinessAccount } from '@/lib/terminal-account'

/**
 * Top-up bounds, in AED. The floor keeps the finance screen free of
 * ten-dirham noise; the ceiling keeps a typo from becoming a request the
 * approver has to treat as serious. Both are house numbers for the REQUEST
 * only — what actually moves is decided by a person.
 */
export const TOPUP_MIN_AED = 100
export const TOPUP_MAX_AED = 1_000_000

export interface AccountWallet {
  id: string
  accountNo: string
  balanceAed: string
  heldAed: string
  pendingRequests: Array<{ id: string; amountAed: string; createdAt: string }>
}

/**
 * Find-or-create the account's wallet. Idempotent: the wallet id derives
 * from the account id, and openWallet returns the existing row on a second
 * call; the (kind, owner_id) unique index makes a duplicate impossible even
 * in a race. Pinned to the shared schema like the account spine itself.
 */
export async function ensureAccountWallet(account: BusinessAccount): Promise<Wallet | null> {
  try {
    return await runWithDefaultSchema(() =>
      openWallet({
        id: `w_acct_${account.id}`,
        kind: 'broker',
        ownerId: account.id,
        label: `Account — ${account.name ?? account.email ?? account.id}`,
      }),
    )
  } catch (err) {
    console.error('[account-wallet] ensure failed', err)
    return null
  }
}

/** The wallet as the account page shows it — balance, address, what is pending. */
export async function readAccountWallet(account: BusinessAccount): Promise<AccountWallet | null> {
  const wallet = await ensureAccountWallet(account)
  if (!wallet) return null
  try {
    const pending = await runWithDefaultSchema(() => listRequests('pending'))
    return {
      id: wallet.id,
      accountNo: wallet.accountNo,
      balanceAed: filsToAed(wallet.balance),
      heldAed: filsToAed(wallet.held),
      pendingRequests: pending
        .filter((r) => r.walletId === wallet.id)
        .map((r) => ({ id: r.id, amountAed: filsToAed(r.amount), createdAt: r.createdAt })),
    }
  } catch {
    return {
      id: wallet.id, accountNo: wallet.accountNo,
      balanceAed: filsToAed(wallet.balance), heldAed: filsToAed(wallet.held), pendingRequests: [],
    }
  }
}

export type TopUpOutcome =
  | { ok: true; requestId: string; amountAed: string }
  | { ok: false; reason: 'amount_out_of_bounds' | 'no_wallet' | 'failed' }

/**
 * The account asks for coin. A pending request and nothing else — the
 * approval, and the movement it causes, belong to the finance screen.
 */
export async function requestTopUp(account: BusinessAccount, amountAed: number): Promise<TopUpOutcome> {
  if (!Number.isFinite(amountAed) || amountAed < TOPUP_MIN_AED || amountAed > TOPUP_MAX_AED) {
    return { ok: false, reason: 'amount_out_of_bounds' }
  }
  const wallet = await ensureAccountWallet(account)
  if (!wallet) return { ok: false, reason: 'no_wallet' }
  try {
    const req = await runWithDefaultSchema(() =>
      createRequest({
        id: `wr_${randomUUID()}`,
        walletId: wallet.id,
        amount: aedToFils(amountAed),
        reason: `Top-up requested from the account page by ${account.email ?? account.id}`,
        requestedBy: account.email ?? account.id,
      }),
    )
    if (!req) return { ok: false, reason: 'failed' }
    return { ok: true, requestId: req.id, amountAed: filsToAed(req.amount) }
  } catch (err) {
    console.error('[account-wallet] top-up request failed', err)
    return { ok: false, reason: 'failed' }
  }
}

/** The account's last movements — the receipt trail under the balance. */
export async function recentAccountPostings(account: BusinessAccount, limit = 10): Promise<Array<{ kind: string; direction: string; amountAed: string; createdAt: string }>> {
  try {
    const wallet = await ensureAccountWallet(account)
    if (!wallet) return []
    const rows = await runWithDefaultSchema(() => listPostings({ walletId: wallet.id, limit }))
    return rows.map((r) => ({ kind: r.kind, direction: r.direction, amountAed: filsToAed(r.amount), createdAt: r.createdAt }))
  } catch { return [] }
}
