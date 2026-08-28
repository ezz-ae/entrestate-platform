/**
 * THE PAYROLL IS WRITEABLE, AND ONLY BY THE PEOPLE WHO PAY — locked.
 *
 * sales-employment.ts became the store every calling gate reads, and for one
 * commit nothing could write to it: assignCaller() answered "nobody is employed"
 * forever and the call button was unreachable by construction. This route is the
 * missing half, and three things must stay true of it:
 *
 *   1. HIRING IS NARROWER THAN CALLING. A broker places calls; only management
 *      changes the payroll, because a hire is a recurring charge and ending one
 *      silently takes a colleague off the phones. The write list must be a
 *      STRICT subset of the read list.
 *   2. EVERY WRITE IS VALIDATED AGAINST THE CATALOGUE. A payroll row for an id
 *      nobody employs is a row nothing can ever pay; a term outside
 *      EMPLOYMENT_TERMS is a call that can never be planned.
 *   3. THE SCREEN NAMES THE FIX, NOT A COLOUR. Not hired, ads-only, still
 *      training, no voice, shared voice — five different problems with five
 *      different fixes, so five different sentences in three languages.
 *
 * Pure: source text and the dictionaries. No database, no session.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { EMPLOYMENT_TERMS } from '../lib/freehold/sales-employment'
import { SALES_TEAM } from '../lib/freehold/visual-sales-team'
import { lm_calling } from '../lib/i18n/dictionaries/lm_calling'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const route = readFileSync(join(process.cwd(), 'app/api/sales-team/route.ts'), 'utf8')
const panel = readFileSync(join(process.cwd(), 'app/freehold-intelligence/lead-machine/calling/team-panel.tsx'), 'utf8')
const page = readFileSync(join(process.cwd(), 'app/freehold-intelligence/lead-machine/calling/page.tsx'), 'utf8')
const callRoute = readFileSync(join(process.cwd(), 'app/api/calling/route.ts'), 'utf8')

console.log('\n── rule 1: hiring is narrower than calling ──')
{
  const readList = /const CAN_READ = \[([^\]]*)\]/.exec(route)?.[1] ?? ''
  const writeList = /const CAN_WRITE = \[([^\]]*)\]/.exec(route)?.[1] ?? ''
  check('both lists exist', readList.length > 0 && writeList.length > 0)
  check('reading is open to the desk (brokers included)', /broker/.test(readList))
  check('writing is NOT open to brokers', !/broker/.test(writeList), writeList)
  check('writing is management only', /MANAGEMENT_ROLES/.test(writeList) && !/team_leader|marketing/.test(writeList), writeList)
  check('GET is guarded by the read list', /requireSession\(\[\.\.\.CAN_READ\]\)/.test(route))
  check('POST is guarded by the write list', /requireSession\(\[\.\.\.CAN_WRITE\]\)/.test(route))
  // The calling route lets brokers dial — proving the two lists really differ.
  check('brokers may still place calls', /const ALLOWED = \[[^\]]*'broker'/.test(callRoute))
}

console.log('\n── rule 2: writes are validated against the catalogue ──')
{
  check('an unknown member is refused', /if \(!getMember\(memberId\)\)/.test(route))
  check('an unknown term is refused', /EMPLOYMENT_TERMS\.includes\(term\)/.test(route))
  check('an unknown action is refused', /Unknown action/.test(route))
  check('the three actions are the only ones', /'hire'|'end'|'train'/.test(route)
    && (route.match(/case '(hire|end|train)'/g) ?? []).length === 3)
}

console.log('\n── the roster answer is the whole team, hired or not ──')
{
  check('it maps over the catalogue, not just the payroll', /SALES_TEAM\.map\(/.test(route))
  check('it reports the readiness blocker per member', /rosterReadiness\(/.test(route))
  check('it sends the training threshold so the screen need not hardcode it', /threshold: READINESS_THRESHOLD/.test(route))
  check('it sends the keep-teaching and never-hired lists', /stillTraining\(/.test(route) && /notHired\(/.test(route))
}

console.log('\n── rule 3: the screen names the fix ──')
{
  const keys = [
    'lm.team.title', 'lm.team.subtitle', 'lm.team.loading', 'lm.team.loadFailed',
    'lm.team.actionFailed', 'lm.team.ready', 'lm.team.notHired', 'lm.team.adsOnly',
    'lm.team.training', 'lm.team.noVoice', 'lm.team.voiceShared', 'lm.team.end', 'lm.team.train',
    ...EMPLOYMENT_TERMS.map((t) => `lm.team.term.${t}`),
  ]
  for (const lang of ['en', 'ar', 'ru'] as const) {
    const missing = keys.filter((k) => !(lm_calling[lang] as Record<string, string>)[k])
    check(`${lang}: every hiring word is present`, missing.length === 0, missing.join(','))
  }
  check('every employment term has a label', EMPLOYMENT_TERMS.every((t) => !!(lm_calling.en as Record<string, string>)[`lm.team.term.${t}`]))
  check('the ads-only sentence says it cannot call',
    /never the phone/i.test((lm_calling.en as Record<string, string>)['lm.team.adsOnly']))
  check('the training sentence carries both numbers',
    /\{level\}/.test((lm_calling.en as Record<string, string>)['lm.team.training'])
    && /\{threshold\}/.test((lm_calling.en as Record<string, string>)['lm.team.training']))
  check('the panel distinguishes all five states',
    ['noneEmployed', 'noneTrained', 'voiceShared', 'adsOnly', 'ready'].every((k) => panel.includes(k)))
}

console.log('\n── it is reachable ──')
{
  check('the panel is mounted on the calling screen', /<TeamPanel \/>/.test(page))
  check('the panel is a client island', /^'use client'/.test(panel))
  check('it talks to the hiring API', /\/api\/sales-team/.test(panel))
  check('it reloads after every change', /await load\(\)/.test(panel))
  check('the catalogue has members to hire', SALES_TEAM.length >= 4)
}

if (failures) { console.error(`\n${failures} hiring-desk guard(s) broken.`); process.exit(1) }
console.log('\nA broker can call; only the people paying can hire — and every card says what it needs next.\n')
