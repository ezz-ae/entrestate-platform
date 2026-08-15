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
import { Browser, MiniCRM } from '@/components/business/visuals'

export const metadata: Metadata = {
  title: 'Audiences',
  description:
    'Named audiences in buyer language, lookalikes built from rated leads, and what never leaves your system.',
  alternates: { canonical: '/business/docs/audiences' },
}

export default function AudiencesGuide() {
  return (
    <DocsShell href="/business/docs/audiences">
      <ArticleMeta category="Lead machine" read="4 min read" />
      <p className="mt-6 text-[0.9375rem] leading-[1.75] text-[#94A3B8]">
        An audience is who your ad is shown to. Entrestate starts from who actually buys, not
        from broad interests — and it never hands anyone a raw phone number or email to get
        there.
      </p>
      <OnPage
        items={[
          { id: 'named-audiences', label: 'Start from a named audience' },
          { id: 'rate-your-leads', label: 'Rate your leads' },
          { id: 'lookalikes', label: 'Build a lookalike' },
          { id: 'exclusions', label: 'Exclude who you already have' },
          { id: 'attach', label: 'Attach it to a campaign' },
        ]}
      />
      <div className="mt-6">
        <Step n={1} id="named-audiences" title="Start from a named audience">
          <p>
            The audience library speaks your language, not an ad platform&rsquo;s:
            &ldquo;Local Emirati investor — cash&rdquo;, &ldquo;Arabic end-user buyers in the
            UAE&rdquo;, &ldquo;Golden Visa buyer — UAE&rdquo;, &ldquo;English-speaking resident —
            mortgage&rdquo;, &ldquo;Russian-speaking resident — cash&rdquo;.
          </p>
          <p>
            Each card shows what a lead from that audience is expected to cost — typically
            AED 100 to 220 — so you know what a fair price looks like before you spend anything.
          </p>
        </Step>
        <Step n={2} id="rate-your-leads" title="Rate your leads">
          <p>
            Every lead can be rated 0 to 10: 0 means worthless — stop buying leads like this;
            10 means exactly what we want. Every rating teaches the machine what to buy and what
            to stop buying.
          </p>
          <p>
            Leads rated 6 or better become the seed your best audiences are built from. Closed
            deals count most of all — a buyer who closed at AED 4M weighs more in the seed than
            someone who merely answered the phone.
          </p>
          <div className="mt-4 max-w-[28rem]">
            <Browser title="app.yourbrokerage.ae/crm">
              <MiniCRM />
            </Browser>
          </div>
        </Step>
        <Step n={3} id="lookalikes" title="Build a lookalike">
          <p>
            A lookalike asks Meta to find new people who resemble your best leads. Build it on
            your top 3% for the closest match. It needs at least 100 matched people to stand on —
            with fewer, the screen tells you the shortfall instead of building something that
            would quietly underperform.
          </p>
          <p>
            A new lookalike takes Meta a few hours to fill. That is normal, and the screen says
            so — it is not a fault.
          </p>
        </Step>
        <Step n={4} id="exclusions" title="Exclude who you already have">
          <p>
            Two lists keep your budget off people it cannot help. The first holds everyone
            already in your CRM, so you never pay again to acquire a person you are already
            talking to. The second holds the leads your own team rated junk — and that one is
            applied to every launch automatically, not as an option.
          </p>
        </Step>
        <Step n={5} id="attach" title="Attach it to a campaign">
          <p>
            In the campaign wizard&rsquo;s Targeting step, pick the audience by name. A saved
            audience keeps its own exclusions when you attach it. Broad delivery is allowed too —
            the system will tell you that is what is happening, but it never refuses a strategy.
          </p>
        </Step>
      </div>
      <DocNote title="Privacy">
        Before anything reaches Meta, numbers are scrambled beyond recognition — Meta can only
        check whether it already knows the same person. Raw phone numbers and emails never leave
        your system, and nothing is uploaded until you confirm it.
      </DocNote>
      <h2 className="mt-12 text-[1.0625rem] font-semibold text-white">Common questions</h2>
      <div className="mt-4">
        <FAQItem q="Why can't I build a lookalike yet?">
          Not enough rated leads. A lookalike needs at least 100 matched people behind it, and
          the screen shows how far you are. Keep working and rating leads — the option appears
          on its own as your book grows.
        </FAQItem>
        <FAQItem q="Are broad audiences bad?">
          No — broad delivery is a legitimate way to buy, and the system never blocks it. Named
          audiences and lookalikes simply start from stronger evidence: who actually enquired,
          qualified and bought, rather than what people claim to be interested in.
        </FAQItem>
        <FAQItem q="Do my ratings leave the system?">
          Never. Ratings, names and notes stay in your CRM. The only thing an ad platform learns
          is whether a scrambled number matches someone it already knows.
        </FAQItem>
      </div>
      <RelatedRow
        hrefs={[
          '/business/docs/launch-a-campaign',
          '/business/docs/spend-rules',
          '/business/docs/lead-flow',
        ]}
      />
    </DocsShell>
  )
}
