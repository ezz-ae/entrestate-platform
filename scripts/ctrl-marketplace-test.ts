/**
 * THE CONTROL PLANE'S GUARANTEES, held by test (ported with /ctrl):
 *
 *   1. A masked preview can never reach the person — no phone, no email, no
 *      full name, even when the person typed their number into a free-text
 *      answer (behavioral: maskLead runs on hostile fixtures).
 *   2. The buy button is the ONLY door money moves through in marketplace
 *      mode — the API poll bills nothing unless the partner is on 'auto', and
 *      the portal checks the project limit BEFORE the debit.
 *   3. The shelf serves held leads only, and a project's leads stay off the
 *      shelf until the partner chose that project.
 *   4. FOLDED IN CLEAN — the control plane is isolated: every table is
 *      ctrl_-prefixed and every query is pinned to the shared schema
 *      (runWithDefaultSchema), and /ctrl is management-gated server-side.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { maskLead, maskName } from '../lib/ctrl/marketplace'

let failures = 0
const check = (m: string, cond: boolean, got = '') =>
  cond ? console.log(`  ✓ ${m}`) : (failures++, console.error(`  ✗ ${m}\n      got: ${got}`))

// ── 1. The mask, against hostile fixtures ───────────────────────────────────
console.log('\n── a masked preview cannot reach the person ──')

const masked = maskLead({
  id: 'l1', formId: 'f1', createdTime: '2026-08-23T10:00:00+0000', priceFils: 22500,
  projectId: 'p_abc',
  fieldData: [
    { name: 'full_name', values: ['أحمد محمد السيد'] },
    { name: 'phone_number', values: ['+971501234567'] },
    { name: 'whatsapp-number', values: ['0501234567'] },
    { name: 'email', values: ['ahmed@example.com'] },
    { name: 'ما هي ميزانيتك؟', values: ['مليون درهم'] },
    // The classic leak: a number typed into an open question.
    { name: 'متى نتصل بك؟', values: ['كلموني على 050 123 4567 او a@b.com بعد المغرب'] },
  ],
})

const flat = JSON.stringify([masked.displayName, masked.answers])
check('no dialable number survives the mask', !/(\+?\d[\d\s\-().]{6,}\d)/.test(flat), flat)
check('no email survives the mask', !/[\w.+-]+@[\w-]+\.[\w.]+/.test(flat), flat)
check('the full name never appears', !flat.includes('أحمد محمد السيد'), flat)
check('a masked display name remains', masked.displayName === 'أحمد ا.', masked.displayName)
check('contact fields are dropped, not renamed',
  !masked.answers.some((a) => /phone|whatsapp|mail|name/i.test(a.question)), flat)
check('non-contact answers survive', masked.answers.some((a) => a.answer === 'مليون درهم'), flat)
check('free text is scrubbed, not dropped',
  masked.answers.some((a) => a.answer.includes('بعد المغرب') && a.answer.includes('[…]')), flat)
check('the project rides along for grouping', masked.projectId === 'p_abc', String(masked.projectId))
check('maskName: single word keeps only itself', maskName('Fatima') === 'Fatima', maskName('Fatima'))

// ── 2. One door for money ───────────────────────────────────────────────────
console.log('\n── the buy button is the only door money moves through ──')

const portal = readFileSync(join(process.cwd(), 'app/portal/[slug]/page.tsx'), 'utf8')
const leadsRoute = readFileSync(join(process.cwd(), 'app/api/ctrl/v1/forms/[id]/leads/route.ts'), 'utf8')
const market = readFileSync(join(process.cwd(), 'lib/ctrl/marketplace.ts'), 'utf8')

check('the API poll bills only in auto mode',
  /deliveryMode === 'auto'/.test(leadsRoute)
  && leadsRoute.indexOf("deliveryMode === 'auto'") < leadsRoute.indexOf('billLead('))
check('the portal checks the project limit BEFORE the debit',
  portal.indexOf('canBuy(') > -1 && portal.indexOf('canBuy(') < portal.indexOf('billLead('))
check('the portal buys through the shared billLead, not its own SQL',
  /billLead\(/.test(portal) && !/INSERT INTO ctrl_wallet_entries/.test(portal))

// ── 3. The shelf ────────────────────────────────────────────────────────────
console.log('\n── the shelf serves held, chosen leads only ──')

check("the shelf serves held leads only", /state = 'held'/.test(market))
check('unchosen projects stay off the shelf',
  /project_id IS NULL\s*\n?\s*OR project_id IN \(SELECT project_id FROM ctrl_subscriptions/.test(market))
check('the shelf is masked on the way out', /rows\.map\(\(l\) => maskLead\(/.test(market))
check('canBuy leans closed on an unknown lead', /if \(!row\) return false/.test(market))
check('a limit of zero or less can never be chosen', /limit <= 0\) return/.test(market))

// ── 4. Folded in clean ───────────────────────────────────────────────────────
console.log('\n── the control plane is isolated inside the platform ──')

const db = readFileSync(join(process.cwd(), 'lib/ctrl/db.ts'), 'utf8')
check('every control-plane query is pinned to the shared schema',
  /ctrlQuery[\s\S]*runWithDefaultSchema/.test(db) && /ctrlTx[\s\S]*runWithDefaultSchema/.test(db))
check('the schema DDL creates ctrl_-prefixed tables only',
  (db.match(/CREATE TABLE IF NOT EXISTS ctrl_/g) ?? []).length >= 6
  && !/CREATE TABLE IF NOT EXISTS (tenants|leads|projects|subscriptions|mappings|wallet_entries|pricing_rules)\b/.test(db))
for (const f of ['marketplace.ts', 'wallet.ts', 'sync.ts', 'tenants.ts']) {
  const src = readFileSync(join(process.cwd(), 'lib/ctrl', f), 'utf8')
  check(`lib/ctrl/${f} names no un-prefixed control table in SQL`,
    !/\b(FROM|JOIN|INTO|UPDATE|REFERENCES)\s+(tenants|mappings|pricing_rules|wallet_entries|leads|projects|subscriptions)\b/.test(src))
}
const layout = readFileSync(join(process.cwd(), 'app/ctrl/layout.tsx'), 'utf8')
check('/ctrl is management-gated server-side (not just a client guard)',
  /getSessionUser\(\)/.test(layout) && /isAdminRole\(user\.role\)/.test(layout) && /redirect\(/.test(layout))

if (failures) { console.error(`\n${failures} control-plane guard(s) broken.`); process.exit(1) }
console.log('\nA lead you have not bought is a person you cannot reach — now inside the platform.\n')
