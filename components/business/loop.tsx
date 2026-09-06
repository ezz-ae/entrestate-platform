/**
 * The platform loop — listing → landing → ads → lead → learning → targeting.
 *
 * This is the system's heartbeat. Six stages on a connected rail; the
 * connector after stage 06 curves back to 01, because the loop-back IS the
 * product: closed deals teach the next campaign's targeting. Everything else
 * on the page is a longer way of saying this diagram.
 *
 * WHY THERE IS NO SCREENSHOT IN THESE CARDS ANY MORE. Each card used to hold
 * a real capture zoomed 250–313% and pushed by a hardcoded percentage offset,
 * so the 16:11 window showed one "readable slab" of it. Those offsets were
 * measured against the lg row, where a card is a sixth of the page. On a
 * phone the card is the full column, the same zoom lands somewhere else
 * entirely, and the slab that showed was whatever happened to be there: half
 * a table cut mid-column, a paused campaign, an amber warning about a seed
 * too small for a lookalike, and real developers' project names. The owner's
 * rule for crops — "make the data good: not one lead in a campaign, nothing
 * with a warning, no badly written campaign name" — cannot be kept by a
 * window sliding over a screenshot, because nobody chose what is inside it.
 *
 * So a stage card now carries its glyph, its name, its line, and the measure
 * that stage actually applies, at one size on every screen. The product's
 * screens are shown where a reader can read them: the crops below, and the
 * full-width captures with captions on the product pages.
 *
 * Server component on purpose — the loop is static, nothing here needs state.
 */
import { Fragment } from 'react'
import { Section, SectionHeading } from '@/components/business/ui'
import { Glyph, type GlyphName } from '@/components/business/visuals'

type Stage = {
  n: string
  name: string
  line: string
  icon: GlyphName
  /** The rule this stage applies, in the product's own terms. */
  measure: string
}

const STAGES: Stage[] = [
  {
    n: '01',
    name: 'Listing',
    line: 'Stock scored and fit to advertise.',
    icon: 'inventory',
    measure: 'Ad readiness out of 100 · ad-ready starts at 70',
  },
  {
    n: '02',
    name: 'Landing',
    line: 'Every listing gets a page that converts.',
    icon: 'page',
    measure: 'A page below the gate cannot carry a campaign',
  },
  {
    n: '03',
    name: 'Ads',
    line: 'Campaigns with caps, launched paused.',
    icon: 'ads',
    measure: 'A daily cap, and a person switches it live',
  },
  {
    n: '04',
    name: 'Lead',
    line: 'Owned on arrival, and on a clock.',
    icon: 'lead',
    measure: 'An owner, a language tag, a follow-up time',
  },
  {
    n: '05',
    name: 'Learning',
    line: 'Every rating teaches what to buy.',
    icon: 'gauge',
    measure: 'Rated 6+ becomes a sellable audience',
  },
  {
    n: '06',
    name: 'Targeting',
    line: 'Audiences from real buyers, not guesses.',
    icon: 'target',
    measure: 'Language and behaviour — never nationality',
  },
]

/**
 * The forward arrow between stages. One element, two orientations: down on
 * the stacked mobile rail, right on the lg row. Blue at 40% — the forward
 * path is routine; only the return earns the accent.
 */
function Connector() {
  return (
    <div
      aria-hidden
      className="mr-5 flex items-center justify-center py-1.5 lg:mr-0 lg:w-5 lg:shrink-0 lg:py-0"
    >
      <svg className="h-5 w-3 lg:hidden" viewBox="0 0 12 20" fill="none">
        <path d="M6 0v12" stroke="var(--brand)" strokeOpacity="0.4" strokeWidth="1.5" />
        <path
          d="M2 12l4 6 4-6"
          stroke="var(--brand)"
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg className="hidden h-3 w-5 lg:block" viewBox="0 0 20 12" fill="none">
        <path d="M0 6h12" stroke="var(--brand)" strokeOpacity="0.4" strokeWidth="1.5" />
        <path
          d="M12 2l6 4-6 4"
          stroke="var(--brand)"
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export function PlatformLoop() {
  return (
    <div>
      <div className="relative">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          {STAGES.map((s, i) => (
            <Fragment key={s.n}>
              {i > 0 ? <Connector /> : null}
              {/* mr-5 opens a right gutter on mobile for the green return rail. */}
              <article className="mr-5 flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-4 shadow-(--shadow-card) lg:mr-0 lg:flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand">
                    <Glyph name={s.icon} className="h-4.5 w-4.5" />
                  </span>
                  <span className="font-mono text-[0.75rem] tabular-nums text-ink-faint" dir="ltr">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-3 text-[0.9375rem] font-semibold leading-snug text-ink">{s.name}</h3>
                <p className="mt-1.5 text-[0.8125rem] leading-[1.55] text-ink-muted">{s.line}</p>
                <p className="mt-3 border-t border-line pt-2.5 text-[0.75rem] leading-[1.5] text-ink-faint">
                  {s.measure}
                </p>
              </article>
            </Fragment>
          ))}
        </div>

        {/* Mobile return: 06 climbs the right gutter back to 01. */}
        <div
          aria-hidden
          className="absolute bottom-16 right-0 top-16 w-4 rounded-r-xl border-y border-r border-[#34D399]/40 lg:hidden"
        />
        <svg
          aria-hidden
          className="absolute right-3.5 top-16 h-3 w-2 -translate-y-1/2 lg:hidden"
          viewBox="0 0 8 12"
          fill="none"
        >
          <path
            d="M7 1 1 6l6 5"
            stroke="#34D399"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Mobile label, beside where the return rail leaves stage 06. */}
      <div className="mt-2 flex justify-end pr-6 lg:hidden">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#34D399]">
          learning feeds back
        </span>
      </div>

      {/* lg return: down from 06, across, up into 01 — drawn with borders so
         it tracks the fluid card widths. The x offsets are the centre of the
         first/last of six flex-1 cards after the five 1.25rem connectors. */}
      <div aria-hidden className="relative hidden h-14 lg:block">
        <div className="absolute bottom-4 left-[calc((100%-6.25rem)/12)] right-[calc((100%-6.25rem)/12)] top-1.5 rounded-b-2xl border-x border-b border-[#34D399]/40" />
        <svg
          className="absolute left-[calc((100%-6.25rem)/12)] top-0 h-2 w-3 -translate-x-1/2"
          viewBox="0 0 12 8"
          fill="none"
        >
          <path
            d="M1 7 6 1l5 6"
            stroke="#34D399"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-4 flex translate-y-1/2 justify-center">
          {/* Chip background masks the line it sits on — canvas colour. */}
          <span className="bg-app px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#34D399]">
            learning feeds back
          </span>
        </div>
      </div>
    </div>
  )
}

export function LoopSection() {
  return (
    <Section className="pb-20 lg:pb-28">
      <SectionHeading eyebrow="The loop" title="One loop, six turns." />
      <div className="mt-10 lg:mt-12">
        <PlatformLoop />
      </div>
    </Section>
  )
}
