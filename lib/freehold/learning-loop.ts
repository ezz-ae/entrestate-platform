/**
 * ENGINE 06 §2.2 / §5.3 — THE LOOP-CLOSURE TRIGGER.
 *
 * A won deal is the one fact the whole acquisition side exists to predict,
 * and until now it reached the audience seed only when somebody pressed the
 * "advance the loop" button on the rating-loop screen. The seed cohort
 * already knew how to weigh a closed lead (lib/freehold/seed-cohort.ts puts
 * it on the top rung, weighted by the deal's value); it was simply never
 * told that a new one existed.
 *
 * This is the telling. When a lead's rate crosses into 9 — a human moved the
 * card to closed, or a deal record was approved — the seed and the exclusion
 * audiences are refreshed from the current cohorts, which now include the new
 * buyer, and the lookalike is (re)built once the seed is big enough. The
 * refresh is the same append-only sync the screen runs; nothing here decides
 * who is in a cohort.
 *
 * WHAT LEAVES THE SERVER is unchanged by this trigger: hashed email and phone
 * with a weight — see rating-audiences.ts. No status, no name, no rate.
 *
 * Debounced: two deals closed in the same ten minutes produce one refresh —
 * the second call sees the first's refreshedAt and stands down, and the
 * cohort read at refresh time already contained both buyers.
 */
import { query } from '@/lib/db'
import { ensureLeadActivityTable } from '@/lib/data'
import { isMetaConfigured } from '@/lib/meta/client'
import { ratingAudienceState, syncRatingAudiences } from '@/lib/freehold/rating-audiences'

export const LEARNING_LOOP_DEBOUNCE_MINUTES = 10

export type LearningLoopOutcome =
  | { reseeded: true; matched: number; lookalikeCreated: boolean }
  | { reseeded: false; reason: 'meta_not_configured' | 'recently_refreshed' | 'nothing_to_seed' | 'failed' }

async function note(leadId: string, description: string): Promise<void> {
  try {
    await ensureLeadActivityTable()
    await query(
      `INSERT INTO freehold_site_lead_activity (id, lead_id, activity_type, description, created_by)
       VALUES ($1, $2, 'learning_loop', $3, 'system')`,
      [crypto.randomUUID(), leadId, description],
    )
  } catch { /* the seed refresh is the point; the note is the receipt */ }
}

export async function triggerLearningLoop(leadId: string, why: 'rate_won' | 'manual'): Promise<LearningLoopOutcome> {
  try {
    if (!(await isMetaConfigured())) {
      await note(leadId, 'Won — the seed audience will include this buyer once Meta is connected')
      return { reseeded: false, reason: 'meta_not_configured' }
    }
    const state = await ratingAudienceState().catch(() => ({ seed: null, avoid: null }))
    const last = state.seed?.refreshedAt ? new Date(state.seed.refreshedAt).getTime() : 0
    if (why === 'rate_won' && Date.now() - last < LEARNING_LOOP_DEBOUNCE_MINUTES * 60_000) {
      await note(leadId, 'Won — seed audience refreshed minutes ago; this buyer is in it')
      return { reseeded: false, reason: 'recently_refreshed' }
    }
    const result = await syncRatingAudiences()
    if (!result?.seed) {
      await note(leadId, 'Won — nothing reached the seed audience yet (no matchable contacts)')
      return { reseeded: false, reason: 'nothing_to_seed' }
    }
    await note(
      leadId,
      `Won — seed audience refreshed (${result.seed.matched} matched by Meta${result.lookalikeCreated ? ', lookalike created' : ''})`,
    )
    return { reseeded: true, matched: result.seed.matched, lookalikeCreated: result.lookalikeCreated }
  } catch (err) {
    console.error('[learning-loop] refresh failed', leadId, err)
    return { reseeded: false, reason: 'failed' }
  }
}
