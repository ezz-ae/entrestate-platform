/**
 * THE LINE THAT DIALS NOW KNOWS WHO IS SPEAKING — locked.
 *
 * POST /api/calling ran every gate a LEAD could fail and then dialled with
 * `connection.agentId` — one provider agent for the whole product. So Sara,
 * Saeed, Hessa and Wael reached every buyer in the same voice: the fixed-voice
 * promise, broken at the only place a lead can hear it, while
 * lib/freehold/lead-caller.ts sat unused.
 *
 * Four things must stay true of the route, and each is asserted against the
 * source because the alternative needs a provider, a database and a phone:
 *
 *   1. The LEAD gate still runs first. planCall() must be called and refused on
 *      before any roster question — a lead who may not be called may not be
 *      called whoever is free.
 *   2. assignCaller() decides who, with the employed roster read from the
 *      payroll rather than assumed.
 *   3. The chosen member dials as THEMSELVES. `connection.agentId` must no
 *      longer reach placeCall(); a member without their own agent is refused,
 *      never quietly given the default one.
 *   4. The answer says who called and who else was free, so a second call can
 *      avoid the person this lead already turned down.
 *
 * Pure: reads source text. No network, no database.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CALLER_REFUSAL_SENTENCES, CALLER_REFUSALS } from '../lib/freehold/lead-caller'
import { resolveCallAgent, agentKeyFor, bindTeamAgents, agentCollisions, agentReadyMembers } from '../lib/freehold/visual-sales-voice'
import { SALES_TEAM, getMember } from '../lib/freehold/visual-sales-team'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const route = readFileSync(join(process.cwd(), 'app/api/calling/route.ts'), 'utf8')

console.log('\n── rule 1: the lead gate still runs first ──')
{
  const iPlan = route.indexOf('planCall(lead')
  const iAssign = route.indexOf('assignCaller(')
  check('planCall is still called', iPlan > -1)
  check('assignCaller runs AFTER it', iAssign > iPlan, `plan@${iPlan} assign@${iAssign}`)
  check('a lead refusal still short-circuits', /if \(!plan\.go\) return refuseLead/.test(route))
}

console.log('\n── rule 2: the roster comes from the payroll ──')
{
  check('the route reads the employment roster', /getRosterState\(/.test(route))
  check('…and hands it to assignCaller', /assignCaller\([\s\S]{0,400}roster,/.test(route))
  check('a roster refusal is answered as a roster problem', /refuseRoster\(/.test(route))
  check('…and never blames the lead for it',
    /assigned\.leadRefused[\s\S]{0,120}refuseRoster/.test(route))
  check('every roster refusal has a sentence to render',
    CALLER_REFUSALS.every((r) => (CALLER_REFUSAL_SENTENCES[r] ?? '').length > 10))
}

console.log('\n── rule 3: the member dials as themselves ──')
{
  check('the default connection agent no longer reaches placeCall',
    !/agentId:\s*connection\.agentId/.test(route))
  check('the chosen member’s own agent does', /agentId:\s*agent\.agentId/.test(route))
  check('a member with no agent of their own is refused', /memberAgentMissing/.test(route))
  check('the refusal names the variable to set', /CALL_AGENT_MEMBER_/.test(route))
  check('a shared agent is refused too (agentReadyMembers)', /agentReadyMembers\(/.test(route))
}

console.log('\n── the agent binding itself ──')
{
  const sara = getMember('sara')!
  check('the key is per member', agentKeyFor(sara) === 'CALL_AGENT_MEMBER_SARA', agentKeyFor(sara))
  check('an unset member has no agent', resolveCallAgent(sara, {}).agentId === '')
  check('…and names no source', resolveCallAgent(sara, {}).sourceKey === null)
  check('a set member resolves', resolveCallAgent(sara, { CALL_AGENT_MEMBER_SARA: 'ag-1' }).agentId === 'ag-1')

  // There is deliberately NO language fallback here: a shared agent is the
  // failure, so nothing may hand two members the same one silently.
  const shared = bindTeamAgents({ CALL_AGENT_MEMBER_SARA: 'same', CALL_AGENT_MEMBER_HESSA: 'same' })
  check('two members on one agent is a collision', agentCollisions(shared).length === 1)
  check('…and neither is agent-ready', !agentReadyMembers(shared).includes('sara') && !agentReadyMembers(shared).includes('hessa'))

  const each = bindTeamAgents(Object.fromEntries(SALES_TEAM.map((m) => [agentKeyFor(m), `ag-${m.id}`])))
  check('one agent each clears it', agentCollisions(each).length === 0 && agentReadyMembers(each).length === SALES_TEAM.length)
}

console.log('\n── rule 4: the answer says who called ──')
{
  check('the placed-call response carries the member', /memberId:\s*member\.id/.test(route))
  check('…and the alternates for a second attempt', /alternates:\s*assigned\.alternates/.test(route))
  check('the provider metadata records who spoke', /member_id:\s*member\.id/.test(route))
  check('the request may name who the lead already refused', /avoidMemberIds/.test(route))
}

if (failures) { console.error(`\n${failures} calling-member guard(s) broken.`); process.exit(1) }
console.log('\nA call now goes out as a named colleague, or it does not go out.\n')
