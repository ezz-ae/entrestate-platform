/**
 * THE LEAD GATE OUTRANKS THE ROSTER, AND A REFUSED VOICE NEVER CALLS BACK — locked.
 *
 * assignCaller() joins two rosters that grew up apart: call-templates.ts owns
 * the call (consent, hours, scripts) and visual-sales-team.ts owns the people.
 * Four things must stay true, and each is a way this would quietly go wrong:
 *
 *   1. THE LEAD GATE RUNS FIRST. A lead who may not be called may not be called
 *      no matter who is free, and the refusal must read as a fact about the
 *      LEAD — an operator who sees "hire someone" when the truth is "no consent
 *      on file" will go hiring.
 *   2. ROSTER REFUSALS ARE REPORTED IN THE ORDER YOU CAN ACT ON THEM. "Nobody
 *      is employed" must never be shown when the real answer is "train the one
 *      you have".
 *   3. THE PERSON THEY TURNED DOWN DOES NOT CALL BACK. call-templates wrote
 *      this rule first, about voices; it is a refusal with a name here.
 *   4. THE CHOICE IS REPRODUCIBLE. A call nobody can explain is a call nobody
 *      can defend when the lead complains.
 *
 * Pure: env, roster and the instant are all injected.
 */
import {
  assignCaller, rosterReadiness, CALLER_REFUSALS, CALLER_REFUSAL_SENTENCES,
  type CallerLead, type RosterState,
} from '../lib/freehold/lead-caller'
import { SALES_TEAM, READINESS_THRESHOLD } from '../lib/freehold/visual-sales-team'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

// A Tuesday, 11:00 Dubai — inside the calling window, no prayer break.
const AT = new Date('2026-09-01T07:00:00Z')

const goodLead: CallerLead = {
  id: 'lead-1',
  phone: '+971500000000',
  marketing_consent_at: '2026-08-01T00:00:00Z',
  language: 'ar',
}

// Everyone employed, everyone trained past the gate, everyone with a voice.
const ALL: RosterState = {
  employed: SALES_TEAM.map((m) => m.id),
  trained: Object.fromEntries(SALES_TEAM.map((m) => [m.id, 95])),
}
const VOICES: Record<string, string> = Object.fromEntries(
  SALES_TEAM.map((m) => [`FISH_VOICE_MEMBER_${m.id.toUpperCase()}`, `v-${m.id}`]),
)

console.log('\n── rule 1: the lead gate outranks the whole roster ──')
{
  const noConsent = assignCaller({ ...goodLead, marketing_consent_at: null }, 'first_contact', AT, ALL, VOICES)
  check('no consent → refused', noConsent.go === false)
  check('…and it reads as a fact about the LEAD, not the team',
    noConsent.go === false && noConsent.leadRefused === true && noConsent.refusal === 'consentMissing',
    noConsent.go === false ? noConsent.refusal : '')

  const dnc = assignCaller({ ...goodLead, do_not_call: true }, 'first_contact', AT, ALL, VOICES)
  check('do-not-call → refused as a lead fact', dnc.go === false && dnc.leadRefused === true)

  // Even a fully-staffed, fully-trained, fully-voiced roster cannot override it.
  check('a perfect roster does not unlock a refused lead',
    assignCaller({ ...goodLead, marketing_consent_at: null }, 'first_contact', AT, ALL, VOICES).go === false)

  // …and outside hours is still a lead-side fact (a Friday prayer break).
  const friday = new Date('2026-09-04T09:00:00Z')
  const hours = assignCaller(goodLead, 'first_contact', friday, ALL, VOICES)
  check('the Dubai hours gate still applies through this module',
    hours.go === false && hours.leadRefused === true, hours.go === false ? hours.refusal : 'went')
}

console.log('\n── a clean call gets a named caller ──')
{
  const a = assignCaller(goodLead, 'first_contact', AT, ALL, VOICES)
  check('it goes', a.go === true, a.go === false ? a.sentence : '')
  if (a.go) {
    check('it names a real member', SALES_TEAM.some((m) => m.id === a.memberId))
    check('it carries the template from call-templates', a.template.id === 'first_contact')
    check('it carries a max duration', a.maxDurationSec > 0)
    check('it carries the voice the dialler speaks with', a.voiceRefId === `v-${a.memberId}`)
    check('it offers alternates for an override', a.alternates.length > 0)
    check('the best available takes it (highest totalRate)', a.memberId === 'authority', a.memberId)
  }
}

console.log('\n── rule 2: roster refusals in the order you can act on them ──')
{
  const nobody = assignCaller(goodLead, 'first_contact', AT, { employed: [] }, VOICES)
  check('nobody employed → noneEmployed', nobody.go === false && nobody.refusal === 'noneEmployed')
  check('…and it is NOT reported as a lead problem', nobody.go === false && nobody.leadRefused === false)

  const untrained = assignCaller(goodLead, 'first_contact', AT,
    { employed: ['sara'], trained: { sara: READINESS_THRESHOLD - 1 } }, VOICES)
  check('employed but under the threshold → noneTrained (not noneEmployed)',
    untrained.go === false && untrained.refusal === 'noneTrained', untrained.go === false ? untrained.refusal : '')

  const voiceless = assignCaller(goodLead, 'first_contact', AT, { employed: ['sara'], trained: { sara: 95 } }, {})
  check('trained but no curated voice → noVoice', voiceless.go === false && voiceless.refusal === 'noVoice')

  // The realistic Arabic collision: one shared female voice.
  const shared = assignCaller(goodLead, 'first_contact', AT,
    { employed: ['sara', 'hessa'], trained: { sara: 95, hessa: 95 } },
    { FISH_VOICE_AR_FEMALE: 'one-voice' })
  check('a shared voice → voiceShared, not noVoice',
    shared.go === false && shared.refusal === 'voiceShared', shared.go === false ? shared.refusal : 'went')

  const wrongLang = assignCaller({ ...goodLead, language: 'ru' }, 'first_contact', AT, ALL, VOICES)
  check('nobody speaks Russian → noLanguage (a human call)',
    wrongLang.go === false && wrongLang.refusal === 'noLanguage', wrongLang.go === false ? wrongLang.refusal : 'went')
}

console.log('\n── rule 3: the one they turned down does not call back ──')
{
  const first = assignCaller(goodLead, 'first_contact', AT, ALL, VOICES)
  check('a first call picks someone', first.go === true)
  if (first.go) {
    const again = assignCaller({ ...goodLead, avoidMemberIds: [first.memberId] }, 'reengagement', AT, ALL, VOICES)
    check('the re-engagement is a different person on the line',
      again.go === true && again.memberId !== first.memberId,
      again.go === true ? again.memberId : again.refusal)
  }

  const onlyOne = assignCaller({ ...goodLead, avoidMemberIds: ['sara'] }, 'reengagement', AT,
    { employed: ['sara'], trained: { sara: 95 } }, VOICES)
  check('when the only person free is the refused one → onlyRefusedCaller',
    onlyOne.go === false && onlyOne.refusal === 'onlyRefusedCaller', onlyOne.go === false ? onlyOne.refusal : 'went')
}

console.log('\n── rule 4: the same inputs always name the same caller ──')
{
  const runs = Array.from({ length: 5 }, () => assignCaller(goodLead, 'first_contact', AT, ALL, VOICES))
  const ids = new Set(runs.map((r) => (r.go ? r.memberId : 'refused')))
  check('five runs, one answer', ids.size === 1, [...ids].join(','))
}

console.log('\n── the roster screen tells each person what is missing ──')
{
  const state = rosterReadiness({ employed: ['sara', 'hessa'], trained: { sara: 95, hessa: 50 } },
    { FISH_VOICE_MEMBER_SARA: 'v-sara' })
  const by = Object.fromEntries(state.map((r) => [r.memberId, r]))
  check('an unemployed member is blocked on employment', by.wael.blocker === 'noneEmployed')
  check('an under-trained member is blocked on training', by.hessa.blocker === 'noneTrained')
  check('a ready member is ready', by.sara.ready === true && by.sara.blocker === null)
  check('every member is accounted for', state.length === SALES_TEAM.length)
}

console.log('\n── every refusal has a sentence ──')
{
  check('all refusals are spoken for',
    CALLER_REFUSALS.every((r) => (CALLER_REFUSAL_SENTENCES[r] ?? '').length > 10))
  check('none of them blames the lead',
    CALLER_REFUSALS.every((r) => !/consent|do-not-call/i.test(CALLER_REFUSAL_SENTENCES[r])))
}

if (failures) { console.error(`\n${failures} lead-caller guard(s) broken.`); process.exit(1) }
console.log('\nThe lead decides whether a call may happen; the team only decides who makes it.\n')
