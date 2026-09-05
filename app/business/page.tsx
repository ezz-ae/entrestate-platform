import type { Metadata } from 'next'
import Link from 'next/link'
import { Section, Band, Eyebrow, Display, H2, Lede, ButtonLink, SectionHeading, TextLink } from '@/components/business/ui'
import {
  FeatureTile, TileGrid, PunchGrid, StatBand, NextStep, type GlyphName,
} from '@/components/business/visuals'
import { CropReel } from '@/components/business/crop-reel'
import {
  RocketAdCrop, VerdictCrop, ReachCrop, AudienceCrop, LandingRowsCrop, AiEditCrop, LeadformCrop, MicrositeCrop, SpendRuleCrop, CompanyCrop,
} from '@/components/business/crops'
import { Holder, Keyword, KeywordSub, LearnMore, DownloadCard } from '@/components/business/holders'
import { PLATFORM, nextInTour } from '@/lib/business/nav'
import {
  FULL_SYSTEM, FULL_SYSTEM_CTA, FULL_SYSTEM_PRICE_LINE, FULL_SYSTEM_START_NOTE,
} from '@/lib/business/full-system'
import { ExplorerSection } from '@/components/business/explorer'
import { LoopSection } from '@/components/business/loop'

export const metadata: Metadata = {
  // Absolute: this page names the whole site, so it must not inherit the
  // product site's suffix from the root layout.
  title: { absolute: 'Entrestate — Listings go in. Deals come out.' },
  description:
    `The full system a real-estate company runs on — pages, ads, leads, follow-up and the team — under your name, on your own address. AED ${FULL_SYSTEM.monthlyAed.toLocaleString('en-US')} a month.`,
  alternates: { canonical: '/business' },
}

/**
 * THE FULL SYSTEM'S ONE PAGE.
 *
 * /business sells one thing: the complete operation, installed under the
 * company's own name. It used to open three doors at once (the whole system,
 * the public-site add-on, the one-agent ads app) and a reader who had never
 * heard of Entrestate had to route themselves before they knew what any of
 * it was. The owner's arrangement is simpler — the apps live on the account,
 * the system is what a company buys — so this page says the one thing, shows
 * every part of it, names the price, and opens the one door: /signup.
 *
 * The parts are read from PLATFORM (lib/business/nav) so the page cannot
 * list a part the site has no page for, plus the team — one account, no
 * password to hand out — which is the shape the one-door work made true.
 */

/** A glyph for each platform part, keyed by its route so nav stays the source. */
const PART_GLYPH: Record<string, GlyphName> = {
  '/business/platform/inventory': 'inventory',
  '/business/platform/advertising': 'gauge',
  '/business/platform/landing-pages': 'page',
  '/business/platform/creative': 'ads',
  '/business/platform/crm': 'chat',
  '/business/platform/intelligence': 'target',
  '/business/platform/analytics': 'spend',
}

export default function BusinessHome() {
  const next = nextInTour('/business')!
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <Section className="pb-20 pt-16 lg:pb-28 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <Eyebrow>The full system for a real-estate company</Eyebrow>
            <div className="mt-5 max-w-[44rem]">
              <Display>Listings go in. Deals come out.</Display>
            </div>
            <div className="mt-6 max-w-[46ch]">
              <Lede>
                Everything in between — pages, ads, leads, follow-up, the team — runs on one
                system, under your name, on your own address.
              </Lede>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href={FULL_SYSTEM.startHref}>{FULL_SYSTEM_CTA}</ButtonLink>
              <ButtonLink href="/business/pricing" variant="ghost">
                See what it costs
              </ButtonLink>
            </div>
            <p className="mt-5 text-[0.8125rem] text-ink-faint">{FULL_SYSTEM_START_NOTE}</p>
          </div>
          {/* The reel: the product's strong options, one at a time, cut large
              enough to read — never a whole screen in a small frame, never a
              tool the product does not have. */}
          <CropReel
            frames={[
              { key: 'rocket', caption: 'Rocket Ad — one source, one budget, an ad that starts paused.', node: <RocketAdCrop /> },
              { key: 'verdict', caption: 'Inventory — every listing scored, one verdict, one next action.', node: <VerdictCrop /> },
              { key: 'landing', caption: 'Landing pages — one per property, gated on ad readiness.', node: <LandingRowsCrop /> },
              { key: 'reach', caption: 'Who this reaches — the live targeting, read back from Meta.', node: <ReachCrop /> },
              { key: 'audience', caption: 'Rated leads become the audience next month’s ads chase.', node: <AudienceCrop /> },
              { key: 'aiedit', caption: 'Edit any page from the Expert chat. Reversible.', node: <AiEditCrop /> },
              { key: 'microsite', caption: 'A whole project website, generated in one click.', node: <MicrositeCrop /> },
              { key: 'company', caption: 'Company-wide leads, deals and commission — the report you send upstairs.', node: <CompanyCrop /> },
            ]}
          />
        </div>
      </Section>

      {/* ── What you get — every part, from the site's own map ──────────── */}
      <Section className="pb-20 lg:pb-28">
        <SectionHeading eyebrow="What you get" title="The whole operation, part by part." />
        <div className="mt-12">
          <TileGrid>
            {PLATFORM.map((p) => (
              <FeatureTile
                key={p.href}
                icon={PART_GLYPH[p.href] ?? 'flow'}
                title={p.label}
                body={p.blurb}
                href={p.href}
              />
            ))}
            <FeatureTile
              icon="team"
              title="Team & roles"
              body="Seven roles, enforced on every screen. A person is added by email and signs in with their own Entrestate account."
              href="/business/docs/team-roles"
            />
          </TileGrid>
        </div>
      </Section>

      {/* ── The pitch, in three holders — the Keywords alone carry it.
             Each visual is a crop of a real screen; the words claim only
             what that screen does. ── */}
      <Section className="pb-20 lg:pb-28">
        <div className="space-y-5">
          <Holder tone="gold" label="Ads Machine · rules" visual={<SpendRuleCrop flush />}>
            <Keyword>Budgets with brakes.</Keyword>
            <KeywordSub>The machine spends like it&rsquo;s your money — inside rules you wrote. Every move written down, with its reason.</KeywordSub>
            <LearnMore href="/business/docs/spend-rules" />
          </Holder>

          <Holder tone="green" label="Leadformer" visual={<LeadformCrop flush />}>
            <Keyword>A form that talks back.</Keyword>
            <KeywordSub>No fields. It greets by name, asks what a good salesperson asks, and hands you a lead that already told you everything.</KeywordSub>
            <LearnMore href="/business/leadformer" />
          </Holder>

          <Holder tone="blue" label="Audiences" visual={<AudienceCrop flush />}>
            <Keyword>Deals teach targeting.</Keyword>
            <KeywordSub>
              Every rating teaches the machine what to buy. Rated leads become the audience next
              month&rsquo;s ads chase — not Meta&rsquo;s first guess.
            </KeywordSub>
            <LearnMore href="/business/docs/audiences" />
          </Holder>
        </div>
      </Section>

      {/* ── One price, one door ─────────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-28">
        <div className="bg-surface p-8 rounded-2xl border border-brand/25 shadow-(--shadow-card) lg:p-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <Eyebrow>One price</Eyebrow>
              <p className="mt-4 font-sans text-[2rem] font-semibold leading-tight text-ink lg:text-[2.5rem]">
                {FULL_SYSTEM_PRICE_LINE}
              </p>
              <p className="mt-2 text-[1.125rem] leading-snug text-brand">
                The whole system, per workspace. Nothing sold in pieces.
              </p>
              <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-[1.7] text-ink-muted">
                Every part above, every role, three languages, your own address and your own
                database. Ad spend stays in your own Meta and Google accounts — it is never
                billed through us.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Inventory', 'Pages', 'Ads', 'Creative', 'CRM', 'Finance', 'Team'].map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-surface-2 px-3 py-1 text-[0.75rem] text-ink-muted ring-1 ring-line"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <ButtonLink href={FULL_SYSTEM.startHref}>{FULL_SYSTEM_CTA}</ButtonLink>
              <p className="max-w-[34ch] text-[0.8125rem] leading-[1.6] text-ink-faint lg:text-right">
                {FULL_SYSTEM_START_NOTE}
              </p>
              <TextLink href="/business/pricing">Every plan, line by line</TextLink>
            </div>
          </div>
        </div>
        <p className="mt-6 text-[0.875rem] leading-[1.7] text-ink-faint">
          Only need one app — ads for a single agent, a lead form that talks back? Those run on
          your account, with no workspace to set up.{' '}
          <Link href="/business/account" className="text-brand underline-offset-4 hover:underline">
            See your account
          </Link>
          .
        </p>
      </Section>

      {/* ── The team: one account, no password to hand out ──────────────── */}
      <Band className="bg-surface-2">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div>
            <Eyebrow>Your team</Eyebrow>
            <div className="mt-4">
              <H2>Add a person by email. That is the whole procedure.</H2>
            </div>
          </div>
          <div className="space-y-4 text-[0.9375rem] leading-[1.7] text-ink-muted">
            <p>
              A member signs in with their own Entrestate account — the same email you added.
              There is no password to hand out, none to reset, and nothing for them to install.
            </p>
            <p>
              Their role decides what they see, on every screen and every data request. Remove
              them and the door closes the same minute.
            </p>
            <p className="text-ink-faint">
              <TextLink href="/business/docs/team-roles">Seven roles, who sees what</TextLink>
            </p>
          </div>
        </div>
      </Band>

      {/* ── The product, part by part — real screens, one tab each ──────── */}
      <ExplorerSection />

      {/* ── The heartbeat — six stages, and the return that closes them ── */}
      <LoopSection />

      {/* ── The rules ───────────────────────────────────────────────────── */}
      <Band className="bg-surface-2">
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
            <p className="mt-3 text-[0.9375rem] leading-[1.7] text-ink-muted">
              Your first ad in five minutes. Spend runs in your own ad account, inside a cap you wrote.
            </p>
          </div>
          <ButtonLink href={FULL_SYSTEM.startHref}>{FULL_SYSTEM_CTA}</ButtonLink>
        </div>
      </Section>

      <NextStep href={next.href} label="Meet the Lead Machine" note={next.blurb} />
    </>
  )
}
