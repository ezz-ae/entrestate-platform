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
import { Ledger } from '@/components/business/visuals'

export const metadata: Metadata = {
  title: 'Budgets and spend rules',
  description:
    'Templates, daily ceilings and only-if gates — with no rule, the machine spends nothing on its own.',
  alternates: { canonical: '/business/docs/spend-rules' },
}

export default function SpendRulesGuide() {
  return (
    <DocsShell href="/business/docs/spend-rules">
      <ArticleMeta category="Lead machine" read="4 min read" />
      <p className="mt-6 text-[0.9375rem] leading-[1.75] text-[#94A3B8]">
        The machine can move money between ads — pause a loser, raise a winner — but only inside
        rules you wrote. This guide shows how to set that ceiling. The default is simple: with no
        rule, it spends nothing on its own.
      </p>
      <OnPage
        items={[
          { id: 'the-default', label: 'Know the default' },
          { id: 'templates', label: 'Pick a template' },
          { id: 'your-own-rule', label: 'Or write your own rule' },
          { id: 'never', label: 'What a rule never allows' },
          { id: 'the-ledger', label: 'Read the ledger' },
        ]}
      />
      <div className="mt-6">
        <Step n={1} id="the-default" title="Know the default">
          <p>
            Until you add a rule, the machine may watch, report and propose — but it cannot move
            a dirham. Every budget change it wants to make waits as a suggestion for your click.
            Adding a rule is you granting an allowance, not switching off your judgment.
          </p>
        </Step>
        <Step n={2} id="templates" title="Pick a template">
          <p>Three ready postures cover most companies. Each is a ceiling plus conditions:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium text-white">Conservative</span> (recommended) — up to
              AED 300 a day, raises of at most AED 50 at a time, and only while a lead costs
              under AED 120, lead quality holds at 70 or better, and at least 10 leads back the
              numbers.
            </li>
            <li>
              <span className="font-medium text-white">Standard</span> — up to AED 750 a day,
              AED 150 per move, a lead under AED 200, quality at 55 or better, at least 5 leads.
            </li>
            <li>
              <span className="font-medium text-white">Aggressive</span> — up to AED 1,500 a
              day, AED 400 per move, a lead under AED 350, quality at 40 or better, at least 3
              leads.
            </li>
          </ul>
          <p>
            They are starting postures, not verdicts — pick the nearest one and edit any figure.
          </p>
        </Step>
        <Step n={3} id="your-own-rule" title="Or write your own rule">
          <p>
            A rule has three parts. Where it applies: one project, or all of them. How much: the
            most it may fund per day, and the most it may add in a single move. And the only-if
            gates: only if a lead costs under your figure, only if lead quality is at least your
            figure, only if enough leads exist to trust the numbers.
          </p>
          <p>
            A gate the machine cannot verify counts as failed. A campaign with no results yet
            gets no raise, whatever the rule would otherwise allow — it never funds a guess.
          </p>
        </Step>
        <Step n={4} id="never" title="What a rule never allows">
          <p>Four things hold no matter what you write:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>It never spends past the daily ceiling.</li>
            <li>It never raises by more than the per-move cap in one step.</li>
            <li>
              It never raises on absent results — no leads means no raise, however permissive
              the rule.
            </li>
            <li>
              Lowering a budget or pausing an ad never needs an allowance at all. Spending less
              is always permitted.
            </li>
          </ul>
        </Step>
        <Step n={5} id="the-ledger" title="Read the ledger">
          <p>
            Every automatic move is written down before the money moves, in plain sentences:
            what changed, by how much, and which rule allowed it. Moves the machine wanted but
            held are written too, with the reason — so you can see not just what it did, but
            what it refused to do.
          </p>
          <div className="mt-4 max-w-[30rem]">
            <Ledger
              rows={[
                {
                  time: '09:14',
                  event: 'Raised Marina Vista video — a lead costs AED 82, rule allows under 120',
                  amount: '+AED 120',
                },
                {
                  time: '09:14',
                  event: 'Held Bayview Terraces launch — 2 leads so far, rule needs 5',
                },
                {
                  time: '16:02',
                  event: 'Paused Creekside One photo — a lead now costs past your ceiling',
                },
              ]}
            />
          </div>
        </Step>
      </div>
      <DocNote title="The empty state">
        Until your first rule exists, the screen says it plainly: &ldquo;No rules yet — the AI
        cannot spend autonomously until you add one.&rdquo; That sentence is the default, not an
        error.
      </DocNote>
      <h2 className="mt-12 text-[1.0625rem] font-semibold text-white">Common questions</h2>
      <div className="mt-4">
        <FAQItem q="Can it empty my ad account?">
          No. The daily ceiling is absolute, each raise is capped, and a raise needs real
          results behind it. Switch a rule off at any time and the machine goes back to
          proposing only.
        </FAQItem>
        <FAQItem q="What does “quality” mean in a gate?">
          It is scored from what the leads actually did in your CRM — answered, qualified,
          closed, or turned out to be junk — not from what the ad platform reports. A campaign
          can look cheap in Ads Manager and still fail a quality gate here.
        </FAQItem>
        <FAQItem q="Does a rule ever pause my ads?">
          Rules you set on cost or quality can pause a campaign, and pausing never needs an
          allowance — spending less is always permitted. The pause lands in the ledger with its
          reason, and you can switch the campaign back on whenever you choose.
        </FAQItem>
      </div>
      <RelatedRow
        hrefs={[
          '/business/docs/launch-a-campaign',
          '/business/docs/audiences',
          '/business/docs/reports',
        ]}
      />
    </DocsShell>
  )
}
