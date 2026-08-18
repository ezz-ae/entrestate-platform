'use client'

/**
 * What the calling rails will and will not do right now.
 *
 * The template library on this page is product IP and renders identically for
 * every tenant. THIS strip is the part that differs per account, and it is a
 * client island for one reason: a broker who reads "ready to call" must be
 * reading the state at the moment they read it, not the state at build time.
 *
 * Nothing here is an estimate. Every number is a count of rows we already
 * hold, so no bound and no Withheld is owed — see lib/freehold/min-evidence.ts
 * for the rule and for what would be owed if any of them were a rate.
 *
 * When the read fails it says so. An empty strip would read as "no numbers,
 * nothing blocked", which is the one sentence a failed read must never say.
 */
import { useEffect, useState } from 'react'
import { Phone, PhoneOff, ShieldAlert, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { StatusPill } from '@/components/freehold/ui'
import { useT } from '@/lib/i18n/provider'

interface Status {
  connection: { connected: boolean }
  providerError: string | null
  counts: {
    callerIdsVerified: number
    callerIdsPending: number
    doNotCall: number
    callsPlaced: number
  }
  blocked: string[]
}

const INTEGRATION_HREF = '/freehold-intelligence/integrations/calling'

export function CallingStatusStrip() {
  const t = useT()
  const [status, setStatus] = useState<Status | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    fetch('/api/calling', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Status) => { if (live) setStatus(d) })
      .catch(() => { if (live) setFailed(true) })
    return () => { live = false }
  }, [])

  if (failed) {
    return (
      <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-5 py-4 text-sm text-red-200">
        {t('lm.call.loadFailed')}
      </div>
    )
  }

  // Deliberately not a spinner: the page below is fully readable without this
  // strip, and a spinner at the top implies the page is not ready yet.
  if (!status) return <div className="h-[104px] rounded-xl border border-line bg-surface" />

  const connected = status.connection.connected
  const verified = status.counts.callerIdsVerified
  const ready = connected && verified > 0

  const headline = !connected ? t('lm.call.notConnected')
    : verified === 0 ? t('lm.call.noNumber')
    : t('lm.call.ready')

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
        {ready
          ? <Phone className="h-4 w-4 shrink-0 text-emerald-400" />
          : <PhoneOff className="h-4 w-4 shrink-0 text-amber-400" />}
        <span className="text-sm font-medium text-slate-200">{headline}</span>
        {!ready && (
          <Link
            href={INTEGRATION_HREF}
            className="ms-auto inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface-2 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-gold/40 hover:text-white"
          >
            {t('lm.call.connectCta')} <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {status.providerError && (
        <div className="flex items-start gap-2 border-b border-line px-5 py-3 text-xs text-amber-200">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{status.providerError}</span>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        {([
          [t('lm.call.statVerified'), status.counts.callerIdsVerified],
          [t('lm.call.statPending'), status.counts.callerIdsPending],
          [t('lm.call.statDnc'), status.counts.doNotCall],
          [t('lm.call.statCalls'), status.counts.callsPlaced],
        ] as const).map(([label, value]) => (
          <div key={label} className="bg-surface px-5 py-3.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</dt>
            {/* tabular-nums so four counters do not jitter against each other */}
            <dd className="mt-1 text-lg font-semibold tabular-nums text-white">{value}</dd>
          </div>
        ))}
      </dl>

      {status.blocked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t('lm.call.state')}
          </span>
          {status.blocked.map((code) => (
            <StatusPill key={code} tone="amber">{t(`lm.call.refusal.${code}`)}</StatusPill>
          ))}
        </div>
      )}
    </div>
  )
}
