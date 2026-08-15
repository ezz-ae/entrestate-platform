import type { Metadata } from 'next'
import Link from 'next/link'
import { Section, Band, Eyebrow, Display, H2, Lede, ButtonLink, SectionHeading } from '@/components/business/ui'
import {
  Browser, Phone, Chat, MiniCampaigns, MiniReport, HeroVisual,
  FeatureTile, TileGrid, PunchGrid, StatBand, NextStep,
} from '@/components/business/visuals'
import { Holder, Keyword, KeywordSub, LearnMore, DownloadCard } from '@/components/business/holders'
import { PRODUCTS, PLATFORM, nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  // Absolute: this page names the whole site, so it must not inherit the
  // product site's suffix from the root layout.
  title: { absolute: 'Entrestate for Business — Listings go in. Deals come out.' },
  description:
    'Pages, ads, leads and follow-up under your name — one system from listing to closed deal, with numbers you can defend.',
  alternates: { canonical: '/business' },
}

/* The five product branches (the Learn taxonomy) as group labels over the
   seven tour chapters — the strip teaches the platform's shape at a glance. */
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

      {/* ── The pitch, in three holders — the Keywords alone carry it ───── */}
      <Section className="pb-20 lg:pb-28">
        <div className="space-y-5">
          <Holder
            tone="gold"
            visual={
              <Browser title="app.yourbrokerage.ae/campaigns">
                <MiniCampaigns />
              </Browser>
            }
          >
            <Keyword>Budgets with brakes.</Keyword>
            <KeywordSub>The machine spends like it&rsquo;s your money — inside rules you wrote.</KeywordSub>
            <LearnMore href="/business/docs/spend-rules" />
          </Holder>

          <Holder
            tone="green"
            visual={
              <div className="flex justify-center">
                <Phone className="w-[240px] sm:w-[270px]">
                  <Chat />
                </Phone>
              </div>
            }
          >
            <Keyword>Leads answered fast.</Keyword>
            <KeywordSub>At 2:47am a lead asks in Arabic. By 2:48 it&rsquo;s answered and owned.</KeywordSub>
            <LearnMore href="/business/docs/lead-flow" />
          </Holder>

          <Holder
            tone="blue"
            visual={
              <Browser title="app.yourbrokerage.ae/reports">
                <MiniReport />
              </Browser>
            }
          >
            <Keyword>Deals teach targeting.</Keyword>
            <KeywordSub>
              Next month&rsquo;s ads chase people who look like your buyers — not Meta&rsquo;s first
              guess.
            </KeywordSub>
            <LearnMore href="/business/docs/audiences" />
          </Holder>
        </div>
      </Section>

      {/* ── Products ────────────────────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-28">
        <SectionHeading eyebrow="Products" title="One system. Three ways in." />
        <div className="mt-12 grid grid-cols-1 gap-px lg:grid-cols-3">
          {[
            {
              ...PRODUCTS[0],
              who: 'Companies with agents',
              body: 'The whole platform under your name — inventory, ads, pages, CRM, the month-end report.',
              how: 'Self-serve · 14-day trial',
            },
            {
              ...PRODUCTS[1],
              who: 'Companies that need a public face',
              body: 'Your public website and a landing page for every listing, with the desk behind it.',
              how: 'Set up with you, on request',
            },
            {
              ...PRODUCTS[2],
              who: 'Individual agents',
              body: 'Campaigns built, launched, watched and corrected on Meta. No agency, no Ads Manager.',
              how: 'Tokens · pay as you run ads',
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

      {/* ── Platform chapters — one ordered path, 01 through 07 ─────────── */}
      <Section className="pb-20 lg:pb-28">
        <SectionHeading eyebrow="Inside the platform" title="Seven chapters. One database." />
        <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-8 border-t border-white/[0.06] pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORM.map((f, at) => (
            <li key={f.href}>
              <Link href={f.href} className="group block">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[0.8125rem] tabular-nums text-[#D4AF37]" dir="ltr">
                    {String(at + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[0.9375rem] font-semibold text-white">{f.label}</span>
                  <span aria-hidden className="text-[#D4AF37] opacity-0 transition group-hover:opacity-100">
                    →
                  </span>
                </div>
                <p className="mt-1.5 pl-[calc(0.8125rem*2+0.75rem)] text-[0.8125rem] leading-[1.55] text-[#8F959D]">
                  {f.blurb}
                </p>
              </Link>
            </li>
          ))}
        </ul>
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

      {/* ── The one-pager, for the owner's desk ─────────────────────────── */}
      <Section className="pb-20 lg:pb-28">
        <DownloadCard />
      </Section>

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
