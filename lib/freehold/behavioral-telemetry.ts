/**
 * ENGINE 04 — ACTIVE / IDLE MICRO-BEHAVIOURAL TELEMETRY, the server side.
 *
 * The landing tracker already records milestones (scroll depth, dwell, CTA
 * clicks — app/lp/[slug]/_tracker.tsx → freehold_site_lp_analytics). What it
 * could not say is HOW a visitor read: whether they parked on the payment
 * plan for twenty seconds or flew past it, whether the tab went idle and —
 * the signal Engine 07 asks for by name — whether they CAME BACK to it.
 * A person who re-focuses an idle tab on a property page is choosing to
 * return to this exact property with nobody prompting them.
 *
 * Two tables (the spec's active_telemetry / idle_telemetry, carried in this
 * repo's naming):
 *
 *   freehold_site_active_telemetry   one row per meaningful hover (≥ 1 s) on
 *                                    a section marked data-telemetry, with
 *                                    scroll depth and mouse velocity at that
 *                                    moment.
 *   freehold_site_idle_telemetry     one row per idle event — the 60-second
 *                                    silence clock, or the tab being hidden —
 *                                    and re_engaged flipped true when the
 *                                    visitor comes back (focus-after-idle).
 *
 * ONE DELIBERATE DEPARTURE FROM THE PASTE-READY GUIDE
 * (docs/spec/telemetry-implementation-guide.md): the guide's ingestion route
 * accepts a leadId from the browser. A public page must never be able to
 * stamp behaviour onto an arbitrary CRM record, so rows are written
 * SESSION-KEYED ONLY, and the lead linkage happens server-side at the moment
 * a lead is actually created with that session (linkTelemetryToLead, called
 * from /api/leads) — the same trust boundary lp_session_id already follows.
 *
 * WHAT THE RATE READS (telemetrySignals):
 *   · premiumHover    ≥ PREMIUM_HOVER_MS on a premium section (payment plan,
 *                     ROI, DLD comparables) — the guide's "> 15 s on the ROI
 *                     calculator" rate-bump input, Engine 06 Phase 4.1.
 *   · focusAfterIdle  a re-engaged idle event — Engine 07 §3.1's "Parallel
 *                     Telemetry Validation" input on duplicate inquiries.
 *
 * Everything here is fail-soft: a telemetry miss is a quieter signal, never
 * a broken page or a lost lead.
 */
import { randomUUID } from 'node:crypto'
import { query, ensureOnce } from '@/lib/db'

/** Sections whose sustained reading is an investment signal, not browsing. */
export const PREMIUM_TELEMETRY_ELEMENTS = ['roi', 'payment-plan', 'dld-comparables'] as const

/** The guide's threshold: a hover this long on a premium section reads as intent. */
export const PREMIUM_HOVER_MS = 15_000

/** A hover shorter than this is a mouse passing through, not reading. */
export const MIN_HOVER_MS = 1_000

/** Hard caps on what the public door will write — clamped, never trusted. */
export const MAX_HOVER_MS = 30 * 60_000
export const MAX_IDLE_SECONDS = 8 * 60 * 60
/** Per-session row budget: past this the door acknowledges and drops. */
export const SESSION_ROW_BUDGET = 500

export const ensureTelemetryTables = () =>
  ensureOnce('behavioral-telemetry', async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS freehold_site_active_telemetry (
        id                   text PRIMARY KEY,
        lead_id              text,
        session_id           text NOT NULL,
        element_id           text NOT NULL,
        hover_duration_ms    integer NOT NULL,
        scroll_depth_percent double precision,
        mouse_velocity_px_ms double precision,
        created_at           timestamptz NOT NULL DEFAULT now()
      )
    `)
    await query(`
      CREATE TABLE IF NOT EXISTS freehold_site_idle_telemetry (
        id                    text PRIMARY KEY,
        lead_id               text,
        session_id            text NOT NULL,
        idle_duration_seconds integer NOT NULL,
        triggered_by_tab_hide boolean NOT NULL DEFAULT false,
        re_engaged            boolean NOT NULL DEFAULT false,
        created_at            timestamptz NOT NULL DEFAULT now()
      )
    `)
    await query(`CREATE INDEX IF NOT EXISTS freehold_active_telemetry_session_idx ON freehold_site_active_telemetry (session_id)`)
    await query(`CREATE INDEX IF NOT EXISTS freehold_active_telemetry_lead_idx ON freehold_site_active_telemetry (lead_id) WHERE lead_id IS NOT NULL`)
    await query(`CREATE INDEX IF NOT EXISTS freehold_idle_telemetry_session_idx ON freehold_site_idle_telemetry (session_id)`)
    await query(`CREATE INDEX IF NOT EXISTS freehold_idle_telemetry_lead_idx ON freehold_site_idle_telemetry (lead_id) WHERE lead_id IS NOT NULL`)
  })

const clamp = (n: unknown, lo: number, hi: number): number | null => {
  const v = Number(n)
  if (!Number.isFinite(v)) return null
  return Math.min(hi, Math.max(lo, Math.round(v)))
}

/** element ids come from the page's own data-telemetry attributes — slugged
 *  and bounded so a hostile client cannot write prose into the column. */
const cleanElementId = (v: unknown): string | null => {
  const s = String(v ?? '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64)
  return s || null
}

const cleanSessionId = (v: unknown): string | null => {
  const s = String(v ?? '').trim().slice(0, 100)
  return /^[a-z0-9]{8,}$/i.test(s) ? s : null
}

async function withinBudget(table: 'freehold_site_active_telemetry' | 'freehold_site_idle_telemetry', sessionId: string): Promise<boolean> {
  try {
    const [row] = await query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM ${table} WHERE session_id = $1`, [sessionId],
    )
    return (Number(row?.n) || 0) < SESSION_ROW_BUDGET
  } catch { return false }
}

export interface ActiveTelemetryEvent {
  elementId: string
  hoverDurationMs: number
  scrollDepthPercent?: number | null
  mouseVelocityPxMs?: number | null
}

/** Write a batch of hover events for one session. Returns rows written. */
export async function recordActiveTelemetry(sessionId: unknown, events: unknown): Promise<number> {
  const sid = cleanSessionId(sessionId)
  if (!sid || !Array.isArray(events) || events.length === 0) return 0
  await ensureTelemetryTables()
  if (!(await withinBudget('freehold_site_active_telemetry', sid))) return 0
  let written = 0
  for (const raw of events.slice(0, 20)) {
    const e = (raw ?? {}) as Record<string, unknown>
    const elementId = cleanElementId(e.elementId)
    const hover = clamp(e.hoverDurationMs, MIN_HOVER_MS, MAX_HOVER_MS)
    if (!elementId || hover === null) continue
    const scroll = clamp(e.scrollDepthPercent, 0, 100)
    const velocity = clamp(Number(e.mouseVelocityPxMs) * 100, 0, 5000) // 2 dp, capped
    await query(
      `INSERT INTO freehold_site_active_telemetry
         (id, session_id, element_id, hover_duration_ms, scroll_depth_percent, mouse_velocity_px_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), sid, elementId, hover, scroll, velocity === null ? null : velocity / 100],
    ).then(() => { written += 1 }).catch(() => undefined)
  }
  return written
}

export async function recordIdleTelemetry(sessionId: unknown, input: { idleDurationSeconds?: unknown; triggeredByTabHide?: unknown }): Promise<boolean> {
  const sid = cleanSessionId(sessionId)
  if (!sid) return false
  await ensureTelemetryTables()
  if (!(await withinBudget('freehold_site_idle_telemetry', sid))) return false
  const idle = clamp(input.idleDurationSeconds, 0, MAX_IDLE_SECONDS)
  if (idle === null) return false
  return query(
    `INSERT INTO freehold_site_idle_telemetry (id, session_id, idle_duration_seconds, triggered_by_tab_hide)
     VALUES ($1, $2, $3, $4)`,
    [randomUUID(), sid, idle, input.triggeredByTabHide === true],
  ).then(() => true).catch(() => false)
}

/**
 * FOCUS-AFTER-IDLE — the visitor came back. Flips the latest un-re-engaged
 * idle row for the session; a return with no recorded idle is a no-op.
 */
export async function markReEngaged(sessionId: unknown): Promise<boolean> {
  const sid = cleanSessionId(sessionId)
  if (!sid) return false
  await ensureTelemetryTables()
  const rows = await query<{ id: string }>(
    `UPDATE freehold_site_idle_telemetry SET re_engaged = true
      WHERE id = (SELECT id FROM freehold_site_idle_telemetry
                   WHERE session_id = $1 AND re_engaged = false
                   ORDER BY created_at DESC LIMIT 1)
      RETURNING id`,
    [sid],
  ).catch(() => [] as { id: string }[])
  return rows.length > 0
}

/**
 * The server-side linkage — the ONLY way a lead id lands on telemetry rows.
 * Called by /api/leads once a lead exists with this session. Best-effort.
 */
export async function linkTelemetryToLead(leadId: string, sessionId: string | null | undefined): Promise<void> {
  const sid = cleanSessionId(sessionId)
  if (!sid || !leadId) return
  try {
    await ensureTelemetryTables()
    await query(`UPDATE freehold_site_active_telemetry SET lead_id = $1 WHERE session_id = $2 AND lead_id IS NULL`, [leadId, sid])
    await query(`UPDATE freehold_site_idle_telemetry SET lead_id = $1 WHERE session_id = $2 AND lead_id IS NULL`, [leadId, sid])
  } catch { /* a lost link is a quieter signal, never a lost lead */ }
}

export interface TelemetrySignals {
  /** ≥ PREMIUM_HOVER_MS reading a premium section — the ingest rate bump. */
  premiumHover: boolean
  /** A hidden/idle session the visitor returned to — Engine 07's validator. */
  focusAfterIdle: boolean
  activeEvents: number
  idleEvents: number
}

const NO_SIGNALS: TelemetrySignals = { premiumHover: false, focusAfterIdle: false, activeEvents: 0, idleEvents: 0 }

/** What the behaviour record says about one lead (or its session). One read. */
export async function telemetrySignals(leadId: string | null, sessionId?: string | null): Promise<TelemetrySignals> {
  const sid = cleanSessionId(sessionId ?? '')
  if (!leadId && !sid) return NO_SIGNALS
  try {
    await ensureTelemetryTables()
    const params: unknown[] = [leadId ?? '', sid ?? '', [...PREMIUM_TELEMETRY_ELEMENTS], PREMIUM_HOVER_MS]
    const scope = `(($1 <> '' AND lead_id = $1) OR ($2 <> '' AND session_id = $2))`
    const [active] = await query<{ n: string; premium: string }>(
      `SELECT COUNT(*)::text AS n,
              COUNT(*) FILTER (WHERE element_id = ANY($3::text[]) AND hover_duration_ms >= $4)::text AS premium
         FROM freehold_site_active_telemetry WHERE ${scope}`,
      params,
    )
    const [idle] = await query<{ n: string; back: string }>(
      `SELECT COUNT(*)::text AS n, COUNT(*) FILTER (WHERE re_engaged)::text AS back
         FROM freehold_site_idle_telemetry WHERE ${scope}`,
      params.slice(0, 2),
    )
    return {
      premiumHover: (Number(active?.premium) || 0) > 0,
      focusAfterIdle: (Number(idle?.back) || 0) > 0,
      activeEvents: Number(active?.n) || 0,
      idleEvents: Number(idle?.n) || 0,
    }
  } catch { return NO_SIGNALS }
}
