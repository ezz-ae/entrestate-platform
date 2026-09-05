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
import { Clip } from '@/components/business/clip'

export const metadata: Metadata = {
  title: 'Launch a campaign',
  description:
    'Four steps from choosing a listing to approving the plan — and why every campaign starts paused.',
  alternates: { canonical: '/business/docs/launch-a-campaign' },
}

export default function LaunchACampaignGuide() {
  return (
    <DocsShell href="/business/docs/launch-a-campaign">
      <ArticleMeta category="Lead machine" read="5 min read" />
      <p className="mt-6 text-[0.9375rem] leading-[1.75] text-ink-muted">
        A campaign takes about ten minutes to set up. The wizard walks you through four steps —
        Campaign, Targeting, Creative, Launch — and nothing spends a dirham until you have seen
        the finished ad and switched it on yourself.
      </p>
      <OnPage
        items={[
          { id: 'before-you-start', label: 'Before you start' },
          { id: 'campaign', label: 'Campaign — the listing and the goal' },
          { id: 'targeting', label: 'Targeting — who sees it' },
          { id: 'creative', label: 'Creative — the ad itself' },
          { id: 'launch', label: 'Launch — the approval moment' },
          { id: 'after-launch', label: 'After launch' },
        ]}
      />
      <div className="mt-6">
        <Step n={1} id="before-you-start" title="Check the strip before you start">
          <p>
            While you build, a strip at the top of the wizard names anything that would stop the
            launch: whether your Meta account is connected, whether the listing&rsquo;s advertising
            permit is still valid, and whether the page the ad points at is live right now. Fix
            what it names, or keep building — nothing you have not chosen yet counts against you.
          </p>
          <p>
            If the page a paid click would land on is not live, the launch refuses. You would be
            paying for visits to a page nobody can see, and the only symptom would be leads that
            never arrive.
          </p>
        </Step>
        <Step n={2} id="campaign" title="Campaign — pick the listing and the goal">
          <p>
            Choose the listing and what you want the ad to produce. The goals are in buyer words:
            leads from a form that opens inside Facebook or Instagram already filled with the
            person&rsquo;s details, WhatsApp conversations, direct phone calls, or visits to the
            listing&rsquo;s page.
          </p>
          <p>
            Then set the budget per day — the minimum is AED 50. Smart Spender suggests a figure
            from what a lead from your chosen audience usually costs, tells you roughly how many
            leads a day that funds, and paces delivery so the budget isn&rsquo;t dumped as the day
            ends.
          </p>
        </Step>
        <Step n={3} id="targeting" title="Targeting — choose who sees it">
          <p>
            Pick a named audience — &ldquo;Golden Visa buyer — UAE&rdquo;, &ldquo;Local Emirati
            investor — cash&rdquo; — or one of your own saved audiences and lookalikes. Each card
            shows what a lead from that audience is expected to cost, so the budget conversation
            happens before the money moves.
          </p>
          <p>
            People already in your CRM, and people your team rated junk, are kept out of the
            audience automatically — you never pay twice to meet the same person.
          </p>
        </Step>
        <Step n={4} id="creative" title="Creative — the ad itself">
          <p>
            Write the ad yourself or let the studio draft it from the listing&rsquo;s own facts —
            name, area, price, payment plan. The preview shows the ad exactly as it will appear,
            in feed and in story, in the language you chose — including Arabic.
          </p>
          <p>
            The campaign runs only on the placements that sell property. It will not run a story
            ad on its own.
          </p>
        </Step>
        <Step n={5} id="launch" title="Launch — the approval moment">
          <p>
            The last step is one summary — listing, audience, budget, the ad — and a Launch
            button. Pressing it creates the campaign paused. It always launches paused, so you
            see the ad before a dirham moves. When it looks right, switch it on from the campaign
            desk.
          </p>
          <p>
            In a hurry? Rocket Ad builds the whole campaign from one source — a brochure, the
            landing page, an image, a video, or a link. You set the amount per day and press
            Start. It follows every rule on this page, and it starts paused too.
          </p>
        </Step>
        <Step n={6} id="after-launch" title="After launch — watch the desk">
          <p>
            The campaign desk shows every campaign on one line: on or off, spent, leads, cost
            per lead. When something needs you — an ad rejected, a budget capped, a page that
            went offline — the desk says so in plain words and links to where it gets fixed.
          </p>
          <div className="mt-4 max-w-[28rem]">
            <Clip src="/business/clips/run-ads.mp4" title="skyline.entrestate.com/…/campaigns/launch" />
          </div>
        </Step>
      </div>
      <DocNote title="Permits">
        A Dubai listing must carry a valid advertising permit. The wizard checks it before
        launch, adds the permit number to the ad text, stops the ad on the day the permit
        lapses, and warns you five days ahead so you can renew without interrupting the
        campaign.
      </DocNote>
      <h2 className="mt-12 text-[1.0625rem] font-semibold text-ink">Common questions</h2>
      <div className="mt-4">
        <FAQItem q="Does anything spend while I build?">
          No. Building, previewing and saving cost nothing. A campaign only spends after you have
          launched it and switched it on — and it always arrives paused first.
        </FAQItem>
        <FAQItem q="What if Meta isn't connected yet?">
          The wizard still works. The campaign is saved as a draft that cannot spend, and
          everything you built is ready the day you connect. Until then the campaign desk shows
          a clearly labelled demo so you can learn the screens — nothing on it pretends to be
          your own account, and none of it can spend.
        </FAQItem>
        <FAQItem q="Can I stop a campaign later?">
          Yes — one switch on the campaign desk pauses it. A paused campaign spends nothing and keeps its
          history, so you can switch it back on without starting over.
        </FAQItem>
      </div>
      <RelatedRow
        hrefs={[
          '/business/docs/audiences',
          '/business/docs/spend-rules',
          '/business/docs/landing-pages',
        ]}
      />
    </DocsShell>
  )
}
