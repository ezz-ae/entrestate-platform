'use client'

/**
 * ProductExplorer — the every-tool explorer. Two levels, taken from the
 * product's own grouping: GROUPS (pills) → TOOLS (chips) → one REAL capture
 * of the live demo workspace (skyline.entrestate.com) per tool. The
 * screenshot carries the meaning; the copy only names what is already
 * visible in the frame.
 */

import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Browser } from '@/components/business/visuals'
import { LearnMore } from '@/components/business/holders'
import { Section, SectionHeading } from '@/components/business/ui'

interface MicroCard {
  title: string
  body: string
}

interface Tool {
  id: string
  label: string
  /** File under /business/screens/ — a real product capture, not a mockup. */
  screen: string
  /** Address shown in the Browser chrome. */
  title: string
  alt: string
  keyword: string
  caption: string
  cards: [MicroCard, MicroCard, MicroCard]
  /** The one door deeper — a guide under /business/docs. */
  learn?: string
}

interface Group {
  id: string
  label: string
  tools: Tool[]
}

/* Every claim below is visible in its screenshot. Nothing is promised that
   the shot does not show. */
const GROUPS: Group[] = [
  {
    id: 'sell',
    label: 'Sell & follow up',
    tools: [
      {
        id: 'crm-leads',
        label: 'CRM leads',
        screen: '/business/screens/crm-leads.webp',
        title: 'skyline.entrestate.com/crm',
        alt: 'The CRM command centre listing leads by temperature, stage and budget, with a no-owner warning on top',
        keyword: 'The first hour.',
        caption: 'Every lead lands owned, ranked, and one tap from WhatsApp.',
        learn: '/business/docs/crm-day',
        cards: [
          { title: 'No lead unowned', body: 'Leads with no owner get flagged for assignment.' },
          { title: 'Ranked, worst first', body: 'Rank by value, worst first — the desk’s own sort.' },
          { title: 'Call or WhatsApp', body: 'Every lead row carries call and WhatsApp buttons.' },
        ],
      },
      {
        id: 'pipeline',
        label: 'Pipeline',
        screen: '/business/screens/pipeline.webp',
        title: 'skyline.entrestate.com/crm/pipeline',
        alt: 'The sales pipeline by stage, each stage carrying its lead count and AED value, with the conversion rate',
        keyword: 'Every stage, priced.',
        caption: 'Each stage carries its lead count and AED value, new to closed.',
        learn: '/business/docs/lead-flow',
        cards: [
          { title: 'AED per stage', body: 'Nine leads, AED 13.8M pipeline, priced stage by stage.' },
          { title: 'Conversion on screen', body: 'Closed over total — the rate stays in view.' },
          { title: 'Stuck stages named', body: 'The desk says when a stage stops moving.' },
        ],
      },
      {
        id: 'follow-up',
        label: 'Follow-up queue',
        screen: '/business/screens/follow-up.webp',
        title: 'skyline.entrestate.com/crm/follow-ups',
        alt: 'The follow-up queue with overdue, critical and snoozed tiles, and mark-done, snooze and WhatsApp actions per lead',
        keyword: 'No lead goes cold.',
        caption: 'Overdue, critical and snoozed counted — every item one tap from done.',
        learn: '/business/docs/crm-day',
        cards: [
          { title: 'Queue, counted', body: 'Overdue, critical, average delay, snoozed — four tiles.' },
          { title: 'Three actions each', body: 'Mark done, snooze, or WhatsApp from the row.' },
          { title: 'Response clock', body: 'Set a target and late replies get flagged.' },
        ],
      },
    ],
  },
  {
    id: 'advertise',
    label: 'Advertise',
    tools: [
      {
        id: 'campaigns',
        label: 'Campaign desk',
        screen: '/business/screens/live/live-campaigns.webp',
        title: 'skyline.entrestate.com/ads',
        alt: 'The Meta campaign desk in real delivery — nine campaigns tracked, AED 37,243 spent, 221 leads generated, CPL per row',
        keyword: 'Ads with brakes.',
        caption: 'A working desk in real delivery — spend, leads and cost-per-lead printed per row.',
        learn: '/business/docs/launch-a-campaign',
        cards: [
          { title: 'CPL on every row', body: 'Impressions, clicks, spend, leads, cost-per-lead.' },
          { title: 'One-button launch', body: 'New Campaign opens the wizard from the desk.' },
          { title: 'An expert docked', body: 'Ask what is driving results, in plain words.' },
        ],
      },
      {
        id: 'launch',
        label: 'Launch wizard',
        screen: '/business/screens/launch.webp',
        title: 'skyline.entrestate.com/ads/launch',
        alt: 'The four-step campaign launch wizard with objective tiles and a live ad preview panel',
        keyword: 'Four steps to live.',
        caption: 'Campaign, targeting, creative, launch — the ad previewed before anything moves.',
        learn: '/business/docs/launch-a-campaign',
        cards: [
          { title: 'Pick the objective', body: 'Landing traffic, Meta Lead, WhatsApp, calls, branding, roadshow.' },
          { title: 'Preview before spend', body: 'See the ad in Feed and Story first.' },
          { title: 'Readiness spelled out', body: 'Ready, still to pick, worth a look, blocking.' },
        ],
      },
      {
        id: 'optimize',
        label: 'Budget optimizer',
        screen: '/business/screens/live/live-optimize.webp',
        title: 'skyline.entrestate.com/ads/optimizer',
        alt: 'The AI budget optimizer ranking campaigns by cost per lead, with a machine recommendation ready to apply',
        keyword: 'Budgets, not guesses.',
        caption: 'The machine ranks every campaign by cost per lead and proposes the next move.',
        learn: '/business/docs/spend-rules',
        cards: [
          { title: 'Efficiency rank', body: 'Every campaign ordered by what a lead costs.' },
          { title: 'Advisory autonomy', body: 'The machine proposes; a person applies with one click.' },
          { title: 'Fetched, never guessed', body: 'Grounded in this month’s delivery and CRM lead quality.' },
        ],
      },
      {
        id: 'ads-live',
        label: 'Live performance',
        screen: '/business/screens/live/live-ads-live.webp',
        title: 'skyline.entrestate.com/ads/live',
        alt: 'Live ad performance — 30-day spend, total leads and blended CPL tiles above per-campaign delivery rows',
        keyword: 'Spend, watched live.',
        caption: 'Real-time spend, leads and CPL across Meta and Google — numbers through today.',
        learn: '/business/docs/get-set-up',
        cards: [
          { title: 'Both networks', body: 'Meta Ads and Google Ads share one overview.' },
          { title: 'Needs-you flag', body: 'Campaigns with something to fix raise their hand.' },
          { title: 'Per-lead truth', body: 'Every row prints spend, leads and cost per lead.' },
        ],
      },
      {
        id: 'targeting',
        label: 'Targeting',
        screen: '/business/screens/targeting.webp',
        title: 'skyline.entrestate.com/ads/targeting',
        alt: 'Audience templates for UAE buyers, each with expected CPL, suggested budget and leads per week, above Buyer Match',
        keyword: 'Real numbers first.',
        caption: 'Pre-built UAE buyer audiences, each priced with CPL, budget and weekly leads.',
        learn: '/business/docs/audiences',
        cards: [
          { title: 'Buyer match', body: 'Pick a listing; see who actually buys it.' },
          { title: 'Priced templates', body: 'Expected CPL, suggested budget, leads a week — printed.' },
          { title: 'The learning loop', body: 'Real CPL feeds the next round’s targeting.' },
        ],
      },
    ],
  },
  {
    id: 'audiences',
    label: 'Audiences',
    tools: [
      {
        id: 'audiences',
        label: 'Audience builder',
        screen: '/business/screens/live/live-audiences.webp',
        title: 'skyline.entrestate.com/ads/audiences',
        alt: 'The audience builder with built audiences carrying reach estimates, warm audiences and the four creation doors',
        keyword: 'Buyers, in plain words.',
        caption: 'Describe the buyer; the desk builds the audience — reach estimated, list hashed.',
        learn: '/business/docs/audiences',
        cards: [
          { title: 'Special buyers', body: 'Doctors, CEOs, Golden Visa seekers — combine three.' },
          { title: 'Reach, estimated', body: 'Each built audience carries its expected reach.' },
          { title: 'Hashed before Meta', body: 'Lists are hashed before they ever reach Meta.' },
        ],
      },
      {
        id: 'audience-lab',
        label: 'Audience Lab',
        screen: '/business/screens/audience-lab.webp',
        title: 'skyline.entrestate.com/ads/audience-lab',
        alt: 'Audience Lab showing captured registration events, seed depth counts and the pre-launch layer audit',
        keyword: 'Proof over promise.',
        caption: 'What your leads proved, how strong the seed is, which layers matter.',
        learn: '/business/docs/audiences',
        cards: [
          { title: 'Seed depth counted', body: 'Seed cohort, matchable, suppress, neutral — four counts.' },
          { title: 'Honest blockers', body: 'Lookalikes stay blocked until Meta matches enough people.' },
          { title: 'Layer audit', body: 'Every targeting layer probed against Meta before launch.' },
        ],
      },
      {
        id: 'forms',
        label: 'Lead forms',
        screen: '/business/screens/live/live-forms.webp',
        title: 'skyline.entrestate.com/ads/forms',
        alt: 'Lead gen forms in real use — six forms, 207 Meta leads, the form portfolio value and the all-forms audience builder',
        keyword: 'Forms, straight in.',
        caption: 'A form is a data workout — portfolio value, ratings and audiences built from answers.',
        learn: '/business/docs/lead-flow',
        cards: [
          { title: 'Portfolio value', body: 'Leads in CRM, rated share, average value — across all forms.' },
          { title: 'It builds audiences', body: 'Qualified leads become a custom audience plus lookalike.' },
          { title: 'Hashed before Meta', body: 'Raw phones and emails never leave the platform.' },
        ],
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & pages',
    tools: [
      {
        id: 'inventory',
        label: 'Inventory',
        screen: '/business/screens/inventory.webp',
        title: 'skyline.entrestate.com/inventory',
        alt: 'Inventory grouped by developer — 21 developers, 621 units — with Emaar expanded into priced, lead-counted project rows',
        keyword: 'Know your stock.',
        caption: 'Stock grouped by developer — units, live pages and campaigns counted.',
        learn: '/business/docs/inventory',
        cards: [
          { title: 'Grouped by developer', body: 'Every property sits under its developer, counted.' },
          { title: 'Four counters', body: 'Developers, total units, live pages, active campaigns.' },
          { title: 'Search everything', body: 'Find stock by name, developer, or area.' },
        ],
      },
      {
        id: 'landings',
        label: 'Landing pages',
        screen: '/business/screens/landings.webp',
        title: 'skyline.entrestate.com/inventory/landing-pages',
        alt: 'Landing pages across 621 properties — 15 live, missing ones flagged with Generate all — each row scored ad-ready',
        keyword: 'A page per property.',
        caption: 'Every property carries a dedicated ad landing page — missing ones flagged.',
        learn: '/business/docs/landing-pages',
        cards: [
          { title: 'Missing, flagged', body: 'Properties without pages cannot run ad campaigns.' },
          { title: 'Generate all', body: 'One button creates every missing page.' },
          { title: 'Ad-ready scored', body: 'Each property carries its readiness percentage bar.' },
        ],
      },
    ],
  },
  {
    id: 'create',
    label: 'Create',
    tools: [
      {
        id: 'creative-studio',
        label: 'Creative Suite',
        screen: '/business/screens/creative-studio.webp',
        title: 'skyline.entrestate.com/creative-studio',
        alt: 'The Creative Suite grid: Ad Designer, Photo Reel, image editor, video, presenters, brochure-to-ad-set, templates and library',
        keyword: 'One design room.',
        caption: 'Ads, reels, images, video and presenters — every design tool together.',
        learn: '/business/docs/creative-studio',
        cards: [
          { title: 'Brochure to ad set', body: 'A developer PDF becomes the full design set.' },
          { title: 'Photo Reel', body: 'Listing photos become a real video ad.' },
          { title: 'Library, synced', body: 'Everything saved is ready to reuse, synced with Drive.' },
        ],
      },
      {
        id: 'creative-lab',
        label: 'Creative Lab',
        screen: '/business/screens/live/live-creatives.webp',
        title: 'skyline.entrestate.com/creative-lab',
        alt: 'Creative Lab showing a project’s generated ad set — the same photo, price and colours across every format',
        keyword: 'Its own ads.',
        caption: 'Ads made from the project’s own photo, price and terms — same look every time.',
        learn: '/business/docs/creative-studio',
        cards: [
          { title: 'From the listing', body: 'The project’s real photo, price and terms — nothing invented.' },
          { title: 'Recognisable on sight', body: 'Same colours every time, so buyers start to know it.' },
          { title: 'Make this next', body: 'The lab proposes the next creative worth trying.' },
        ],
      },
      {
        id: 'ad-designer',
        label: 'Ad Designer',
        screen: '/business/screens/ad-designer.webp',
        title: 'skyline.entrestate.com/creative-studio/ad-designer',
        alt: 'The Ad Designer editor with feed, square and story formats, copy fields in three languages, layouts and colours',
        keyword: 'Real pixels ship.',
        caption: 'Composed at full ad resolution — the download is what Meta gets.',
        learn: '/business/docs/creative-studio',
        cards: [
          { title: 'Three languages', body: 'English, Arabic and Russian copy, side by side.' },
          { title: 'Facts only', body: 'Never invents a price, date or amenity.' },
          { title: 'Every placement', body: 'Feed, square and story, previewed at 1080×1350.' },
        ],
      },
      {
        id: 'drive',
        label: 'Drive',
        screen: '/business/screens/drive.webp',
        title: 'skyline.entrestate.com/drive',
        alt: 'Drive rooms — the files manager, media editor and account cloud — with the docked expert alongside',
        keyword: 'Everything you made.',
        caption: 'Files, media editor and account cloud — every room in one place.',
        cards: [
          { title: 'Files Manager', body: 'Browse, organise and share everything you’ve made.' },
          { title: 'Media Editor', body: 'Open and edit images, videos, PDFs and documents.' },
          { title: 'Cloud uploads', body: 'Bulk-upload developer brochures and sheets.' },
        ],
      },
    ],
  },
  {
    id: 'money',
    label: 'Money',
    tools: [
      {
        id: 'finance',
        label: 'Finance',
        screen: '/business/screens/finance.webp',
        title: 'skyline.entrestate.com/finance',
        alt: 'Company finance with commission tiles, expense categories, commission payouts and the expense ledger',
        keyword: 'The books balance.',
        caption: 'Commission in, expenses out, net position on one screen.',
        learn: '/business/docs/reports',
        cards: [
          { title: 'Commission tracked', body: 'Approved deals in, outstanding owed to agents out.' },
          { title: 'Every cost filed', body: 'Ads, salaries, transport, referrals — each its column.' },
          { title: 'A written ledger', body: 'Every expense lands as an entry with status.' },
        ],
      },
      {
        id: 'spend-rules',
        label: 'AI spend rules',
        screen: '/business/screens/spend-rules.webp',
        title: 'skyline.entrestate.com/finance/spend-rules',
        alt: 'AI spend rules with conservative, standard and aggressive templates, ceiling and gate fields, and the decision feed',
        keyword: 'A leash on spend.',
        caption: 'No rule, no autonomous spend — ceilings and result gates you set.',
        learn: '/business/docs/spend-rules',
        cards: [
          { title: 'Nothing by default', body: 'With no rule the AI spends nothing.' },
          { title: 'Three templates', body: 'Conservative, standard, aggressive — ceilings printed on each.' },
          { title: 'Gated by results', body: 'CPL, quality and lead gates on every rule.' },
        ],
      },
      {
        id: 'tokens',
        label: 'Credits',
        screen: '/business/screens/tokens.webp',
        title: 'skyline.entrestate.com/credits',
        alt: 'The credit balance with how credits are earned from approved deals, a Create ad button and personal performance tiles',
        keyword: 'Deals fund ads.',
        caption: 'Approved deals earn credits; credits fund the next AI ad.',
        cards: [
          { title: 'Earned from deals', body: 'One credit per AED 1,000 of net commission.' },
          { title: 'Credits become ads', body: 'Create ad sits right beside the balance.' },
          { title: 'Performance in view', body: 'Leads, deals and closing rate, counted below.' },
        ],
      },
    ],
  },
  {
    id: 'analyze',
    label: 'Analyze',
    tools: [
      {
        id: 'analytics',
        label: 'Analytics',
        screen: '/business/screens/analytics.webp',
        title: 'skyline.entrestate.com/analytics',
        alt: 'Company analytics with lead, conversion and closing-rate tiles, live revenue tiles and a Generate company report button',
        keyword: 'The whole company.',
        caption: 'Company-wide leads, conversions and revenue, with a one-button report.',
        learn: '/business/docs/reports',
        cards: [
          { title: 'Four ledgers', body: 'Company, team, market and marketing tabs.' },
          { title: 'Live tiles', body: 'Sales volume, commission and approvals marked live.' },
          { title: 'One-button report', body: 'Generate company report sits in the header.' },
        ],
      },
      {
        id: 'attribution',
        label: 'Attribution',
        screen: '/business/screens/live/live-attribution.webp',
        title: 'skyline.entrestate.com/ads/attribution',
        alt: 'Performance attribution — best and average cost per lead across nine campaigns, each judged against its CPL target',
        keyword: 'Which ad earned it.',
        caption: 'Every campaign judged against its cost-per-lead target — above or under, in colour.',
        learn: '/business/docs/reports',
        cards: [
          { title: 'CPL vs target', body: 'Each campaign carries its target line and its distance from it.' },
          { title: 'Best and blended', body: 'The month’s best CPL and the honest average, side by side.' },
          { title: 'Meta and Google', body: 'One attribution view across both networks.' },
        ],
      },
      {
        id: 'desk',
        label: 'The desk',
        screen: '/business/screens/desk.webp',
        title: 'skyline.entrestate.com/home',
        alt: 'The home desk greeting the owner, with needs-your-attention items, lead tiles and a priorities list with Fix buttons',
        keyword: 'The day starts here.',
        caption: 'The home desk greets you with what needs attention first.',
        learn: '/business/docs/get-set-up',
        cards: [
          { title: 'Needs your attention', body: 'Unassigned leads and missing pages, surfaced on arrival.' },
          { title: 'Ask or command', body: 'Tell the AI what to do, from the desk.' },
          { title: 'Fix from the list', body: 'Each priority row carries its own Fix button.' },
        ],
      },
    ],
  },
  {
    id: 'setup',
    label: 'Setup',
    tools: [
      {
        id: 'integrations',
        label: 'Integrations',
        screen: '/business/screens/integrations.webp',
        title: 'skyline.entrestate.com/integrations',
        alt: 'Integrations showing two of seven systems connected, a critical pre-launch blocker and connection-state filters',
        keyword: 'Wired, honestly.',
        caption: 'Seven connections, states shown plainly — blockers named before launch.',
        learn: '/business/docs/get-set-up',
        cards: [
          { title: 'Go-live gate', body: 'What must clear before launch, listed first.' },
          { title: 'Critical, flagged', body: 'A missing AI provider is marked critical.' },
          { title: 'Filter by state', body: 'Connected, partial, disconnected — one row of filters.' },
        ],
      },
    ],
  },
]

/* Flat list so every screenshot stays mounted and can crossfade. */
const ALL_TOOLS: Tool[] = GROUPS.flatMap((g) => g.tools)

export function ProductExplorer() {
  const [activeGroupId, setActiveGroupId] = useState<string>(GROUPS[0].id)
  const [activeToolId, setActiveToolId] = useState<string>(GROUPS[0].tools[0].id)

  const activeGroup = GROUPS.find((g) => g.id === activeGroupId) ?? GROUPS[0]
  const activeTool = activeGroup.tools.find((t) => t.id === activeToolId) ?? activeGroup.tools[0]

  /* Switching group always lands on that group's first tool — the chips row
     resets so the reader never faces a stale selection. */
  function selectGroup(group: Group) {
    setActiveGroupId(group.id)
    setActiveToolId(group.tools[0].id)
  }

  /* Roving tabindex + arrow keys on the group row, per the tabs pattern.
     Focus is moved by querying the tablist itself so no refs are needed. */
  function onGroupKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const idx = GROUPS.findIndex((g) => g.id === activeGroupId)
    let next: number
    if (e.key === 'ArrowRight') next = (idx + 1) % GROUPS.length
    else if (e.key === 'ArrowLeft') next = (idx - 1 + GROUPS.length) % GROUPS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = GROUPS.length - 1
    else return
    e.preventDefault()
    selectGroup(GROUPS[next])
    const tabs = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    tabs[next]?.focus()
  }

  const scrollRow =
    '-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

  return (
    <div className="rounded-2xl bg-[#0A0E14] p-4 ring-1 ring-white/[0.06] sm:p-6 lg:p-8">
      {/* Level one — the product's own grouping. */}
      <div
        role="tablist"
        aria-label="Parts of the product"
        onKeyDown={onGroupKeyDown}
        className={scrollRow}
      >
        {GROUPS.map((group) => {
          const isActive = group.id === activeGroupId
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              id={`explorer-group-${group.id}`}
              aria-selected={isActive}
              aria-controls={`explorer-panel-${group.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectGroup(group)}
              className={`shrink-0 rounded-full px-4 py-2 text-[0.8125rem] font-medium transition ${
                isActive
                  ? 'bg-white/[0.08] text-white ring-1 ring-[#3B82F6]/40'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {group.label}
            </button>
          )
        })}
      </div>

      {/* Level two — the tools inside the active group. Plain toggles, not
         tabs: the arrow-key contract lives on the group row above. */}
      <div aria-label={`Tools in ${activeGroup.label}`} className={`mt-2 ${scrollRow}`}>
        {activeGroup.tools.map((tool) => {
          const isActive = tool.id === activeTool.id
          return (
            <button
              key={tool.id}
              type="button"
              id={`explorer-tool-${tool.id}`}
              aria-pressed={isActive}
              onClick={() => setActiveToolId(tool.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[0.8125rem] transition ${
                isActive ? 'bg-white/[0.06] text-white' : 'text-[#7C8B9D] hover:text-white'
              }`}
            >
              {tool.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`explorer-panel-${activeGroup.id}`}
        aria-labelledby={`explorer-group-${activeGroup.id}`}
        className="mt-5"
      >
        <div className="grid items-center gap-6 lg:grid-cols-[7fr_5fr] lg:gap-10">
          <Browser title={activeTool.title}>
            {/* All shots stay mounted and crossfade on switch — the frame
               holds still, only the screen changes, like flipping app tabs. */}
            <div className="relative aspect-[1600/1000] bg-[#07090C]">
              {ALL_TOOLS.map((tool) => (
                <img
                  key={tool.id}
                  src={tool.screen}
                  alt={tool.alt}
                  loading="lazy"
                  aria-hidden={tool.id !== activeTool.id}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out ${
                    tool.id === activeTool.id ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
            </div>
          </Browser>

          <div className="min-w-0">
            <h3 className="text-[1.75rem] font-semibold leading-[1.08] tracking-[-0.02em] text-white sm:text-[2.1rem]">
              {activeTool.keyword}
            </h3>
            <p className="mt-3 max-w-[38ch] text-[1rem] leading-[1.55] text-[#94A3B8]">
              {activeTool.caption}
            </p>
            {activeTool.learn ? <LearnMore href={activeTool.learn} /> : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {activeTool.cards.map((card) => (
            <div key={card.title} className="rounded-xl bg-[#0F131A] p-4 ring-1 ring-white/[0.06]">
              <div className="text-[0.875rem] font-semibold tracking-[-0.01em] text-white">{card.title}</div>
              <p className="mt-1.5 text-[0.8125rem] leading-[1.5] text-[#94A3B8]">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Drop-in section: heading + the explorer, on the standard column. */
export function ExplorerSection() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Inside the product"
        title="One product. Every part visible."
        lede={
          <p className="text-[1.0625rem] leading-[1.6] text-[#94A3B8]">
            Twenty-two screens of the live system — pick a part.
          </p>
        }
      />
      <div className="mt-8">
        <ProductExplorer />
      </div>
    </Section>
  )
}
