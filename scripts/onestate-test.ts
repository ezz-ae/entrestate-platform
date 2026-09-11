/**
 * ONESTATE — THE RULES THE GAME MUST NOT BREAK.
 *
 * The setup is the provisioning, so a bug here is not a cosmetic one: it is a
 * person handed a machine that spends on their behalf before they can read
 * what it is doing. What this file keeps:
 *
 *   · nobody is asked a follow-up before the thing it follows — the ad-budget
 *     cards cannot appear until "I spend on ads already" has been answered;
 *   · a tool taken is ALWAYS followed by its own level question, immediately,
 *     because a switch with no ceiling is the whole failure this design exists
 *     to prevent;
 *   · a tool refused goes on the "later" list rather than vanishing;
 *   · no atom is ever shown twice, and the deck runs out rather than repeating;
 *   · the evidence ceiling holds: somebody who has never run an ad cannot be
 *     given an ads tool above "it drafts", whatever they slid the dial to;
 *   · the cookie is re-checked coming back — levels clamped 0…10, unknown tool
 *     ids dropped, lengths capped — because it came back from a browser and a
 *     browser is a place other people can write;
 *   · the words on the level bands are about consequence, and none of them is
 *     the banned one.
 *
 * Pure — no network, no DOM. Runs in `pnpm guards`.
 */
import {
  ATOMS,
  COMPOSITES,
  PHRASINGS,
  TOOLS,
  WARM_AT,
  composeNext,
  emptyComposerState,
  levelSay,
  record,
  type Card,
} from '../lib/onestate/deck'
import { capFor, decode, encode, keep, provision, ONESTATE_MAX_BYTES } from '../lib/onestate/setup'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => {
  failures++
  console.error(`  ✗ ${m}\n      got: ${got}`)
}

/** A fixed draw, so a failure is a real failure and not a bad afternoon. */
function seeded(n: number) {
  let s = n >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Plays a whole game warmly and hands back every card it was shown. */
function playAll(seed: number, score = 0.9): Card[] {
  const s = emptyComposerState()
  const rand = seeded(seed)
  const seen: Card[] = []
  for (let i = 0; i < 400; i += 1) {
    const card = composeNext(s, rand)
    if (!card) break
    seen.push(card)
    if (card.stop) continue
    record(s, card, score)
  }
  return seen
}

console.log('\nonestate — the deck')

{
  const budgets = ATOMS.filter((a) => a.needs === 'spending').map((a) => a.w)
  if (budgets.length !== 3) fail('three budget bands sit behind "I spend on ads"', String(budgets.length))
  else ok('the ad-budget cards are gated behind having said you spend')
}

{
  // Nobody is asked what they spend before they have said they spend.
  let bad = ''
  for (const seed of [1, 7, 42, 99, 1234]) {
    const s = emptyComposerState()
    const rand = seeded(seed)
    let saidSpending = false
    for (let i = 0; i < 400; i += 1) {
      const card = composeNext(s, rand)
      if (!card) break
      if (card.k === 'ad budget' && !saidSpending) {
        bad = `seed ${seed}: "${card.w}" before any spending was admitted`
        break
      }
      if (card.stop) continue
      record(s, card, 0.9)
      if (card.t.includes('spending')) saidSpending = true
    }
    if (bad) break
  }
  if (bad) fail('a budget is never asked before the spending is', bad)
  else ok('a budget is never asked before the spending is')
}

{
  // A tool taken is followed, at once, by how far it may drive.
  let bad = ''
  for (const seed of [3, 11, 57, 808]) {
    const s = emptyComposerState()
    const rand = seeded(seed)
    let pendingTool: string | null = null
    for (let i = 0; i < 400; i += 1) {
      const card = composeNext(s, rand)
      if (!card) break
      if (pendingTool && card.dialFor !== pendingTool) {
        bad = `seed ${seed}: ${pendingTool} was taken and the next card was "${card.w}"`
        break
      }
      pendingTool = null
      if (card.stop) continue
      record(s, card, 0.9)
      if (card.tool) pendingTool = card.tool
    }
    if (bad) break
  }
  if (bad) fail('a tool taken is followed immediately by its level', bad)
  else ok('a tool taken is followed immediately by its level')
}

{
  // A tool refused is remembered as "later", not dropped.
  const s = emptyComposerState()
  record(s, { w: 'Google Ads', k: 'shall we include it?', t: [], tool: 'google-ads', plain: true }, 0)
  if (!s.profile.later.includes('google-ads')) fail('a refused tool goes on the later list', JSON.stringify(s.profile.later))
  else if (s.queue.length) fail('a refused tool asks no level', String(s.queue.length))
  else ok('a refused tool goes on the later list and asks no level')
}

{
  // The deck runs out. It never repeats itself.
  const seen = playAll(21)
  const atoms = seen.filter((c) => !c.tool && !c.dialFor && !c.stop && !c.composed).map((c) => c.w)
  const dupes = atoms.filter((w, i) => atoms.indexOf(w) !== i)
  if (dupes.length) fail('no atom is shown twice', dupes.slice(0, 3).join(', '))
  else if (seen.length < ATOMS.length) fail('the whole deck is reachable', `${seen.length} cards for ${ATOMS.length} atoms`)
  else ok(`no card repeats, and the deck runs out (${seen.length} cards)`)
}

{
  // Every tool gets offered, and every one of them asks its level.
  const seen = playAll(21)
  const offered = new Set(seen.filter((c) => c.tool).map((c) => c.tool!))
  const dialled = new Set(seen.filter((c) => c.dialFor).map((c) => c.dialFor!))
  const missing = TOOLS.filter((t) => !offered.has(t.id)).map((t) => t.id)
  if (missing.length) fail('every tool is offered in a full game', missing.join(', '))
  else if (offered.size !== dialled.size) fail('every offered tool asked its level', `${offered.size} offered, ${dialled.size} dialled`)
  else ok('every tool is offered, and every one asks how far it drives')
}

{
  // A flat fact never gets dressed up as an opinion.
  const wrong = ATOMS.filter((a) => a.plain && PHRASINGS[a.k]).map((a) => a.w)
  const seen = playAll(5)
  const flatRephrased = seen.filter((c) => c.plain && !c.tool && !c.stop && !ATOMS.some((a) => a.w === c.w))
  if (flatRephrased.length) fail('plain atoms are never re-phrased', flatRephrased[0].w)
  else ok(`plain atoms are shown as written${wrong.length ? ` (${wrong.length} share a kind with phrasings)` : ''}`)
}

{
  // Composites are made of the visitor's own words, never of placeholders.
  const seen = playAll(21)
  const composed = seen.filter((c) => c.composed)
  const leftovers = composed.filter((c) => /\{|\}|undefined/.test(c.w))
  if (leftovers.length) fail('a composite never leaves a blank in it', leftovers[0].w)
  else if (!composed.length) fail('composites are reachable in a warm game', '0 composed')
  else ok(`${composed.length} of ${COMPOSITES.length} composites were built from his own words`)
}

console.log('\nonestate — how far a tool may drive')

{
  const bands = [0, 2, 3, 5, 6, 8, 9, 10].map((n) => levelSay(n))
  const distinct = new Set(bands).size
  if (distinct !== 4) fail('there are four bands, not a slider with a label', String(distinct))
  else if (bands.some((b) => /\bfree\b/i.test(b))) fail('no band uses the banned word', bands.join(' | '))
  else ok('four bands, each about consequence, none using the banned word')
}

{
  // THE RULE THIS WHOLE FILE EXISTS FOR.
  const never = new Set(['noads', 'solo'])
  const cap = capFor('meta-ads', never)
  if (cap > 3) fail('somebody who has never run an ad cannot be handed a live ads machine', String(cap))
  else ok(`never run an ad → ads tools capped at ${cap} (it drafts, you press go)`)

  const spends = new Set(['spending', 'ads', 'budget-l', 'marketer'])
  if (capFor('meta-ads', spends) !== 10) fail('an operator who already spends is not held back', String(capFor('meta-ads', spends)))
  else ok('an operator who already spends can take it all the way')

  if (capFor('whatsapp', new Set(['solo'])) > 5) fail('a desk of one does not let it reply unseen', String(capFor('whatsapp', new Set(['solo']))))
  else ok('a desk of one sees a reply before it goes out')

  if (capFor('report', new Set(['noads', 'solo'])) !== 10) fail('reading tools have no ceiling', String(capFor('report', new Set(['noads', 'solo']))))
  else ok('a tool that only reads has no ceiling')
}

{
  // The dial is a ceiling he chooses; the evidence is a second one.
  const kept = { t: { 'meta-ads': 10, report: 7 }, l: ['crm'], a: [], d: [], w: ['noads', 'solo'] }
  const { now, later } = provision(kept)
  const meta = now.find((p) => p.id === 'meta-ads')
  if (!meta || meta.level > 3) fail('a dial of ten is still held by the evidence', JSON.stringify(meta))
  else if (meta.asked !== 10 || !meta.held) fail('what he asked for, and why it was held, are both kept', JSON.stringify(meta))
  else if (!later.includes('crm')) fail('what he said no to is carried as later', JSON.stringify(later))
  else ok(`asked 10, given ${meta.level}, and told why — "${meta.held}"`)
}

console.log('\nonestate — the trip home')

{
  const profile = {
    warmth: { noads: 0.9, solo: 1, area: 0.8 },
    areas: ['Palm Jumeirah', 'JVC'],
    devs: ['Azizi'],
    tools: { 'meta-ads': 9, crm: 6 },
    later: ['google-ads'],
  }
  const packed = encode(keep(profile, 'Mahmoud', 'Entrestate'))
  if (!packed) fail('a normal game fits in the cookie', 'nothing encoded')
  else if (packed.length > ONESTATE_MAX_BYTES) fail('the cookie stays under its cap', `${packed.length} bytes`)
  else {
    const back = decode(packed)
    if (!back) fail('what went out comes back', 'decode returned null')
    else if (back.c !== 'Entrestate' || back.t['meta-ads'] !== 9) fail('the answers survive the round trip', JSON.stringify(back))
    else ok(`the whole game rides home in ${packed.length} bytes`)
  }
}

{
  // It came back from a browser, so none of it is believed.
  const forged = Buffer.from(
    JSON.stringify({ n: 'x'.repeat(500), c: 'y', t: { 'meta-ads': 99, 'not-a-tool': 4 }, l: ['nope'], a: [1, 2], d: null, w: ['solo'] }),
    'utf8',
  ).toString('base64url')
  const back = decode(forged)
  if (!back) fail('a mangled cookie is refused rather than trusted', 'null')
  else if (back.t['meta-ads'] !== 10) fail('a level above ten is clamped, not honoured', JSON.stringify(back.t))
  else if ('not-a-tool' in back.t) fail('an unknown tool id is dropped', JSON.stringify(back.t))
  else if (back.l.length) fail('an unknown id in the later list is dropped', JSON.stringify(back.l))
  else if (back.n!.length > 60) fail('a long name is cut, not stored', String(back.n!.length))
  else if (back.a.length) fail('non-strings in the named lists are dropped', JSON.stringify(back.a))
  else ok('a forged cookie is clamped, filtered and cut on the way in')
}

{
  if (decode('not base64 at all {{{') !== null) fail('garbage decodes to nothing', 'something')
  else if (decode(undefined) !== null) fail('no cookie decodes to nothing', 'something')
  else ok('garbage and absence both decode to nothing')
}

{
  if (WARM_AT <= 0 || WARM_AT >= 0.5) fail('the warm threshold sits in the dying quarter of the card', String(WARM_AT))
  else ok(`a click counts as warm from ${WARM_AT} across the card`)
}

if (failures) {
  console.error(`\nonestate: ${failures} failure(s)\n`)
  process.exit(1)
}
console.log('\nonestate: all good\n')
