'use client'

/**
 * ONESTATE — THE SETUP THAT NEVER ASKS A QUESTION.
 *
 * The owner's brief, and every line of this file answers to it: "the main
 * thing is not to make them read and not to ask this or that — always ask
 * individually, that's less headache and feels more easy." So the page opens
 * blank with one sentence writing itself, and from then on there is exactly
 * one thing on the screen at a time.
 *
 * Everything that would normally be chrome was turned into something else
 * rather than added to the corner, because the first build of this put a
 * counter, a quit link, three mode chips, a skip button and a progress rail on
 * screen beside the card and his answer was the right one — that is a
 * dashboard, and he asked for a blank page:
 *
 *   · the SKIP is the left half of the card, not a button;
 *   · the STOP is a card like any other, offered when enough has been said;
 *   · the LEDGER is a whisper under the card that leaves by itself;
 *   · the PROGRESS is a shelf of named folders that appear as they fill, so he
 *     watches a CRM folder come into being and then a Meta one.
 *
 * THE CARD IS THE INPUT. Where he clicks is the answer: left is cold and the
 * card visibly dies under his hand before he commits, right is warm and it
 * lifts and throws a deeper shadow. One gesture carries both that he answered
 * and how warmly, which is the thing a yes/no button throws away. Facts that
 * do not admit a degree — "It is just me" — arrive flat instead, with ✕ and ○
 * that come TO the hand rather than waiting in the corners, because reaching
 * across a card to a mark and back is an exam.
 *
 * The deck itself lives in lib/onestate/deck.ts and is pure: this file draws
 * and listens, it decides nothing.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  WARM_AT,
  composeNext,
  emptyComposerState,
  levelSay,
  record,
  type Card,
  type ComposerState,
} from '@/lib/onestate/deck'

/* ── the folders, and what lands in which ──────────────────────────────── */

const BY_KIND: Record<string, string> = {
  'what you sell': 'Stock',
  'where you work': 'Stock',
  'developers you know': 'Stock',
  'where leads come from': 'Leads',
  'who buys from you': 'Leads',
  money: 'Ads',
  'ad budget': 'Ads',
  'your team': 'Desk',
  'what you run on': 'Desk',
  'what hurts': 'Desk',
  'the thing you actually want': 'Pages',
  'how you would run it': 'Pages',
}

const TOOL_FOLDER: Record<string, string> = {
  'google-ads': 'Google Ads',
  'meta-ads': 'Meta',
  crm: 'CRM',
  pages: 'Pages',
  leadformer: 'Leadformer',
  portals: 'Portals',
  whatsapp: 'WhatsApp',
  audiences: 'Audiences',
  scoring: 'Scoring',
  report: 'Report',
}

function folderFor(card: Card): string {
  const tool = card.dialFor ?? card.tool
  if (tool) return TOOL_FOLDER[tool] ?? 'Desk'
  return BY_KIND[card.k] ?? 'Stock'
}

/* ── a seed per visit ──────────────────────────────────────────────────── */

function makeRand() {
  let s = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Phase = 'line' | 'deck' | 'gate' | 'sending'

export default function Onestate({ plan }: { plan: 'realtor' | 'company' }) {
  const [phase, setPhase] = useState<Phase>('line')
  const [typed, setTyped] = useState({ a: '', b: '', c: '' })
  const [blank, setBlank] = useState<0 | 1 | 2>(0)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [card, setCard] = useState<Card | null>(null)
  const [whisper, setWhisper] = useState('')
  const [folders, setFolders] = useState<{ name: string; n: number }[]>([])
  const [email, setEmail] = useState('')
  const [problem, setProblem] = useState('')
  const [lean, setLean] = useState(0)
  const [dialAt, setDialAt] = useState(5)
  const [marks, setMarks] = useState<{ x: number; y: number } | null>(null)

  const stateRef = useRef<ComposerState>(emptyComposerState())
  const randRef = useRef<(() => number) | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const anchorRef = useRef<{ x: number; y: number } | null>(null)
  const whisperTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    randRef.current = makeRand()
  }, [])

  /* ── the sentence writes itself ──────────────────────────────────────── */
  const write = useCallback((piece: 'a' | 'b' | 'c', text: string, then?: () => void) => {
    if (reduced.current) {
      setTyped((t) => ({ ...t, [piece]: text }))
      then?.()
      return
    }
    let i = 0
    const step = () => {
      i += 1
      setTyped((t) => ({ ...t, [piece]: text.slice(0, i) }))
      if (i >= text.length) {
        then?.()
        return
      }
      const ch = text[i - 1]
      let wait = 34 + Math.random() * 24
      if (ch === ',' || ch === '—') wait += 140
      if (ch === '.' || ch === '!') wait += 240
      setTimeout(step, wait)
    }
    setTimeout(step, 320)
  }, [])

  useEffect(() => {
    write('a', 'hey! ', () => setBlank(1))
  }, [write])

  const nameDone = () => {
    if (!name.trim()) return
    setBlank(0)
    write('b', ' — your ', () => setBlank(2))
  }
  const companyDone = () => {
    if (!company.trim()) return
    setBlank(0)
    write('c', ' will get its own full setup. Live, here, now.', () => {
      setTimeout(() => {
        setPhase('deck')
        draw()
      }, 620)
    })
  }

  /* ── the deck ────────────────────────────────────────────────────────── */
  const draw = useCallback(() => {
    const rand = randRef.current ?? Math.random
    const next = composeNext(stateRef.current, rand)
    if (!next) {
      setPhase('gate')
      return
    }
    setCard(next)
    setDialAt(5)
    setMarks(null)
    anchorRef.current = null
    setLean(0)
  }, [])

  const land = useCallback((cardName: string) => {
    setFolders((f) => {
      const at = f.findIndex((x) => x.name === cardName)
      if (at === -1) return [...f, { name: cardName, n: 1 }]
      const copy = f.slice()
      copy[at] = { name: cardName, n: copy[at].n + 1 }
      return copy
    })
  }, [])

  const answer = useCallback(
    (score: number) => {
      const current = card
      if (!current) return
      setCard(null)

      if (current.stop) {
        setPhase('gate')
        return
      }

      const s = stateRef.current
      record(s, current, score)

      const warm = current.dialFor ? true : score >= WARM_AT
      if (warm) {
        land(folderFor(current))
        if (current.dialFor) {
          const n = Math.round(score * 10)
          say(`${TOOL_FOLDER[current.dialFor] ?? current.w} — ${levelSay(n)}`)
        }
      }

      setTimeout(() => draw(), reduced.current ? 0 : 320)
    },
    [card, draw, land],
  )

  const say = (text: string) => {
    if (whisperTimer.current) clearTimeout(whisperTimer.current)
    setWhisper(text)
    whisperTimer.current = setTimeout(() => setWhisper(''), 2600)
  }

  /* ── the card answers back while the hand is still moving ────────────── */
  const onMove = (e: React.PointerEvent) => {
    if (!card || !cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    if (card.plain || card.stop) {
      // the marks meet the hand once, then hold still so they can be reached
      const a = anchorRef.current
      if (a) {
        const dx = e.clientX - a.x
        const dy = e.clientY - a.y
        if (dx * dx + dy * dy < 150 * 150) return
      }
      const x = Math.min(r.width - 66, Math.max(66, e.clientX - r.left))
      const y = Math.min(r.height - 36, Math.max(36, e.clientY - r.top))
      anchorRef.current = { x: r.left + x, y: r.top + y }
      setMarks({ x, y })
      return
    }
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    setLean((ratio - 0.5) * 2)
    if (card.dialFor) setDialAt(Math.round(ratio * 10))
  }

  const onClick = (e: React.MouseEvent) => {
    if (!card || !cardRef.current) return
    if (card.plain || card.stop) return // its marks answer for it
    const r = cardRef.current.getBoundingClientRect()
    answer(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)))
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (!card) return
    const flat = !!card.plain || !!card.stop
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      answer(0)
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      answer(flat ? 1 : 0.92)
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      answer(flat ? 1 : 0.62)
    }
  }

  /* ── the way in ──────────────────────────────────────────────────────── */
  const send = async () => {
    const clean = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) {
      setProblem('That address is missing something — check it and try again.')
      return
    }
    setProblem('')
    setPhase('sending')
    try {
      const res = await fetch('/api/onestate/keep', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          email: clean,
          plan,
          profile: stateRef.current.profile,
        }),
      })
      const body = (await res.json()) as { next?: string; error?: string }
      if (!res.ok || !body.next) {
        setPhase('gate')
        setProblem(body.error ?? 'That did not go through. Try once more.')
        return
      }
      window.location.href = body.next
    } catch {
      setPhase('gate')
      setProblem('That did not go through. Try once more.')
    }
  }

  /* ── drawing ─────────────────────────────────────────────────────────── */
  const flat = !!card?.plain || !!card?.stop
  const warmLean = lean > 0

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(115% 65% at 50% -8%, color-mix(in srgb, var(--brand) 12%, transparent), transparent 62%)',
        }}
      />

      <p className="relative z-10 px-5 pt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
        Onestate
      </p>

      <div className="relative z-10 mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center px-5 py-8">
        {phase === 'line' && (
          <p className="max-w-[19ch] text-balance font-display text-[clamp(1.7rem,6vw,3rem)] leading-[1.28] tracking-[-0.012em]">
            <span>{typed.a}</span>
            {blank === 1 ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault()
                    nameDone()
                  }
                }}
                placeholder="your name"
                aria-label="Your name"
                size={Math.max(name.length || 9, 9)}
                className="border-b-[1.5px] border-dashed border-line-strong bg-transparent pb-0.5 font-display text-brand-bright caret-brand-bright outline-none placeholder:italic placeholder:text-ink-faint/60 focus:border-solid focus:border-brand"
              />
            ) : name && typed.b !== '' ? (
              <span className="text-brand-bright">{name}</span>
            ) : name ? (
              <span className="text-brand-bright">{name}</span>
            ) : null}
            <span>{typed.b}</span>
            {blank === 2 ? (
              <input
                autoFocus
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault()
                    companyDone()
                  }
                }}
                placeholder="company name"
                aria-label="Your company name"
                size={Math.max(company.length || 12, 12)}
                className="border-b-[1.5px] border-dashed border-line-strong bg-transparent pb-0.5 font-display text-brand-bright caret-brand-bright outline-none placeholder:italic placeholder:text-ink-faint/60 focus:border-solid focus:border-brand"
              />
            ) : company ? (
              <span className="text-brand-bright">{company}</span>
            ) : null}
            <span>{typed.c}</span>
            <span className="ml-0.5 inline-block h-[0.92em] w-0.5 translate-y-[0.08em] animate-pulse bg-brand-bright align-baseline" />
          </p>
        )}

        {phase === 'deck' && (
          <>
            <div className="relative grid min-h-[172px] grid-cols-[minmax(0,1fr)]">
              <div
                aria-hidden
                className="col-start-1 row-start-1 -z-10 translate-y-[13px] scale-[.96] rounded-2xl border border-line bg-surface opacity-45"
              />
              {card && (
                <div
                  ref={cardRef}
                  role="button"
                  tabIndex={0}
                  aria-label={`${card.k}: ${card.w}`}
                  onPointerMove={onMove}
                  onPointerDown={onMove}
                  onPointerLeave={() => {
                    setLean(0)
                    setMarks(null)
                    anchorRef.current = null
                  }}
                  onClick={onClick}
                  onKeyDown={onKey}
                  className="relative col-start-1 row-start-1 flex cursor-pointer flex-col gap-3 rounded-2xl border border-line p-7 outline-none focus-visible:ring-2 focus-visible:ring-brand-bright"
                  style={{
                    background: flat
                      ? 'var(--color-surface)'
                      : 'linear-gradient(100deg, #1b222b 0%, var(--color-surface-2) 26%, color-mix(in srgb, var(--brand) 34%, var(--color-surface-2)) 58%, color-mix(in srgb, var(--brand) 72%, var(--color-surface-2)) 82%, var(--brand-bright) 100%)',
                    opacity: !flat && lean < 0 ? 1 + lean * 0.68 : 1,
                    filter: !flat && lean < 0 ? `blur(${-lean * 1.4}px)` : 'none',
                    transform: flat
                      ? undefined
                      : lean < 0
                        ? `translateX(${lean * 13}px) scale(${1 + lean * 0.035})`
                        : `translateY(${-lean * 9}px) scale(${1 + lean * 0.022})`,
                    boxShadow: warmLean
                      ? `0 ${24 + lean * 26}px ${60 + lean * 34}px -${42 - lean * 10}px rgb(0 0 0/.85), 0 0 ${lean * 46}px -${10 - lean * 6}px color-mix(in srgb, var(--brand-bright) ${Math.round(lean * 62)}%, transparent)`
                      : '0 24px 60px -42px rgb(0 0 0/.85)',
                    transition: 'transform .1s linear, opacity .1s linear, box-shadow .1s linear, filter .1s linear',
                  }}
                >
                  <span className="relative z-[2] font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                    {card.k}
                  </span>
                  <span className="relative z-[2] font-display text-[clamp(1.7rem,6.4vw,2.6rem)] leading-[1.14] tracking-[-0.012em] text-ink">
                    {card.w}
                  </span>

                  {card.dialFor && (
                    <span className="relative z-[2] mt-1 flex min-h-[46px] items-baseline gap-3.5">
                      <b className="min-w-[2.2ch] font-mono text-[40px] font-normal leading-none tabular-nums text-ink">
                        {dialAt}
                      </b>
                      <i className="max-w-[26ch] font-mono text-[10.5px] not-italic uppercase leading-[1.5] tracking-[0.11em] text-ink-muted">
                        {levelSay(dialAt)}
                      </i>
                    </span>
                  )}

                  {/* the marks arrive where the hand is, and only then */}
                  {flat && (
                    <span
                      className="pointer-events-none absolute z-[4] flex items-center gap-[26px] transition-opacity duration-150"
                      style={{
                        left: marks?.x ?? 0,
                        top: marks?.y ?? 0,
                        transform: 'translate(-50%, -50%)',
                        opacity: marks ? 1 : 0,
                      }}
                    >
                      <button
                        type="button"
                        aria-label="No"
                        onClick={(e) => {
                          e.stopPropagation()
                          answer(0)
                        }}
                        className="pointer-events-auto relative h-[42px] w-[42px] rounded-full border border-line bg-chrome/80 backdrop-blur-[3px] transition hover:scale-110 hover:border-line-strong"
                      >
                        <span className="absolute left-1/2 top-1/2 -ml-[8.5px] -mt-[0.8px] block h-[1.6px] w-[17px] rotate-45 bg-ink-muted" />
                        <span className="absolute left-1/2 top-1/2 -ml-[8.5px] -mt-[0.8px] block h-[1.6px] w-[17px] -rotate-45 bg-ink-muted" />
                      </button>
                      <button
                        type="button"
                        aria-label="Yes"
                        onClick={(e) => {
                          e.stopPropagation()
                          answer(1)
                        }}
                        className="pointer-events-auto relative h-[42px] w-[42px] rounded-full border border-line bg-chrome/80 backdrop-blur-[3px] transition hover:scale-110 hover:border-brand"
                      >
                        <span className="absolute left-1/2 top-1/2 -ml-[8.5px] -mt-[8.5px] block h-[17px] w-[17px] rounded-full border-[1.6px] border-ink-muted" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            <p
              className="mt-4 min-h-[1.5em] font-display text-[clamp(1rem,3.4vw,1.2rem)] text-brand-bright transition-opacity duration-500"
              style={{ opacity: whisper ? 1 : 0 }}
            >
              {whisper}
            </p>
          </>
        )}

        {(phase === 'gate' || phase === 'sending') && (
          <div className="flex flex-col gap-6">
            <p className="max-w-[24ch] text-balance font-display text-[clamp(1.5rem,5vw,2.4rem)] leading-[1.24]">
              That is {company || 'it'}, standing. Where do we send your code?
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void send()
                  }
                }}
                placeholder="your email"
                aria-label="Your email"
                disabled={phase === 'sending'}
                className="min-w-0 flex-1 border-b-[1.5px] border-dashed border-line-strong bg-transparent pb-1.5 font-display text-[clamp(1.2rem,4vw,1.8rem)] text-brand-bright caret-brand-bright outline-none placeholder:italic placeholder:text-ink-faint/55 focus:border-solid focus:border-brand disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={phase === 'sending'}
                className="shrink-0 rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-bright disabled:opacity-60"
              >
                {phase === 'sending' ? 'One moment' : 'Send the code'}
              </button>
            </div>
            <p className="max-w-[46ch] text-sm leading-relaxed text-ink-muted">
              No password — not now, not later. A code when you come back, and that is the whole of it.{' '}
              <span className="text-ink">Nothing to forget, nothing to leak.</span>
            </p>
            {problem && <p className="text-sm text-danger">{problem}</p>}
          </div>
        )}
      </div>

      {/* the shelf: named folders, appearing as they fill */}
      {folders.length > 0 && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[4] flex items-end justify-center gap-4 overflow-x-auto px-4 pb-4"
        >
          {folders.map((f) => (
            <div key={f.name} className="flex w-11 shrink-0 flex-col items-center gap-1.5">
              <span className="relative block h-[33px] w-10">
                <span className="absolute left-0 top-0 h-1.5 w-[17px] rounded-t border border-b-0 border-line-strong bg-surface-2" />
                <span className="absolute inset-x-0 bottom-0 top-[5px] overflow-hidden rounded-[3px_6px_6px_6px] border border-line-strong bg-surface">
                  <span
                    className="absolute inset-x-0 bottom-0 transition-[height] duration-500"
                    style={{
                      height: `${Math.min(100, f.n * 26)}%`,
                      background: 'color-mix(in srgb, var(--brand) 55%, transparent)',
                    }}
                  />
                </span>
              </span>
              <span className="max-w-[62px] truncate text-center font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-faint">
                {f.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
