import type { Metadata } from 'next'
import { Section, Eyebrow, Display, Lede, ButtonLink } from '@/components/business/ui'
import {
  HeroVisual, Browser, MiniPage, MiniCRM, MiniInventory, StepRail,
  PunchGrid, StatBand, GlowBand, NextStep,
} from '@/components/business/visuals'
import { Holder, Keyword, KeywordSub, LearnMore } from '@/components/business/holders'
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
            <Eyebrow>Listing-to-Landing · your public website, run properly</Eyebrow>
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

      {/* ── The site, holder by holder ───────────────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Holder
            tone="gold"
            visual={
              <Browser
                title="yourbrokerage.ae/lp/marina-vista-2br"
                className="mx-auto w-full max-w-[380px] lg:mx-0"
              >
                <MiniPage />
              </Browser>
            }
          >
            <Keyword>Page per listing.</Keyword>
            <KeywordSub>One click builds it. Edit the listing, the live page follows.</KeywordSub>
            <LearnMore href="/business/docs/landing-pages" label="See the launch gate" />
          </Holder>

          <Holder
            tone="green"
            visual={
              <Browser title="app.yourbrokerage.ae/inventory">
                <MiniInventory />
              </Browser>
            }
          >
            <Keyword>Reads your stock.</Keyword>
            <KeywordSub>Prices, payment plans, what&rsquo;s still selling — straight from your inventory.</KeywordSub>
            <LearnMore href="/business/docs/inventory" label="See stock and scores" />
          </Holder>

          <Holder
            tone="blue"
            visual={
              <Browser title="app.yourbrokerage.ae/crm">
                <MiniCRM />
              </Browser>
            }
          >
            <Keyword>Enquiries land owned.</Keyword>
            <KeywordSub>Every form writes into the CRM, tagged with the page behind it.</KeywordSub>
          </Holder>
        </div>
      </Section>

      {/* ── The scene ────────────────────────────────────────────────────── */}
      <GlowBand>
        <Eyebrow>Sold out, overnight</Eyebrow>
        <p className="mt-6 max-w-[46ch] font-serif text-[1.6rem] leading-[1.4] tracking-[-0.01em] text-white sm:text-[1.9rem]">
          A project sells out at midnight. The page stays live with a SOLD OUT badge — buyers
          still land, the link never dies.
        </p>
      </GlowBand>

      {/* ── Setup on request ─────────────────────────────────────────────── */}
      {/* CTA is contact, not signup: the product carries the client's public
          identity, so it is configured with our team rather than switched on. */}
      <Section className="py-16 lg:py-24">
        <Holder size="xl">
          <Keyword>Built with you.</Keyword>
          <KeywordSub>It carries your name in public, so our team sets it up.</KeywordSub>
          <div className="mt-10">
            <StepRail
              steps={[
                {
                  title: 'We load your inventory',
                  body: 'Projects, prices, payment plans, photos — before any design talk.',
                },
                {
                  title: 'Your site goes live',
                  body: 'Your brand, your domain. Certificates and search basics handled.',
                },
                {
                  title: 'Enquiries land in the CRM',
                  body: 'Named, timed, attributed — and owned by an agent.',
                },
              ]}
            />
          </div>
          <div className="mt-10">
            <ButtonLink href="/business/contact">Talk to us</ButtonLink>
          </div>
        </Holder>
      </Section>

      {/* ── Guardrails ───────────────────────────────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        <PunchGrid
          items={[
            {
              title: 'A weak page cannot go live.',
              body: 'Publishing needs a manager’s approval.',
            },
            { title: 'No invented numbers.', body: 'No payment plan on file, none on the page.' },
            {
              title: 'Drafts stay invisible.',
              body: 'An unpublished page doesn’t exist for buyers.',
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
            note: 'English · العربية · Русский',
          },
          {
            value: '13',
            label: 'Checks on the live page',
            note: 'Speed, form, WhatsApp link, translations',
          },
          {
            value: '19',
            label: 'Sections a page can carry',
            note: 'No real data, the section hides itself',
          },
        ]}
      />

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
