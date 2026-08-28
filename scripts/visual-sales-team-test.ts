/**
 * THE VISUAL SALES TEAM HOLDS ITS SHAPE — locked.
 *
 * The team catalog and the routing engine carry four product promises and one
 * hard boundary. Each is asserted here so a later edit can't quietly undo it:
 *
 *   · Voices are fixed and stable; models gate by tier; calls need employment;
 *     readiness (85) is earned before a member dials.
 *   · Clone the SKILLS, never the identity or the voice.
 *   · Rules route on conversational signals but NEVER guess an unknown one, and
 *     a routing decision leaks no demographic back out.
 *   · Routing imports no ad layer and names no targeting type — a lead signal
 *     physically cannot become ad targeting here.
 *
 * Pure. No DB, no network.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  SALES_TEAM, memberIds, getMember, standardTeam, premiumTeam, canTakeCalls,
  totalRate, searchTeam, memberSkills, TOP_SKILLS,
  VOICE_STABILITY_MIN, READINESS_THRESHOLD,
} from '../lib/freehold/visual-sales-team'
import {
  route, matches, validateRules, memberSystemPrompt, type RoutingRule,
} from '../lib/freehold/visual-sales-routing'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

console.log('\n── the team catalog (pure) ──')
{
  const ids = memberIds()
  check('the four starters are present', ['sara', 'saeed', 'hessa', 'wael'].every((id) => ids.includes(id)))
  check('four standard starters + two premium', standardTeam().length === 4 && premiumTeam().length === 2)
  check('every voice is fixed and stable (>= VOICE_STABILITY_MIN)',
    SALES_TEAM.every((m) => m.voice.id.length > 0 && m.voice.stability >= VOICE_STABILITY_MIN))
  check('every voice id is distinct (a wobble/shared voice is a different person)',
    new Set(SALES_TEAM.map((m) => m.voice.id)).size === SALES_TEAM.length)
  check('no member declares an identity or voice clone',
    SALES_TEAM.every((m) => m.identityClone === false && m.voiceClone === false))
  check('every member needs employment to take calls',
    SALES_TEAM.every((m) => m.callsRequireEmployment === true))
  check('base levels are within 0..100', SALES_TEAM.every((m) => m.baseLevel >= 0 && m.baseLevel <= 100))
  check('the price ladder keeps its commitment discount (monthly<4×weekly, yearly<12×monthly, per-month cheaper yearly)',
    SALES_TEAM.every((m) => {
      const p = m.price
      return p.weekly > 0 && p.monthly > 0 && p.yearly > 0 && p.overtimeHourly > 0 && p.adHourly > 0 &&
        p.monthly < p.weekly * 4 && p.yearly < p.monthly * 12 && p.yearly / 12 < p.monthly
    }))
  check('the premium model gates by tier (premium ⇒ claude-fable-5, standard ⇒ not)',
    SALES_TEAM.every((m) => (m.tier === 'premium' ? m.model === 'claude-fable-5' : m.model !== 'claude-fable-5')))
  check('readiness is the 85 the operator trains toward', READINESS_THRESHOLD === 85)
}

console.log('\n── the hiring card + search ──')
{
  check('every member has a title, experience and at least one industry',
    SALES_TEAM.every((m) => m.title.length > 0 && m.yearsExperience > 0 && m.industries.length >= 1))
  check(`every member lists exactly ${TOP_SKILLS} rated skills, each 0..100`,
    SALES_TEAM.every((m) => m.topSkills.length === TOP_SKILLS && m.topSkills.every((s) => s.rate >= 0 && s.rate <= 100)))
  check('every member carries skill provenance (skills are sourced, not identities)',
    SALES_TEAM.every((m) => m.skillSources.length >= 1))
  check('totalRate is the 0..100 integer composite of the top-three skills',
    SALES_TEAM.every((m) => { const t = totalRate(m); return t >= 0 && t <= 100 && Number.isInteger(t) }))
  const authority = getMember('authority')
  check('a known member computes the expected headline (authority = 90)',
    !!authority && totalRate(authority) === 90, String(authority && totalRate(authority)))

  const byTotal = searchTeam({ minTotal: 88 }).map((m) => m.id)
  check('search by total (≥88) returns only the strong composites',
    byTotal.includes('authority') && byTotal.includes('closer') && !byTotal.includes('sara'), byTotal.join(','))
  const bySkill = searchTeam({ skill: 'product-mastery', minSkillRate: 85 }).map((m) => m.id)
  check('search by a single skill (product-mastery ≥85)',
    bySkill.includes('saeed') && bySkill.includes('authority') && !bySkill.includes('wael'), bySkill.join(','))
  check('search by dialect returns the match', searchTeam({ dialect: 'maghrebi' }).map((m) => m.id).join(',') === 'sara')
  check('search by language returns the match', searchTeam({ language: 'fr' }).map((m) => m.id).join(',') === 'sara')
  check('search by industry returns the match', searchTeam({ industry: 'automotive' }).map((m) => m.id).join(',') === 'authority')
  check('facets AND together (≥88 total AND gulf dialect → authority, not the neutral-voiced Closer)',
    (() => { const r = searchTeam({ minTotal: 88, dialect: 'gulf' }).map((m) => m.id); return r.includes('authority') && !r.includes('closer') })())
  check('an empty search returns the whole team', searchTeam({}).length === SALES_TEAM.length)
  check('memberSkills lists the three skill ids', memberSkills(getMember('saeed')!).length === 3)
}

console.log('\n── calls: earned readiness AND employment, both ──')
{
  const closer = getMember('closer')
  check('the fixture exists and starts below the call gate', !!closer && closer.baseLevel < READINESS_THRESHOLD)
  if (closer) {
    check('under-trained + employed still cannot take calls', canTakeCalls(closer, 84, true) === false)
    check('trained + employed can take calls', canTakeCalls(closer, 90, true) === true)
    check('trained but unemployed cannot take calls (calls need employment)', canTakeCalls(closer, 90, false) === false)
  }
}

console.log('\n── routing: rapport in, never a guess ──')
{
  const rMaleOld: RoutingRule = { id: 'male-50-to-wael', when: { gender: 'm', ageBand: 'o50' }, route: { memberId: 'wael', acquisition: 0.2 } }
  const rFemale: RoutingRule = { id: 'female-to-saeed', when: { gender: 'f' }, route: { memberId: 'saeed', acquisition: 0.5 } }
  const rules = [rMaleOld, rFemale] // specific first, operator's priority

  const dFemale = route({ gender: 'f' }, rules, { defaultMemberId: 'sara' })
  check('female → Saeed', dFemale.memberId === 'saeed' && dFemale.matchedRuleId === 'female-to-saeed', dFemale.memberId)

  const dMaleOld = route({ gender: 'm', ageBand: 'o50' }, rules, { defaultMemberId: 'sara' })
  check('male over 50 → Wael at 0.2 share of voice', dMaleOld.memberId === 'wael' && dMaleOld.acquisition === 0.2)

  const dMaleUnknown = route({ gender: 'm' }, rules, { defaultMemberId: 'sara' })
  check('male with unknown age does NOT match the >50 rule (no guessing) → default',
    dMaleUnknown.memberId === 'sara' && dMaleUnknown.matchedRuleId === null)

  const dEmpty = route({}, rules, { defaultMemberId: 'sara' })
  check('no signals → the dynamic default', dEmpty.memberId === 'sara' && dEmpty.matchedRuleId === null)

  const dHi = route({ gender: 'f' }, [{ id: 'x', when: { gender: 'f' }, route: { memberId: 'saeed', acquisition: 1.5 } }], { defaultMemberId: 'sara' })
  check('acquisition clamps to 1', dHi.acquisition === 1)
  const dLo = route({}, [], { defaultMemberId: 'sara', defaultAcquisition: -0.2 })
  check('acquisition clamps to 0', dLo.acquisition === 0)

  const dSkip = route({ gender: 'f' }, rules, { defaultMemberId: 'sara', availableIds: ['sara'] })
  check('a rule pointing at an unhired member is skipped → default',
    dSkip.memberId === 'sara' && dSkip.matchedRuleId === null)

  check('fromDubai:false matches only a KNOWN false, never unknown',
    matches({ fromDubai: false }, { fromDubai: false }) === true && matches({ fromDubai: false }, {}) === false)
  check('an empty condition matches anyone', matches({}, { gender: 'm', ageBand: 'u30' }) === true)

  const probs = validateRules([
    { id: 'a', when: {}, route: { memberId: 'ghost', acquisition: 0.5 } },
    { id: 'b', when: {}, route: { memberId: 'sara', acquisition: 2 } },
    { id: 'a', when: {}, route: { memberId: 'sara', acquisition: 0.5 } },
  ], memberIds())
  check('validateRules flags an unknown member', probs.some((p) => p.ruleId === 'a' && /unknown member/.test(p.problem)))
  check('validateRules flags out-of-range acquisition', probs.some((p) => p.ruleId === 'b' && /0\.\.1/.test(p.problem)))
  check('validateRules flags a duplicate rule id', probs.some((p) => /duplicate/.test(p.problem)))
}

console.log('\n── the prompt reuses the coordinator brain ──')
{
  const sara = getMember('sara')
  check('the fixture exists', !!sara)
  if (sara) {
    const prompt = memberSystemPrompt(sara, { company: 'Acme Realty' })
    check('reuses MASTER_SYSTEM_PROMPT (the shared brain)', prompt.includes('COORDINATOR'))
    check('names the member', prompt.includes('SARA'))
    check('fills the transparency line with the company (no {company} left)',
      prompt.includes('Acme Realty') && !prompt.includes('{company}'))
    check('carries the Note-liability line', prompt.includes('Inside the account Note'))
  }
}

console.log('\n── the boundary: a lead signal can never become ad targeting ──')
{
  const routingSrc = readFileSync(join(process.cwd(), 'lib/freehold/visual-sales-routing.ts'), 'utf8')
  check('routing imports no ad layer', !/@\/lib\/meta/.test(routingSrc))
  check('routing names no ad-targeting type', !/CampaignTargeting/.test(routingSrc))
  check('routing calls no audience planner', !/planPersona|hardenRealEstate|resolvePersona/.test(routingSrc))

  const keys = Object.keys(route({}, [], { defaultMemberId: 'sara' })).sort().join(',')
  check('a decision carries only member+acquisition+rule+reason (no demographics leak out)',
    keys === 'acquisition,matchedRuleId,memberId,reason', keys)

  const teamSrc = readFileSync(join(process.cwd(), 'lib/freehold/visual-sales-team.ts'), 'utf8')
  check('the catalog declares no identity/voice clone anywhere',
    !/(identityClone|voiceClone)\s*:\s*true/.test(teamSrc))
}

if (failures) { console.error(`\n${failures} Visual Sales Team guard(s) broken.`); process.exit(1) }
console.log('\nThe form hires a team, the team sells honestly, and who a lead is never decides who an ad reaches.\n')
