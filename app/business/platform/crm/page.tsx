import type { Metadata } from 'next'
import { Section, Band, Eyebrow, Display, H2, Lede, SectionHeading } from '@/components/business/ui'
import {
  Browser, Phone, Chat, MiniCRM, FeatureTile, TileGrid, PunchGrid,
  StatBand, StepRail, Chapter, NextStep,
} from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

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
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      {/* The default Chat thread IS the 2:47am scene, so the sub narrates it
          instead of restating features beside it. */}
      <Section className="pb-20 pt-16 lg:pb-28 lg:pt-24">
        <Chapter n={5} total={7} label="CRM" />
        <div className="mt-10 grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="max-w-[44rem]">
              <Display>The first hour wins the deal.</Display>
            </div>
            <div className="mt-6 max-w-[46ch]">
              <Lede>
                A lead lands at 2:47am, in Arabic. By 2:48 it has an answer, a language, and an
                owner.
              </Lede>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Phone className="w-[250px] sm:w-[280px]">
              <Chat />
            </Phone>
          </div>
        </div>
      </Section>

      {/* ── What you get ────────────────────────────────────────────────── */}
      <Section className="pb-20 lg:pb-28">
        <TileGrid cols={3}>
          <FeatureTile
            icon="lead"
            title="Four doors, one pipeline"
            body="Website, Meta forms, a 2,000-row import, typed in. Same table, same duplicate check."
          />
          <FeatureTile
            icon="team"
            title="Every lead gets an owner"
            body="Assigned on arrival by rules you set. Unowned leads raise a counted banner."
          />
          <FeatureTile
            icon="clock"
            title="A call list with teeth"
            body="Breached promises first. Overdue at 72 hours. Nothing deleted, nothing hidden."
          />
        </TileGrid>
      </Section>

      {/* ── Show: the desk ──────────────────────────────────────────────── */}
      <Band>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <Eyebrow>The pipeline</Eyebrow>
            <H2 className="mt-4">Who owns it. What it&rsquo;s worth.</H2>
            <div className="mt-5 max-w-[42ch]">
              <Lede>
                A broker sees their own leads. A manager sees the desk — 9 open, AED 17.9M, and who
                is overdue.
              </Lede>
            </div>
          </div>
          <Browser title="app.yourbrokerage.ae/crm">
            <MiniCRM />
          </Browser>
        </div>
      </Band>

      {/* ── The first hour, in order ────────────────────────────────────── */}
      <Section className="py-20 lg:py-28">
        <Eyebrow className="mb-8">The first hour</Eyebrow>
        <StepRail
          steps={[
            {
              title: 'The lead lands owned',
              body: 'Name, phone, campaign and language captured. An agent owns it from minute one.',
            },
            {
              title: 'The clock starts',
              body: 'First response is measured. 72 quiet hours puts it back on the call list.',
            },
            {
              title: 'One tap after the call',
              body: 'Rate the lead 0–10. Six and up tells Meta to buy more like them.',
            },
          ]}
        />
      </Section>

      {/* ── The rules ───────────────────────────────────────────────────── */}
      <Band className="bg-[#090B0E]">
        <SectionHeading eyebrow="How it behaves" title="What it refuses to do" />
        <div className="mt-10">
          <PunchGrid
            items={[
              {
                title: 'Only the owner deletes.',
                body: 'Everyone else archives. Every attempt — allowed or refused — is logged.',
              },
              {
                title: 'A worked lead is protected.',
                body: 'One logged call stops a team leader pulling it back.',
              },
              {
                title: 'A breached promise outranks every rating.',
                body: 'A lead past its reply target is never set aside.',
              },
            ]}
          />
        </div>
      </Band>

      {/* ── Facts ───────────────────────────────────────────────────────── */}
      <div className="py-20 lg:py-28">
        <StatBand
          items={[
            {
              value: '4×',
              label: 'Meta form sweeps a day',
              note: 'Leads pulled in at 01:15, 07:15, 13:15 and 19:15 — plus a button.',
            },
            {
              value: '72h',
              label: 'Overdue threshold',
              note: 'One definition of overdue, shared by the queue and every team metric.',
            },
            {
              value: '24h',
              label: 'Reassignment grace',
              note: 'A fresh lead stays with its agent for a day.',
            },
            {
              value: '12',
              label: 'Leads per agent',
              note: 'The capacity the assignment board measures load against.',
            },
          ]}
        />
      </div>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 6 of 7" />
    </>
  )
}
