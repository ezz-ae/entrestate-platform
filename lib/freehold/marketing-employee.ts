/**
 * THE BACK-OFFICE STAFF — employees you hire to work the platform, not the lead.
 *
 * visual-sales-team.ts is the FRONT office: people who talk to a buyer. This is
 * the back office: people who operate the product on the account's behalf —
 * design a creative, plan a campaign, build a landing page, put a form out,
 * send the summary email, and, when the roster allows it, place the call.
 *
 * ONE FACE, ASSISTANTS BEHIND IT. There is no second chat. The coordinator
 * (agent-router.ts) is the one voice, and its specialist lanes — ads_agent,
 * landing_agent, creative_agent, crm_agent, research_agent — are the assistants.
 * A staff member is not a new brain; it is a NAMED SET OF LANES you employ, so
 * "hire a marketing employee" means "these assistants are on this account" and
 * never "a second coordinator now exists". Duplicate agent brains are how this
 * codebase got its built-twice scars, and the fix each time was one face.
 *
 * ── THE RULE THIS MODULE EXISTS FOR ────────────────────────────────────────
 * EMPLOYING SOMEBODY NARROWS WHAT YOU CAN DO. IT NEVER WIDENS IT.
 *
 * Tool access is the INTERSECTION of two things: what the signed-in person's
 * ROLE already permits, and what the employee on duty is employed to drive.
 * Never the union. The failure it prevents is the obvious one and it is fatal:
 * a sales agent who cannot launch a campaign must not become able to launch one
 * by hiring somebody who can. An employee is a delegate, and a delegate cannot
 * hold authority their principal never had.
 *
 * The second half of the same rule: an employee NOT on payroll grants nothing
 * at all. Not "everything", not "the defaults" — nothing, so the account falls
 * back to exactly the role permissions it already had.
 *
 * Pure. The catalogue is data; the access rule is set arithmetic. Employment
 * lives in sales-employment.ts and is passed in.
 */

import type { RatedSkill } from './visual-sales-team'
import { TOP_SKILLS } from './visual-sales-team'
import { COORDINATOR_TOOLS, type CoordinatorRole, type CoordinatorTool } from './coordinator-tools'

/** The coordinator's specialist lanes — the assistants a staff member drives. */
export const SPECIALIST_AGENTS = [
  'ads_agent', 'landing_agent', 'creative_agent', 'crm_agent', 'research_agent',
] as const
export type SpecialistAgent = (typeof SPECIALIST_AGENTS)[number]

/** What a staff member is employed to do, in the words an operator hires on. */
export type StaffDuty =
  | 'design'     // creatives, images, the look of a page
  | 'advertise'  // plan, launch and steer campaigns
  | 'publish'    // landing pages and the form that sits on them
  | 'converse'   // reach a lead: the form, the call, the follow-up
  | 'report'     // read the numbers back, and email the summary

export interface StaffMember {
  id: string
  name: string
  title: string
  yearsExperience: number
  industries: string[]
  languages: string[]
  /** The one line an operator hires on. */
  brief: string
  /** Duties, in hiring language — what the card says they do. */
  duties: StaffDuty[]
  /** The lanes those duties actually resolve to. Kept explicit rather than
   *  derived from `duties` so the mapping is reviewable in one place. */
  agents: SpecialistAgent[]
  /** Top three rated skills, same shape and same headline rule as the sales
   *  team's hiring card, so one roster screen can render both. */
  topSkills: RatedSkill[]
  price: { weekly: number; monthly: number; yearly: number }
}

export const STAFF: StaffMember[] = [
  {
    id: 'nour',
    name: 'Nour',
    title: 'Real-Estate Marketing Manager',
    yearsExperience: 10,
    industries: ['real-estate', 'off-plan', 'brokerage'],
    languages: ['ar', 'en'],
    brief: 'Runs the marketing desk end to end — designs it, launches it, publishes the page, and tells you what it did.',
    duties: ['design', 'advertise', 'publish', 'report'],
    // Deliberately NOT crm_agent: reaching a lead is the front office's job and
    // its own gates (consent, hours, the caller's own voice). A marketing
    // manager who could quietly dial would route around all of them.
    agents: ['creative_agent', 'ads_agent', 'landing_agent', 'research_agent'],
    topSkills: [
      { skill: 'market-facts', rate: 90 },
      { skill: 'product-mastery', rate: 84 },
      { skill: 'data-extraction', rate: 78 },
    ],
    price: { weekly: 900, monthly: 2700, yearly: 27000 },
  },
]

export const staffIds = (): string[] => STAFF.map((m) => m.id)
export const getStaff = (id: string): StaffMember | undefined => STAFF.find((m) => m.id === id)

/**
 * The lanes an employee is employed to drive. An id that is not on the payroll
 * — or not in the catalogue — drives nothing.
 */
export function agentsOnDuty(memberId: string, employed: readonly string[]): SpecialistAgent[] {
  if (!employed.includes(memberId)) return []
  return getStaff(memberId)?.agents ?? []
}

/**
 * The tools available with this employee on duty.
 *
 * INTERSECTION, NEVER UNION — see the module header. `role` decides the ceiling;
 * the employee can only stand under it. With no employee on duty the answer is
 * exactly the role's own tools, unchanged: hiring nobody must cost nothing.
 */
export function toolsWithEmployee(
  role: CoordinatorRole,
  memberId: string | null,
  employed: readonly string[],
  tools: CoordinatorTool[] = COORDINATOR_TOOLS,
): CoordinatorTool[] {
  const byRole = tools.filter((t) => t.roles.includes(role))
  if (!memberId) return byRole
  const lanes = new Set<string>(agentsOnDuty(memberId, employed))
  // An employee who is hired but drives no lane (unknown id, or a catalogue
  // entry with no agents) must not silently fall back to the full role set —
  // that would make a broken hire look like a promotion.
  if (lanes.size === 0) return []
  return byRole.filter((t) => lanes.has(t.agent))
}

/** Duties an employee can actually perform for this role — the honest card to
 *  show an operator, because a duty their own role forbids is not a duty. */
export function effectiveDuties(
  role: CoordinatorRole,
  memberId: string,
  employed: readonly string[],
): StaffDuty[] {
  const member = getStaff(memberId)
  if (!member) return []
  const allowed = new Set(toolsWithEmployee(role, memberId, employed).map((t) => t.agent))
  const DUTY_LANES: Record<StaffDuty, SpecialistAgent[]> = {
    design: ['creative_agent'],
    advertise: ['ads_agent'],
    publish: ['landing_agent'],
    converse: ['crm_agent'],
    report: ['research_agent'],
  }
  return member.duties.filter((d) => DUTY_LANES[d].some((lane) => allowed.has(lane)))
}

/** Every staff card carries exactly TOP_SKILLS rated skills, like the sales
 *  team's — one roster screen renders both. */
export const STAFF_TOP_SKILLS = TOP_SKILLS
