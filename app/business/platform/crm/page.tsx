import type { Metadata } from 'next'
import { Section, Display, Lede } from '@/components/business/ui'
import { Browser, Phone, Chat, MiniCRM, Chapter, NextStep } from '@/components/business/visuals'
import { Holder, HolderRow, Keyword, KeywordSub, LearnMore } from '@/components/business/holders'
import { nextInTour } from '@/lib/business/nav'
import { LeadCardCrop } from '@/components/business/crops'

export const metadata: Metadata = {
  title: 'CRM',
  description:
    'Every lead lands owned and on a clock. Who answered it, how fast, and what it became — written down.',
  alternates: { canonical: '/business/platform/crm' },
}

export default function CrmPage() {
  const next = nextInTour('/business/platform/crm')!
  return (
    <>
      {/* The default Chat thread IS the 2:47am scene, so the sub narrates it
          instead of restating features beside it. */}
      <Section className="pb-16 pt-16 lg:pb-20 lg:pt-24">
        <Chapter n={5} total={7} label="CRM" />
        <div className="mt-10 grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="max-w-[44rem]">
              <Display>The first hour wins the deal.</Display>
            </div>
            <div className="mt-6 max-w-[46ch]">
              <Lede>
                A lead lands at 2:47am, in Arabic. By 2:48 it has an owner, a language tag and a
                follow-up on the clock — and the person answers.
              </Lede>
            </div>
          </div>
          <LeadCardCrop />
        </div>
      </Section>

      {/* Everything deeper — sources, duplicate handling, follow-up order —
          lives in the two guides. The holders only carry the pitch. */}
      <Section className="pb-24 lg:pb-32">
        <div className="space-y-5">
          <Holder
            tone="gold"
            visual={
              <Browser title="app.yourbrokerage.ae/crm">
                <MiniCRM />
              </Browser>
            }
          >
            <Keyword>Owned on arrival.</Keyword>
            <KeywordSub>
              Your pages, Meta forms, imports, typed in — one inbox, one owner from minute one.
            </KeywordSub>
            <LearnMore href="/business/docs/lead-flow" label="How leads flow" />
          </Holder>

          <HolderRow>
            <Holder tone="green">
              <Keyword as="h3">The first hour.</Keyword>
              <KeywordSub>
                First response is timed from minute one. A quiet lead resurfaces on top.
              </KeywordSub>
              <LearnMore href="/business/docs/crm-day" label="How the day runs" />
            </Holder>
            <Holder tone="blue">
              <Keyword as="h3">Type a number.</Keyword>
              <KeywordSub>Any phone number finds the lead it belongs to.</KeywordSub>
            </Holder>
          </HolderRow>
        </div>
      </Section>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 6 of 7" />
    </>
  )
}
