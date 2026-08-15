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
import { Browser, MiniPage } from '@/components/business/visuals'

export const metadata: Metadata = {
  title: 'Pages and the launch gate',
  description:
    'How a listing becomes a page in one click, why drafts stay invisible, and the gate that stops a campaign pointing at a dead page.',
  alternates: { canonical: '/business/docs/landing-pages' },
}

export default function LandingPagesGuide() {
  return (
    <DocsShell href="/business/docs/landing-pages">
      <ArticleMeta category="Inventory & pages" read="5 min read" />
      <p className="mt-6 text-[0.9375rem] leading-[1.75] text-[#94A3B8]">
        Every listing can carry its own page — built from the listing&rsquo;s record, published
        under your address, and checked by a gate before any campaign is allowed to point at it.
        This guide walks from the first click to the moment an ad is allowed to send people there.
      </p>
      <OnPage
        items={[
          { id: 'one-click', label: 'A page in one click' },
          { id: 'layouts', label: 'Three layouts, one honesty rule' },
          { id: 'audience-copy', label: 'Written for a chosen buyer' },
          { id: 'publishing', label: 'Drafts, approval and the window' },
          { id: 'the-gate', label: 'The launch gate' },
          { id: 'languages', label: 'Languages and the permit strip' },
          { id: 'faq', label: 'Common questions' },
        ]}
      />
      <div className="mt-6">
        <Step n={1} id="one-click" title="A page in one click">
          <p>
            Pick a listing, pick a layout, and a complete page is assembled from the
            listing&rsquo;s own record — name, prices, payment plan, photos, amenities, questions
            and answers, the lead form, the WhatsApp button. There is no page builder to fill in.
            One button also builds pages for every listing that still has none.
          </p>
          <p>
            A page cannot exist without a listing behind it — which is why the facts on it are
            always the facts you sell from.
          </p>
          <div className="mt-4 max-w-[28rem]">
            <Browser title="app.yourcompany.com/pages">
              <MiniPage />
            </Browser>
          </div>
        </Step>
        <Step n={2} id="layouts" title="Three layouts, one honesty rule">
          <p>
            <span className="font-medium text-white">Classic</span> is the full brochure, for warm
            buyers who want depth. <span className="font-medium text-white">Campaign</span> puts
            the lead form directly under the hero — it is the one to point paid ads at.{' '}
            <span className="font-medium text-white">Signature</span> leads with visuals, for
            premium launches.
          </p>
          <p>
            One rule holds across all three: a section with nothing real behind it disappears. No
            empty boxes, no invented payment plan, no placeholder photos, no testimonials unless
            real ones exist. A thin record makes a shorter page, not a padded one.
          </p>
        </Step>
        <Step n={3} id="audience-copy" title="Written for a chosen buyer">
          <p>
            Choose who the page is for — investor, luxury, end-user — and the studio rewrites the
            whole page for that buyer: a different order, a different headline, different
            questions answered. Every figure it prints is copied from the record; a figure the
            record does not have is left out, never estimated. You can also edit in plain words —
            type &ldquo;make the headline more urgent and move the payment plan up&rdquo; and the
            page changes.
          </p>
        </Step>
        <Step n={4} id="publishing" title="Drafts, approval and the window">
          <p>
            A page is a draft, published, or archived — and a published page can carry a start
            and end date. To the public, a draft or an out-of-window page simply does not exist;
            your team previews it signed in, behind an amber Draft bar.
          </p>
          <p>
            If publishing needs a manager&rsquo;s hand, pressing Publish sends the page for
            approval and the live page stays exactly as it was. Brokers never change a live page
            directly: their edits travel as a proposal, the approver previews it rendered exactly
            as it would publish, and either releases it or sends it back with a note.
          </p>
        </Step>
        <Step n={5} id="the-gate" title="The launch gate">
          <p>
            Before a campaign launches, the system checks the page the ad would send people to.
            If that page does not exist, is not published, or its window has already closed, the
            launch refuses — with a sentence naming the page. The reason is money: every paid
            click on a dead page looks exactly like a bad audience. The spend is real, the leads
            never arrive, and nothing tells you why.
          </p>
          <p>
            A window that will close while the campaign is still running earns a warning rather
            than a refusal — that can be a deliberate choice. And when a project sells out, the
            page stays live with a truthful Sold out badge, so the running campaign never breaks.
          </p>
        </Step>
        <Step n={6} id="languages" title="Languages and the permit strip">
          <p>
            Every page reads in English, Arabic and Russian, chosen from the top bar — Arabic
            flips the whole page right-to-left — in a light or dark look. If a translation ever
            fails, the visitor gets the full English page rather than a half-translated one.
          </p>
          <p>
            When the listing has an advertising permit on file, the page shows the permit number
            and a scannable code that verifies it with the Dubai Land Department — the
            reassurance a careful buyer looks for.
          </p>
        </Step>
      </div>
      <DocNote title="What travels with the lead">
        When someone submits the form, how they read the page travels with them into the CRM: how
        far they scrolled, how long they stayed, whether they opened the payment plan and the
        money sections or lingered on the gallery. Your agent opens the lead already knowing
        which kind of buyer is on the line.
      </DocNote>
      <h2 id="faq" className="scroll-mt-24 mt-12 text-[1.0625rem] font-semibold text-white">
        Common questions
      </h2>
      <div className="mt-4">
        <FAQItem q="Can a page work off-screen — flyers, stands, print?">
          Yes. Every page has its own scannable code for flyers and roadshow stands, and any long
          address can become a short branded link for WhatsApp and print. Leads from both arrive
          tagged, so they attribute to the page that produced them.
        </FAQItem>
        <FAQItem q="Can an ad point somewhere other than our pages?">
          Yes — an outside page, a developer&rsquo;s own site. The launch warns you rather than
          refusing, because it is a legitimate choice with a real cost: leads from an outside
          page cannot be traced back into your CRM.
        </FAQItem>
        <FAQItem q="Can a page be deleted while ads point at it?">
          No. A page wired to campaigns can be archived but not deleted — deleting it would break
          every live ad click and orphan the campaign&rsquo;s history.
        </FAQItem>
      </div>
      <RelatedRow
        hrefs={[
          '/business/docs/inventory',
          '/business/docs/launch-a-campaign',
          '/business/docs/lead-flow',
        ]}
      />
    </DocsShell>
  )
}
