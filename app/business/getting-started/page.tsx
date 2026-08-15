import type { Metadata } from 'next'
import {
  Section,
  Band,
  Eyebrow,
  Display,
  Lede,
  H2,
  P,
  SectionHeading,
  SpecTable,
  ButtonLink,
  TextLink,
} from '@/components/business/ui'
import { Browser, MiniReport, StepRail, PunchGrid, NextStep } from '@/components/business/visuals'
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

      <Section className="pb-20 lg:pb-24">
        <SectionHeading
          title="Four weeks, in order."
          lede={<Lede>Each week depends on the one before it. Skip ahead and you launch against an unchecked page.</Lede>}
        />
        <div className="mt-10">
          <StepRail
            steps={[
              {
                title: 'Stock and team',
                body: 'Load projects with prices, payment plans and permits. Add agents, give each a role. Nothing is advertised yet.',
              },
              {
                title: 'Pages live',
                body: 'Generate a page per listing you plan to advertise. Fix what the gate blocks now, not at launch.',
              },
              {
                title: 'Connect Meta',
                body: 'Paste the token — tested before it saves. Set spend caps. Launch the first campaign paused.',
              },
              {
                title: 'Read the report',
                body: 'Spend, leads, deals in one place. Decide next month’s budget with numbers you can defend.',
              },
            ]}
          />
        </div>
      </Section>

      <Band className="bg-[#090B0E]">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow>Week four</Eyebrow>
            <H2 className="mt-4">The month ends in one screen.</H2>
            <P className="mt-5 max-w-[46ch]">
              Spend, leads, deals — and line items that sum to the total. Send it upstairs as it stands.
            </P>
            <div className="mt-6 text-[0.9375rem]">
              <TextLink href="/business/platform/analytics">Numbers you’d defend upstairs</TextLink>
            </div>
          </div>
          <Browser title="app.yourbrokerage.ae/reports" className="w-full max-w-[440px] lg:justify-self-end">
            <MiniReport />
          </Browser>
        </div>
      </Band>

      <Section className="py-20 lg:py-28">
        <SectionHeading
          eyebrow="Before day one"
          title="Bring these."
          lede={<Lede>Everything the stock load needs, in one list.</Lede>}
        />
        <div className="mt-10">
          <SpecTable
            caption="The checklist"
            rows={[
              { k: 'Project list', v: 'Prices, payment plans, handover dates. A spreadsheet is fine.' },
              { k: 'Trakheesi permits', v: 'Number and expiry for anything you will advertise. No permit, no ad.' },
              { k: 'Lead history', v: 'Phone or email per row. Rows with neither are reported, not imported.' },
              { k: 'Team list', v: 'Names, emails, and what each person may see.' },
              { k: 'Meta access', v: 'Admin on the ad account you intend to connect.' },
              { k: 'Spend caps', v: 'Your daily maximum, and the most one move may shift.' },
            ]}
          />
        </div>
      </Section>

      <Band>
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
