/**
 * ENGINE 04 — ACTIVE/IDLE TELEMETRY, locked.
 *
 * The telemetry-implementation-guide shipped as paste-ready code and sat in
 * docs/ while the submission described it as operating. Now it operates —
 * with one deliberate departure the guide got wrong: the browser may NEVER
 * name a lead. A public endpoint that accepts a leadId lets anyone stamp
 * behaviour onto anyone's CRM record; rows are session-keyed and the link is
 * made server-side by /api/leads, the same trust boundary lp_session_id
 * already follows. That rule is the first thing pinned here.
 *
 * Then the loop: the hook rides the landing Tracker on the analytics session
 * id, premium sections are marked, the public door is allowlisted and
 * clamped, the Rate reads premium hovers and focus-after-idle as ingest
 * intent (Engine 06 Phase 4.1), and the ICI ledger carries the
 * focus-after-idle evidence (Engine 07 §3.1's Parallel Telemetry Validation).
 *
 * Pure — no DB, no network. Runs in `pnpm guards`.
 */
import fs from 'node:fs'
import path from 'node:path'
import {
  PREMIUM_TELEMETRY_ELEMENTS, PREMIUM_HOVER_MS, MIN_HOVER_MS, MAX_HOVER_MS, MAX_IDLE_SECONDS, SESSION_ROW_BUDGET,
} from '../lib/freehold/behavioral-telemetry'
import { IDLE_AFTER_MS, FLUSH_EVERY_MS } from '../lib/freehold/use-behavioral-telemetry'
import { computeLeadRate, type RateFacts } from '../lib/freehold/lead-rate'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

console.log('\n── the browser may never name a lead ──')
{
  const route = stripComments(read('app/api/lp-telemetry/route.ts'))
  check('the public door reads kind, sessionId and events — and no leadId', !/leadId/.test(route), 'leadId found in route')
  const mod = stripComments(read('lib/freehold/behavioral-telemetry.ts'))
  const inserts = [...mod.matchAll(/INSERT INTO freehold_site_(?:active|idle)_telemetry[\s\S]*?VALUES[^)]*\)/g)].map((m) => m[0])
  check('every telemetry INSERT writes session-keyed rows (no lead_id column)',
    inserts.length === 2 && inserts.every((i) => !i.includes('lead_id')), inserts.join(' | ').slice(0, 200))
  check('the lead link is a server-side UPDATE by session, nowhere else',
    mod.includes('SET lead_id = $1 WHERE session_id = $2 AND lead_id IS NULL'))
  const leads = stripComments(read('app/api/leads/route.ts'))
  check('/api/leads makes the link for new leads and repeat inquiries',
    (leads.match(/linkTelemetryToLead\(leadId, toText\(body\.sessionId\)\)/g) ?? []).length === 2)
}

console.log('\n── an open door, clamped and budgeted ──')
{
  const mod = stripComments(read('lib/freehold/behavioral-telemetry.ts'))
  check('hover is bounded: 1 s meaningful floor, 30 min ceiling', MIN_HOVER_MS === 1000 && MAX_HOVER_MS === 30 * 60_000)
  check('idle is bounded to a working day\'s tab', MAX_IDLE_SECONDS === 8 * 60 * 60)
  check('each session has a hard row budget', SESSION_ROW_BUDGET === 500 && mod.includes('withinBudget('))
  check('a batch is capped server-side whatever the client sends', mod.includes('events.slice(0, 20)'))
  check('element ids are slugged and bounded', /replace\(\/\[\^a-z0-9_-\]\/g, ''\)\.slice\(0, 64\)/.test(mod))
  check('scroll depth is clamped to 0–100', mod.includes('clamp(e.scrollDepthPercent, 0, 100)'))
  // RAW read, not stripComments: proxy.ts line-comments contain "/api/*",
  // which the block-comment regex reads as an opening /* and swallows the
  // allowlist — the exact comment-tripping failure this suite family has
  // hit before, avoided by not pre-processing what a string search needs.
  const proxy = read('proxy.ts')
  check('the door is on the public allowlist beside lp-analytics', proxy.includes('"/api/lp-telemetry"'))
}

console.log('\n── the hook rides the Tracker, on the analytics session ──')
{
  const tracker = stripComments(read('app/lp/[slug]/_tracker.tsx'))
  check('mounted once, with getSessionId() — one session joins behaviour to analytics to the lead',
    tracker.includes('useBehavioralTelemetry({ sessionId:') && tracker.includes('getSessionId()'))
  const hook = stripComments(read('lib/freehold/use-behavioral-telemetry.ts'))
  check('the idle clock is the guide\'s 60 seconds', IDLE_AFTER_MS === 60_000)
  check('hovers are buffered and flushed, not fired per event', FLUSH_EVERY_MS === 5_000 && hook.includes('keepalive: true'))
  check('the tab going hidden posts idle; coming back posts the re-engagement',
    hook.includes('triggeredByTabHide: true') && hook.includes("post('reengage'"))
  check('the hook sends no lead id', !/leadId/.test(hook))
  const page = read('app/lp/[slug]/page.tsx')
  check('the premium sections are marked for the hover tracker',
    page.includes('data-telemetry="payment-plan"') && page.includes('data-telemetry="roi"'))
  check('…and the premium list knows them', (PREMIUM_TELEMETRY_ELEMENTS as readonly string[]).includes('roi') && (PREMIUM_TELEMETRY_ELEMENTS as readonly string[]).includes('payment-plan'))
}

console.log('\n── behaviour reaches the Rate and the ICI ──')
{
  const NOON = Date.parse('2026-08-31T08:00:00Z')
  const base: RateFacts = {
    status: 'new', blocked: false, masterLead: false, dealClosed: false,
    valueRating: null, behaviourScore: null, buyerIntent: null, clickIntent: null,
    interest: null, message: null, phone: '+971501234567', email: 'a@b.ae', utmSource: 'meta',
    budgetAed: null, contactCount: 0, viewingScheduled: false, viewingHeld: false, offerMade: false,
    convergentAt: null, lastTouchAt: null, createdAt: new Date(NOON).toISOString(), now: NOON,
  }
  check('the guide\'s threshold: fifteen seconds on a premium section', PREMIUM_HOVER_MS === 15_000)
  check('a premium hover lifts the inbound baseline to 3',
    computeLeadRate({ ...base, premiumEngagement: true }).rate === 3
    && computeLeadRate({ ...base, premiumEngagement: true }).reason === 'ingest_intent')
  check('focus-after-idle lifts it too', computeLeadRate({ ...base, focusAfterIdle: true }).rate === 3)
  check('without either, the same facts stay at 2', computeLeadRate(base).rate === 2)
  check('behaviour never climbs past the inbound band on its own',
    computeLeadRate({ ...base, premiumEngagement: true, focusAfterIdle: true, behaviourScore: 100 }).rate === 3)

  const db = stripComments(read('lib/freehold/lead-rate-db.ts'))
  check('the fact-loader reads the signals by lead id or session', db.includes('telemetrySignals(leadId, r.lp_session_id)'))
  const touch = stripComments(read('lib/freehold/inbound-touch.ts'))
  check('the ICI ledger carries the focus-after-idle evidence (Engine 07 §3.1)',
    touch.includes('telemetrySignals(lead.id)') && touch.includes('focusAfterIdle: behaviour.focusAfterIdle'))
}

if (failures > 0) {
  console.error(`\n${failures} telemetry rule(s) broken.`)
  process.exit(1)
}
console.log('\nHow a visitor actually read the page now reaches the Rate — and no browser can write onto a lead.\n')
