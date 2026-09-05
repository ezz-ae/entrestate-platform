import type { Metadata } from 'next'
import { Section, Band, Eyebrow, Display, Lede, ButtonLink, SectionHeading } from '@/components/business/ui'
import { StepRail, PunchGrid, NextStep } from '@/components/business/visuals'
import { RocketAdCrop } from '@/components/business/crops'
import { FULL_SYSTEM, FULL_SYSTEM_CTA } from '@/lib/business/full-system'
import { Holder, Keyword, KeywordSub, LearnMore } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Getting started',
  description:
    'Your first ad in five minutes: your address, a listing, Rocket Ad with a budget — it launches paused, you press go. The lead lands owned.',
  alternates: { canonical: '/business/getting-started' },
}

/**
 * The owner: "we cannot tell them 'a month to learn' — no 'no ads on day
 * one'. People sign up because they have a team and want a lead now, not to
 * learn what the AI does with the lead. We should tell him: make an ad in
 * five minutes." So this page is steps, not weeks, and the first step that
 * matters is the ad.
 */
export default function GettingStartedPage() {
  const next = nextInTour('/business/getting-started')!
  return (
    <>
      <Section className="pb-14 pt-16 lg:pb-20 lg:pt-24">
        <Eyebrow>Getting started</Eyebrow>
        <div className="mt-5 max-w-[44rem]">
          <Display>Your first ad in five minutes.</Display>
        </div>
        <div className="mt-6 max-w-[56ch]">
          <Lede>Your address, a listing, a budget. Rocket Ad writes the ad and sets the rest; it launches paused, you press go. The lead lands owned.</Lede>
        </div>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href={FULL_SYSTEM.startHref}>{FULL_SYSTEM_CTA}</ButtonLink>
          <ButtonLink href="/business/contact" variant="ghost">
            Talk to us
          </ButtonLink>
        </div>
      </Section>

      {/* ── The steps — no calendar. Each one is a thing you do, not a week you wait. ── */}
      <Section className="pb-16 lg:pb-20">
        <Holder size="xl" tone="blue" label="Five steps">
          <Keyword>Steps, not weeks.</Keyword>
          <KeywordSub>Do them in one sitting. Nothing waits on a calendar.</KeywordSub>
          <div className="mt-8">
            <StepRail
              steps={[
                {
                  title: 'Your address',
                  body: 'Sign up with your company name. The workspace opens under your own name, with the market catalogue already in it.',
                },
                {
                  title: 'A listing',
                  body: 'Pick one from the catalogue, or add yours — brochure, link, text or by hand. It is scored on the spot.',
                },
                {
                  title: 'Rocket Ad',
                  body: 'Give it the brochure or a photo and a daily budget. It writes the ad and sets the rest. It launches paused.',
                },
                {
                  title: 'Press go',
                  body: 'Connect your Meta ad account, look at the ad, switch it on. Spend runs in your own account, inside the cap you set.',
                },
                {
                  title: 'The lead lands owned',
                  body: 'With an owner, a language tag and a clock. Your team works it from the first day; the report is there when you want it.',
                },
              ]}
            />
          </div>
          <LearnMore href="/business/docs/get-set-up" label="Read the setup guide" />
        </Holder>
      </Section>

      {/* ── What you get on day one ─────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-24">
        <Holder tone="gold" label="Rocket Ad" visual={<RocketAdCrop flush />}>
          <Keyword>One source. One budget.</Keyword>
          <KeywordSub>A brochure, a photo, a link — it reads the source, writes the ad, and sets the rest. You confirm and it runs.</KeywordSub>
          <LearnMore href="/business/docs/launch-a-campaign" label="How a campaign launches" />
        </Holder>
      </Section>

      <Band className="bg-surface-2">
        <SectionHeading eyebrow="Day one" title="Day one, honestly." />
        <div className="mt-10">
          <PunchGrid
            items={[
              {
                title: 'Real from the first screen.',
                body: 'Your workspace, your own database, the market catalogue already loaded.',
              },
              {
                title: 'Your account, your money.',
                body: 'Ad spend runs in your own Meta account, inside a cap you wrote. Nothing moves until you press go.',
              },
              {
                title: 'Empty beats invented.',
                body: 'A screen with no data yet says so. Nothing is filled in to look busy.',
              },
            ]}
          />
        </div>
        <div className="mt-12">
          <ButtonLink href={FULL_SYSTEM.startHref}>{FULL_SYSTEM_CTA}</ButtonLink>
        </div>
      </Band>

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
