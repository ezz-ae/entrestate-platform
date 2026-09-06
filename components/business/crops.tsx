/**
 * CROPS — pieces of the real product, cut large enough to read.
 *
 * The owner, on the site's full-screen mockups: "screenshots of a whole
 * screen in a 3×6 cm frame — nothing is readable, and even if it were, what
 * would he read? The right thing is to cut PIECES and show them in our
 * colours. The important part is that he finds the strong options he says
 * yes to." And on truth: "the first image talks about a tool we do not even
 * have" — there is no AI answering on WhatsApp; there are rules that say run
 * this and not that, a tool that builds a whole site in one click, Rocket Ad
 * that makes an ad from one image, a Google lead machine, and a lead form
 * that talks — "no system has a lead form even like ours."
 *
 * So every crop here is a fragment of a screen that EXISTS, rebuilt from the
 * product's own words (its dictionaries and its screens), in the room's own
 * tokens, at a size a person reads without leaning in. No company names, no
 * client names, no invented feature. A crop that shows a thing the product
 * does not do is a lie with a border on it; scripts/business-crops-test.ts
 * keeps the WhatsApp-answering scene out and the words honest.
 *
 * ON THE PHONE. A crop inside a holder inside the page column has about
 * 280px to live in. Four figures across, five section chips across, a
 * sentence and a chip on one line — each of those was drawn for a desktop
 * column and squeezed to unreadable on a phone, or pushed the card past the
 * screen. Every grid below now starts narrow and widens at `sm`, every
 * button row wraps, and the one fixed width (the phone mock in the lead
 * form) is capped at the column. scripts/business-crops-test.ts keeps it
 * that way.
 *
 * Pure presentational — server-renderable; the reel that cycles them is the
 * client piece (components/business/crop-reel.tsx).
 */
import type { ReactNode } from 'react'

/* ── the shared frame ──────────────────────────────────────────────────── */

const LABEL = 'font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint'

export function CropFrame({
  kicker,
  title,
  sub,
  children,
  className = '',
  flush = false,
}: {
  kicker?: string
  title?: ReactNode
  sub?: ReactNode
  children: ReactNode
  className?: string
  /** Inside a Holder the holder IS the frame — no second border, no second
   *  surface. "Squares on top of each other" was the owner's note. */
  flush?: boolean
}) {
  return (
    <div className={`${flush ? '' : 'overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-(--shadow-card) sm:p-6'} text-ink ${className}`}>
      {/* Flush inside a holder, the holder's Keyword and label already say it. */}
      {(kicker || title) && !flush && (
        <div className="mb-4">
          {kicker ? <div className={LABEL}>{kicker}</div> : null}
          {title ? <div className="mt-1 text-[1.0625rem] font-semibold leading-snug">{title}</div> : null}
          {sub ? <div className="mt-1 text-[0.8125rem] leading-[1.55] text-ink-muted">{sub}</div> : null}
        </div>
      )}
      {children}
    </div>
  )
}

function Chip({ tone = 'neutral', children }: { tone?: 'positive' | 'caution' | 'brand' | 'neutral' | 'danger'; children: ReactNode }) {
  const cls = {
    positive: 'border-positive/40 bg-positive/10 text-positive-bright',
    caution: 'border-caution/40 bg-caution/10 text-caution-bright',
    danger: 'border-danger/40 bg-danger/10 text-danger-bright',
    brand: 'border-brand/40 bg-brand/10 text-brand-bright',
    neutral: 'border-line bg-surface-2 text-ink-muted',
  }[tone]
  return <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>
}

function Btn({ primary = false, children }: { primary?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold ${
        primary ? 'bg-brand text-brand-ink' : 'border border-line bg-surface-2 text-ink'
      }`}
    >
      {children}
    </span>
  )
}

/* ── 1. Rocket Ad — one source, one budget, an ad that starts paused ────── */

export function RocketAdCrop({ flush = false }: { flush?: boolean } = {}) {
  const sources = ['Brochure', 'Landing', 'Image', 'Video', 'Text', 'Link']
  return (
    <CropFrame flush={flush}
      kicker="Ads · Rocket Ad"
      title="Rocket Ad"
      sub="Give it a source and a budget. It reads the source, writes the ad, and sets the rest — you confirm and it runs."
    >
      <div className="grid grid-cols-3 gap-2">
        {sources.map((s, i) => (
          <div
            key={s}
            className={`rounded-xl border px-3 py-3.5 text-center text-[13px] font-medium ${
              i === 2 ? 'border-brand/50 bg-brand/10 text-ink' : 'border-line bg-surface-2 text-ink-muted'
            }`}
          >
            {s}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className={LABEL}>Per day</span>
        <span className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[13px]">
          <span className="text-ink-faint">AED</span>
          <span className="text-ink">300</span>
        </span>
      </div>
      <div className="mt-3">
        <span className="flex w-full items-center justify-center rounded-xl bg-brand py-2.5 text-[14px] font-semibold text-brand-ink">Start</span>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-ink-faint">
        It always launches paused, so you see the ad before a dirham moves.
      </p>
    </CropFrame>
  )
}

/* ── 2. Who this reaches — the live targeting, read back from Meta ─────── */

export function ReachCrop({ flush = false }: { flush?: boolean } = {}) {
  const rows: Array<[string, ReactNode]> = [
    ['Where', 'Dubai'],
    ['Who counts', 'Residents + visitors'],
    ['Age', '25–65'],
    ['Gender', 'Everyone'],
    ['Signals', 'Land and houses · Penthouse apartment · Residential area'],
    ['Excludes', 'People already in the CRM'],
    ['Runs on', 'Feed · Reels · Stories'],
  ]
  return (
    <CropFrame flush={flush}
      kicker="Ads · live campaign"
      title="Who this reaches"
      sub="The live targeting, read back from Meta — what the money is actually pointed at right now."
    >
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5 bg-surface-2/60 px-3.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
            <span className={`${LABEL} shrink-0`}>{k}</span>
            <span className="text-[13px] text-ink sm:text-end">{v}</span>
          </div>
        ))}
      </div>
    </CropFrame>
  )
}

/* ── 3. Rated leads become the next audience ───────────────────────────── */

export function AudienceCrop({ flush = false }: { flush?: boolean } = {}) {
  return (
    <CropFrame flush={flush}
      kicker="Lead forms · audience builder"
      title="Form portfolio value"
      sub="Every rating teaches the machine what to buy and what to stop buying — and rated 6+ leads become sellable audiences."
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['852', 'Leads in CRM'],
          ['293', 'Rated'],
          ['4.0', 'Avg value'],
          ['124', 'Qualified (6+)'],
        ].map(([v, l], i) => (
          <div key={l} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
            <div className={`font-mono text-[1.25rem] leading-none tabular-nums ${i === 3 ? 'text-positive-bright' : 'text-ink'}`} dir="ltr">{v}</div>
            <div className="mt-1.5 text-[11px] leading-tight text-ink-faint">{l}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-brand/50 bg-brand/10 px-3 py-2.5">
          <div className="font-mono text-[1.05rem] tabular-nums text-ink" dir="ltr">124</div>
          <div className="text-[11px] text-ink-muted">Qualified (value 6+)</div>
        </div>
        <div className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
          <div className="font-mono text-[1.05rem] tabular-nums text-ink" dir="ltr">851</div>
          <div className="text-[11px] text-ink-muted">All contactable leads</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span className="flex items-center gap-2 text-ink">
          <span aria-hidden className="grid h-4 w-4 place-items-center rounded border border-brand bg-brand text-[10px] text-brand-ink">✓</span>
          Build a Lookalike on top
        </span>
        <span className="rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-[12px] text-ink-muted">3%</span>
      </div>
      <div className="mt-3">
        <span className="flex w-full items-center justify-center rounded-xl bg-brand py-2.5 text-[14px] font-semibold text-brand-ink">
          Create Custom Audience + Lookalike
        </span>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-ink-faint">
        Contacts are SHA-256-hashed before reaching Meta. Raw phone numbers and emails never leave the platform.
      </p>
    </CropFrame>
  )
}

/* ── 4. A page per property, and the gate that reads it ───────────────── */

export function LandingRowsCrop({ flush = false }: { flush?: boolean } = {}) {
  const rows = [
    { name: 'Marina Vista — 2BR', where: 'Dubai Marina · AED 1.9M', status: 'Live', ready: 97 },
    { name: 'Creekside One', where: 'Dubai Creek Harbour · AED 2.4M', status: 'Live', ready: 96 },
    { name: 'Palm Crescent Penthouse', where: 'Palm Jumeirah · AED 6.2M', status: 'Live', ready: 95 },
  ]
  return (
    <CropFrame flush={flush} kicker="Landing pages" title="Each property has a dedicated ad landing page">
      <div className="grid grid-cols-3 gap-2">
        {[['Live', '1,633', 'active pages'], ['Draft', '367', 'unpublished'], ['Ad-ready', '94%', 'across the catalogue']].map(([l, v, s]) => (
          <div key={l} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
            <div className="text-[11px] text-ink-muted">{l}</div>
            <div className="mt-1 font-mono text-[1.15rem] leading-none tabular-nums text-ink" dir="ltr">{v}</div>
            <div className="mt-1 text-[11px] text-ink-faint">{s}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line">
        {rows.map((r) => (
          <div key={r.name} className="bg-surface-2/60 px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-ink">{r.name}</span>
                <Chip tone={r.status === 'Live' ? 'positive' : 'caution'}>{r.status}</Chip>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Btn>Campaign</Btn>
                <span className="hidden sm:inline-flex"><Btn>Edit</Btn></span>
              </div>
            </div>
            <div className="mt-1 text-[12px] text-ink-faint">{r.where}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-1 w-24 overflow-hidden rounded-full bg-surface-3">
                <span className="block h-full rounded-full bg-brand" style={{ width: `${r.ready}%` }} />
              </span>
              <span className="font-mono text-[11px] text-ink-faint">{r.ready}% ad ready</span>
            </div>
          </div>
        ))}
      </div>
    </CropFrame>
  )
}

/* ── 5. Edit the page from the chat; the layout is a list you can reorder ── */

export function AiEditCrop({ flush = false }: { flush?: boolean } = {}) {
  const chips = ['Make the headline punchier', 'Rewrite for Arabic investors', 'Improve SEO title & description', 'Move the lead form higher']
  const sections = ['Hero', 'Key facts', 'Description', 'Market intelligence', 'ROI', 'Golden Visa', 'AI Concierge', 'FAQ', 'Lead form']
  return (
    <CropFrame flush={flush}
      kicker="Landing page · AI edit"
      title="AI edit"
      sub="Edit this page from the Expert chat — describe the change and it applies live, reversible from the chat."
    >
      <div className="flex flex-wrap gap-1.5">
        <Btn primary>Edit in Expert chat</Btn>
        {chips.map((c) => (
          <span key={c} className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[12px] text-ink-muted">{c}</span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className={LABEL}>Page layout</span>
        <Btn>Save layout</Btn>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {sections.map((s) => (
          <div key={s} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-[12px] text-ink">
            <span aria-hidden className="text-ink-faint">⋮⋮</span>
            <span className="truncate">{s}</span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[12px] text-ink-faint">Reorder, edit, add or hide sections. Changes apply to the live page after saving.</p>
    </CropFrame>
  )
}

/* ── 6. One verdict per listing, one next action ───────────────────────── */

export function VerdictCrop({ flush = false }: { flush?: boolean } = {}) {
  const rows: Array<{ name: string; score: number; verdict: 'Scale' | 'Launch' | 'Fix first' | 'Hold'; next: string }> = [
    { name: 'Marina Vista — 2BR', score: 92, verdict: 'Scale', next: 'Already running and ready — increase budget' },
    { name: 'Creekside One', score: 88, verdict: 'Scale', next: '51 leads in 30 days — momentum already there' },
    { name: 'Palm Crescent Penthouse', score: 78, verdict: 'Launch', next: 'Page is live — launch the first campaign' },
    { name: 'Furjan Villas', score: 64, verdict: 'Fix first', next: 'High potential — add the payment plan, then re-score' },
  ]
  const tone = { Scale: 'positive', Launch: 'brand', 'Fix first': 'caution', Hold: 'neutral' } as const
  return (
    <CropFrame flush={flush} kicker="Inventory" title="Which properties should we advertise, and why?" sub="Ad readiness out of 100. Ad-ready starts at 70.">
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 bg-surface-2/60 px-3.5 py-3">
            <span className={`w-9 shrink-0 font-mono text-[1.05rem] tabular-nums ${r.score >= 70 ? 'text-ink' : 'text-ink-faint'}`} dir="ltr">{r.score}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-ink">{r.name}</span>
                <Chip tone={tone[r.verdict]}>{r.verdict}</Chip>
              </div>
              <div className="mt-0.5 truncate text-[12px] text-ink-faint">{r.next}</div>
            </div>
          </div>
        ))}
      </div>
    </CropFrame>
  )
}

/* ── 7. The form that talks back — seen where it happens ──────────────── */

/**
 * The owner: "'Hi, I'm the form' is weird, and the chat way is not clear.
 * This wants a screenshot from Instagram with a pop-up over it — the form
 * as a GIF: he sees what was asked and what happened. A chat as a picture
 * pulls nobody any more." So: a phone showing a feed with OUR ad in it, and
 * over it the form's pop-up moving through its four moments on its own —
 * greeting, the one question, the answer, and the result: a call booked
 * and the lead handed to a person. The mover is CSS; a reader who asked for
 * reduced motion sees the result frame, still.
 *
 * The greeter is Sara, the Visual Sales Team's warm opener
 * (lib/freehold/visual-sales-team.ts) — a real member, not a bot voice.
 */
export function LeadformCrop({ flush = false }: { flush?: boolean } = {}) {
  const stages: Array<{ who: string; line: ReactNode; reply?: string; done?: boolean }> = [
    { who: 'Sara · Marina Vista', line: 'Welcome — before I show you the plans, what should I call you?', reply: 'Mohamed' },
    { who: 'Sara', line: 'Nice to meet you, Mohamed. Buying to live in, or to invest?', reply: 'To invest — good yield' },
    { who: 'Sara', line: 'Then Marina Vista is the one to see. Thursday 4 PM or Saturday 11 AM for a call?', reply: 'Thursday' },
    { who: 'Booked', line: <>Call with <b className="font-semibold">Omar K.</b> · Thursday 4 PM. The desk has everything Mohamed said.</>, done: true },
  ]
  return (
    <CropFrame flush={flush} kicker="Leadformer" title="The form that talks back" sub="An ad in the feed. A tap. No fields — a conversation that ends with a booked call and a lead that already told you everything.">
      <style>{`
        @keyframes lf-stage { 0%, 4% { opacity: 0; transform: translateY(6px) } 8%, 24% { opacity: 1; transform: none } 28%, 100% { opacity: 0; transform: translateY(-4px) } }
        .lf-stage { animation: lf-stage 14s linear infinite; opacity: 0 }
        .lf-stage:nth-child(1) { animation-delay: 0s } .lf-stage:nth-child(2) { animation-delay: 3.5s }
        .lf-stage:nth-child(3) { animation-delay: 7s } .lf-stage:nth-child(4) { animation-delay: 10.5s }
        @media (prefers-reduced-motion: reduce) { .lf-stage { animation: none } .lf-stage:nth-child(4) { opacity: 1 } }
      `}</style>
      <div className="mx-auto w-full max-w-[17rem] overflow-hidden rounded-[2rem] border border-line-strong bg-surface-2 shadow-(--shadow-card) sm:max-w-[19rem]">
        {/* the feed */}
        <div className="border-b border-line px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">Feed</div>
        <div className="flex items-center gap-2.5 px-3.5 py-2.5">
          <span aria-hidden className="h-7 w-7 rounded-full bg-[linear-gradient(135deg,#d9a042,#d46b47)]" />
          <div className="min-w-0 leading-tight">
            <div className="text-[12px] font-semibold text-ink">yourbrokerage</div>
            <div className="text-[11px] text-ink-faint">Sponsored</div>
          </div>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[linear-gradient(160deg,#d9a042_0%,#d46b47_45%,#3a3140_100%)]">
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute inset-x-4 bottom-3 text-white">
            <div className="text-[15px] font-semibold leading-tight">Marina Vista — 2BR from AED 1.9M</div>
            <div className="mt-0.5 text-[11px] opacity-85">Ready · 6.8% projected yield · payment plan</div>
          </div>
        </div>
        <div className="flex items-center justify-between px-3.5 py-2.5 text-[12px] text-ink-muted">
          <span>♡ ○ ➤</span>
          <span className="rounded-md bg-brand px-3 py-1 text-[11px] font-semibold text-brand-ink">Learn more</span>
        </div>
        {/* the pop-up, moving through its four moments */}
        <div className="relative border-t border-line bg-surface p-3.5" style={{ minHeight: '9.5rem' }}>
          {stages.map((st, i) => (
            <div key={i} className="lf-stage absolute inset-3.5" aria-hidden={i !== stages.length - 1}>
              <div className="flex items-center gap-2">
                <span aria-hidden className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${st.done ? 'bg-positive text-white' : 'bg-brand text-brand-ink'}`}>{st.done ? '✓' : 'S'}</span>
                <span className="text-[11px] font-medium text-ink-faint">{st.who}</span>
              </div>
              <div className="mt-2 rounded-2xl rounded-tl-sm border border-line bg-surface-2 px-3 py-2 text-[13px] leading-snug text-ink">{st.line}</div>
              {st.reply ? (
                <div className="mt-2 flex justify-end">
                  <span className="rounded-2xl rounded-br-sm bg-brand px-3 py-1.5 text-[13px] text-brand-ink">{st.reply}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </CropFrame>
  )
}

/* ── 8. A lead lands owned, tagged, and on a clock ─────────────────────── */

export function LeadCardCrop({ flush = false }: { flush?: boolean } = {}) {
  return (
    <CropFrame flush={flush} kicker="CRM · new lead" title="Landed 2:47 AM — owned by 2:48">
      <div className="rounded-xl border border-line bg-surface-2/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[15px] font-semibold text-ink">Fatima A.</div>
            <div className="mt-0.5 text-[12px] text-ink-faint">Meta form · Marina Vista 2BR · 2:47 AM</div>
          </div>
          <Chip tone="positive">Hot</Chip>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 sm:grid-cols-3">
          {[['Language', 'العربية'], ['Owner', 'Omar K.'], ['Follow-up', 'Call within 1h']].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-line bg-surface px-2.5 py-2">
              <div className={LABEL}>{k}</div>
              <div className="mt-1 text-[13px] text-ink">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn primary>Call</Btn>
          <Btn>WhatsApp</Btn>
          <Btn>Reassign</Btn>
        </div>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-ink-faint">Assigned by the rule you wrote, tagged by language, due on the clock — the person answers.</p>
    </CropFrame>
  )
}

/* ── 9. A whole site, generated ────────────────────────────────────────── */

export function MicrositeCrop({ flush = false }: { flush?: boolean } = {}) {
  return (
    <CropFrame flush={flush} kicker="Web Studio · project microsites" title="Generate a full multi-section website for any project" sub="Its own address, from the record you already have.">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/60 px-3.5 py-3">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-ink">Creekside One</div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-ink-faint" dir="ltr">yourbrokerage.ae/projects/creekside-one</div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Btn primary>Generate</Btn>
          <Btn>Publish</Btn>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        {['Hero', 'Key facts', 'Payment plan', 'Location', 'Gallery', 'Market', 'ROI', 'FAQ', 'Enquire', 'Footer'].map((s) => (
          <div key={s} className="rounded-lg border border-line bg-surface-2 px-2 py-2 text-center text-[11px] text-ink-muted">{s}</div>
        ))}
      </div>
      <p className="mt-2.5 text-[12px] text-ink-faint">Ten sections, three languages, one click. Edit any of it from the chat.</p>
    </CropFrame>
  )
}

/* ── 10. Every design tool in one place ────────────────────────────────── */

export function CreativeSuiteCrop({ flush = false }: { flush?: boolean } = {}) {
  const tools = [
    ['Ad Designer', 'A ready Meta ad set from a listing or image.'],
    ['Photo Reel', 'Listing photos become a real video ad, any placement.'],
    ['Image editor', 'Compose, crop, brand and stamp — real pixels.'],
    ['Brochure → Ad Set', 'Upload a developer PDF — the Ad Designer builds the full set.'],
    ['Presenters', 'AI presenter + property + format — a marketing image in one screen.'],
    ['Video', 'Trim, caption and end-card — no re-encode.'],
  ]
  return (
    <CropFrame flush={flush} kicker="Creative Studio" title="Every design tool in one place">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {tools.map(([n, s]) => (
          <div key={n} className="rounded-xl border border-line bg-surface-2/60 px-3 py-2.5">
            <div className="text-[13px] font-semibold text-ink">{n}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-ink-faint">{s}</div>
          </div>
        ))}
      </div>
    </CropFrame>
  )
}

/* ── 11. The report you send upstairs ──────────────────────────────────── */

export function CompanyCrop({ flush = false }: { flush?: boolean } = {}) {
  const tiles = [
    ['Total leads', '892', 'All time'],
    ['New leads', '362', 'Last 30 days'],
    ['Sales volume', 'AED 2.0M', 'Approved + closed'],
    ['Commission', 'AED 100K', 'Approved + closed'],
  ]
  return (
    <CropFrame flush={flush} kicker="Management · company" title="Company-wide leads, conversions and revenue">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map(([l, v, s]) => (
          <div key={l} className="rounded-xl border border-line bg-surface-2/60 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className={LABEL}>{l}</span>
              <Chip tone="positive">Live</Chip>
            </div>
            <div className="mt-2 font-mono text-[1.15rem] leading-none tabular-nums text-ink" dir="ltr">{v}</div>
            <div className="mt-1 text-[11px] text-ink-faint">{s}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Explain the biggest change in conversions this month', 'What should leadership act on this week?', 'Which source drives the best closing rate?'].map((q) => (
          <span key={q} className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[12px] text-ink-muted">{q} ↗</span>
        ))}
      </div>
      <div className="mt-3">
        <Btn primary>Generate company report</Btn>
      </div>
    </CropFrame>
  )
}

/* ── 12. A rule, and the brake it pulls ────────────────────────────────── */

export function SpendRuleCrop({ flush = false }: { flush?: boolean } = {}) {
  return (
    <CropFrame flush={flush} kicker="Ads Machine · rules" title="No rule, no spend" sub="Money moves only inside limits a person wrote. Every automatic move is written down with its reason.">
      <div className="space-y-2">
        <div className="rounded-xl border border-line bg-surface-2/60 px-3.5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] text-ink">If <span className="font-mono">cost per lead</span> rises above <span className="font-mono">AED 150</span></span>
            <Chip tone="neutral">Pause</Chip>
          </div>
          <div className="mt-1 text-[12px] text-ink-faint">Withheld until 3 leads of evidence — a swing on one delivery is noise, not a signal.</div>
        </div>
        <div className="rounded-xl border border-line bg-surface-2/60 px-3.5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] text-ink">If <span className="font-mono">cost per lead</span> stays under <span className="font-mono">AED 90</span> for 3 days</span>
            <Chip tone="positive">Scale +20%</Chip>
          </div>
          <div className="mt-1 text-[12px] text-ink-faint">Capped at AED 400 a day. It proposes; you apply with one click.</div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-brand/40 bg-brand/10 px-3.5 py-2.5 font-mono text-[12px] text-ink">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
          budget moved +AED 120 → Creekside One — rule: cost/lead &lt; AED 90 · 3 days
        </div>
      </div>
    </CropFrame>
  )
}
