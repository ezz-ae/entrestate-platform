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
  title: 'How leads flow',
  description:
    'The four ways a lead can arrive, the one duplicate check they all pass, and how every lead ends up with an owner and a clock.',
  alternates: { canonical: '/business/docs/lead-flow' },
}

export default function LeadFlowGuide() {
  return (
    <DocsShell href="/business/docs/lead-flow">
      <ArticleMeta category="CRM & brokers" read="5 min read" />

      <p className="mt-6 text-[0.9375rem] leading-[1.75] text-ink-muted">
        Every enquiry your company receives — whichever door it came through — lands in the same
        inbox, passes the same duplicate check, and ends up owned by one person. This guide walks
        the four doors first, then what happens to every lead after it arrives.
      </p>

      <OnPage
        items={[
          { id: 'your-pages', label: 'From your pages' },
          { id: 'meta-forms', label: 'From Meta instant forms' },
          { id: 'import', label: 'From a file' },
          { id: 'typed-in', label: 'Typed in by an agent' },
          { id: 'duplicate-check', label: 'One duplicate check for all four' },
          { id: 'owner', label: 'An owner and a clock' },
          { id: 'faq', label: 'Common questions' },
        ]}
      />

      <figure className="mt-10">
        <div className="mx-auto max-w-[34rem]">
          <LeadCardCrop />
        </div>
        <figcaption className="mx-auto mt-4 max-w-[38ch] text-center text-[0.8125rem] leading-relaxed text-ink-faint">
          A new enquiry, tagged by language and handed an owner the moment it lands — on the clock until a person answers.
        </figcaption>
      </figure>

      <div className="mt-10">
        <Step n={1} title="From your pages" id="your-pages">
          <p>
            When someone fills the form on one of your landing pages or your public site, the lead
            appears in the CRM the moment they press send. It arrives carrying what the page
            already knew: the campaign that brought the person, the language they browsed in,
            their country, and the listing they were reading. If they tapped Call or WhatsApp
            instead of finishing the form, that shows on the record too.
          </p>
          <p>
            Everything that happens next — the alert to your team, the note back to the ad
            platform — follows after the lead is safely recorded. A slow outside service can
            never delay or lose an enquiry.
          </p>
        </Step>

        <Step n={2} title="From Meta instant forms" id="meta-forms">
          <p>
            Connect your Meta ad account once, and leads from Facebook and Instagram lead forms
            flow in on their own — usually within moments of the form being sent, with the system
            also checking the account through the day so nothing slips past. A pull button in the
            CRM fetches the latest on demand.
          </p>
          <p>
            Each of these leads arrives knowing the exact campaign and the exact ad the person saw
            before they gave their number. A form entry with no phone and no email is counted and
            shown as skipped — never silently dropped — because an enquiry you cannot contact is a
            fact worth knowing about.
          </p>
        </Step>

        <Step n={3} title="From a file" id="import">
          <p>
            Moving in with an existing book? Import it from a spreadsheet, up to 2,000 leads at a
            time. The import reports honestly: how many came in, how many were already in the
            system, and how many had no phone and no email. Those last are counted as unreachable
            and reported back rather than imported — a list that is half uncontactable is
            something you want to learn on day one, not after a week of unanswered calls.
          </p>
          <p>Running the same file twice never creates a duplicate.</p>
        </Step>

        <Step n={4} title="Typed in by an agent" id="typed-in">
          <p>
            A walk-in, a call to reception, a referral over coffee — an agent adds the lead by
            hand and it joins the same pipeline as everything else. Same details, same duplicate
            check, same follow-up clock. There is no side list.
          </p>
        </Step>

        <Step n={5} title="One duplicate check for all four" id="duplicate-check">
          <p>
            The system reads a phone number the way a person would: +971 50 123 4567, 050 123 4567
            and 501234567 are the same number, however they were typed. When someone who already
            has an open lead enquires again — from a different ad, a different page, even a
            different door — no second lead is created. The new enquiry is written onto their
            existing record, so one timeline tells the whole story.
          </p>
          <p>
            Suspected duplicates that need a human eye are shown side by side, and merging is
            always a person&rsquo;s decision — nothing is merged automatically, and nothing is
            deleted. A merged record keeps its history.
          </p>
        </Step>

        <Step n={6} title="An owner and a clock" id="owner">
          <p>
            Every lead needs one person responsible. A manager can hand leads out from the
            assignment board, or distribution can run automatically the moment a lead arrives —
            see{' '}
            <Link
              href="/business/docs/team-roles"
              className="text-ink underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
            >
              Team and roles
            </Link>{' '}
            for how that is set up. Leads nobody owns raise a counted notice on the CRM overview,
            because an unowned lead is invisible to every agent.
          </p>
          <p>
            Once owned, the clock starts: the CRM measures how long each lead waited for its first
            reply, and the call list keeps the lead visible until that reply happens.
          </p>
        </Step>
      </div>

      <DocNote>
        The first ad a lead came through stays on their record permanently. A later click on a
        different ad never overwrites it — the campaign that genuinely produced the enquiry keeps
        the credit.
      </DocNote>

      <h2 id="faq" className="scroll-mt-24 text-[1.0625rem] font-semibold leading-snug text-ink">
        Common questions
      </h2>
      <div className="mt-4">
        <FAQItem q="Can a lead be deleted?">
          Only the account owner can delete a lead. Everyone else archives, which puts the record
          out of the way but keeps it and its history. Every delete attempt — allowed or refused —
          goes on the permanent record.
        </FAQItem>
        <FAQItem q="Does a lead ever wait on a slow outside service?">
          No. The lead is recorded first; alerts, mirrors and notes to the ad platform all follow
          after, and none of them can block or lose an enquiry.
        </FAQItem>
        <FAQItem q="Do imported leads behave differently from fresh ones?">
          No. Once a lead is in, it is a lead — same stages, same call list, same rules. The only
          difference is that its record names the import as its source.
        </FAQItem>
      </div>

      <RelatedRow hrefs={['/business/docs/crm-day', '/business/docs/team-roles']} />
    </DocsShell>
  )
}
