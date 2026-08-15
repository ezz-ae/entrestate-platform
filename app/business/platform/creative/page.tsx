import type { Metadata } from 'next'
import { Section, Display, Lede } from '@/components/business/ui'
import { Holder, Keyword, KeywordSub, HolderRow, LearnMore } from '@/components/business/holders'
import { Browser, Chapter, NextStep, StatBand } from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Creative',
  description:
    'Every ad file drawn from the listing itself — feed, square and story, video and GIF. The machine writes wording; every figure is yours.',
  alternates: { canonical: '/business/platform/creative' },
}

/*
 * Creative ships no shared mini, so this page carries its own: the ad the
 * studio composes — payment-plan layout, permit QR, variant rail.
 * Mock Dubai data inside a product frame, same rules as visuals.tsx.
 */
function MiniStudio() {
  return (
    <div className="bg-[#0B0F16]">
      <div className="flex items-baseline justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#7C8B9D]">Ad Designer</span>
        <span className="font-mono text-[9px] tabular-nums text-[#64748B]" dir="ltr">
          payment plan · feed 4:5
        </span>
      </div>
      <div className="flex gap-3 p-3">
        {/* The composed ad: finance hook first, total price largest — the Dubai pattern. */}
        <div className="relative aspect-[4/5] min-w-0 flex-1 overflow-hidden rounded-md ring-1 ring-white/[0.08]">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#273B4E] via-[#16202A] to-[#0B1014]" />
          <div className="absolute inset-x-0 top-0 p-2.5">
            <div className="font-mono text-[6.5px] uppercase tracking-[0.16em] text-[#3B82F6]" dir="ltr">
              Creek Harbour · Qamar Group
            </div>
            <div className="mt-1 text-[11px] font-semibold leading-tight text-white">Waterfront 2 Bedroom</div>
          </div>
          <div className="absolute inset-x-0 bottom-0 space-y-1 p-2.5">
            <div className="rounded-[2px] bg-[#3B82F6] px-1.5 py-[3px] text-[7.5px] font-bold tracking-wide text-[#07090C]" dir="ltr">
              20% DOWN PAYMENT
            </div>
            <div className="rounded-[2px] bg-black/50 px-1.5 py-[3px] font-mono text-[6.5px] text-[#D7DBDF] ring-1 ring-white/[0.08]" dir="ltr">
              80% on handover · Q4 2027
            </div>
            <div className="flex items-end justify-between pt-0.5">
              <div>
                <div className="font-mono text-[6px] uppercase tracking-[0.14em] text-white/50" dir="ltr">
                  from
                </div>
                <div className="font-sans font-semibold text-[17px] leading-none text-white" dir="ltr">
                  AED 1.9M
                </div>
              </div>
              <div>
                <div className="grid h-7 w-7 place-items-center rounded-[3px] bg-white">
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                    <g fill="#0B0E12">
                      <path fillRule="evenodd" d="M2 2h6v6H2zm1.5 1.5h3v3h-3z" />
                      <path fillRule="evenodd" d="M10 2h6v6h-6zm1.5 1.5h3v3h-3z" />
                      <path fillRule="evenodd" d="M2 10h6v6H2zm1.5 1.5h3v3h-3z" />
                      <path d="M10 10h2v2h-2zM13 10h3v2h-3zM10 13h2v3h-2zM13.5 13.5h2.5v2.5h-2.5z" />
                    </g>
                  </svg>
                </div>
                <div className="mt-0.5 text-center font-mono text-[5px] uppercase text-white/45">permit</div>
              </div>
            </div>
          </div>
        </div>
        {/* Variant rail: same listing, different layout and palette — one is Arabic. */}
        <div className="flex w-[96px] shrink-0 flex-col gap-1.5">
          <div className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#64748B]">variants</div>
          <div className="relative h-[54px] overflow-hidden rounded-[3px] bg-gradient-to-b from-[#273B4E] to-[#10161C] ring-1 ring-[#3B82F6]/60">
            <div className="absolute inset-x-0 bottom-0 bg-[#3B82F6] px-1 py-[2px] text-[5.5px] font-bold text-[#07090C]" dir="ltr">
              20% DOWN
            </div>
          </div>
          <div className="relative h-[54px] overflow-hidden rounded-[3px] bg-gradient-to-b from-[#40342A] to-[#14100C] ring-1 ring-white/[0.08]">
            <div className="absolute inset-x-0 bottom-0 bg-white/90 px-1 py-[2px] text-[5.5px] font-bold text-[#0B0E12]" dir="rtl">
              دفعة أولى ٢٠٪
            </div>
          </div>
          <div className="relative h-[54px] overflow-hidden rounded-[3px] bg-gradient-to-b from-[#2E3B33] to-[#0F1512] ring-1 ring-white/[0.08]">
            <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-[2px] font-mono text-[5px] text-white/75" dir="ltr">
              AED 1.9M
            </div>
          </div>
          <div className="mt-auto space-y-0.5 border-t border-white/[0.06] pt-1.5 font-mono text-[6.5px] leading-snug text-[#7C8B9D]">
            <div dir="ltr">8 layouts · 8 palettes</div>
            <div className="text-[#3B82F6]" dir="ltr">Arabic → flips RTL</div>
          </div>
        </div>
      </div>
      <div className="flex items-baseline justify-between border-t border-white/[0.06] px-3 py-2 font-mono text-[7.5px]">
        <span className="truncate text-[#64748B]" dir="ltr">
          feed · square · story
        </span>
        <span className="shrink-0 pl-2 text-[#3B82F6]" dir="ltr">
          one ZIP · captions in
        </span>
      </div>
    </div>
  )
}

export default function CreativePage() {
  // Every platform chapter has a successor in the tour, so the assertion is safe.
  const next = nextInTour('/business/platform/creative')!
  return (
    <>
      <Section className="pt-16 lg:pt-24">
        <Chapter n={4} total={7} label="Creative" />
        <div className="mt-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Display>Ads made from the listing.</Display>
            <div className="mt-6 max-w-[46ch]">
              <Lede>
                Price, payment plan, photos, permit — read off the listing. The file you download
                is the file that runs.
              </Lede>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[400px] lg:mx-0 lg:justify-self-end">
            <Browser title="app.yourbrokerage.ae/studio">
              <MiniStudio />
            </Browser>
          </div>
        </div>
      </Section>

      <Section className="mt-16 lg:mt-24">
        <HolderRow cols={3}>
          <Holder tone="plain">
            <Keyword>Every shape.</Keyword>
            <KeywordSub>Feed, square and story from one design — one ZIP, captions inside.</KeywordSub>
          </Holder>
          <Holder tone="blue">
            <Keyword>Photos to video.</Keyword>
            <KeywordSub>A real reel cut from listing photos — title card, offer card, your palette.</KeywordSub>
          </Holder>
          <Holder tone="green">
            <Keyword>Arabic flips it.</Keyword>
            <KeywordSub>Write the headline in Arabic and the whole ad turns right-to-left.</KeywordSub>
          </Holder>
        </HolderRow>
      </Section>

      <Section className="mt-6 lg:mt-8">
        <Holder tone="gold">
          <Keyword>No invented figures.</Keyword>
          <KeywordSub>The machine writes the wording. It cannot invent a price — figures stay yours.</KeywordSub>
          <LearnMore href="/business/docs/creative-studio" label="See the studio tools" />
        </Holder>
      </Section>

      <div className="mt-16 lg:mt-24">
        <StatBand
          items={[
            { value: '8', label: 'layouts per listing', note: 'three lead with the down payment — the Dubai pattern' },
            { value: '45', label: 'starting templates', note: 'in English, العربية, Русский' },
            { value: '3', label: 'shapes from one design', note: 'feed, square and story — one ZIP' },
          ]}
        />
      </div>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 5 of 7" />
    </>
  )
}
