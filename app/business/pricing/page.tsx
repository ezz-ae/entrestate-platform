import type { Metadata } from 'next'
import {
  Section, Eyebrow, Display, Lede, H3, P, Guardrail, SectionHeading,
  ButtonLink, TextLink,
} from '@/components/business/ui'
import {
  PunchGrid, StatBand, FeatureTile, TileGrid, GlowBand, NextStep,
} from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Plans',
  description:
    'Three plans: Lead Machine for the brokerage, Listing-to-Landing for the public site, Meta for Realtors for one agent. Talk to us for current pricing.',
  alternates: { canonical: '/business/pricing' },
}

interface Plan {
  name: string
  who: string
  basis: string
  /** Stays null until the client supplies figures — adding a number is one line. */
  price: string | null
  line: string
  includes: string[]
  cta: { label: string; href: string }
  featured?: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Lead Machine',
    who: 'For brokerages',
    basis: 'Monthly, per workspace',
    price: null,
    line: 'The complete platform, on your own address.',
    includes: [
      'Inventory, pages, ads, CRM, reports',
      'Your brand, your address, your own database',
      'Roles for agents, managers, marketing, directors',
      'English, العربية, Русский',
      'Spend caps and the decision log',
      '14-day trial, no card',
    ],
    cta: { label: 'Start a 14-day trial', href: '/signup' },
    featured: true,
  },
  {
    name: 'Listing-to-Landing',
    who: 'For companies needing the public face',
    basis: 'Setup, then monthly',
    price: null,
    line: 'Your public site, with the desk behind it.',
    includes: [
      'Your public site, on your domain',
      'A landing page for every listing',
      'Search buyers actually use',
      'Enquiries land in the CRM, owned',
      'Everything in Lead Machine behind it',
      'Set up on request',
    ],
    cta: { label: 'Talk to us', href: '/business/contact' },
  },
  {
    name: 'Meta for Realtors',
    who: 'For one agent',
    basis: 'Monthly membership',
    price: null,
    line: 'Ads for a single desk, run like a team.',
    includes: [
      'Campaigns built from your listing',
      'Budgets with caps you set',
      'Leads to your WhatsApp',
      'Your Meta account, your own spend',
      'Reports in plain words',
    ],
    cta: { label: 'Get membership', href: '/business/contact' },
  },
]

export default function PricingPage() {
  const next = nextInTour('/business/pricing')!

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <Section className="pb-14 pt-16 lg:pb-16 lg:pt-24">
        <Eyebrow>Plans</Eyebrow>
        <div className="mt-5 max-w-[44rem]">
          <Display>Plans.</Display>
        </div>
        <div className="mt-6 max-w-[52ch]">
          <Lede>
            One for the whole brokerage, one for your public face, one for a single
            agent&rsquo;s ads.
          </Lede>
        </div>
      </Section>

      {/* ── The three columns ───────────────────────────────────────────── */}
      <Section className="pb-20">
        <div className="grid grid-cols-1 gap-px lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col p-8 outline outline-1 ${
                p.featured
                  ? 'bg-[#0E1013] outline-[#D4AF37]/40'
                  : 'bg-[#0C0E11] outline-white/[0.07]'
              }`}
            >
              <Eyebrow>{p.who}</Eyebrow>
              <H3 className="mt-4 !text-[1.25rem]">{p.name}</H3>
              <p className="mt-2.5 text-[0.9375rem] leading-[1.65] text-[#9BA1A9]">{p.line}</p>
              <div className="mt-6 border-y border-white/[0.07] py-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#D4AF37]">
                  {p.basis}
                </div>
                <div className="mt-2 text-[0.9375rem] text-white">
                  {p.price ?? 'Talk to us for current pricing.'}
                </div>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {p.includes.map((i) => (
                  <li key={i} className="flex gap-3 text-[0.875rem] leading-[1.6] text-[#9BA1A9]">
                    <span aria-hidden className="mt-[0.6em] h-px w-2.5 shrink-0 bg-[#4A5058]" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <ButtonLink href={p.cta.href} variant={p.featured ? 'primary' : 'ghost'}>
                  {p.cta.label}
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── The money rules ─────────────────────────────────────────────── */}
      <GlowBand>
        <Eyebrow>How the money works</Eyebrow>
        <div className="mt-8">
          <PunchGrid
            items={[
              {
                title: 'One platform fee.',
                body: 'Monthly, per workspace. It never moves with your lead count.',
              },
              {
                title: 'Your ad spend stays yours.',
                body: 'Paid direct to Meta and Google. We take no cut.',
              },
              {
                title: 'Leave with your records.',
                body: 'Export leads, deals and campaign history any time.',
              },
            ]}
          />
        </div>
      </GlowBand>

      {/* ── Included everywhere ─────────────────────────────────────────── */}
      <Section className="py-20 lg:py-24">
        <SectionHeading eyebrow="In every plan" title="Not sold as upgrades." />
        <div className="mt-12">
          <TileGrid cols={4}>
            <FeatureTile
              icon="team"
              title="Every role"
              body="Agents, managers, marketing, directors — one fee covers the team."
            />
            <FeatureTile
              icon="globe"
              title="Three languages"
              body="English, العربية, Русский. Arabic flips the whole layout right-to-left."
            />
            <FeatureTile
              icon="lock"
              title="Your own database"
              body="Your leads and deals live in their own schema."
            />
            <FeatureTile
              icon="ledger"
              title="Spending controls"
              body="Caps, rules, and the decision log on every automatic move."
            />
          </TileGrid>
        </div>
      </Section>

      {/* ── Own server ──────────────────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
          <SectionHeading
            eyebrow="For larger companies"
            title="Your own server."
            lede={<Lede>Same software, your infrastructure, your own database.</Lede>}
          />
          <div className="space-y-4 lg:pt-2">
            <P>Arranged as a setup, then monthly. Your records never sit on shared ground.</P>
            <P>
              Say so early — it changes how the first month is planned.{' '}
              <TextLink href="/business/contact">Ask about a dedicated deployment</TextLink>.
            </P>
          </div>
        </div>
      </Section>

      {/* ── Straight answers ────────────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
          <SectionHeading eyebrow="Before you ask" title="Straight answers." />
          <Guardrail
            title="Asked every week"
            items={[
              <><span className="text-white">Do you take a cut of ad spend?</span> No. You pay Meta and Google directly.</>,
              <><span className="text-white">What happens after the trial?</span> It stops. No card was taken, nothing is charged.</>,
              <><span className="text-white">Is there a setup fee?</span> Not for Lead Machine — the workspace exists within a minute.</>,
              <><span className="text-white">Can we export and leave?</span> Yes. Your leads, deals and campaign history go with you.</>,
              <><span className="text-white">Do we still need an agency?</span> Not for the mechanics. Keep the person who knows your market.</>,
            ]}
          />
        </div>
      </Section>

      <StatBand
        items={[
          { value: '14 days', label: 'Free trial', note: 'No card taken.' },
          { value: '0%', label: 'of your ad spend', note: 'We take no percentage.' },
          { value: '3', label: 'languages in every plan', note: 'English, العربية, Русский' },
        ]}
      />

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
