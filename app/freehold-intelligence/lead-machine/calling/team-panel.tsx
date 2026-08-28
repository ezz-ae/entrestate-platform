'use client'

/**
 * YOUR VISUAL SALES TEAM — the hiring desk.
 *
 * The catalogue says who could work here; the payroll says who does. Until this
 * panel existed there was no way to move a member between the two, so every
 * call refused with "nobody is employed" and the whole roster was decoration.
 *
 * IT SHOWS THE BLOCKER, NOT A STATUS LIGHT. A member is one of: not hired, on
 * an ads token (answers forms, never calls), hired but under the training
 * threshold, hired and trained but without a voice agent of their own, or ready.
 * Each of those has a different fix and a different person who does it, so the
 * card names the fix rather than colouring a dot.
 *
 * Reads are open to the desk; writes are management-only and the server
 * enforces that — this component simply will not get a 200 for a hire it should
 * not make.
 */

import { useCallback, useEffect, useState } from 'react'
import { Loader2, UserPlus, UserMinus, GraduationCap, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useT } from '@/lib/i18n/provider'

type Term = 'weekly' | 'monthly' | 'yearly' | 'ad_hourly'
type Blocker = 'noneEmployed' | 'noneTrained' | 'noVoice' | 'voiceShared' | null

interface Member {
  id: string; name: string; title: string; tier: 'standard' | 'premium'
  yearsExperience: number; languages: string[]; rate: number
  topSkills: Array<{ skill: string; rate: number }>
  price: { weekly: number; monthly: number; yearly: number; adHourly: number }
  employed: boolean; term: Term | null; trainedLevel: number
  ready: boolean; blocker: Blocker
}

interface Roster { threshold: number; terms: Term[]; members: Member[] }

const HIRE_TERMS: Term[] = ['weekly', 'monthly', 'yearly', 'ad_hourly']

export function TeamPanel() {
  const t = useT()
  const [roster, setRoster] = useState<Roster | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/sales-team', { cache: 'no-store' })
      if (!r.ok) throw new Error()
      setRoster((await r.json()) as Roster)
      setError(null)
    } catch { setError(t('lm.team.loadFailed')) }
  }, [t])

  useEffect(() => { void load() }, [load])

  async function act(memberId: string, body: Record<string, unknown>) {
    setBusy(memberId); setError(null)
    try {
      const r = await fetch('/api/sales-team', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, ...body }),
      })
      const data = await r.json() as { ok?: boolean; message?: string }
      if (!data.ok) setError(data.message || t('lm.team.actionFailed'))
      await load()
    } catch { setError(t('lm.team.actionFailed')) }
    finally { setBusy(null) }
  }

  if (!roster) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />{error ?? t('lm.team.loading')}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error ? <div className="text-sm text-amber-300">{error}</div> : null}
      {roster.members.map((m) => (
        <div key={m.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-sm font-semibold text-white">{m.name}</span>
            <span className="font-mono text-[11px] text-slate-500">
              {m.title} · {m.yearsExperience}y · {m.languages.join('/')}
            </span>
            <span className="ms-auto rounded-full border border-white/[0.12] px-2 py-0.5 font-mono text-[11px] tabular-nums text-slate-300">
              {m.rate}
            </span>
          </div>

          <div className="mt-1.5 font-mono text-[11px] text-slate-500">
            {m.topSkills.map((s) => `${s.skill} ${s.rate}`).join('  ·  ')}
          </div>

          {/* The blocker, in words. */}
          <div className="mt-3 flex items-start gap-2">
            {m.ready
              ? <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-emerald-400/80" />
              : <ShieldAlert className="mt-0.5 h-4 w-4 flex-none text-slate-500" />}
            <div className="text-[13px] leading-relaxed text-slate-300">
              {m.ready
                ? t('lm.team.ready')
                : m.blocker === 'noneEmployed'
                  ? (m.term === 'ad_hourly' ? t('lm.team.adsOnly') : t('lm.team.notHired'))
                  : m.blocker === 'noneTrained'
                    ? t('lm.team.training', { level: String(m.trainedLevel), threshold: String(roster.threshold) })
                    : m.blocker === 'voiceShared' ? t('lm.team.voiceShared') : t('lm.team.noVoice')}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {!m.employed || m.term === 'ad_hourly' ? (
              HIRE_TERMS.map((term) => (
                <button key={term} type="button" disabled={busy === m.id}
                  onClick={() => act(m.id, { action: 'hire', term })}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
                    m.term === term ? 'border-white/40 bg-white/[0.1] text-white' : 'border-white/[0.12] text-slate-400 hover:text-white'}`}>
                  <UserPlus className="h-3 w-3" />
                  {t(`lm.team.term.${term}`)}
                </button>
              ))
            ) : (
              <>
                <span className="rounded-full border border-white/[0.12] px-3 py-1 font-mono text-[11px] text-slate-400">
                  {t(`lm.team.term.${m.term ?? 'monthly'}`)}
                </span>
                <button type="button" disabled={busy === m.id} onClick={() => act(m.id, { action: 'end' })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] px-3 py-1 text-xs text-slate-400 transition-colors hover:border-amber-400/40 hover:text-amber-300 disabled:opacity-50">
                  <UserMinus className="h-3 w-3" />{t('lm.team.end')}
                </button>
              </>
            )}

            {m.employed && m.term !== 'ad_hourly' ? (
              <button type="button" disabled={busy === m.id}
                onClick={() => act(m.id, { action: 'train', level: Math.min(100, m.trainedLevel + 5) })}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] px-3 py-1 text-xs text-slate-400 transition-colors hover:text-white disabled:opacity-50">
                <GraduationCap className="h-3 w-3" />{t('lm.team.train')}
              </button>
            ) : null}

            {busy === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" /> : null}
          </div>
        </div>
      ))}
    </div>
  )
}
