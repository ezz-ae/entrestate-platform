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
// The gate sequence moved into lib/calling/place.ts so the coordinator chat can
// run the SAME one (see chat tools calling_*). The guard follows the logic: the
// order is asserted where it now lives, and the route is checked for being a
// thin wrapper that cannot bypass it.
const place = readFileSync(join(process.cwd(), 'lib/calling/place.ts'), 'utf8')

console.log('\n── rule 1: the lead gate still runs first ──')
{
  const iPlan = place.indexOf('const plan = planCall(')
  const iAssign = place.indexOf('const assigned = assignCaller(')
  check('planCall is still called', iPlan > -1)
  check('assignCaller runs AFTER it', iAssign > iPlan, `plan@${iPlan} assign@${iAssign}`)
  check('a lead refusal still short-circuits', /if \(!plan\.go\) return refuse\('lead'/.test(place))
}

console.log('\n── rule 2: the roster comes from the payroll ──')
{
  check('the route reads the employment roster', /getRosterState\(/.test(place))
  check('…and hands it to assignCaller', /assignCaller\(/.test(place))
  check('a roster refusal is answered as a roster problem', /refuse\('roster'/.test(place))
  check('…and never blames the lead for it',
    /assigned\.leadRefused[\s\S]{0,160}refuse\('roster'/.test(place))
  check('every roster refusal has a sentence to render',
    CALLER_REFUSALS.every((r) => (CALLER_REFUSAL_SENTENCES[r] ?? '').length > 10))
}

console.log('\n── rule 3: the member dials as themselves ──')
{
  check('the default connection agent no longer reaches placeCall',
    !/agentId:\s*connection\.agentId/.test(place) && !/agentId:\s*connection\.agentId/.test(route))
  check('the chosen member’s own agent does', /agentId:\s*agent\.agentId/.test(place))
  check('a member with no agent of their own is refused', /memberAgentMissing/.test(place))
  check('the refusal names the variable to set', /CALL_AGENT_MEMBER_/.test(place))
  check('a shared agent is refused too (agentReadyMembers)', /agentReadyMembers\(/.test(place))
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
  check('the placed-call response carries the member', /memberId:\s*r\.memberId/.test(route))
  check('…and the alternates for a second attempt', /alternates:\s*r\.alternates/.test(route))
  check('the provider metadata records who spoke', /member_id:\s*member\.id/.test(place))
  check('the request may name who the lead already refused', /avoidMemberIds/.test(route) && /avoidMemberIds/.test(place))
}

console.log('\n── one sequence, however many doors ──')
{
  // The route must DELEGATE. A second copy of a compliance order is one copy
  // that gets edited and one that does not.
  check('the route places through the shared sequence', /placeLeadCall\(/.test(route))
  check('…and keeps no gate of its own', !/planCall\(/.test(route) && !/assignCaller\(/.test(route))
  // GET legitimately reads the provider's number list (listNumbers). What the
  // route may not do is DIAL — that is provider.placeCall, and it lives in one file.
  check('…and never dials directly', !/provider\.placeCall\(/.test(route))
  check('only the shared sequence dials', /provider\.placeCall\(/.test(place))

  // place.ts is the only thing that dials, and the dry run stops before it.
  const iDial = place.indexOf('provider.placeCall(')
  const iDry = place.indexOf('if (input.dryRun)')
  check('a dry run stops BEFORE the dial', iDry > -1 && iDial > -1 && iDry < iDial, `dry@${iDry} dial@${iDial}`)
}

if (failures) { console.error(`\n${failures} calling-member guard(s) broken.`); process.exit(1) }
console.log('\nA call now goes out as a named colleague, or it does not go out.\n')
