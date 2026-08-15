import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Section, Eyebrow, Display, Lede, ButtonLink, SectionHeading } from '@/components/business/ui'
import {
  Browser,
  Phone,
  Chat,
  MiniInventory,
  MiniPage,
  MiniCampaigns,
  MiniCRM,
  MiniReport,
  PunchGrid,
  GlowBand,
  NextStep,
} from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'Six stops from a listing to a closed deal — page, campaign, lead, deal, and the report that teaches next month’s ads.',
  alternates: { canonical: '/business/how-it-works' },
}

/* Each stop: ≤5-word title, ≤20-word body, and the screen that proves it.
   The mini carries the meaning; the copy only points at it. */
const STOPS: Array<{ title: string; body: string; visual: ReactNode }> = [
  {
    title: 'Load the stock',
    body: 'Every listing is scored. Weak stock is flagged “not fit to advertise” before it can touch a budget.',
    visual: (
      <Browser title="app.yourbrokerage.ae/inventory" className="w-full max-w-[460px]">
        <MiniInventory />
      </Browser>
    ),
  },
  {
    title: 'Every listing gets a page',
    body: 'Built from the listing’s own price, plan and photos. A weak page cannot carry a campaign.',
    visual: (
      <div className="w-full max-w-[300px]">
        <Browser title="yourbrokerage.ae/marina-vista-2br">
          <MiniPage />
        </Browser>
      </div>
    ),
  },
  {
    title: 'Launch with brakes on',
    body: 'Campaigns launch paused, permit checked. Budgets move only inside rules you wrote.',
    visual: (
      <Browser title="app.yourbrokerage.ae/campaigns" className="w-full max-w-[460px]">
        <MiniCampaigns />
      </Browser>
    ),
  },
  {
    title: 'The lead lands owned',
    body: 'It arrives with its campaign attached, gets an owner, and the first-reply clock starts.',
    visual: (
      <Phone className="w-[250px]">
        <Chat />
      </Phone>
    ),
  },
  {
    title: 'Won or lost, and why',
    body: 'The deal carries its value and commission split, in the same books as the spend.',
    visual: (
      <Browser title="app.yourbrokerage.ae/crm" className="w-full max-w-[460px]">
        <MiniCRM />
      </Browser>
    ),
  },
  {
    title: 'Closed deals teach the targeting',
    body: 'Closed buyers become the seed. Next month’s ads chase people like them — not Meta’s first guess.',
    visual: (
      <Browser title="app.yourbrokerage.ae/reports" className="w-full max-w-[420px]">
        <MiniReport />
      </Browser>
    ),
  },
]

export default function HowItWorksPage() {
  const next = nextInTour('/business/how-it-works')!
  return (
    <>
      <Section className="pb-16 pt-16 lg:pb-20 lg:pt-24">
        <Eyebrow>How it works</Eyebrow>
        <div className="mt-5 max-w-[44rem]">
          <Display>From listing to closed.</Display>
        </div>
        <div className="mt-6 max-w-[56ch]">
          <Lede>The whole path, in order. No step skipped, no step hidden.</Lede>
        </div>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/signup">Start a 14-day trial</ButtonLink>
          <ButtonLink href="/business/platform/inventory" variant="ghost">
            See the platform
          </ButtonLink>
        </div>
      </Section>

      <Section className="pb-24 lg:pb-32">
        <div className="relative">
          {/* The spine: one line from stock to report, so the order reads as one path. */}
          <div aria-hidden className="absolute bottom-3 left-[9px] top-3 hidden w-px bg-white/[0.08] lg:block" />
          <ol className="space-y-16 lg:space-y-24">
            {STOPS.map((s, i) => (
              <li
                key={s.title}
                className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[2.75rem_minmax(0,24rem)_minmax(0,1fr)] lg:gap-10"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="relative bg-[#07090C] py-1 font-mono text-[0.9375rem] tabular-nums text-[#D4AF37]"
                    dir="ltr"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span aria-hidden className="h-px flex-1 bg-white/[0.08] lg:hidden" />
                </div>
                <div className="lg:pt-1">
                  <h2 className="font-serif text-[1.5rem] leading-[1.2] tracking-[-0.01em] text-white sm:text-[1.7rem]">
                    {s.title}
                  </h2>
                  <p className="mt-3 max-w-[44ch] text-[0.9375rem] leading-[1.7] text-[#9BA1A9]">{s.body}</p>
                </div>
                <div className="min-w-0">{s.visual}</div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <GlowBand>
        <SectionHeading eyebrow="Who decides" title="Where the machine stops." />
        <div className="mt-10">
          <PunchGrid
            items={[
              { title: 'No rule, no spend.', body: 'Budgets cannot move on their own without a limit you wrote.' },
              {
                title: 'Campaigns launch paused.',
                body: 'Nothing spends because a screen was opened. A person switches it live.',
              },
              {
                title: 'Every move is written down.',
                body: 'Each automatic budget move lands in the log with the rule behind it.',
              },
            ]}
          />
        </div>
      </GlowBand>

      <NextStep
        href={next.href}
        label="Start the tour: Inventory"
        note={next.blurb}
        progress="Chapter 1 of 7"
      />
    </>
  )
}
