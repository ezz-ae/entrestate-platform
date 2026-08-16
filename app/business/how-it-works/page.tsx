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
import { Holder, Keyword, KeywordSub, LearnMore, type HolderTone } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'
import { LoopSection } from '@/components/business/loop'

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'Six stops from a listing to a closed deal — page, campaign, lead, deal, and the report that teaches next month’s ads.',
  alternates: { canonical: '/business/how-it-works' },
}

/* Each stop: a Keyword, one line, the screen that proves it, and one door
   into its guide. The Keywords alone must read as the whole path. */
const STOPS: Array<{
  title: string
  sub: string
  guide: string
  learn: string
  tone: HolderTone
  visual: ReactNode
}> = [
  {
    title: 'Load the stock.',
    sub: 'Every listing scored. Weak stock is flagged before it can carry a budget.',
    guide: '/business/docs/inventory',
    learn: 'How scoring works',
    tone: 'plain',
    visual: (
      <Browser title="app.yourbrokerage.ae/inventory">
        <MiniInventory />
      </Browser>
    ),
  },
  {
    title: 'Page per listing.',
    sub: 'Built from the listing’s own price, plan and photos. Weak pages are blocked.',
    guide: '/business/docs/landing-pages',
    learn: 'How the gate works',
    tone: 'blue',
    visual: (
      <Browser title="yourbrokerage.ae/marina-vista-2br" className="mx-auto w-full max-w-[300px]">
        <MiniPage />
      </Browser>
    ),
  },
  {
    title: 'Launch, paused.',
    sub: 'It always launches paused, so you see the ad before a dirham moves.',
    guide: '/business/docs/launch-a-campaign',
    learn: 'How launching works',
    tone: 'gold',
    visual: (
      <Browser title="app.yourbrokerage.ae/campaigns">
        <MiniCampaigns />
      </Browser>
    ),
  },
  {
    title: 'Leads land owned.',
    sub: 'The lead arrives with its campaign attached, an owner, and the clock running.',
    guide: '/business/docs/lead-flow',
    learn: 'How leads flow',
    tone: 'green',
    visual: (
      <div className="flex justify-center">
        <Phone className="w-[240px] sm:w-[260px]">
          <Chat />
        </Phone>
      </div>
    ),
  },
  {
    title: 'Won or lost.',
    sub: 'The deal carries its value and commission in the same books as the spend.',
    guide: '/business/docs/crm-day',
    learn: 'How the day runs',
    tone: 'plain',
    visual: (
      <Browser title="app.yourbrokerage.ae/crm">
        <MiniCRM />
      </Browser>
    ),
  },
  {
    title: 'Deals teach targeting.',
    sub: 'Closed buyers become the seed. Next month’s ads chase people like them.',
    guide: '/business/docs/audiences',
    learn: 'How audiences learn',
    tone: 'gold',
    visual: (
      <Browser title="app.yourbrokerage.ae/reports">
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

      {/* The whole system in one glance — the six deep stops follow below. */}
      <LoopSection />

      <Section className="pb-24 lg:pb-32">
        <ol className="space-y-5">
          {STOPS.map((s, i) => (
            <li key={s.title}>
              <Holder tone={s.tone} visual={s.visual}>
                <div className="font-mono text-[0.8125rem] tabular-nums text-[#3B82F6]" dir="ltr">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <Keyword className="mt-4">{s.title}</Keyword>
                <KeywordSub>{s.sub}</KeywordSub>
                <LearnMore href={s.guide} label={s.learn} />
              </Holder>
            </li>
          ))}
        </ol>
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
