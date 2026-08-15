import type { Metadata } from 'next'
import { Section, Eyebrow, Display, Lede, SectionHeading, ButtonLink } from '@/components/business/ui'
import {
  Browser, Phone, Chat, MiniCampaigns, Ledger, StatBand, StepRail, PunchGrid, GlowBand, NextStep,
} from '@/components/business/visuals'
import { Holder, HolderRow, Keyword, KeywordSub, LearnMore } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Meta for Realtors',
  description:
    'Meta ads for one agent. Pick the listing, set the budget — pay with tokens as you run ads. No monthly fee.',
  alternates: { canonical: '/business/meta-for-realtors' },
}

export default function MetaForRealtorsPage() {
  const next = nextInTour('/business/meta-for-realtors')!

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <Section className="pb-20 pt-16 lg:pb-28 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div>
            <Eyebrow>Meta for Realtors · Meta ads for one agent</Eyebrow>
            <div className="mt-5 max-w-[44rem]">
              <Display>Ads like you hired a team.</Display>
            </div>
            <div className="mt-7 max-w-[48ch]">
              <Lede>
                Pick the listing. Set the budget. The machine builds, launches, watches, and moves
                money to what works.
              </Lede>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/business/pricing">Get access</ButtonLink>
              <ButtonLink href="#how-it-runs" variant="ghost">
                How it runs
              </ButtonLink>
            </div>
            <p className="mt-7 text-[0.8125rem] leading-[1.6] text-[#7C838B]">
              Pay with tokens as you run ads. No monthly fee. Ad spend stays in your own Meta
              account.
            </p>
          </div>

          {/* Phone leads the collage: this product is bought and run from a phone. */}
          <div className="relative isolate">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-10 -inset-y-14 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.07),transparent_65%)]"
            />
            <div className="grid">
              <div className="flex justify-center sm:col-start-1 sm:row-start-1 sm:items-end sm:justify-start">
                <div className="relative z-10 sm:-rotate-2">
                  <Phone className="w-[240px] sm:w-[255px]">
                    <Chat />
                  </Phone>
                </div>
              </div>
              <div className="mt-6 min-w-0 sm:col-start-1 sm:row-start-1 sm:mt-0 sm:pb-12 sm:pl-32 lg:pl-40">
                <div className="sm:rotate-1">
                  <Browser title="omar.entrestate.com/campaigns">
                    <MiniCampaigns />
                  </Browser>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── The holders: the pitch at scanning speed ────────────────────── */}
      <Section className="space-y-5 pb-20 lg:pb-28">
        <Holder
          tone="gold"
          size="xl"
          visual={
            <Browser title="omar.entrestate.com/campaigns">
              <MiniCampaigns />
            </Browser>
          }
        >
          <Keyword size="xl">Watch it work.</Keyword>
          <KeywordSub>What each ad spent, how many leads, what a lead costs — one screen.</KeywordSub>
          <LearnMore href="/business/docs/launch-a-campaign" label="Learn how a launch runs" />
        </Holder>

        <Holder
          tone="green"
          visual={
            <Ledger
              rows={[
                {
                  time: '09:14',
                  event: 'budget +AED 150 → Marina Vista video — rule: cost/lead < AED 90',
                  amount: '+AED 150',
                },
                {
                  time: '11:02',
                  event: 'paused Creekside One broad — AED 210 spent, no leads',
                  amount: '−AED 70',
                },
                {
                  time: '16:41',
                  event: 'held a raise — daily cap AED 300 already committed',
                  amount: 'held',
                },
                {
                  time: '17:05',
                  event: 'Palm listing permit expires in 5 days — renew to keep the ad live',
                },
              ]}
            />
          }
        >
          <Keyword>Written down.</Keyword>
          <KeywordSub>The reason is written before the money moves. One switch stops everything.</KeywordSub>
          <LearnMore href="/business/docs/spend-rules" label="Learn the spend rules" />
        </Holder>

        <HolderRow cols={3}>
          <Holder>
            <Keyword as="h3">No Ads Manager.</Keyword>
            <KeywordSub>Pick a listing, set a budget. The machine builds the rest.</KeywordSub>
          </Holder>
          <Holder tone="blue">
            <Keyword as="h3">Real buyers.</Keyword>
            <KeywordSub>Targeting starts from who actually buys, not from broad interests.</KeywordSub>
            <LearnMore href="/business/docs/audiences" label="Learn about audiences" />
          </Holder>
          <Holder>
            <Keyword as="h3">Your WhatsApp.</Keyword>
            <KeywordSub>Each lead arrives in seconds, with the ad that produced it.</KeywordSub>
          </Holder>
        </HolderRow>
      </Section>

      {/* ── Rail: how it runs ───────────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-28">
        {/* Anchor lives on a div: Section's API deliberately has no id prop. */}
        <div id="how-it-runs" className="scroll-mt-24" />
        <SectionHeading eyebrow="Get access" title="How it runs" />
        <div className="mt-12">
          <StepRail
            steps={[
              {
                title: 'Choose listing and budget',
                body: 'Pick the property. Set your daily cap — minimum AED 50.',
              },
              {
                title: 'Approve the plan',
                body: 'It shows the audiences and the ad. You say go.',
              },
              {
                title: 'Leads arrive',
                body: 'Straight to your WhatsApp, in English, العربية or Русский.',
              },
            ]}
          />
        </div>
      </Section>

      {/* ── Facts ───────────────────────────────────────────────────────── */}
      <StatBand
        items={[
          {
            value: 'AED 50',
            label: 'Minimum daily budget',
            note: 'Start small. Raise it when the leads are real.',
          },
          {
            value: '0',
            label: 'Monthly fee',
            note: 'Tokens as you run ads. Nothing when you don’t.',
          },
          {
            value: '4',
            label: 'Placements, named in full',
            note: 'Instagram Feed, Stories, Reels, Facebook Feed.',
          },
          {
            value: '3',
            label: 'Languages',
            note: 'English, العربية, Русский.',
          },
        ]}
      />

      {/* ── The close: spend control ────────────────────────────────────── */}
      <GlowBand>
        <SectionHeading eyebrow="Spend control" title="Hard limits, in writing" />
        <div className="mt-12">
          <PunchGrid
            items={[
              {
                title: 'No rule, no spend.',
                body: 'With no rule on file, it cannot raise a budget. Ever.',
              },
              {
                title: 'One switch stops everything.',
                body: 'Every campaign holds. Not spending is always the safe move.',
              },
              {
                title: 'Never past your cap.',
                body: 'One hard daily cap, checked before every move that costs money.',
              },
            ]}
          />
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href="/business/pricing">Get access</ButtonLink>
          <ButtonLink href="/business/contact" variant="ghost">
            Talk to a human
          </ButtonLink>
        </div>
      </GlowBand>

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
