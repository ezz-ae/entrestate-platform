import type { Metadata } from 'next'
import { Section, Display, Lede, Eyebrow } from '@/components/business/ui'
import { Holder, Keyword, KeywordSub, HolderRow, LearnMore } from '@/components/business/holders'
import { Chapter, NextStep, Ledger, PunchGrid, GlowBand } from '@/components/business/visuals'
import { RocketAdCrop } from '@/components/business/crops'
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
          <RocketAdCrop />
        </div>
      </Section>

      <Section className="mt-16 lg:mt-24">
        <Holder
          tone="gold"
          visual={
            <Ledger
              rows={[
                { time: '09:14', event: 'budget +AED 150 → Marina Vista video — rule: cost/lead < AED 90', amount: '+AED 150' },
                { time: '09:14', event: 'paused Creekside One broad — cost/lead AED 212 vs sibling AED 84', amount: '−AED 100' },
                { time: '11:30', event: 'blocked search “marina vista rent” — 19 clicks, 0 leads', amount: 'AED 76 saved' },
                { time: '16:00', event: 'raise for JVC lead form held — 2 leads, rule needs 3' },
                { time: '16:01', event: 'permit warning — Palm Rise listing needs renewal in 5 days' },
              ]}
            />
          }
        >
          <Keyword>Written down.</Keyword>
          <KeywordSub>Budget moves only inside rules you wrote — each one logged in plain words.</KeywordSub>
          <LearnMore href="/business/docs/spend-rules" label="See the spend rules" />
        </Holder>
      </Section>

      <Section className="mt-6 lg:mt-8">
        <HolderRow cols={2}>
          <Holder tone="green">
            <Keyword>Launches paused.</Keyword>
            <KeywordSub>It always launches paused, so you see the ad before a dirham moves.</KeywordSub>
            <LearnMore href="/business/docs/launch-a-campaign" label="See how a launch works" />
          </Holder>
          <Holder tone="blue">
            <Keyword>Buyers, not guesses.</Keyword>
            <KeywordSub>Audiences start from who actually buys, not from broad interests.</KeywordSub>
            <LearnMore href="/business/docs/audiences" label="See how audiences are built" />
          </Holder>
        </HolderRow>
      </Section>

      <GlowBand className="mt-16 lg:mt-24">
        <Eyebrow className="mb-8">The brakes</Eyebrow>
        <PunchGrid
          cols={4}
          items={[
            { title: 'No rule, no spend.', body: 'With no rule, it spends nothing on its own.' },
            { title: 'Caps per day and per move.' },
            { title: 'A weak page cannot be advertised.' },
            { title: 'No permit, no ad.' },
          ]}
        />
      </GlowBand>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 3 of 7" />
    </>
  )
}
