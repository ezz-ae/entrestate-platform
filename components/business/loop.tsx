/**
 * The platform loop — listing → landing → ads → lead → learning → targeting.
 *
 * This is the system's heartbeat, in the client's own words. Six stages on a
 * connected rail; the connector after stage 06 curves back to 01, because the
 * loop-back IS the product: closed deals teach the next campaign's targeting.
 * Everything else on the page is a longer way of saying this diagram.
 *
 * Server component on purpose — the loop is static, nothing here needs state.
 */
import { Fragment } from 'react'
import { Section, SectionHeading } from '@/components/business/ui'

type Stage = {
  n: string
  name: string
  line: string
  shot: string
  alt: string
}

/* Real product captures. Each shot is the surface that runs its stage. */
const STAGES: Stage[] = [
  {
    n: '01',
    name: 'Listing',
    line: 'Stock scored and fit to advertise.',
    shot: '/business/screens/inventory.webp',
    alt: 'Inventory grouped by developer — projects, units, live pages and active campaigns counted.',
  },
  {
    n: '02',
    name: 'Landing',
    line: 'Every listing gets a page that converts.',
    shot: '/business/screens/landings.webp',
    alt: 'Landing pages tracked per property: live, pending, draft, missing.',
  },
  {
    n: '03',
    name: 'Ads',
    line: 'Campaigns with caps, launched paused.',
    shot: '/business/screens/campaigns.webp',
    alt: 'Meta campaigns screen with a new campaign ready to create.',
  },
  {
    n: '04',
    name: 'Lead',
    line: 'Answered fast, owned, in WhatsApp.',
    shot: '/business/screens/crm-leads.webp',
    alt: 'CRM command centre: nine leads across seven stages, hot leads flagged.',
  },
  {
    n: '05',
    name: 'Learning',
    line: 'Every rating teaches what to buy.',
    shot: '/business/screens/forms.webp',
    alt: 'Lead forms screen — the answers that grade every buyer.',
  },
  {
    n: '06',
    name: 'Targeting',
    line: 'Audiences from real buyers, not guesses.',
    shot: '/business/screens/audiences.webp',
    alt: 'Audience builder: special buyers, described buyers, CRM audiences, lookalikes.',
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
        <path d="M6 0v12" stroke="#3B82F6" strokeOpacity="0.4" strokeWidth="1.5" />
        <path
          d="M2 12l4 6 4-6"
          stroke="#3B82F6"
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg className="hidden h-3 w-5 lg:block" viewBox="0 0 20 12" fill="none">
        <path d="M0 6h12" stroke="#3B82F6" strokeOpacity="0.4" strokeWidth="1.5" />
        <path
          d="M12 2l6 4-6 4"
          stroke="#3B82F6"
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
              <article className="mr-5 min-w-0 bg-[#0F131A] outline outline-1 outline-white/[0.07] lg:mr-0 lg:flex-1">
                <div className="aspect-video overflow-hidden border-b border-white/[0.06] bg-[#07090C]">
                  {/* Oversized then clipped: shows the working surface, crops
                     the assistant panel — at card size only the tool reads. */}
                  <img
                    src={s.shot}
                    alt={s.alt}
                    loading="lazy"
                    className="h-full w-[135%] max-w-none object-cover object-left-top"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[0.75rem] tabular-nums text-[#3B82F6]" dir="ltr">
                      {s.n}
                    </span>
                    <h3 className="text-[0.9375rem] font-semibold leading-snug text-white">
                      {s.name}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[0.8125rem] leading-[1.55] text-[#94A3B8]">{s.line}</p>
                </div>
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
          <span className="bg-[#07090C] px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#34D399]">
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
