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
  title: 'Team and roles',
  description:
    'The seven roles in plain words, who sees what, and how leads are handed out — by hand or automatically.',
  alternates: { canonical: '/business/docs/team-roles' },
}

/* The seven seats, in the words a brokerage uses — not the system's own. */
const ROLES: Array<{ name: string; line: string }> = [
  { name: 'Broker', line: 'Works their own leads and nothing else. Their list, their calls, their numbers.' },
  { name: 'Team Leader', line: 'Sees their own team, hands out unassigned leads, and answers for the follow-up.' },
  { name: 'Sales Manager', line: 'Runs the desk: every lead, every assignment, and the first check on a submitted deal.' },
  { name: 'Director', line: 'The second signature on deals, with the same full view a sales manager has.' },
  { name: 'Owner', line: 'The paying account. The only seat that can permanently delete a lead or a campaign.' },
  { name: 'Admin', line: 'Runs the workspace itself: the team, the settings, the connected accounts.' },
  { name: 'Marketing', line: 'Runs campaigns and budgets, but never touches finance or deals.' },
]

export default function TeamRolesGuide() {
  return (
    <DocsShell href="/business/docs/team-roles">
      <ArticleMeta category="CRM & brokers" read="4 min read" />

      <p className="mt-6 text-[0.9375rem] leading-[1.75] text-ink-muted">
        Seven kinds of seat, each with its own view of the system. What a person can see and do
        follows from their role — and it is enforced where the records live, not by hiding menu
        items, so a shared link behaves exactly the way the menu does.
      </p>

      <OnPage
        items={[
          { id: 'the-roles', label: 'The seven roles' },
          { id: 'who-sees-what', label: 'Who sees what' },
          { id: 'manual-distribution', label: 'Handing out leads by hand' },
          { id: 'automatic-distribution', label: 'Switching to automatic' },
          { id: 'fairness', label: 'The fairness rules' },
          { id: 'changing-roles', label: 'Changing roles and seats' },
          { id: 'faq', label: 'Common questions' },
        ]}
      />

      <div className="mt-10">
        <Step n={1} title="The seven roles" id="the-roles">
          <ul className="space-y-2.5">
            {ROLES.map((r) => (
              <li key={r.name}>
                <span className="font-medium text-ink">{r.name}</span>
                <span aria-hidden> — </span>
                {r.line}
              </li>
            ))}
          </ul>
        </Step>

        <Step n={2} title="Who sees what" id="who-sees-what">
          <p>
            A broker&rsquo;s lead list, activity feed and assistant show only their own book. That
            filter is applied at the source of the data, so opening a colleague&rsquo;s lead from
            a copied link simply comes up as not found — the screen and the link agree. A team
            leader sees their team; managers, the director and the owner see the whole desk.
          </p>
          <p>
            Money has its own line: only management and marketing can change anything that
            spends. A broker can watch a campaign&rsquo;s results but cannot touch its budget, and
            the personal details captured by Meta lead forms open only for the seats that need
            them.
          </p>
        </Step>

        <Step n={3} title="Handing out leads by hand" id="manual-distribution">
          <p>
            Out of the box, distribution is manual. New leads gather as unassigned, and the CRM
            overview raises a counted notice — unowned leads are invisible to every broker, so
            the count stays on screen until someone acts. A manager assigns from the assignment
            board, which shows each agent&rsquo;s live load: open leads, hot leads, overdue
            follow-ups and recent wins. Leads go where there is room, not to whoever shouts first.
          </p>
        </Step>

        <Step n={4} title="Switching to automatic" id="automatic-distribution">
          <p>
            Turn on automatic distribution and each new lead is handed to an agent the moment it
            arrives, by the rule you choose: even rotation, whoever has the least on their plate,
            top closers first, by area or speciality, or by where the lead came from. You can cap
            how many leads one agent receives in a day, keep hand-outs inside working hours with a
            named fallback person for the night, and every automatic hand-out is written on the
            lead&rsquo;s record and emailed to the agent.
          </p>
          <p>Until you switch it on, nothing assigns itself.</p>
        </Step>

        <Step n={5} title="The fairness rules" id="fairness">
          <p>
            Reassignment has rules, and they favour the agent doing the work. A team leader
            cannot take a lead off an agent within 24 hours of it being assigned — the refusal
            says exactly when it unlocks. And a lead the agent has actually worked — one logged
            call, message, meeting or viewing — cannot be pulled back by a team leader at all,
            however long ago that work was.
          </p>
          <p>
            Every attempt, allowed or refused, goes on the permanent record with who, what and
            why. A pattern of trying is visible, not invisible.
          </p>
        </Step>

        <Step n={6} title="Changing roles and seats" id="changing-roles">
          <p>
            Only the Owner or an Admin can change someone&rsquo;s role. Nobody can change their
            own, and only an Owner can create or alter another Owner. Suspending an account blocks
            sign-in immediately, and every change is recorded with the old and the new role named.
          </p>
        </Step>
      </div>

      <DocNote>
        Only the account owner can delete. Every other seat — admins included — archives instead,
        which keeps the record and its history. Deleting is reserved for the one account that
        answers for the company.
      </DocNote>

      <h2 id="faq" className="scroll-mt-24 text-[1.0625rem] font-semibold leading-snug text-ink">
        Common questions
      </h2>
      <div className="mt-4">
        <FAQItem q="We are a small team — do we need all seven roles?">
          No. Many companies start with an Owner and a few Brokers, and add Team Leaders, a Sales
          Manager or a Marketing seat as the team grows. Nothing requires every seat to be filled.
        </FAQItem>
        <FAQItem q="Can a team leader see leads outside their team?">
          No. A team leader&rsquo;s reach stops at their own team — reading and reassigning both.
          Whole-desk visibility belongs to the management seats.
        </FAQItem>
        <FAQItem q="What happens to an agent’s leads when they leave?">
          Suspend the account — sign-in stops immediately — and reassign their open leads from the
          assignment board. Their history stays on every lead they worked, so the next owner reads
          the full story.
        </FAQItem>
      </div>

      <RelatedRow hrefs={['/business/docs/lead-flow', '/business/docs/crm-day']} />
    </DocsShell>
  )
}
