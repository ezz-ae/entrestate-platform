'use client'

/**
 * The business site's own chrome.
 *
 * Deliberately separate from the product's marketing header: this site talks
 * to operators and owners about a system, not to buyers about apartments, and
 * sharing a navigation would confuse both audiences.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { NAV_GROUPS, PRODUCTS, PLATFORM, COMPANY, type NavItem } from '@/lib/business/nav'
import { ProductPreview } from './product-preview'

function Wordmark() {
  // The platform's mark, as it appears on the Terminal: three dots fading to
  // blue, then the lowercase name. Same family, same front door.
  return (
    <Link href="/business" className="group flex items-center gap-2.5" aria-label="Entrestate for Business">
      <span aria-hidden className="flex items-center gap-[3px]">
        <span className="h-[7px] w-[7px] rounded-[2px] bg-ink/" />
        <span className="h-[7px] w-[7px] rounded-[2px] bg-ink/" />
        <span className="h-[7px] w-[7px] rounded-[2px] bg-brand" />
      </span>
      <span className="font-sans text-[1.05rem] font-semibold leading-none tracking-[-0.01em] text-ink">
        entrestate
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint transition group-hover:text-brand">
        Business
      </span>
    </Link>
  )
}

/**
 * The products menu: the list on the left, the product itself on the right.
 *
 * Five names and five sentences ask the reader to imagine five systems, and a
 * reader who has to imagine usually leaves. The panel beside the list shows
 * what each one actually is — see components/business/product-preview.tsx for
 * what is and is not allowed to appear in there.
 *
 * The panel is anchored to the Products button, which sits left of centre, so
 * its width is clamped to the viewport: a fixed 54rem ran off the right edge
 * at 1280 and clipped the preview it exists to show.
 *
 * Pointer and keyboard select the same way: onMouseEnter and onFocus both set
 * the shown product, so tabbing through the list drives the panel exactly as
 * hovering does. The panel is aria-hidden — every word it contains is already
 * in the link the reader is on, and a screen reader should not have to walk
 * through decorative bars to reach the next product.
 */
function ProductsPanel({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.href ?? '')
  const shown = items.find((i) => i.href === active) ?? items[0]

  return (
    <div className="absolute left-0 top-full flex w-[46rem] max-w-[calc(100vw-3rem)] border border-line bg-surface shadow-2xl shadow-black/60">
      <div className="w-[18rem] shrink-0 border-r border-line p-2">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            onMouseEnter={() => setActive(i.href)}
            onFocus={() => setActive(i.href)}
            className={`block px-4 py-3 transition ${
              active === i.href ? 'bg-surface-2' : 'hover:bg-surface-2'
            }`}
          >
            <div className="text-[0.875rem] font-medium text-ink">{i.label}</div>
            <div className="mt-1 text-[0.8125rem] leading-snug text-ink-faint">{i.blurb}</div>
          </Link>
        ))}
      </div>
      <div aria-hidden className="flex flex-1 items-center p-5">
        {shown?.preview ? <ProductPreview kind={shown.preview} /> : null}
      </div>
    </div>
  )
}

export function BusinessHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState<string | null>(null)
  const [mobile, setMobile] = useState(false)

  // Route change closes everything — a menu left open across a navigation is
  // the most common way these headers feel broken.
  useEffect(() => {
    setOpen(null)
    setMobile(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-app/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-6 lg:px-10">
        <Wordmark />

        <nav className="hidden items-center gap-1 lg:flex" onMouseLeave={() => setOpen(null)}>
          {NAV_GROUPS.map((g) => (
            <div key={g.label} className="relative" onMouseEnter={() => setOpen(g.label)}>
              <button
                type="button"
                onClick={() => setOpen(open === g.label ? null : g.label)}
                aria-expanded={open === g.label}
                className={`px-4 py-2 text-[0.875rem] transition ${
                  open === g.label ? 'text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {g.label}
              </button>
              {open === g.label ? (
                g.label === 'Products' ? (
                  <ProductsPanel items={g.items} />
                ) : (
                  <div className="absolute left-0 top-full w-[26rem] border border-line bg-surface p-2 shadow-2xl shadow-black/60">
                    {g.items.map((i) => (
                      <Link
                        key={i.href}
                        href={i.href}
                        className="block px-4 py-3 transition hover:bg-surface-2"
                      >
                        <div className="text-[0.875rem] font-medium text-ink">{i.label}</div>
                        <div className="mt-1 text-[0.8125rem] leading-snug text-ink-faint">{i.blurb}</div>
                      </Link>
                    ))}
                  </div>
                )
              ) : null}
            </div>
          ))}
          {/* The Learn layer gets a direct door, help-center style — depth is
              one click away from anywhere, never buried in a dropdown. */}
          <Link
            href="/business/docs"
            onMouseEnter={() => setOpen(null)}
            className="px-4 py-2 text-[0.875rem] text-ink-muted transition hover:text-ink"
          >
            Learn
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/server"
            className="hidden text-[0.875rem] text-ink-muted transition hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-brand px-4 py-2 text-[0.8125rem] font-semibold text-brand-ink transition hover:bg-brand-bright"
          >
            Start a trial
          </Link>
          <button
            type="button"
            onClick={() => setMobile((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobile}
            className="p-2 text-ink lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {mobile ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {mobile ? (
        <div className="border-t border-line bg-surface lg:hidden">
          <div className="mx-auto max-h-[70vh] w-full max-w-[1180px] overflow-y-auto px-6 py-6">
            {NAV_GROUPS.map((g) => (
              <div key={g.label} className="mb-7">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                  {g.label}
                </div>
                <div className="space-y-1">
                  {g.items.map((i) => (
                    <Link key={i.href} href={i.href} className="block py-2 text-[0.9375rem] text-ink">
                      {i.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  )
}

export function BusinessFooter() {
  const cols: Array<{ label: string; items: typeof PRODUCTS }> = [
    { label: 'Products', items: PRODUCTS },
    { label: 'Platform', items: PLATFORM },
    {
      label: 'Company',
      items: [
        ...COMPANY,
        // The other half of the one-account bridge: the business footer names
        // the discovery side the same way the Terminal's footer names this
        // store. Footer-only — the header tour stays a tour of THIS site.
        // Never "free" (the owner's word ban) — named for what it gives.
        { href: 'https://terminal.entrestate.com', label: 'The Terminal', blurb: 'Market discovery, with every account.' },
      ],
    },
  ]
  return (
    <footer className="border-t border-line bg-app">
      <div className="mx-auto w-full max-w-[1180px] px-6 py-16 lg:px-10">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Wordmark />
            <p className="mt-4 max-w-[28ch] text-[0.8125rem] leading-relaxed text-ink-faint">
              Software for real-estate companies in the UAE. Built and run in Dubai.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.label}>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{c.label}</div>
              <ul className="mt-4 space-y-2.5">
                {c.items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} className="text-[0.875rem] text-ink-muted transition hover:text-ink">
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.8125rem] text-ink-faint">
            © {new Date().getFullYear()} Entrestate. Dubai, United Arab Emirates.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-[0.8125rem] text-ink-faint transition hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="text-[0.8125rem] text-ink-faint transition hover:text-ink">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
