import type { Metadata } from 'next'
import { Section, Band, Eyebrow, Display, H2, Lede, SectionHeading } from '@/components/business/ui'
import {
  Browser, MiniReport, Ledger, FeatureTile, TileGrid, PunchGrid,
  StatBand, StepRail, Chapter, NextStep, GlowBand,
} from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Intelligence',
  description:
    'The assistant reads your pipeline and drafts the work. It cannot spend, invent a number, or raise its own permissions.',
  alternates: { canonical: '/business/platform/intelligence' },
}

export default function IntelligencePage() {
  const next = nextInTour('/business/platform/intelligence')!
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      {/* This page's claim is discipline, so the first visual is the audit
          trail — not a chat window. */}
      <Section className="pb-20 pt-16 lg:pb-28 lg:pt-24">
        <Chapter n={6} total={7} label="Intelligence" />
        <div className="mt-10 grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="max-w-[44rem]">
              <Display>An assistant that knows its place.</Display>
            </div>
            <div className="mt-6 max-w-[46ch]">
              <Lede>
                It reads your pipeline. It drafts your replies. It never spends without your yes.
              </Lede>
            </div>
          </div>
          <Ledger
            className="w-full"
            rows={[
              { time: '09:41', event: 'paused Creek Harbour carousel — you said yes in chat' },
              {
                time: '09:42',
                event: 'budget +AED 90 → Marina Vista video — inside the ±15% clamp',
                amount: '+AED 90',
              },
              { time: '11:05', event: 'drafted WhatsApp reply for Fatima A. — yours to send' },
              { time: '13:20', event: 'resume Business Bay ads — held, waiting for your yes' },
            ]}
          />
        </div>
      </Section>

      {/* ── Refusals first ──────────────────────────────────────────────── */}
      <Band className="bg-[#090B0E]">
        <SectionHeading eyebrow="Refused" title="What it will not do" />
        <div className="mt-10">
          <PunchGrid
            items={[
              {
                title: 'It never spends without your yes.',
                body: 'Pause, launch, budget, resume — every money action asks first at the default setting.',
              },
              {
                title: 'No number it cannot trace.',
                body: 'A figure comes from your data or the report is withheld.',
              },
              {
                title: 'No invented campaigns.',
                body: 'Name a campaign you do not have and the answer is discarded.',
              },
              {
                title: 'No claimed launches.',
                body: 'Say it launched when nothing ran, and the sentence is replaced with a correction.',
              },
              {
                title: 'It cannot raise its own permissions.',
                body: 'The autonomy dial is a server setting. Only management moves it.',
              },
              {
                title: 'There is an off switch.',
                body: 'One setting silences everything it writes. Every screen keeps working.',
              },
            ]}
          />
        </div>
      </Band>

      {/* ── What you get ────────────────────────────────────────────────── */}
      <Section className="py-20 lg:py-28">
        <TileGrid cols={3}>
          <FeatureTile
            icon="assistant"
            title="Docked on every screen"
            body="One chat follows you from CRM to campaigns — in English, العربية, Русский."
          />
          <FeatureTile
            icon="flow"
            title="27 real actions"
            body="Pause a campaign, move a budget, draft the ad — the same buttons you press."
          />
          <FeatureTile
            icon="gate"
            title="Three autonomy levels"
            body="Ask first, act with brakes, or run nightly. Management sets the dial."
          />
        </TileGrid>
      </Section>

      {/* ── Show: evidence ──────────────────────────────────────────────── */}
      <GlowBand>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <Eyebrow>Evidence</Eyebrow>
            <H2 className="mt-4">Every number, traced or withheld.</H2>
            <div className="mt-5 max-w-[42ch]">
              <Lede>
                A report&rsquo;s figures must come from your own data, pulled that turn. One stray
                figure withholds the whole report.
              </Lede>
            </div>
          </div>
          <Browser title="app.yourbrokerage.ae/reports">
            <MiniReport />
          </Browser>
        </div>
      </GlowBand>

      {/* ── A money action, in order ────────────────────────────────────── */}
      <Section className="py-20 lg:py-28">
        <Eyebrow className="mb-8">A money action</Eyebrow>
        <StepRail
          steps={[
            {
              title: 'It proposes',
              body: 'A plan with the audience, the page and the budget — priced in AED.',
            },
            {
              title: 'You say yes',
              body: 'In your own words. No confirmation, no action — that is the default.',
            },
            {
              title: 'It acts, then writes it down',
              body: 'The move lands in the log with the reason. Failures get no receipt.',
            },
          ]}
        />
      </Section>

      {/* ── Facts ───────────────────────────────────────────────────────── */}
      <div className="pb-20 lg:pb-28">
        <StatBand
          items={[
            {
              value: '27',
              label: 'Real actions',
              note: 'Seven can touch money. Those are the ones that ask first.',
            },
            {
              value: '±15%',
              label: 'Largest budget move',
              note: 'Clamped on the server, floor AED 50 — whatever was asked for.',
            },
            {
              value: '205',
              label: 'Screens it can link to',
              note: 'Rebuilt from the app on every release. A dead link is dropped.',
            },
            {
              value: '1',
              label: 'Untraceable figure',
              note: 'Enough to withhold the whole report. No partial credit.',
            },
          ]}
        />
      </div>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 7 of 7" />
    </>
  )
}
