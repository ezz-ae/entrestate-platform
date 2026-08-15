import type { Metadata } from 'next'
import {
  Section, Band, Eyebrow, Display, Lede, SectionHeading, ButtonLink, TextLink,
} from '@/components/business/ui'
import {
  Browser, Phone, Chat, MiniCampaigns, Ledger, StatBand, StepRail,
  PunchGrid, FeatureTile, TileGrid, GlowBand, NextStep,
} from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Meta for Realtors',
  description:
    'Meta ads for one agent. Pick the listing, set the budget. The machine builds, launches, watches, and never spends past your cap.',
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
            <Eyebrow>For individual agents</Eyebrow>
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
              <ButtonLink href="/business/pricing">Get membership</ButtonLink>
              <ButtonLink href="#how-it-runs" variant="ghost">
                How it runs
              </ButtonLink>
            </div>
            <p className="mt-7 text-[0.8125rem] leading-[1.6] text-[#7C838B]">
              Your own Meta account pays for the ads. Membership is the only thing we bill.
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

      {/* ── What you get ────────────────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-28">
        <TileGrid cols={4}>
          <FeatureTile
            icon="switch"
            title="No Ads Manager to learn"
            body="Pick a listing, set a budget. The machine builds campaign, ad set, ad."
          />
          <FeatureTile
            icon="spend"
            title="No agency retainer"
            body="Membership, not a cut. Ad spend stays in your own Meta account."
          />
          <FeatureTile
            icon="chat"
            title="Leads to your WhatsApp"
            body="Each lead arrives in seconds, with the ad that produced it attached."
          />
          <FeatureTile
            icon="gate"
            title="You approve every dirham"
            body="Campaigns launch paused. Budgets never rise without a rule you wrote."
          />
        </TileGrid>
      </Section>

      {/* ── Show: the campaign desk ─────────────────────────────────────── */}
      <Band>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-20">
          <div className="min-w-0 lg:order-1">
            <Browser title="omar.entrestate.com/campaigns">
              <MiniCampaigns />
            </Browser>
          </div>
          <div className="lg:order-2">
            <SectionHeading
              eyebrow="The campaign desk"
              title="Watch it work — in plain words"
              lede={
                <Lede>Four campaigns, one screen. What each spent, how many leads, what a lead costs.</Lede>
              }
            />
            <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-[1.75] text-[#9BA1A9]">
              It pauses the ad that loses and feeds the one producing leads. Never past your daily
              cap.
            </p>
            <p className="mt-6 text-[0.9375rem]">
              <TextLink href="/business/platform/advertising">Every rule, both platforms</TextLink>
            </p>
          </div>
        </div>
      </Band>

      {/* ── Rail: how it runs ───────────────────────────────────────────── */}
      <Section className="py-20 lg:py-28">
        {/* Anchor lives on a div: Section's API deliberately has no id prop. */}
        <div id="how-it-runs" className="scroll-mt-24" />
        <SectionHeading eyebrow="Membership" title="How it runs" />
        <div className="mt-12">
          <StepRail
            steps={[
              {
                title: 'Choose listing and budget',
                body: 'Pick the property. Set your daily cap — minimum AED 50.',
              },
              {
                title: 'Approve the plan',
                body: 'It shows 2–3 audiences and the ad copy. You say go.',
              },
              {
                title: 'Leads arrive',
                body: 'Straight to your WhatsApp and CRM. Reports in English, العربية, Русский.',
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
            note: 'Start small. Raise it only when the leads are real.',
          },
          {
            value: '13',
            label: 'Meta rewrites switched off',
            note: 'Your ad runs exactly as you approved it.',
          },
          {
            value: '4',
            label: 'Placements, named in full',
            note: 'Instagram Feed, Stories, Reels, Facebook Feed. Never Audience Network.',
          },
          {
            value: '3',
            label: 'Languages',
            note: 'English, العربية, Русский.',
          },
        ]}
      />

      {/* ── Show: the decision log ──────────────────────────────────────── */}
      <Section className="py-20 lg:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="The decision log"
              title="It tells you what it did and why"
              lede={
                <Lede>
                  Tuesday, 9:14am. The Marina Vista video is buying leads under AED 90, so the
                  machine moves AED 150 to it.
                </Lede>
              }
            />
            <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-[1.75] text-[#9BA1A9]">
              The reason is written before the money moves. Read the log; if a move looks wrong,
              one switch stops everything.
            </p>
          </div>
          {/* Every row is a real activity kind the machine logs — nothing staged. */}
          <div className="min-w-0">
            <Ledger
              rows={[
                {
                  time: '09:14',
                  event: 'budget +AED 150 → Marina Vista video — rule: cost/lead < AED 90',
                  amount: '+AED 150',
                },
                {
                  time: '11:02',
                  event: 'paused Creek Harbour broad — AED 210 spent, no leads',
                  amount: '−AED 70',
                },
                {
                  time: '13:20',
                  event: 'asked you: was the JVC lead real? Your answer moves the budget',
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
          </div>
        </div>
      </Section>

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
                title: 'You can stop everything with one switch.',
                body: 'Every campaign holds. Not spending is always the safe move.',
              },
              {
                title: 'It never spends past your cap.',
                body: 'One hard daily cap, re-checked before every move that costs money.',
              },
            ]}
          />
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href="/business/pricing">Get membership</ButtonLink>
          <ButtonLink href="/business/contact" variant="ghost">
            Talk to a human
          </ButtonLink>
        </div>
      </GlowBand>

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
