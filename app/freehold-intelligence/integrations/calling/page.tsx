'use client'

/**
 * Integrations → Calling.
 *
 * The screen's job is to be honest about three things: whether a provider is
 * connected, which numbers may originate a call, and what is refused while
 * either of those is missing. Nothing here estimates anything — every number
 * shown is a count of rows the server already holds, and when the provider
 * will not answer, the screen says so rather than rendering an empty list that
 * reads as "you have no numbers".
 */

import { useState, useEffect, useCallback } from 'react'
import {
  PhoneCall, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, XCircle,
  ShieldCheck, ShieldAlert, Clock, PhoneOff, Plus, Trash2,
} from 'lucide-react'
import { useT } from '@/lib/i18n/provider'
import { SetupGuide } from '@/components/freehold/setup-guide'

type CallerIdRow = {
  e164: string
  origin: 'tenant_verified' | 'platform'
  providerNumberId: string | null
  verifiedAt: string | null
  label: string | null
}

type Status = {
  connection: { connected: boolean; source: 'env' | 'db' | null; agentId: string | null }
  providerError: string | null
  callerIds: CallerIdRow[]
  counts: { callerIdsVerified: number; callerIdsPending: number; doNotCall: number; callsPlaced: number }
  callWindows: string
  timeZone: string
  blocked: string[]
}

export default function CallingPage() {
  const t = useT()
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [apiKey, setApiKey] = useState('')
  const [agentId, setAgentId] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const [newNumber, setNewNumber] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [numberErr, setNumberErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/calling', { cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      setStatus(await res.json())
      setErr('')
    } catch {
      setErr(t('pcall.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { load() }, [load])

  async function connect() {
    if (!apiKey.trim() || !agentId.trim()) return
    setConnecting(true)
    setErr('')
    try {
      const res = await fetch('/api/calling/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim(), agentId: agentId.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || t('pcall.errGeneric'))
      // The key is never returned by the server, and it does not stay in this
      // form either — a page left open on a broker's desk should not hold it.
      setApiKey('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('pcall.errGeneric'))
    } finally {
      setConnecting(false)
    }
  }

  async function disconnect() {
    await fetch('/api/calling/credentials', { method: 'DELETE' }).catch(() => {})
    await load()
  }

  async function addNumber() {
    if (!newNumber.trim()) return
    setNumberErr('')
    const res = await fetch('/api/calling/caller-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: newNumber.trim(), label: newLabel.trim() || null }),
    })
    if (!res.ok) { setNumberErr(t('pcall.badNumber')); return }
    setNewNumber('')
    setNewLabel('')
    await load()
  }

  async function removeNumber(e164: string) {
    await fetch(`/api/calling/caller-ids?number=${encodeURIComponent(e164)}`, { method: 'DELETE' }).catch(() => {})
    await load()
  }

  const connected = status?.connection.connected ?? false
  const callerIds = status?.callerIds ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">

      {/* Header */}
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gold/10">
              <PhoneCall className="h-4 w-4 text-gold" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{t('pcall.title')}</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">{t('pcall.subtitle')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-slate-400 transition hover:text-slate-200 disabled:opacity-40">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> {t('pcall.refresh')}
          </button>
          {connected && (
            <button onClick={disconnect}
              className="flex items-center gap-1.5 rounded-full border border-red-400/20 px-3 py-1.5 text-xs text-red-400/70 transition hover:border-red-400/40 hover:text-red-400">
              <XCircle className="h-3 w-3" /> {t('pcall.disconnect')}
            </button>
          )}
        </div>
      </div>

      <SetupGuide steps={[
        { key: 'pcall.guide.1', path: 'elevenlabs.io → Conversational AI → Agents' },
        { key: 'pcall.guide.2', path: 'Profile → API keys' },
        { key: 'pcall.guide.3', path: 'Conversational AI → Phone numbers' },
      ]} />

      {/* Connection state — the first thing a person needs to know. */}
      <div className={`mb-5 flex items-start gap-2.5 rounded-[12px] border px-4 py-3 ${
        connected ? 'border-emerald-400/20 bg-emerald-400/[0.04]' : 'border-amber-400/25 bg-amber-400/[0.05]'
      }`}>
        {connected
          ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />}
        <div className="min-w-0">
          <div className={`text-sm ${connected ? 'text-emerald-400/90' : 'text-amber-300'}`}>
            {connected ? t('pcall.connected') : t('pcall.notConnected')}
          </div>
          {connected && (
            <div className="mt-0.5 text-xs text-slate-600">
              {status?.connection.source === 'env' ? t('pcall.sourceEnv') : t('pcall.sourceDb')}
            </div>
          )}
        </div>
      </div>

      {status?.providerError && (
        <div className="mb-5 flex items-start gap-2 rounded-[10px] border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2.5 text-xs text-amber-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{t('pcall.providerSilent')} <span className="text-slate-600">{status.providerError}</span></span>
        </div>
      )}

      {/* Connect form */}
      {!connected && (
        <div className="mb-6 space-y-3 rounded-[18px] border border-gold/15 bg-surface p-5">
          <div>
            <div className="mb-1 text-sm font-medium text-slate-300">{t('pcall.apiKeyLabel')}</div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={t('pcall.apiKeyPlaceholder')}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-[10px] border border-line bg-surface-2 px-3 py-2.5 pe-9 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-gold/40"
              />
              <button onClick={() => setShowKey((v) => !v)} aria-label={t('pcall.apiKeyLabel')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-300">{t('pcall.agentLabel')}</div>
            <input
              type="text"
              placeholder={t('pcall.agentPlaceholder')}
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && connect()}
              className="w-full rounded-[10px] border border-line bg-surface-2 px-3 py-2.5 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-gold/40"
            />
          </div>
          <button onClick={connect} disabled={!apiKey.trim() || !agentId.trim() || connecting}
            className="w-full rounded-[10px] bg-gold py-2.5 text-sm font-semibold text-ink transition hover:bg-gold-bright disabled:opacity-40">
            {connecting ? t('pcall.verifying') : t('pcall.connect')}
          </button>
          {err && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-400/20 bg-red-400/[0.05] px-3 py-2.5 text-xs text-red-400/90">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {err}
            </div>
          )}
          <p className="text-xs text-slate-600">{t('pcall.keyNote')}</p>
        </div>
      )}

      {/* Counts — rows we hold, not estimates. */}
      {status && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t('pcall.statVerified'), value: status.counts.callerIdsVerified, Icon: ShieldCheck, color: 'text-emerald-400' },
            { label: t('pcall.statPending'),  value: status.counts.callerIdsPending,  Icon: ShieldAlert, color: 'text-amber-400'   },
            { label: t('pcall.statDnc'),      value: status.counts.doNotCall,         Icon: PhoneOff,    color: 'text-red-400'     },
            { label: t('pcall.statCalls'),    value: status.counts.callsPlaced,       Icon: PhoneCall,   color: 'text-slate-400'   },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="rounded-[14px] border border-line bg-surface p-4">
              <Icon className={`h-4 w-4 ${color}`} />
              <div className="mt-2 text-[20px] font-semibold text-white">{value}</div>
              <div className="mt-0.5 text-xs text-slate-600">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Caller ID */}
      <section className="mb-5 rounded-[18px] border border-line bg-surface p-5">
        <div className="text-sm font-semibold text-white">{t('pcall.numbersTitle')}</div>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{t('pcall.numbersLead')}</p>

        <div className="mt-4 divide-y divide-line overflow-hidden rounded-[12px] border border-line">
          {callerIds.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-600">{t('pcall.noNumbers')}</div>
          ) : callerIds.map((c) => {
            const ok = !!c.verifiedAt && !!c.providerNumberId
            return (
              <div key={c.e164} className="flex items-center gap-3 px-4 py-3">
                {ok
                  ? <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                  : <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />}
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm text-slate-100">{c.e164}</div>
                  <div className="text-xs text-slate-600">
                    {c.label ? `${c.label} · ` : ''}
                    {c.origin === 'platform' ? t('pcall.originPlatform') : t('pcall.originOwn')}
                  </div>
                  {!ok && <div className="mt-1 text-xs text-amber-300/80">{t('pcall.pendingNote')}</div>}
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  ok ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400'
                     : 'border-amber-400/20 bg-amber-400/10 text-amber-400'
                }`}>
                  {ok ? t('pcall.verified') : t('pcall.pending')}
                </span>
                {c.origin !== 'platform' && (
                  <button onClick={() => removeNumber(c.e164)} aria-label={t('pcall.remove')}
                    className="shrink-0 text-slate-600 transition hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Add a claim. This records the number; the provider decides verification. */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="tel"
            placeholder={t('pcall.numberPlaceholder')}
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            className="flex-1 rounded-[10px] border border-line bg-surface-2 px-3 py-2 font-mono text-sm text-white placeholder-white/20 outline-none focus:border-gold/40"
          />
          <input
            type="text"
            placeholder={t('pcall.labelPlaceholder')}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="flex-1 rounded-[10px] border border-line bg-surface-2 px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-gold/40"
          />
          <button onClick={addNumber} disabled={!newNumber.trim()}
            className="flex items-center justify-center gap-1.5 rounded-[10px] border border-line px-4 py-2 text-sm text-slate-400 transition hover:text-slate-200 disabled:opacity-40">
            <Plus className="h-3.5 w-3.5" /> {t('pcall.add')}
          </button>
        </div>
        {numberErr && <p className="mt-2 text-xs text-red-400/90">{numberErr}</p>}
      </section>

      {/* Calling hours */}
      <section className="mb-5 rounded-[18px] border border-line bg-surface p-5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <div className="text-sm font-semibold text-white">{t('pcall.windowTitle')}</div>
        </div>
        <div className="mt-2 font-mono text-sm text-slate-400">
          {status?.callWindows ?? '—'} <span className="text-slate-600">{status?.timeZone ?? ''}</span>
        </div>
        <p className="mt-1 text-xs text-slate-600">{t('pcall.windowWhy')}</p>
      </section>

      {/* What is refused, and what is refused right now */}
      <section className="rounded-[18px] border border-line bg-surface p-5">
        {status && status.blocked.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-red-400/80">{t('pcall.blockedTitle')}</div>
            <ul className="mt-2 space-y-1.5">
              {status.blocked.includes('not_connected') && (
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <PhoneOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                  {t('pcall.blockedNotConnected')}
                </li>
              )}
              {status.blocked.includes('caller_id_none') && (
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                  {t('pcall.blockedNoNumber')}
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">{t('pcall.gatesTitle')}</div>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-400">
          <li className="flex items-start gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-600" />{t('pcall.gateConsent')}</li>
          <li className="flex items-start gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-600" />{t('pcall.gateWindow')}</li>
          <li className="flex items-start gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-600" />{t('pcall.gateCadence')}</li>
          <li className="flex items-start gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-600" />{t('pcall.gateDnc')}</li>
          <li className="flex items-start gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-600" />{t('pcall.gateCallerId')}</li>
        </ul>
      </section>

    </div>
  )
}
