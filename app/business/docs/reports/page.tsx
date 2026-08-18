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
import { Browser, MiniReport } from '@/components/business/visuals'

export const metadata: Metadata = {
  title: 'Reading the money',
  description:
    'Commission against expenses, the net position, what each lead and each deal cost — every figure from your own records.',
  alternates: { canonical: '/business/docs/reports' },
}

export default function ReportsGuide() {
  return (
    <DocsShell href="/business/docs/reports">
      <ArticleMeta category="Finance" read="5 min read" />
      <p className="mt-6 text-[0.9375rem] leading-[1.75] text-ink-muted">
        The finance screens answer three questions: what came in, what went out, and what each
        lead and each deal actually cost. Every figure is computed from your own records — deals,
        campaigns, the expense ledger — and a number that has not been recorded yet shows as a
        dash, never as a zero.
      </p>
      <OnPage
        items={[
          { id: 'four-tiles', label: 'The four tiles' },
          { id: 'categories', label: 'Where the money went' },
          { id: 'returns', label: 'What the ads returned' },
          { id: 'agent-cash', label: 'Agent cash' },
          { id: 'exports', label: 'Exports and the written report' },
          { id: 'faq', label: 'Common questions' },
        ]}
      />
      <div className="mt-6">
        <Step n={1} id="four-tiles" title="The four tiles">
          <p>
            The finance page opens on four numbers: net commission from approved deals, total
            operating expenses, the net position between the two, and commission still owed to
            agents. That last tile is the one owners forget and agents never do — it is computed
            from what each deal has actually paid out, so it is always current.
          </p>
        </Step>
        <Step n={2} id="categories" title="Where the money went">
          <p>
            Every expense lands in one of seven categories — ads, commission, salaries, expenses,
            transportation, referrals, other — with an editable ledger underneath: who was paid,
            for what, and whether it is settled or still pending. The same entries read as a bill
            list with paid and outstanding totals, filterable and exportable, so month-end is a
            review rather than a reconstruction.
          </p>
        </Step>
        <Step n={3} id="returns" title="What the ads returned">
          <p>
            The ads view shows spend, leads and cost per lead for the last thirty days, then
            month by month. What you typed into the ledger and what campaigns actually committed
            are combined into one figure without double-counting — and reservations that were
            refunded because a campaign never ran are excluded, so the spend shown is spend that
            happened.
          </p>
          <p>
            The return line is computed only once ad spend has been logged. Until then it shows a
            dash and says what to do — it does not print a placeholder percentage. The month
            report ties it together: spend into leads into deals, and what each step cost.
          </p>
          <div className="mt-4 max-w-[28rem]">
            <Browser title="app.yourcompany.com/finance">
              <MiniReport />
            </Browser>
          </div>
        </Step>
        <Step n={4} id="agent-cash" title="Agent cash">
          <p>
            Every approved deal that still owes commission is listed with the amount outstanding
            against the total. Record a payment and the balance updates; when a deal is fully
            settled it moves to closed on its own. Each deal&rsquo;s commission also breaks down
            line by line — referral, cashback, expenses, the agents&rsquo; share, what the
            company keeps — so nobody argues from memory.
          </p>
          <p>
            A deal only becomes money after two separate approvals: one role verifies the
            documents, a different role gives final approval. Until both have happened, it
            appears as pending — visible, but never counted.
          </p>
        </Step>
        <Step n={5} id="exports" title="Exports and the written report">
          <p>
            Four one-click reports cover the usual asks — sales and commission by month, lead
            sources, expenses by category, commission settlement — and any report downloads as a
            spreadsheet or a print-ready PDF. One button also produces a written company report:
            a summary, the key figures, and recommended decisions with an owner for each,
            grounded in your live numbers and saved so you can reopen it.
          </p>
        </Step>
      </div>
      <DocNote title="The dash rule">
        A dash means the underlying events have not been recorded yet — not zero. No response
        times before anyone has responded, no return before spend is logged, no viewing rate
        before a viewing is held. When a figure appears, something real happened behind it.
      </DocNote>
      <h2 id="faq" className="scroll-mt-24 mt-12 text-[1.0625rem] font-semibold text-white">
        Common questions
      </h2>
      <div className="mt-4">
        <FAQItem q="Who can see the money?">
          Finance is management-only. An agent sees their own leads, their own deals and their
          own commission — never the company&rsquo;s books. Roles are enforced on every screen,
          not just hidden from the menu.
        </FAQItem>
        <FAQItem q="Do the numbers match across screens?">
          Yes, by construction. Every screen reads the same records, so the month report, the
          return page and the finance tiles cannot tell two different stories about the same
          month.
        </FAQItem>
        <FAQItem q="What counts as a deal here?">
          Only deals that have passed both approvals count toward sales and commission. Pending
          deals are shown so you know what is coming, but they never inflate the totals — and a
          double click can never approve the same deal twice.
        </FAQItem>
      </div>
      <RelatedRow hrefs={['/business/docs/spend-rules', '/business/docs/team-roles']} />
    </DocsShell>
  )
}
