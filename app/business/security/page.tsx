import type { Metadata } from 'next'
import {
  Section,
  Band,
  Eyebrow,
  Display,
  Lede,
  P,
  SectionHeading,
  SpecTable,
  ButtonLink,
} from '@/components/business/ui'
import {
  PunchGrid,
  FeatureTile,
  TileGrid,
  StatBand,
  NextStep,
  GlowBand,
} from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Security & control',
  description:
    'Your company in its own database schema, seven roles checked on every request, delete reserved for the owner — and 86 checks before any release.',
  alternates: { canonical: '/business/security' },
}

export default function SecurityPage() {
  const next = nextInTour('/business/security')!
  return (
    <>
      <Section className="pb-14 pt-16 lg:pb-20 lg:pt-24">
        <Eyebrow>Security &amp; control</Eyebrow>
        <div className="mt-5 max-w-[44rem]">
          <Display>Locked by default.</Display>
        </div>
        <div className="mt-6 max-w-[54ch]">
          <Lede>
            Who sees a lead, who moves money, who deletes — your role decides, on every request.
          </Lede>
        </div>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/signup">Start a 14-day trial</ButtonLink>
          <ButtonLink href="/business/contact" variant="ghost">
            Talk to us
          </ButtonLink>
        </div>
      </Section>

      {/* Punches first — on this page the rules are the product. */}
      <Section className="pb-20 lg:pb-28">
        <PunchGrid
          cols={4}
          items={[
            {
              title: 'Closed by default.',
              body: 'Every new screen and API address ships private until someone deliberately opens it.',
            },
            {
              title: 'Your database is yours alone.',
              body: 'Every company gets its own schema — its own tables, reached by its own address.',
            },
            {
              title: 'A role never sees past its rank.',
              body: 'The menu, the page and the data request all read the same rule.',
            },
            {
              title: '86 checks before any release.',
              body: 'The build fails if a security rule quietly changes.',
            },
          ]}
        />
      </Section>

      <GlowBand>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Isolation"
              title="One company, one schema."
              lede={
                <Lede>
                  Your leads, deals and campaigns live in their own database schema. No other
                  company can reach them.
                </Lede>
              }
            />
            <div className="mt-6 max-w-[54ch] space-y-4">
              <P>
                The address picks the schema before any query runs. A query for your company
                cannot even name another company&rsquo;s tables.
              </P>
              <P>
                A sign-in for your workspace dies on any other address. Paste the cookie somewhere
                else and you get a login screen, not data.
              </P>
            </div>
          </div>
          <SpecTable
            caption="Enforced, not promised"
            rows={[
              {
                k: 'Your address',
                v: <>yourcompany.entrestate.com — the address picks the database, before any query runs.</>,
              },
              {
                k: 'Sign-in cookie',
                v: <>Valid on your address only. Any other workspace refuses it, both directions.</>,
              },
              {
                k: 'Unknown address',
                v: <>Fails closed. It never falls back to shared data.</>,
              },
              {
                k: 'Ad-account keys',
                v: <>Encrypted at rest (AES-256-GCM), stored per company, never shown back.</>,
              },
              {
                k: 'Tested on every change',
                v: <>A check signs up two companies and proves each cannot see the other.</>,
              },
            ]}
          />
        </div>
      </GlowBand>

      <Section className="py-20 lg:py-28">
        <SectionHeading
          eyebrow="Roles"
          title="Seven roles, one list."
          lede={
            <Lede>
              Hidden in the menu, blocked on the page, refused by the API — one list drives all
              three.
            </Lede>
          }
        />
        <div className="mt-12">
          <SpecTable
            caption="Who sees what"
            rows={[
              { k: 'Broker', v: <>Their own leads, campaigns and credits. Nothing company-wide.</> },
              {
                k: 'Team leader',
                v: <>Works every campaign, owns none. Cannot delete, cannot touch a worked lead.</>,
              },
              {
                k: 'Sales manager',
                v: <>The pipeline, the team, lead assignment and deal-document verification.</>,
              },
              {
                k: 'Marketing',
                v: <>Ads, budgets, creative and campaign analytics. No finance, no deals, no per-person numbers.</>,
              },
              { k: 'Director', v: <>Everything operational, plus final deal approval.</> },
              { k: 'Admin', v: <>Everything, plus workspace settings. Still cannot delete a lead.</> },
              {
                k: 'Owner (CEO)',
                v: <>Everything — and the only role that deletes a lead or a campaign.</>,
              },
            ]}
          />
        </div>
      </Section>

      <Band className="bg-[#090B0E]">
        <SectionHeading
          eyebrow="Ownership"
          title="Your leads stay owned."
          lede={
            <Lede>
              Hour six: a team leader tries to pull a fresh lead off Omar K. The system refuses,
              and names the exact hour the rule lifts.
            </Lede>
          }
        />
        <div className="mt-12">
          <TileGrid cols={3}>
            <FeatureTile
              icon="lock"
              title="Only the owner deletes"
              body="Everyone else archives the lead or pauses the campaign. Delete is one role."
            />
            <FeatureTile
              icon="clock"
              title="A new lead stays put"
              body="A broker keeps a new lead 24 hours. A worked lead — for good."
            />
            <FeatureTile
              icon="ledger"
              title="Refusals go on the record"
              body="The log keeps every delete and reassign attempt — allowed or refused, with the reason."
            />
          </TileGrid>
        </div>
      </Band>

      {/* Keeps the band's hairline and the StatBand's from doubling up. */}
      <div aria-hidden className="h-16 lg:h-24" />

      <StatBand
        items={[
          {
            value: '7',
            label: 'Roles',
            note: 'Broker to owner — checked on every page and every API call.',
          },
          {
            value: '1',
            label: 'Role that deletes',
            note: 'The owner. Admins and team leaders archive or pause.',
          },
          {
            value: '24h',
            label: 'New-lead protection',
            note: 'A team leader cannot pull a fresh lead off a broker. A worked lead — never.',
          },
          {
            value: '86',
            label: 'Checks before release',
            note: 'The build fails if a rule quietly changes.',
          },
        ]}
      />

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
