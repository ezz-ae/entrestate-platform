import type { Metadata } from 'next'
import { Section, Eyebrow, Display, H2, Lede, ButtonLink, Mono } from '@/components/business/ui'
import {
  Browser, Chat, GlowBand, NextStep, MiniCRM,
  PunchGrid, StatBand,
} from '@/components/business/visuals'
import { Holder, Keyword, KeywordSub, LearnMore } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'
import { SALES_TEAM, totalRate, READINESS_THRESHOLD } from '@/lib/freehold/visual-sales-team'

/**
 * Leadformer — the product page for the conversational lead form.
 *
 * It lives at /business/leadformer and answers on leadformer.entrestate.com
 * (PRODUCT_DOORS in lib/tenancy/vendor-host.ts, the name held in
 * lib/tenancy/reserved.ts). Inside Entrestate rather than on its own domain
 * while it is real-estate-only: a door costs nothing, and a separate deployment
 * would cost the reuse of this engine.
 *
 * The team section READS THE REAL CATALOG (SALES_TEAM, totalRate) rather than
 * restating it in copy. A marketing page that hardcodes its own numbers is a
 * page that drifts from the product the week after it ships; this one cannot —
 * a rate changed in lib/freehold/visual-sales-team.ts changes here too.
 */

export const metadata: Metadata = {
  title: 'Leadformer',
  description:
    'A lead form that talks back. Your Visual Sales Team greets every enquiry by name, qualifies it in conversation, and turns the good ones into calls. 14-day trial, no card.',
  alternates: { canonical: '/business/leadformer' },
}

/* The form, as the lead experiences it: no fields — a conversation that happens
   to collect everything a form would have asked for. */
const FORM_THREAD = [
  { from: 'agent' as const, text: "Hi — I'm the form. What should I call you?", time: '9:02 PM' },
  { from: 'lead' as const, text: 'Mohamed', time: '9:02 PM' },
  { from: 'agent' as const, text: 'Nice to meet you, Mohamed. Buying to live in, or to invest?', time: '9:02 PM' },
  { from: 'lead' as const, text: 'Investment — something with good yield', time: '9:03 PM' },
  { from: 'system' as const, text: 'Intent: investor · yield-led — Saeed takes over' },
  { from: 'agent' as const, text: 'Then Marina Vista is the one to see — 6.8% projected. Shall I put you on a call now?', time: '9:03 PM' },
]

export default function LeadformerPage() {
  const next = nextInTour('/business/leadformer')!
  // Ordered by the same headline the operator searches on, so the page shows
  // the roster the product would show.
  const team = [...SALES_TEAM].sort((a, b) => totalRate(b) - totalRate(a))

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <Section className="pb-16 pt-16 lg:pb-24 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <Eyebrow>Leadformer · the form that talks back</Eyebrow>
            <div className="mt-5 max-w-[44rem]">
              <Display>Turn forms into conversations.</Display>
            </div>
            <div className="mt-7 max-w-[46ch]">
              <Lede>
                A lead form with your Visual Sales Team inside it. It greets by name, asks what a
                good salesperson would ask, and hands you a lead that already told you everything.
              </Lede>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/signup">Start a 14-day trial</ButtonLink>
              <ButtonLink href="/business/pricing" variant="ghost">See pricing</ButtonLink>
            </div>
          </div>
          <Browser title="marina-heights.ae/enquire">
            <Chat messages={FORM_THREAD} title="Leadform — Marina Heights" chip="no fields" />
          </Browser>
        </div>
      </Section>

      {/* ── The scene ───────────────────────────────────────────────────── */}
      <GlowBand>
        <div className="mx-auto max-w-[62ch] text-center">
          <H2>A form asks nine questions. Eight people leave.</H2>
          <div className="mt-6">
            <Lede>
              This one asks the way a person would — one thing at a time, and only what your answer
              made worth asking.
            </Lede>
          </div>
        </div>
      </GlowBand>

      {/* ── The system, holder by holder ────────────────────────────────── */}
      <Section className="py-16 lg:py-24">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Holder
            tone="green"
            visual={
              <Browser title="marina-heights.ae/enquire">
                <Chat messages={FORM_THREAD} title="Leadform — Marina Heights" chip="" />
              </Browser>
            }
          >
            <Keyword>No fields. A conversation.</Keyword>
            <KeywordSub>
              Every answer chooses the next question, so nobody is asked what they already told you.
            </KeywordSub>
          </Holder>

          <Holder tone="gold" visual={<TeamRoster team={team} />}>
            <Keyword>A team, not a chatbot.</Keyword>
            <KeywordSub>
              Each one has a title, years, the industries they know, and three rated skills. Hire by
              reading the card — search for an 88 who is strong on product and speaks French.
            </KeywordSub>
          </Holder>

          <Holder
            tone="blue"
            visual={
              <Browser title="app.yourbrokerage.ae/crm">
                <MiniCRM />
              </Browser>
            }
          >
            <Keyword>The lead arrives already qualified.</Keyword>
            <KeywordSub>
              Not a name and a number — the whole conversation, the intent it revealed, and who it
              belongs to.
            </KeywordSub>
            <LearnMore href="/business/docs/lead-flow" label="See how leads flow" />
          </Holder>

          <Holder>
            <Keyword>And when it should be a call, it becomes one.</Keyword>
            <KeywordSub>
              A hired member stays online and takes the call itself — once trained past{' '}
              {READINESS_THRESHOLD}%, never before.
            </KeywordSub>
          </Holder>
        </div>
      </Section>

      {/* ── The rules that keep it honest ───────────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        <PunchGrid
          items={[
            {
              title: 'It says it is an AI.',
              body: 'Ask who you are talking to and it tells you, every time — with report-an-issue and delete-my-data.',
            },
            {
              title: 'It never invents a number.',
              body: 'Prices, yields and dates come from your own stock, or it says it does not know.',
            },
            {
              title: 'Who a lead is never decides who sees an ad.',
              body: 'The conversation picks who answers. It never becomes ad targeting.',
            },
          ]}
        />
      </Section>

      {/* ── Facts ───────────────────────────────────────────────────────── */}
      <StatBand
        items={[
          { value: '15 min', label: 'To your first form', note: 'No setup call. Write the brief, publish the form.' },
          { value: `${READINESS_THRESHOLD}%`, label: 'Before it may call', note: 'A member trains to readiness before it ever dials.' },
          { value: '3', label: 'Languages', note: 'English · العربية · Русский' },
          { value: 'Fixed', label: 'Voices', note: 'A voice never changes between turns — it is a call, not a chat.' },
        ]}
      />

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}

/** The roster, rendered from the real catalog — hiring cards, not copy. */
function TeamRoster({ team }: { team: typeof SALES_TEAM }) {
  return (
    <div className="overflow-hidden rounded-lg bg-chrome ring-1 ring-white/[0.07]" dir="ltr">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
        <span className="text-[10.5px] font-medium text-white">Visual Sales Team</span>
        <span className="font-mono text-[8.5px] text-ink-faint">{team.length} available</span>
      </div>
      <div className="divide-y divide-white/[0.05]">
        {team.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-3.5 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-[11px] font-medium text-white">{m.name}</span>
                <span className="truncate font-mono text-[8.5px] text-ink-faint">
                  {m.title} · {m.yearsExperience}y
                </span>
              </div>
              <div className="mt-0.5 truncate font-mono text-[8.5px] text-ink-faint">
                {m.topSkills.map((s) => `${s.skill} ${s.rate}`).join('  ·  ')}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-[#3B82F6]/10 px-2 py-0.5 font-mono text-[9px] tabular-nums text-[#3B82F6] ring-1 ring-[#3B82F6]/25">
              {totalRate(m)}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.06] px-3.5 py-2">
        <Mono className="text-[8.5px] text-ink-faint">search: total ≥ 88 · skill ≥ 80 · speaks fr</Mono>
      </div>
    </div>
  )
}
