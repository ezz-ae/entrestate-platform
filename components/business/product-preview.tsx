'use client'

/**
 * WHAT EACH PRODUCT LOOKS LIKE, IN THE MENU.
 *
 * A products menu that lists five names and five sentences asks the reader to
 * imagine five systems. The panel beside the list shows the thing instead — a
 * conversation, a campaign card, a page with its form — so the difference
 * between the products is visible before anybody clicks.
 *
 * Two rules, both load-bearing:
 *
 *   1. NO INVENTED PERFORMANCE. Not one figure here is a result: no cost per
 *      lead, no conversion rate, no revenue. This site is read by people
 *      deciding whether to trust the numbers the product will later show them,
 *      and a plausible number in a navigation menu is the cheapest possible way
 *      to lose that. The previews show STRUCTURE — stages, states, controls —
 *      which is what actually differs between the products.
 *   2. NO IMAGES. Every preview is markup, so it costs nothing to load, stays
 *      sharp at any density, and cannot rot into a screenshot of a screen that
 *      no longer exists.
 *
 * The Leadformer conversation is the one taken verbatim from
 * app/business/leadformer/page.tsx — the same words in both places, because two
 * versions of the same demo drift and then contradict each other.
 */

import type { PreviewKind } from '@/lib/business/nav'

/** Small caps label used above every preview block. */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">{children}</div>
  )
}

/** A neutral placeholder bar — structure without a claim. */
function Bar({ w, dim = false }: { w: string; dim?: boolean }) {
  return (
    <span
      aria-hidden
      className={`block h-[6px] ${dim ? 'bg-surface-2' : 'bg-surface-3'}`}
      style={{ width: w }}
    />
  )
}

function Chip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.12em] ${
        accent ? 'bg-brand/15 text-brand' : 'bg-surface-2 text-ink-faint'
      }`}
    >
      {children}
    </span>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full border border-line bg-surface-2 p-4">{children}</div>
  )
}

/* ── Lead Machine — the path a lead takes, which is the product ──────────── */

function LeadMachine() {
  const stages = [
    { name: 'New', rows: 3 },
    { name: 'Contacted', rows: 2 },
    { name: 'Viewing', rows: 1 },
  ]
  return (
    <Frame>
      <Tag>Inbox → owner → stage</Tag>
      <div className="mt-3 flex gap-2">
        {stages.map((s, si) => (
          <div key={s.name} className="flex-1 border border-line bg-app/40 p-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] text-ink-muted">{s.name}</span>
              <span aria-hidden className="h-[5px] w-[5px] rounded-full bg-surface-3" />
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: s.rows }).map((_, i) => (
                <div key={i} className="border border-line bg-surface-2 p-1.5">
                  <Bar w={`${70 - i * 12}%`} />
                  <div className="mt-1.5 flex items-center gap-1">
                    <span
                      aria-hidden
                      className={`h-[10px] w-[10px] rounded-full ${
                        si === 0 && i === 0 ? 'bg-brand' : 'bg-surface-3'
                      }`}
                    />
                    <Bar w="40%" dim />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip accent>Owner assigned</Chip>
        <Chip>Duplicate checked</Chip>
        <Chip>First hour timer</Chip>
      </div>
    </Frame>
  )
}

/* ── Mega Brokerage — a public catalogue with the desk behind it ─────────── */

function MegaBrokerage() {
  return (
    <Frame>
      <Tag>One catalogue, two faces</Tag>
      <div className="mt-3 border border-line bg-app/40">
        <div className="flex items-center gap-2 border-b border-line px-2.5 py-2">
          <span aria-hidden className="h-[6px] w-[6px] rounded-[2px] bg-brand" />
          <Bar w="52px" />
          <div className="ml-auto flex gap-2">
            <Bar w="26px" dim />
            <Bar w="26px" dim />
            <Bar w="26px" dim />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 p-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border border-line">
              <div aria-hidden className="h-9 bg-surface-2" />
              <div className="space-y-1 p-1.5">
                <Bar w="80%" />
                <Bar w="55%" dim />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <Chip>Your brand</Chip>
        <Chip>A page per project</Chip>
        <Chip accent>Same stock as the desk</Chip>
      </div>
    </Frame>
  )
}

/* ── Landing Pages — the page, and the gate in front of it ───────────────── */

function LandingPages() {
  return (
    <Frame>
      <Tag>Page, form, launch gate</Tag>
      <div className="mt-3 flex gap-2.5">
        <div className="flex-1 border border-line bg-app/40 p-2.5">
          <div aria-hidden className="h-10 bg-surface-2" />
          <div className="mt-2 space-y-1.5">
            <Bar w="85%" />
            <Bar w="65%" dim />
            <Bar w="72%" dim />
          </div>
          <div className="mt-2.5 border border-brand/30 bg-brand/[0.07] p-2">
            <div className="space-y-1.5">
              <div className="h-[9px] bg-surface-2" />
              <div className="h-[9px] bg-surface-2" />
              <div className="h-[9px] w-1/2 bg-brand/50" />
            </div>
          </div>
        </div>
        <div className="w-[38%] space-y-1.5">
          {[
            ['Images', true],
            ['Price source', true],
            ['Permit number', false],
          ].map(([label, ok]) => (
            <div
              key={String(label)}
              className="flex items-center gap-1.5 border border-line bg-app/40 px-2 py-1.5"
            >
              <span
                aria-hidden
                className={`h-[6px] w-[6px] rounded-full ${ok ? 'bg-brand' : 'bg-surface-3'}`}
              />
              <span className="text-[10px] text-ink-faint">{label}</span>
            </div>
          ))}
          <div className="pt-0.5">
            <Chip>Draft until it passes</Chip>
          </div>
        </div>
      </div>
    </Frame>
  )
}

/* ── Meta for Realtors — the controls, not the results ───────────────────── */

function MetaForRealtors() {
  const placements = ['Feed', 'Reels', 'Stories', 'Search']
  return (
    <Frame>
      <Tag>Campaign, before it spends</Tag>
      <div className="mt-3 border border-line bg-app/40 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <Bar w="120px" />
            <Bar w="76px" dim />
          </div>
          <Chip>Paused</Chip>
        </div>
        <div className="mt-3 space-y-2">
          {placements.map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <span className="w-12 text-[10px] text-ink-faint">{p}</span>
              <span aria-hidden className="h-[5px] flex-1 bg-surface-2">
                <span
                  className={`block h-full ${i === 0 ? 'bg-brand' : 'bg-surface-3'}`}
                  style={{ width: ['62%', '44%', '30%', '18%'][i] }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <Chip accent>Daily ceiling set</Chip>
        <Chip>Starts paused</Chip>
        <Chip>Language, not nationality</Chip>
      </div>
    </Frame>
  )
}

/* ── Leadformer — the form that answers back ─────────────────────────────── */

function Leadformer() {
  // Verbatim from app/business/leadformer/page.tsx — one demo, one wording.
  const turns = [
    { from: 'agent', text: "Hi — I'm the form. What should I call you?" },
    { from: 'lead', text: 'Mohamed' },
    { from: 'agent', text: 'Nice to meet you, Mohamed. Buying to live in, or to invest?' },
    { from: 'lead', text: 'Investment — something with good yield' },
  ] as const
  return (
    <Frame>
      <Tag>A form that talks back</Tag>
      <div className="mt-3 space-y-2">
        {turns.map((t, i) => (
          <div key={i} className={`flex ${t.from === 'lead' ? 'justify-end' : 'justify-start'}`}>
            <span
              className={`max-w-[78%] px-3 py-2 text-[11.5px] leading-snug ${
                t.from === 'lead'
                  ? 'bg-brand/15 text-[#BFDBFE]'
                  : 'bg-surface-2 text-ink-muted'
              }`}
            >
              {t.text}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-line pt-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip accent>Intent: investor · yield-led</Chip>
          <Chip>Saeed takes over</Chip>
        </div>
      </div>
    </Frame>
  )
}

const PREVIEWS: Record<PreviewKind, () => React.JSX.Element> = {
  'lead-machine': LeadMachine,
  'mega-brokerage': MegaBrokerage,
  'landing-pages': LandingPages,
  'meta-for-realtors': MetaForRealtors,
  leadformer: Leadformer,
}

export function ProductPreview({ kind }: { kind: PreviewKind }) {
  const Body = PREVIEWS[kind]
  return <Body />
}
