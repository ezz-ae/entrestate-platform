/**
 * THE ONE CHAT CAN CALL, AND CANNOT CALL QUIETLY — locked.
 *
 * The coordinator is deliberately ONE face with lanes behind it: "duplicate
 * agent brains are how this codebase got its built-twice scars"
 * (agent-router.ts). It could plan a campaign, generate a creative and build a
 * form — twenty-six tools — and could not make a phone ring, while the whole
 * calling stack sat beside it unused.
 *
 * Giving it a dialler of its own would have meant a second copy of the gate
 * order. So the tools run lib/calling/place.ts, the same sequence the HTTP route
 * runs. Three things must stay true:
 *
 *   1. NO SECOND DIALLER. The tools call placeLeadCall and never the provider.
 *   2. A CALL CANNOT BE UN-RUNG. calling_place_call is destructive AND in
 *      L2_STILL_CONFIRM — like resuming ad spend, it needs the user's own words
 *      even at autonomy 2, because it reaches a person who did not choose the
 *      moment. Only full autopilot may place one unattended.
 *   3. LOOKING IS FREE, DIALLING IS NOT. The dry-run tool is open to everyone
 *      who works the desk; placing is operators only.
 *
 * Pure: source text and the tool registry. No provider, no database.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { COORDINATOR_TOOLS } from '../lib/freehold/coordinator-tools'
import { CALL_TYPES } from '../lib/freehold/call-templates'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const src = readFileSync(join(process.cwd(), 'lib/freehold/coordinator-tools.ts'), 'utf8')
const tool = (n: string) => COORDINATOR_TOOLS.find((t) => t.name === n)

console.log('\n── the chat has the three calling tools ──')
{
  for (const n of ['calling_team_status', 'calling_who_can_call', 'calling_place_call']) {
    check(`${n} exists`, !!tool(n))
  }
  check('they all belong to one specialist lane',
    ['calling_team_status', 'calling_who_can_call', 'calling_place_call']
      .every((n) => tool(n)?.agent === 'crm_agent'))
  // The tool descriptions DERIVE the list from CALL_TYPES rather than restating
  // it, so an eighth call type cannot exist without the chat being told about
  // it. Asserting the derivation is stronger than asserting the seven strings.
  check('the call types are derived from CALL_TYPES, never retyped',
    (src.match(/CALL_TYPES\.join\(/g) ?? []).length >= 2)
  check('there are still seven of them to derive from', CALL_TYPES.length === 7)
}

console.log('\n── rule 1: no second dialler ──')
{
  check('the tools run the shared sequence', /placeLeadCall\(/.test(src))
  check('the registry never touches the provider', !/getCallingProvider\(|provider\.placeCall\(/.test(src))
  check('…and re-implements no gate', !/planCall\(/.test(src) && !/consentGate\(/.test(src))
  check('the read tool is a dry run', /dryRun:\s*true/.test(src))
  check('a dry run returning "placed" is treated as a bug',
    /A dry run must never place a call/.test(src))
}

console.log('\n── rule 2: a call cannot be un-rung ──')
{
  check('calling_place_call is destructive', tool('calling_place_call')?.destructive === true)
  check('…and still needs confirmation at autonomy 2',
    /L2_STILL_CONFIRM = new Set\(\[[^\]]*'calling_place_call'/.test(src))
  check('resuming ad spend is still in that set too (the rule was extended, not replaced)',
    /L2_STILL_CONFIRM = new Set\(\[[^\]]*'ads_resume_campaign'/.test(src))
  check('the reason is written down beside it', /cannot be un-rung/.test(src))
  check('its schema carries an explicit confirm flag',
    /confirm: z\.boolean\(\)\.optional\(\)[\s\S]{0,200}explicitly confirmed this exact call/.test(src))
  check('the read tools are NOT destructive',
    tool('calling_who_can_call')?.destructive !== true && tool('calling_team_status')?.destructive !== true)
}

console.log('\n── rule 3: looking is free, dialling is not ──')
{
  const look = tool('calling_who_can_call')!.roles
  const dial = tool('calling_place_call')!.roles
  check('anyone on the desk may check who could call', look.includes('sales_agent'))
  check('a sales agent may NOT place one', !dial.includes('sales_agent'), dial.join(','))
  check('dialling is a strict subset of looking', dial.every((r) => look.includes(r)) && dial.length < look.length)
  check('the team status is readable by the desk', tool('calling_team_status')!.roles.includes('sales_agent'))
}

console.log('\n── the tool tells the user who will speak ──')
{
  check('the dry run returns the caller by name', /caller: r\.memberName/.test(src))
  check('…and the alternates', /alternates: r\.alternates/.test(src))
  check('a refusal says whose problem it is', /whose: r\.kind/.test(src))
  check('the description tells the model to check first', /Run calling_who_can_call first/.test(src))
  check('the team-status tool reports each blocker', /blocker: ready\.get\(m\.id\)\?\.blocker/.test(src))
}

if (failures) { console.error(`\n${failures} chat-calling guard(s) broken.`); process.exit(1) }
console.log('\nOne face, one gate sequence — and the phone still needs a human word.\n')
