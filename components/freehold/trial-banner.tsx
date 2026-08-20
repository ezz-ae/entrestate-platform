'use client'

/**
 * WHAT THIS WORKSPACE'S TRIAL IS DOING, said once, to the person it concerns.
 *
 * `trial_ends_at` was written from the day this product had tenants and read
 * by nothing, so a brokerage could work the product months past its trial with
 * neither side ever being told. This is the customer half of fixing that; the
 * vendor half is the `chase` list on GET /api/wl/tenants.
 *
 * IT DOES NOT BLOCK ANYTHING, and the copy is careful not to imply otherwise.
 * Nothing is switched off when a trial ends — there is nowhere to pay yet (the
 * reasoning is in lib/tenancy/trial.ts) — so a sentence threatening a cut-off
 * would be a lie this product could not carry out. It asks for a conversation,
 * which is the thing that was actually missing.
 *
 * Renders NOTHING for 'active', 'notOnTrial' and 'unknown'. That last one is
 * where every unparseable date lands, and it is the reason the silent states
 * carry declared-but-empty dictionary entries rather than words: a parse
 * failure must not become a new sentence on a paying customer's screen.
 *
 * Dismissal is per-browser and per-state. Dismissing "ends in 3 days" does not
 * silence "ended" — those are different sentences and the second one is the
 * one somebody needs to see.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, X } from 'lucide-react'
import { useT } from '@/lib/i18n/provider'
import type { TrialState } from '@/lib/tenancy/trial'

/** Where "talk to us" goes. The vendor site owns the conversation. */
const CONTACT = 'https://entrestate.com/business/contact'

const KEY = 'fh_trial_dismissed_v1'

export function TrialBanner({ state }: { state: TrialState }) {
  const t = useT()
  const [dismissed, setDismissed] = useState(true)

  // Starts dismissed and reveals on mount: the server and the browser must
  // agree on the first paint, and localStorage is not readable during render.
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(KEY) === state.kind)
    } catch {
      setDismissed(false) // private mode — show it rather than swallow it
    }
  }, [state.kind])

  if (state.kind !== 'endingSoon' && state.kind !== 'expired') return null
  if (dismissed) return null

  const expired = state.kind === 'expired'

  const headline = expired
    ? t('trial.state.expired')
    : state.daysLeft === 1
      ? t('trial.oneDay')
      : t('trial.state.endingSoon', { days: String(state.daysLeft) })

  const detail = expired
    ? (state.daysSince === 0 ? t('trial.expiredToday') : t('trial.expiredDays', { days: String(state.daysSince) }))
    : null

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-5 py-2.5 text-sm ${
        expired
          ? 'border-amber-500/25 bg-amber-500/[0.07] text-amber-100'
          : 'border-line bg-surface-2/60 text-slate-200'
      }`}
    >
      <Clock className={`h-4 w-4 shrink-0 ${expired ? 'text-amber-400' : 'text-slate-400'}`} />
      <span className="font-medium">{headline}</span>
      {detail && <span className="text-xs opacity-70">{detail}</span>}
      <span className="text-xs opacity-80">
        {expired ? t('trial.expiredBody') : t('trial.endingSoonBody')}
      </span>
      <Link
        href={CONTACT}
        className="ms-auto shrink-0 rounded-full border border-line-strong bg-surface px-3.5 py-1 text-xs font-medium text-white transition hover:border-gold/40"
      >
        {t('trial.cta')}
      </Link>
      <button
        type="button"
        onClick={() => {
          try { localStorage.setItem(KEY, state.kind) } catch { /* private mode */ }
          setDismissed(true)
        }}
        aria-label={t('trial.dismiss')}
        className="shrink-0 rounded p-1 opacity-60 transition hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
