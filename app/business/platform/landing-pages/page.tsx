import type { Metadata } from 'next'
import { Section, Display, Lede } from '@/components/business/ui'
import { Holder, Keyword, KeywordSub, HolderRow, LearnMore } from '@/components/business/holders'
import { Browser, MiniPage, Chapter, NextStep, StatBand } from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Landing pages',
  description:
    'Every listing gets its own page, built from the record — and a gate that keeps campaigns off dead pages. English, العربية, Русский.',
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
              <Lede>Every listing gets its own page, built from the record. In three languages.</Lede>
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
        <HolderRow cols={3}>
          <Holder tone="plain">
            <Keyword>One page each.</Keyword>
            <KeywordSub>Pick the listing, pick a layout. Price, gallery and permit fill in.</KeywordSub>
          </Holder>
          <Holder tone="gold">
            <Keyword>The launch gate.</Keyword>
            <KeywordSub>A campaign cannot point at a dead or unpublished page. Refused, by name.</KeywordSub>
            <LearnMore href="/business/docs/landing-pages" label="See what the gate checks" />
          </Holder>
          <Holder tone="green">
            <Keyword>Pages that score.</Keyword>
            <KeywordSub>Scroll, dwell and WhatsApp taps grade every lead before the first call.</KeywordSub>
          </Holder>
        </HolderRow>
      </Section>

      <div className="mt-16 lg:mt-24">
        <StatBand
          items={[
            { value: '3', label: 'languages on every page', note: 'English, العربية, Русский — right-to-left included' },
            { value: '19', label: 'section types per page', note: 'each hides itself without real data behind it' },
            { value: '7 days', label: 'early warning', note: 'before a page goes dark under a running campaign' },
          ]}
        />
      </div>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 4 of 7" />
    </>
  )
}
