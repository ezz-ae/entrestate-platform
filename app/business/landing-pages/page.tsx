import type { Metadata } from 'next'
import { Section, Eyebrow, Display, Lede, SectionHeading, ButtonLink } from '@/components/business/ui'
import {
  Browser, MiniPage, StepRail, PunchGrid, StatBand, GlowBand, NextStep,
} from '@/components/business/visuals'
import { SceneChatBuilds } from '@/components/business/scenes'
import { Holder, HolderRow, Keyword, KeywordSub, LearnMore } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Landing Pages',
  description:
    'Pick a project from your inventory and get a page for it — built from that project’s own photos, price and payment plan, with the form wired into your CRM.',
  alternates: { canonical: '/business/landing-pages' },
}

/**
 * A real capture from the demo workspace at skyline.entrestate.com, sized to
 * the 1600×1000 frame every file under /public/business/screens was taken at.
 * Only shots that exist may be used, and each alt describes what is actually
 * in the frame — the screen is the evidence for the sentence beside it.
 */
function Shot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[1600/1000] bg-app">
      <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
    </div>
  )
}

/**
 * The three templates that ship, read off LANDING_TEMPLATES in
 * lib/landing-templates.ts. Block counts are the length of each skeleton, so a
 * template that gains a section here is a template whose count is wrong on the
 * page — check both when one changes. Copy is imported by hand rather than
 * mapped from the module: the module’s aiHint is written for the assistant,
 * and a marketing page should not read like a prompt.
 */
const TEMPLATES: Array<{ name: string; blocks: string; body: string }> = [
  {
    name: 'Classic.',
    blocks: '16 blocks',
    body: 'Market read, key facts, ROI, amenities, FAQ, brochure. For a buyer who wants depth.',
  },
  {
    name: 'Campaign.',
    blocks: '9 blocks',
    body: 'Form under the hero, and again at the end. Point cold Meta traffic here.',
  },
  {
    name: 'Signature.',
    blocks: '14 blocks',
    body: 'Visuals and amenities first, Golden Visa after. For waterfront and branded launches.',
  },
]

export default function LandingPagesPage() {
  const next = nextInTour('/business/landing-pages')!

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <Section className="pb-16 pt-16 lg:pb-24 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <Eyebrow>Landing Pages · a page per project, from your own stock</Eyebrow>
            <div className="mt-5 max-w-[44rem]">
              <Display>Pick a project. Get a page.</Display>
            </div>
            <div className="mt-7 max-w-[46ch]">
              <Lede>
                The page is built from that project’s own photos, price and payment plan. The form
                on it writes straight into your CRM, tagged with the page it came from.
              </Lede>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/signup">Start a 14-day trial</ButtonLink>
              <ButtonLink href="#templates" variant="ghost">
                See the templates
              </ButtonLink>
            </div>
            {/* Access model: this ships inside Lead Machine, which is the
                self-serve product — so the CTA is the trial, not a request
                for setup. Keep it in step with /business/pricing. */}
            <p className="mt-7 text-[0.8125rem] leading-[1.6] text-[#7C838B]">
              Included with Lead Machine. Pages run on your own domain.
            </p>
          </div>

          <div className="relative isolate">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-10 -inset-y-14 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.07),transparent_65%)]"
            />
            <div className="grid">
              <div className="min-w-0 sm:col-start-1 sm:row-start-1 sm:pb-10 sm:pr-28 lg:pr-36">
                <div className="sm:-rotate-1">
                  <Browser title="skyline.entrestate.com/inventory/landing-pages">
                    <Shot
                      src="/business/screens/landings.webp"
                      alt="The landing-page list — counters for live, pending, draft and missing pages, a banner naming the projects with no page, then project rows badged Live."
                    />
                  </Browser>
                </div>
              </div>
              <div className="mt-6 flex justify-center sm:col-start-1 sm:row-start-1 sm:mt-0 sm:items-end sm:justify-end">
                <div className="w-[220px] sm:w-[250px] sm:rotate-2">
                  <Browser title="yourbrokerage.ae/marina-vista-2br">
                    <MiniPage />
                  </Browser>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── The mechanic, holder by holder ──────────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Holder
            tone="gold"
            size="xl"
            visual={
              <Browser title="skyline.entrestate.com/inventory/landing-pages">
                <Shot
                  src="/business/screens/landings.webp"
                  alt="Landing-page counters — live, pending, draft and missing — above a search box, state filters and project rows with Campaign and Edit buttons."
                />
              </Browser>
            }
          >
            <Keyword size="xl">Live, pending, draft, missing.</Keyword>
            <KeywordSub>
              Four states, one screen. The projects with no page are counted, not quietly skipped.
            </KeywordSub>
            <LearnMore href="/business/docs/landing-pages" label="See the launch gate" />
          </Holder>

          <Holder
            tone="green"
            visual={
              <Browser title="skyline.entrestate.com/inventory">
                <Shot
                  src="/business/screens/inventory.webp"
                  alt="Inventory grouped by developer — project rows carrying area, unit type, bedroom range, price and lead count."
                />
              </Browser>
            }
          >
            <Keyword>Built from your stock.</Keyword>
            <KeywordSub>
              Photos, price, area, developer and payment plan come off the project record.
            </KeywordSub>
            <LearnMore href="/business/docs/inventory" label="See stock and scores" />
          </Holder>

          <Holder
            tone="blue"
            visual={
              <Browser title="skyline.entrestate.com/ads/forms">
                <Shot
                  src="/business/screens/forms.webp"
                  alt="Lead gen forms — four forms feeding the CRM, each row showing leads captured, how many reached the CRM, and an average lead value."
                />
              </Browser>
            }
          >
            <Keyword>The form is the CRM.</Keyword>
            <KeywordSub>
              A submitted form becomes a lead with an owner. Nothing is retyped by hand.
            </KeywordSub>
            <LearnMore href="/business/docs/lead-flow" label="See how leads flow" />
          </Holder>

          <Holder
            visual={
              <Browser title="skyline.entrestate.com/crm">
                <Shot
                  src="/business/screens/crm-leads.webp"
                  alt="The CRM command centre — leads listed with temperature, stage, project, budget and the agent who owns each one."
                />
              </Browser>
            }
          >
            <Keyword>Where it lands.</Keyword>
            <KeywordSub>
              Named, timed and staged from the first minute, beside the project it asked about.
            </KeywordSub>
          </Holder>
        </div>
      </Section>

      {/* ── The story, no text: ask, build, gate ────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        <Eyebrow>Watch one get built</Eyebrow>
        <div className="mt-6">
          <SceneChatBuilds />
        </div>
      </Section>

      {/* ── Templates ───────────────────────────────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        {/* Anchor lives on a div: Section’s API deliberately has no id prop. */}
        <div id="templates" className="scroll-mt-24" />
        <SectionHeading
          eyebrow="Templates"
          title="Three layouts today. More when a campaign needs one."
          lede={
            <Lede>
              Every template draws from the same nineteen blocks — a new layout is a new order of
              them, not a new page to maintain.
            </Lede>
          }
        />
        <HolderRow cols={3} className="mt-10 lg:mt-12">
          {TEMPLATES.map((t) => (
            <Holder key={t.name}>
              <Eyebrow className="mb-3">{t.blocks}</Eyebrow>
              <Keyword as="h3">{t.name}</Keyword>
              <KeywordSub>{t.body}</KeywordSub>
            </Holder>
          ))}
        </HolderRow>
      </Section>

      {/* ── Guardrails ──────────────────────────────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        <PunchGrid
          items={[
            {
              title: 'A weak page cannot go live.',
              body: 'Publishing needs a manager’s approval.',
            },
            {
              title: 'No invented numbers.',
              body: 'No payment plan on file, none on the page. A section with no data hides itself.',
            },
            {
              title: 'An ad cannot point at a dead page.',
              body: 'Missing or unpublished, the launch stops before the money.',
            },
          ]}
        />
      </Section>

      {/* ── Facts ───────────────────────────────────────────────────────── */}
      {/* Each value is a countable property of the product, not a result:
          nineteen LandingSectionType values and the three LANDING_TEMPLATES in
          lib/landing-templates.ts, the three languages in lib/landing-i18n.ts,
          and CLOSING_SOON_DAYS in lib/freehold/landing-preflight.ts. */}
      <StatBand
        items={[
          {
            value: '19',
            label: 'Blocks a page can carry',
            note: 'Hero, gallery, payment plan, ROI, FAQ, brochure, form.',
          },
          {
            value: '3',
            label: 'Templates today',
            note: 'Classic, Campaign, Signature — and the list is meant to grow.',
          },
          {
            value: '3',
            label: 'Languages on one URL',
            note: 'English · العربية · Русский',
          },
          {
            value: '7 days',
            label: 'Warning before a page goes dark',
            note: 'A publish window closing mid-campaign is flagged before the launch.',
          },
        ]}
      />

      {/* ── The close ───────────────────────────────────────────────────── */}
      <GlowBand>
        <SectionHeading eyebrow="Get access" title="From a project row to a live page." />
        <div className="mt-12">
          <StepRail
            steps={[
              {
                title: 'Pick the project',
                body: 'Any row in your inventory. Its photos, price and terms are already there.',
              },
              {
                title: 'Choose a template',
                body: 'Classic for depth, Campaign for cold traffic, Signature for a launch.',
              },
              {
                title: 'Publish, then point ads at it',
                body: 'A manager approves it. Every lead comes back tagged with the page.',
              },
            ]}
          />
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href="/signup">Start a 14-day trial</ButtonLink>
          <ButtonLink href="/business/contact" variant="ghost">
            Talk to a human
          </ButtonLink>
        </div>
      </GlowBand>

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
