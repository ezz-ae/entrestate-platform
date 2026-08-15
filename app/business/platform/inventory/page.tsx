import type { Metadata } from 'next'
import { Section, Display, Lede, H2, P, SpecTable } from '@/components/business/ui'
import {
  Browser,
  MiniInventory,
  FeatureTile,
  TileGrid,
  Chapter,
  NextStep,
  StatBand,
} from '@/components/business/visuals'
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
              <Lede>
                Every project you sell, on one record — priced, scored, and cleared to advertise
                before a dirham moves.
              </Lede>
            </div>
          </div>
          <Browser title="app.yourbrokerage.ae/inventory">
            <MiniInventory />
          </Browser>
        </div>
      </Section>

      <Section className="mt-16 lg:mt-24">
        <TileGrid cols={3}>
          <FeatureTile
            icon="inventory"
            title="One record per listing"
            body="Price, payment plan, handover, unit mix, permit — the facts you quote a buyer."
          />
          <FeatureTile
            icon="flow"
            title="Four ways to load stock"
            body="Upload a brochure, paste a link or text, or type it. One review screen."
          />
          <FeatureTile
            icon="gauge"
            title="Scored before it spends"
            body="Data quality and ad readiness, out of 100. Ad-ready starts at 70."
          />
        </TileGrid>
      </Section>

      <Section className="mt-16 lg:mt-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <H2>Fit to advertise — or fix first.</H2>
            <div className="mt-6 space-y-4">
              <P>
                Every listing gets one verdict and one next action. Scale, Launch, Fix first, or
                Hold.
              </P>
              <P>
                A listing with no live page cannot launch a campaign — paid traffic would be
                wasted, and the screen says so.
              </P>
              <P>
                A brochure lands at 4pm. Upload it, check the review screen, done — the record
                fills and the score appears.
              </P>
              <P>What the machine cannot find stays a dash. Never a guess, never AED 0.</P>
            </div>
          </div>
          <SpecTable
            caption="Four verdicts, one next action"
            rows={[
              { k: 'Scale', v: 'Page live, readiness 75+, blended score 70+. Put more behind it.' },
              { k: 'Launch', v: 'Readiness 60+ and a page exists. Ready to run.' },
              { k: 'Fix first', v: 'No page, weak record, or no image. The gap is named.' },
              { k: 'Hold', v: 'Nothing wrong, nothing urgent. Budget earns more elsewhere.' },
            ]}
          />
        </div>
      </Section>

      <div className="mt-16 lg:mt-24">
        <StatBand
          items={[
            { value: '2,000', label: 'projects on one screen', note: 'sorted by ad readiness' },
            { value: '70', label: 'counts as ad-ready', note: 'a complete record, a live page, an image' },
            { value: '5 days', label: 'permit warning', note: 'before a Trakheesi permit lapses' },
            { value: '8', label: 'signals rank the next dirham', note: 'recomputed nightly while you sleep' },
          ]}
        />
      </div>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 2 of 7" />
    </>
  )
}
