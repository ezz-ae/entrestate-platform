'use client'

/**
 * ADD TOKENS — the realtor's side of the token till.
 *
 * Nothing here moves money. A pack request writes a REQUEST row
 * (/api/freehold/credits/topup POST); a human confirms the payment and only
 * that confirmation touches the ledger. The copy says so out loud (tok.pending
 * / tok.pendingBody) because a screen that looks like a checkout, but isn't,
 * is how a realtor ends up waiting on tokens they think they already bought.
 * No card form belongs on this page until a provider is actually wired behind
 * the vendor's confirm endpoint.
 *
 * The balance read fails LOUD: a failed fetch renders tok.loadFailed, never a
 * zero. A wrong number on a money screen is worse than no number, and the API
 * itself already answers 503 rather than "no credits yet" for the same reason.
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Coins, Plus, History, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2,
} from 'lucide-react'
import { TOKEN_PACKS, daysOfRunway } from '@/lib/freehold/credits-shared'
import { useT } from '@/lib/i18n/provider'

/**
 * The daily budget every runway on this page is quoted at.
 *
 * 50 is the product's own floor — Meta for Realtors markets a minimum AED 50
 * daily budget, and TOKEN_PACKS is sized against it (see credits-shared). One
 * reference budget keeps the balance runway and the pack runways comparable;
 * quoting each at a different budget would make the packs look longer or
 * shorter than the balance they add to.
 */
const RUNWAY_BUDGET_AED = 50

/** Client-safe mirror of credit-topups.ts TopupRequest — that module imports
 *  the DB layer and must never be pulled into a 'use client' bundle. */
interface TopupRequestRow {
  id: string
  credits: number
  aed: number
  status: 'pending' | 'confirmed' | 'rejected'
  created_at: string
}

const isTopupStatus = (v: unknown): v is TopupRequestRow['status'] =>
  v === 'pending' || v === 'confirmed' || v === 'rejected'

export default function AgentTokenTopupPage() {
  const t = useT()

  // `null` balance + `balanceFailed` are DIFFERENT facts and are kept apart on
  // purpose: no account row yet (honest zero) vs. the read did not answer.
  const [balance, setBalance] = useState<number | null>(null)
  const [balanceFailed, setBalanceFailed] = useState(false)
  const [requests, setRequests] = useState<TopupRequestRow[]>([])
  const [historyFailed, setHistoryFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<number | null>(null)

  const loadRequests = useCallback(async () => {
    const res = await fetch('/api/freehold/credits/topup').catch(() => null)
    if (!res?.ok) { setHistoryFailed(true); return }
    const d = await res.json().catch(() => null)
    if (Array.isArray(d?.requests)) {
      setHistoryFailed(false)
      setRequests(d.requests as TopupRequestRow[])
    } else setHistoryFailed(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const [balRes, reqRes] = await Promise.all([
        fetch('/api/freehold/credits/balance').catch(() => null),
        fetch('/api/freehold/credits/topup').catch(() => null),
      ])
      if (cancelled) return

      if (balRes?.ok) {
        const d = await balRes.json().catch(() => null)
        if (cancelled) return
        // `balance: null` is a real answer (no account row = 0 tokens); a
        // missing/garbled body is not, and must read as a failed load.
        if (d && 'balance' in d) {
          const b = d.balance
          setBalance(b && typeof b.balance === 'number' ? b.balance : null)
        } else setBalanceFailed(true)
      } else setBalanceFailed(true)

      if (reqRes?.ok) {
        const d = await reqRes.json().catch(() => null)
        if (cancelled) return
        if (Array.isArray(d?.requests)) setRequests(d.requests as TopupRequestRow[])
        else setHistoryFailed(true)
      } else setHistoryFailed(true)

      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const request = async (credits: number) => {
    setSending(credits)
    try {
      const res = await fetch('/api/freehold/credits/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits }),
      }).catch(() => null)
      if (!res?.ok) { toast.error(t('tok.failed')); return }
      const d = await res.json().catch(() => null)
      if (d?.request) setRequests((prev) => [d.request as TopupRequestRow, ...prev])
      else await loadRequests()
      toast.success(t('tok.requested'))
    } finally {
      setSending(null)
    }
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const hasPending = pendingRequests.length > 0
  const pendingCredits = new Set(pendingRequests.map((r) => r.credits))

  const runwayDays = balance != null ? daysOfRunway(balance, RUNWAY_BUDGET_AED) : null

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6">

      {/* 1 — What this screen is */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{t('tok.title')}</h1>
        <p className="mt-1 text-sm text-slate-400">{t('tok.subtitle')}</p>
      </header>

      {/* 2 — Balance. A failed read says so; it never renders a zero. */}
      <section className="mt-5 rounded-xl border border-line bg-surface p-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-slate-500">
          <Coins className="h-3.5 w-3.5 text-gold" />
          {t('tok.balance')}
        </div>

        {balanceFailed ? (
          <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {t('tok.loadFailed')}
          </div>
        ) : loading ? (
          <div className="mt-3 h-11 w-40 animate-pulse rounded-lg bg-surface-2" />
        ) : balance == null ? (
          <div className="mt-3">
            <div className="text-base font-semibold text-white">{t('tok.empty')}</div>
            <p className="mt-1 text-sm text-slate-400 leading-relaxed">{t('tok.emptyBody')}</p>
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex items-end gap-2">
              <span className="text-[44px] font-semibold leading-none tracking-tight text-gold tabular-nums">
                {balance.toLocaleString()}
              </span>
              <span className="pb-1 text-base text-slate-500">{t('tok.balanceUnit')}</span>
            </div>
            <div className="mt-1.5 text-sm text-slate-400">
              {runwayDays != null
                ? t('tok.runway', { days: runwayDays, budget: RUNWAY_BUDGET_AED })
                : t('tok.runwayUnknown')}
            </div>
            {balance === 0 && (
              <div className="mt-4 rounded-[10px] border border-line-strong bg-surface-2 px-4 py-3">
                <div className="text-sm font-semibold text-white">{t('tok.empty')}</div>
                <p className="mt-1 text-sm text-slate-400 leading-relaxed">{t('tok.emptyBody')}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3 — A request is waiting on a person, not on a payment gateway */}
      {hasPending && (
        <section className="mt-4 rounded-xl border border-gold/25 bg-gold/[0.05] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-gold/25 bg-gold/10 text-gold">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white">{t('tok.pending')}</div>
              <p className="mt-1 text-sm text-slate-400 leading-relaxed">{t('tok.pendingBody')}</p>
            </div>
          </div>
        </section>
      )}

      {/* 4 — The packs. Fixed ladder: the browser never names its own price. */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          <Plus className="h-3.5 w-3.5" />
          {t('tok.buy')}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOKEN_PACKS.map((pack) => {
            const packDays = daysOfRunway(pack.credits, RUNWAY_BUDGET_AED)
            const inFlight = sending === pack.credits
            const alreadyPending = pendingCredits.has(pack.credits)
            return (
              <div key={pack.credits} className="flex flex-col rounded-xl border border-line bg-surface p-5">
                <div className="text-lg font-semibold text-white tabular-nums">
                  {t('tok.packCredits', { n: pack.credits.toLocaleString() })}
                </div>
                <div className="mt-1 text-2xl font-semibold text-gold tabular-nums">
                  {t('tok.packAed', { aed: pack.aed.toLocaleString() })}
                </div>
                {packDays != null && (
                  <div className="mt-1.5 text-xs text-slate-500">
                    {t('tok.packRunway', { days: packDays })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => request(pack.credits)}
                  disabled={sending != null || alreadyPending}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink transition hover:bg-gold-bright disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-slate-400"
                >
                  {inFlight && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {inFlight
                    ? t('tok.requesting')
                    : alreadyPending
                      ? t('tok.requested')
                      : t('tok.request')}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* 5 — Request history. A failed read renders nothing rather than the
              false claim "no requests yet". */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          <History className="h-3.5 w-3.5" />
          {t('tok.history')}
        </div>
        {historyFailed ? null : requests.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-6 text-sm text-slate-500">
            {t('tok.none')}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            {requests.map((r, i) => {
              const status = isTopupStatus(r.status) ? r.status : 'pending'
              // Literal t() keys only — the i18n audit cannot see a computed
              // `tok.${status}`, and an unresolved key renders raw on a
              // money screen.
              const label = status === 'confirmed'
                ? t('tok.confirmed')
                : status === 'rejected'
                  ? t('tok.rejected')
                  : t('tok.pending')
              const cls = status === 'confirmed'
                ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-400'
                : status === 'rejected'
                  ? 'border-red-400/25 bg-red-400/10 text-red-400'
                  : 'border-amber-400/25 bg-amber-400/10 text-amber-300'
              const Icon = status === 'confirmed' ? CheckCircle2 : status === 'rejected' ? XCircle : Clock
              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-line' : ''}`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${cls}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white tabular-nums">
                      {t('tok.packCredits', { n: r.credits.toLocaleString() })}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 tabular-nums">
                      {t('tok.packAed', { aed: r.aed.toLocaleString() })}
                    </div>
                  </div>
                  <div className="shrink-0 text-end">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>
                    <div className="mt-1 text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 6 — The price, stated once, at the bottom */}
      <p className="mt-6 text-xs text-slate-500">{t('tok.priceNote')}</p>

    </div>
  )
}
