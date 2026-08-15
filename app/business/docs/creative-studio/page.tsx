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

export const metadata: Metadata = {
  title: 'The studio',
  description:
    'Every creative tool in one place — what each one does, and the rule they all share: the studio writes words, never figures.',
  alternates: { canonical: '/business/docs/creative-studio' },
}

export default function CreativeStudioGuide() {
  return (
    <DocsShell href="/business/docs/creative-studio">
      <ArticleMeta category="Creative studio" read="4 min read" />
      <p className="mt-6 text-[0.9375rem] leading-[1.75] text-[#94A3B8]">
        The studio makes everything your campaigns run — finished ad designs, video reels,
        captions, branded brochures. What you download is the exact file that runs as the ad;
        nothing in the studio is a mock-up.
      </p>
      <OnPage
        items={[
          { id: 'one-engine', label: 'One engine, three shapes' },
          { id: 'tools', label: 'The tools' },
          { id: 'words-numbers', label: 'Words from the studio, numbers from the record' },
          { id: 'permit', label: 'The permit, on every size' },
          { id: 'push', label: 'Into the ad set that already works' },
          { id: 'faq', label: 'Common questions' },
        ]}
      />
      <div className="mt-6">
        <Step n={1} id="one-engine" title="One engine, three shapes">
          <p>
            Every design is drawn at true ad size, in the three shapes ads actually run — feed,
            square and story. Design once and the studio produces all three, so one listing looks
            like one campaign wherever it appears. Write the headline in Arabic and the whole
            layout flips right-to-left on its own.
          </p>
        </Step>
        <Step n={2} id="tools" title="The tools">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium text-white">Ad Designer</span> — pick a listing and
              get a grid of finished designs built from its own price and payment plan; choose
              one, add the permit, write the caption, download or launch.
            </li>
            <li>
              <span className="font-medium text-white">Photo Reel</span> — listing photos become
              a real video: a slow push across each photo, an opening title, a closing offer
              card.
            </li>
            <li>
              <span className="font-medium text-white">Image editor</span> — crop, reframe and
              touch up the photos in your library before they carry a design.
            </li>
            <li>
              <span className="font-medium text-white">Video</span> — trim a clip, add a caption
              and a closing card, pick the cover frame; oversized phone clips shrink without
              leaving the app.
            </li>
            <li>
              <span className="font-medium text-white">Presenters</span> — three ready on-camera
              personas, each with one saved face for your whole company, so it is the same person
              in every creative.
            </li>
            <li>
              <span className="font-medium text-white">Brochure &rarr; Ad Set</span> — drop a
              developer&rsquo;s PDF; the studio reads the facts, creates the listing and its
              page, and designs ads from the same numbers.
            </li>
            <li>
              <span className="font-medium text-white">Templates</span> — ready designs in
              English, Arabic and Russian, previewed live with your own photos rather than stock
              screenshots.
            </li>
            <li>
              <span className="font-medium text-white">Library</span> — everything any tool makes
              lands in one place, ready for the next campaign.
            </li>
          </ul>
        </Step>
        <Step n={3} id="words-numbers" title="Words from the studio, numbers from the record">
          <p>
            Describe the ad in your own words and the studio writes the lines that sit on the
            design — in English, Arabic or Russian. It never writes a figure. Every price, date,
            yield and percentage on a creative comes from the listing&rsquo;s record or from your
            own typing, and nothing you typed is ever overwritten.
          </p>
          <p>
            The same rule has teeth: a terms-led design — the kind that leads with the down
            payment and the total price — cannot be produced while a figure is missing. The
            studio names exactly which fact it needs, because an ad with a blank where the price
            belongs looks finished, and finished things get published.
          </p>
        </Step>
        <Step n={4} id="permit" title="The permit, on every size">
          <p>
            One tap stamps the advertising permit&rsquo;s scannable code on the design — on all
            three shapes at once, with a clean backing so it always scans. Paste the permit
            number and the studio turns it into the official verification link, so scanning it
            actually proves the permit rather than showing a bare number.
          </p>
        </Step>
        <Step n={5} id="push" title="Into the ad set that already works">
          <p>
            Pick pictures, press once, and they become real ads inside the ad set that is already
            producing — same audience, same lead form, same landing page, same button. Only the
            picture is new, and the new ads arrive paused so switching them on stays your
            decision.
          </p>
          <p>
            The studio then tells you which design actually won — and refuses to crown a winner
            when the race never happened. A design must have spent at least one lead&rsquo;s
            worth of budget before it can be judged; below that it is marked &ldquo;too
            early&rdquo;, never &ldquo;losing&rdquo;.
          </p>
        </Step>
      </div>
      <DocNote title="Nothing invented">
        Every photo in the studio is one your account already had — from the listing, a brochure,
        or your library. Designs are composed over your own photographs; the studio does not
        generate pictures of property that was never built.
      </DocNote>
      <h2 id="faq" className="scroll-mt-24 mt-12 text-[1.0625rem] font-semibold text-white">
        Common questions
      </h2>
      <div className="mt-4">
        <FAQItem q="Can I make an Arabic ad from an English dashboard?">
          Yes. Templates carry their copy in all three ad languages, and the layout flips
          right-to-left from the headline on its own — the language you work in and the language
          the ad speaks are independent.
        </FAQItem>
        <FAQItem q="What files do I actually get?">
          The exact full-size files the ad platform receives, in all three shapes, downloadable
          together with the caption alongside. What you approve on screen is what runs.
        </FAQItem>
        <FAQItem q="What happens when a design wears out?">
          When the average person has seen an ad about three times, the studio flags it and
          suggests a fresh design with a different argument — investor where lifestyle ran, terms
          where urgency ran. And if an ad never produced a lead, it says so plainly: that is not
          a worn-out design, and a second one would spend more on the same wrong thing.
        </FAQItem>
      </div>
      <RelatedRow
        hrefs={[
          '/business/docs/launch-a-campaign',
          '/business/docs/landing-pages',
          '/business/docs/inventory',
        ]}
      />
    </DocsShell>
  )
}
