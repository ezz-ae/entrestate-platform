'use client'

/**
 * CALL THIS LEAD — the button, and the reason it is not one.
 *
 * The Lead Calling screen shipped without a dial button on purpose: the gate
 * refused every call because nothing wrote a consent row, and a button whose
 * every press says "no consent on file" teaches a broker the product is broken
 * when the gate is doing its job. Consent capture landed, the roster gates
 * landed, so the button is owed.
 *
 * IT PREVIEWS BEFORE IT OFFERS. On every change it asks
 * GET /api/calling/preview — a dry run that cannot dial — and renders one of
 * two things: the colleague who would speak, or the single sentence explaining
 * why nobody can. The refusal is the point. "No dated consent record", "it is
 * Friday prayer" and "nobody is trained to 85% yet" have different fixes and
 * different people who fix them, so the card also says WHOSE problem it is:
 * a lead-side block sends the broker to the lead, a roster-side block sends
 * them to the team.
 *
 * The press is guarded twice over. The button only exists when the preview says
 * ready, and POST /api/calling re-runs every gate server-side anyway — this
 * component's opinion is never the authority, only the courtesy.
 */

import { useCallback, useEffect, useState } from 'react'
import { PhoneCall, Loader2, ShieldAlert, UserRound } from 'lucide-react'
import { useT } from '@/lib/i18n/provider'
import { CALL_TYPES, CALL_KEY_PREFIX, type CallType } from '@/lib/freehold/call-templates'

type Lang = 'en' | 'ar' | 'ru'

interface Preview {
  ready: boolean
  member: { id: string; name: string; title: string; rate: number } | null
  alternates: Array<{ id: string; name: string }>
  reason: string | null
  message: string | null
  aboutLead: boolean
}

export function LeadCallCard({ leadId, leadName }: { leadId: string; leadName: string }) {
  const t = useT()
  const [type, setType] = useState<CallType>('first_contact')
  const [language, setLanguage] = useState<Lang>('en')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(
        `/api/calling/preview?leadId=${encodeURIComponent(leadId)}&templateId=${type}&language=${language}`,
        { cache: 'no-store' },
      )
      setPreview((await r.json()) as Preview)
    } catch {
      // A preview that cannot load is not a refusal — say so, rather than
      // rendering a block the lead does not actually have.
      setError(t('lm.call.card.previewFailed'))
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }, [leadId, type, language, t])

  useEffect(() => { void load() }, [load])

  async function place() {
    setPlacing(true); setError(null)
    try {
      const r = await fetch('/api/calling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, templateId: type, language }),
      })
      const data = await r.json() as { placed?: boolean; memberId?: string; message?: string; error?: string }
      if (data.placed) setPlaced(data.memberId ?? null)
      else { setError(data.message || data.error || t('lm.call.card.failed')); void load() }
    } catch {
      setError(t('lm.call.card.failed'))
    } finally {
      setPlacing(false)
    }
  }

  const pill = 'rounded-full border px-3 py-1 text-xs transition-colors'

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04]">
          <PhoneCall className="h-4 w-4 text-slate-300" />
        </div>
        <div className="text-sm font-semibold text-white">{t('lm.call.card.title')}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {CALL_TYPES.map((id) => (
          <button key={id} type="button" onClick={() => setType(id)}
            className={`${pill} ${type === id ? 'border-white/40 bg-white/[0.1] text-white' : 'border-white/[0.1] bg-transparent text-slate-400 hover:text-white'}`}>
            {t(`${CALL_KEY_PREFIX.type}${id}`)}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {(['en', 'ar', 'ru'] as const).map((l) => (
          <button key={l} type="button" onClick={() => setLanguage(l)}
            className={`${pill} font-mono uppercase ${language === l ? 'border-white/40 bg-white/[0.1] text-white' : 'border-white/[0.1] text-slate-500 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />{t('lm.call.card.checking')}
          </div>
        ) : placed ? (
          <div className="text-sm text-emerald-300">{t('lm.call.card.placed', { name: leadName })}</div>
        ) : preview?.ready && preview.member ? (
          <>
            <div className="flex items-center gap-2.5">
              <UserRound className="h-4 w-4 text-slate-400" />
              <div className="text-sm text-white">
                <span className="font-semibold">{preview.member.name}</span>
                <span className="text-slate-400"> · {preview.member.title} · {preview.member.rate}</span>
              </div>
            </div>
            {preview.alternates.length > 0 ? (
              <div className="mt-1.5 font-mono text-[11px] text-slate-500">
                {t('lm.call.card.alsoFree')}: {preview.alternates.map((a) => a.name).join(' · ')}
              </div>
            ) : null}
            <button type="button" onClick={place} disabled={placing}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:-translate-y-px disabled:opacity-60">
              {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
              {t('lm.call.card.place', { name: preview.member.name })}
            </button>
          </>
        ) : (
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-none text-amber-400/80" />
            <div>
              <div className="text-sm leading-relaxed text-slate-300">{preview?.message ?? error}</div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                {preview ? t(preview.aboutLead ? 'lm.call.card.aboutLead' : 'lm.call.card.aboutTeam') : ''}
              </div>
            </div>
          </div>
        )}
        {error && preview?.ready ? <div className="mt-3 text-sm text-amber-300">{error}</div> : null}
      </div>
    </section>
  )
}
