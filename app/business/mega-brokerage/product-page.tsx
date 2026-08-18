/**
 * The Mega Brokerage Platform page, as a plain component.
 *
 * It lives outside page.tsx because TWO routes render it: its own
 * /business/mega-brokerage, and /business/listing-to-landing, which still
 * exists only to serve the listing.entrestate.com product door (see the
 * comment on that file). A route importing another route's page.tsx is a
 * trick that works until it doesn't; a shared component is just a component.
 */
import { Section, Eyebrow, Display, Lede, SectionHeading, ButtonLink } from '@/components/business/ui'
import {
  Browser, MiniPage, StepRail, PunchGrid, StatBand, GlowBand, NextStep,
} from '@/components/business/visuals'
import { PlatformLoop } from '@/components/business/loop'
import { Holder, HolderRow, Keyword, KeywordSub, LearnMore } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'

/** One description, two routes — so the two never drift apart. */
export const MEGA_BROKERAGE_DESCRIPTION =
  'The public site buyers land on and the desk that runs it — one catalogue, a page per project, ads, CRM and finance. Your domain, your database. Setup on request.'

/**
 * A real capture from the demo workspace at skyline.entrestate.com, sized to
 * the 1600×1000 frame every file under /public/business/screens was taken at.
 * Only shots that exist may be used, and each alt describes what is actually
 * in the frame — a page that illustrates a claim with a screen the product
 * does not have is the one lie a buyer never forgives.
 */
function Shot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[1600/1000] bg-app">
      <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
    </div>
  )
}

export function MegaBrokerageProductPage() {
  const next = nextInTour('/business/mega-brokerage')!

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <Section className="pb-16 pt-16 lg:pb-24 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <Eyebrow>Mega Brokerage Platform · the storefront and the desk behind it</Eyebrow>
            <div className="mt-5 max-w-[44rem]">
              <Display>Own the address buyers land on.</Display>
            </div>
            <div className="mt-7 max-w-[46ch]">
              <Lede>
                A public site carrying every project you sell, and the system that runs it —
                catalogue, pages, ads, CRM, finance. One company login. One address for the buyer.
              </Lede>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/business/contact">Request setup</ButtonLink>
              <ButtonLink href="#what-you-get" variant="ghost">
                What you get
              </ButtonLink>
            </div>
            {/* Access model, stated in the hero: this product carries the
                client’s public identity and is provisioned for large-scale
                operators, so a self-serve button would promise a door that
                does not open. See the pricing page and the Terminal’s apps
                page, which say the same thing in the same words. */}
            <p className="mt-7 text-[0.8125rem] leading-[1.6] text-[#7C838B]">
              Setup on request, with our team. Built for large-scale operators — your domain, your
              database, your stock.
            </p>
          </div>

          {/* The storefront sits in front of the desk: the buyer sees the page,
              the company sees the workspace. Both frames are what they claim —
              a real capture behind, the public page pattern in front. */}
          <div className="relative isolate">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-10 -inset-y-14 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.07),transparent_65%)]"
            />
            <div className="grid">
              <div className="min-w-0 sm:col-start-1 sm:row-start-1 sm:pb-10 sm:pr-28 lg:pr-36">
                <div className="sm:-rotate-1">
                  <Browser title="skyline.entrestate.com">
                    <Shot
                      src="/business/screens/desk.webp"
                      alt="The workspace home — three items needing attention, lead counters, and projects flagged as missing a landing page."
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

      {/* ── What you get, holder by holder ──────────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        {/* Anchor lives on a div: Section’s API deliberately has no id prop. */}
        <div id="what-you-get" className="scroll-mt-24" />
        <div className="flex flex-col gap-4 lg:gap-5">
          <Holder
            tone="gold"
            size="xl"
            visual={
              <Browser title="yourbrokerage.ae/marina-vista-2br" className="mx-auto w-full max-w-[380px] lg:mx-0">
                <MiniPage />
              </Browser>
            }
          >
            <Keyword size="xl">Your address, not theirs.</Keyword>
            <KeywordSub>
              A buyer searching your project lands on your site, next to nobody else’s listing.
            </KeywordSub>
            <LearnMore href="/business/docs/landing-pages" label="See how a page is built" />
          </Holder>

          <Holder
            tone="green"
            visual={
              <Browser title="skyline.entrestate.com/inventory">
                <Shot
                  src="/business/screens/inventory.webp"
                  alt="Inventory grouped by developer — 21 developers and 621 units, each developer group showing average readiness, live pages and leads in the last 30 days."
                />
              </Browser>
            }
          >
            <Keyword>One catalogue.</Keyword>
            <KeywordSub>
              Every project grouped by developer, each carrying how ready its stock is to advertise.
            </KeywordSub>
            <LearnMore href="/business/docs/inventory" label="See stock and scores" />
          </Holder>

          <Holder
            tone="gold"
            visual={
              <Browser title="skyline.entrestate.com/inventory/landing-pages">
                <Shot
                  src="/business/screens/landings.webp"
                  alt="The landing-page list — counters for live, pending, draft and missing pages, above project rows badged Live with Campaign and Edit buttons."
                />
              </Browser>
            }
          >
            <Keyword>A page per project.</Keyword>
            <KeywordSub>
              Live, pending, draft or missing — the projects with no page are counted, not hidden.
            </KeywordSub>
            <LearnMore href="/business/landing-pages" label="See the Landing Pages product" />
          </Holder>

          <Holder
            tone="blue"
            visual={
              <Browser title="skyline.entrestate.com/crm">
                <Shot
                  src="/business/screens/crm-leads.webp"
                  alt="The CRM command centre — 40 leads across seven pipeline stages, with unowned leads flagged at the top and each row showing temperature, stage, project and budget."
                />
              </Browser>
            }
          >
            <Keyword>Enquiries land owned.</Keyword>
            <KeywordSub>
              Every form writes into the CRM, tagged with the page and ad behind it.
            </KeywordSub>
            <LearnMore href="/business/docs/lead-flow" label="See how leads flow" />
          </Holder>

          <Holder
            visual={
              <Browser title="skyline.entrestate.com/finance">
                <Shot
                  src="/business/screens/finance.webp"
                  alt="Company finance — net commission, total expenses and net position, with spend split by category and an expense ledger listing payee and status."
                />
              </Browser>
            }
          >
            <Keyword>The money side.</Keyword>
            <KeywordSub>
              Commission against expenses, by category, with what is still owed to agents.
            </KeywordSub>
            <LearnMore href="/business/docs/reports" label="See how the money reads" />
          </Holder>

          <Holder
            tone="blue"
            visual={
              <Browser title="skyline.entrestate.com/analytics">
                <Shot
                  src="/business/screens/analytics.webp"
                  alt="Company analytics — leads, conversions, closing rate, sales volume and commission, each marked live, with tabs for company, team, market and marketing."
                />
              </Browser>
            }
          >
            <Keyword>What you send upstairs.</Keyword>
            <KeywordSub>
              Leads, conversions, closing rate and commission — company, team, market, marketing.
            </KeywordSub>
          </Holder>

          <Holder
            tone="green"
            visual={
              <Browser title="skyline.entrestate.com/integrations">
                <Shot
                  src="/business/screens/integrations.webp"
                  alt="Integrations — two of seven external systems connected, one item marked critical and held back before launch, with filters for connected, partial and disconnected."
                />
              </Browser>
            }
          >
            <Keyword>Nothing hidden.</Keyword>
            <KeywordSub>
              Seven connections with their real state. Ads stay off until the critical ones connect.
            </KeywordSub>
            <LearnMore href="/business/docs/get-set-up" label="See what has to connect" />
          </Holder>

          <HolderRow cols={3}>
            <Holder>
              <Keyword as="h3">Area profiles.</Keyword>
              <KeywordSub>
                A page per community, so a Dubai Marina search can land on you.
              </KeywordSub>
            </Holder>
            <Holder>
              <Keyword as="h3">Developer profiles.</Keyword>
              <KeywordSub>
                Track record, flagship launches and delivery context on every developer you sell.
              </KeywordSub>
            </Holder>
            <Holder>
              <Keyword as="h3">Three languages.</Keyword>
              <KeywordSub>
                English, العربية and Русский — on the public pages and inside the desk.
              </KeywordSub>
            </Holder>
          </HolderRow>
        </div>
      </Section>

      {/* ── The loop: stock → page → ads → lead → learning → targeting ──── */}
      <Section className="pb-16 lg:pb-24">
        <SectionHeading
          eyebrow="How the parts connect"
          title="Stock, page, ad, lead — one loop."
          lede={
            <Lede>
              Change a price once and it moves through the page, the ad and the CRM. Closed deals
              teach the next campaign who to buy.
            </Lede>
          }
        />
        <div className="mt-10 lg:mt-12">
          <PlatformLoop />
        </div>
      </Section>

      {/* ── Setup on request ────────────────────────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        <Holder size="xl">
          <Keyword>Built with you.</Keyword>
          <KeywordSub>It carries your name in public, so our team sets it up.</KeywordSub>
          <div className="mt-10">
            <StepRail
              steps={[
                {
                  title: 'We load your stock',
                  body: 'Projects, units, prices, payment plans, photos — before any design talk.',
                },
                {
                  title: 'Your site goes live',
                  body: 'Your brand, your domain. Project pages, area profiles, developer profiles.',
                },
                {
                  title: 'The desk opens behind it',
                  body: 'Roles for agents, managers, marketing and directors. Every lead gets an owner.',
                },
                {
                  title: 'Ads point at your own pages',
                  body: 'Traffic you pay for lands on a page you own, and the lead comes back attributed.',
                },
              ]}
            />
          </div>
          <div className="mt-10">
            <ButtonLink href="/business/contact">Request setup</ButtonLink>
          </div>
        </Holder>
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
              body: 'No payment plan on file, none on the page.',
            },
            {
              title: 'An ad cannot point at a dead page.',
              body: 'Missing or unpublished, the launch stops before the money.',
            },
          ]}
        />
      </Section>

      {/* ── Facts ───────────────────────────────────────────────────────── */}
      {/* Every value here is a property of the product, not a result: the
          schema-per-tenant rule, the three shipped languages, the seven roles
          in the access matrix, the nineteen section types in
          lib/landing-pages.ts. Outcomes belong to a customer’s own numbers and
          are not printed on a marketing page. */}
      <StatBand
        items={[
          {
            value: 'Yours',
            label: 'Domain and database',
            note: 'Your own address, your own schema. No other company reads your records.',
          },
          {
            value: '3',
            label: 'Languages, everywhere',
            note: 'English · العربية · Русский',
          },
          {
            value: '7',
            label: 'Roles across the desk',
            note: 'Agents, managers, marketing, directors — each sees its own slice.',
          },
          {
            value: '19',
            label: 'Sections a project page can carry',
            note: 'No real data for a section, the section hides itself.',
          },
        ]}
      />

      {/* ── The close: ownership ────────────────────────────────────────── */}
      <GlowBand>
        <SectionHeading
          eyebrow="Why it is worth owning"
          title="A portal rents you attention. This is your own address."
        />
        <div className="mt-12">
          <PunchGrid
            items={[
              {
                title: 'The link is yours.',
                body: 'Your domain, your pages. Traffic you buy lands on property you own.',
              },
              {
                title: 'The data is yours.',
                body: 'Buyers, enquiries and photos sit in your own schema.',
              },
              {
                title: 'The stock is yours.',
                body: 'One catalogue feeds the site, the ads and the CRM. Change a price once.',
              },
            ]}
          />
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href="/business/contact">Request setup</ButtonLink>
          <ButtonLink href="/business/pricing" variant="ghost">
            See plans
          </ButtonLink>
        </div>
      </GlowBand>

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
