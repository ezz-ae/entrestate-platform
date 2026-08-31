'use client'

import { useEffect } from 'react'

/**
 * ENGINE 04 — the browser half of the active/idle telemetry
 * (lib/freehold/behavioral-telemetry.ts is the server half; the schema and
 * the why live there).
 *
 * Mounted once per landing page, inside the Tracker, with the SAME session id
 * the analytics events use — the join that later lets the server link this
 * behaviour to the lead the visitor may become. No lead id ever travels from
 * here: a public page must not be able to write onto a CRM record.
 *
 * What it watches:
 *   · HOVERS on sections marked data-telemetry="…" — buffered, ≥ 1 s only,
 *     flushed in one batch every 5 s and on pagehide (keepalive), with the
 *     scroll depth and recent mouse velocity at that moment.
 *   · THE IDLE CLOCK — 60 s without input, or the tab being hidden, posts an
 *     idle event; coming back after a hidden tab posts the re-engagement
 *     (focus-after-idle) that Engine 07 reads on duplicate inquiries.
 *
 * Budgets mirror the server's: the buffer stops collecting past
 * MAX_EVENTS_PER_MOUNT so a jittery mouse cannot turn one visitor into a
 * write storm — the server clamps and budgets again regardless.
 */

export const IDLE_AFTER_MS = 60_000
export const FLUSH_EVERY_MS = 5_000
const MIN_HOVER_MS = 1_000
const MAX_EVENTS_PER_MOUNT = 60

interface HoverEvent {
  elementId: string
  hoverDurationMs: number
  scrollDepthPercent: number
  mouseVelocityPxMs: number
}

export function useBehavioralTelemetry({ sessionId }: { sessionId: string }) {
  useEffect(() => {
    if (!sessionId) return

    const buffer: HoverEvent[] = []
    let sent = 0
    const moves: { x: number; y: number; t: number }[] = []
    let lastActive = Date.now()
    let idleTimer: number | null = null
    let hiddenAt: number | null = null
    let hoverEl: string | null = null
    let hoverStart = 0

    const post = (kind: 'active' | 'idle' | 'reengage', payload: Record<string, unknown>) => {
      try {
        void fetch('/api/lp-telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({ kind, sessionId, ...payload }),
        }).catch(() => null)
      } catch { /* telemetry must never surface on the page */ }
    }

    const flush = () => {
      if (!buffer.length) return
      post('active', { events: buffer.splice(0, buffer.length) })
    }

    const scrollPercent = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      return max > 0 ? Math.min(100, Math.max(0, Math.round((window.scrollY / max) * 100))) : 0
    }

    const velocity = () => {
      if (moves.length < 2) return 0
      let dist = 0
      for (let i = 1; i < moves.length; i++) {
        dist += Math.hypot(moves[i].x - moves[i - 1].x, moves[i].y - moves[i - 1].y)
      }
      const ms = moves[moves.length - 1].t - moves[0].t
      return ms > 0 ? dist / ms : 0
    }

    const armIdleClock = () => {
      if (idleTimer) window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        post('idle', { idleDurationSeconds: Math.round((Date.now() - lastActive) / 1000), triggeredByTabHide: false })
      }, IDLE_AFTER_MS)
    }

    const onMove = (e: MouseEvent) => {
      lastActive = Date.now()
      moves.push({ x: e.clientX, y: e.clientY, t: lastActive })
      if (moves.length > 10) moves.shift()
      armIdleClock()
    }

    const onHover = (el: Element, entering: boolean) => {
      const id = el.getAttribute('data-telemetry') || ''
      const now = Date.now()
      if (entering) {
        hoverEl = id
        hoverStart = now
        return
      }
      if (hoverEl !== id) return
      const duration = now - hoverStart
      hoverEl = null
      if (duration < MIN_HOVER_MS || sent + buffer.length >= MAX_EVENTS_PER_MOUNT) return
      buffer.push({
        elementId: id,
        hoverDurationMs: duration,
        scrollDepthPercent: scrollPercent(),
        mouseVelocityPxMs: Math.round(velocity() * 100) / 100,
      })
      sent += 1
    }

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
        flush()
        post('idle', { idleDurationSeconds: Math.round((Date.now() - lastActive) / 1000), triggeredByTabHide: true })
      } else if (hiddenAt !== null) {
        hiddenAt = null
        lastActive = Date.now()
        post('reengage', {})
        armIdleClock()
      }
    }

    const enters: Array<[Element, EventListener]> = []
    const leaves: Array<[Element, EventListener]> = []
    document.querySelectorAll('[data-telemetry]').forEach((el) => {
      const enter: EventListener = () => onHover(el, true)
      const leave: EventListener = () => onHover(el, false)
      el.addEventListener('mouseenter', enter)
      el.addEventListener('mouseleave', leave)
      enters.push([el, enter])
      leaves.push([el, leave])
    })

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    const flusher = window.setInterval(flush, FLUSH_EVERY_MS)
    const onPageHide = () => flush()
    window.addEventListener('pagehide', onPageHide)
    armIdleClock()

    return () => {
      flush()
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      enters.forEach(([el, fn]) => el.removeEventListener('mouseenter', fn))
      leaves.forEach(([el, fn]) => el.removeEventListener('mouseleave', fn))
      window.clearInterval(flusher)
      if (idleTimer) window.clearTimeout(idleTimer)
    }
  }, [sessionId])
}
