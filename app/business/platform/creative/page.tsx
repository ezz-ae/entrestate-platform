import type { Metadata } from 'next'
import { Section, Display, Lede, H2, P, Eyebrow, SpecTable } from '@/components/business/ui'
import {
  Browser,
  FeatureTile,
  TileGrid,
  Chapter,
  NextStep,
  StatBand,
  PunchGrid,
  GlowBand,
} from '@/components/business/visuals'
import { nextInTour } from '@/lib/business/nav'

export const metadata: Metadata = {
  title: 'Creative',
  description:
    'Every ad file drawn from the listing itself — feed, square and story, video and GIF. The machine writes wording; every figure is yours.',
  alternates: { canonical: '/business/platform/creative' },
}

/*
 * Creative ships no shared mini, so this page carries its own: the ad the
 * canvas engine composes — payment-plan layout, permit QR, variant rail.
 * Mock Dubai data inside a product frame, same rules as visuals.tsx.
 */
function MiniStudio() {
  return (
    <div className="bg-[#0A0D10]">
      <div className="flex items-baseline justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8A9099]">Ad Designer</span>
        <span className="font-mono text-[9px] tabular-nums text-[#6E747C]" dir="ltr">
          payBands · feed 4:5
        </span>
      </div>
      <div className="flex gap-3 p-3">
        {/* The composed ad: finance hook first, total price largest — the Dubai pattern. */}
        <div className="relative aspect-[4/5] min-w-0 flex-1 overflow-hidden rounded-md ring-1 ring-white/[0.08]">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#273B4E] via-[#16202A] to-[#0B1014]" />
          <div className="absolute inset-x-0 top-0 p-2.5">
            <div className="font-mono text-[6.5px] uppercase tracking-[0.16em] text-[#D4AF37]" dir="ltr">
              Creek Harbour · Emaar
            </div>
            <div className="mt-1 text-[11px] font-semibold leading-tight text-white">Waterfront 2 Bedroom</div>
          </div>
          <div className="absolute inset-x-0 bottom-0 space-y-1 p-2.5">
            <div className="rounded-[2px] bg-[#D4AF37] px-1.5 py-[3px] text-[7.5px] font-bold tracking-wide text-[#07090C]" dir="ltr">
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
                <div className="font-serif text-[17px] leading-none text-white" dir="ltr">
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
          <div className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#6E747C]">variants</div>
          <div className="relative h-[54px] overflow-hidden rounded-[3px] bg-gradient-to-b from-[#273B4E] to-[#10161C] ring-1 ring-[#D4AF37]/60">
            <div className="absolute inset-x-0 bottom-0 bg-[#D4AF37] px-1 py-[2px] text-[5.5px] font-bold text-[#07090C]" dir="ltr">
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
          <div className="mt-auto space-y-0.5 border-t border-white/[0.06] pt-1.5 font-mono text-[6.5px] leading-snug text-[#8A9099]">
            <div dir="ltr">8 layouts · 8 palettes</div>
            <div className="text-[#D4AF37]" dir="ltr">Arabic → flips RTL</div>
          </div>
        </div>
      </div>
      <div className="flex items-baseline justify-between border-t border-white/[0.06] px-3 py-2 font-mono text-[7.5px]">
        <span className="truncate text-[#6E747C]" dir="ltr">
          1080×1350 · 1080×1080 · 1080×1920
        </span>
        <span className="shrink-0 pl-2 text-[#D4AF37]" dir="ltr">
          ZIP · caption.txt
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
                is the file Meta runs.
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
        <TileGrid cols={3}>
          <FeatureTile
            icon="brand"
            title="Every shape Meta runs"
            body="Design once. Feed, square and story compose fresh — one ZIP, caption inside."
          />
          <FeatureTile
            icon="flow"
            title="Photos become video"
            body="Turn listing photos into a real MP4 reel — title card, offer card, your palette."
          />
          <FeatureTile
            icon="ads"
            title="Into the working ad set"
            body="Same audience, same lead form, same page. Only the picture is new."
          />
        </TileGrid>
      </Section>

      <Section className="mt-16 lg:mt-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <H2>No figure, no ad.</H2>
            <div className="mt-6 space-y-4">
              <P>
                The machine writes the ad&rsquo;s wording in English, العربية or Русский. It
                cannot return a price at all — the figure on the ad stays your typing.
              </P>
              <P>
                A payment-plan ad with a blank where the price belongs looks finished — which is
                exactly how it goes out. Those layouts stay locked until every figure is real.
              </P>
              <P>
                Write the headline in Arabic and the whole ad flips right-to-left. Same engine, no
                separate template.
              </P>
            </div>
          </div>
          <SpecTable
            caption="What each design demands"
            rows={[
              { k: 'Payment-plan ads', v: 'Headline, finance hook, total price, down payment % — locked until each is real.' },
              { k: 'Return ads', v: 'All of the above, plus the return figure.' },
              { k: 'Price-led ads', v: 'A price on the listing. No price, no price layout.' },
              { k: 'Yield angle', v: 'A yield figure on the listing.' },
              { k: 'Urgency angle', v: 'A handover date.' },
              { k: 'Golden Visa angle', v: 'Withheld. The listing has no eligibility field, and a price is not proof.' },
            ]}
          />
        </div>
      </Section>

      <div className="mt-16 lg:mt-24">
        <StatBand
          items={[
            { value: '3', label: 'shapes from one design', note: '1080×1350 · 1080×1080 · 1080×1920 — one ZIP, caption inside' },
            { value: '8', label: 'layouts per listing', note: 'three lead with the down payment, modelled on ads running in Dubai' },
            { value: '45', label: 'starting templates', note: '15 designs in English, العربية, Русский — rendered live, never screenshots' },
            { value: '2,000', label: 'impressions before judgement', note: 'a design is proven or poor only after a real run' },
          ]}
        />
      </div>

      <GlowBand className="mt-16 lg:mt-24">
        <Eyebrow className="mb-8">The rules</Eyebrow>
        <PunchGrid
          cols={4}
          items={[
            { title: 'Paused by default.', body: 'New ads never switch themselves on. Going live is your spending decision.' },
            { title: 'No duplicate ads.', body: 'An image already running cannot be picked again — frequency would only climb.' },
            { title: 'No race, no winner.', body: "A design spends one lead's worth and faces two contenders before any verdict." },
            { title: 'Worn out is not broken.', body: 'A tired ad with zero leads never worked. No second angle chases it.' },
          ]}
        />
      </GlowBand>

      <NextStep href={next.href} label={next.label} note={next.blurb} progress="Chapter 5 of 7" />
    </>
  )
}
