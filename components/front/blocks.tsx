/**
 * The GENERIC blocks a front-page layout can insert between the page's real
 * sections — heading, text, stats, CTA, FAQ. Server-rendered, no client JS.
 *
 * Every color here is an fp-* utility (globals.css) driven by the layout's
 * palette variables, so an inserted block always matches whatever palette
 * the page chose — including the default, where the variables resolve to the
 * shipped design's exact hexes.
 *
 * An empty block renders NOTHING. A block whose fields were never filled
 * must not paint an empty band across the public site.
 */
import Link from 'next/link'
import type { FrontItem } from '@/lib/freehold/front-layout'

const has = (d: Record<string, string>, ...keys: string[]) => keys.some((k) => (d[k] ?? '').trim())

function Shell({ tone, children }: { tone: string; children: React.ReactNode }) {
  const dark = tone !== 'light'
  return (
    <section className={`relative py-16 md:py-20 ${dark ? 'fp-dark-bg text-white' : 'fp-cream-bg text-foreground'}`}>
      <div className="container relative z-10">{children}</div>
    </section>
  )
}

function HeadingBlock({ d }: { d: Record<string, string> }) {
  if (!has(d, 'eyebrow', 'title', 'subtitle')) return null
  const dark = d.tone !== 'light'
  return (
    <Shell tone={d.tone ?? 'dark'}>
      <div className="mx-auto max-w-3xl text-center">
        {d.eyebrow && <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] fp-accent">{d.eyebrow}</p>}
        {d.title && <h2 className="font-serif text-3xl font-bold leading-[1.06] md:text-5xl">{d.title}</h2>}
        {d.subtitle && (
          <p className={`mx-auto mt-5 max-w-xl text-base leading-relaxed ${dark ? 'text-white/45' : 'text-foreground/55'}`}>{d.subtitle}</p>
        )}
      </div>
    </Shell>
  )
}

function TextBlock({ d }: { d: Record<string, string> }) {
  if (!has(d, 'title', 'body')) return null
  const dark = d.tone !== 'light'
  return (
    <Shell tone={d.tone ?? 'light'}>
      <div className="mx-auto max-w-3xl">
        {d.title && <h2 className="font-serif text-2xl font-bold md:text-4xl">{d.title}</h2>}
        {d.body && (
          <p className={`mt-4 whitespace-pre-line text-[15px] leading-relaxed md:text-base ${dark ? 'text-white/50' : 'text-foreground/60'}`}>{d.body}</p>
        )}
      </div>
    </Shell>
  )
}

function StatsBlock({ d }: { d: Record<string, string> }) {
  const stats = [1, 2, 3, 4]
    .map((i) => ({ value: (d[`s${i}v`] ?? '').trim(), label: (d[`s${i}l`] ?? '').trim() }))
    .filter((s) => s.value)
  if (!stats.length) return null
  const dark = d.tone !== 'light'
  // Tailwind's compiler only sees literal class names — a computed
  // `lg:grid-cols-${n}` would silently ship no class at all.
  const cols = stats.length >= 4 ? 'lg:grid-cols-4' : stats.length === 3 ? 'lg:grid-cols-3' : ''
  return (
    <Shell tone={d.tone ?? 'dark'}>
      <div className={`grid gap-5 sm:grid-cols-2 ${cols}`}>
        {stats.map((s, i) => (
          <div
            key={i}
            className={`rounded-[24px] border p-7 text-center md:p-9 ${dark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-foreground/[0.07] bg-white/70'}`}
          >
            <span className="font-serif text-5xl font-bold md:text-6xl">{s.value}</span>
            {s.label && (
              <p className={`mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] ${dark ? 'text-white/40' : 'text-foreground/45'}`}>{s.label}</p>
            )}
          </div>
        ))}
      </div>
    </Shell>
  )
}

function CtaBlock({ d }: { d: Record<string, string> }) {
  if (!has(d, 'title', 'body', 'buttonLabel')) return null
  const dark = d.tone !== 'light'
  const buttons = [
    { label: (d.buttonLabel ?? '').trim(), href: (d.buttonHref ?? '').trim() || '/contact', primary: true },
    { label: (d.secondaryLabel ?? '').trim(), href: (d.secondaryHref ?? '').trim() || '/contact', primary: false },
  ].filter((b) => b.label)
  return (
    <Shell tone={d.tone ?? 'dark'}>
      <div className="mx-auto max-w-3xl text-center">
        {d.title && <h2 className="font-serif text-3xl font-bold leading-[1.05] md:text-5xl">{d.title}</h2>}
        {d.body && (
          <p className={`mx-auto mt-5 max-w-lg text-base leading-relaxed ${dark ? 'text-white/45' : 'text-foreground/55'}`}>{d.body}</p>
        )}
        {buttons.length > 0 && (
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {buttons.map((b) => (
              <Link
                key={b.label}
                href={b.href}
                className={
                  b.primary
                    ? 'inline-flex h-13 items-center gap-2 rounded-xl px-8 text-[11px] font-semibold uppercase tracking-[0.12em] fp-accent-bg text-foreground shadow-lg transition hover:brightness-105 sm:h-14'
                    : `inline-flex h-13 items-center gap-2 rounded-xl border px-8 text-[11px] font-semibold uppercase tracking-[0.12em] transition sm:h-14 ${dark ? 'border-white/15 text-white/70 hover:border-white/30 hover:text-white' : 'border-foreground/15 text-foreground/70 hover:border-foreground/30 hover:text-foreground'}`
                }
              >
                {b.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  )
}

function FaqBlock({ d }: { d: Record<string, string> }) {
  const pairs = [1, 2, 3, 4]
    .map((i) => ({ q: (d[`q${i}`] ?? '').trim(), a: (d[`a${i}`] ?? '').trim() }))
    .filter((p) => p.q && p.a)
  if (!pairs.length) return null
  const dark = d.tone === 'dark'
  return (
    <Shell tone={d.tone ?? 'light'}>
      <div className="mx-auto max-w-3xl">
        <div className="space-y-4">
          {pairs.map((p, i) => (
            <details
              key={i}
              className={`group rounded-2xl border p-6 ${dark ? 'border-white/[0.08] bg-white/[0.04]' : 'border-foreground/[0.07] bg-white'}`}
            >
              <summary className="cursor-pointer list-none font-serif text-lg font-semibold marker:hidden">
                {p.q}
              </summary>
              <p className={`mt-3 whitespace-pre-line text-[14px] leading-relaxed ${dark ? 'text-white/55' : 'text-foreground/60'}`}>{p.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Shell>
  )
}

/** One inserted block. Unknown types render nothing — the sanitizer should
 *  have dropped them, and the renderer leans the same closed direction. */
export function FrontGenericBlock({ item }: { item: FrontItem }) {
  const d = item.data ?? {}
  switch (item.type) {
    case 'heading': return <HeadingBlock d={d} />
    case 'text': return <TextBlock d={d} />
    case 'stats': return <StatsBlock d={d} />
    case 'cta': return <CtaBlock d={d} />
    case 'faq': return <FaqBlock d={d} />
    default: return null
  }
}
