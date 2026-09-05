import type { Metadata } from 'next'
import { Section, PageHeader, H3, SpecTable, TextLink, Mono } from '@/components/business/ui'
import { NextStep } from '@/components/business/visuals'
import { Holder } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'
import { BRAND } from '@/lib/freehold/brand'
import { ContactForm } from './_form'

export const metadata: Metadata = {
  title: 'Talk to a human',
  description:
    'A person who knows the product answers within one working day. Ask about your brokerage, your public site, or a dedicated deployment.',
  alternates: { canonical: '/business/contact' },
}

export default function ContactPage() {
  const next = nextInTour('/business/contact')!

  return (
    <>
      <PageHeader
        eyebrow="Talk to us"
        title="Talk to a human."
        lede={<>A person who knows the product answers. No sequence, no drip.</>}
        meta={[
          { k: 'Reply', v: 'Within one working day' },
          { k: 'Based in', v: 'Dubai, UAE' },
        ]}
      />

      <Section className="pb-20 lg:pb-28">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-6">
          <Holder className="min-w-0">
            <ContactForm />
          </Holder>

          <div className="flex flex-col gap-5">
            <Holder className="flex-1">
              <H3>Write directly</H3>
              <p className="mt-3 text-[0.9375rem] leading-[1.7] text-ink-muted">
                Know your question already? Email{' '}
                <TextLink href={`mailto:${BRAND.email}`}>
                  <Mono>{BRAND.email}</Mono>
                </TextLink>{' '}
                — it reaches the same people.
              </p>
              <div className="mt-8">
                <H3>What helps</H3>
                <p className="mt-3 text-[0.9375rem] leading-[1.7] text-ink-muted">
                  How many agents, how many projects, and where a lead lands today.
                </p>
              </div>
            </Holder>

            <Holder tone="gold">
              <H3>Or just start</H3>
              <p className="mt-3 text-[0.9375rem] leading-[1.7] text-ink-muted">
                The workspace exists within a minute. Open the desk, click around, come back with
                questions. <TextLink href="/signup">Start one</TextLink>.
              </p>
            </Holder>
          </div>
        </div>
      </Section>

      {/* Answers already written down — so the form carries real questions only. */}
      <Section className="pb-20 lg:pb-24">
        <SpecTable
          caption="Already answered"
          rows={[
            {
              k: 'What does it cost?',
              v: (
                <>
                  Talk to us for current pricing. The platform bills monthly; Meta for Realtors
                  runs on tokens as you run ads. See <TextLink href="/business/pricing">Plans</TextLink>.
                </>
              ),
            },
            {
              k: 'Can we run our own server?',
              v: <>Yes. Same software, your infrastructure, your records. Say so in the form.</>,
            },
            {
              k: 'Is our data separate?',
              v: (
                <>
                  Your records live on their own ground — no other company can reach them. See{' '}
                  <TextLink href="/business/security">Security</TextLink>.
                </>
              ),
            },
            {
              k: 'Do you take a cut of ad spend?',
              v: <>No. You pay Meta and Google directly.</>,
            },
          ]}
        />
      </Section>

      <NextStep href={next.href} label="Or just start" note={next.blurb} />
    </>
  )
}
