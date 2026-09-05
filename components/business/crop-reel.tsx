'use client'

/**
 * THE REEL — one crop at a time, large, turning over on its own.
 *
 * The owner: "if the image is cut into several pieces and made into a
 * slider or a GIF, in our colours, without needing to write company names —
 * that is the important part: that he finds the strong options he says yes
 * to." So the hero is not a screenshot; it is a reel of the product's strong
 * options, each one legible on its own, each with one line saying what it
 * is. It turns every few seconds, stops while a hand is on it or a keyboard
 * is in it, and does not move at all for a reader who asked for reduced
 * motion — they get the dots.
 *
 * The frames are server-rendered crops passed in as nodes; this component
 * only decides which one is showing.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface ReelFrame {
  key: string
  /** One line under the crop — what this is, in the reader's words. */
  caption: string
  node: ReactNode
}

const TURN_MS = 4800

export function CropReel({ frames, className = '' }: { frames: ReelFrame[]; className?: string }) {
  const [i, setI] = useState(0)
  const [held, setHeld] = useState(false)
  const [still, setStill] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Reduced motion → the reel does not turn by itself; the dots still work.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setStill(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (held || still || frames.length < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % frames.length), TURN_MS)
    return () => clearInterval(t)
  }, [held, still, frames.length])

  const current = frames[i] ?? frames[0]

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={(e) => { if (!rootRef.current?.contains(e.relatedTarget as Node)) setHeld(false) }}
      aria-roledescription="carousel"
      aria-label="The product, piece by piece"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -inset-y-14 -z-10 rounded-[40px] bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--brand)_10%,transparent),transparent_65%)]"
      />
      {/* Every frame sits in the same grid cell, so the reel is as tall as
          its tallest frame and the caption never jumps when it turns. */}
      <div className="grid">
        {frames.map((f, n) => (
          <div
            key={f.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${n + 1} of ${frames.length}: ${f.caption}`}
            aria-hidden={n !== i}
            className={`col-start-1 row-start-1 self-start ${n === i ? 'opacity-100' : 'pointer-events-none opacity-0'} transition-opacity duration-500 motion-reduce:transition-none`}
          >
            {f.node}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="min-w-0 text-[0.875rem] leading-snug text-ink-muted" aria-live="polite">{current?.caption}</p>
        <div className="flex shrink-0 items-center gap-1.5" role="tablist" aria-label="Frames">
          {frames.map((f, n) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={n === i}
              aria-label={f.caption}
              onClick={() => setI(n)}
              className={`h-1.5 rounded-full transition-all ${n === i ? 'w-6 bg-brand' : 'w-1.5 bg-line-strong hover:bg-ink-faint'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
