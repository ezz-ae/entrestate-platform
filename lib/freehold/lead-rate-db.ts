/**
 * ENGINE 06 + 07, THE WRITE SIDE — where the Rate lands on the row and the
 * gates act.
 *
 * lib/freehold/lead-rate.ts decides; this module gathers the facts it needs,
 * writes the decision, and keeps the two records the spec calls immutable:
 *
 *   freehold_site_lead_status_history   every pipeline transition — lead,
 *                                       actor, from, to, the exact second.
 *                                       The anomaly gate reads it; nothing
 *                                       updates or deletes a row.
 *   freehold_site_lead_rate_ledger      every rate change and every ICI
 *                                       calculation — from, to, the reason,
 *                                       what triggered it, the coefficients.
 *
 * On the lead row itself: rate, rate_reason, rate_updated_at (last CHANGE),
 * rate_checked_at (last evaluation — the decay sweep paces on it), master_lead
 * (the human 10), convergent_at + neglect_deadline_at (Engine 07's clock), and
 * seed_quarantined_at (+ reason) which lib/freehold/lead-evidence.ts honours
 * before any audience is built.
 *
 * EVERYTHING HERE IS BEST-EFFORT AT THE CALL SITE. A lead must never fail to
 * arrive, and a broker's status change must never 500, because a rate could
 * not be written. Callers `void` these; each function catches its own errors
 * and logs them, so a missing table on a fresh tenant is a console line, not
 * a lost lead.
 *
 * WHO MAY DO WHAT, restated as code (the spec's Human-in-the-Loop cap):
 *   · setMasterLead — management roles only, and only through the API route.
 *   · 9 is written only when computeLeadRate sees a won status or a closed
 *     deal record, both human acts.
 *   · The gates (neglect, anomaly) act as 'system' and every action they take
 *     is a line in the authority log a manager can read and argue with.
 */
import { randomUUID } from 'node:crypto'
import { query, ensureOnce } from '@/lib/db'
import { ensureLeadsTable, ensureLeadActivityTable } from '@/lib/data'
import { getWorkspaceConfig } from '@/lib/automation/db'
import { pickAgentForLead } from '@/lib/automation/distribution'
import {
  emailLeadMovementToInbox, getLeadershipLeadRecipients, notifyBrokerOfAssignedLead, sendSystemEmail,
} from '@/lib/transactional-email'
import { getSiteUrl } from '@/lib/site'
import { CONTACT_ACTIVITY } from '@/lib/freehold/authority'
import { logAuthority } from '@/lib/freehold/authority-db'
import { notify } from '@/lib/freehold/notifications'
import {
  computeLeadRate, RATE_WON, type RateFacts, type RateResult, type RateReason,
} from '@/lib/freehold/lead-rate'
import { detectBulkStatusEvent, BULK_STATUS_WINDOW_MINUTES, type StatusTransition } from '@/lib/freehold/anomaly-gate'
import { telemetrySignals } from '@/lib/freehold/behavioral-telemetry'
import { triggerLearningLoop } from '@/lib/freehold/learning-loop'

/** Engine 07 §3.1: a convergent buyer must be touched inside this window. */
export const NEGLECT_WINDOW_MINUTES = 15

/** What may cause a recompute — stored on the ledger so a rate can be traced. */
export const RATE_TRIGGERS = [
  'ingest', 'inbound_touch', 'crm_patch', 'activity', 'viewing', 'deal', 'master_flag',
  'redistribute', 'decay_sweep', 'manual', 'anomaly_gate',
] as const
export type RateTrigger = (typeof RATE_TRIGGERS)[number]

const OPEN_STATUSES = ['new', 'contacted', 'qualified', 'viewing', 'negotiation']
const SYSTEM_ACTOR = 'system'

export const ensureLeadRateSchema = () =>
  ensureOnce('lead-rate-schema', async () => {
    await ensureLeadsTable()
    await ensureLeadActivityTable()
    // behaviour_score / buyer_intent / click_intent are written by the landing
    // door and read here on every tenant, so they belong to the row's shape.
    await query(`
      ALTER TABLE freehold_site_leads
        ADD COLUMN IF NOT EXISTS rate numeric(3,1),
        ADD COLUMN IF NOT EXISTS rate_reason text,
        ADD COLUMN IF NOT EXISTS rate_updated_at timestamptz,
        ADD COLUMN IF NOT EXISTS rate_checked_at timestamptz,
        ADD COLUMN IF NOT EXISTS master_lead boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS convergent_at timestamptz,
        ADD COLUMN IF NOT EXISTS neglect_deadline_at timestamptz,
        ADD COLUMN IF NOT EXISTS seed_quarantined_at timestamptz,
        ADD COLUMN IF NOT EXISTS seed_quarantine_reason text,
        ADD COLUMN IF NOT EXISTS value_rating int,
        ADD COLUMN IF NOT EXISTS behaviour_score int,
        ADD COLUMN IF NOT EXISTS buyer_intent text,
        ADD COLUMN IF NOT EXISTS click_intent text,
        ADD COLUMN IF NOT EXISTS lp_session_id text
    `)
    await query(`
      CREATE TABLE IF NOT EXISTS freehold_site_lead_status_history (
        id          text PRIMARY KEY,
        lead_id     text NOT NULL,
        actor       text,
        actor_role  text,
        from_status text,
        to_status   text,
        created_at  timestamptz NOT NULL DEFAULT now()
      )
    `)
    await query(`CREATE INDEX IF NOT EXISTS freehold_lead_status_history_actor_idx ON freehold_site_lead_status_history (actor, created_at DESC)`)
    await query(`CREATE INDEX IF NOT EXISTS freehold_lead_status_history_lead_idx ON freehold_site_lead_status_history (lead_id, created_at DESC)`)
    await query(`
      CREATE TABLE IF NOT EXISTS freehold_site_lead_rate_ledger (
        id         text PRIMARY KEY,
        lead_id    text NOT NULL,
        from_rate  numeric(3,1),
        to_rate    numeric(3,1),
        reason     text,
        trigger    text,
        actor      text,
        detail     jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await query(`CREATE INDEX IF NOT EXISTS freehold_lead_rate_ledger_lead_idx ON freehold_site_lead_rate_ledger (lead_id, created_at DESC)`)
    await query(`CREATE INDEX IF NOT EXISTS freehold_leads_neglect_idx ON freehold_site_leads (neglect_deadline_at) WHERE neglect_deadline_at IS NOT NULL`)
  })

// ── The ledgers ───────────────────────────────────────────────────────────────

export async function recordStatusTransition(entry: {
  leadId: string
  actor: string
  actorRole?: string | null
  fromStatus: string | null
  toStatus: string | null
}): Promise<void> {
  try {
    await ensureLeadRateSchema()
    await query(
      `INSERT INTO freehold_site_lead_status_history (id, lead_id, actor, actor_role, from_status, to_status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [`sh_${randomUUID()}`, entry.leadId, entry.actor, entry.actorRole ?? null, entry.fromStatus, entry.toStatus],
    )
  } catch (err) {
    console.error('[lead-rate] status history write failed', err)
  }
}

export async function writeRateLedger(entry: {
  leadId: string
  fromRate: number | null
  toRate: number | null
  reason: string
  trigger: RateTrigger
  actor?: string | null
  detail?: Record<string, unknown>
}): Promise<void> {
  try {
    await ensureLeadRateSchema()
    await query(
      `INSERT INTO freehold_site_lead_rate_ledger (id, lead_id, from_rate, to_rate, reason, trigger, actor, detail)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        `rl_${randomUUID()}`, entry.leadId, entry.fromRate, entry.toRate, entry.reason, entry.trigger,
        entry.actor ?? SYSTEM_ACTOR, JSON.stringify(entry.detail ?? {}),
      ],
    )
  } catch (err) {
    console.error('[lead-rate] ledger write failed', err)
  }
}

async function logLeadActivity(leadId: string, type: string, description: string, actor = SYSTEM_ACTOR): Promise<void> {
  try {
    await ensureLeadActivityTable()
    await query(
      `INSERT INTO freehold_site_lead_activity (id, lead_id, activity_type, description, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [randomUUID(), leadId, type, description, actor],
    )
  } catch (err) {
    console.error('[lead-rate] activity write failed', err)
  }
}

// ── The facts, in one read ───────────────────────────────────────────────────

interface FactRow {
  status: string | null
  blocked: boolean | null
  master_lead: boolean | null
  value_rating: number | string | null
  behaviour_score: number | string | null
  buyer_intent: string | null
  click_intent: string | null
  interest: string | null
  message: string | null
  phone: string | null
  email: string | null
  utm_source: string | null
  budget_aed: number | string | null
  convergent_at: string | null
  created_at: string
  last_contact_at: string | null
  value_rated_at: string | null
  lp_session_id: string | null
  rate: number | string | null
  rate_reason: string | null
  assigned_broker_id: string | null
  name: string | null
  contact_count: number | string
  viewing_scheduled: boolean
  viewing_held: boolean
  offer_made: boolean
  last_activity_at: string | null
}

const num = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const latest = (...isos: Array<string | null | undefined>): string | null => {
  let best: string | null = null
  let bestMs = -Infinity
  for (const iso of isos) {
    if (!iso) continue
    const t = new Date(iso).getTime()
    if (Number.isFinite(t) && t > bestMs) { best = iso; bestMs = t }
  }
  return best
}

export interface LoadedFacts {
  facts: RateFacts
  currentRate: number | null
  currentReason: string | null
  assignedBrokerId: string | null
  name: string | null
}

export async function loadRateFacts(leadId: string, now = Date.now()): Promise<LoadedFacts | null> {
  await ensureLeadRateSchema()
  // value_rated_at is created lazily by the CRM rating route; the read must
  // not depend on a column the tenant may not have yet.
  await query(`ALTER TABLE freehold_site_leads ADD COLUMN IF NOT EXISTS value_rated_at timestamptz`).catch(() => undefined)
  const rows = await query<FactRow>(
    `SELECT l.status, l.blocked, l.master_lead, l.value_rating, l.behaviour_score, l.buyer_intent,
            l.click_intent, l.interest, l.message, l.phone, l.email, l.utm_source, l.budget_aed,
            l.convergent_at::text, l.created_at::text, l.last_contact_at::text, l.value_rated_at::text,
            l.rate, l.rate_reason, l.assigned_broker_id, l.name, l.lp_session_id,
            (SELECT COUNT(*) FROM freehold_site_lead_activity a
              WHERE a.lead_id = l.id AND a.activity_type = ANY($2::text[]))::int AS contact_count,
            EXISTS (SELECT 1 FROM freehold_site_lead_activity a
              WHERE a.lead_id = l.id AND a.activity_type = 'viewing_scheduled') AS viewing_scheduled,
            EXISTS (SELECT 1 FROM freehold_site_lead_activity a
              WHERE a.lead_id = l.id AND a.activity_type IN ('viewing_held', 'viewing')) AS viewing_held,
            EXISTS (SELECT 1 FROM freehold_site_lead_activity a
              WHERE a.lead_id = l.id AND a.activity_type = 'offer_made') AS offer_made,
            (SELECT MAX(a.created_at)::text FROM freehold_site_lead_activity a
              WHERE a.lead_id = l.id) AS last_activity_at
       FROM freehold_site_leads l
      WHERE l.id = $1
      LIMIT 1`,
    [leadId, [...CONTACT_ACTIVITY]],
  )
  const r = rows[0]
  if (!r) return null

  // The deal record is the objective win. The deals table is created by its
  // own feature; a tenant that has never opened a deal simply has no wins.
  let dealClosed = false
  try {
    const [d] = await query<{ won: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM freehold_site_deals WHERE lead_id = $1 AND status IN ('approved', 'closed')) AS won`,
      [leadId],
    )
    dealClosed = d?.won === true
  } catch { dealClosed = false }

  // Engine 04's record of how this person actually read the pages — by lead
  // id once /api/leads made the link, by session id before it. Fail-soft.
  const behaviour = await telemetrySignals(leadId, r.lp_session_id).catch(() => ({
    premiumHover: false, focusAfterIdle: false, activeEvents: 0, idleEvents: 0,
  }))

  return {
    facts: {
      status: r.status,
      blocked: r.blocked,
      masterLead: r.master_lead,
      dealClosed,
      valueRating: num(r.value_rating),
      behaviourScore: num(r.behaviour_score),
      buyerIntent: r.buyer_intent,
      clickIntent: r.click_intent,
      premiumEngagement: behaviour.premiumHover,
      focusAfterIdle: behaviour.focusAfterIdle,
      interest: r.interest,
      message: r.message,
      phone: r.phone,
      email: r.email,
      utmSource: r.utm_source,
      budgetAed: num(r.budget_aed),
      contactCount: Number(r.contact_count) || 0,
      viewingScheduled: r.viewing_scheduled === true,
      viewingHeld: r.viewing_held === true,
      offerMade: r.offer_made === true,
      convergentAt: r.convergent_at,
      lastTouchAt: latest(r.last_contact_at, r.last_activity_at, r.convergent_at, r.value_rated_at),
      createdAt: r.created_at,
      now,
    },
    currentRate: num(r.rate),
    currentReason: r.rate_reason,
    assignedBrokerId: r.assigned_broker_id,
    name: r.name,
  }
}

// ── The write ────────────────────────────────────────────────────────────────

export interface RecomputeOutcome {
  leadId: string
  previous: number | null
  result: RateResult
  changed: boolean
}

/**
 * Evaluate one lead and write the result. Idempotent: the same facts produce
 * the same rate and no ledger line. Crossing into 9 fires the learning loop.
 */
export async function recomputeLeadRate(
  leadId: string,
  trigger: RateTrigger,
  opts: { actor?: string | null; detail?: Record<string, unknown>; now?: number } = {},
): Promise<RecomputeOutcome | null> {
  try {
    const loaded = await loadRateFacts(leadId, opts.now)
    if (!loaded) return null
    const result = computeLeadRate(loaded.facts)
    const changed = loaded.currentRate !== result.rate || loaded.currentReason !== result.reason
    if (changed) {
      await query(
        `UPDATE freehold_site_leads
            SET rate = $2, rate_reason = $3, rate_updated_at = now(), rate_checked_at = now()
          WHERE id = $1`,
        [leadId, result.rate, result.reason],
      )
      await writeRateLedger({
        leadId,
        fromRate: loaded.currentRate,
        toRate: result.rate,
        reason: result.reason,
        trigger,
        actor: opts.actor,
        detail: { band: result.band, decayedBy: result.decayedBy, ...(opts.detail ?? {}) },
      })
      // Engine 06 §2.2 — the loop-closure trigger. Once, on the way up.
      if (result.rate >= RATE_WON && (loaded.currentRate === null || loaded.currentRate < RATE_WON)) {
        void triggerLearningLoop(leadId, 'rate_won').catch(() => undefined)
      }
    } else {
      await query(`UPDATE freehold_site_leads SET rate_checked_at = now() WHERE id = $1`, [leadId])
    }
    return { leadId, previous: loaded.currentRate, result, changed }
  } catch (err) {
    console.error('[lead-rate] recompute failed', leadId, err)
    return null
  }
}

/** Several leads, sequentially and best-effort — an import, a sweep. */
export async function recomputeLeadRates(leadIds: readonly string[], trigger: RateTrigger): Promise<number> {
  let changed = 0
  for (const id of leadIds) {
    const out = await recomputeLeadRate(id, trigger)
    if (out?.changed) changed += 1
  }
  return changed
}

/**
 * The human 10. Management only — the route enforces the role; this function
 * records who did it, because a master flag with no name on it is exactly
 * the "fake rating" the spec forbids.
 */
export async function setMasterLead(leadId: string, on: boolean, actor: string): Promise<RecomputeOutcome | null> {
  await ensureLeadRateSchema()
  await query(`UPDATE freehold_site_leads SET master_lead = $2, updated_at = now() WHERE id = $1`, [leadId, on])
  await logLeadActivity(leadId, 'note', on ? 'Marked as a master lead' : 'Master-lead mark removed', actor)
  return recomputeLeadRate(leadId, 'master_flag', { actor })
}

/** The rate as the row holds it, with its ledger — for the API and the card. */
export async function readLeadRate(leadId: string): Promise<{
  rate: number | null
  reason: RateReason | string | null
  updatedAt: string | null
  masterLead: boolean
  convergentAt: string | null
  neglectDeadlineAt: string | null
  seedQuarantinedAt: string | null
  ledger: Array<{ fromRate: number | null; toRate: number | null; reason: string | null; trigger: string | null; actor: string | null; detail: Record<string, unknown>; createdAt: string }>
} | null> {
  await ensureLeadRateSchema()
  const rows = await query<{
    rate: number | string | null; rate_reason: string | null; rate_updated_at: string | null
    master_lead: boolean | null; convergent_at: string | null; neglect_deadline_at: string | null
    seed_quarantined_at: string | null
  }>(
    `SELECT rate, rate_reason, rate_updated_at::text, master_lead, convergent_at::text,
            neglect_deadline_at::text, seed_quarantined_at::text
       FROM freehold_site_leads WHERE id = $1 LIMIT 1`,
    [leadId],
  )
  const r = rows[0]
  if (!r) return null
  const ledger = await query<{
    from_rate: number | string | null; to_rate: number | string | null; reason: string | null
    trigger: string | null; actor: string | null; detail: Record<string, unknown> | null; created_at: string
  }>(
    `SELECT from_rate, to_rate, reason, trigger, actor, detail, created_at::text
       FROM freehold_site_lead_rate_ledger WHERE lead_id = $1
      ORDER BY created_at DESC LIMIT 50`,
    [leadId],
  ).catch(() => [])
  return {
    rate: num(r.rate),
    reason: r.rate_reason,
    updatedAt: r.rate_updated_at,
    masterLead: r.master_lead === true,
    convergentAt: r.convergent_at,
    neglectDeadlineAt: r.neglect_deadline_at,
    seedQuarantinedAt: r.seed_quarantined_at,
    ledger: ledger.map((l) => ({
      fromRate: num(l.from_rate), toRate: num(l.to_rate), reason: l.reason, trigger: l.trigger,
      actor: l.actor, detail: l.detail ?? {}, createdAt: l.created_at,
    })),
  }
}

// ── Redistribution (shared by both gates) ────────────────────────────────────

async function managementEmails(): Promise<string[]> {
  try { return (await getLeadershipLeadRecipients()).emails } catch { return [] }
}

async function tellManagement(input: {
  kind: string
  headline: string
  lines: string[]
  href: string
  meta: Record<string, unknown>
}): Promise<void> {
  const emails = await managementEmails()
  for (const email of emails) {
    await notify('management_alert', { kind: input.kind, ...input.meta }, { recipient: email, href: input.href }).catch(() => {})
  }
  if (emails.length) {
    await sendSystemEmail({
      to: emails,
      subject: input.headline,
      headline: input.headline,
      lines: input.lines,
      ctaLabel: 'Open',
      ctaUrl: `${getSiteUrl()}${input.href}`,
    }).catch(() => undefined)
  }
}

/**
 * Revoke the current owner and hand the lead to the best available closer.
 *
 * The pool is the workspace's configured distribution pool minus the owner
 * being revoked, or every active broker minus them; the strategy is forced
 * to 'performance' (top closers first, lightest load among equals) whatever
 * the workspace normally uses, because both gates exist to rescue a lead the
 * ordinary rotation already failed. Working hours are ignored on purpose: a
 * convergent buyer at 11pm is still a convergent buyer.
 */
export async function redistributeLead(
  leadId: string,
  why: { reason: 'neglect_gate' | 'anomaly_gate'; detail: string; restoreStatus?: string | null },
): Promise<{ to: string | null; from: string | null }> {
  await ensureLeadRateSchema()
  const [lead] = await query<{
    id: string; name: string | null; source: string | null; project_slug: string | null
    interest: string | null; country: string | null; assigned_broker_id: string | null; status: string | null
  }>(
    `SELECT id, name, source, project_slug, interest, country, assigned_broker_id, status
       FROM freehold_site_leads WHERE id = $1 LIMIT 1`,
    [leadId],
  )
  if (!lead) return { to: null, from: null }
  const from = lead.assigned_broker_id

  const cfg = await getWorkspaceConfig().catch(() => null)
  const configuredPool = cfg?.distribution.pool ?? []
  const brokers = configuredPool.length
    ? configuredPool
    : (await query<{ id: string }>(
        `SELECT id FROM freehold_site_users WHERE role = 'broker' AND COALESCE(suspended, false) = false`,
      ).catch(() => [])).map((r) => r.id)
  const pool = brokers.filter((b) => b && b !== from)

  let to: string | null = null
  if (pool.length && cfg) {
    to = await pickAgentForLead(
      {
        ...cfg.distribution,
        mode: 'auto',
        strategy: 'performance',
        pool,
        respectWorkingHours: false,
        maxPerAgentPerDay: 0,
        fallbackBrokerId: pool[0],
      },
      { id: lead.id, source: lead.source, project_slug: lead.project_slug, interest: lead.interest, country: lead.country },
    ).catch(() => null)
  }

  if (!to) {
    // Nobody to hand it to is a management problem, not a silent no-op.
    await tellManagement({
      kind: 'redistribute_nobody',
      headline: `Nobody available to take ${lead.name ?? 'a lead'} — ${why.detail}`,
      lines: [why.detail, 'No other active broker is in the distribution pool.'],
      href: `/freehold-intelligence/crm/leads/${lead.id}`,
      meta: { lead: lead.id, name: lead.name, reason: why.reason },
    })
    await query(`UPDATE freehold_site_leads SET neglect_deadline_at = NULL WHERE id = $1`, [leadId]).catch(() => undefined)
    return { to: null, from }
  }

  await query(
    `UPDATE freehold_site_leads
        SET assigned_broker_id = $2,
            assigned_at = now(),
            neglect_deadline_at = NULL,
            status = COALESCE($3, status),
            updated_at = now()
      WHERE id = $1`,
    [leadId, to, why.restoreStatus ?? null],
  )
  if (why.restoreStatus) {
    await recordStatusTransition({ leadId, actor: SYSTEM_ACTOR, actorRole: 'system', fromStatus: lead.status, toStatus: why.restoreStatus })
  }
  await logLeadActivity(leadId, 'assignment', `Redistributed to ${to}${from ? ` (from ${from})` : ''} — ${why.detail}`)
  await logAuthority({
    actorEmail: SYSTEM_ACTOR,
    actorRole: 'system',
    action: 'lead.redistribute',
    targetType: 'lead',
    targetId: leadId,
    decision: { allowed: true, reason: why.reason },
    detail: `${from ?? 'unassigned'} → ${to}: ${why.detail}`,
  })
  await notify('lead_assigned', { lead: leadId, name: lead.name }, {
    recipient: to, href: `/freehold-intelligence/crm/leads/${leadId}`,
  }).catch(() => {})
  void notifyBrokerOfAssignedLead(to, leadId).catch(() => undefined)
  void emailLeadMovementToInbox('redistributed', { id: leadId, name: lead.name }, `redistributed to ${to} — ${why.detail}`)
  await recomputeLeadRate(leadId, 'redistribute', { detail: { from, to, reason: why.reason } })
  return { to, from }
}

// ── Engine 07 §3.1 — the 15-minute neglect gate ───────────────────────────────

/** Arm the clock on a convergent lead. Idempotent per convergence event. */
export async function armNeglectClock(leadId: string, now = Date.now()): Promise<string> {
  await ensureLeadRateSchema()
  const deadline = new Date(now + NEGLECT_WINDOW_MINUTES * 60_000).toISOString()
  await query(
    `UPDATE freehold_site_leads
        SET convergent_at = $2::timestamptz, neglect_deadline_at = $3::timestamptz, updated_at = now()
      WHERE id = $1`,
    [leadId, new Date(now).toISOString(), deadline],
  )
  return deadline
}

/**
 * The assigned broker opened the card, or logged a contact: the clock stops.
 * Called from the lead page (the owner viewing it) and from the activity
 * routes. Cheap, indexed, and a no-op when nothing is armed.
 */
export async function acknowledgeLead(leadId: string, ownerKeys: readonly string[] | null): Promise<boolean> {
  try {
    await ensureLeadRateSchema()
    const rows = ownerKeys && ownerKeys.length
      ? await query<{ id: string }>(
          `UPDATE freehold_site_leads SET neglect_deadline_at = NULL
            WHERE id = $1 AND neglect_deadline_at IS NOT NULL AND assigned_broker_id = ANY($2)
            RETURNING id`,
          [leadId, ownerKeys],
        )
      : await query<{ id: string }>(
          `UPDATE freehold_site_leads SET neglect_deadline_at = NULL
            WHERE id = $1 AND neglect_deadline_at IS NOT NULL RETURNING id`,
          [leadId],
        )
    return rows.length > 0
  } catch { return false }
}

/**
 * Every convergent lead whose deadline passed with no contact since the
 * escalation loses its owner. Runs from the cron and, opportunistically, when
 * the CRM list is opened — so the gate holds even if the schedule slips.
 */
export async function sweepNeglectDeadlines(limit = 50): Promise<{ checked: number; redistributed: number }> {
  try {
    await ensureLeadRateSchema()
    const due = await query<{
      id: string; name: string | null; assigned_broker_id: string | null; convergent_at: string | null; touched: boolean
    }>(
      `SELECT l.id, l.name, l.assigned_broker_id, l.convergent_at::text,
              (
                (l.last_contact_at IS NOT NULL AND l.last_contact_at >= l.convergent_at)
                OR EXISTS (SELECT 1 FROM freehold_site_lead_activity a
                            WHERE a.lead_id = l.id AND a.activity_type = ANY($2::text[])
                              AND a.created_at >= l.convergent_at)
              ) AS touched
         FROM freehold_site_leads l
        WHERE l.neglect_deadline_at IS NOT NULL
          AND l.neglect_deadline_at <= now()
          AND l.archived IS NOT TRUE AND l.blocked IS NOT TRUE
          AND COALESCE(l.status, 'new') = ANY($3::text[])
        ORDER BY l.neglect_deadline_at ASC
        LIMIT $1`,
      [limit, [...CONTACT_ACTIVITY], OPEN_STATUSES],
    )
    let redistributed = 0
    for (const lead of due) {
      if (lead.touched || !lead.assigned_broker_id) {
        // Met the clock, or there was nobody to neglect it — disarm quietly.
        await query(`UPDATE freehold_site_leads SET neglect_deadline_at = NULL WHERE id = $1`, [lead.id])
        continue
      }
      const moved = await redistributeLead(lead.id, {
        reason: 'neglect_gate',
        detail: `convergent buyer untouched for ${NEGLECT_WINDOW_MINUTES} minutes by ${lead.assigned_broker_id}`,
      })
      if (moved.to) redistributed += 1
    }
    return { checked: due.length, redistributed }
  } catch (err) {
    console.error('[lead-rate] neglect sweep failed', err)
    return { checked: 0, redistributed: 0 }
  }
}

// ── Engine 07 §3.3 — the temporal anomaly gate ────────────────────────────────

async function quarantineLeads(leadIds: readonly string[], reason: string): Promise<string[]> {
  if (!leadIds.length) return []
  const rows = await query<{ id: string }>(
    `UPDATE freehold_site_leads
        SET seed_quarantined_at = now(), seed_quarantine_reason = $2
      WHERE id = ANY($1) AND seed_quarantined_at IS NULL
      RETURNING id`,
    [leadIds, reason],
  )
  return rows.map((r) => r.id)
}

/**
 * Called after every status write, for the actor who made it. Reads the
 * actor's transitions inside the window, and when they amount to a Bulk
 * Status Event: quarantines the leads from the seed, logs the event, tells
 * management, and — for neglect-cleaning by the lead's own broker — restores
 * the swept leads and hands them to a top performer.
 *
 * Idempotent across the window: leads already quarantined are not
 * re-announced, so one burst produces one alert however many writes follow.
 */
export async function evaluateActorBurst(
  actor: string,
  actorRole: string | null,
  now = Date.now(),
): Promise<{ flagged: boolean; count: number; quarantined: number; redistributed: number }> {
  try {
    await ensureLeadRateSchema()
    const rows = await query<{
      lead_id: string; from_status: string | null; to_status: string | null; created_at: string; contact_count: number | string
    }>(
      `SELECT h.lead_id, h.from_status, h.to_status, h.created_at::text,
              (SELECT COUNT(*) FROM freehold_site_lead_activity a
                WHERE a.lead_id = h.lead_id AND a.activity_type = ANY($3::text[])
                  AND a.created_at < h.created_at)::int AS contact_count
         FROM freehold_site_lead_status_history h
        WHERE h.actor = $1
          AND h.created_at > $2::timestamptz - make_interval(mins => ${BULK_STATUS_WINDOW_MINUTES})
        ORDER BY h.created_at ASC`,
      [actor, new Date(now).toISOString(), [...CONTACT_ACTIVITY]],
    )
    const transitions: StatusTransition[] = rows.map((r) => ({
      leadId: r.lead_id, actor, fromStatus: r.from_status, toStatus: r.to_status, at: r.created_at,
      contactCount: Number(r.contact_count) || 0,
    }))
    const event = detectBulkStatusEvent(transitions, actor, { now })
    if (!event.flagged) return { flagged: false, count: event.count, quarantined: 0, redistributed: 0 }

    const fresh = await quarantineLeads(event.leadIds, `bulk_status:${actor}`)
    if (!fresh.length) return { flagged: true, count: event.count, quarantined: 0, redistributed: 0 }

    for (const id of fresh) {
      await logAuthority({
        actorEmail: actor,
        actorRole: actorRole ?? 'unknown',
        action: 'lead.quarantine',
        targetType: 'lead',
        targetId: id,
        decision: { allowed: true, reason: 'anomaly_gate' },
        detail: `${event.count} leads changed status in ${BULK_STATUS_WINDOW_MINUTES} minutes (${event.windowStart} → ${event.windowEnd})${event.neglectCleaning ? ' — neglect-cleaning' : ''}`,
      })
      await writeRateLedger({
        leadId: id, fromRate: null, toRate: null, reason: 'seed_quarantine', trigger: 'anomaly_gate', actor,
        detail: { count: event.count, windowStart: event.windowStart, windowEnd: event.windowEnd, neglectCleaning: event.neglectCleaning },
      })
    }

    // Reversal only for the one shape that demonstrably threw leads away, and
    // only when the sweeper was a broker clearing their own queue — a
    // manager's bulk move is quarantined and logged, never undone.
    let redistributed = 0
    const brokerSweep = event.neglectCleaning && (actorRole === 'broker' || actorRole === 'team_leader')
    if (brokerSweep) {
      const restoreFrom = new Map(rows.filter((r) => (r.to_status ?? '') === 'lost').map((r) => [r.lead_id, r.from_status]))
      for (const id of event.neglectedLeadIds.filter((l) => fresh.includes(l))) {
        const moved = await redistributeLead(id, {
          reason: 'anomaly_gate',
          detail: `neglect-cleaning by ${actor}: swept to lost without a single contact`,
          restoreStatus: restoreFrom.get(id) || 'new',
        })
        if (moved.to) redistributed += 1
      }
    }

    await tellManagement({
      kind: 'bulk_status',
      headline: `${actor} changed ${event.count} lead statuses in ${BULK_STATUS_WINDOW_MINUTES} minutes`,
      lines: [
        `${fresh.length} lead(s) quarantined from the audience seed.`,
        event.neglectCleaning
          ? `Looks like neglect-cleaning: ${event.neglectedLeadIds.length} untouched lead(s) swept to lost${redistributed ? `; ${redistributed} restored and redistributed` : ''}.`
          : 'Not neglect-cleaning — nothing was reverted.',
        'Every action is in the authority log.',
      ],
      href: '/freehold-intelligence/team/log',
      meta: { actor, count: event.count, neglectCleaning: event.neglectCleaning, quarantined: fresh.length, redistributed },
    })
    return { flagged: true, count: event.count, quarantined: fresh.length, redistributed }
  } catch (err) {
    console.error('[lead-rate] anomaly gate failed', err)
    return { flagged: false, count: 0, quarantined: 0, redistributed: 0 }
  }
}

// ── Decay ────────────────────────────────────────────────────────────────────

/**
 * Re-evaluate open leads that have not been looked at for a day, oldest
 * first. Paced by rate_checked_at (bumped on every evaluation, changed or
 * not) so a lead sitting at the floor is not re-read on every run.
 */
export async function sweepRateDecay(limit = 300): Promise<{ checked: number; changed: number }> {
  try {
    await ensureLeadRateSchema()
    const rows = await query<{ id: string }>(
      `SELECT id FROM freehold_site_leads
        WHERE archived IS NOT TRUE
          AND COALESCE(status, 'new') = ANY($2::text[])
          AND (rate_checked_at IS NULL OR rate_checked_at < now() - interval '1 day')
        ORDER BY rate_checked_at ASC NULLS FIRST
        LIMIT $1`,
      [limit, OPEN_STATUSES],
    )
    const changed = await recomputeLeadRates(rows.map((r) => r.id), 'decay_sweep')
    return { checked: rows.length, changed }
  } catch (err) {
    console.error('[lead-rate] decay sweep failed', err)
    return { checked: 0, changed: 0 }
  }
}
