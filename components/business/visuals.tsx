/**
 * The business site's furniture — the browser frame, the decision log, and
 * the reading path (bands, rails, tiles, chapters).
 *
 * WHAT USED TO BE HERE, AND WHY IT IS NOT. This file also held eight mock
 * screens — MiniCRM, MiniCampaigns, MiniInventory, MiniPage, MiniReport, the
 * Phone and Chat frames, and the HeroVisual collage that stacked two of them.
 * They were whole app screens redrawn at 8–10px inside a 3×6 cm browser
 * frame: a four-column pipeline, six unit cards, a five-column campaign
 * table. The owner, on exactly these: "screenshots of a whole screen in a
 * 3×6 cm frame — nothing is readable, and even if it were, what would he
 * read? The right thing is to cut PIECES and show them in our colours."
 *
 * So the product is now shown by components/business/crops.tsx — a fragment
 * of one real screen, at a size a person reads without leaning in — and by
 * the real captures under /public/business/screens, which are full width and
 * captioned where they appear. Nothing in between survives, and nothing here
 * draws a screen any more: a mock screen is a claim, and a claim too small
 * to read is one nobody can check.
 */

import Link from 'next/link'
import type { ReactNode } from 'react'

/* ── Device frames ──────────────────────────────────────────────────────── */

export function Browser({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl bg-surface ring-1 ring-line shadow-[0_32px_90px_-30px_rgba(0,0,0,0.85)] ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-3.5 py-2.5">
        <div className="flex shrink-0 gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]/70" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]/70" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]/70" />
        </div>
        <div className="mx-auto flex min-w-0 max-w-[280px] flex-1 items-center justify-center gap-1.5 rounded-md bg-surface-2 px-3 py-1 ring-1 ring-line">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" aria-hidden>
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 018 0v3" />
          </svg>
          <span className="truncate font-mono text-[10px] text-ink-faint" dir="ltr">
            {title}
          </span>
        </div>
        <div className="w-10 shrink-0" aria-hidden />
      </div>
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-white/[0.03] to-transparent"
        />
        {children}
      </div>
    </div>
  )
}

/* ── The Ledger's header ────────────────────────────────────────────────── */

function MiniHeader({ label, right }: { label: string; right?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-line px-3 py-2">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">{label}</span>
      {right ? (
        <span className="font-mono text-[9px] tabular-nums text-ink-faint" dir="ltr">
          {right}
        </span>
      ) : null}
    </div>
  )
}


/* ── Ledger ─────────────────────────────────────────────────────────────── */

export interface LedgerRow {
  time: string
  event: string
  amount?: string
}

export function Ledger({ rows, className = '' }: { rows: LedgerRow[]; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-lg bg-chrome ring-1 ring-line ${className}`}>
      <MiniHeader label="Decision log" right="written before spend" />
      <div className="divide-y divide-line" dir="ltr">
        {rows.map((r, i) => (
          <div key={i} className="flex items-baseline gap-3 px-3.5 py-2 font-mono">
            <span className="shrink-0 text-[9px] tabular-nums text-[#565C64]">{r.time}</span>
            <span className="min-w-0 flex-1 truncate text-[10px] text-ink-muted">{r.event}</span>
            {r.amount ? (
              <span className="shrink-0 text-[10px] tabular-nums text-brand">{r.amount}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Bands, rails, punches ──────────────────────────────────────────────── */

export function StatBand({
  items,
}: {
  items: Array<{ value: string; label: string; note?: string }>
}) {
  const cols =
    items.length === 4 ? 'lg:grid-cols-4' : items.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
  return (
    <div className="w-full border-y border-line">
      <div className={`mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-4 bg-surface-2 sm:grid-cols-2 ${cols}`}>
        {items.map((s) => (
          <div key={s.label} className="bg-app px-6 py-10 lg:px-10 lg:py-14">
            <div className="font-sans font-semibold text-[2.6rem] leading-none tracking-[-0.02em] text-ink sm:text-[3.2rem]" dir="ltr">
              {s.value}
            </div>
            <div className="mt-3.5 text-[0.875rem] font-medium text-ink">{s.label}</div>
            {s.note ? <div className="mt-1 text-[0.8125rem] text-ink-faint">{s.note}</div> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function StepRail({
  steps,
}: {
  steps: Array<{ n?: number; title: string; body: string }>
}) {
  const cols =
    steps.length === 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : steps.length === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-3'
  return (
    <ol className={`grid grid-cols-1 gap-4 bg-surface-2 ${cols}`}>
      {steps.map((s, i) => (
        <li key={s.title} className="bg-surface p-7">
          <div className="font-mono text-[0.9375rem] tabular-nums text-brand" dir="ltr">
            {String(s.n ?? i + 1).padStart(2, '0')}
          </div>
          <div className="mt-4 text-[0.9375rem] font-semibold text-ink">{s.title}</div>
          <p className="mt-2 text-[0.875rem] leading-[1.6] text-ink-muted">{s.body}</p>
        </li>
      ))}
    </ol>
  )
}

export function PunchCard({ title, body }: { title: string; body?: string }) {
  return (
    <div className="bg-surface p-7 rounded-2xl border border-line shadow-(--shadow-card)">
      <span aria-hidden className="block h-0.5 w-6 bg-brand" />
      <div className="mt-5 font-sans font-semibold text-[1.35rem] leading-[1.25] tracking-[-0.01em] text-ink">{title}</div>
      {body ? <p className="mt-2.5 text-[0.8125rem] leading-[1.6] text-ink-faint">{body}</p> : null}
    </div>
  )
}

export function PunchGrid({
  items,
  cols = 3,
}: {
  items: Array<{ title: string; body?: string }>
  cols?: 2 | 3 | 4
}) {
  const map = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }
  return (
    <div className={`grid grid-cols-1 gap-4 ${map[cols]}`}>
      {items.map((p) => (
        <PunchCard key={p.title} title={p.title} body={p.body} />
      ))}
    </div>
  )
}

/* ── Tiles ──────────────────────────────────────────────────────────────── */

export type GlyphName =
  | 'inventory'
  | 'ads'
  | 'lead'
  | 'chat'
  | 'page'
  | 'report'
  | 'shield'
  | 'switch'
  | 'ledger'
  | 'target'
  | 'gate'
  | 'lock'
  | 'team'
  | 'assistant'
  | 'flow'
  | 'gauge'
  | 'globe'
  | 'spend'
  | 'clock'
  | 'brand'

const GLYPH_PATHS: Record<GlyphName, ReactNode> = {
  inventory: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1" opacity="0.4" />
    </>
  ),
  ads: (
    <>
      <path d="M4 10v4l11 5V5L4 10z" />
      <path d="M18 9a5 5 0 010 6" />
      <path d="M7.5 15.5V19" />
    </>
  ),
  lead: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />,
  chat: (
    <>
      <path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.7-1.2A9 9 0 1012 3z" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2" />
    </>
  ),
  page: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 8.5h18M6.5 13h8M6.5 16h5" />
    </>
  ),
  report: <path d="M5 20v-8M10 20V6M15 20V9M20 20V4" />,
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  switch: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="4" />
      <circle cx="15.5" cy="12" r="2.5" />
    </>
  ),
  ledger: <path d="M4 6h16M4 12h16M4 18h10" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" />
    </>
  ),
  gate: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 12l2.2 2.2L16 9.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.5-3.2 2.6-5 5.5-5s5 1.8 5.5 5" />
      <circle cx="17" cy="8.5" r="2.3" />
      <path d="M16 14.3c2.5.2 4 1.8 4.5 4.5" />
    </>
  ),
  assistant: <path d="M12 4c.6 4.4 3.6 7.4 8 8-4.4.6-7.4 3.6-8 8-.6-4.4-3.6-7.4-8-8 4.4-.6 7.4-3.6 8-8z" />,
  flow: (
    <>
      <path d="M4 7h13M14 4l3 3-3 3" />
      <path d="M20 17H7M10 14l-3 3 3 3" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 17a8 8 0 0116 0" />
      <path d="M12 17l3.5-4.5" />
      <circle cx="12" cy="17" r="0.8" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.7 2.4 4 5.2 4 8.5s-1.3 6.1-4 8.5c-2.7-2.4-4-5.2-4-8.5s1.3-6.1 4-8.5z" />
    </>
  ),
  spend: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 15.5V8.5h3.5a2.3 2.3 0 010 4.6H9M9 15.5h6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  brand: <path d="M12 3l9 9-9 9-9-9 9-9z" />,
}

export function Glyph({ name, className = '' }: { name: GlyphName; className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {GLYPH_PATHS[name]}
    </svg>
  )
}

export function FeatureTile({
  icon,
  title,
  body,
  href,
}: {
  icon: GlyphName
  title: string
  body: string
  href?: string
}) {
  const inner = (
    <>
      <span className="text-brand">
        <Glyph name={icon} />
      </span>
      <div className="mt-5 text-[0.9375rem] font-semibold text-ink">{title}</div>
      <p className="mt-2 text-[0.875rem] leading-[1.6] text-ink-muted">{body}</p>
    </>
  )
  if (href)
    return (
      <Link
        href={href}
        className="group block bg-surface p-7 rounded-2xl border border-line shadow-(--shadow-card) transition hover:bg-surface-2"
      >
        {inner}
        <span className="mt-3 inline-block text-brand opacity-0 transition group-hover:opacity-100" aria-hidden>
          →
        </span>
      </Link>
    )
  return <div className="bg-surface p-7 rounded-2xl border border-line shadow-(--shadow-card)">{inner}</div>
}

export function TileGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const map = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }
  return <div className={`grid grid-cols-1 gap-4 ${map[cols]}`}>{children}</div>
}

/* ── Reading path ───────────────────────────────────────────────────────── */

export function Chapter({ n, total, label }: { n: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em]">
      <span className="tabular-nums text-brand" dir="ltr">
        {String(n).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
      <span aria-hidden className="h-px w-8 bg-surface-3" />
      <span className="text-ink-faint">{label}</span>
    </div>
  )
}

/** The full-width "read this next" card every page ends with. */
export function NextStep({
  href,
  label,
  note,
  progress,
}: {
  href: string
  label: string
  note: string
  /** e.g. "Chapter 3 of 7" */
  progress?: string
}) {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 pb-20 pt-6 lg:px-10 lg:pb-28">
      <Link
        href={href}
        className="group flex items-center justify-between gap-6 bg-surface px-7 py-9 rounded-2xl border border-line shadow-(--shadow-card) transition hover:bg-surface-2 sm:px-10 sm:py-11"
      >
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            {progress ? `Next · ${progress}` : 'Next'}
          </div>
          <div className="mt-2.5 font-sans font-semibold text-[1.55rem] leading-[1.15] tracking-[-0.015em] text-ink sm:text-[2rem]">
            {label}
          </div>
          <p className="mt-2 text-[0.875rem] leading-[1.6] text-ink-muted">{note}</p>
        </div>
        <span
          aria-hidden
          className="shrink-0 text-[2rem] leading-none text-brand transition-transform duration-200 group-hover:translate-x-2 sm:text-[2.6rem]"
        >
          →
        </span>
      </Link>
    </section>
  )
}


/** Full-bleed section wrapper: hairline top/bottom, faint gold radial glow. */
export function GlowBand({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative w-full border-y border-line ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_0%,rgba(59,130,246,0.06),transparent_70%)]"
      />
      <div className="relative mx-auto w-full max-w-[1180px] px-6 py-20 lg:px-10 lg:py-28">{children}</div>
    </div>
  )
}
