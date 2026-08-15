import type { Metadata } from 'next'
import { Section, Eyebrow, Display, Lede, H3, ButtonLink, TextLink } from '@/components/business/ui'
import { PunchGrid, StatBand, GlowBand, NextStep } from '@/components/business/visuals'
import { DownloadCard, Holder, HolderRow, Keyword, KeywordSub, LearnMore } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Plans',
  description:
    'Three plans: Lead Machine monthly, Listing-to-Landing set up on request, Meta for Realtors on tokens as you run ads. Talk to us for current pricing.',
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
    line: 'Makes leads from your listings, then works them to the deal.',
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
    basis: 'Setup on request',
    price: null,
    line: 'Your public site, with the desk behind it.',
    includes: [
      'Your public site, on your domain',
      'A landing page for every listing',
      'Search buyers actually use',
      'Enquiries land in the CRM, owned',
      'Everything in Lead Machine behind it',
    ],
    cta: { label: 'Talk to us', href: '/business/contact' },
  },
  {
    name: 'Meta for Realtors',
    who: 'For one agent',
    basis: 'Tokens, as you run ads',
    price: null,
    line: 'Ads for a single desk, run like a team.',
    includes: [
      'Pay with tokens as you run ads',
      'No monthly fee',
      'Campaigns built from your listing',
      'Budgets with caps you set',
      'Leads to your WhatsApp',
      'Ad spend stays in your own Meta account',
    ],
    cta: { label: 'Get access', href: '/business/contact' },
  },
]

export default function PricingPage() {
  const next = nextInTour('/business/pricing')!

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <Section className="pb-10 pt-16 lg:pb-12 lg:pt-24">
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

      {/* ── The one-pager, before the columns: it travels further than a URL ─ */}
      <Section className="pb-14 lg:pb-16">
        <DownloadCard />
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
                title: 'Your ad spend stays yours.',
                body: 'Paid direct to Meta and Google. We take no cut.',
              },
              {
                title: 'The trial just stops.',
                body: '14 days, no card taken. When it ends, nothing is charged.',
              },
              {
                title: 'Leave with your records.',
                body: 'Export leads, deals and campaign history any time.',
              },
            ]}
          />
        </div>
      </GlowBand>

      {/* ── Two doors: bigger deployments, and the first month ──────────── */}
      <Section className="py-20 lg:py-24">
        <HolderRow cols={2}>
          <Holder>
            <Keyword as="h3">Your own server.</Keyword>
            <KeywordSub>Same software, your infrastructure, your records on your own ground.</KeywordSub>
            <p className="mt-7 text-[0.9375rem]">
              <TextLink href="/business/contact">Ask about a dedicated deployment</TextLink>
            </p>
          </Holder>
          <Holder tone="gold">
            <Keyword as="h3">The first month.</Keyword>
            <KeywordSub>Load stock, pages go live, connect Meta, read the report.</KeywordSub>
            <LearnMore href="/business/docs/get-set-up" label="See the thirty days" />
          </Holder>
        </HolderRow>
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
