/**
 * THE HOME OPENS AS A QUESTION, AND EVERY DOOR ON IT LEADS SOMEWHERE REAL — locked.
 *
 * The owner sent a screenshot of an assistant's home — a greeting as a
 * question, a composer, a row of doors that each open three creative
 * starters, two live panels beneath — and said: this style, for the system
 * home page when they enter. This file keeps the shape honest:
 *
 *   · seven doors, three starters each, each starter one of two kinds —
 *     `ask` (its own title is handed to the docked Expert, so what was read
 *     is what was asked) or `href` (a builder or screen opens);
 *   · every href points inside the workspace; every ask has no href;
 *   · the words: no banned word, no promised number in a starter's sub —
 *     a starter names an outcome the Expert answers from data, never a
 *     figure the home would have to know already;
 *   · the two panels have honest empty states, never a demo row;
 *   · the title greets by first name and names the workspace's own Expert.
 *
 * Pure — no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { STARTER_DOORS, STARTER_DOOR_IDS, starterKeys } from '../lib/freehold/hub-starters'
import { hub_starters } from '../lib/i18n/dictionaries/hub_starters'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

const LOCALES = ['en', 'ar', 'ru'] as const

console.log('\n── seven doors, three starters each ──')
{
  check('seven doors', STARTER_DOORS.length === 7, String(STARTER_DOORS.length))
  check('no door twice', new Set(STARTER_DOOR_IDS).size === STARTER_DOOR_IDS.length)
  for (const d of STARTER_DOORS) {
    check(`${d.id}: exactly three starters, numbered 1..3`,
      d.starters.length === 3 && d.starters.map((s) => s.n).join('') === '123')
    check(`${d.id}: an ask carries no href, an href carries one inside the workspace`,
      d.starters.every((s) => s.kind === 'ask' ? !s.href : typeof s.href === 'string' && s.href.startsWith('/freehold-intelligence/')))
    check(`${d.id}: "View all" points inside the workspace`, d.href.startsWith('/freehold-intelligence'))
    check(`${d.id}: at least one starter is a thing the Expert does, not a link`,
      d.starters.some((s) => s.kind === 'ask'))
  }
  const asks = STARTER_DOORS.flatMap((d) => d.starters).filter((s) => s.kind === 'ask').length
  // 21 starters; three are builders (the page builder, the web designer,
  // finance) that the Expert cannot stand in for. Everything else is an ask.
  check('the row is mostly the Expert: 18 of 21 starters are asks', asks === 18, String(asks))
}

console.log('\n── the words ──')
{
  const banned = [/\bfree\b/i, /مجان/, /бесплат/i]
  for (const locale of LOCALES) {
    const dict = hub_starters[locale]
    const all = STARTER_DOORS.flatMap((d) => starterKeys(d)).map((k) => dict[k] ?? '')
    check(`${locale}: every door and starter has words`, all.every((v) => v.trim().length > 0))
    check(`${locale}: the banned word appears nowhere on the home`,
      !Object.values(dict).some((v) => banned.some((re) => re.test(v))))
    // A starter's sub describes an outcome; a digit in it would be a number
    // the home claims before anyone asked. "30 days", "two questions" and
    // "three priorities" are windows and counts of the request, not results
    // — allowed by name, so a future figure cannot hide behind them.
    const subs = STARTER_DOORS.flatMap((d) => d.starters.map((s) => dict[`hub.arch.${d.id}.${s.n}.s`] ?? ''))
    const allowed = /\b30\b|\bthree\b|\btwo\b|ثلاث|30 يومًا|سؤالان|30 дней|три|два/
    const numeric = subs.filter((v) => /\d/.test(v.replace(allowed, '')))
    check(`${locale}: no starter sub promises a figure`, numeric.length === 0, numeric.join(' | '))
    check(`${locale}: the title greets by name and names the Expert`,
      (dict['hub.arch.title'] ?? '').includes('{name}') && (dict['hub.arch.title'] ?? '').includes('{expert}'))
    for (const k of ['needsYouEmpty', 'sinceEmpty']) {
      check(`${locale}: hub.arch.${k} is an honest empty state, not a demo row`, (dict[`hub.arch.${k}`] ?? '').trim().length > 0)
    }
  }
  check('the ask sentence is the starter\'s own TITLE — nothing hidden is sent',
    /sendToExpert\(t\(`hub\.arch\.\$\{d\.id\}\.\$\{n\}\.t`\)\)/.test(stripComments(read('components/freehold/starter-row.tsx'))))
}

console.log('\n── the home renders the shape ──')
{
  const hub = stripComments(read('app/freehold-intelligence/dashboard-client.tsx'))
  check('the title is the question, with the workspace\'s Expert and the first name',
    /t\('hub\.arch\.title', \{ expert: `\$\{BRAND\.company\} Expert`, name: firstName \}\)/.test(hub))
  check('the first name is the first word of the session name', /split\(\/\\s\+\/\)\[0\]/.test(hub))
  check('the composer sits under the question', /<AiPrompt placeholder=\{t\('hub\.arch\.placeholder'\)\}/.test(hub))
  check('the doors sit under the composer', /<StarterRow \/>/.test(hub))
  check('"Needs you" renders the live signals, and its empty state when there are none',
    /signals\.length > 0 \?/.test(hub) && /t\('hub\.arch\.needsYouEmpty'\)/.test(hub))
  check('"Since yesterday" renders the live activity, and its empty state when there is none',
    /activity\.length > 0 \?/.test(hub) && /t\('hub\.arch\.sinceEmpty'\)/.test(hub))
  check('the activity feed is not rendered twice', (hub.match(/activity\.(slice\(0, 5\)\.)?map\(/g) ?? []).length === 1)
  check('no demo activity fallback', !/demoActivity|DEMO_ACTIVITY|sampleActivity/.test(hub))
  check('the old deep-link button group is gone — the doors replaced it', !/deepLinks/.test(hub))
  check('the Ask-AI affordance on a signal still hands the Expert the concrete task', /sendToExpert\(s\.ai\)/.test(hub))

  const row = stripComments(read('components/freehold/starter-row.tsx'))
  check('one sheet at a time, closed by Escape and outside click',
    /e\.key === 'Escape'/.test(row) && /!rootRef\.current\.contains\(e\.target as Node\)/.test(row))
  check('a door is a button with aria-expanded and a dialog role on its sheet',
    /aria-expanded=\{active\}/.test(row) && /role="dialog"/.test(row))
  check('an href starter navigates with the router; an ask never does',
    /if \(s\.kind === 'href' && s\.href\) \{\s*router\.push\(s\.href\)/.test(row))
}

if (failures > 0) {
  console.error(`\n${failures} home-starter rule(s) broken.`)
  process.exit(1)
}
console.log('\nThe home asks the question, and every door on it opens onto something real.\n')
