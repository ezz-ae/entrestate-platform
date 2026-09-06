import type { Metadata } from 'next'
import { Section, Eyebrow, Display, H2, Lede, ButtonLink } from '@/components/business/ui'
import { GlowBand, NextStep, Ledger, PunchGrid, StatBand } from '@/components/business/visuals'
import { CropReel } from '@/components/business/crop-reel'
import {
  CompanyCrop, LandingRowsCrop, LeadCardCrop, RocketAdCrop, SpendRuleCrop, VerdictCrop,
} from '@/components/business/crops'
import { Holder, Keyword, KeywordSub, LearnMore, DownloadCard } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'
import { FULL_SYSTEM, FULL_SYSTEM_CTA } from '@/lib/business/full-system'

export const metadata: Metadata = {
  title: 'Lead Machine',
  description:
    'Your brokerage, on rails. Inventory, pages, ads, CRM and the month-end report — one system, your brand, your address. AED 500 on your account when you start.',
  alternates: { canonical: '/business/lead-machine' },
}

/* Every row names the rule that allowed the move — the ledger itself is the pitch. */
const LOG_ROWS = [
  { time: '09:14', event: 'budget +AED 150 → Marina Vista video — rule: cost/lead < AED 90', amount: '+AED 150' },
  { time: '09:15', event: 'budget −AED 150 → Creekside One carousel — cost/lead AED 212, over rule', amount: '−AED 150' },
  { time: '11:02', event: 'paused → Harbor Gate launch — daily cap reached', amount: 'held' },
  { time: '13:40', event: 'Bayview Terraces checked — inside its rules, no change' },
]

export default function LeadMachinePage() {
  const next = nextInTour('/business/lead-machine')!

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <Section className="pb-16 pt-16 lg:pb-24 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <Eyebrow>Lead Machine · lead generation for real-estate companies</Eyebrow>
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
              <ButtonLink href={FULL_SYSTEM.startHref}>{FULL_SYSTEM_CTA}</ButtonLink>
              <ButtonLink href="/business/pricing" variant="ghost">See pricing</ButtonLink>
            </div>
          </div>
          {/* The reel walks the machine in the order the page argues it:
              stock, page, ad, lead, rule, report. Each frame is a crop of
              the screen that does that job — the old hero stacked two whole
              app screens in browser frames, at a size where the pipeline
              columns and the unit cards were 8px of grey. */}
          <CropReel
            frames={[
              { key: 'verdict', caption: 'Every listing scored before it can carry a budget.', node: <VerdictCrop /> },
              { key: 'landing', caption: 'A page per property — a weak one cannot launch.', node: <LandingRowsCrop /> },
              { key: 'rocket', caption: 'One source, one budget, an ad that starts paused.', node: <RocketAdCrop /> },
              { key: 'lead', caption: 'The lead lands owned, tagged, and on a clock.', node: <LeadCardCrop /> },
              { key: 'rules', caption: 'No rule, no spend — and every move written down.', node: <SpendRuleCrop /> },
              { key: 'company', caption: 'Leads, deals and commission in one report.', node: <CompanyCrop /> },
            ]}
          />
        </div>
      </Section>

      {/* ── The scene ───────────────────────────────────────────────────── */}
      <GlowBand>
        <div className="mx-auto max-w-[62ch] text-center">
          <H2>2:47am. A lead asks in Arabic.</H2>
          <div className="mt-6">
            {/* Not "it has an answer": the system does not answer the lead.
                By 2:48 it has routed it, tagged the language and started the
                clock — and Omar answers. Same wording as /business/platform/crm
                and the lead card crop, so the claim is one claim. */}
            <Lede>
              By 2:48 it has an owner, a language tag and a follow-up on the clock. Omar K. wakes
              to a named lead and calls it back.
            </Lede>
          </div>
        </div>
      </GlowBand>

      {/* ── The system, holder by holder ────────────────────────────────── */}
      <Section className="py-16 lg:py-24">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Holder tone="green" label="Inventory" visual={<VerdictCrop flush />}>
            <Keyword>Fit to sell.</Keyword>
            <KeywordSub>Every listing carries a score before it carries a budget.</KeywordSub>
          </Holder>

          <Holder tone="gold" label="Ads Machine · rules" visual={<SpendRuleCrop flush />}>
            <Keyword>Budgets with brakes.</Keyword>
            <KeywordSub>With no rule, it spends nothing on its own.</KeywordSub>
            <LearnMore href="/business/docs/spend-rules" label="See the spend rules" />
          </Holder>

          <Holder tone="blue" label="CRM · new lead" visual={<LeadCardCrop flush />}>
            <Keyword>Owned on arrival.</Keyword>
            <KeywordSub>Every lead lands owned, tied to the exact ad that produced it.</KeywordSub>
            <LearnMore href="/business/docs/lead-flow" label="See how leads flow" />
          </Holder>

          <Holder visual={<Ledger rows={LOG_ROWS} />}>
            <Keyword>Written down.</Keyword>
            <KeywordSub>Every automatic move: the rule, the amount, the campaign — on record.</KeywordSub>
          </Holder>

          <Holder>
            <Keyword>Thirty days.</Keyword>
            <KeywordSub>Load your stock, connect Meta when ready, watch the desk run.</KeywordSub>
            <LearnMore href="/business/docs/get-set-up" label="See the 30-day path" />
          </Holder>
        </div>
      </Section>

      {/* ── The money rules + the one-pager ─────────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        <PunchGrid
          items={[
            { title: 'No rule, no spend.', body: 'Nothing moves money until you write the rule.' },
            { title: 'Caps per day and per move.', body: 'It never spends past your cap.' },
            {
              title: 'A weak page cannot launch.',
              body: 'The gate reads the page before the ad goes live.',
            },
          ]}
        />
        <DownloadCard className="mt-4 lg:mt-5" />
      </Section>

      {/* ── Facts ───────────────────────────────────────────────────────── */}
      <StatBand
        items={[
          { value: 'AED 500', label: 'On your account when you start', note: 'It comes off your bills. The workspace exists within a minute.' },
          { value: 'Yours', label: 'Own database', note: 'No other company can reach your records.' },
          { value: '3', label: 'Languages', note: 'English · العربية · Русский' },
          { value: 'OFF', label: 'Live spend, by default', note: 'Nothing spends until you connect your own ad account.' },
        ]}
      />

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
