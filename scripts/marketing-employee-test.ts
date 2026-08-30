/**
 * HIRING SOMEBODY NEVER PROMOTES YOU — locked.
 *
 * A staff member is a NAMED SET OF THE COORDINATOR'S LANES that an account
 * employs. There is no second chat and no second brain: one face, assistants
 * behind it — the shape agent-router.ts settled on after the built-twice scars.
 *
 * The rule this module exists for, and the failure it prevents:
 *
 *   TOOL ACCESS IS THE INTERSECTION of what the person's ROLE permits and what
 *   the employee is employed to drive. NEVER the union. A sales agent who
 *   cannot launch a campaign must not become able to launch one by hiring
 *   somebody who can. A delegate cannot hold authority their principal never
 *   had — and an employee is a delegate.
 *
 * Two corollaries, both asserted:
 *   · An employee NOT on payroll grants nothing, so the account falls back to
 *     exactly its own role permissions. Hiring nobody costs nothing.
 *   · An employee hired but driving no lane grants NOTHING, not everything — a
 *     broken hire must not read as a promotion.
 *
 * Pure: the catalogue and the tool registry. No database, no session.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  STAFF, SPECIALIST_AGENTS, getStaff, staffIds, agentsOnDuty,
  toolsWithEmployee, effectiveDuties, STAFF_TOP_SKILLS,
} from '../lib/freehold/marketing-employee'
import { COORDINATOR_TOOLS, type CoordinatorRole } from '../lib/freehold/coordinator-tools'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const HIRED = ['nour']
const names = (role: CoordinatorRole, id: string | null, employed: readonly string[] = HIRED) =>
  toolsWithEmployee(role, id, employed).map((t) => t.name)
const roleOnly = (role: CoordinatorRole) => COORDINATOR_TOOLS.filter((t) => t.roles.includes(role)).map((t) => t.name)

console.log('\n── the catalogue is a hiring card, like the sales team’s ──')
{
  check('there is a real-estate marketing employee', !!getStaff('nour'))
  check('every staff id is unique', new Set(staffIds()).size === STAFF.length)
  check('every card has a title, years and an industry',
    STAFF.every((m) => m.title && m.yearsExperience > 0 && m.industries.length > 0))
  check(`every card carries exactly ${STAFF_TOP_SKILLS} rated skills`,
    STAFF.every((m) => m.topSkills.length === STAFF_TOP_SKILLS))
  check('every card names at least one duty and one lane',
    STAFF.every((m) => m.duties.length > 0 && m.agents.length > 0))
  check('every lane is a real coordinator lane',
    STAFF.every((m) => m.agents.every((a) => (SPECIALIST_AGENTS as readonly string[]).includes(a))))
  check('the marketing manager does NOT hold the lead-facing lane',
    !getStaff('nour')!.agents.includes('crm_agent'), getStaff('nour')!.agents.join(','))
}

console.log('\n── THE RULE: intersection, never union ──')
{
  // An owner may launch campaigns; a sales agent may not. Hiring the same
  // employee must not change the second fact.
  const ownerWith = names('owner', 'nour')
  const agentWith = names('sales_agent', 'nour')
  check('an owner keeps the ads tools with the employee on duty', ownerWith.includes('ads_launch_campaign'))
  check('a sales agent does NOT gain them by hiring', !agentWith.includes('ads_launch_campaign'), agentWith.join(','))

  // The general form: for every role, the employee can only ever subtract.
  const ROLES: CoordinatorRole[] = ['owner', 'admin', 'marketing', 'sales_manager', 'sales_agent', 'data_manager', 'viewer']
  for (const role of ROLES) {
    const base = new Set(roleOnly(role))
    const withEmp = names(role, 'nour')
    const gained = withEmp.filter((n) => !base.has(n))
    check(`${role}: gains nothing from the hire`, gained.length === 0, gained.join(','))
    check(`${role}: the result is a subset of the role's own tools`, withEmp.every((n) => base.has(n)))
  }
}

console.log('\n── hiring nobody costs nothing ──')
{
  const ROLES: CoordinatorRole[] = ['owner', 'sales_agent', 'viewer']
  for (const role of ROLES) {
    check(`${role}: with no employee, the tools are exactly the role's`,
      names(role, null).join(',') === roleOnly(role).join(','))
  }
}

console.log('\n── an unpaid or broken hire grants nothing, not everything ──')
{
  check('an employee not on payroll drives no lane', agentsOnDuty('nour', []).length === 0)
  check('…and therefore holds no tools', names('owner', 'nour', []).length === 0)
  check('an id that is not in the catalogue drives no lane', agentsOnDuty('ghost', ['ghost']).length === 0)
  check('…and holds no tools, rather than falling back to the role',
    names('owner', 'ghost', ['ghost']).length === 0, names('owner', 'ghost', ['ghost']).join(','))
  check('a hired employee DOES hold its lanes', agentsOnDuty('nour', HIRED).length > 0)
}

console.log('\n── the duty card is honest about the operator’s own ceiling ──')
{
  const ownerDuties = effectiveDuties('owner', 'nour', HIRED)
  check('an owner sees the advertising duty', ownerDuties.includes('advertise'))
  check('an owner sees the design duty', ownerDuties.includes('design'))

  const agentDuties = effectiveDuties('sales_agent', 'nour', HIRED)
  check('a sales agent is not promised advertising they cannot do',
    !agentDuties.includes('advertise'), agentDuties.join(','))
  check('an unhired employee promises nothing', effectiveDuties('owner', 'nour', []).length === 0)
  check('an unknown employee promises nothing', effectiveDuties('owner', 'ghost', ['ghost']).length === 0)
  check('a duty is only listed when a real lane backs it',
    ownerDuties.every((d) => getStaff('nour')!.duties.includes(d)))
}

console.log('\n── one face: no second brain was created ──')
{
  // Every tool a staff member can reach is one the ONE coordinator already
  // owns. If this ever fails, a parallel agent registry has appeared.
  const known = new Set(COORDINATOR_TOOLS.map((t) => t.name))
  const reachable = names('owner', 'nour')
  check('every reachable tool belongs to the coordinator', reachable.every((n) => known.has(n)))
  check('the employee reaches fewer tools than the coordinator holds',
    reachable.length > 0 && reachable.length < COORDINATOR_TOOLS.length,
    `${reachable.length}/${COORDINATOR_TOOLS.length}`)
}

console.log('\n── and the employee can be spoken to ──')
{
  // This module described a hirable marketing manager with her own lanes and
  // had no caller at all: the employee you could hire could not be reached.
  // Every assertion here exists because "the code is there" was, for a while,
  // the whole of the feature.
  const route = readFileSync(join(process.cwd(), 'app/api/freehold/expert/chat/route.ts'), 'utf8')
  const code = route.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ')

  check('the one chat can run as an employee', /toolsWithEmployee\(/.test(code))
  check('…resolved from the catalogue, never from the request body alone',
    /getStaff\(requestedEmployee\)/.test(code))

  // getRosterState().employed answers "may take a call" and excludes ad_hourly.
  // Reading it here would unhire an hourly marketer who is plainly on the
  // payroll, so the payroll question has its own function.
  check('the payroll is read with getHired(), not the calling roster',
    /getHired\(\)/.test(code) && !/getRosterState\(\)[\s\S]{0,120}toolsWithEmployee/.test(code))

  check('the employee is named in the system prompt', /employeeGuidance/.test(code))
  const promptLine = code.match(/const systemPrompt = `[^`]*`/)?.[0] ?? ''
  check('…and that guidance actually reaches the prompt',
    promptLine.includes('${employeeGuidance}'), promptLine.slice(0, 80))

  // Fails closed in both directions.
  check('an employee who is not on the payroll drives nothing',
    toolsWithEmployee('owner', 'nour', []).length === 0)
  check('an id that is not in the catalogue drives nothing',
    toolsWithEmployee('owner', 'ghost', ['ghost']).length === 0)
  check('no employee named means the coordinator is unchanged',
    toolsWithEmployee('owner', null, []).length === COORDINATOR_TOOLS.filter((t) => t.roles.includes('owner')).length)

  // The one boundary the card is built around.
  check('a hired Nour still cannot reach a lead herself',
    !toolsWithEmployee('owner', 'nour', ['nour']).some((t) => t.agent === 'crm_agent'))
}

if (failures) { console.error(`\n${failures} marketing-employee guard(s) broken.`); process.exit(1) }
console.log('\nYou can hire an assistant; you cannot hire a promotion.\n')
