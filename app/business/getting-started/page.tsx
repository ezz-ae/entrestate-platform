import type { Metadata } from 'next'
import { Section, Band, Eyebrow, Display, Lede, ButtonLink, SectionHeading } from '@/components/business/ui'
import { Browser, MiniReport, StepRail, PunchGrid, NextStep } from '@/components/business/visuals'
import { Holder, Keyword, KeywordSub, LearnMore } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Getting started',
  description:
    'Your first 30 days: stock and team in week one, pages live, Meta connected, and the report you decide next month with.',
  alternates: { canonical: '/business/getting-started' },
}

export default function GettingStartedPage() {
  const next = nextInTour('/business/getting-started')!
  return (
    <>
      <Section className="pb-14 pt-16 lg:pb-20 lg:pt-24">
        <Eyebrow>Getting started</Eyebrow>
        <div className="mt-5 max-w-[44rem]">
          <Display>Your first 30 days.</Display>
        </div>
        <div className="mt-6 max-w-[56ch]">
          <Lede>Week by week, from loading stock to the first report. Live spend stays off until you connect Meta.</Lede>
        </div>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/signup">Start a 14-day trial</ButtonLink>
          <ButtonLink href="/business/contact" variant="ghost">
            Talk to us
          </ButtonLink>
        </div>
      </Section>

      {/* ── The four weeks — the full walkthrough lives in the guide ────── */}
      <Section className="pb-16 lg:pb-20">
        <Holder size="xl">
          <Keyword>Four weeks.</Keyword>
          <KeywordSub>Each week depends on the one before it.</KeywordSub>
          <div className="mt-8">
            <StepRail
              steps={[
                {
                  title: 'Stock and team',
                  body: 'Load projects, prices and permits. Add agents, each with a role.',
                },
                {
                  title: 'Pages live',
                  body: 'A page per listing you plan to advertise. Fix what the gate flags.',
                },
                {
                  title: 'Connect Meta',
                  body: 'Set your spend caps. The first campaign launches paused.',
                },
                {
                  title: 'Read the report',
                  body: 'Spend, leads, deals in one place. Decide next month with numbers.',
                },
              ]}
            />
          </div>
          <LearnMore href="/business/docs/get-set-up" label="Read the setup guide" />
        </Holder>
      </Section>

      {/* ── Week four's payoff ──────────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-24">
        <Holder
          tone="gold"
          visual={
            <Browser title="app.yourbrokerage.ae/reports">
              <MiniReport />
            </Browser>
          }
        >
          <Keyword>Month-end, one screen.</Keyword>
          <KeywordSub>Spend, leads, deals — line items that sum. Send it upstairs as it stands.</KeywordSub>
          <LearnMore href="/business/docs/reports" label="How to read the money" />
        </Holder>
      </Section>

      <Band className="bg-surface-2">
        <SectionHeading eyebrow="The trial" title="Day one, honestly." />
        <div className="mt-10">
          <PunchGrid
            items={[
              {
                title: 'Real from the first screen.',
                body: 'Your workspace, your own database, market stock already loaded.',
              },
              {
                title: 'Nothing spends in the trial.',
                body: 'No ad account is connected, so no campaign can spend.',
              },
              {
                title: 'Empty beats invented.',
                body: 'Campaign lists without Meta say “demo”. Other screens stay empty, never invented.',
              },
            ]}
          />
        </div>
        <div className="mt-12">
          <ButtonLink href="/signup">Start a 14-day trial</ButtonLink>
        </div>
      </Band>

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
