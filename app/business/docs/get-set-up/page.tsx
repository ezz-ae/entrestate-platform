import type { Metadata } from 'next'
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
  title: 'From signup to first lead',
  description:
    'From your address to your first ad, step by step — open the workspace, pick a listing, Rocket Ad, press go, the lead lands owned. No calendar.',
  alternates: { canonical: '/business/docs/get-set-up' },
}

export default function GetSetUpGuide() {
  return (
    <DocsShell href="/business/docs/get-set-up">
      <ArticleMeta category="Getting set up" read="6 min read" />
      <p className="mt-6 text-[0.9375rem] leading-[1.75] text-ink-muted">
        Thirty days from an empty workspace to a campaign producing leads — in the order a
        working company actually does it. Nothing on this page needs a developer, and nothing
        spends money until you deliberately switch it on.
      </p>
      <OnPage
        items={[
          { id: 'day-one', label: 'Day one — open your workspace' },
          { id: 'stock', label: 'Stock and team' },
          { id: 'pages', label: 'Pages live' },
          { id: 'launch', label: 'Connect and launch' },
          { id: 'report', label: 'Read the report' },
          { id: 'first-lead', label: 'The first lead' },
        ]}
      />
      <div className="mt-6">
        <Step n={1} id="day-one" title="Open your workspace">
          <p>
            Sign up with your company name, choose your address, and the workspace opens under
            your own name with its own records, the market catalogue already in it. Pick your
            language from the account menu: English, Arabic or Russian. Arabic flips the whole
            interface right-to-left, and your team members each choose their own.
          </p>
        </Step>
        <Step n={2} id="stock" title="Load the stock and the team">
          <p>
            Add your listings whichever way is fastest: upload developer brochures, paste links,
            paste text, or type them in — every route ends in a review screen before anything is
            saved. Then invite the team and give each person a role. Seven roles cover a
            brokerage from agent to owner, and each person sees exactly what their job covers.
          </p>
          <p>
            Bringing an existing book? Import it from a spreadsheet, up to 2,000 leads at a time.
            The import reports honestly — how many came in, how many were already known, how many
            had no phone and no email — and running the same file twice never creates a
            duplicate.
          </p>
        </Step>
        <Step n={3} id="pages" title="Put pages live">
          <p>
            Create a landing page for each listing you plan to push — one click builds the page
            from the listing&rsquo;s own record, and one button covers every listing still
            without one. Publish the ones that are ready; if you want a manager&rsquo;s hand on
            what goes public, publishing can require approval from day one. Now your stock has
            somewhere for a paid click to land.
          </p>
        </Step>
        <Step n={4} id="launch" title="Connect Meta and launch — five minutes">
          <p>
            Connect your Meta ad account by pasting its credential — it is tested with the
            provider before it saves, so a green Connected means it truly works. Then open
            Rocket Ad: give it the brochure or a photo and a daily budget, and it writes the ad
            and sets the rest.
          </p>
          <p>
            The campaign arrives paused: you look at the ad, and you switch it on yourself.
            Write a spend rule when you want the machine to move budget for you — a daily
            ceiling and the conditions; with no rule, it moves nothing on its own.
          </p>
        </Step>
        <Step n={5} id="report" title="Read the report">
          <p>
            Open the report whenever you want it: spend, leads, deals, what a lead cost, what a deal cost.
            Decide with numbers — which listing earned more budget, which audience produced, what
            to stop. Leads that wait too long surface on their own: anything two days without
            contact lands in a digest to its owner, and managers see what nobody is working.
          </p>
        </Step>
        <Step n={6} id="first-lead" title="The first lead">
          <p>
            Then it happens without you: an enquiry lands, is recorded first, tagged by
            language, and handed to one agent with a clock running until they answer. That path — the four doors in, the duplicate check, the owner — is its
            own guide, and it is the part of the system your team will live in daily.
          </p>
          <figure className="mt-5">
            <div className="mx-auto max-w-[34rem]">
              <LeadCardCrop />
            </div>
            <figcaption className="mx-auto mt-4 max-w-[38ch] text-center text-[0.8125rem] leading-relaxed text-ink-faint">
              The first one arrives — tagged by language, owned by an agent, on the clock.
            </figcaption>
          </figure>
        </Step>
      </div>
      <DocNote title="Nothing spends by itself">
        You can do everything in this guide end to end — stock, team, pages, even building the
        campaign — before a dirham moves. Money only moves after you connect an ad account, write
        a spend rule, and switch a campaign on yourself.
      </DocNote>
      <h2 className="mt-12 text-[1.0625rem] font-semibold text-ink">Common questions</h2>
      <div className="mt-4">
        <FAQItem q="Do I need a card for the trial?">
          No. Fourteen days, the full platform, no card. Load real stock and real leads — if you
          leave, they were yours all along.
        </FAQItem>
        <FAQItem q="Is my company's data separate from other companies'?">
          Yes. Your workspace keeps its own records under your own address, closed by default —
          no other company can reach them, and your team&rsquo;s roles decide who sees what
          inside.
        </FAQItem>
        <FAQItem q="My team lives in WhatsApp. Does that change?">
          No. Leads open in WhatsApp with one tap, pages carry a WhatsApp button, and the
          conversation stays where your clients already are — the system records who owns the
          lead and what happened, instead of asking anyone to move.
        </FAQItem>
      </div>
      <RelatedRow
        hrefs={[
          '/business/docs/lead-flow',
          '/business/docs/launch-a-campaign',
          '/business/docs/spend-rules',
        ]}
      />
    </DocsShell>
  )
}
