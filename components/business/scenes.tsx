'use client'

/**
 * Story scenes for the business site — the product acts out its own story
 * on a solid rounded canvas (Google-Ads no-text style). Motion carries the
 * meaning; the only prose is what the product itself would print.
 *
 * All motion is CSS keyframes (opacity + transform only) on a shared 9s
 * clock: beats are baked into keyframe percentages, not animation-delay,
 * so every loop resets clean and in sync. Reduced motion shows the final
 * frame — every element that survives the story is visible with no
 * animation; transient props (cursor, ripple, typing dots) sit at
 * opacity-0 and only exist while animated.
 */

import { useState, type ReactNode } from 'react'

/* ── The 9s clock ───────────────────────────────────────────────────────── */

const EASE = 'cubic-bezier(0.22,0.68,0.32,1)'

/** Hidden until `hideUntil`%, settled by `shownAt`%, fades at 94% for a clean loop. */
function pop(name: string, hideUntil: number, shownAt: number, enter: string): string {
  return (
    `@keyframes ${name}{0%,${hideUntil}%{opacity:0;transform:${enter}}` +
    `${shownAt}%,94%{opacity:1;transform:none}100%{opacity:0;transform:none}}` +
    `.${name}{animation:${name} 9s ${EASE} infinite}`
  )
}

const SCENE_CSS = [
  /* shared beats */
  pop('bscene-in-a', 3, 9, 'translateY(12px) scale(0.97)'),
  pop('bscene-in-b', 21, 27, 'translateY(10px)'),
  pop('bscene-in-c', 39, 45, 'translateY(12px) scale(0.98)'),
  pop('bscene-drop', 57, 63, 'translateY(-18px) scale(0.97)'),
  pop('bscene-in-e', 73, 79, 'translateY(6px) scale(0.95)'),
  /* scene 2: page skeleton frame + pieces */
  pop('bscene-frame', 42, 48, 'translateY(10px) scale(0.98)'),
  pop('bscene-p1', 47, 52, 'translateY(6px)'),
  pop('bscene-p2', 54, 59, 'translateY(6px)'),
  pop('bscene-p3', 61, 65, 'translateY(6px)'),
  pop('bscene-p4', 67, 71, 'translateY(6px)'),
  /* scene 3: story frame pops out beside the card */
  pop('bscene-story', 46, 54, 'translateX(-14px) scale(0.88)'),
  /* scene 2: word-by-word typing (opacity steps read as keystrokes) */
  ...Array.from({ length: 7 }, (_, i) => {
    const at = 8 + i * 2
    return (
      `@keyframes bscene-word-${i}{0%,${at}%{opacity:0}${at + 0.6}%,94%{opacity:1}100%{opacity:0}}` +
      `.bscene-word-${i}{animation:bscene-word-${i} 9s linear infinite}`
    )
  }),
  /* transient props — base opacity-0, gone from the final frame */
  `@keyframes bscene-dots{0%,23%{opacity:0;transform:translateY(6px)}26%,40%{opacity:1;transform:none}44%,100%{opacity:0;transform:none}}` +
    `.bscene-dots{animation:bscene-dots 9s ${EASE} infinite}`,
  `@keyframes bscene-dot{0%,100%{opacity:0.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-2px)}}` +
    `.bscene-dot{animation:bscene-dot 0.9s ease-in-out infinite}`,
  `@keyframes bscene-bar{0%,46%{transform:scaleX(0.05)}88%,100%{transform:scaleX(1)}}` +
    `.bscene-bar{animation:bscene-bar 9s ${EASE} infinite;transform-origin:left}`,
  `@keyframes bscene-cursor{0%,19%{opacity:0;transform:translate(96px,70px)}24%{opacity:1;transform:translate(84px,60px)}36%,42%{opacity:1;transform:translate(0,0)}47%,100%{opacity:0;transform:translate(0,0)}}` +
    `.bscene-cursor{animation:bscene-cursor 9s ${EASE} infinite}`,
  `@keyframes bscene-press{0%,37%{transform:scale(1)}39.5%{transform:scale(0.93)}42%,100%{transform:scale(1)}}` +
    `.bscene-press{animation:bscene-press 9s ${EASE} infinite}`,
  `@keyframes bscene-ripple{0%,37%{opacity:0;transform:scale(0.3)}40%{opacity:0.5;transform:scale(0.7)}50%,100%{opacity:0;transform:scale(2.4)}}` +
    `.bscene-ripple{animation:bscene-ripple 9s ease-out infinite}`,
  `@keyframes bscene-stamp{0%,73%{opacity:0;transform:scale(1.45)}77%,94%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1)}}` +
    `.bscene-stamp{animation:bscene-stamp 9s ${EASE} infinite}`,
  /* controls */
  `.bscene-root[data-paused] *{animation-play-state:paused!important}`,
  `@media (prefers-reduced-motion:reduce){.bscene-root *{animation:none!important}}`,
].join('\n')

/* ── Shared wrapper ─────────────────────────────────────────────────────── */

const MONO = 'font-mono text-[9px] uppercase tracking-[0.14em]'

function Scene({
  title,
  children,
  className = '',
}: {
  /** Screen-reader summary of the story — the stage itself is decorative. */
  title: string
  children: ReactNode
  className?: string
}) {
  const [paused, setPaused] = useState(false)
  return (
    <div
      data-paused={paused ? '' : undefined}
      className={`bscene-root relative flex min-h-[400px] items-center justify-center overflow-hidden rounded-[2rem] bg-[#0E1B33] p-8 sm:p-10 md:min-h-[460px] ${className}`}
    >
      {/* React 19 hoists + dedupes by href, so N scenes share one style tag */}
      <style href="bscene" precedence="medium">
        {SCENE_CSS}
      </style>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_35%,rgba(59,130,246,0.10),transparent_70%)]"
      />
      <div role="img" aria-label={title} className="relative w-full">
        <div aria-hidden className="w-full select-none">
          {children}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? 'Play animation' : 'Pause animation'}
        className="absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/[0.08] transition-colors hover:bg-black/80"
      >
        {paused ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
            <path d="M2.5 1.6a1 1 0 011.52-.85l7 4.4a1 1 0 010 1.7l-7 4.4A1 1 0 012.5 10.4z" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
            <rect x="1.5" y="0.5" width="3" height="11" rx="1" />
            <rect x="7.5" y="0.5" width="3" height="11" rx="1" />
          </svg>
        )}
      </button>
    </div>
  )
}

/* ── Scene 1 — run ads: card → budget → campaign ON → lead answers ─────── */

export function SceneRunAds({ className = '' }: { className?: string }) {
  return (
    <Scene
      className={className}
      title="A project card appears, a daily budget is capped, the campaign goes live, and a WhatsApp lead is answered in 54 seconds."
    >
      <div className="relative mx-auto w-full max-w-[340px]">
        {/* beat 4: the lead lands — drops in like a notification */}
        <div className="absolute -top-2 right-0 w-[180px]">
          <div className="bscene-drop rounded-2xl rounded-tr-sm bg-[#0E3B2E] px-3 py-2 ring-1 ring-white/[0.08] shadow-[0_18px_50px_-18px_rgba(0,0,0,0.8)]">
            <p dir="rtl" className="text-[11px] leading-snug text-white">
              مرحباً، مهتم بالمشروع
            </p>
            <p className={`mt-0.5 text-right ${MONO} text-white/40`}>2:47 AM</p>
          </div>
          <div className="bscene-in-e mt-1.5 flex justify-end">
            <span
              className={`rounded-full bg-[#3B82F6]/15 px-2 py-0.5 ${MONO} text-[#60A5FA] ring-1 ring-[#3B82F6]/25`}
            >
              answered in 54s
            </span>
          </div>
        </div>

        <div className="pt-16">
          {/* beat 1: the project card */}
          <div className="bscene-in-a w-[232px] rounded-xl bg-[#0F131A] p-3 ring-1 ring-white/[0.06] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
            <div className="h-20 rounded-lg bg-gradient-to-br from-[#1E3A5F] via-[#16283F] to-[#0B1220]" />
            <div className="mt-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold tracking-tight text-white">
                  Narenj Villas · Masaar 2
                </p>
                <p className="mt-0.5 font-mono text-[10px] tabular-nums text-[#94A3B8]">AED 540K</p>
              </div>
              <span className="shrink-0 rounded-md bg-[#3B82F6]/15 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[#60A5FA] ring-1 ring-[#3B82F6]/25">
                85
              </span>
            </div>
          </div>

          {/* beat 2: the cap goes on before anything spends */}
          <div
            className={`bscene-in-b mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 ${MONO} text-[#94A3B8] ring-1 ring-white/[0.06]`}
          >
            AED 300/day · cap
          </div>

          {/* beat 3: the campaign row goes ON, spend fills in */}
          <div className="bscene-in-c mt-3 w-full max-w-[264px] rounded-xl bg-[#0F131A] p-3 ring-1 ring-white/[0.06]">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[10px] font-semibold tracking-tight text-white">
                Narenj Villas — Leads
              </p>
              <span className={`shrink-0 rounded-full bg-[#34D399]/15 px-1.5 py-px ${MONO} text-[8px] text-[#34D399] ring-1 ring-[#34D399]/25`}>
                On
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="bscene-bar h-full w-[78%] rounded-full bg-[#3B82F6]" />
            </div>
            <p className="mt-1.5 font-mono text-[9px] tabular-nums text-[#64748B]">
              AED 212 spent · 4 leads · AED 53/lead
            </p>
          </div>
        </div>
      </div>
    </Scene>
  )
}

/* ── Scene 2 — one chat message builds a landing page ──────────────────── */

const CHAT_WORDS = ['Create', 'a', 'landing', 'page', 'for', 'Narenj', 'Villas']

export function SceneChatBuilds({ className = '' }: { className?: string }) {
  return (
    <Scene
      className={className}
      title="A chat message asks for a landing page for Narenj Villas; the page assembles piece by piece and passes the quality gate."
    >
      <div className="mx-auto w-full max-w-[320px]">
        {/* beat 1: the ask, typed word by word */}
        <div className="flex justify-end">
          <div className="bscene-in-a max-w-[260px] rounded-2xl rounded-br-sm bg-[#1B2F55] px-3 py-2 ring-1 ring-[#3B82F6]/20">
            <p className="text-[11px] leading-snug text-white">
              {CHAT_WORDS.map((w, i) => (
                <span key={i} className={`bscene-word-${i}`}>
                  {w}
                  {i < CHAT_WORDS.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* beat 2: thinking — transient, absent from the final frame */}
        <div className="bscene-dots mt-2 inline-flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[#0F131A] px-3 py-2.5 opacity-0 ring-1 ring-white/[0.06]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="bscene-dot h-1.5 w-1.5 rounded-full bg-[#7C8B9D]"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        {/* beat 3: the page skeleton fills in */}
        <div className="bscene-frame relative mt-4 rounded-xl bg-[#0F131A] p-3 ring-1 ring-white/[0.06] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
          <div className="bscene-p1 flex h-14 items-end rounded-lg bg-gradient-to-br from-[#1E3A5F] via-[#16283F] to-[#0B1220] p-2">
            <span className="h-2 w-1/2 rounded-full bg-white/[0.14]" />
          </div>
          <div className="bscene-p2 mt-2 flex items-center justify-between">
            <span className="h-2 w-16 rounded-full bg-white/[0.08]" />
            <span className="font-mono text-[9px] tabular-nums text-[#94A3B8]">AED 540K</span>
          </div>
          <div className="bscene-p3 mt-2 grid grid-cols-3 gap-2">
            <span className="h-10 rounded-md bg-white/[0.05]" />
            <span className="h-10 rounded-md bg-white/[0.05]" />
            <span className="h-10 rounded-md bg-white/[0.05]" />
          </div>
          <div className="bscene-p4 mt-2 space-y-1.5">
            <span className="block h-6 rounded-md bg-white/[0.04] ring-1 ring-white/[0.06]" />
            <span className="block h-6 rounded-md bg-white/[0.04] ring-1 ring-white/[0.06]" />
            <span className="flex h-7 items-center justify-center gap-1.5 rounded-md bg-[#34D399]/20 text-[9px] font-semibold text-[#34D399]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M21 11.5a8.5 8.5 0 01-12.4 7.5L3 21l2-5.6A8.5 8.5 0 1121 11.5z" />
              </svg>
              WhatsApp
            </span>
          </div>
          {/* beat 4: the gate stamp */}
          <span
            className={`bscene-stamp absolute -top-2 right-3 rounded-full bg-[#34D399]/15 px-2 py-0.5 ${MONO} text-[#34D399] ring-1 ring-[#34D399]/25`}
          >
            gate: passed ✓
          </span>
        </div>
      </div>
    </Scene>
  )
}

/* ── Scene 3 — one click turns a listing into a 9:16 story ─────────────── */

export function SceneOneClickStory({ className = '' }: { className?: string }) {
  return (
    <Scene
      className={className}
      title="A cursor clicks Story on an inventory card and a 9:16 story frame pops out, ready to post."
    >
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        {/* beat 1: the inventory card */}
        <div className="bscene-in-a w-[176px] rounded-xl bg-[#0F131A] p-3 ring-1 ring-white/[0.06] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] sm:w-[216px]">
          <div className="h-20 rounded-lg bg-gradient-to-br from-[#1E3A5F] via-[#16283F] to-[#0B1220] sm:h-24" />
          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold tracking-tight text-white">
                Narenj Villas
              </p>
              <p className="mt-0.5 font-mono text-[10px] tabular-nums text-[#94A3B8]">AED 540K</p>
            </div>
            <span className="shrink-0 rounded-md bg-[#3B82F6]/15 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[#60A5FA] ring-1 ring-[#3B82F6]/25">
              85
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2">
            <span className={`${MONO} text-[#64748B]`}>Inventory</span>
            <span className="relative inline-flex">
              {/* beats 2: cursor glides in, presses, ripples */}
              <span className="bscene-press inline-flex rounded-md bg-[#3B82F6] px-2.5 py-1 text-[10px] font-semibold tracking-tight text-white">
                Story
              </span>
              <span
                aria-hidden
                className="bscene-ripple absolute left-1/2 top-1/2 -ml-3 -mt-3 h-6 w-6 rounded-full bg-white/40 opacity-0"
              />
              <span
                aria-hidden
                className="bscene-cursor absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full bg-white opacity-0 shadow-[0_2px_8px_rgba(0,0,0,0.6)] ring-1 ring-black/40"
              />
            </span>
          </div>
        </div>

        {/* beat 3: the 9:16 story pops out */}
        <div className="w-[96px] sm:w-[120px]">
          <div className="bscene-story relative aspect-[9/16] overflow-hidden rounded-xl ring-1 ring-white/[0.08] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#2A4A73] via-[#16283F] to-[#0A0E14]" />
            <span className={`absolute left-2 top-2 rounded bg-black/40 px-1 py-px ${MONO} text-[8px] text-white/60`}>
              9:16
            </span>
            <div className="absolute inset-x-0 bottom-0 p-2">
              <p className="text-[9px] font-semibold tracking-tight text-white">Narenj Villas</p>
              <p className="font-mono text-[8px] tabular-nums text-white/60">AED 540K</p>
              <div className="mt-1.5 flex justify-center">
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[8px] text-white">
                  ↑ Swipe up
                </span>
              </div>
            </div>
          </div>
          {/* beat 4 */}
          <div className="bscene-in-e mt-2 flex justify-center">
            <span
              className={`rounded-full bg-[#34D399]/15 px-2 py-0.5 ${MONO} text-[#34D399] ring-1 ring-[#34D399]/25`}
            >
              ready to post
            </span>
          </div>
        </div>
      </div>
    </Scene>
  )
}
