import type { Metadata } from 'next'
import Link from 'next/link'
import {
  DocsShell,
  ArticleMeta,
  OnPage,
  Step,
  DocNote,
  FAQItem,
  RelatedRow,
} from '@/components/business/docs'
import { LeadCardCrop } from '@/components/business/crops'

export const metadata: Metadata = {
  title: 'Working the day',
  description:
    'The stages, the call list, rating a lead after the call, and finding anyone from a phone number.',
  alternates: { canonical: '/business/docs/crm-day' },
}

export default function CrmDayGuide() {
  return (
    <DocsShell href="/business/docs/crm-day">
      <ArticleMeta category="CRM & brokers" read="5 min read" />

      <p className="mt-6 text-[0.9375rem] leading-[1.75] text-ink-muted">
        The CRM is built to answer three questions all day long: who needs a call now, what is
        each lead worth, and what happened last. This guide walks one working day through it.
      </p>

      <OnPage
        items={[
          { id: 'the-desk', label: 'Read the desk first' },
          { id: 'stages', label: 'Know the stages' },
          { id: 'call-list', label: 'Work the call list' },
          { id: 'actions', label: 'Call, WhatsApp, or snooze' },
          { id: 'rate', label: 'Rate what you heard' },
          { id: 'phone-search', label: 'Find anyone from a phone number' },
          { id: 'faq', label: 'Common questions' },
        ]}
      />

      <figure className="mt-10">
        <LeadCardCrop />
        <figcaption className="mt-4 text-[0.8125rem] leading-relaxed text-ink-faint">
          A lead as the day starts with it: who it is, which ad produced it, the language it
          asked in, the person who owns it, and the hour the clock allows.
        </figcaption>
      </figure>

      <div className="mt-10">
        <Step n={1} title="Read the desk first" id="the-desk">
          <p>
            The CRM opens on a set of tiles that summarise the morning: new leads waiting for a
            first reply, follow-ups due, hot leads, qualified leads, the live pipeline value in
            AED, and what closed this month. Each tile is a door — tap it and you are looking at
            exactly those leads, not a filtered guess.
          </p>
        </Step>

        <Step n={2} title="Know the stages" id="stages">
          <p>
            Every lead sits in exactly one stage: New, Contacted, Qualified, Viewing, Negotiation,
            Closed — or Lost. The list is fixed on purpose: when everyone on the team means the
            same thing by Qualified, the month-end numbers mean something too. Move a lead by
            dragging its card on the board, or from the lead&rsquo;s own page.
          </p>
        </Step>

        <Step n={3} title="Work the call list" id="call-list">
          <p>
            The follow-up queue is the day&rsquo;s spine, and it sorts itself. Leads past a
            promised reply time come first. Then leads your team has rated well, then unrated
            leads — unknown is not bad — then everything else by how long it has waited. A lead
            counts as overdue after 72 quiet hours, and that one definition is used everywhere:
            the queue, the team numbers, the manager&rsquo;s view.
          </p>
          <p>
            Leads that cannot usefully be called right now — blocked, archived, rated poorly, or
            carrying a number that will not dial — move to a collapsed Set aside list with the
            reason stated and a Call anyway button. Nothing is hidden, and nothing is deleted.
          </p>
        </Step>

        <Step n={4} title="Call, WhatsApp, or snooze" id="actions">
          <p>
            Every lead carries a call button and a WhatsApp button. WhatsApp opens your own
            WhatsApp with the number and a first message already filled in — no setup, nothing to
            connect. If now is the wrong moment, snooze the lead for 4 hours, a day, 3 days or a
            week; it leaves the queue and comes back on its own, labelled with when it wakes.
            Marking a call done records the contact, which is what resets the 72-hour clock.
          </p>
        </Step>

        <Step n={5} title="Rate what you heard" id="rate">
          <p>
            After the conversation, tap a score from 0 to 10 — the one judgement only the person
            who spoke to the lead can make. 6 and up marks a lead worth chasing and quietly
            teaches your advertising to find more people like them; 0 to 2 teaches it to stop; 10
            says this became a deal. One tap, once — and the call list re-orders itself around
            your answer.
          </p>
        </Step>

        <Step n={6} title="Find anyone from a phone number" id="phone-search">
          <p>
            A number calls back and the agent who owns it is at lunch. Type the phone number into
            search — any spacing, with or without the country code — and the lead it belongs to
            opens, with the full timeline of every call, message, note and stage change. Nobody
            has to ask the room whose lead this is.
          </p>
        </Step>
      </div>

      <DocNote title="Rank by value">
        On any list, <em>Rank by value · worst first</em> sorts the most expensive neglect to the
        top: the highest-value leads that have waited longest. It is the fastest way to see where
        money is sitting unworked.
      </DocNote>

      <h2 id="faq" className="scroll-mt-24 text-[1.0625rem] font-semibold leading-snug text-ink">
        Common questions
      </h2>
      <div className="mt-4">
        <FAQItem q="What does overdue actually mean?">
          72 hours since the last recorded contact. Logging a call, message or meeting resets the
          clock; snoozing pauses it until the lead wakes. The same definition is used on every
          screen, so two people never argue about whether a lead is overdue.
        </FAQItem>
        <FAQItem q="Can I lose a lead by snoozing it?">
          No. A snoozed lead is listed separately with a label saying when it wakes, and it
          returns to the queue by itself. Only archiving or blocking moves a lead out of the
          working lists — and even then it goes to Set aside with the reason stated, never away.
        </FAQItem>
        <FAQItem q="Who sees my leads?">
          You, your team leader, and management. Other agents never see your book — see{' '}
          <Link
            href="/business/docs/team-roles"
            className="text-ink underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
          >
            Team and roles
          </Link>{' '}
          for exactly who sees what.
        </FAQItem>
      </div>

      <RelatedRow hrefs={['/business/docs/lead-flow', '/business/docs/team-roles']} />
    </DocsShell>
  )
}
