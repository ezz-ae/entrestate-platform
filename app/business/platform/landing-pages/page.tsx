import type { Metadata } from 'next'
import { Section, Display, Lede, H2, P, SpecTable } from '@/components/business/ui'
import {
  Browser,
  MiniPage,
  FeatureTile,
  TileGrid,
  Chapter,
  NextStep,
  StatBand,
} from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Landing pages',
  description:
    'Every listing gets its own page, built from the record — and a gate that refuses to point a campaign at a dead page. English, العربية, Русский.',
  alternates: { canonical: '/business/platform/landing-pages' },
}

export default function LandingPagesPage() {
  // Every platform chapter has a successor in the tour, so the assertion is safe.
  const next = nextInTour('/business/platform/landing-pages')!
  return (
    <>
      <Section className="pt-16 lg:pt-24">
        <Chapter n={3} total={7} label="Landing pages" />
        <div className="mt-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Display>Pages that earn the click.</Display>
            <div className="mt-6 max-w-[46ch]">
              <Lede>
                Every listing gets its own page, built from the record. The gate checks it before
                ads spend.
              </Lede>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[340px] lg:mx-0 lg:justify-self-end">
            <Browser title="yourbrokerage.ae/lp/marina-vista-2br">
              <MiniPage />
            </Browser>
          </div>
        </div>
      </Section>

      <Section className="mt-16 lg:mt-24">
        <TileGrid cols={3}>
          <FeatureTile
            icon="page"
            title="A page per listing"
            body="Pick the listing, pick a layout. Price, plan, gallery and permit fill themselves in."
          />
          <FeatureTile
            icon="gate"
            title="A gate before spend"
            body="A campaign cannot point at a missing, unpublished or expired page. Refused, by name."
          />
          <FeatureTile
            icon="gauge"
            title="The read follows the lead"
            body="Scroll, dwell and WhatsApp taps score the lead 0–100 before the first call."
          />
        </TileGrid>
      </Section>

      <Section className="mt-16 lg:mt-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <H2>No page, no launch.</H2>
            <div className="mt-6 space-y-4">
              <P>
                Before a dirham moves, the gate checks where the click lands. Four verdicts block
                the launch; two warn and let it pass.
              </P>
              <P>
                A dead page has one symptom — no leads. It reads exactly like a bad audience, so a
                week goes into rebuilding targeting instead of fixing a link.
              </P>
              <P>
                The refusal is a sentence, not an error code. It names the page and what every
                click would hit.
              </P>
              <P>
                Brokers propose edits; a manager approves before the live page changes. A page
                wired to campaigns refuses deletion — archive it instead.
              </P>
            </div>
          </div>
          <SpecTable
            caption="Six verdicts before spend"
            rows={[
              { k: 'No such page', v: 'Blocked. Every click would land on a 404 — the refusal says so, naming the page.' },
              { k: 'Not published', v: 'Blocked. Draft, pending approval or archived: the public gets a 404.' },
              { k: 'Window closed', v: 'Blocked. The page already went dark.' },
              { k: 'No destination', v: 'Blocked. Nowhere to send the click.' },
              { k: 'Closes soon', v: 'Warns. The window ends within 7 days while the campaign still runs.' },
              { k: 'Not your page', v: 'Warns. A developer microsite is a fair choice — it just cannot be attributed.' },
            ]}
          />
        </div>
      </Section>

      <div className="mt-16 lg:mt-24">
        <StatBand
          items={[
            { value: '19', label: 'section types per page', note: 'each hides itself without real data behind it' },
            { value: '3', label: 'languages on every page', note: 'English, العربية, Русский — right-to-left included' },
            { value: '13', label: 'checks against the live page', note: 'from reachability to whether Arabic really renders' },
            { value: '7 days', label: 'early warning', note: 'before a publish window closes under a running campaign' },
          ]}
        />
      </div>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 4 of 7" />
    </>
  )
}
