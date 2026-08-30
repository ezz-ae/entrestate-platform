/**
 * THE PAYROLL — who on the Visual Sales Team is actually employed today.
 *
 * The catalogue (visual-sales-team.ts) says who COULD work here. This says who
 * DOES. The distinction is the product's own framing, not bookkeeping: adding a
 * member to a form is an offer of employment, and paying for them is the hire.
 * Until this file existed, "employed" was an argument every caller invented for
 * itself — and canTakeCalls(), the gate that keeps an untrained model off a real
 * buyer's phone, took it as a parameter nobody could answer.
 *
 * It mirrors the shape lib/freehold/teams.ts already uses for HUMAN staff
 * (start_date, employment_type, probation) on purpose. A company that employs
 * people and employs models should read one idea, not two.
 *
 * Three rules, each with the failure it answers to:
 *
 *   1. AN ADS-ONLY HIRE IS NOT EMPLOYMENT. The hourly ad token is the hook: a
 *      member is live in fifteen minutes and answers forms. It buys no phone.
 *      The moment a model steps off the account Note it goes offline, so a
 *      token holder that could dial would drop a live call mid-sentence.
 *      `ad_hourly` is stored like any other term and excluded from `employed`.
 *
 *   2. AN EXPIRED TERM IS NOT EMPLOYMENT. A yearly hire that ended last week is
 *      a row in a table, not a colleague. Expiry is evaluated against the
 *      instant passed in — never a clock of this module's own — so the same
 *      question always gets the same answer in a test and in production.
 *
 *   3. FAIL CLOSED. Every read is wrapped: an unreachable database returns an
 *      EMPTY roster, and an empty roster places no calls. The opposite default
 *      would put a model on the phone because a query timed out.
 *
 * Trained level lives here rather than in the catalogue because it is earned
 * per account: the same Sara is 72 in a workspace that just hired her and 94 in
 * one that has been teaching her for a month.
 */

import { ensureOnce, query } from '@/lib/db'
import { SALES_TEAM, READINESS_THRESHOLD, getMember } from './visual-sales-team'
import { getStaff } from './marketing-employee'
import type { RosterState } from './lead-caller'

/**
 * How a member is paid. `ad_hourly` is deliberately in the same union rather
 * than a separate flag: it IS a way you pay for a member, and keeping it here
 * means every screen that lists terms has to decide what it does about the one
 * that cannot call — instead of forgetting it exists.
 */
export const EMPLOYMENT_TERMS = ['weekly', 'monthly', 'yearly', 'ad_hourly'] as const
export type EmploymentTerm = (typeof EMPLOYMENT_TERMS)[number]

/** The terms that put a member on the phone. Rule 1, as data. */
export const CALLING_TERMS: readonly EmploymentTerm[] = ['weekly', 'monthly', 'yearly']

export interface Employment {
  memberId: string
  term: EmploymentTerm
  startedAt: string
  /** ISO end of the paid term. Null = open-ended (renewed automatically). */
  endsAt: string | null
  /** 0–100, earned in this account. Defaults to the catalogue's baseLevel. */
  trainedLevel: number
}

const TABLE = 'freehold_sales_employment'

async function ensureTable(): Promise<void> {
  await ensureOnce(TABLE, async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        member_id     text PRIMARY KEY,
        term          text NOT NULL CHECK (term IN ('weekly','monthly','yearly','ad_hourly')),
        started_at    timestamptz NOT NULL DEFAULT now(),
        ends_at       timestamptz,
        trained_level integer NOT NULL DEFAULT 0 CHECK (trained_level BETWEEN 0 AND 100),
        updated_at    timestamptz NOT NULL DEFAULT now()
      )
    `)
  })
}

/** Is this term one that can put someone on a call? Pure. */
export function termAllowsCalls(term: EmploymentTerm): boolean {
  return CALLING_TERMS.includes(term)
}

/** Has this employment run out at `at`? Pure, and an unparseable date counts
 *  as expired — the fail-closed direction. */
export function isExpired(e: Pick<Employment, 'endsAt'>, at: Date): boolean {
  if (!e.endsAt) return false
  const end = Date.parse(e.endsAt)
  if (Number.isNaN(end)) return true
  return end <= at.getTime()
}

/**
 * The roster as assignCaller() needs it: who may be put on a call right now,
 * and how well each is trained. Pure given the rows — the DB read is separate
 * so this is testable without one.
 */
export function rosterFrom(rows: Employment[], at: Date): RosterState {
  const live = rows.filter((e) => termAllowsCalls(e.term) && !isExpired(e, at))
  const trained: Record<string, number> = {}
  for (const e of rows) {
    // Training is recorded for every hire, including ad-only ones: a member
    // taught on ads is still taught when they are later employed.
    trained[e.memberId] = e.trainedLevel || catalogueMember(e.memberId)?.baseLevel || 0
  }
  return { employed: live.map((e) => e.memberId), trained }
}

/**
 * WHO WORKS HERE — a different question from who may take a call.
 *
 * rosterFrom().employed answers "may be put on a call right now" and therefore
 * excludes ad_hourly, which cannot. That is correct for lead-caller.ts and
 * wrong for everything else: a marketing manager paid by the hour is on the
 * payroll and must be able to do her job. Kept as its own function rather than
 * a second field on RosterState, so the calling tests are not made to answer a
 * question calling does not ask.
 *
 * Being hired is not a route around the calling gates: assignCaller() also
 * requires training, a voice binding and a distinct language, and staff have no
 * voice binding at all.
 */
export function hiredFrom(rows: Employment[], at: Date): string[] {
  return rows.filter((e) => !isExpired(e, at)).map((e) => e.memberId)
}

/** Everyone on the payroll right now, in any term. Fails closed to []. */
export async function getHired(at: Date = new Date()): Promise<string[]> {
  return hiredFrom(await listEmployment(), at)
}

const mapRow = (r: Record<string, unknown>): Employment => ({
  memberId: String(r.member_id ?? ''),
  term: String(r.term ?? 'monthly') as EmploymentTerm,
  startedAt: String(r.started_at ?? ''),
  endsAt: r.ends_at ? String(r.ends_at) : null,
  trainedLevel: Number(r.trained_level ?? 0),
})

const SELECT = `member_id, term, started_at::text, ends_at::text, trained_level`

/** Everyone this account has hired, in any term. Fails closed to []. */
export async function listEmployment(): Promise<Employment[]> {
  try {
    await ensureTable()
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${TABLE} ORDER BY member_id`)
    return rows.map(mapRow)
  } catch {
    return [] // rule 3: no roster, no calls
  }
}

/** The roster state for assignCaller(). Fails closed to an empty roster. */
export async function getRosterState(at: Date = new Date()): Promise<RosterState> {
  return rosterFrom(await listEmployment(), at)
}

/**
 * ONE PAYROLL, TWO CATALOGUES.
 *
 * The Visual Sales Team and the marketing employee are hired the same way and
 * paid from the same table, because "who works here" is one question and a
 * second table would let two screens disagree about the answer. They differ
 * only in what a hire unlocks: a sales member can be put on a call
 * (lib/freehold/lead-caller.ts), a staff member drives specialist lanes in the
 * chat (lib/freehold/marketing-employee.ts).
 *
 * baseLevel is a calling concept, so staff have none — 0. That is not a
 * penalty: assignCaller() also requires a voice binding, and staff have none of
 * those either, so a marketing manager can never be selected for a call however
 * she is paid.
 */
function catalogueMember(id: string): { baseLevel: number } | null {
  const sales = getMember(id)
  if (sales) return { baseLevel: sales.baseLevel }
  return getStaff(id) ? { baseLevel: 0 } : null
}

/** Hire a member, or change their term. Unknown ids are refused — a payroll row
 *  for somebody who is not in the catalogue is a row nothing can ever pay. */
export async function employMember(
  memberId: string,
  term: EmploymentTerm,
  endsAt: string | null,
): Promise<Employment | null> {
  if (!catalogueMember(memberId)) return null
  if (!EMPLOYMENT_TERMS.includes(term)) return null
  await ensureTable()
  const base = catalogueMember(memberId)!.baseLevel
  const rows = await query<Record<string, unknown>>(
    `INSERT INTO ${TABLE} (member_id, term, ends_at, trained_level, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (member_id) DO UPDATE SET
       term = EXCLUDED.term, ends_at = EXCLUDED.ends_at, updated_at = now()
     RETURNING ${SELECT}`,
    [memberId, term, endsAt, base],
  )
  return rows[0] ? mapRow(rows[0]) : null
}

/** End employment. The row is removed rather than flagged: "not employed" has
 *  one representation, so no screen can disagree about what a stale row means. */
export async function endEmployment(memberId: string): Promise<void> {
  await ensureTable()
  await query(`DELETE FROM ${TABLE} WHERE member_id = $1`, [memberId])
}

/** Record what a member has learned in this account. Clamped, because a level
 *  above 100 would silently pass every readiness gate forever. */
export async function setTrainedLevel(memberId: string, level: number): Promise<number | null> {
  if (!catalogueMember(memberId)) return null
  const clamped = Math.max(0, Math.min(100, Math.round(Number(level) || 0)))
  await ensureTable()
  await query(
    `UPDATE ${TABLE} SET trained_level = $2, updated_at = now() WHERE member_id = $1`,
    [memberId, clamped],
  )
  return clamped
}

/** Members hired but not yet trained to the calling gate — the operator's
 *  "keep teaching" list, named so a screen never has to recompute the rule. */
export function stillTraining(rows: Employment[], at: Date): string[] {
  return rows
    .filter((e) => termAllowsCalls(e.term) && !isExpired(e, at) && e.trainedLevel < READINESS_THRESHOLD)
    .map((e) => e.memberId)
}

/** Catalogue members this account has never hired. */
export function notHired(rows: Employment[]): string[] {
  const have = new Set(rows.map((e) => e.memberId))
  return SALES_TEAM.filter((m) => !have.has(m.id)).map((m) => m.id)
}
