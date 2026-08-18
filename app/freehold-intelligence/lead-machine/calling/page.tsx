/**
 * LEAD CALLING — the call library, inside the Machine.
 *
 * It sits in the Machine's own nav rather than under Integrations because a
 * call is a step in the loop the Machine runs, not a connection you configure
 * once: ads make a lead, the call works it, the ending writes back to the CRM
 * and teaches the next campaign who is worth buying. Integrations → Calling is
 * where the provider and the number are connected; this is where the calls
 * themselves are read.
 *
 * The seven templates are pure constants with no I/O, so they render on the
 * server and the 1,300-line library never reaches the browser. Only the status
 * strip is a client island, because only the status is per-account and live.
 *
 * WHAT IS DELIBERATELY NOT HERE YET: a button that dials. POST /api/calling
 * exists and refuses every call today, because nothing writes a consent row —
 * see lib/calling/gates.ts. Putting a dial button on a screen whose every
 * press returns "no consent on file" would teach brokers that the product is
 * broken, when in fact the gate is doing its job. The button lands with the
 * consent capture, in one change, so the first press can succeed.
 */
import { PhoneCall, Clock, Mic, Braces } from 'lucide-react'
import { PageHeader, Panel, PanelHeader, Section, StatusPill } from '@/components/freehold/ui'
import { getServerT } from '@/lib/i18n/server'
import {
  CALL_TEMPLATES, CALL_BRANCHES, CALL_KEY_PREFIX, CALL_WINDOWS, SCRIPT_TOKENS, VOICES,
  type CallBranch,
} from '@/lib/freehold/call-templates'
import { CallingStatusStrip } from './status-strip'

export const dynamic = 'force-dynamic'

/** Each branch reads as what it is. Hostile is red because it ends the calling
 *  relationship for good, and a broker scanning a column should see that. */
const BRANCH_TONE: Record<CallBranch, 'green' | 'amber' | 'neutral' | 'red'> = {
  interested: 'green',
  notNow: 'amber',
  wrongPerson: 'neutral',
  hostile: 'red',
  priceTooHigh: 'amber',
}

const HHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export default async function CallingPage() {
  const { t } = await getServerT()

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      <PageHeader
        eyebrow={t('lm.hub.eyebrow')}
        Icon={PhoneCall}
        title={t('lm.call.title')}
        subtitle={t('lm.call.subtitle')}
      />

      <div className="mt-8">
        <CallingStatusStrip />
      </div>

      {/* ── The gate, before the library, because it is what decides whether
             any of the library ever gets spoken. ─────────────────────────── */}
      <Section className="mt-10" title={t('lm.call.gate')}>
        <Panel>
          <ul className="divide-y divide-line">
            {(['consent', 'dnc', 'hours', 'cadence', 'callerId'] as const).map((k) => (
              <li key={k} className="px-5 py-3 text-sm text-slate-300">{t(`lm.call.gate.${k}`)}</li>
            ))}
          </ul>
          <p className="border-t border-line bg-surface-2/40 px-5 py-3 text-xs leading-relaxed text-slate-400">
            {t('lm.call.gateNote')}
          </p>
        </Panel>
      </Section>

      {/* ── The seven calls ──────────────────────────────────────────────── */}
      <Section className="mt-10" title={t('lm.call.templates')} description={t('lm.call.templatesLead')}>
        <div className="space-y-3">
          {CALL_TEMPLATES.map((tpl) => (
            <Panel key={tpl.id}>
              <PanelHeader
                title={t(`${CALL_KEY_PREFIX.type}${tpl.id}`)}
                icon={<PhoneCall className="h-3.5 w-3.5 text-gold" />}
                action={
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {t('lm.call.maxDuration', { min: String(Math.round(tpl.maxDurationSec / 60)) })}
                  </span>
                }
              />

              <div className="space-y-4 px-5 py-4">
                <Field label={t('lm.call.objective')}>{tpl.objective}</Field>
                {/* Scripts are shown verbatim, in English, because English is
                    the master the voice vendor is briefed from. Translating
                    them on screen would show the operator a script nobody
                    speaks. */}
                <Field label={t('lm.call.opening')} quiet>{tpl.opening}</Field>
                <Field label={t('lm.call.consent')} quiet>{tpl.consentLine}</Field>

                <div>
                  <Label>{t('lm.call.captures')}</Label>
                  <ul className="mt-2 space-y-1.5">
                    {tpl.capture.map((c) => (
                      <li key={c.field} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-slate-300">
                        <span>{c.question}</span>
                        <StatusPill tone={c.required ? 'gold' : 'neutral'}>
                          {c.required ? t('lm.call.required') : t('lm.call.optional')}
                        </StatusPill>
                        <span className="text-xs text-slate-500">
                          {'column' in c.writeTo
                            ? t('lm.call.writesTo', { where: c.writeTo.column })
                            : t('lm.call.derived', { where: c.writeTo.derived })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Label>{t('lm.call.endings')}</Label>
                  <div className="mt-2 space-y-2">
                    {CALL_BRANCHES.map((b) => {
                      const close = tpl.close[b]
                      return (
                        <div key={b} className="rounded-lg border border-line bg-surface-2/40 px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill tone={BRANCH_TONE[b]}>
                              {t(`${CALL_KEY_PREFIX.branch}${b}`)}
                            </StatusPill>
                            <span className="text-xs text-slate-500">
                              {close.crm.stopCalling
                                ? t('lm.call.stopCalling')
                                : close.crm.callBackInDays === null
                                  ? t('lm.call.noCallBack')
                                  : t('lm.call.callBack', { days: String(close.crm.callBackInDays) })}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-slate-300">{close.say}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {t('lm.call.crmNext', { next: close.crm.next })}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </Section>

      {/* ── Voices, hours, tokens ────────────────────────────────────────── */}
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Section title={t('lm.call.voices')} description={t('lm.call.voicesLead')}>
          <Panel>
            <ul className="divide-y divide-line">
              {VOICES.map((v) => (
                <li key={v.id} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Mic className="h-3.5 w-3.5 text-gold" />
                    <span className="font-mono text-xs text-slate-200">{v.id}</span>
                    {v.languages.map((l) => (
                      <StatusPill key={l} tone="neutral">{l.toUpperCase()}</StatusPill>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{v.use}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </Section>

        <div className="space-y-4">
          <Section title={t('lm.call.hours')} description={t('lm.call.hoursZone')}>
            <Panel>
              <ul className="divide-y divide-line">
                {CALL_WINDOWS.map((w) => (
                  <li key={w.day} className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm">
                    <span className="uppercase tracking-wide text-slate-400">{w.day}</span>
                    <span className="font-mono tabular-nums text-slate-200">
                      {w.segments.map((s) => `${HHMM(s.fromMin)}–${HHMM(s.toMin)}`).join('  ·  ')}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </Section>

          <Section title={t('lm.call.tokensPlaceholder')}>
            <Panel>
              <div className="flex flex-wrap gap-2 px-5 py-4">
                {SCRIPT_TOKENS.map((tok) => (
                  <span key={tok} className="inline-flex items-center gap-1 rounded-md border border-line-strong bg-surface-2 px-2 py-1 font-mono text-xs text-slate-300">
                    <Braces className="h-3 w-3 text-slate-500" />{tok}
                  </span>
                ))}
              </div>
              <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-slate-400">
                {t('lm.call.tokensNote')}
              </p>
            </Panel>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{children}</div>
  )
}

/** `quiet` marks the lines the caller actually speaks — set apart from the
 *  desk's own description of the call so the two are never confused. */
function Field({ label, children, quiet }: { label: string; children: React.ReactNode; quiet?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <p className={`mt-1.5 text-sm leading-relaxed ${quiet ? 'rounded-lg border border-line bg-surface-2/40 px-4 py-3 text-slate-400' : 'text-slate-200'}`}>
        {children}
      </p>
    </div>
  )
}
