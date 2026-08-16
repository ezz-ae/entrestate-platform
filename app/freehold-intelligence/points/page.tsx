/**
 * Tokens — the realtor's ad budget, in the client's own language.
 *
 * A realtor tenant is a one-person workspace: no Finance desk, no manager
 * allocating credits — just their balance, what each launch costs, and an
 * honest way to top up. So this surface says "tokens" where the company
 * product says "credits", shows the balance big, the real ledger below, and a
 * WhatsApp top-up card instead of a checkout we do not have. Never a fake
 * payment flow: a human confirms and credits the balance.
 *
 * Server component on purpose. The existing /api/freehold/credits/* routes
 * answer only for role 'broker', and the realtor owner is 'ceo' (they OWN the
 * workspace; the few-clicks UX comes from plan gating, not a weaker role) —
 * so this page reads the ledger directly, resolving the account the way every
 * credit path does: `brokerId ?? email`. The plan is host-resolved fresh per
 * request via getTenantBrand, never trusted from a cookie.
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import {
  Coins, History, MessageCircle, Sparkles,
  ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react'
import { verifySession, SESSION_COOKIE } from '@/lib/freehold/auth-edge'
import { getTenantBrand } from '@/lib/tenancy/server'
import {
  readCreditBalance, readCreditLedger, type CreditLedgerEntry,
} from '@/lib/freehold/credits-db'
import { CREDIT_VALUE_AED, isCycleGrantReference } from '@/lib/freehold/credits-shared'

export const dynamic = 'force-dynamic'

/** Ledger rows in token language — an allocation IS a top-up here. */
const ledgerLabel = (entry: CreditLedgerEntry): string => {
  if (isCycleGrantReference(entry.reference)) return 'Monthly grant'
  switch (entry.type) {
    case 'allocation': return 'Top-up'
    case 'spend':      return 'Campaign launch'
    case 'refund':     return 'Refund'
    case 'earn':       return 'Earned'
    default:           return 'Adjustment'
  }
}

export default async function TokensPage() {
  // The plan rides the host-resolved brand payload — 'realtor' only when this
  // request's host is a tenant whose saas_tenants row says so.
  const plan = (await getTenantBrand())?.plan ?? 'company'
  if (plan !== 'realtor') redirect('/freehold-intelligence')

  const cookieStore = await cookies()
  const user = await verifySession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!user) redirect('/')

  // The same account resolution every credit path uses (launch, balance,
  // ledger): the realtor owner has no brokerId, so their money lives under
  // their email — the identity the signup seed opened the account with.
  const accountId = user.brokerId ?? user.email

  const [balanceRes, ledgerRes] = await Promise.all([
    readCreditBalance(accountId),
    readCreditLedger(accountId),
  ])

  // A failed read must never render as "0 tokens" — that is a wrong number on
  // a money screen. Say it could not load, and nothing else.
  if (!balanceRes.ok || !ledgerRes.ok) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
        <div className="rounded-xl border border-line bg-surface p-6 text-sm text-slate-400">
          Your token balance could not be loaded right now. Refresh to try again.
        </div>
      </div>
    )
  }

  const balance = balanceRes.balance?.balance ?? 0
  const ledger = ledgerRes.ledger

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">

      {/* 1 — Balance hero: the number, big, and what it buys */}
      <section className="rounded-xl border border-line bg-surface p-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-slate-500">
          <Coins className="h-3.5 w-3.5 text-gold" />
          Tokens
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-[44px] font-semibold leading-none tracking-tight text-gold tabular-nums">
            {balance.toLocaleString()}
          </span>
          <span className="pb-1 text-base text-slate-500">
            {balance === 1 ? 'token' : 'tokens'}
          </span>
        </div>
        <div className="mt-1.5 text-sm text-slate-400">
          1 token funds AED {CREDIT_VALUE_AED.toLocaleString()} of daily ad spend —
          AED {(balance * CREDIT_VALUE_AED).toLocaleString()} of ads remaining.
        </div>
      </section>

      {/* 2 — Top-up: honest by design. There is no payment gateway yet, and a
             checkout that pretends otherwise would be a fake — a human confirms
             the payment and credits the balance, and the card says exactly that. */}
      <section className="mt-4">
        <div className="rounded-xl border border-gold/25 bg-gold/[0.05] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-gold/25 bg-gold/10 text-gold">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-white">Top up by WhatsApp</div>
              <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                Message us how many tokens you want — a human confirms and credits
                your balance, usually within the hour.
              </p>
              <div className="mt-4">
                <Link
                  href="/business/contact"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink transition hover:bg-gold-bright"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Top up my tokens
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 — What launching costs, so the number above means something */}
      <section className="mt-4">
        <div className="flex items-start gap-3 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-slate-400">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span>
            Launching an ad reserves 1 token per AED {CREDIT_VALUE_AED} of its
            daily budget. If a launch fails, its tokens come straight back.
          </span>
        </div>
      </section>

      {/* 4 — History: the real ledger, nothing synthesised */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          <History className="h-3.5 w-3.5" />
          Token history
        </div>
        {ledger.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-6 text-sm text-slate-500">
            No movements yet — your first top-up and every ad launch will show here.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            {ledger.map((entry, i) => {
              const isDebit = entry.type === 'spend' || entry.amount < 0
              const signed = entry.type === 'spend' ? -Math.abs(entry.amount) : entry.amount
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-line' : ''}`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${isDebit ? 'border-red-400/25 bg-red-400/10 text-red-400' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-400'}`}>
                    {isDebit ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">{ledgerLabel(entry)}</div>
                    {entry.note && (
                      <div className="mt-0.5 truncate text-xs text-slate-500">{entry.note}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-end">
                    <div className={`text-sm font-semibold tabular-nums ${isDebit ? 'text-red-400' : 'text-emerald-400'}`}>
                      {signed > 0 ? `+${signed.toLocaleString()}` : signed.toLocaleString()}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {new Date(entry.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

    </div>
  )
}
