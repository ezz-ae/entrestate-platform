import type { Metadata } from 'next'
import { Section, Eyebrow, Display, Lede, ButtonLink } from '@/components/business/ui'
import { PunchGrid, NextStep } from '@/components/business/visuals'
import { Holder, HolderRow, Keyword, KeywordSub, LearnMore } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'
import { FULL_SYSTEM, FULL_SYSTEM_CTA } from '@/lib/business/full-system'

export const metadata: Metadata = {
  title: 'Security & control',
  description:
    'Your company’s records kept apart, seven roles checked on every screen, delete reserved for the owner — and 86 checks before any release.',
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
            Who sees a lead, who moves money, who deletes — your role decides, every time.
          </Lede>
        </div>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href={FULL_SYSTEM.startHref}>{FULL_SYSTEM_CTA}</ButtonLink>
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
              body: 'Every new screen ships private until someone deliberately opens it.',
            },
            {
              title: 'Your records are yours alone.',
              body: 'Each company’s leads, deals and campaigns are kept apart. No other company can reach them.',
            },
            {
              title: 'A role never sees past its rank.',
              body: 'The menu, the page and the numbers all obey the same rule.',
            },
            {
              title: '86 checks before any release.',
              body: 'A release stops if a security rule quietly changes.',
            },
          ]}
        />
      </Section>

      {/* Who-sees-what detail lives in the team-roles guide — the holders
          only carry the law. */}
      <Section className="pb-24 lg:pb-32">
        <div className="space-y-5">
          <Holder tone="gold" size="xl">
            <Keyword>Seven roles, one law.</Keyword>
            <KeywordSub>
              Broker to owner — each role sees its own work, and no further.
            </KeywordSub>
            <LearnMore href="/business/docs/team-roles" label="See who sees what" />
          </Holder>

          <HolderRow>
            <Holder tone="green">
              <Keyword as="h3">Your leads stay owned.</Keyword>
              <KeywordSub>A fresh lead stays with its broker. A worked lead — for good.</KeywordSub>
            </Holder>
            <Holder tone="blue">
              <Keyword as="h3">Only the owner deletes.</Keyword>
              <KeywordSub>
                Everyone else archives. Every attempt goes on the record, allowed or refused.
              </KeywordSub>
            </Holder>
          </HolderRow>
        </div>
      </Section>

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
