/**
 * Product imagery for the business site — frames (Browser, Phone), the
 * mini-screens that go inside them, and the reading-path furniture.
 *
 * The minis are mock DATA inside a real product frame: that is what a
 * screenshot is. Names, projects and prices are plausible Dubai stock;
 * no real customer appears anywhere.
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
      className={`overflow-hidden rounded-xl bg-[#0F131A] ring-1 ring-white/[0.08] shadow-[0_32px_90px_-30px_rgba(0,0,0,0.85)] ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
        <div className="flex shrink-0 gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-[#FF5F57]/70" />
          <span className="h-2 w-2 rounded-full bg-[#FEBC2E]/70" />
          <span className="h-2 w-2 rounded-full bg-[#28C840]/70" />
        </div>
        <div className="mx-auto flex min-w-0 max-w-[280px] flex-1 items-center justify-center gap-1.5 rounded-md bg-white/[0.05] px-3 py-1 ring-1 ring-white/[0.05]">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" aria-hidden>
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 018 0v3" />
          </svg>
          <span className="truncate font-mono text-[10px] text-[#7C8B9D]" dir="ltr">
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

export function Phone({
  dir = 'ltr',
  children,
  className = '',
}: {
  dir?: 'ltr' | 'rtl'
  children: ReactNode
  className?: string
}) {
  return (
    <div
      dir={dir}
      className={`w-full max-w-[300px] rounded-[2.1rem] bg-[#101318] p-1.5 shadow-[0_32px_90px_-30px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.09] ${className}`}
    >
      <div className="relative overflow-hidden rounded-[1.7rem] bg-[#07090C] ring-1 ring-white/[0.06]">
        <div
          aria-hidden
          className="absolute left-1/2 top-1.5 z-20 h-[18px] w-24 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/[0.07]"
        />
        <div className="pt-7">{children}</div>
      </div>
    </div>
  )
}

/* ── Chat (WhatsApp-style thread) ───────────────────────────────────────── */

export interface ChatMessage {
  from: 'lead' | 'system' | 'agent'
  text: string
  time?: string
  /** 'ar' renders the bubble right-to-left. */
  lang?: 'ar' | 'en'
}

/* The 2:47am scene: a lead asks in Arabic, the machine answers as the brand,
   tags the language and hands the lead an owner. Real shipped behaviour. */
const DEFAULT_THREAD: ChatMessage[] = [
  { from: 'lead', text: 'هل شقة الغرفتين في مارينا فيستا ما زالت متاحة؟', time: '2:47 AM', lang: 'ar' },
  { from: 'agent', text: 'نعم، متاحة — غرفتان، AED 1.9M، جاهزة للمعاينة. أرسل التفاصيل؟', time: '2:48 AM', lang: 'ar' },
  { from: 'system', text: 'Tagged العربية · assigned to Omar K.' },
  { from: 'agent', text: 'معاينة الخميس ٤ عصراً أو السبت ١١ صباحاً؟', time: '2:49 AM', lang: 'ar' },
]

export function Chat({
  messages = DEFAULT_THREAD,
  chip = 'answered in 54s',
  title = 'Marina Vista — WhatsApp',
}: {
  messages?: ChatMessage[]
  /** Small gold annotation pinned top-right of the thread; '' hides it. */
  chip?: string
  title?: string
}) {
  return (
    <div className="relative bg-[#0B0F16]">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#1DA85A]/20 font-mono text-[9px] text-[#3FD07F]">
          MV
        </div>
        <div className="min-w-0">
          <div className="truncate text-[10.5px] font-medium text-white">{title}</div>
          <div className="text-[8.5px] text-[#3FD07F]">online</div>
        </div>
      </div>
      {chip ? (
        <div className="absolute right-2.5 top-12 z-10 rounded-full bg-[#3B82F6]/10 px-2 py-0.5 font-mono text-[8.5px] text-[#3B82F6] ring-1 ring-[#3B82F6]/25">
          {chip}
        </div>
      ) : null}
      <div className="space-y-2 px-3 py-3.5">
        {messages.map((m, i) => {
          if (m.from === 'system')
            return (
              <div key={i} className="flex justify-center py-0.5">
                <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 font-mono text-[8.5px] text-[#7C8B9D] ring-1 ring-white/[0.06]">
                  {m.text}
                </span>
              </div>
            )
          const outbound = m.from === 'agent'
          return (
            <div key={i} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
              <div
                dir={m.lang === 'ar' ? 'rtl' : 'ltr'}
                className={`max-w-[82%] rounded-xl px-2.5 py-1.5 text-[10.5px] leading-[1.5] ring-1 ${
                  outbound
                    ? 'rounded-br-sm bg-[#123D2C] text-[#D9E5DE] ring-[#1DA85A]/20'
                    : 'rounded-bl-sm bg-white/[0.06] text-[#CBD5E1] ring-white/[0.06]'
                }`}
              >
                {m.text}
                {m.time ? (
                  <span className="mx-1.5 inline-block align-baseline font-mono text-[8px] tabular-nums text-white/35" dir="ltr">
                    {m.time}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Mini-screens ───────────────────────────────────────────────────────── */

/* Shared row/label styles for the minis: dense, truncated, tabular. */
const cell = 'truncate text-[10px] leading-tight'
const faint = 'text-[#64748B]'

function MiniHeader({ label, right }: { label: string; right?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/[0.06] px-3 py-2">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#7C8B9D]">{label}</span>
      {right ? (
        <span className="font-mono text-[9px] tabular-nums text-[#64748B]" dir="ltr">
          {right}
        </span>
      ) : null}
    </div>
  )
}

export function MiniCRM() {
  const cols: Array<{
    name: string
    leads: Array<{ who: string; project: string; value: string; heat?: 'hot' | 'warm'; when: string }>
  }> = [
    {
      name: 'New',
      leads: [
        { who: 'Fatima A.', project: 'Creekside One', value: 'AED 2.4M', heat: 'hot', when: '2m' },
        { who: 'Sergei M.', project: 'JVC', value: 'AED 950K', heat: 'warm', when: '11m' },
        { who: 'Hana S.', project: 'Business Bay', value: 'AED 1.1M', when: '24m' },
      ],
    },
    {
      name: 'Contacted',
      leads: [
        { who: 'Layla H.', project: 'Marina Vista', value: 'AED 1.9M', heat: 'hot', when: '26m' },
        { who: 'Ahmed R.', project: 'Business Bay', value: 'AED 1.4M', heat: 'warm', when: '1h' },
      ],
    },
    {
      name: 'Viewing',
      leads: [
        { who: 'Priya S.', project: 'Palm Jumeirah', value: 'AED 6.2M', heat: 'hot', when: 'Thu 4pm' },
        { who: 'Ivan D.', project: 'Creekside One', value: 'AED 2.1M', heat: 'warm', when: 'Sat 11am' },
      ],
    },
    {
      name: 'Won',
      leads: [
        { who: 'Noor B.', project: 'Marina Vista', value: 'AED 1.85M', when: 'Mon' },
        { who: 'Daniel W.', project: 'JVC', value: 'AED 1.02M', when: 'May 2' },
      ],
    },
  ]
  return (
    <div className="bg-[#0B0F16]">
      <MiniHeader label="Pipeline" right="9 open · AED 17.9M" />
      <div className="grid grid-cols-4 gap-1.5 p-2">
        {cols.map((c) => (
          <div key={c.name} className="min-w-0">
            <div className="mb-1.5 flex items-baseline justify-between px-0.5">
              <span className="truncate text-[9px] font-medium text-[#CBD5E1]">{c.name}</span>
              <span className="font-mono text-[8px] tabular-nums text-[#64748B]">{c.leads.length}</span>
            </div>
            <div className="space-y-1.5">
              {c.leads.map((l) => (
                <div key={l.who} className="rounded-md bg-white/[0.04] p-1.5 ring-1 ring-white/[0.06]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[9.5px] font-medium text-white">{l.who}</span>
                    {l.heat ? (
                      <span
                        className={`shrink-0 rounded-sm px-1 font-mono text-[7px] uppercase ${
                          l.heat === 'hot'
                            ? 'bg-[#3B82F6]/15 text-[#3B82F6]'
                            : 'bg-white/[0.06] text-[#7C8B9D]'
                        }`}
                      >
                        {l.heat}
                      </span>
                    ) : null}
                  </div>
                  <div className={`${cell} ${faint} mt-0.5 text-[8.5px]`}>{l.project}</div>
                  <div className="mt-1 flex items-baseline justify-between gap-1">
                    <span className="truncate font-mono text-[8.5px] tabular-nums text-[#CBD5E1]" dir="ltr">
                      {l.value}
                    </span>
                    <span className="shrink-0 font-mono text-[7.5px] text-[#565C64]">{l.when}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MiniCampaigns() {
  const rows: Array<{ name: string; on: boolean; spend: string; bar: string; leads: number; cpl: string }> = [
    { name: 'Marina Vista — 2BR video', on: true, spend: 'AED 4,120', bar: 'w-[72%]', leads: 46, cpl: 'AED 90' },
    { name: 'Creekside One launch', on: true, spend: 'AED 3,480', bar: 'w-[61%]', leads: 51, cpl: 'AED 68' },
    { name: 'JVC townhouses', on: true, spend: 'AED 1,240', bar: 'w-[22%]', leads: 11, cpl: 'AED 113' },
    { name: 'Palm penthouse', on: false, spend: 'AED 380', bar: 'w-[7%]', leads: 2, cpl: 'AED 190' },
  ]
  return (
    <div className="bg-[#0B0F16]">
      <MiniHeader label="Campaigns" right="today · AED 9,220" />
      <div className="divide-y divide-white/[0.05]">
        <div className="grid grid-cols-[minmax(0,1fr)_30px_74px_28px_50px] items-center gap-2 px-3 py-1.5">
          {['Campaign', 'St.', 'Spend', 'Leads', 'AED/lead'].map((h) => (
            <span key={h} className="truncate font-mono text-[7.5px] uppercase tracking-[0.1em] text-[#565C64]">
              {h}
            </span>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.name}>
            <div className="grid grid-cols-[minmax(0,1fr)_30px_74px_28px_50px] items-center gap-2 px-3 py-2">
              <span className="truncate text-[10px] text-[#CBD5E1]">{r.name}</span>
              <span
                className={`justify-self-start rounded-full px-1.5 py-px font-mono text-[7px] uppercase ring-1 ${
                  r.on
                    ? 'bg-[#28C840]/10 text-[#3FD07F] ring-[#28C840]/25'
                    : 'bg-white/[0.05] text-[#64748B] ring-white/[0.08]'
                }`}
              >
                {r.on ? 'On' : 'Off'}
              </span>
              <span className="min-w-0" dir="ltr">
                <span className="block truncate font-mono text-[9px] tabular-nums text-[#CBD5E1]">{r.spend}</span>
                <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <span className={`block h-full rounded-full bg-[#3B82F6]/70 ${r.bar}`} />
                </span>
              </span>
              <span className="font-mono text-[9.5px] tabular-nums text-white" dir="ltr">
                {r.leads}
              </span>
              <span className="truncate font-mono text-[9px] tabular-nums text-[#7C8B9D]" dir="ltr">
                {r.cpl}
              </span>
            </div>
            {r.name === 'Creekside One launch' ? (
              <div className="flex items-center gap-1.5 px-3 pb-2">
                <span aria-hidden className="h-1 w-1 rounded-full bg-[#3B82F6]" />
                <span className="truncate font-mono text-[8.5px] text-[#3B82F6]" dir="ltr">
                  budget moved +AED 120 → Creekside ad — rule: cost/lead &lt; AED 90
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function MiniInventory() {
  const units: Array<{ name: string; where: string; price: string; score: number; dead?: boolean; tint: string }> = [
    { name: 'Marina Vista 2BR', where: 'Bayline · Dubai Marina', price: 'AED 1.9M', score: 92, tint: 'from-[#20303F]' },
    { name: 'Creekside One 1BR', where: 'Qamar Group · Creek Harbour', price: 'AED 1.2M', score: 88, tint: 'from-[#2A2A3D]' },
    { name: 'Palm Rise Villa', where: 'Alnoor · Palm Jumeirah', price: 'AED 12.5M', score: 90, tint: 'from-[#3A3226]' },
    { name: 'Business Bay Studio', where: 'Marsa Living · Business Bay', price: 'AED 780K', score: 84, tint: 'from-[#1F3330]' },
    { name: 'JVC Townhouse', where: 'Hilalview · JVC', price: 'AED 2.1M', score: 81, tint: 'from-[#33272E]' },
    { name: 'Al Warsan 1BR', where: 'resale · Al Warsan', price: 'AED 450K', score: 41, dead: true, tint: 'from-[#22262B]' },
  ]
  return (
    <div className="bg-[#0B0F16]">
      <MiniHeader label="Inventory" right="6 of 214 units" />
      <div className="grid grid-cols-3 gap-1.5 p-2">
        {units.map((u) => (
          <div
            key={u.name}
            className={`relative min-w-0 overflow-hidden rounded-md bg-white/[0.04] ring-1 ring-white/[0.06] ${u.dead ? 'opacity-50' : ''}`}
          >
            <div className={`h-9 w-full bg-gradient-to-br ${u.tint} to-[#0B0E12]`} aria-hidden />
            <span
              className={`absolute right-1 top-1 rounded-sm px-1 font-mono text-[7.5px] tabular-nums ${
                u.dead ? 'bg-black/50 text-[#7C8B9D]' : 'bg-black/50 text-[#3B82F6]'
              }`}
              dir="ltr"
            >
              {u.score}
            </span>
            <div className="p-1.5">
              <div className="truncate text-[9px] font-medium text-white">{u.name}</div>
              <div className={`${cell} ${faint} mt-0.5 text-[8px]`}>{u.where}</div>
              <div className="mt-1 flex items-baseline justify-between gap-1">
                <span className="truncate font-mono text-[8.5px] tabular-nums text-[#CBD5E1]" dir="ltr">
                  {u.price}
                </span>
              </div>
              {u.dead ? (
                <div className="mt-1 truncate font-mono text-[7px] uppercase tracking-wide text-[#B0614F]">
                  not fit to advertise
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MiniPage() {
  return (
    <div className="relative bg-[#0B0F16]">
      <span className="absolute right-2 top-2 z-10 rounded-full bg-[#28C840]/10 px-2 py-0.5 font-mono text-[8px] text-[#3FD07F] ring-1 ring-[#28C840]/25">
        gate: passed ✓
      </span>
      <div className="h-20 w-full bg-gradient-to-br from-[#20303F] via-[#141B22] to-[#0B0E12]" aria-hidden />
      <div className="px-3.5 py-3">
        <div className="text-[12px] font-semibold text-white">Marina Vista — 2 Bedroom</div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="font-mono text-[11px] tabular-nums text-[#3B82F6]" dir="ltr">
            AED 1.9M
          </span>
          <span className={`${faint} font-mono text-[8.5px] tabular-nums`} dir="ltr">
            1,204 sqft · 2 bath · marina view
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          {['Your name', 'WhatsApp number'].map((ph) => (
            <div key={ph} className="rounded-md bg-white/[0.04] px-2.5 py-1.5 text-[9.5px] text-[#64748B] ring-1 ring-white/[0.07]">
              {ph}
            </div>
          ))}
          <div className="flex items-center justify-center gap-1.5 rounded-md bg-[#1DA85A] px-2.5 py-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#07090C" strokeWidth="2" aria-hidden>
              <path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.7-1.2A9 9 0 1012 3z" />
            </svg>
            <span className="text-[9.5px] font-semibold text-[#07090C]">WhatsApp us</span>
          </div>
        </div>
        <div className="mt-2 text-center font-mono text-[7.5px] text-[#565C64]" dir="ltr">
          English · العربية · Русский
        </div>
      </div>
    </div>
  )
}

export function MiniReport() {
  /* Line items sum to the headline: 14,200 + 16,800 + 7,400 = 38,400. */
  const funnel: Array<{ label: string; value: string; bar: string }> = [
    { label: 'Spend', value: 'AED 38,400', bar: 'w-full' },
    { label: 'Leads', value: '312', bar: 'w-[58%]' },
    { label: 'Deals', value: '3', bar: 'w-[9%]' },
  ]
  const items: Array<{ name: string; spend: string; leads: number; deals: number }> = [
    { name: 'Marina Vista — 2BR video', spend: 'AED 16,800', leads: 148, deals: 2 },
    { name: 'Creekside One launch', spend: 'AED 14,200', leads: 121, deals: 1 },
    { name: 'JVC townhouses', spend: 'AED 7,400', leads: 43, deals: 0 },
  ]
  return (
    <div className="bg-[#0B0F16]">
      <MiniHeader label="Month report" right="May" />
      <div className="grid grid-cols-[auto_1fr] items-end gap-x-5 px-3.5 pt-3">
        <div>
          <div className="font-sans font-semibold text-[1.5rem] leading-none tabular-nums text-white" dir="ltr">
            AED 38,400
          </div>
          <div className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[#7C8B9D]" dir="ltr">
            spend / 3 deals
          </div>
        </div>
        <div className="space-y-1.5 pb-0.5">
          {funnel.map((f) => (
            <div key={f.label} className="grid grid-cols-[38px_1fr_auto] items-center gap-2">
              <span className="font-mono text-[7.5px] uppercase text-[#565C64]">{f.label}</span>
              <span className="block h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <span className={`block h-full rounded-full bg-[#3B82F6]/70 ${f.bar}`} />
              </span>
              <span className="font-mono text-[8.5px] tabular-nums text-[#CBD5E1]" dir="ltr">
                {f.value}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 divide-y divide-white/[0.05] border-t border-white/[0.06]">
        {items.map((it) => (
          <div key={it.name} className="grid grid-cols-[minmax(0,1fr)_72px_36px_34px] items-baseline gap-2 px-3.5 py-1.5">
            <span className="truncate text-[9.5px] text-[#CBD5E1]">{it.name}</span>
            <span className="font-mono text-[8.5px] tabular-nums text-[#7C8B9D]" dir="ltr">
              {it.spend}
            </span>
            <span className="font-mono text-[8.5px] tabular-nums text-[#7C8B9D]" dir="ltr">
              {it.leads} ld
            </span>
            <span className={`font-mono text-[8.5px] tabular-nums ${it.deals > 0 ? 'text-[#3B82F6]' : 'text-[#565C64]'}`} dir="ltr">
              {it.deals} dl
            </span>
          </div>
        ))}
      </div>
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
    <div className={`overflow-hidden rounded-lg bg-[#0B0F16] ring-1 ring-white/[0.07] ${className}`}>
      <MiniHeader label="Decision log" right="written before spend" />
      <div className="divide-y divide-white/[0.05]" dir="ltr">
        {rows.map((r, i) => (
          <div key={i} className="flex items-baseline gap-3 px-3.5 py-2 font-mono">
            <span className="shrink-0 text-[9px] tabular-nums text-[#565C64]">{r.time}</span>
            <span className="min-w-0 flex-1 truncate text-[10px] text-[#9FB0C2]">{r.event}</span>
            {r.amount ? (
              <span className="shrink-0 text-[10px] tabular-nums text-[#3B82F6]">{r.amount}</span>
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
    <div className="w-full border-y border-white/[0.07]">
      <div className={`mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-px bg-white/[0.07] sm:grid-cols-2 ${cols}`}>
        {items.map((s) => (
          <div key={s.label} className="bg-[#07090C] px-6 py-10 lg:px-10 lg:py-14">
            <div className="font-sans font-semibold text-[2.6rem] leading-none tracking-[-0.02em] text-white sm:text-[3.2rem]" dir="ltr">
              {s.value}
            </div>
            <div className="mt-3.5 text-[0.875rem] font-medium text-[#CBD5E1]">{s.label}</div>
            {s.note ? <div className="mt-1 text-[0.8125rem] text-[#7C838B]">{s.note}</div> : null}
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
    <ol className={`grid grid-cols-1 gap-px bg-white/[0.07] ${cols}`}>
      {steps.map((s, i) => (
        <li key={s.title} className="bg-[#0F131A] p-7">
          <div className="font-mono text-[0.9375rem] tabular-nums text-[#3B82F6]" dir="ltr">
            {String(s.n ?? i + 1).padStart(2, '0')}
          </div>
          <div className="mt-4 text-[0.9375rem] font-semibold text-white">{s.title}</div>
          <p className="mt-2 text-[0.875rem] leading-[1.6] text-[#94A3B8]">{s.body}</p>
        </li>
      ))}
    </ol>
  )
}

export function PunchCard({ title, body }: { title: string; body?: string }) {
  return (
    <div className="bg-[#0F131A] p-7 outline outline-1 outline-white/[0.07]">
      <span aria-hidden className="block h-0.5 w-6 bg-[#3B82F6]" />
      <div className="mt-5 font-sans font-semibold text-[1.35rem] leading-[1.25] tracking-[-0.01em] text-white">{title}</div>
      {body ? <p className="mt-2.5 text-[0.8125rem] leading-[1.6] text-[#7C838B]">{body}</p> : null}
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
    <div className={`grid grid-cols-1 gap-px ${map[cols]}`}>
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
      <span className="text-[#3B82F6]">
        <Glyph name={icon} />
      </span>
      <div className="mt-5 text-[0.9375rem] font-semibold text-white">{title}</div>
      <p className="mt-2 text-[0.875rem] leading-[1.6] text-[#94A3B8]">{body}</p>
    </>
  )
  if (href)
    return (
      <Link
        href={href}
        className="group block bg-[#0F131A] p-7 outline outline-1 outline-white/[0.07] transition hover:bg-[#131926]"
      >
        {inner}
        <span className="mt-3 inline-block text-[#3B82F6] opacity-0 transition group-hover:opacity-100" aria-hidden>
          →
        </span>
      </Link>
    )
  return <div className="bg-[#0F131A] p-7 outline outline-1 outline-white/[0.07]">{inner}</div>
}

export function TileGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const map = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }
  return <div className={`grid grid-cols-1 gap-px ${map[cols]}`}>{children}</div>
}

/* ── Reading path ───────────────────────────────────────────────────────── */

export function Chapter({ n, total, label }: { n: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em]">
      <span className="tabular-nums text-[#3B82F6]" dir="ltr">
        {String(n).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
      <span aria-hidden className="h-px w-8 bg-white/[0.15]" />
      <span className="text-[#7C8B9D]">{label}</span>
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
        className="group flex items-center justify-between gap-6 bg-[#0F131A] px-7 py-9 outline outline-1 outline-white/[0.07] transition hover:bg-[#131926] sm:px-10 sm:py-11"
      >
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#64748B]">
            {progress ? `Next · ${progress}` : 'Next'}
          </div>
          <div className="mt-2.5 font-sans font-semibold text-[1.55rem] leading-[1.15] tracking-[-0.015em] text-white sm:text-[2rem]">
            {label}
          </div>
          <p className="mt-2 text-[0.875rem] leading-[1.6] text-[#94A3B8]">{note}</p>
        </div>
        <span
          aria-hidden
          className="shrink-0 text-[2rem] leading-none text-[#3B82F6] transition-transform duration-200 group-hover:translate-x-2 sm:text-[2.6rem]"
        >
          →
        </span>
      </Link>
    </section>
  )
}

/* ── Hero collage + glow ────────────────────────────────────────────────── */

export function HeroVisual({ variant }: { variant: 'home' | 'machine' | 'listing' | 'meta' }) {
  const browsers: Record<'home' | 'machine' | 'listing' | 'meta', { title: string; screen: ReactNode }> = {
    home: { title: 'app.yourbrokerage.ae/campaigns', screen: <MiniCampaigns /> },
    machine: { title: 'app.yourbrokerage.ae/crm', screen: <MiniCRM /> },
    listing: { title: 'app.yourbrokerage.ae/inventory', screen: <MiniInventory /> },
    meta: { title: 'app.yourbrokerage.ae/campaigns', screen: <MiniCampaigns /> },
  }
  const back = browsers[variant]
  /* 'listing' fronts a landing page in a second browser; the rest front the
     WhatsApp phone — the Arabic thread is the signature image of the site. */
  const front =
    variant === 'listing' ? (
      <div className="w-[240px] sm:w-[270px]">
        <Browser title="yourbrokerage.ae/marina-vista-2br">
          <MiniPage />
        </Browser>
      </div>
    ) : (
      <Phone className="w-[230px] sm:w-[250px]">
        <Chat />
      </Phone>
    )
  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -inset-y-14 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.07),transparent_65%)]"
      />
      <div className="grid">
        <div className="min-w-0 sm:col-start-1 sm:row-start-1 sm:pb-10 sm:pr-32 lg:pr-40">
          <div className="sm:-rotate-1">
            <Browser title={back.title}>{back.screen}</Browser>
          </div>
        </div>
        <div className="mt-6 flex justify-center sm:col-start-1 sm:row-start-1 sm:mt-0 sm:items-end sm:justify-end">
          <div className="sm:rotate-2">{front}</div>
        </div>
      </div>
    </div>
  )
}

/** Full-bleed section wrapper: hairline top/bottom, faint gold radial glow. */
export function GlowBand({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative w-full border-y border-white/[0.07] ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_0%,rgba(59,130,246,0.06),transparent_70%)]"
      />
      <div className="relative mx-auto w-full max-w-[1180px] px-6 py-20 lg:px-10 lg:py-28">{children}</div>
    </div>
  )
}
