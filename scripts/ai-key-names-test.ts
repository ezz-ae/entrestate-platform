/**
 * ONE LIST OF KEY NAMES, AND EVERY READER READS IT — locked.
 *
 * The AI credential may arrive under several env names (GEMINI_API_KEY,
 * GEMINI_KEY, GOOGLE_API_KEY, …). Four places in this repo used to keep their
 * own copy of that list, each a little different: the runtime honoured five
 * names, the Integrations page checked three, the /ai-status diagnostic
 * retyped five, and the lead research agent read exactly one. So a deployment
 * keyed under a name the runtime accepted could run chat while the
 * Integrations card said "No AI provider configured — chat will not generate
 * responses", and the research agent said "not configured" on a Vertex-only
 * deployment where every other surface was live. A status that can disagree
 * with the thing it describes is not a status.
 *
 * The list now lives once, in lib/gemini-rest.ts as GEMINI_KEY_NAMES, and
 * carries GOOGLE_GENERATIVE_AI_API_KEY — the name @ai-sdk/google reads by
 * default and the name the Terminal accepts — so the person configuring both
 * halves of the product under one key never has to know which half wanted
 * which spelling.
 *
 * Also here, because the same screenshot surfaced it: the sign-up page's trial
 * note said "Free 14-day trial". The word is banned on every selling surface
 * (the standing rule: benefit before description, and never that word). The
 * three dictionaries are checked, not just the English one.
 *
 * Pure — no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  GEMINI_KEY_NAMES,
  geminiApiKey,
  geminiKeyName,
  geminiStudioKey,
  VERTEX_SENTINEL,
} from '../lib/gemini-rest'
import { googleAiKey } from '../lib/creative-studio/providers'
import { DICTIONARIES } from '../lib/i18n/dictionaries'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

/** Every name that can carry a credential, cleared so a case starts from nothing. */
const ALL_NAMES = [...GEMINI_KEY_NAMES, 'VERTEX_AI_API_KEY', 'VERTEX_AI_SERVICE_ACCOUNT_JSON']
const clearEnv = () => { for (const n of ALL_NAMES) delete process.env[n] }

console.log('\n── the list itself ──')
{
  check('GOOGLE_GENERATIVE_AI_API_KEY is an accepted name — the ai-sdk default and the Terminal\'s',
    (GEMINI_KEY_NAMES as readonly string[]).includes('GOOGLE_GENERATIVE_AI_API_KEY'))
  for (const n of ['GEMINI_API_KEY', 'GEMINI_KEY', 'GOOGLE_API_KEY']) {
    check(`${n} is still accepted — nothing a deployment already set stops working`,
      (GEMINI_KEY_NAMES as readonly string[]).includes(n))
  }
  check('the canonical name wins the tie',
    GEMINI_KEY_NAMES[0] === 'GEMINI_API_KEY', GEMINI_KEY_NAMES[0])
  check('no name is listed twice',
    new Set(GEMINI_KEY_NAMES).size === GEMINI_KEY_NAMES.length)
}

console.log('\n── the readers agree with the list ──')
{
  clearEnv()
  check('nothing set → no name, no key, no sentinel',
    geminiKeyName() === null && geminiStudioKey() === '' && geminiApiKey() === '' && googleAiKey() === '')

  for (const n of GEMINI_KEY_NAMES) {
    clearEnv()
    process.env[n] = '  AIzaSyExampleKeyValue  '
    check(`${n} alone is found under its own name and trimmed`,
      geminiKeyName() === n && geminiStudioKey() === 'AIzaSyExampleKeyValue',
      `${geminiKeyName()} / ${geminiStudioKey()}`)
    check(`…and the creative-studio reader sees the same key`,
      googleAiKey() === 'AIzaSyExampleKeyValue', googleAiKey())
  }

  clearEnv()
  process.env.GEMINI_KEY = '   '
  check('a blank value is not a key', geminiKeyName() === null && geminiApiKey() === '')

  clearEnv()
  process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON = '{"type":"service_account"}'
  check('Vertex alone → the sentinel for callers that route, and NOT for callers that build requests',
    geminiApiKey() === VERTEX_SENTINEL && geminiStudioKey() === '' && googleAiKey() === '',
    `${geminiApiKey()} / ${geminiStudioKey()}`)

  clearEnv()
  process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON = '{"type":"service_account"}'
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'AIzaSyOther'
  check('a real key outranks the sentinel', geminiApiKey() === 'AIzaSyOther', geminiApiKey())
  clearEnv()
}

console.log('\n── nobody keeps a private copy ──')
{
  // The bug was four lists. The assertion is on SOURCE: no module outside
  // lib/gemini-rest.ts may read a key name from process.env directly.
  const readers = [
    'lib/freehold/integration-status.ts',
    'app/api/freehold/creative-studio/ai-status/route.ts',
    'lib/creative-studio/providers.ts',
    'lib/freehold/lead-profile.ts',
    'lib/freehold/server-ai.ts',
    'lib/freehold/ai-sdk.ts',
  ]
  const direct = new RegExp(`process\\.env\\.(${GEMINI_KEY_NAMES.join('|')})\\b`)
  for (const rel of readers) {
    const src = stripComments(read(rel))
    check(`${rel} reads no key name from process.env itself`, !direct.test(src), direct.exec(src)?.[0] ?? '')
  }

  const status = stripComments(read('lib/freehold/integration-status.ts'))
  check('the Integrations card decides "gemini" from GEMINI_KEY_NAMES',
    /hasAny\(\.\.\.GEMINI_KEY_NAMES\)/.test(status))
  check('…and "vertex" from vertexConfigured(), which also honours VERTEX_AI_API_KEY',
    /const vertexOk = vertexConfigured\(\)/.test(status))

  const diag = stripComments(read('app/api/freehold/creative-studio/ai-status/route.ts'))
  check('the /ai-status diagnostic lists GEMINI_KEY_NAMES, not a retyped array',
    /GEMINI_KEY_NAMES\.filter/.test(diag) && !/const KEY_NAMES\s*=/.test(diag))
  check('…and names the key the runtime resolves (geminiKeyName), not its own first hit',
    /resolvedName = geminiKeyName\(\)/.test(diag))

  const providers = stripComments(read('lib/creative-studio/providers.ts'))
  check('googleAiKey IS geminiStudioKey — raw key, never the sentinel, one definition',
    /export const googleAiKey = geminiStudioKey/.test(providers))

  const profile = stripComments(read('lib/freehold/lead-profile.ts'))
  check('the research agent asks geminiApiKey(), so a Vertex-only deployment can research',
    /if \(!geminiApiKey\(\)\)/.test(profile) && /const apiKey = geminiApiKey\(\)/.test(profile))
  check('…and its refusal names no single env var',
    !/GEMINI_API_KEY is not configured/.test(profile))
}

console.log('\n── the AI card tells the truth about one door ──')
{
  // Two doors to the same models are alternatives, not halves of one
  // credential. A Gemini key alone once read as "partial" and put the card on
  // the launch-blocker list while the Expert was answering; and "Live via
  // Gemini API" was printed for two hours over a key Google refused. Now: one
  // door = connected, and a probe asks Google and prints its answer.
  const status = stripComments(read('lib/freehold/integration-status.ts'))
  check('a Gemini key OR a Vertex credential is connected — never partial',
    /let aiState: IntegrationState = geminiOk \|\| vertexOk \? 'connected' : 'disconnected'/.test(status))
  check('the AI card has no partial state left', !/aiState === 'partial'/.test(status))
  check('when probing, the key is put to Google with one ListModels read',
    /async function probeGeminiKey\(key: string\)/.test(status)
      && /generativelanguage\.googleapis\.com\/v1beta\/models\?pageSize=1/.test(status)
      && /'x-goog-api-key': key/.test(status))
  check('…bounded to five seconds', /setTimeout\(\(\) => ctrl\.abort\(\), 5_000\)/.test(status))
  check('…only when asked (opts.probe) and only when a key exists', /if \(opts\.probe && geminiOk\)/.test(status))
  check('a refused key is reported as error with Google\'s own HTTP status',
    /aiState = vertexOk \? 'connected' : 'error'/.test(status) && /Google answered HTTP \$\{res\.status\}/.test(status))
  check('…and the note says so in the card', /The key is saved, but Google refuses it\./.test(status))
  check('the probe never generates — no generateContent, no prompt', !/generateContent|contents:/.test(status))
  check('Vertex is not probed here (no token minting on a status page)', !/vertexGenerateContent|getAccessToken|oauth2/.test(status))
}

console.log('\n── the sign-up note sells without the banned word ──')
{
  const banned = [/\bfree\b/i, /مجان/, /бесплат/i]
  for (const [lang, dict] of Object.entries(DICTIONARIES)) {
    const note = String((dict as Record<string, string>)['wl.signup.trialNote'] ?? '')
    check(`${lang}: wl.signup.trialNote exists`, note.length > 0)
    check(`${lang}: …keeps the {credit} placeholder — the welcome credit, not a number of days`, note.includes('{credit}') && !note.includes('{days}'), note)
    check(`${lang}: …and never says the word`, !banned.some((re) => re.test(note)), note)
    const realtor = String((dict as Record<string, string>)['wl.signup.realtorNote'] ?? '')
    check(`${lang}: wl.signup.realtorNote never says it either`, !banned.some((re) => re.test(realtor)), realtor)
  }
}

if (failures > 0) {
  console.error(`\n${failures} AI-key-name rule(s) broken.`)
  process.exit(1)
}
console.log('\nOne list of names, every reader reads it, and the sign-up page sells without the word.\n')
