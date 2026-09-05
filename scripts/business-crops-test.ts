/**
 * THE SITE SHOWS PIECES OF THE REAL PRODUCT, LARGE, AND NOTHING IT DOES NOT DO — locked.
 *
 * The owner, on the marketing site's images: "full screenshots in a browser
 * frame in a 3×6 cm area — nothing is readable, and even if it were, what
 * would he read? Cut pieces and show them in our colours. The important
 * part is that he finds the strong options he says yes to." And: "the first
 * image talks about a tool we do not even have — we have no AI answering on
 * WhatsApp." And: "when you crop, make the data good — not one lead in a
 * campaign, nothing with a warning, no badly written campaign name."
 *
 * So:
 *   · every crop's words are the PRODUCT's words — each headline line has a
 *     twin in the i18n dictionaries the real screens render from;
 *   · the auto-answering WhatsApp scene is gone: no default thread, no
 *     `<Chat />` without a real conversation, no "by 2:48 it has an answer";
 *   · the data is healthy: no zero as a value, no danger chip, no Hold row,
 *     names written like names;
 *   · the reel is a reel: many frames, a caption each, hover pauses it,
 *     reduced motion stops it;
 *   · the home's hero is the reel and its holders are crops; the form that
 *     talks back replaced the answered-fast claim;
 *   · no client, no company, no real domain — only yourbrokerage.ae.
 *
 * Pure — no network. Runs in `pnpm guards`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { lm_core } from '../lib/i18n/dictionaries/lm_core'
import { lm_ads } from '../lib/i18n/dictionaries/lm_ads'
import { p_forms } from '../lib/i18n/dictionaries/p_forms'
import { inventory } from '../lib/i18n/dictionaries/inventory'
import { p_aim3 } from '../lib/i18n/dictionaries/p_aim3'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : []
  })
}

const CROPS = stripComments(read('components/business/crops.tsx'))
const en = (d: Record<string, Record<string, string>>, k: string) => d.en?.[k] ?? ''

console.log('\n── every crop says what the product says ──')
{
  const twins: Array<[string, string]> = [
    ['Rocket Ad sub', en(lm_core as never, 'lm.w.rocket.sub')],
    ['Rocket Ad note', en(lm_core as never, 'lm.w.rocket.note')],
    ['Who this reaches', en(lm_ads as never, 'lm.reach.title')],
    ['…read back from Meta', en(lm_ads as never, 'lm.reach.sub')],
    ['Form portfolio note', en(lm_core as never, 'lm.forms.portfolioNote').split(':')[0]],
    ['Build a Lookalike', en(p_forms as never, 'pforms.aud.lookalike')],
    ['SHA-256 privacy line', en(p_forms as never, 'pforms.aud.privacy')],
    ['AI edit hint', en(lm_core as never, 'lpe.ai.chatHint')],
    ['AI edit chip · Arabic', en(lm_core as never, 'lpe.ai.chip.arabic')],
    ['AI edit chip · layout', en(lm_core as never, 'lpe.ai.chip.layout')],
  ]
  for (const [label, text] of twins) {
    check(`${label} — the crop carries the product's own line`, text.length > 10 && CROPS.includes(text.replace(/&/g, '&')), text.slice(0, 60))
  }
  for (const src of ['pdf', 'landing', 'image', 'video', 'text', 'link']) {
    const word = en(lm_core as never, `lm.w.rocket.src.${src}`)
    check(`Rocket Ad source "${word}" is the product's`, CROPS.includes(`'${word}'`), word)
  }
  for (const v of ['scale', 'launch', 'fix_first']) {
    const word = en(inventory as never, `inv.verdict.${v}`)
    check(`verdict "${word}" is the product's word`, CROPS.includes(`'${word}'`), word)
  }
  const micro = en(p_aim3 as never, 'paim.micro.subtitle').split(' — ')[0]
  check('the microsite crop opens with the Web Studio\'s own sentence', micro.length > 20 && CROPS.includes(micro), micro)
  // The owner: "'Hi, I'm the form' is weird — this wants the feed, the ad,
  // and the pop-up as a GIF: he sees what was asked and what happened."
  check('the leadform crop is the feed, the ad, and the pop-up moving through its moments',
    /Sponsored/.test(CROPS) && /@keyframes lf-stage/.test(CROPS) && /prefers-reduced-motion: reduce/.test(CROPS) && !/I’m the form/.test(CROPS))
  check('…greeted by a real member of the Visual Sales Team, and ended by a person', /Sara/.test(CROPS) && /Call with/.test(CROPS) && /Omar K\./.test(CROPS))
}

console.log('\n── nothing the product does not do ──')
{
  const visuals = stripComments(read('components/business/visuals.tsx'))
  check('the default WhatsApp thread is gone from visuals', !/DEFAULT_THREAD|answered in 54s/.test(visuals))
  check('Chat requires a real conversation — messages is not optional', /messages: ChatMessage\[\]/.test(visuals) && !/messages\?: ChatMessage/.test(visuals))
  check('HeroVisual fronts a crop, never the phone thread', !/<Chat\b/.test(visuals) && /LeadCardCrop|RocketAdCrop/.test(visuals))
  const files = [...walk(join(process.cwd(), 'app/business')), ...walk(join(process.cwd(), 'components/business'))]
  const bare = files.filter((f) => /<Chat\s*\/>/.test(stripComments(readFileSync(f, 'utf8'))))
  check('no page renders <Chat /> without its own thread', bare.length === 0, bare.map((f) => f.replace(process.cwd() + '/', '')).join(', '))
  const answered = files.filter((f) => /By 2:48 it(’|')s answered|it has an answer, a language|answered fast, tagged/.test(readFileSync(f, 'utf8')))
  check('no page claims the product answers the lead itself', answered.length === 0, answered.map((f) => f.replace(process.cwd() + '/', '')).join(', '))
  check('the crops never say the product answers a WhatsApp', !/answers? (on|the) WhatsApp|auto-?repl/i.test(CROPS))
  check('the lead card says the person answers', /the person answers/.test(CROPS))
}

console.log('\n── the data is healthy ──')
{
  const values = [...CROPS.matchAll(/\['([^']+)', '([^']+)'(?:, '([^']+)')?\]/g)].map((m) => m[2])
  check('no tile shows a zero', !values.some((v) => /^(0|AED 0|0%)$/.test(v)), values.filter((v) => /^(0|AED 0|0%)$/.test(v)).join(','))
  check('no danger chip is drawn', !/<Chip tone="danger"/.test(CROPS))
  check('no Hold row is drawn', !/verdict: 'Hold'/.test(CROPS))
  check('every listing name is written like a name', [...CROPS.matchAll(/name: '([^']+)'/g)].every((m) => /^[A-Z][A-Za-z]+( [A-Za-z0-9—–-]+)*/.test(m[1])))
  check('every ad-ready percentage is ad-ready', [...CROPS.matchAll(/ready: (\d+)/g)].every((m) => Number(m[1]) >= 90))
  check('every verdict row scores at or above the gate, except the one that says fix first',
    [...CROPS.matchAll(/score: (\d+), verdict: '([^']+)'/g)].every((m) => Number(m[1]) >= 70 || m[2] === 'Fix first'))
}

console.log('\n── no client, no company, no real domain ──')
{
  const domains = [...CROPS.matchAll(/[a-z0-9-]+\.(ae|com)\b/g)].map((m) => m[0])
  check('the only address on a crop is yourbrokerage.ae', domains.every((d) => d === 'yourbrokerage.ae'), domains.join(', '))
  check('no LLC, no Real Estate Development, no developer brand', !/\bLLC\b|Real Estate Development|Emaar|Damac|Nakheel|Sobha/i.test(CROPS))
}

console.log('\n── the reel is a reel ──')
{
  const reel = stripComments(read('components/business/crop-reel.tsx'))
  check('it turns by itself', /setInterval\(/.test(reel) && /TURN_MS/.test(reel))
  check('a hand on it stops it', /onMouseEnter=\{\(\) => setHeld\(true\)\}/.test(reel))
  check('reduced motion stops it', /prefers-reduced-motion: reduce/.test(reel) && /held \|\| still/.test(reel))
  check('every frame is announced with its caption', /aria-roledescription="slide"/.test(reel) && /aria-live="polite"/.test(reel))
  const home = stripComments(read('app/business/page.tsx'))
  const frames = (home.match(/\{ key: '[a-z]+', caption: '[^']+', node: </g) ?? []).length
  check('the hero is the reel, with at least six frames', /<CropReel/.test(home) && frames >= 6, String(frames))
  check('the old collage is gone from the home', !/HeroVisual/.test(home))
  check('the holders are flush crops — the holder is the frame, no square on a square',
    /<Holder tone="gold" label="[^"]+" visual=\{<SpendRuleCrop flush \/>\}/.test(home) && /<Holder tone="green" label="[^"]+" visual=\{<LeadformCrop flush \/>\}/.test(home) && /<Holder tone="blue" label="[^"]+" visual=\{<AudienceCrop flush \/>\}/.test(home))
  const holders = stripComments(read('components/business/holders.tsx'))
  check('the three tones are three colours — amber, green, blue — not one blue', /caution/.test(holders) && /positive/.test(holders) && /var\(--brand\)/.test(holders))
  check('a flush crop draws no second border', /flush \? '' : 'overflow-hidden rounded-2xl border/.test(CROPS))
  check('"Leads answered fast" is gone; the form that talks back is here', !/Leads answered fast/.test(home) && /A form that talks back\./.test(home) && /href="\/business\/leadformer"/.test(home))
  check('the banned word appears on no crop and no caption', !/\bfree\b/i.test(CROPS) && !/\bfree\b/i.test(home))
}

if (failures > 0) {
  console.error(`\n${failures} crop rule(s) broken.`)
  process.exit(1)
}
console.log('\nPieces of the real product, large enough to read, and nothing it does not do.\n')
