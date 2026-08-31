'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/i18n/provider'
import { bandOf, RATE_OPEN_CAP, RATE_MASTER } from '@/lib/freehold/lead-rate'

/**
 * ENGINE 06 ON THE SCREEN — the Rate as a badge on the row and a card on the
 * lead, in words, never as a number alone.
 *
 * The number is the control signal; the reason under it is what makes a
 * broker trust it ("peak — the broker's 5-star call", "8 — came back for
 * the same thing"). A lead the engine has not evaluated says "New" — the
 * spec's no-fake-ratings rule: the raw state, never an estimate.
 *
 * Every reason and band code is rendered through the crm dictionary;
 * scripts/dynamic-keys-test.ts holds the two families to their words.
 */

const BAND_TONE: Record<string, string> = {
  blocked: 'border-line bg-surface-2 text-slate-500',
  avoid: 'border-red-400/40 bg-red-400/10 text-red-300',
  ingest: 'border-line-strong bg-surface-2 text-slate-300',
  engaged: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  peak: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300',
  won: 'border-gold/50 bg-gold/10 text-gold',
  master: 'border-violet-400/50 bg-violet-400/10 text-violet-300',
}

function fmt(rate: number): string {
  return Number.isInteger(rate) ? String(rate) : rate.toFixed(1)
}

/** Minutes left on a deadline, or null when none / passed. */
function minutesLeft(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - now
  if (!Number.isFinite(ms)) return null
  return ms > 0 ? Math.ceil(ms / 60_000) : 0
}

export function LeadRateBadge({
  rate, reason, neglectDeadlineAt,
}: { rate: number | null | undefined; reason?: string | null; neglectDeadlineAt?: string | null }) {
  const t = useT()
  const [now, setNow] = useState(0)
  useEffect(() => {
    setNow(Date.now())
    if (!neglectDeadlineAt) return
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [neglectDeadlineAt])

  const band = bandOf(rate ?? null)
  const left = now ? minutesLeft(neglectDeadlineAt, now) : null
  const title = reason ? t(`crm.rate.reason.${reason}`) : t('crm.rate.new')
  return (
    <span className="inline-flex items-center gap-1">
      <span
        title={`${t('crm.rate.label')}: ${title}`}
        className={`inline-flex h-5 min-w-7 items-center justify-center rounded-md border px-1 text-[10px] font-semibold tabular-nums ${band ? BAND_TONE[band] : 'border-line bg-surface-2 text-slate-600'}`}
      >
        {rate === null || rate === undefined ? t('crm.rate.new') : fmt(rate)}
      </span>
      {left !== null && (
        <span
          title={t('crm.rate.deadline', { minutes: String(left) })}
          className={`inline-flex h-5 items-center rounded-md border px-1 text-[10px] font-semibold tabular-nums ${
            left > 0 ? 'border-red-400/50 bg-red-400/10 text-red-300 animate-pulse' : 'border-line bg-surface-2 text-slate-500'
          }`}
        >
          {left > 0 ? `${left}m` : t('crm.rate.deadlinePassed')}
        </span>
      )}
    </span>
  )
}

export function LeadRateCard({
  leadId, rate, reason, masterLead, convergentAt, neglectDeadlineAt, seedQuarantinedAt, canMaster,
}: {
  leadId: string
  rate: number | null
  reason: string | null
  masterLead: boolean
  convergentAt: string | null
  neglectDeadlineAt: string | null
  seedQuarantinedAt: string | null
  canMaster: boolean
}) {
  const t = useT()
  const [current, setCurrent] = useState<{ rate: number | null; reason: string | null; master: boolean }>({ rate, reason, master: masterLead })
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(0)
  useEffect(() => {
    setNow(Date.now())
    if (!neglectDeadlineAt) return
    const id = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(id)
  }, [neglectDeadlineAt])

  const band = bandOf(current.rate)
  const left = now ? minutesLeft(neglectDeadlineAt, now) : null

  async function toggleMaster() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/freehold/leads/rate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, masterLead: !current.master }),
      })
      if (res.ok) {
        const d = (await res.json()) as { rate: number; reason: string }
        setCurrent({ rate: d.rate, reason: d.reason, master: !current.master })
      }
    } finally { setBusy(false) }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">{t('crm.rate.title')}</div>
          <div className="mt-2 flex items-end gap-2">
            <span className={`text-[32px] font-semibold leading-none tabular-nums ${band === 'won' ? 'text-gold' : band === 'peak' ? 'text-emerald-300' : band === 'master' ? 'text-violet-300' : band === 'avoid' ? 'text-red-300' : 'text-white'}`}>
              {current.rate === null ? t('crm.rate.new') : fmt(current.rate)}
            </span>
            {current.rate !== null && <span className="mb-0.5 text-sm text-slate-500">/{RATE_MASTER}</span>}
            {band && (
              <span className={`mb-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${BAND_TONE[band]}`}>
                {t(`crm.rate.band.${band}`)}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-300">
            {current.reason ? t(`crm.rate.reason.${current.reason}`) : t('crm.rate.notYet')}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t('crm.rate.explain', { cap: String(RATE_OPEN_CAP) })}</p>
        </div>
        {canMaster && (
          <button
            type="button"
            onClick={() => void toggleMaster()}
            disabled={busy}
            className={`rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-50 ${
              current.master
                ? 'border-violet-400/50 bg-violet-400/10 text-violet-200 hover:bg-violet-400/20'
                : 'border-line bg-surface-2 text-slate-400 hover:text-slate-200'
            }`}
          >
            {current.master ? t('crm.rate.master.unmark') : t('crm.rate.master.mark')}
          </button>
        )}
      </div>

      {convergentAt && (
        <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
          left !== null && left > 0 ? 'border-red-400/40 bg-red-400/[0.07] text-red-200' : 'border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-200'
        }`}>
          <span className="font-semibold">{t('crm.rate.convergent')}</span>
          {left !== null && left > 0 && <span>· {t('crm.rate.deadline', { minutes: String(left) })}</span>}
          {left === 0 && <span>· {t('crm.rate.deadlinePassed')}</span>}
        </div>
      )}
      {seedQuarantinedAt && (
        <div className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200">
          {t('crm.rate.quarantined')}
        </div>
      )}
    </div>
  )
}
