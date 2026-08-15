import type { Metadata } from 'next'
import { Section, Display, Lede, H2, P, Eyebrow } from '@/components/business/ui'
import {
  Browser,
  MiniCampaigns,
  FeatureTile,
  TileGrid,
  Chapter,
  NextStep,
  StatBand,
  Ledger,
  PunchGrid,
  GlowBand,
} from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Advertising',
  description:
    'You set the budget and the rules. The machine launches, watches, moves money to what works — and writes every move down.',
  alternates: { canonical: '/business/platform/advertising' },
}

export default function AdvertisingPage() {
  // Every platform chapter has a successor in the tour, so the assertion is safe.
  const next = nextInTour('/business/platform/advertising')!
  return (
    <>
      <Section className="pt-16 lg:pt-24">
        <Chapter n={2} total={7} label="Advertising" />
        <div className="mt-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Display>Budgets with brakes.</Display>
            <div className="mt-6 max-w-[46ch]">
              <Lede>
                You set the budget and the rules. The machine launches, watches, and moves money
                to what works.
              </Lede>
            </div>
          </div>
          <Browser title="app.yourbrokerage.ae/campaigns">
            <MiniCampaigns />
          </Browser>
        </div>
      </Section>

      <Section className="mt-16 lg:mt-24">
        <TileGrid cols={3}>
          <FeatureTile
            icon="spend"
            title="Your own ad accounts"
            body="Campaigns run inside your Meta and Google accounts. Leave tomorrow, keep everything."
          />
          <FeatureTile
            icon="gate"
            title="Brakes before spend"
            body="No spend rule, no budget move. No permit or live page, no launch."
          />
          <FeatureTile
            icon="target"
            title="Leads come back named"
            body="Every lead lands in the CRM carrying the campaign that paid for it."
          />
        </TileGrid>
      </Section>

      <Section className="mt-16 lg:mt-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <H2>Every budget move, written down.</H2>
            <div className="mt-6 space-y-4">
              <P>The autopilot moves budget only inside rules you wrote. No rule, no spend.</P>
              <P>
                At 09:14 it moved AED 150 to the Marina Vista video and paused the weakest trial.
                Both lines hit the log before the money lands.
              </P>
              <P>
                On Google it blocks wasteful searches on its own. It never buys a new keyword
                alone — that waits for you.
              </P>
            </div>
          </div>
          {/* Mock log inside a product frame — every event kind shown (rules, caps, harvest, permits) is a real mechanism. */}
          <Ledger
            rows={[
              { time: '04:00', event: 'cycle start — 3 trials live, cap AED 600/day' },
              { time: '09:14', event: 'budget +AED 150 → Marina Vista video — rule: cost/lead < AED 90', amount: '+AED 150' },
              { time: '09:14', event: 'paused Creek Harbour broad — cost/lead AED 212 vs sibling AED 84', amount: '−AED 100' },
              { time: '11:30', event: 'blocked search “marina vista rent” — 19 clicks, 0 leads', amount: 'AED 76 saved' },
              { time: '16:00', event: 'raise for JVC lead form held — 2 leads, rule needs 3' },
              { time: '16:01', event: 'permit warning — Palm listing expires in 5 days. Renew now' },
            ]}
          />
        </div>
      </Section>

      <div className="mt-16 lg:mt-24">
        <StatBand
          items={[
            { value: 'AED 50', label: 'minimum daily budget', note: 'the same floor on Meta and Google' },
            { value: '2× a day', label: 'the autopilot reads results', note: 'a losing trial is caught in hours' },
            { value: '13', label: 'Meta automations opted out', note: 'switched off by name on every launch' },
            { value: '3', label: 'broker verdicts before it judges', note: 'your team grades the leads it bought' },
          ]}
        />
      </div>

      <GlowBand className="mt-16 lg:mt-24">
        <Eyebrow className="mb-8">The brakes</Eyebrow>
        <PunchGrid
          cols={4}
          items={[
            { title: 'No rule, no spend.', body: 'With no spend rule on file, nothing automatic moves money.' },
            { title: 'Spend caps per day and per move.', body: 'One hard daily cap across Meta and Google, checked before every move.' },
            { title: 'A weak page cannot be advertised.', body: 'No live landing page, no launch. Paid clicks never land on a 404.' },
            { title: 'No permit, no ad.', body: 'The Trakheesi permit is checked at launch and while the ad runs.' },
          ]}
        />
      </GlowBand>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 3 of 7" />
    </>
  )
}
