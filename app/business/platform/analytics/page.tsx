import type { Metadata } from 'next'
import { Section, Display, Lede, ButtonLink } from '@/components/business/ui'
import { Ledger, Chapter, NextStep } from '@/components/business/visuals'
import { CompanyCrop } from '@/components/business/crops'
import { Holder, HolderRow, Keyword, KeywordSub, LearnMore } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'
import { FULL_SYSTEM, FULL_SYSTEM_CTA } from '@/lib/business/full-system'

export const metadata: Metadata = {
  title: 'Analytics & finance',
  description:
    'Spend, leads, deals and commission on one report, computed from your own records. Where nothing is recorded yet, the screen shows a dash — never a zero.',
  alternates: { canonical: '/business/platform/analytics' },
}

/* Mock rows inside a product frame — the decision log a manager reads.
   Amounts render gold. */
const DECISION_LOG = [
  {
    time: '09:14',
    event: 'budget +AED 150 → Marina Vista video — rule: cost per lead under AED 90',
    amount: '+AED 150',
  },
  {
    time: '11:32',
    event: 'increase capped at +AED 120 → Creekside One launch — largest single move',
    amount: '+AED 120',
  },
  { time: '13:05', event: 'JVC townhouses held — 2 leads this week, the rule needs 3' },
  {
    time: '17:41',
    event: 'deal approved — AED 84,000 commission → this month’s report',
    amount: '+AED 84,000',
  },
]

export default function AnalyticsPage() {
  const next = nextInTour('/business/platform/analytics')!
  return (
    <>
      {/* The month report is the page. */}
      <Section className="pb-16 pt-16 lg:pb-20 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-16">
          <div>
            <Chapter n={7} total={7} label="Analytics & finance" />
            <div className="mt-6 max-w-[44rem]">
              <Display>Numbers you&rsquo;d defend upstairs.</Display>
            </div>
            <div className="mt-6 max-w-[52ch]">
              <Lede>
                Spend, leads, deals and commission — one report, computed from your own records.
              </Lede>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href={FULL_SYSTEM.startHref}>{FULL_SYSTEM_CTA}</ButtonLink>
              <ButtonLink href="/business/pricing" variant="ghost">
                See plans
              </ButtonLink>
            </div>
          </div>
          <CompanyCrop />
        </div>
      </Section>

      <Section className="pb-24 lg:pb-32">
        <div className="space-y-5">
          <Holder tone="gold" visual={<Ledger rows={DECISION_LOG} />}>
            <Keyword>Written down.</Keyword>
            <KeywordSub>
              Every budget move, hold and pause lands in the log with its rule.
            </KeywordSub>
            <LearnMore href="/business/docs/reports" label="How to read the money" />
          </Holder>

          <HolderRow>
            <Holder tone="green">
              <Keyword as="h3">What a deal cost.</Keyword>
              <KeywordSub>
                The lead, the campaign that paid for it, and the deal — one record.
              </KeywordSub>
            </Holder>
            <Holder tone="blue">
              <Keyword as="h3">A dash, never a zero.</Keyword>
              <KeywordSub>Nothing recorded yet? The screen says so instead of pretending.</KeywordSub>
            </Holder>
          </HolderRow>
        </div>
      </Section>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 7 of 7" />
    </>
  )
}
