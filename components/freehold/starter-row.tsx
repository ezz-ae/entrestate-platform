'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/i18n/provider'
import { sendToExpert } from '@/lib/freehold/expert-bus'
import { STARTER_DOORS, type StarterDoor } from '@/lib/freehold/hub-starters'

/**
 * THE ROW OF DOORS under the home composer, and the three starters behind each.
 *
 * A door is a labelled icon. Pressing it opens a small sheet ABOVE the row
 * (never a page) with three starters; pressing a starter either hands its
 * own title to the docked Expert or opens a builder — see
 * lib/freehold/hub-starters.ts for the contract. One sheet open at a time;
 * Escape, outside-click and the row losing focus all close it.
 *
 * Phones: the doors scroll horizontally as one strip; the sheet is anchored
 * to the strip, not to the door, so it never runs off-screen.
 */
export function StarterRow() {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState<StarterDoor['id'] | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const door = STARTER_DOORS.find((d) => d.id === open) ?? null

  function run(d: StarterDoor, n: 1 | 2 | 3) {
    const s = d.starters[n - 1]
    setOpen(null)
    if (s.kind === 'href' && s.href) {
      router.push(s.href)
      return
    }
    // The title IS the request — what they read is what is asked.
    sendToExpert(t(`hub.arch.${d.id}.${n}.t`))
  }

  return (
    <div ref={rootRef} className="relative" data-coach="hub-starters">
      {door && (
        <div
          role="dialog"
          aria-label={t(`hub.arch.${door.id}`)}
          className="absolute inset-x-0 bottom-full z-20 mx-auto mb-3 w-full max-w-sm overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <door.Icon className="h-3.5 w-3.5 text-gold" />
            {t(`hub.arch.${door.id}`)}
            <span className="ms-auto font-normal normal-case tracking-normal text-slate-600">{t('hub.arch.starters')}</span>
          </div>
          <div className="p-1.5">
            {door.starters.map((s) => (
              <button
                key={s.n}
                type="button"
                onClick={() => run(door, s.n)}
                className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-start transition hover:bg-white/[0.05]"
              >
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-gold/25 bg-gold/[0.06] text-gold/80 transition group-hover:bg-gold/15 group-hover:text-gold">
                  {s.kind === 'href' ? <ArrowUpRight className="h-3 w-3 rtl:-scale-x-100" /> : <Sparkles className="h-3 w-3" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-100">{t(`hub.arch.${door.id}.${s.n}.t`)}</span>
                  <span className="block text-xs leading-relaxed text-slate-500">{t(`hub.arch.${door.id}.${s.n}.s`)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1 sm:mx-0 sm:justify-center sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STARTER_DOORS.map((d) => {
          const active = open === d.id
          return (
            <button
              key={d.id}
              type="button"
              aria-expanded={active}
              aria-haspopup="dialog"
              onClick={() => setOpen(active ? null : d.id)}
              className={[
                'flex w-[5.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl px-2 py-3 transition',
                active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]',
              ].join(' ')}
            >
              <span className={[
                'grid h-11 w-11 place-items-center rounded-2xl border transition',
                active
                  ? 'border-gold/40 bg-gold/10 text-gold'
                  : 'border-line-strong bg-surface-2 text-slate-300 group-hover:text-white',
              ].join(' ')}>
                <d.Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <span className={`text-xs ${active ? 'text-white' : 'text-slate-400'}`}>{t(`hub.arch.${d.id}`)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
