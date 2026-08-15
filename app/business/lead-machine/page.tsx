import type { Metadata } from 'next'
import { Section, Eyebrow, Display, H2, Lede, P, ButtonLink } from '@/components/business/ui'
import {
  Browser, HeroVisual, GlowBand, NextStep,
  MiniInventory, MiniCampaigns, MiniCRM, Ledger,
  TileGrid, FeatureTile, StepRail, PunchGrid, StatBand,
} from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Lead Machine',
  description:
    'Your brokerage, on rails. Inventory, pages, ads, CRM and the month-end report — one system, your brand, your address. 14-day trial, no card.',
  alternates: { canonical: '/business/lead-machine' },
}

/* The log rows mirror what the machine actually writes: nightly pass at 04:30,
   afternoon cycle at 16:00, budget moves clamped and justified by a rule. */
const LOG_ROWS = [
  { time: '04:30', event: 'nightly pass — 3 rules read, 2 applied' },
  { time: '04:31', event: 'budget +AED 150 → Marina Vista video — rule: cost/lead < AED 90', amount: '+AED 150' },
  { time: '04:31', event: 'budget −AED 150 → JVC carousel — cost/lead AED 212, over rule', amount: '−AED 150' },
  { time: '09:14', event: 'paused → Creek Harbour launch — daily cap reached', amount: 'AED 0' },
  { time: '16:00', event: 'afternoon cycle — Business Bay lead form checked, no change' },
]

export default function LeadMachinePage() {
  const next = nextInTour('/business/lead-machine')!

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <Section className="pb-16 pt-16 lg:pb-24 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <Eyebrow>For brokerages and developers&rsquo; sales teams</Eyebrow>
            <div className="mt-5 max-w-[44rem]">
              <Display>Your brokerage, on rails.</Display>
            </div>
            <div className="mt-7 max-w-[46ch]">
              <Lede>
                Inventory, pages, ads, CRM and the month-end report — one system, your brand, your
                address.
              </Lede>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/signup">Start a 14-day trial</ButtonLink>
              <ButtonLink href="/business/pricing" variant="ghost">See pricing</ButtonLink>
            </div>
          </div>
          <HeroVisual variant="machine" />
        </div>
      </Section>

      {/* ── The scene ───────────────────────────────────────────────────── */}
      <GlowBand>
        <div className="mx-auto max-w-[62ch] text-center">
          <H2>2:47am. A lead asks in Arabic.</H2>
          <div className="mt-6">
            <Lede>
              By 2:48 it has an answer, a language tag and an owner — Omar K. wakes to a named
              lead and a viewing proposed. The clock times the first reply from the second it lands.
            </Lede>
          </div>
        </div>
      </GlowBand>

      {/* ── What you get ────────────────────────────────────────────────── */}
      <Section className="py-16 lg:py-24">
        <TileGrid>
          <FeatureTile
            icon="brand"
            title="Your name everywhere"
            body="Your logo, your domain, your colours — on every screen, page and report."
          />
          <FeatureTile
            icon="team"
            title="Agents get a workspace"
            body="Own leads, a ranked call queue, WhatsApp on the row. No one else's pipeline."
          />
          <FeatureTile
            icon="gauge"
            title="Managers get the desk"
            body="Who owns what, what's overdue, how fast the first reply went out."
          />
          <FeatureTile
            icon="ledger"
            title="The books balance"
            body="Deals, commission, spend, cost per lead — one report, every figure traceable."
          />
        </TileGrid>
      </Section>

      {/* ── Show: inventory ─────────────────────────────────────────────── */}
      <Section className="py-16 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-[46ch]">
            <H2>Stock that&rsquo;s fit to advertise.</H2>
            <P className="mt-5">
              Every listing carries a score before it carries a budget. Missing price, no valid
              permit, thin media — the card goes grey and stays out of the ad queue until fixed.
            </P>
          </div>
          <Browser title="app.yourbrokerage.ae/inventory">
            <MiniInventory />
          </Browser>
        </div>
      </Section>

      {/* ── Show: campaigns ─────────────────────────────────────────────── */}
      <Section className="py-16 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Browser title="app.yourbrokerage.ae/campaigns" className="lg:order-first">
            <MiniCampaigns />
          </Browser>
          <div className="order-first max-w-[46ch] lg:order-none">
            <H2>Budgets with brakes.</H2>
            <P className="mt-5">
              You set the daily cap and the cost-per-lead rule. The machine moves budget between
              ads only inside them — never more than 15% in one move, never past your cap.
            </P>
          </div>
        </div>
      </Section>

      {/* ── Show: CRM ───────────────────────────────────────────────────── */}
      <Section className="py-16 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-[46ch]">
            <H2>Nothing waits in a WhatsApp group.</H2>
            <P className="mt-5">
              A lead lands owned, tied to the exact ad that produced it. The call queue puts
              broken promises first — 72 hours without contact and the whole desk sees it.
            </P>
          </div>
          <Browser title="app.yourbrokerage.ae/crm">
            <MiniCRM />
          </Browser>
        </div>
      </Section>

      {/* ── Show: the log ───────────────────────────────────────────────── */}
      <Section className="py-16 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Ledger rows={LOG_ROWS} className="lg:order-first" />
          <div className="order-first max-w-[46ch] lg:order-none">
            <H2>Every automatic move, written down.</H2>
            <P className="mt-5">
              Before the machine touches a budget, the reason is on record: the rule, the amount,
              the campaign. Read the log over coffee and know what ran overnight.
            </P>
          </div>
        </div>
      </Section>

      {/* ── How it runs ─────────────────────────────────────────────────── */}
      <Section className="py-16 lg:py-24">
        <Eyebrow className="mb-8">How it runs</Eyebrow>
        <StepRail
          steps={[
            {
              title: 'Load your stock',
              body: 'Projects, prices, payment plans, media. Each listing scored as it goes in.',
            },
            {
              title: 'Connect Meta when ready',
              body: 'Your ad account, your billing. Until then, live spend stays off.',
            },
            {
              title: 'The machine runs',
              body: 'You watch the desk. Leads land owned; every automatic move is written down.',
            },
          ]}
        />
      </Section>

      {/* ── The money rules ─────────────────────────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        <PunchGrid
          items={[
            { title: 'No rule, no spend.', body: 'Nothing moves money until you write the rule.' },
            {
              title: 'Spend caps per day and per move.',
              body: "A single move can't shift more than 15% of the daily budget.",
            },
            {
              title: 'A campaign with a weak page cannot launch.',
              body: 'The gate reads the page before the ad goes live.',
            },
          ]}
        />
      </Section>

      {/* ── Facts ───────────────────────────────────────────────────────── */}
      <StatBand
        items={[
          { value: '14 days', label: 'Trial, no card', note: 'The workspace exists within a minute of the form.' },
          { value: 'Yours', label: 'Own database', note: 'Your records live in their own schema. No other company can reach them.' },
          { value: '3', label: 'Languages', note: 'English · العربية · Русский. Arabic runs right-to-left.' },
          { value: 'OFF', label: 'Live spend, by default', note: 'Nothing spends until you connect your own ad account.' },
        ]}
      />

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
