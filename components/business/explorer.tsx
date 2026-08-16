'use client'

/**
 * ProductExplorer — the Workspace-style part-tabs section. One tab per part
 * of the product, each tab a REAL capture of the live demo workspace
 * (skyline.entrestate.com). The screenshot carries the meaning; the copy
 * only names what is already visible in it.
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

interface Part {
  id: string
  label: string
  /** File under /business/screens/ — a real product capture, not a mockup. */
  shot: string
  /** Address shown in the Browser chrome. */
  title: string
  alt: string
  keyword: string
  sub: string
  /** The one door deeper — a guide under /business/docs. */
  href: string
  cards: [MicroCard, MicroCard, MicroCard]
}

/* Every claim below is visible in its screenshot. Nothing is promised that
   the shot does not show. */
const PARTS: Part[] = [
  {
    id: 'crm',
    label: 'CRM',
    shot: '/business/screens/crm-leads.png',
    title: 'skyline.entrestate.com/crm',
    alt: 'The CRM command centre listing leads by stage, temperature and budget, with a no-owner warning on top',
    keyword: 'The first hour.',
    sub: 'Every lead lands owned, ranked, and one tap from WhatsApp.',
    href: '/business/docs/crm-day',
    cards: [
      { title: 'No lead unowned', body: 'Leads with no owner get flagged for assignment.' },
      { title: 'Ranked, worst first', body: 'Rank by value, worst first — the desk’s own sort.' },
      { title: 'Call or WhatsApp', body: 'Every lead row carries call and WhatsApp buttons.' },
    ],
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    shot: '/business/screens/pipeline.png',
    title: 'skyline.entrestate.com/crm/pipeline',
    alt: 'The sales pipeline by stage, each stage showing its lead count, AED value and the conversion rate',
    keyword: 'Every stage, priced.',
    sub: 'Each stage carries its leads and their AED value, new to closed.',
    href: '/business/docs/lead-flow',
    cards: [
      { title: 'AED per stage', body: 'Every stage shows its leads and pipeline value.' },
      { title: 'Conversion on screen', body: 'Closed over total — the rate stays in view.' },
      { title: 'Stuck stages flagged', body: 'The desk says when a stage stops moving.' },
    ],
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    shot: '/business/screens/campaigns.png',
    title: 'skyline.entrestate.com/ads',
    alt: 'The Meta campaign desk, dark until Meta is connected, with the docked expert alongside',
    keyword: 'Ads with brakes.',
    sub: 'The campaign desk stays dark until you connect Meta. Then it runs.',
    href: '/business/docs/spend-rules',
    cards: [
      { title: 'Off until connected', body: 'No Meta connection, no spend — the desk says so.' },
      { title: 'One-button launch', body: 'New Campaign opens the wizard from the desk.' },
      { title: 'An expert docked', body: 'Ask what’s driving results, in plain words.' },
    ],
  },
  {
    id: 'launch',
    label: 'Launch',
    shot: '/business/screens/launch.png',
    title: 'skyline.entrestate.com/ads/launch',
    alt: 'The four-step campaign launch wizard with objective tiles and a live ad preview panel',
    keyword: 'Four steps to live.',
    sub: 'Campaign, targeting, creative, launch — the ad previewed before anything moves.',
    href: '/business/docs/launch-a-campaign',
    cards: [
      { title: 'Pick the objective', body: 'Meta Lead, WhatsApp messages, phone calls, landing traffic.' },
      { title: 'Preview before spend', body: 'See the ad in Feed and Story first.' },
      { title: 'Readiness spelled out', body: 'Ready, worth a look, blocking — the wizard counts.' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    shot: '/business/screens/inventory.png',
    title: 'skyline.entrestate.com/inventory',
    alt: 'Inventory grouped by developer, each row carrying project counts, readiness scores and live pages',
    keyword: 'Know your stock.',
    sub: '621 units across 21 developers, each scored for ad readiness.',
    href: '/business/docs/inventory',
    cards: [
      { title: 'Grouped by developer', body: 'Every project sits under its developer, counted.' },
      { title: 'Ready or not', body: 'Each developer carries an average readiness score.' },
      { title: 'Search everything', body: 'Find stock by name, developer, or area.' },
    ],
  },
  {
    id: 'audiences',
    label: 'Audiences',
    shot: '/business/screens/audiences.png',
    title: 'skyline.entrestate.com/ads/audiences',
    alt: 'The audience builder with special buyer lists, CRM audiences, lookalike uploads and the hashing note',
    keyword: 'Buyers, in plain words.',
    sub: 'Describe the buyer; the desk builds the audience and hashes the list.',
    href: '/business/docs/audiences',
    cards: [
      { title: 'Special buyers list', body: 'Doctors, CEOs, Golden Visa seekers — combine three.' },
      { title: 'Your leads, reused', body: 'Rated CRM leads become audiences and lookalikes.' },
      { title: 'Hashed before Meta', body: 'Lists are hashed before they ever reach Meta.' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    shot: '/business/screens/finance.png',
    title: 'skyline.entrestate.com/finance',
    alt: 'Company finance with commission tiles, expense categories, payouts and the expense ledger',
    keyword: 'The books balance.',
    sub: 'Commission in, expenses out, net position on one screen.',
    href: '/business/docs/reports',
    cards: [
      { title: 'Commission tracked', body: 'Approved deals in, outstanding owed to agents out.' },
      { title: 'Every cost filed', body: 'Ads, salaries, transport, referrals — each its column.' },
      { title: 'A written ledger', body: 'Every expense lands as an entry with status.' },
    ],
  },
]

export function ProductExplorer() {
  const [activeId, setActiveId] = useState<string>('crm')
  const active = PARTS.find((p) => p.id === activeId) ?? PARTS[0]

  /* Roving tabindex + arrow keys, per the tabs pattern. Focus is moved by
     querying the tablist itself so no refs are needed. */
  function onTablistKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const idx = PARTS.findIndex((p) => p.id === activeId)
    let next: number
    if (e.key === 'ArrowRight') next = (idx + 1) % PARTS.length
    else if (e.key === 'ArrowLeft') next = (idx - 1 + PARTS.length) % PARTS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = PARTS.length - 1
    else return
    e.preventDefault()
    const part = PARTS[next]
    setActiveId(part.id)
    const tabs = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    tabs[next]?.focus()
  }

  return (
    <div className="rounded-2xl bg-[#0A0E14] p-4 ring-1 ring-white/[0.06] sm:p-6 lg:p-8">
      <div
        role="tablist"
        aria-label="Parts of the product"
        onKeyDown={onTablistKeyDown}
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PARTS.map((part) => {
          const isActive = part.id === activeId
          return (
            <button
              key={part.id}
              type="button"
              role="tab"
              id={`explorer-tab-${part.id}`}
              aria-selected={isActive}
              aria-controls={`explorer-panel-${part.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveId(part.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[0.8125rem] font-medium transition ${
                isActive
                  ? 'bg-white/[0.08] text-white ring-1 ring-[#3B82F6]/40'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {part.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`explorer-panel-${active.id}`}
        aria-labelledby={`explorer-tab-${active.id}`}
        className="mt-5"
      >
        <div className="grid items-center gap-6 lg:grid-cols-[7fr_5fr] lg:gap-10">
          <Browser title={active.title}>
            {/* All shots stay mounted and crossfade on switch — the frame
               holds still, only the screen changes, like flipping app tabs. */}
            <div className="relative aspect-[1600/1000] bg-[#07090C]">
              {PARTS.map((part) => (
                <img
                  key={part.id}
                  src={part.shot}
                  alt={part.alt}
                  loading="lazy"
                  aria-hidden={part.id !== active.id}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out ${
                    part.id === active.id ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
            </div>
          </Browser>

          <div className="min-w-0">
            <h3 className="text-[1.75rem] font-semibold leading-[1.08] tracking-[-0.02em] text-white sm:text-[2.1rem]">
              {active.keyword}
            </h3>
            <p className="mt-3 max-w-[38ch] text-[1rem] leading-[1.55] text-[#94A3B8]">{active.sub}</p>
            <LearnMore href={active.href} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {active.cards.map((card) => (
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
      <SectionHeading eyebrow="Inside the product" title="One product. Every part visible." />
      <div className="mt-8">
        <ProductExplorer />
      </div>
    </Section>
  )
}
