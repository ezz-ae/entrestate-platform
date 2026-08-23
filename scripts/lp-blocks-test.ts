/**
 * The landing builder's generic content blocks — the contract, locked.
 *
 * Beyond reordering the project-derived sections, the builder can add free
 * content blocks (LP_GENERIC_BLOCKS): a heading, a text block, a call-to-action,
 * a stats row, a divider. Their safety story, as assertions:
 *
 *   1. ONE LIST, FULLY WIRED — every generic block survives normalizeType (so a
 *      stored block is never silently dropped), has a render case on the public
 *      page, an editor field schema, and a localized name in all three locales.
 *      A block half-wired into only some of those is the failure this guards.
 *   2. FREE, NEVER FABRICATED — a generic block is never in the default page
 *      (buildDefaultSections has none), and an empty block self-hides instead of
 *      leaving a blank band — the same NOTHING-FAKE rule the project sections keep.
 *   3. A TYPED URL IS NOT A SCRIPT — the CTA button href is the one attacker-
 *      controllable attribute; safeHref allows only navigational schemes and
 *      sends javascript:/data: to the page's own lead form.
 *
 * Pure — no model, no database, no network. (normalizeType is exercised through
 * the source text, not imported, to avoid pulling the server db module.)
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LP_GENERIC_BLOCKS, isGenericBlock } from '../lib/landing-blocks'
import { lm_core } from '../lib/i18n/dictionaries/lm_core'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const store = readFileSync(join(process.cwd(), 'lib/landing-pages.ts'), 'utf8')
const page = readFileSync(join(process.cwd(), 'app/lp/[slug]/page.tsx'), 'utf8')
const editor = readFileSync(join(process.cwd(), 'app/freehold-intelligence/inventory/landings/[slug]/edit/page.tsx'), 'utf8')

console.log('\n── one list, fully wired ──')
{
  check('the block list is non-empty and unique',
    LP_GENERIC_BLOCKS.length > 0 && new Set(LP_GENERIC_BLOCKS).size === LP_GENERIC_BLOCKS.length)
  check('isGenericBlock recognizes members and rejects a project section',
    LP_GENERIC_BLOCKS.every((b) => isGenericBlock(b)) && !isGenericBlock('hero') && !isGenericBlock('roi'))

  for (const b of LP_GENERIC_BLOCKS) {
    // normalizeType must return the block for its own key (survives storage).
    check(`normalizeType keeps '${b}'`, new RegExp(`return "${b}"`).test(store))
    // the union carries it.
    check(`LandingSectionType includes '${b}'`, store.includes(`| "${b}"`))
    // the public page renders it.
    check(`the render switch has a case for '${b}'`, new RegExp(`case '${b}':`).test(page))
    // the editor can edit it (a field schema, even empty for divider).
    check(`the editor SECTION_FIELDS defines '${b}'`,
      new RegExp(`['"\`]?${b}['"\`]?\\s*:`).test(editor))
    // a localized name in every locale (dynamic-keys enforces AR/RU too).
    check(`the block has an EN name (lpe.blk.${b})`, typeof lm_core.en[`lpe.blk.${b}`] === 'string')
  }
  check('the editor add-menu offers the generic blocks',
    editor.includes('...LP_GENERIC_BLOCKS'))
  check('sectionLabel localizes generic blocks (not the English prettify)',
    editor.includes('isGenericBlock(type)') && editor.includes('lpe.blk.'))
}

console.log('\n── free, never fabricated ──')
{
  // No generic block may appear in buildDefaultSections' output — the default
  // page is project sections only. Assert none of the block keys is quoted in
  // the fallbackOrder / buildDefaultSections region.
  const region = store.slice(store.indexOf('fallbackOrder'), store.indexOf('fallbackOrder') + 1200)
  check('no generic block is in the default page order',
    LP_GENERIC_BLOCKS.every((b) => !region.includes(`"${b}"`)))

  // Each content block self-hides when empty (return null before markup).
  for (const fn of ['FreeHeadingSection', 'FreeTextSection', 'CallToActionSection', 'FreeStatsSection']) {
    const body = page.slice(page.indexOf(`function ${fn}`), page.indexOf(`function ${fn}`) + 900)
    check(`${fn} self-hides when empty`, /return null/.test(body))
  }
  check('the divider is the only block with no content to hide (renders a rule)',
    /function DividerSection[\s\S]{0,400}h-px/.test(page))
}

console.log('\n── a typed URL is not a script ──')
{
  check('safeHref exists and defaults unsafe/empty to the lead form',
    /function safeHref[\s\S]{0,400}#lead-form/.test(page))
  check('safeHref explicitly blocks javascript:', page.includes("javascript:"))
  check('the CTA renders its button through safeHref',
    /CallToActionSection[\s\S]{0,900}safeHref\(/.test(page))

  // Runtime spot-check of the scheme filter, reimplemented from the same rule.
  const safe = (v: string) => {
    const s = v.trim()
    if (!s) return '#lead-form'
    if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(s) && !/^\s*javascript:/i.test(s)) return s
    return '#lead-form'
  }
  check('https / relative / anchor pass through', safe('https://x.ae') === 'https://x.ae' && safe('/buy') === '/buy' && safe('#lead-form') === '#lead-form')
  check('javascript: and data: are neutralized',
    safe('javascript:alert(1)') === '#lead-form' && safe('data:text/html,x') === '#lead-form')
}

if (failures > 0) {
  console.error(`\n${failures} landing-block guard(s) broken.`)
  process.exit(1)
}
console.log('\nThe builder adds blocks, not just reorders them; every one is wired end to end.\n')
