/**
 * ENGINE 07 §3.1 — WHAT HAPPENS WHEN A PERSON THE CRM ALREADY HOLDS COMES
 * BACK.
 *
 * Every inbound door (the landing form, the Meta form sync, the bio-link
 * page, the chat) ends in one of two places: a new row, or a person who is
 * already here. The second case used to be an activity line and nothing
 * else. Now it is the strongest behavioural signal the system receives, read
 * the way the spec reads it:
 *
 *   1. SILENT MERGE. The new touch — its project, campaign, ad, message — is
 *      written to the existing lead's timeline. No duplicate card, no
 *      "possible duplicate" warning for the broker to dismiss.
 *   2. ICI. lib/freehold/intent-convergence.ts compares what they asked for
 *      the first time with what they asked for now.
 *   3. CONVERGENT → Rate 8 (Engine 06's urgency multiplier), the owner is
 *      told in-app and by email, the 15-minute neglect clock starts. A lead
 *      nobody owns is distributed first so the clock has somebody to run
 *      against.
 *      DIVERGENT → the timeline line and a ledger entry; nothing escalates.
 *   4. A LOST lead that re-engages is revived — status back to new, rate
 *      recomputed — and routed like any new arrival. A lead that already
 *      BOUGHT is not reset; a returning buyer is management's news.
 *
 * Every ICI evaluation is stamped in the rate ledger with its coefficients,
 * whichever way it went.
 *
 * MULTI-CHANNEL DUPLICATES. The website door already merges by phone/email
 * before inserting. The Meta sync inserts by meta_lead_id, so the same person
 * arriving through two Meta forms (or a form and the website) is two rows.
 * mergeInboundDuplicate() closes that gap after such an insert: the older
 * open lead keeps the person, the new row is archived with a note saying
 * where it went, and the touch is registered on the survivor.
 */
import { randomUUID } from 'node:crypto'
import { query } from '@/lib/db'
import { ensureLeadActivityTable } from '@/lib/data'
import { extractUnitTypes } from '@/lib/inventory-data'
import { getWorkspaceConfig } from '@/lib/automation/db'
import { pickAgentForLead } from '@/lib/automation/distribution'
import { emailLeadMovementToInbox, notifyBrokerOfAssignedLead } from '@/lib/transactional-email'
import { notify } from '@/lib/freehold/notifications'
import { WON_STATUSES } from '@/lib/freehold/lead-stages'
import {
  describeInquiry, intentConvergence, type InquirySignals, type IciResult,
} from '@/lib/freehold/intent-convergence'
import {
  armNeglectClock, ensureLeadRateSchema, recomputeLeadRate, recordStatusTransition, writeRateLedger,
  NEGLECT_WINDOW_MINUTES,
} from '@/lib/freehold/lead-rate-db'
import { telemetrySignals } from '@/lib/freehold/behavioral-telemetry'

export interface InboundTouch {
  /** The lead that already exists — the survivor of the merge. */
  leadId: string
  /** What the person asked for THIS time. */
  inquiry: InquirySignals
  /** Where the touch came from, for the timeline ('meta_form:123', 'lp:jvc-2br'). */
  source: string
  /** Attribution to merge into the trail (campaign, ad, comment keyword…). */
  attribution?: Record<string, string | null | undefined>
  /** Write the repeat_inquiry timeline line here (false when the caller did). */
  logActivity?: boolean
  now?: number
}

export interface InboundTouchOutcome {
  ici: IciResult
  escalated: boolean
  revived: boolean
  returningBuyer: boolean
  deadline: string | null
}

interface LeadRow {
  id: string
  name: string | null
  status: string | null
  assigned_broker_id: string | null
  project_slug: string | null
  interest: string | null
  message: string | null
  landing_slug: string | null
  source: string | null
  country: string | null
  blocked: boolean | null
  convergent_at: string | null
}

/** The project's own area and unit types — the facts that outrank text. */
async function projectFacts(slug: string | null | undefined): Promise<{ area: string | null; unitTypes: string[] }> {
  const s = (slug ?? '').trim()
  if (!s) return { area: null, unitTypes: [] }
  try {
    const [row] = await query<{ area: string | null; payload: Record<string, unknown> | null }>(
      `SELECT area, payload FROM freehold_site_projects WHERE lower(slug) = lower($1) LIMIT 1`,
      [s],
    )
    if (!row) return { area: null, unitTypes: [] }
    return { area: row.area, unitTypes: extractUnitTypes(row.payload) }
  } catch { return { area: null, unitTypes: [] } }
}

async function describe(signals: InquirySignals) {
  const facts = await projectFacts(signals.projectSlug)
  return describeInquiry({
    ...signals,
    projectArea: signals.projectArea ?? facts.area,
    projectUnitTypes: signals.projectUnitTypes ?? facts.unitTypes,
  })
}

async function activity(leadId: string, type: string, description: string): Promise<void> {
  try {
    await ensureLeadActivityTable()
    await query(
      `INSERT INTO freehold_site_lead_activity (id, lead_id, activity_type, description, created_by)
       VALUES ($1, $2, $3, $4, NULL)`,
      [randomUUID(), leadId, type, description],
    )
  } catch (err) {
    console.error('[inbound-touch] activity write failed', err)
  }
}

function describeTouch(t: InboundTouch): string {
  const parts = [
    t.inquiry.projectSlug ? `Project: ${t.inquiry.projectSlug}` : null,
    t.inquiry.landingSlug ? `Landing page: ${t.inquiry.landingSlug}` : null,
    t.inquiry.interest ? `Interest: ${t.inquiry.interest}` : null,
    t.inquiry.message ? `Message: ${t.inquiry.message}` : null,
    ...Object.entries(t.attribution ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
  ].filter(Boolean)
  return parts.length ? `Came back via ${t.source} · ${parts.join(' · ')}` : `Came back via ${t.source}`
}

/**
 * THE registration. Returns the ICI whichever way it went; never throws —
 * the door that called it owes a person a response.
 */
export async function registerInboundTouch(touch: InboundTouch): Promise<InboundTouchOutcome | null> {
  const now = touch.now ?? Date.now()
  try {
    await ensureLeadRateSchema()
    const [lead] = await query<LeadRow>(
      `SELECT id, name, status, assigned_broker_id, project_slug, interest, message, landing_slug,
              source, country, blocked, convergent_at::text
         FROM freehold_site_leads WHERE id = $1 LIMIT 1`,
      [touch.leadId],
    )
    if (!lead) return null

    if (touch.logActivity !== false) await activity(lead.id, 'repeat_inquiry', describeTouch(touch))

    // S1 is what they asked for the first time — the row's own columns.
    const first = await describe({
      projectSlug: lead.project_slug, interest: lead.interest, message: lead.message, landingSlug: lead.landing_slug,
    })
    const second = await describe(touch.inquiry)
    const ici = intentConvergence(first, second)

    // Engine 07 §3.1, the Parallel Telemetry Validation: has this person's
    // browser been seen returning to an idle tab on our pages? Recorded with
    // the ICI so the escalation carries its behavioural evidence, and read
    // again by the rate (focus-after-idle is an ingest intent signal).
    const behaviour = await telemetrySignals(lead.id).catch(() => ({
      premiumHover: false, focusAfterIdle: false, activeEvents: 0, idleEvents: 0,
    }))

    const status = (lead.status ?? 'new').toLowerCase()
    const returningBuyer = WON_STATUSES.has(status)
    let revived = false
    if (status === 'lost' && !lead.blocked) {
      await query(`UPDATE freehold_site_leads SET status = 'new', updated_at = now() WHERE id = $1`, [lead.id])
      await recordStatusTransition({ leadId: lead.id, actor: 'system', actorRole: 'system', fromStatus: 'lost', toStatus: 'new' })
      await activity(lead.id, 'revived', `Revived — re-engaged via ${touch.source} after being marked lost`)
      void emailLeadMovementToInbox('revived', { id: lead.id, name: lead.name }, `came back via ${touch.source} after being lost`)
      revived = true
    }

    await writeRateLedger({
      leadId: lead.id,
      fromRate: null,
      toRate: null,
      reason: ici.convergent ? 'ici_convergent' : 'ici_divergent',
      trigger: 'inbound_touch',
      detail: {
        ici: ici.ici, typeMatch: ici.typeMatch, areaMatch: ici.areaMatch, sameProject: ici.sameProject,
        first: ici.first, second: ici.second, source: touch.source, revived, returningBuyer,
        focusAfterIdle: behaviour.focusAfterIdle, premiumHover: behaviour.premiumHover,
      },
    })

    const open = !lead.blocked && !returningBuyer
    let escalated = false
    let deadline: string | null = null

    if (ici.convergent && open) {
      // A lead nobody owns cannot be neglected — give it an owner first.
      let owner = lead.assigned_broker_id
      if (!owner) {
        const cfg = await getWorkspaceConfig().catch(() => null)
        if (cfg?.distribution.mode === 'auto') {
          owner = await pickAgentForLead(cfg.distribution, {
            id: lead.id, source: lead.source, project_slug: lead.project_slug, interest: lead.interest, country: lead.country,
          }).catch(() => null)
          if (owner) {
            await query(
              `UPDATE freehold_site_leads SET assigned_broker_id = $2, assigned_at = now(), updated_at = now() WHERE id = $1`,
              [lead.id, owner],
            )
            await activity(lead.id, 'assignment', `Auto-distributed to ${owner} on a convergent second inquiry`)
            void notifyBrokerOfAssignedLead(owner, lead.id).catch(() => undefined)
          }
        }
      }
      deadline = await armNeglectClock(lead.id, now)
      escalated = true
      const where = ici.second.area ?? ici.first.area ?? 'the same area'
      await activity(
        lead.id, 'escalation',
        `Convergent buyer (ICI ${ici.ici}) — second matching inquiry in ${where}. Contact within ${NEGLECT_WINDOW_MINUTES} minutes.`,
      )
      if (owner) {
        await notify('lead_convergent', { lead: lead.id, name: lead.name, area: where, minutes: NEGLECT_WINDOW_MINUTES }, {
          recipient: owner, href: `/freehold-intelligence/crm/leads/${lead.id}`,
        }).catch(() => {})
      }
      await notify('lead_convergent', { lead: lead.id, name: lead.name, area: where, minutes: NEGLECT_WINDOW_MINUTES }, {
        href: `/freehold-intelligence/crm/leads/${lead.id}`,
      }).catch(() => {})
      void emailLeadMovementToInbox(
        'convergent', { id: lead.id, name: lead.name },
        `convergent buyer — a second matching inquiry in ${where}; contact within ${NEGLECT_WINDOW_MINUTES} minutes`,
      )
    } else if (returningBuyer) {
      await activity(lead.id, 'note', `A past buyer came back via ${touch.source} — consider the master-lead mark`)
      await notify('management_alert', { kind: 'returning_buyer', lead: lead.id, name: lead.name }, {
        href: `/freehold-intelligence/crm/leads/${lead.id}`,
      }).catch(() => {})
    }

    await recomputeLeadRate(lead.id, 'inbound_touch', { detail: { ici: ici.ici, convergent: ici.convergent, revived } })
    return { ici, escalated, revived, returningBuyer, deadline }
  } catch (err) {
    console.error('[inbound-touch] failed', touch.leadId, err)
    return null
  }
}

/**
 * After a door inserted a NEW row for a person who is already here (the Meta
 * sync, keyed on meta_lead_id, cannot know), fold the new row into the older
 * open lead: archive it with a pointer, and register the touch on the
 * survivor. Returns the survivor's id, or null when the new row stands alone.
 */
export async function mergeInboundDuplicate(newLeadId: string, opts: { source: string; now?: number } = { source: 'inbound' }): Promise<string | null> {
  try {
    await ensureLeadRateSchema()
    const [fresh] = await query<LeadRow & { phone: string | null; email: string | null; utm_id: string | null; meta_ad_id: string | null; lead_code: string | null }>(
      `SELECT id, name, status, assigned_broker_id, project_slug, interest, message, landing_slug, source, country,
              blocked, convergent_at::text, phone, email, utm_id, meta_ad_id, lead_code
         FROM freehold_site_leads WHERE id = $1 LIMIT 1`,
      [newLeadId],
    )
    if (!fresh) return null
    const digits = (fresh.phone ?? '').replace(/\D/g, '')
    const phoneKey = digits.length >= 7 ? digits.slice(-9) : ''
    const emailKey = (fresh.email ?? '').trim().toLowerCase()
    if (!phoneKey && !emailKey) return null

    const [older] = await query<{ id: string; lead_code: string | null; status: string | null }>(
      `SELECT id, lead_code, status FROM freehold_site_leads
        WHERE id <> $1 AND archived IS NOT TRUE
          AND (
            ($2 <> '' AND RIGHT(regexp_replace(COALESCE(phone, ''), '\\D', '', 'g'), 9) = $2)
            OR ($3 <> '' AND lower(email) = $3)
          )
        ORDER BY created_at ASC
        LIMIT 1`,
      [newLeadId, phoneKey, emailKey],
    )
    if (!older) return null

    // A past BUYER coming back is a new opportunity, not a duplicate: the new
    // card stands, the old one gets the note, management hears about it.
    if (WON_STATUSES.has((older.status ?? '').toLowerCase())) {
      await activity(newLeadId, 'note', `Returning buyer — previously closed as ${older.lead_code ?? older.id}`)
      await registerInboundTouch({
        leadId: older.id,
        inquiry: { projectSlug: fresh.project_slug, interest: fresh.interest, message: fresh.message, landingSlug: fresh.landing_slug },
        source: opts.source || fresh.source || 'inbound',
        attribution: { campaign: fresh.utm_id, ad: fresh.meta_ad_id, new_row: fresh.lead_code ?? fresh.id },
        now: opts.now,
      })
      return null
    }

    await query(`UPDATE freehold_site_leads SET archived = true, updated_at = now() WHERE id = $1`, [newLeadId])
    await activity(newLeadId, 'note', `Merged into ${older.lead_code ?? older.id} — same person, second inquiry`)
    await registerInboundTouch({
      leadId: older.id,
      inquiry: { projectSlug: fresh.project_slug, interest: fresh.interest, message: fresh.message, landingSlug: fresh.landing_slug },
      source: opts.source || fresh.source || 'inbound',
      attribution: { campaign: fresh.utm_id, ad: fresh.meta_ad_id, merged_row: fresh.lead_code ?? fresh.id },
      now: opts.now,
    })
    return older.id
  } catch (err) {
    console.error('[inbound-touch] merge failed', newLeadId, err)
    return null
  }
}
