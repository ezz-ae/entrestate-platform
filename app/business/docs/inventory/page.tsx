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
import { Browser, MiniInventory } from '@/components/business/visuals'

export const metadata: Metadata = {
  title: 'Stock and scores',
  description:
    'One record per project, the scores that rank what deserves the next dirham, and what blocks a listing from advertising.',
  alternates: { canonical: '/business/docs/inventory' },
}

export default function InventoryGuide() {
  return (
    <DocsShell href="/business/docs/inventory">
      <ArticleMeta category="Inventory & pages" read="5 min read" />
      <p className="mt-6 text-[0.9375rem] leading-[1.75] text-ink-muted">
        Everything your company sells lives in one catalogue. Each listing carries the facts a
        salesperson actually quotes, and on top of those facts the system keeps scores that tell
        you — at a glance — what is ready to advertise and what deserves the next dirham.
      </p>
      <OnPage
        items={[
          { id: 'the-record', label: 'One record per project' },
          { id: 'add-stock', label: 'Add stock four ways' },
          { id: 'completeness', label: 'The completeness score' },
          { id: 'fit-to-advertise', label: 'Fit to advertise' },
          { id: 'opportunity', label: 'Which listing deserves the next dirham' },
          { id: 'blocks', label: 'What blocks a listing' },
          { id: 'faq', label: 'Common questions' },
        ]}
      />
      <div className="mt-6">
        <Step n={1} id="the-record" title="One record per project">
          <p>
            A listing holds what a buyer will ask about: name, area, developer, prices in AED,
            rental yield, the payment plan, handover, Golden Visa eligibility, photos, and the
            advertising permit. Open any listing and you are looking at the same record your
            pages, your ads and your reports read — there is only one.
          </p>
          <p>
            A fact the record does not have shows as a dash, never as a zero and never as a
            guess. On the public side the same rule reads politely: a listing with no price says
            &ldquo;Price on request&rdquo; instead of AED 0.
          </p>
        </Step>
        <Step n={2} id="add-stock" title="Add stock four ways">
          <p>
            Upload the developer&rsquo;s brochure PDF, paste a link, paste plain text, or type
            the listing by hand. The first three read the source and fill in what they find —
            name, area, prices, payment plan, handover — and leave blank what they cannot find,
            rather than inventing a figure.
          </p>
          <p>
            All four end in the same review screen. You see every extracted value, correct
            anything wrong, and nothing is saved until you confirm. And a brochure import can never
            overwrite a listing you curated by hand — imported stock always lands beside your
            catalogue, never on top of it.
          </p>
        </Step>
        <Step n={3} id="completeness" title="The completeness score">
          <p>
            Every listing carries a 0&ndash;100 completeness score: does the record have what an
            ad and a page will need? A photo, a starting price, a payment plan and the unit types
            all count toward it. Bands are plain — 80 and above is good, 50 to 79 needs work,
            below 50 is poor — and each low score names the missing fact, so filling the gap is a
            task, not a mystery.
          </p>
        </Step>
        <Step n={4} id="fit-to-advertise" title="Fit to advertise">
          <p>
            A second score answers a sharper question: could we run ads for this listing today?
            It combines completeness with whether a live page exists for the listing and whether
            there is a photo to build creative from. Paid traffic with nowhere to land is wasted
            spend, so the page carries real weight.
          </p>
          <p>
            The inventory ranks itself into four buckets — Scale, Launch, Fix first, Hold — and
            gives each listing one plain next action with the reasons behind it, in sentences
            like &ldquo;No landing page — paid traffic would be wasted.&rdquo; A separate Missed
            list surfaces strong-return listings that still have no page.
          </p>
          <div className="mt-4 max-w-[28rem]">
            <Browser title="app.yourcompany.com/inventory">
              <MiniInventory />
            </Browser>
          </div>
        </Step>
        <Step n={5} id="opportunity" title="Which listing deserves the next dirham">
          <p>
            The opportunity score ranks the whole catalogue on one question: where should the
            next advertising dirham go? It weighs the listing&rsquo;s price against its
            neighbours, the strength of its payment plan, its readiness, how busy its area has
            been, the leads it has already produced, and how crowded the area is — and each part
            shows the sentence behind it, citing the numbers it used.
          </p>
          <p>
            When too little is known, the score says &ldquo;insufficient data&rdquo; instead of
            printing a middle-of-the-road number, and unscored listings sort to the bottom rather
            than counting as zero. The score refreshes daily on its own.
          </p>
        </Step>
        <Step n={6} id="blocks" title="What blocks a listing">
          <p>Three things stand between a listing and a live campaign:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium text-ink">The advertising permit.</span> A Dubai
              listing with no valid permit cannot launch, and a running campaign stops on the day
              its permit lapses. You are warned five days ahead so renewal never interrupts a
              campaign.
            </li>
            <li>
              <span className="font-medium text-ink">The page.</span> If the listing has no
              live page for a paid click to land on, the launch refuses and says so.
            </li>
            <li>
              <span className="font-medium text-ink">The record itself.</span> A listing marked
              Fix first is telling you an ad built from it would have a gap where a fact belongs.
              Fill the fact and the block clears.
            </li>
          </ul>
        </Step>
      </div>
      <DocNote title="A dash is information">
        Across the whole catalogue, a number the system does not have is shown as a dash — or the
        line is left out entirely. Nothing is defaulted, rounded into existence, or borrowed from
        a similar listing. When you see a figure, it was recorded.
      </DocNote>
      <h2 id="faq" className="scroll-mt-24 mt-12 text-[1.0625rem] font-semibold text-ink">
        Common questions
      </h2>
      <div className="mt-4">
        <FAQItem q="Where do the scores come from?">
          From the record itself and from what your own campaigns and pages produced — leads,
          visits, results. Nothing is scored on opinion, and every component can show you the
          sentence explaining the number it used.
        </FAQItem>
        <FAQItem q="Can I advertise a listing with a low score?">
          Yes. Scores rank; they do not forbid. Only three things actually block a launch — a
          missing or lapsed permit, no live page to land on, and a design with a gap where a fact
          belongs. A low score is advice you are free to overrule.
        </FAQItem>
        <FAQItem q="What happens when a project sells out?">
          Its page stays live with a truthful Sold out badge, so a running campaign never breaks
          mid-flight, and the listing drops out of the advertise-next rankings on its own.
        </FAQItem>
      </div>
      <RelatedRow
        hrefs={[
          '/business/docs/landing-pages',
          '/business/docs/launch-a-campaign',
          '/business/docs/creative-studio',
        ]}
      />
    </DocsShell>
  )
}
