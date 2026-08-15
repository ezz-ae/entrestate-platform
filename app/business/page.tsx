import type { Metadata } from 'next'
import Link from 'next/link'
import { Section, Band, Eyebrow, Display, H2, Lede, ButtonLink, SectionHeading } from '@/components/business/ui'
import {
  Browser, Phone, Chat, MiniCampaigns, MiniReport, HeroVisual,
  FeatureTile, TileGrid, PunchGrid, StatBand, GlowBand, NextStep,
} from '@/components/business/visuals'
import { PRODUCTS, PLATFORM, nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  // Absolute: this page names the whole site, so it must not inherit the
  // product site's "| Freehold Property UAE" suffix from the root layout.
  title: { absolute: 'Entrestate for Business — Listings go in. Deals come out.' },
  description:
    'Pages, ads, leads and follow-up under your name — one system from listing to closed deal, with numbers you can defend.',
  alternates: { canonical: '/business' },
}

export default function BusinessHome() {
  const next = nextInTour('/business')!
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <Section className="pb-20 pt-16 lg:pb-28 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <Eyebrow>Entrestate for Business</Eyebrow>
            <div className="mt-5 max-w-[44rem]">
              <Display>Listings go in. Deals come out.</Display>
            </div>
            <div className="mt-6 max-w-[46ch]">
              <Lede>
                Entrestate runs everything in between — pages, ads, leads, follow-up — under your
                name, on your own address.
              </Lede>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/signup">Start a 14-day trial</ButtonLink>
              <ButtonLink href="/business/how-it-works" variant="ghost">
                See how it works
              </ButtonLink>
            </div>
            <p className="mt-5 text-[0.8125rem] text-[#6E747C]">
              No card. Your own address and your own database from the first screen.
            </p>
          </div>
          <HeroVisual variant="home" />
        </div>
      </Section>

      {/* ── What you get ────────────────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-28">
        <TileGrid>
          <FeatureTile
            icon="inventory"
            title="Inventory that's fit to sell"
            body="Every listing scored. Weak stock is flagged before it carries budget."
            href="/business/platform/inventory"
          />
          <FeatureTile
            icon="gauge"
            title="Ads with brakes"
            body="Spend caps per day and per move. No rule, no spend."
            href="/business/platform/advertising"
          />
          <FeatureTile
            icon="chat"
            title="Leads answered fast"
            body="Answer, language, owner — inside the first minute, day or night."
            href="/business/platform/crm"
          />
          <FeatureTile
            icon="report"
            title="Numbers you can defend"
            body="Spend, leads, deals — one report that adds up."
            href="/business/platform/analytics"
          />
        </TileGrid>
      </Section>

      {/* ── Show: the spend desk ────────────────────────────────────────── */}
      <Band>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <Eyebrow>Advertising</Eyebrow>
            <H2 className="mt-4">The machine spends like it&rsquo;s your money.</H2>
            <div className="mt-5 max-w-[42ch]">
              <Lede>Budgets move only inside rules you wrote. Every move is written down.</Lede>
            </div>
          </div>
          <Browser title="app.yourbrokerage.ae/campaigns">
            <MiniCampaigns />
          </Browser>
        </div>
      </Band>

      {/* ── Show: the first hour ────────────────────────────────────────── */}
      <Section className="py-20 lg:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>CRM</Eyebrow>
            <H2 className="mt-4">The first hour wins the deal.</H2>
            <div className="mt-5 max-w-[42ch]">
              <Lede>
                A lead lands at 2:47am asking about Marina Vista in Arabic. By 2:48 it has an
                answer, a language, and an owner.
              </Lede>
            </div>
          </div>
          <div className="flex justify-center lg:order-first">
            <Phone className="w-[250px] sm:w-[280px]">
              <Chat />
            </Phone>
          </div>
        </div>
      </Section>

      {/* ── Show: the return path ───────────────────────────────────────── */}
      <GlowBand>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <Eyebrow>The return path</Eyebrow>
            <H2 className="mt-4">Closed deals teach the targeting.</H2>
            <div className="mt-5 max-w-[42ch]">
              <Lede>
                Next month&rsquo;s ads chase people who look like your buyers — not Meta&rsquo;s
                first guess.
              </Lede>
            </div>
          </div>
          <Browser title="app.yourbrokerage.ae/reports">
            <MiniReport />
          </Browser>
        </div>
      </GlowBand>

      {/* ── Products ────────────────────────────────────────────────────── */}
      <Section className="py-20 lg:py-28">
        <SectionHeading eyebrow="Products" title="One system. Three ways in." />
        <div className="mt-12 grid grid-cols-1 gap-px lg:grid-cols-3">
          {[
            {
              ...PRODUCTS[0],
              who: 'Companies with agents',
              body: 'The whole platform under your name — inventory, ads, pages, CRM, the month-end report. Agents get a workspace; managers get the desk.',
              how: 'Self-serve · 14-day trial',
            },
            {
              ...PRODUCTS[1],
              who: 'Companies that need a public face',
              body: 'Your public website and a landing page for every listing — search, enquiry forms, and the desk behind it all.',
              how: 'Set up with you, on request',
            },
            {
              ...PRODUCTS[2],
              who: 'Individual agents',
              body: 'Campaigns built, launched, watched and corrected on Meta. No agency, no Ads Manager to learn.',
              how: 'Membership',
            },
          ].map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group flex flex-col bg-[#0C0E11] p-8 outline outline-1 outline-white/[0.07] transition hover:bg-[#101317]"
            >
              <Eyebrow>{p.who}</Eyebrow>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <div className="text-[1.25rem] font-semibold leading-snug text-white">{p.label}</div>
                <span aria-hidden className="text-[#D4AF37] opacity-0 transition group-hover:opacity-100">→</span>
              </div>
              <p className="mt-3.5 flex-1 text-[0.9375rem] leading-[1.7] text-[#9BA1A9]">{p.body}</p>
              <div className="mt-6 border-t border-white/[0.07] pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8A9099]">
                {p.how}
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ── Platform chapters ───────────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-28">
        <SectionHeading eyebrow="Inside the platform" title="Seven chapters. One database." />
        <div className="mt-10 divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {PLATFORM.map((f, i) => (
            <Link
              key={f.href}
              href={f.href}
              className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 py-4 transition hover:bg-white/[0.02] sm:grid-cols-[3.5rem_minmax(0,14rem)_1fr_auto]"
            >
              <span className="font-mono text-[0.8125rem] tabular-nums text-[#D4AF37]" dir="ltr">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[0.9375rem] font-semibold text-white">{f.label}</span>
              <span className="hidden truncate text-[0.875rem] text-[#8F959D] sm:block">{f.blurb}</span>
              <span aria-hidden className="text-[#D4AF37] opacity-0 transition group-hover:opacity-100">→</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* ── The rules ───────────────────────────────────────────────────── */}
      <Band className="bg-[#090B0E]">
        <SectionHeading eyebrow="How it behaves" title="What it refuses to do" />
        <div className="mt-10">
          <PunchGrid
            items={[
              { title: 'No rule, no spend.', body: 'Money moves only inside limits a person wrote.' },
              { title: 'A weak page cannot be advertised.', body: 'A page missing what buyers need is blocked from launch.' },
              { title: 'No invented numbers.', body: 'A figure is shown when known, left out when not.' },
              { title: 'Closed by default.', body: 'Every request is private unless explicitly opened.' },
              { title: 'Every automatic move is written down.', body: 'In plain words, with the reason, where the money is reconciled.' },
            ]}
          />
        </div>
      </Band>

      {/* ── Facts ───────────────────────────────────────────────────────── */}
      <div className="py-20 lg:py-28">
        <StatBand
          items={[
            { value: '171', label: 'Working screens', note: 'Screens people use — not modules or tabs.' },
            { value: '3', label: 'Languages', note: 'English, العربية, Русский. Arabic flips the layout.' },
            // 7 per lib/freehold/session-types.ts — the older "6 roles" copy is stale.
            { value: '7', label: 'Roles enforced everywhere', note: 'On every screen and every data request.' },
            { value: '82', label: 'Checks before any release', note: 'Automated tests that must pass to ship.' },
          ]}
        />
      </div>

      {/* ── Start ───────────────────────────────────────────────────────── */}
      <Section className="pb-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <H2>Start with your own address.</H2>
            <p className="mt-3 text-[0.9375rem] leading-[1.7] text-[#9BA1A9]">
              14 days, no card. Live spend stays off until you connect an ad account.
            </p>
          </div>
          <ButtonLink href="/signup">Start a 14-day trial</ButtonLink>
        </div>
      </Section>

      <NextStep href={next.href} label="Meet the Lead Machine" note={next.blurb} />
    </>
  )
}
