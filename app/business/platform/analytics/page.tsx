import type { Metadata } from 'next'
import { Section, Display, Lede, H2, P, ButtonLink } from '@/components/business/ui'
import {
  Browser,
  MiniReport,
  Ledger,
  StatBand,
  FeatureTile,
  TileGrid,
  Chapter,
  NextStep,
  GlowBand,
} from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Analytics & finance',
  description:
    'Spend, leads, deals and commission on one report, computed from your own records. Where nothing is recorded yet, the screen shows a dash — never a zero.',
  alternates: { canonical: '/business/platform/analytics' },
}

/* Mock rows inside a product frame — the decision-log screen a manager reads.
   Dubai data per the site's visual system; amounts render gold. */
const DECISION_LOG = [
  { time: '09:14', event: 'budget +AED 150 → Marina Vista video — rule: cost/lead < AED 90', amount: '+AED 150' },
  { time: '11:32', event: 'increase capped at +AED 120 → Creek Harbour launch — max single move', amount: '+AED 120' },
  { time: '13:05', event: 'JVC townhouses held — 2 leads this week, rule needs 3' },
  { time: '16:00', event: 'campaign paused — AED 320 spend, 0 leads in 30 days' },
  { time: '17:41', event: 'deal DXB-0114 approved — AED 84,000 commission → May report', amount: '+AED 84,000' },
]

export default function AnalyticsPage() {
  const next = nextInTour('/business/platform/analytics')!
  return (
    <>
      {/* Hero — the month report is the page. */}
      <Section className="pb-16 pt-16 lg:pb-24 lg:pt-24">
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
              <ButtonLink href="/signup">Start a 14-day trial</ButtonLink>
              <ButtonLink href="/business/pricing" variant="ghost">
                See plans
              </ButtonLink>
            </div>
          </div>
          <Browser title="app.yourbrokerage.ae/analytics">
            <MiniReport />
          </Browser>
        </div>
      </Section>

      <Section className="pb-20 lg:pb-28">
        <TileGrid cols={3}>
          <FeatureTile
            icon="report"
            title="The report you send upstairs"
            body="Spend → leads → deals on one screen. Export it as CSV, Excel or PDF."
          />
          <FeatureTile
            icon="ledger"
            title="Money on a ledger"
            body="Credits, commission, payouts — every movement is one ledger row nobody can edit."
          />
          <FeatureTile
            icon="gauge"
            title="A dash, never a zero"
            body="No viewing logged, no reply yet, no spend recorded — the screen shows a dash."
          />
        </TileGrid>
      </Section>

      <GlowBand>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <H2>What a deal actually cost.</H2>
            <div className="mt-5 max-w-[54ch]">
              <Lede>
                The lead, the campaign that paid for it, and the deal it became live in the same
                records. So the report says what each deal cost.
              </Lede>
            </div>
            <div className="mt-6 max-w-[54ch]">
              <P>
                Tuesday, 09:14 — the machine moves AED 150 to the Marina Vista video and writes
                down why. The report upstairs shows the same row.
              </P>
            </div>
          </div>
          <Ledger rows={DECISION_LOG} />
        </div>
      </GlowBand>

      {/* Keeps the band's hairline and the StatBand's from doubling up. */}
      <div aria-hidden className="h-16 lg:h-24" />

      <StatBand
        items={[
          {
            value: '4',
            label: 'Analytics views',
            note: 'Company, Team, Market, Marketing — each locked to a role.',
          },
          {
            value: 'AED 10',
            label: 'One ad credit',
            note: 'Campaign cost = daily budget ÷ 10. One conversion, everywhere.',
          },
          {
            value: '6',
            label: 'Months on the monthly report',
            note: 'Deals, sales value, commission — month by month.',
          },
          {
            value: '—',
            label: 'A number with no records yet',
            note: 'A dash, never a zero. The rule prints under the table.',
          },
        ]}
      />

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 7 of 7" />
    </>
  )
}
