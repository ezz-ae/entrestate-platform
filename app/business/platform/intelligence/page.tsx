import type { Metadata } from 'next'
import { Section, Band, Display, Lede, SectionHeading } from '@/components/business/ui'
import { Ledger, PunchGrid, Chapter, NextStep } from '@/components/business/visuals'
import { Holder, Keyword, KeywordSub } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Intelligence',
  description:
    'The assistant reads your pipeline and drafts the work. It never spends without your yes, and it never invents a number.',
  alternates: { canonical: '/business/platform/intelligence' },
}

/* Real asks a broker types into the assistant bar — the product's own voice. */
const ASKS = [
  'Triage my overdue follow-ups and draft the next message for each.',
  'Review my new leads and tell me which to call first, and why.',
]

export default function IntelligencePage() {
  const next = nextInTour('/business/platform/intelligence')!
  return (
    <>
      {/* This page's claim is discipline, so the first visual is the audit
          trail — not a chat window. */}
      <Section className="pb-16 pt-16 lg:pb-20 lg:pt-24">
        <Chapter n={6} total={7} label="Intelligence" />
        <div className="mt-10 grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="max-w-[44rem]">
              <Display>An assistant that knows its place.</Display>
            </div>
            <div className="mt-6 max-w-[46ch]">
              <Lede>
                It reads your pipeline. It drafts your replies. It never spends without your yes.
              </Lede>
            </div>
          </div>
          <Ledger
            className="w-full"
            rows={[
              { time: '09:41', event: 'paused Creekside One carousel — you said yes in chat' },
              {
                time: '09:42',
                event: 'budget +AED 90 → Marina Vista video — within the limit you set',
                amount: '+AED 90',
              },
              { time: '11:05', event: 'drafted WhatsApp reply for Fatima A. — yours to send' },
              { time: '13:20', event: 'resume Business Bay ads — held, waiting for your yes' },
            ]}
          />
        </div>
      </Section>

      {/* Refusals first — the discipline is the pitch. */}
      <Band className="bg-[#0A0E14]">
        <SectionHeading eyebrow="Refused" title="What it will not do" />
        <div className="mt-10">
          <PunchGrid
            cols={4}
            items={[
              {
                title: 'It never spends without your yes.',
                body: 'Pause, launch, budget, resume — every money move asks first.',
              },
              {
                title: 'No invented numbers.',
                body: 'A figure comes from your own records, or the report is withheld.',
              },
              {
                title: 'If it doesn’t know, it says so.',
                body: 'It may not invent a project name, a price, a yield or a handover date.',
              },
              {
                title: 'There is an off switch.',
                body: 'One setting silences it everywhere. Every screen keeps working.',
              },
            ]}
          />
        </div>
      </Band>

      <Section className="py-24 lg:py-32">
        <Holder tone="blue" size="xl">
          <Keyword>Tell it what to do.</Keyword>
          <KeywordSub>It works your own pipeline — in English, العربية, Русский.</KeywordSub>
          <div className="mt-7 grid max-w-[44rem] gap-3">
            {ASKS.map((q) => (
              <p
                key={q}
                className="rounded-2xl bg-white/[0.04] px-5 py-3.5 text-[0.9375rem] leading-[1.6] text-[#CBD5E1] ring-1 ring-white/[0.06]"
              >
                &ldquo;{q}&rdquo;
              </p>
            ))}
          </div>
        </Holder>
      </Section>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 7 of 7" />
    </>
  )
}
