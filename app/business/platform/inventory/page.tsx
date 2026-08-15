import type { Metadata } from 'next'
import { Section, Display, Lede } from '@/components/business/ui'
import { Holder, Keyword, KeywordSub, HolderRow, LearnMore } from '@/components/business/holders'
import { Browser, MiniInventory, Chapter, NextStep, StatBand } from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Inventory',
  description:
    'Every project on one record — price, payment plan, handover, permit — scored for whether it is fit to advertise.',
  alternates: { canonical: '/business/platform/inventory' },
}

export default function InventoryPage() {
  // Every platform chapter has a successor in the tour, so the assertion is safe.
  const next = nextInTour('/business/platform/inventory')!
  return (
    <>
      <Section className="pt-16 lg:pt-24">
        <Chapter n={1} total={7} label="Inventory" />
        <div className="mt-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Display>Know what you&rsquo;re selling.</Display>
            <div className="mt-6 max-w-[46ch]">
              <Lede>Every project on one record — priced, scored, and cleared to advertise.</Lede>
            </div>
          </div>
          <Browser title="app.yourbrokerage.ae/inventory">
            <MiniInventory />
          </Browser>
        </div>
      </Section>

      <Section className="mt-16 lg:mt-24">
        <HolderRow cols={3}>
          <Holder tone="plain">
            <Keyword>One record.</Keyword>
            <KeywordSub>Price, payment plan, handover, permit — the facts you quote a buyer.</KeywordSub>
          </Holder>
          <Holder tone="blue">
            <Keyword>Scored to sell.</Keyword>
            <KeywordSub>Data quality and ad readiness, out of 100. Ad-ready starts at 70.</KeywordSub>
          </Holder>
          <Holder tone="gold">
            <Keyword>Fit, or fix.</Keyword>
            <KeywordSub>One verdict, one next action: Scale, Launch, Fix first, or Hold.</KeywordSub>
            <LearnMore href="/business/docs/inventory" label="See how scoring works" />
          </Holder>
        </HolderRow>
      </Section>

      <div className="mt-16 lg:mt-24">
        <StatBand
          items={[
            { value: '2,000', label: 'projects on one screen', note: 'sorted by ad readiness' },
            { value: '70', label: 'counts as ad-ready', note: 'a complete record, a live page, an image' },
            { value: '5 days', label: 'permit warning', note: 'before a listing’s permit lapses' },
          ]}
        />
      </div>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 2 of 7" />
    </>
  )
}
