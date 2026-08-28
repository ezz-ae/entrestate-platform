/**
 * A PREVIEW CANNOT RING A STRANGER'S PHONE — locked.
 *
 * GET /api/calling/preview answers the same question POST /api/calling answers,
 * without the call. The temptation was a `dryRun` flag on the POST; that puts
 * the decision and the dial in one handler, one boolean apart, and the day the
 * boolean defaults wrong a preview places a call. So the preview is a separate
 * GET that CANNOT dial — asserted here by reading its source, because the
 * alternative needs a provider, a database and a real phone.
 *
 * The card is guarded too. A dial button existed nowhere in this product until
 * every gate could actually pass; now that it does, the rule is that the button
 * only renders when the preview says ready, and the POST re-runs every gate
 * server-side regardless — the component's opinion is a courtesy, never the
 * authority.
 *
 * Pure: source text only.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CALL_TYPES, CALL_KEY_PREFIX } from '../lib/freehold/call-templates'
import { lm_calling } from '../lib/i18n/dictionaries/lm_calling'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const preview = readFileSync(join(process.cwd(), 'app/api/calling/preview/route.ts'), 'utf8')
const card = readFileSync(join(process.cwd(), 'components/freehold/lead-call-card.tsx'), 'utf8')
const leadPage = readFileSync(join(process.cwd(), 'app/freehold-intelligence/crm/leads/[id]/page.tsx'), 'utf8')

console.log('\n── the preview cannot dial ──')
{
  check('it exports GET', /export async function GET/.test(preview))
  check('it exports no POST', !/export async function POST/.test(preview))
  // Import lines only. The header comment NAMES getCallingProvider to explain
  // why it is absent, and a guard that cannot tell a mention from an import is
  // a guard that punishes the documentation.
  const imports = preview.split('\n').filter((l) => /^\s*import\b/.test(l) || /\bfrom '/.test(l)).join('\n')
  check('it never imports the provider factory', !/getCallingProvider/.test(imports))
  check('it never calls placeCall', !/placeCall\s*\(/.test(preview))
  check('it never writes a call log', !/recordPlacedCall\s*\(/.test(preview))
  check('it touches no provider surface at all', !/callingConnection\(|listNumbers\(/.test(preview))
}

console.log('\n── it makes the same decision the POST makes ──')
{
  // It no longer re-implements the gates: it runs lib/calling/place.ts, the one
  // sequence, stopped one line before the dial. That is stronger than parity —
  // it is identity.
  check('it runs the shared sequence', /placeLeadCall\(/.test(preview))
  check('…as a dry run', /dryRun:\s*true/.test(preview))
  check('it keeps no gate of its own', !/planCall\(/.test(preview) && !/assignCaller\(/.test(preview))
  check('a placed result from a dry run is treated as a bug, not a success',
    /if \(r\.placed\)/.test(preview) && /must never place a call/.test(preview))
  check('it says whose problem the block is', /aboutLead|kind === 'lead'/.test(preview))
  check('it requires a session like the POST', /requireSession\(/.test(preview))
}

console.log('\n── the button only exists when the call can happen ──')
{
  check('the card previews first', /\/api\/calling\/preview/.test(card))
  check('the dial button is behind preview.ready', /preview\?\.ready && preview\.member \?/.test(card))
  check('it posts to the real endpoint', /fetch\('\/api\/calling'/.test(card))
  check('a failed placement re-checks rather than leaving a stale button', /void load\(\)/.test(card))
  check('it renders the refusal sentence, not a generic error', /preview\?\.message/.test(card))
  check('it is a client island', /^'use client'/.test(card))
}

console.log('\n── every word on the card exists in all three languages ──')
{
  const keys = [
    'lm.call.card.title', 'lm.call.card.checking', 'lm.call.card.place',
    'lm.call.card.placed', 'lm.call.card.alsoFree', 'lm.call.card.aboutLead',
    'lm.call.card.aboutTeam', 'lm.call.card.failed', 'lm.call.card.previewFailed',
  ]
  for (const lang of ['en', 'ar', 'ru'] as const) {
    const missing = keys.filter((k) => !(lm_calling[lang] as Record<string, string>)[k])
    check(`${lang}: all card keys present`, missing.length === 0, missing.join(','))
  }
  // The computed family the card renders the seven buttons through.
  const missingTypes = CALL_TYPES.filter((t) => !(lm_calling.ar as Record<string, string>)[`${CALL_KEY_PREFIX.type}${t}`])
  check('all seven call types have an Arabic label', missingTypes.length === 0, missingTypes.join(','))
}

console.log('\n── it is reachable from the lead ──')
{
  check('the card is mounted on the lead page', /<LeadCallCard/.test(leadPage))
  check('…with the lead it is about', /leadId=\{lead\.id\}/.test(leadPage))
}

if (failures) { console.error(`\n${failures} call-preview guard(s) broken.`); process.exit(1) }
console.log('\nThe broker sees who would call before anything rings, and the preview itself never can.\n')
