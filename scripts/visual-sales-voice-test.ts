/**
 * TWO SALESPEOPLE NEVER SHARE A VOICE, AND A BORROWED VOICE NEVER CALLS — locked.
 *
 * The three rules in lib/freehold/visual-sales-voice.ts each answer a failure
 * that would otherwise ship quietly:
 *
 *   1. No provider voice id is committed. kloom wrote the reason down first —
 *      the top Fish voices per language are mostly public figures, so a baked-in
 *      id is a likeness landmine — and our catalogue already promises
 *      voiceClone: false.
 *   2. Our roster is mostly Arabic-speaking, so a language+gender lookup alone
 *      hands Sara, Hessa and the Product Authority ONE voice. Three colleagues
 *      calling the same lead in the same voice is the exact failure the
 *      fixed-voice rule exists to prevent.
 *   3. With nothing curated, the provider still speaks — in a voice chosen for
 *      another language. Acceptable in a chat room; on a sales call the accent
 *      says "not a person" before the pitch starts.
 *
 * Pure: env is injected, never read from the machine running the guard.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SALES_TEAM, getMember } from '../lib/freehold/visual-sales-team'
import {
  resolveVoice, voiceKeysFor, primaryIso, bindTeamVoices, voiceCollisions,
  voiceAllowsCalls, callReadyVoices, missingVoiceKeys,
} from '../lib/freehold/visual-sales-voice'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const sara = getMember('sara')!
const hessa = getMember('hessa')!
const saeed = getMember('saeed')!

console.log('\n── rule 1: no voice id is committed to git ──')
{
  const src = readFileSync(join(process.cwd(), 'lib/freehold/visual-sales-voice.ts'), 'utf8')
  // A Fish reference id is a 32-char hex string. None may appear in either file.
  const hex32 = /\b[0-9a-f]{32}\b/
  check('the binding module contains no provider voice id', !hex32.test(src))
  const team = readFileSync(join(process.cwd(), 'lib/freehold/visual-sales-team.ts'), 'utf8')
  check('the catalogue contains no provider voice id', !hex32.test(team))
  check('the catalogue still promises no voice cloning',
    !/voiceClone\s*:\s*true/.test(team) && SALES_TEAM.every((m) => m.voiceClone === false))
}

console.log('\n── resolution order: member first, then language ──')
{
  check('the member key is tried first', voiceKeysFor(sara)[0] === 'FISH_VOICE_MEMBER_SARA', voiceKeysFor(sara)[0])
  check("kloom's language+gender convention is second",
    voiceKeysFor(sara)[1] === 'FISH_VOICE_AR_FEMALE', voiceKeysFor(sara)[1])
  check("kloom's language-only convention is third",
    voiceKeysFor(sara)[2] === 'FISH_VOICE_AR', voiceKeysFor(sara)[2])
  check('a male member asks for the male key', voiceKeysFor(saeed)[1] === 'FISH_VOICE_AR_MALE')
  check('the primary language is the one they greet in', primaryIso(sara) === 'ar')

  const byMember = resolveVoice(sara, { FISH_VOICE_MEMBER_SARA: 'aaa', FISH_VOICE_AR_FEMALE: 'bbb' })
  check('the member key wins over the language key', byMember.refId === 'aaa' && byMember.sourceKey === 'FISH_VOICE_MEMBER_SARA')

  const byLang = resolveVoice(sara, { FISH_VOICE_AR_FEMALE: 'bbb' })
  check('the language key is used when no member key is set', byLang.refId === 'bbb' && byLang.quality === 'native')

  const whitespace = resolveVoice(sara, { FISH_VOICE_MEMBER_SARA: '   ', FISH_VOICE_AR: 'ccc' })
  check('a blank variable is not a voice', whitespace.refId === 'ccc')
}

console.log('\n── rule 3: a fallback voice may chat, never call ──')
{
  const none = resolveVoice(sara, {})
  check('nothing curated → fallback, with no borrowed id', none.quality === 'fallback' && none.refId === '')
  check('a fallback names no source key', none.sourceKey === null)
  check('a fallback may not take a call', voiceAllowsCalls(none) === false)
  check('a curated voice may', voiceAllowsCalls(resolveVoice(sara, { FISH_VOICE_AR_FEMALE: 'bbb' })) === true)

  const missing = missingVoiceKeys({})
  check('with nothing set, every member is reported as missing', missing.length === SALES_TEAM.length)
  check('…and each is told the exact variable to set',
    missing.every((m) => m.suggestedKey.startsWith('FISH_VOICE_MEMBER_')))
}

console.log('\n── rule 2: the Arabic collision the roster would really hit ──')
{
  // The realistic misconfiguration: one Arabic female voice, three Arabic women.
  const env = { FISH_VOICE_AR_FEMALE: 'shared-f', FISH_VOICE_AR_MALE: 'shared-m' }
  const bindings = bindTeamVoices(env)
  const collisions = voiceCollisions(bindings)
  check('the shared female voice is detected as a collision',
    collisions.some((c) => c.refId === 'shared-f' && c.memberIds.length > 1),
    JSON.stringify(collisions))
  check('Sara and Hessa are named in it',
    collisions.some((c) => c.memberIds.includes('sara') && c.memberIds.includes('hessa')))
  check('a colliding member is NOT call-ready even though its voice is curated',
    !callReadyVoices(bindings).includes('sara'))

  // Give each their own and the collision clears.
  const fixed = bindTeamVoices({
    ...env,
    FISH_VOICE_MEMBER_SARA: 'v-sara',
    FISH_VOICE_MEMBER_HESSA: 'v-hessa',
    FISH_VOICE_MEMBER_AUTHORITY: 'v-authority',
    FISH_VOICE_MEMBER_SAEED: 'v-saeed',
    FISH_VOICE_MEMBER_WAEL: 'v-wael',
    FISH_VOICE_MEMBER_CLOSER: 'v-closer',
  })
  check('per-member voices clear every collision', voiceCollisions(fixed).length === 0)
  check('…and the whole roster becomes call-ready', callReadyVoices(fixed).length === SALES_TEAM.length)
  check('an empty roster binding collides with nothing', voiceCollisions(bindTeamVoices({})).length === 0)
}

if (failures) { console.error(`\n${failures} voice-binding guard(s) broken.`); process.exit(1) }
console.log('\nEvery salesperson owns their voice, and a voice nobody curated never reaches a phone.\n')
