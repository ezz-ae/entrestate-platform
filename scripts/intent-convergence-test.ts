/**
 * ENGINE 07 — THE INTENT CONVERGENCE INDEX, locked.
 *
 * The spec's own examples are the tests: two apartments in JVC is a
 * convergent buyer; a villa in Arabian Ranches then an apartment in JVC is
 * a scattered profile. Between them sits the rule that decides who gets a
 * broker's next fifteen minutes, so the arithmetic, the threshold and the
 * vocabulary (three languages, the market's abbreviations) are pinned here.
 *
 * Then the wiring: every inbound door that meets a person the CRM already
 * holds registers the touch, and the Meta sync folds a second row into the
 * first instead of handing two cards to two brokers.
 *
 * Pure — no DB, no network. Runs in `pnpm guards`.
 */
import fs from 'node:fs'
import path from 'node:path'
import {
  ICI_WEIGHTS, ICI_CONVERGENT, ASSET_TYPES, AREA_ALIASES,
  detectArea, detectAssetType, areaKeyOf, assetTypeOfUnits, describeInquiry, intentConvergence,
} from '../lib/freehold/intent-convergence'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

console.log('\n── the formula is the spec\'s formula ──')
{
  check('type and area weigh 0.5 each', ICI_WEIGHTS.type === 0.5 && ICI_WEIGHTS.area === 0.5)
  check('convergent at 0.5 and above', ICI_CONVERGENT === 0.5)
  const jvc1 = describeInquiry({ interest: '2BR apartment in JVC' })
  const jvc2 = describeInquiry({ interest: 'Studio apartment, Jumeirah Village Circle' })
  const r = intentConvergence(jvc1, jvc2)
  check('two apartments in JVC → ICI 1.0, convergent', r.ici === 1 && r.convergent, JSON.stringify(r))
  const villa = describeInquiry({ interest: 'Villa in Arabian Ranches' })
  const s = intentConvergence(villa, jvc1)
  check('a villa in Arabian Ranches then an apartment in JVC → 0, scattered', s.ici === 0 && !s.convergent, JSON.stringify(s))
  const marinaVilla = describeInquiry({ interest: 'villa, Dubai Marina' })
  const marinaApt = describeInquiry({ interest: 'apartment in Marina' })
  const t = intentConvergence(marinaVilla, marinaApt)
  check('same area, different asset class → exactly 0.5, convergent (the threshold is inclusive)', t.ici === 0.5 && t.convergent, JSON.stringify(t))
  const aptA = describeInquiry({ interest: 'apartment in JVC' })
  const aptB = describeInquiry({ interest: 'apartment in Business Bay' })
  const u = intentConvergence(aptA, aptB)
  check('same asset class, different area → 0.5, convergent', u.ici === 0.5 && u.convergent, JSON.stringify(u))
}

console.log('\n── unknown is not a match ──')
{
  const blank = describeInquiry({})
  const r = intentConvergence(blank, blank)
  check('two inquiries the system knows nothing about → 0, never convergent by absence', r.ici === 0 && !r.convergent, JSON.stringify(r))
  const half = intentConvergence(describeInquiry({ interest: 'apartment' }), describeInquiry({ interest: 'apartment somewhere nice' }))
  check('type known on both, area on neither → 0.5 from the type alone', half.ici === 0.5, JSON.stringify(half))
  const one = intentConvergence(describeInquiry({ interest: 'apartment in JVC' }), describeInquiry({ interest: 'something in JVC' }))
  check('area known on both, type on one → 0.5 from the area alone', one.ici === 0.5 && one.typeMatch === 0, JSON.stringify(one))
  check('the inventory\'s default city name is not an area', areaKeyOf('Dubai') === null && areaKeyOf('دبي') === null)
  check('an empty unit-type list is not "apartment"', assetTypeOfUnits([]) === null)
}

console.log('\n── the same project is the same thing in the same place ──')
{
  const a = describeInquiry({ projectSlug: 'sobha-one-tower-a' })
  const b = describeInquiry({ projectSlug: 'SOBHA-ONE-TOWER-A' })
  const r = intentConvergence(a, b)
  check('same slug (case-insensitive) → 1.0 even with nothing else known', r.ici === 1 && r.sameProject, JSON.stringify(r))
  const c = describeInquiry({ projectSlug: 'sobha-one-tower-a', projectArea: 'Jumeirah Village Circle', projectUnitTypes: ['1BR', '2BR'] })
  const d = describeInquiry({ projectSlug: 'other-tower', interest: 'apartment in JVC' })
  const s = intentConvergence(c, d)
  check('the project\'s own area and unit types describe the inquiry', c.area === 'jvc' && c.assetType === 'apartment' && s.ici === 1, JSON.stringify({ c, s }))
  const villaProject = describeInquiry({ projectSlug: 'x', projectArea: 'Damac Hills 2', projectUnitTypes: ['Villa 3BR', 'Villa 4BR'], interest: 'apartment please' })
  check('the project\'s unit types outrank the text', villaProject.assetType === 'villa' && villaProject.area === 'damac_hills', JSON.stringify(villaProject))
}

console.log('\n── the vocabulary speaks three languages and the market\'s shorthand ──')
{
  check('every canonical area has at least one spelling', Object.values(AREA_ALIASES).every((a) => a.length > 0))
  check('JVC / Jumeirah Village Circle / قرية جميرا الدائرية / джумейра вилладж серкл are one area',
    ['JVC', 'Jumeirah Village Circle', 'قرية جميرا الدائرية', 'Джумейра Вилладж Серкл'].every((s) => detectArea(s) === 'jvc'))
  check('JVC and JVT are not the same area', detectArea('a flat in jvt') === 'jvt' && detectArea('a flat in jvc') === 'jvc')
  check('"dubai hills" never resolves to a bare Dubai', detectArea('Dubai Hills Estate') === 'dubai_hills')
  check('Arabic: فيلا في المرابع العربية', detectArea('فيلا في المرابع العربية') === 'arabian_ranches' && detectAssetType('فيلا في المرابع العربية') === 'villa')
  check('Russian: квартира в Дубай Марина', detectArea('квартира в Дубай Марина') === 'marina' && detectAssetType('квартира в Дубай Марина') === 'apartment')
  check('a landing slug is readable too', detectArea('lp/business-bay-2br') === 'business_bay' && detectAssetType('lp/business-bay-2br') === 'apartment')
  check('"penthouse apartment" is a penthouse', detectAssetType('penthouse apartment on the palm') === 'penthouse')
  check('"villa plot" is a plot', detectAssetType('villa plot in the valley') === 'plot')
  check('a studio is an apartment (a size, not a class), and not Studio City', detectAssetType('studio in arjan') === 'apartment' && detectArea('studio in arjan') === 'arjan')
  check('Studio City is an area, not a unit', detectArea('dubai studio city') === 'studio_city')
  check('every asset type is enumerable', ASSET_TYPES.length === 6)
  check('nothing in the vocabulary is about a person', !Object.values(AREA_ALIASES).flat().some((a) => /nationalit|citizen|passport/i.test(a)))
}

console.log('\n── the wiring: every door that meets a known person registers the touch ──')
{
  const web = stripComments(read('app/api/leads/route.ts'))
  check('the landing form registers the repeat inquiry through the ICI', web.includes('registerInboundTouch({') && web.includes('logActivity: false'))
  check('…and finds lost leads too, so Engine 07 can revive them', !web.includes("WHERE status NOT IN ('closed', 'converted', 'lost')"))
  check('…while a past buyer gets a fresh card', web.includes('returningBuyerOf'))
  const meta = stripComments(read('lib/freehold/meta-lead-sync.ts'))
  check('the Meta sync folds a second row into the first', meta.includes('mergeInboundDuplicate(inserted[0].id'))
  check('…and does not distribute the merged row', /const survivor = await mergeInboundDuplicate[\s\S]*?if \(survivor\) continue[\s\S]*?handleNewLead\(/.test(meta))
  const chat = stripComments(read('app/api/ai/chat/route.ts'))
  check('the chat door registers a second inquiry', chat.includes('registerInboundTouch({'))
  for (const rel of ['app/api/freehold/public/agent/[handle]/lead/route.ts', 'app/api/pdf/project/route.ts']) {
    check(`${rel} merges a duplicate before rating`, stripComments(read(rel)).includes('mergeInboundDuplicate('))
  }
  const touch = stripComments(read('lib/freehold/inbound-touch.ts'))
  check('a convergent touch arms the 15-minute clock', touch.includes('armNeglectClock(lead.id, now)'))
  check('…tells the owner in-app', touch.includes("notify('lead_convergent'"))
  check('…and never escalates a divergent one', /if \(ici\.convergent && open\)/.test(touch))
  check('a lost lead re-engaging is revived to new', touch.includes("SET status = 'new'") && touch.includes("fromStatus: 'lost', toStatus: 'new'"))
  check('every evaluation lands in the ledger with its coefficients', touch.includes("reason: ici.convergent ? 'ici_convergent' : 'ici_divergent'") && touch.includes('typeMatch: ici.typeMatch'))
  const bell = stripComments(read('components/freehold/notifications-bell.tsx'))
  check('the bell has words for the convergent alert', bell.includes("t('notif.leadConvergent'"))
}

if (failures > 0) {
  console.error(`\n${failures} intent-convergence rule(s) broken.`)
  process.exit(1)
}
console.log('\nA second inquiry is read for what it means, and only the convergent one takes a broker\'s next fifteen minutes.\n')
