import type { Metadata } from 'next'
import {
  Section, Eyebrow, Display, H2, Lede, P, ButtonLink, SectionHeading,
} from '@/components/business/ui'
import {
  HeroVisual, Browser, MiniPage, MiniCRM, TileGrid, FeatureTile, StepRail,
  PunchGrid, StatBand, GlowBand, NextStep,
} from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Listing-to-Landing',
  description:
    'Your public site, a landing page for every listing, and the desk behind it. Set up with our team, on your own domain.',
  alternates: { canonical: '/business/listing-to-landing' },
}

const next = nextInTour('/business/listing-to-landing')!

export default function ListingToLandingPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Section className="pb-16 pt-16 lg:pb-24 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div>
            <Eyebrow>Your public face</Eyebrow>
            <Display className="mt-5">A website that sells, not sits.</Display>
            <Lede className="mt-6 max-w-[42ch]">
              Your public site, a landing page for every listing, and the desk that runs it all
              behind the scenes.
            </Lede>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/business/contact">Talk to us</ButtonLink>
              <ButtonLink href="/business/platform/inventory" variant="ghost">
                See the platform
              </ButtonLink>
            </div>
            <p className="mt-5 font-mono text-[11px] text-[#6E747C]">
              Set up with our team, on request. Your own domain.
            </p>
          </div>
          <HeroVisual variant="listing" />
        </div>
      </Section>

      {/* ── What you get ─────────────────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-28">
        <TileGrid cols={4}>
          <FeatureTile
            icon="page"
            title="A page per listing"
            body="Price, payment plan, gallery, form — built from the listing record in one click."
            href="/business/platform/landing-pages"
          />
          <FeatureTile
            icon="globe"
            title="Search buyers actually use"
            body="Filter by area, price, handover, developer. Sold-out stock is marked, not hidden."
          />
          <FeatureTile
            icon="ledger"
            title="Enquiries with a paper trail"
            body="Every form writes into the CRM with the page and campaign behind it."
            href="/business/platform/crm"
          />
          <FeatureTile
            icon="brand"
            title="Your domain, your brand"
            body="The site runs on your address. No vendor marking anywhere a buyer looks."
          />
        </TileGrid>
      </Section>

      {/* ── Show: the page ───────────────────────────────────────────────── */}
      <Section className="py-16 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <H2>Every listing gets a page that closes.</H2>
            <P className="mt-5 max-w-[48ch]">
              One click on a listing builds its page — price, payment plan, gallery, WhatsApp
              button, lead form. Edit the listing and the live page follows.
            </P>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Browser title="yourbrokerage.ae/lp/marina-vista-2br" className="w-full max-w-[380px]">
              <MiniPage />
            </Browser>
          </div>
        </div>
      </Section>

      {/* ── Show: the desk behind it ─────────────────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <H2>Enquiries land owned, not lost.</H2>
            <P className="mt-5 max-w-[48ch]">
              Every form on your site writes into the CRM — tagged with the page and campaign
              that produced it. An agent owns it from the first minute.
            </P>
          </div>
          <div className="lg:order-first">
            <Browser title="app.yourbrokerage.ae/crm">
              <MiniCRM />
            </Browser>
          </div>
        </div>
      </Section>

      {/* ── The scene ────────────────────────────────────────────────────── */}
      <GlowBand>
        <Eyebrow>Sold out, overnight</Eyebrow>
        <p className="mt-6 max-w-[46ch] font-serif text-[1.6rem] leading-[1.4] tracking-[-0.01em] text-white sm:text-[1.9rem]">
          A project sells out at midnight. The page stays live with a SOLD OUT badge — the
          campaign never 404s, the ranking survives.
        </p>
      </GlowBand>

      {/* ── Setup on request ─────────────────────────────────────────────── */}
      <Section className="py-20 lg:py-28">
        <SectionHeading
          eyebrow="Setup on request"
          title="Set up with you, not self-served."
          lede={
            <Lede>It carries your name in public. Setup runs with our team, on request.</Lede>
          }
        />
        <div className="mt-12">
          <StepRail
            steps={[
              {
                title: 'We load your inventory',
                body: 'Projects, prices, payment plans, photos — agreed before any design talk.',
              },
              {
                title: 'Your site goes live on your domain',
                body: 'Your brand on every page. Certificates and search basics handled.',
              },
              {
                title: 'Every enquiry lands in the CRM, owned',
                body: 'Named, timed, attributed to its page — and assigned to an agent.',
              },
            ]}
          />
        </div>
      </Section>

      {/* ── Guardrails ───────────────────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-28">
        <Eyebrow className="mb-8">Guardrails</Eyebrow>
        <PunchGrid
          items={[
            {
              title: 'A weak page cannot go live.',
              body: 'Publishing needs a manager’s approval. Ads are refused a page that is not live.',
            },
            {
              title: 'No invented numbers.',
              body: 'No payment plan on file means no payment plan on the page.',
            },
            {
              title: 'Drafts stay invisible.',
              body: 'An unpublished page shows a 404 to everyone but your team.',
            },
          ]}
        />
      </Section>

      {/* ── Facts ────────────────────────────────────────────────────────── */}
      <StatBand
        items={[
          {
            value: '3',
            label: 'Languages on every page',
            note: 'English, العربية, Русский — Arabic laid out right to left',
          },
          {
            value: '13',
            label: 'Checks on the live page',
            note: 'Speed, lead form, WhatsApp link, translations — before ads point at it',
          },
          {
            value: '19',
            label: 'Sections a page can carry',
            note: 'A section with no real data hides itself',
          },
        ]}
      />

      {/* CTA is contact, not signup: the product carries the client's public
          identity, so it is configured with our team rather than switched on. */}
      <Section className="py-20 lg:py-28">
        <div className="max-w-[52ch]">
          <H2>Start with a conversation.</H2>
          <P className="mt-5">
            The first conversation is about your inventory and your current site, not features.
            Bring both.
          </P>
          <div className="mt-8">
            <ButtonLink href="/business/contact">Talk to us</ButtonLink>
          </div>
        </div>
      </Section>

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
