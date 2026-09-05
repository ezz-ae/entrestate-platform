/**
 * The docs layer — /business/docs. Help-center furniture, not marketing.
 *
 * The rules here are the opposite of the holders: no selling, no punches,
 * calm second person, numbered steps, and every page findable from the left
 * nav. The shell derives breadcrumb, sidebar and title from GUIDES in
 * nav.ts, so a guide can never disagree with the map that lists it.
 */

import Link from 'next/link'
import type { ReactNode } from 'react'
import { DOCS_CATEGORIES, DOCS_HOME, GUIDES, type DocsCategory, type GuideItem } from '@/lib/business/nav'

/**
 * Stable anchor id for a category section on the docs hub. The shell's
 * breadcrumb links to these, so the hub must use them as section ids.
 */
export function docsCategoryId(category: DocsCategory): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/* ── Shell ──────────────────────────────────────────────────────────────── */

export function DocsShell({
  href,
  title,
  children,
}: {
  /** The current guide's href from GUIDES — breadcrumb, nav highlight and title derive from it. */
  href: string
  /** Overrides the guide label as the article h1; rarely needed. */
  title?: string
  children: ReactNode
}) {
  const guide = GUIDES.find((g) => g.href === href)
  const heading = title ?? guide?.label ?? 'Learn'
  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 pb-20 pt-10 lg:px-10 lg:pb-28 lg:pt-14">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-ink-muted">
        <Link href={DOCS_HOME} className="transition hover:text-ink">
          Learn
        </Link>
        {guide ? (
          <>
            <span aria-hidden className="text-[#4A5058]">
              /
            </span>
            <Link href={`${DOCS_HOME}#${docsCategoryId(guide.category)}`} className="transition hover:text-ink">
              {guide.category}
            </Link>
            <span aria-hidden className="text-[#4A5058]">
              /
            </span>
            <span className="text-ink">{heading}</span>
          </>
        ) : null}
      </nav>
      <div className="mt-8 lg:mt-10 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <aside className="hidden lg:block">
          <nav aria-label="Guides" className="sticky top-24 space-y-7">
            {DOCS_CATEGORIES.map((category) => {
              const items = GUIDES.filter((g) => g.category === category)
              if (!items.length) return null
              return (
                <div key={category}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    {category}
                  </div>
                  <ul className="mt-2.5 space-y-0.5">
                    {items.map((g) => {
                      const current = g.href === href
                      return (
                        <li key={g.href}>
                          <Link
                            href={g.href}
                            aria-current={current ? 'page' : undefined}
                            className={`block border-l py-1.5 pl-4 text-[0.875rem] leading-snug transition ${
                              current
                                ? 'border-brand text-ink'
                                : 'border-line text-ink-muted hover:border-line hover:text-ink'
                            }`}
                          >
                            {g.label}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </nav>
        </aside>
        <article className="mt-2 min-w-0 max-w-[46rem] lg:mt-0">
          <h1 className="font-sans font-semibold text-[2rem] leading-[1.12] tracking-[-0.015em] text-ink sm:text-[2.5rem]">
            {heading}
          </h1>
          {children}
        </article>
      </div>
    </div>
  )
}

/* ── Article furniture ──────────────────────────────────────────────────── */

/** The line under the h1: which branch this guide belongs to, and how long it takes. */
export function ArticleMeta({ category, read }: { category: string; read: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
      <span className="text-ink-faint">{category}</span>
      <span aria-hidden className="h-px w-4 bg-surface-3" />
      <span>{read}</span>
    </div>
  )
}

/** In-page anchor list. Ids must match the `id` given to Step or any section. */
export function OnPage({ items }: { items: Array<{ id: string; label: string }> }) {
  return (
    <nav
      aria-label="On this page"
      className="mt-8 rounded-xl bg-surface-2 px-6 py-5 ring-1 ring-line"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">On this page</div>
      <ul className="mt-3 space-y-1.5">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className="text-[0.875rem] leading-snug text-ink-muted transition hover:text-ink"
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** A numbered step. Give it an `id` when OnPage should link to it. */
export function Step({
  n,
  title,
  id,
  children,
}: {
  n: number
  title: string
  id?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="grid scroll-mt-24 grid-cols-[2.5rem_1fr] gap-x-4 border-t border-line py-7 first:border-t-0 sm:gap-x-6"
    >
      <div className="font-mono text-[0.8125rem] tabular-nums text-brand" dir="ltr">
        {String(n).padStart(2, '0')}
      </div>
      <div className="min-w-0">
        <h2 className="text-[1.0625rem] font-semibold leading-snug text-ink">{title}</h2>
        <div className="mt-2.5 space-y-3 text-[0.9375rem] leading-[1.75] text-ink-muted">{children}</div>
      </div>
    </section>
  )
}

/** A calm callout for the one thing the reader should not miss. */
export function DocNote({ title = 'Note', children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="my-8 rounded-xl bg-surface-2 px-6 py-5 ring-1 ring-line">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand">{title}</div>
      <div className="mt-2 text-[0.9375rem] leading-[1.7] text-ink-muted">{children}</div>
    </aside>
  )
}

/** Question + short answer. Native details/summary — no script, no state. */
export function FAQItem({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group border-t border-line py-4 last:border-b">
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 text-[0.9375rem] font-medium text-ink [&::-webkit-details-marker]:hidden">
        {q}
        <span
          aria-hidden
          className="shrink-0 text-brand transition-transform duration-200 group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="mt-3 max-w-[60ch] text-[0.9375rem] leading-[1.7] text-ink-muted">{children}</div>
    </details>
  )
}

/* ── Guide cards ────────────────────────────────────────────────────────── */

export function GuideCard({
  guide,
  showCategory = false,
  className = '',
}: {
  guide: GuideItem
  showCategory?: boolean
  className?: string
}) {
  return (
    <Link
      href={guide.href}
      className={`group block rounded-2xl bg-surface-2 p-6 ring-1 ring-line transition hover:bg-surface-2 hover:ring-line ${className}`}
    >
      {showCategory ? (
        <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
          {guide.category}
        </div>
      ) : null}
      <div className="flex items-baseline justify-between gap-4">
        <div className="text-[1rem] font-semibold leading-snug text-ink">{guide.label}</div>
        <span aria-hidden className="shrink-0 text-brand opacity-0 transition group-hover:opacity-100">
          →
        </span>
      </div>
      <p className="mt-2 text-[0.875rem] leading-[1.6] text-ink-muted">{guide.blurb}</p>
    </Link>
  )
}

/** "Related guides" at the foot of an article. Unknown hrefs are dropped, not rendered broken. */
export function RelatedRow({ hrefs }: { hrefs: string[] }) {
  const items = hrefs
    .map((h) => GUIDES.find((g) => g.href === h))
    .filter((g): g is GuideItem => g !== undefined)
  if (!items.length) return null
  return (
    <div className="mt-14 border-t border-line pt-8">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Related guides</div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((g) => (
          <GuideCard key={g.href} guide={g} showCategory />
        ))}
      </div>
    </div>
  )
}
