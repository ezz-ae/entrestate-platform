/**
 * Content holders — the marketing layer's scan-first devices.
 *
 * The discipline: a scroller who reads only the Keywords must still get the
 * whole pitch. So the Keyword is huge, the sub is one line, everything deeper
 * lives behind a single LearnMore link into /business/docs. Holders compose
 * with visuals.tsx: a mini (in a Browser or Phone frame) sits beside the
 * Keyword via the `visual` slot.
 */

import Link from 'next/link'
import type { ReactNode } from 'react'

export type HolderTone = 'gold' | 'green' | 'blue' | 'plain'
export type HolderSize = 'xl' | 'lg'

/* Layered tinted washes at 4–7% opacity over #0B0E12 — the card feeling
   without a hard fill, so the minis inside keep their own contrast. */
const TONE_WASH: Record<HolderTone, string> = {
  gold: 'bg-[radial-gradient(ellipse_90%_70%_at_18%_0%,rgba(59,130,246,0.07),transparent_62%),radial-gradient(ellipse_70%_60%_at_100%_100%,rgba(59,130,246,0.04),transparent_60%)]',
  green:
    'bg-[radial-gradient(ellipse_90%_70%_at_18%_0%,rgba(29,168,90,0.07),transparent_62%),radial-gradient(ellipse_70%_60%_at_100%_100%,rgba(29,168,90,0.04),transparent_60%)]',
  blue: 'bg-[radial-gradient(ellipse_90%_70%_at_18%_0%,rgba(96,148,224,0.07),transparent_62%),radial-gradient(ellipse_70%_60%_at_100%_100%,rgba(96,148,224,0.04),transparent_60%)]',
  plain:
    'bg-[radial-gradient(ellipse_90%_70%_at_18%_0%,rgba(255,255,255,0.05),transparent_62%),radial-gradient(ellipse_70%_60%_at_100%_100%,rgba(255,255,255,0.03),transparent_60%)]',
}

const SIZE_PAD: Record<HolderSize, string> = {
  lg: 'p-8 lg:p-12',
  xl: 'p-8 sm:p-12 lg:p-16',
}

export function Holder({
  tone = 'plain',
  size = 'lg',
  visual,
  children,
  className = '',
}: {
  tone?: HolderTone
  size?: HolderSize
  /** A mini from visuals.tsx (usually inside Browser/Phone); renders beside the copy on lg, below it on mobile. */
  visual?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[28px] bg-[#0B0E12] ring-1 ring-white/[0.06] ${SIZE_PAD[size]} ${className}`}
    >
      <div aria-hidden className={`pointer-events-none absolute inset-0 ${TONE_WASH[tone]}`} />
      <div className="relative">
        {visual ? (
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="min-w-0">{children}</div>
            <div className="min-w-0">{visual}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

/**
 * The eye-catch. One to three words that carry the meaning on their own —
 * the sub and the mini only confirm what the Keyword already said.
 */
export function Keyword({
  children,
  size = 'lg',
  as: Tag = 'h2',
  className = '',
}: {
  children: ReactNode
  size?: HolderSize
  as?: 'h2' | 'h3' | 'p'
  className?: string
}) {
  const type =
    size === 'xl'
      ? 'text-[2.4rem] leading-[1.03] sm:text-[3rem] lg:text-[3.5rem]'
      : 'text-[2rem] leading-[1.05] sm:text-[2.4rem] lg:text-[2.75rem]'
  return (
    <Tag className={`font-semibold tracking-[-0.02em] text-white ${type} ${className}`}>{children}</Tag>
  )
}

/** One line under the Keyword. Fourteen words or fewer — the writer's law. */
export function KeywordSub({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`mt-3 max-w-[40ch] text-[1.0625rem] leading-[1.55] text-[#94A3B8] ${className}`}>
      {children}
    </p>
  )
}

/** 2-up / 3-up holder grids; stack to one column on mobile. */
export function HolderRow({
  cols = 2,
  children,
  className = '',
}: {
  cols?: 2 | 3
  children: ReactNode
  className?: string
}) {
  const map = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3' }
  return <div className={`grid grid-cols-1 gap-4 lg:gap-5 ${map[cols]} ${className}`}>{children}</div>
}

/**
 * The one door into the docs layer. At most one per holder — a holder that
 * needs two links is explaining, and explaining belongs in the guide.
 */
export function LearnMore({
  href,
  label = 'Learn how it works',
  className = '',
}: {
  href: string
  label?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`group mt-7 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.875rem] font-medium text-white ring-1 ring-white/[0.14] transition hover:bg-white/[0.04] hover:ring-white/[0.3] ${className}`}
    >
      {label}
      <span aria-hidden className="text-[#3B82F6] transition-transform duration-200 group-hover:translate-x-1">
        →
      </span>
    </Link>
  )
}

/**
 * The broker-to-owner artifact: the one-pager PDF, downloadable or sent
 * straight down a WhatsApp thread. Plain anchors, not Link — one is a file,
 * the other leaves the site.
 */
export function DownloadCard({
  title = 'Showing this to your owner?',
  lines = ['One page: the loop, the products, the guardrails.', 'Prints clean. Sends clean.'],
  href = '/business/entrestate-one-pager.pdf',
  shareText = 'Entrestate — the system a real-estate company runs on. One page: https://entrestate.com/business/entrestate-one-pager.pdf',
  className = '',
}: {
  title?: string
  /** Two short lines under the title. */
  lines?: string[]
  /** The PDF the Download button serves. */
  href?: string
  /** Plain text for the WhatsApp share; URL-encoded here, not by the caller. */
  shareText?: string
  className?: string
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[28px] bg-[#0B0E12] p-8 ring-1 ring-white/[0.06] lg:p-12 ${className}`}
    >
      <div aria-hidden className={`pointer-events-none absolute inset-0 ${TONE_WASH.gold}`} />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="font-sans font-semibold text-[1.55rem] leading-[1.2] tracking-[-0.015em] text-white sm:text-[1.9rem]">
            {title}
          </div>
          <ul className="mt-4 space-y-1.5">
            {lines.map((line) => (
              <li key={line} className="flex gap-3 text-[0.9375rem] leading-[1.6] text-[#94A3B8]">
                <span aria-hidden className="mt-[0.62em] h-px w-3 shrink-0 bg-[#3B82F6]/60" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <a
            href={href}
            download
            className="inline-flex items-center gap-2 rounded-full bg-[#3B82F6] px-6 py-3 text-[0.875rem] font-semibold text-black transition hover:bg-[#60A5FA]"
          >
            Download
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 4v11M7 11l5 5 5-5" />
              <path d="M5 20h14" />
            </svg>
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[0.875rem] font-semibold text-white ring-1 ring-white/20 transition hover:ring-white/40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3FD07F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.7-1.2A9 9 0 1012 3z" />
            </svg>
            Send it on WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
