import type { Metadata } from 'next'
import { Section, Eyebrow, Display, H2, Lede, ButtonLink, Mono } from '@/components/business/ui'
import { GlowBand, NextStep, PunchGrid, StatBand, Chapter } from '@/components/business/visuals'
import { Holder, Keyword, KeywordSub, HolderRow } from '@/components/business/holders'
import { AudienceCrop, ReachCrop } from '@/components/business/crops'
import { CropReel } from '@/components/business/crop-reel'
import { nextInTour } from '@/lib/business/nav'
import { FULL_SYSTEM, FULL_SYSTEM_CTA } from '@/lib/business/full-system'
import {
  TARGETECT,
  TARGETECT_CAPABILITIES,
  TARGETECT_STAGES,
  TARGETECT_PERSONA_COUNT,
  TARGETECT_PERSONA_STACK,
  TARGETECT_VERTICAL_NOTE,
  type TargetectStage,
} from '@/lib/business/targetect'
import { LEARNING_EVENTS } from '@/lib/freehold/learning-phase'
import { LADDER } from '@/lib/freehold/lookalike-ladder'

/**
 * Targetect — the product page for audience planning and analytics.
 *
 * It lives at /business/targetect, it is what targetect.com answers with
 * (BRAND_DOMAINS in lib/tenancy/vendor-host.ts) and it is also the door at
 * targetect.entrestate.com. One canonical path under three addresses, so the
 * page cannot compete with itself in search.
 *
 * EVERY CLAIM ON THIS PAGE IS READ, NOT TYPED. The capabilities come from
 * lib/business/targetect.ts, where each one names the engine that implements
 * it and the guard that holds it, and the figures come from the engines
 * themselves — LEARNING_EVENTS from the learning-phase module, the rungs from
 * the lookalike ladder. A page that retypes its product's numbers drifts from
 * it the week after it ships and nothing fails; this one fails the build
 * instead (scripts/targetect-test.ts).
 */

export const metadata: Metadata = {
  title: 'Targetect',
  description:
    'Audience planning and analytics. Describe the buyer in a sentence, get an audience that can be bought with the budget you have, and find out afterwards which audience produced the people who signed.',
  alternates: { canonical: TARGETECT.href },
}

const stageOrder: TargetectStage[] = ['plan', 'buy', 'learn']

export default function TargetectPage() {
  const next = nextInTour(TARGETECT.href)!

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <Section className="pb-16 pt-16 lg:pb-24 lg:pt-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <Eyebrow>Targetect · audience planning and analytics</Eyebrow>
            <div className="mt-5 max-w-[44rem]">
              <Display>Describe the buyer. Get the audience.</Display>
            </div>
            <div className="mt-7 max-w-[46ch]">
              <Lede>
                Say who you are selling to the way you would say it to a colleague. Targetect turns
                that into a real audience, checks it can be bought with the budget you have, and
                afterwards tells you which audience produced the people who signed.
              </Lede>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href={FULL_SYSTEM.startHref}>{FULL_SYSTEM_CTA}</ButtonLink>
              <ButtonLink href="/business/pricing" variant="ghost">See pricing</ButtonLink>
            </div>
            <div className="mt-7">
              <Mono>{TARGETECT.domain} · {TARGETECT.door}.entrestate.com</Mono>
            </div>
          </div>
          <CropReel
            frames={[
              { key: 'reach', caption: 'What the money is pointed at right now, read back from Meta.', node: <ReachCrop /> },
              { key: 'audience', caption: 'Rated leads become the next audience, and the one after that.', node: <AudienceCrop /> },
            ]}
          />
        </div>
      </Section>

      {/* ── The scene ───────────────────────────────────────────────────── */}
      <GlowBand>
        <div className="mx-auto max-w-[62ch] text-center">
          <H2>Meta offers forty thousand interests. None of them is your buyer.</H2>
          <div className="mt-6">
            <Lede>
              So Targetect does not ask you to pick any. You describe a person; the translation into
              locales, behaviours, narrowing groups and exclusions happens out of sight, where it
              belongs.
            </Lede>
          </div>
        </div>
      </GlowBand>

      {/* ── Plan · Buy · Learn, read from the product's own definition ──── */}
      {stageOrder.map((stage, i) => {
        const items = TARGETECT_CAPABILITIES.filter((c) => c.stage === stage)
        return (
          <Section key={stage} className="py-14 lg:py-20">
            <Chapter n={i + 1} total={stageOrder.length} label={TARGETECT_STAGES[stage].title} />
            <div className="mt-6 max-w-[46rem]">
              <H2>{TARGETECT_STAGES[stage].title}</H2>
              <div className="mt-5">
                <Lede>{TARGETECT_STAGES[stage].body}</Lede>
              </div>
            </div>
            <div className="mt-10">
              <PunchGrid
                cols={items.length === 4 ? 4 : 3}
                items={items.map((c) => ({ title: c.title, body: c.body }))}
              />
            </div>
          </Section>
        )
      })}

      {/* ── What it will not do ─────────────────────────────────────────── */}
      <Section className="pb-16 lg:pb-24">
        <HolderRow cols={2}>
          <Holder tone="blue" label="The rule with a history">
            <Keyword>Language, never nationality.</Keyword>
            <KeywordSub>
              An ad in Arabic cannot sell to someone who does not read Arabic. That is a real field.
            </KeywordSub>
            <p className="mt-5 max-w-[46ch] text-[0.9375rem] leading-[1.6] text-ink-muted">
              Nationality is not a field on any ad platform. Every tool that offers it is stacking
              proxies — expat interests, hometown pages, language guesses — and getting the edges
              wrong where nobody can see. Targetect narrows by the language the ad is written in and
              by what a person actually did, and it excludes on behaviour rather than on origin.
            </p>
          </Holder>
          <Holder tone="green" label="The limit, said out loud">
            <Keyword>It plans property buyers.</Keyword>
            <KeywordSub>Every plan carries a property signal underneath it.</KeywordSub>
            <p className="mt-5 max-w-[46ch] text-[0.9375rem] leading-[1.6] text-ink-muted">
              {TARGETECT_VERTICAL_NOTE} A product sold on its own domain is exactly where a limit
              like that stops being mentioned, so it is written into the code that builds every
              audience and repeated here on purpose.
            </p>
          </Holder>
        </HolderRow>
      </Section>

      {/* ── Facts, read from the engines ────────────────────────────────── */}
      <StatBand
        items={[
          {
            value: String(TARGETECT_PERSONA_COUNT),
            label: 'Personas',
            note: 'Doctors, pilots, business owners, Golden Visa seekers — each a recipe, none of them a checkbox Meta sells.',
          },
          {
            value: String(TARGETECT_PERSONA_STACK),
            label: 'Layers at most',
            note: 'Three stacked personas is a sharp knife. Five is an empty room.',
          },
          {
            value: String(LEARNING_EVENTS),
            label: 'Results a week, per ad set',
            note: 'Below that the platform is still guessing — and so is any verdict read from its numbers.',
          },
          {
            value: String(LADDER.length),
            label: 'Rungs on the lookalike ladder',
            note: 'It climbs one at a time, and only when frequency and reach say the rung is spent.',
          },
        ]}
      />

      <NextStep href={next.href} label={next.label} note={next.blurb} />
    </>
  )
}
