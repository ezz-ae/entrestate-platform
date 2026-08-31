/**
 * ENGINE 07 §3.3 — THE TEMPORAL ANOMALY GATE, locked.
 *
 * Five distinct leads changed by one actor inside ten minutes is a Bulk
 * Status Event. The read side (training-integrity.ts) already subtracted
 * such bursts from the seed after the fact; this is the write side that
 * acts at the moment of the fifth change — quarantine, ledger, management,
 * and the reversal of neglect-cleaning.
 *
 * Pinned here: the window and the floor, that other actors' changes never
 * merge into one person's burst, what neglect-cleaning means exactly, and
 * the wiring that makes any of it happen.
 *
 * Pure — no DB, no network. Runs in `pnpm guards`.
 */
import fs from 'node:fs'
import path from 'node:path'
import {
  detectBulkStatusEvent, isNeglectTransition, BULK_STATUS_THRESHOLD, BULK_STATUS_WINDOW_MINUTES,
  type StatusTransition,
} from '../lib/freehold/anomaly-gate'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const T0 = Date.parse('2026-08-31T10:00:00Z')
const min = (n: number) => T0 + n * 60_000
const tr = (leadId: string, at: number, over: Partial<StatusTransition> = {}): StatusTransition => ({
  leadId, actor: 'ali@x.ae', fromStatus: 'contacted', toStatus: 'lost', at, contactCount: 0, ...over,
})

console.log('\n── the window and the floor ──')
{
  check('five distinct leads inside ten minutes', BULK_STATUS_THRESHOLD === 5 && BULK_STATUS_WINDOW_MINUTES === 10)
  const burst = [tr('a', min(0)), tr('b', min(2)), tr('c', min(4)), tr('d', min(6)), tr('e', min(8))]
  const e = detectBulkStatusEvent(burst, 'ali@x.ae', { now: min(8) })
  check('5 leads in 8 minutes → flagged', e.flagged && e.count === 5, JSON.stringify(e))
  const slow = [tr('a', min(0)), tr('b', min(5)), tr('c', min(10)), tr('d', min(15)), tr('e', min(20))]
  const s = detectBulkStatusEvent(slow, 'ali@x.ae', { now: min(20) })
  check('5 leads over 20 minutes → not flagged (only the last window counts)', !s.flagged && s.count === 3, JSON.stringify(s))
  const sameLead = [tr('a', min(0)), tr('a', min(1), { toStatus: 'qualified' }), tr('a', min(2)), tr('a', min(3)), tr('a', min(4)), tr('b', min(5))]
  const one = detectBulkStatusEvent(sameLead, 'ali@x.ae', { now: min(5) })
  check('six changes on two leads is not five leads', !one.flagged && one.count === 2, JSON.stringify(one))
  const four = detectBulkStatusEvent(burst.slice(0, 4), 'ali@x.ae', { now: min(6) })
  check('four is under the floor', !four.flagged)
}

console.log('\n── one person\'s burst, never a team\'s afternoon ──')
{
  const mixed = [
    tr('a', min(0)), tr('b', min(1)), tr('c', min(2)),
    tr('x', min(3), { actor: 'sara@x.ae' }), tr('y', min(4), { actor: 'sara@x.ae' }), tr('z', min(5), { actor: 'sara@x.ae' }),
  ]
  const ali = detectBulkStatusEvent(mixed, 'ali@x.ae', { now: min(5) })
  const sara = detectBulkStatusEvent(mixed, 'sara@x.ae', { now: min(5) })
  check('three each is nobody\'s burst', !ali.flagged && !sara.flagged && ali.count === 3 && sara.count === 3)
}

console.log('\n── what neglect-cleaning means, exactly ──')
{
  check('open → lost with no contact logged is the shape', isNeglectTransition({ fromStatus: 'new', toStatus: 'lost', contactCount: 0 }))
  check('…so is null → lost (a lead nobody even opened)', isNeglectTransition({ fromStatus: null, toStatus: 'lost', contactCount: 0 }))
  check('a lead that was called is not neglected, whatever happens next', !isNeglectTransition({ fromStatus: 'contacted', toStatus: 'lost', contactCount: 2 }))
  check('moving to qualified is not neglect', !isNeglectTransition({ fromStatus: 'new', toStatus: 'qualified', contactCount: 0 }))
  check('closing a won deal is not neglect', !isNeglectTransition({ fromStatus: 'negotiation', toStatus: 'closed', contactCount: 0 }))
  check('lost → lost again is not a fresh neglect', !isNeglectTransition({ fromStatus: 'lost', toStatus: 'lost', contactCount: 0 }))

  const sweep = [tr('a', min(0)), tr('b', min(1)), tr('c', min(2)), tr('d', min(3)), tr('e', min(4))]
  const e = detectBulkStatusEvent(sweep, 'ali@x.ae', { now: min(4) })
  check('five untouched leads swept to lost → neglect-cleaning, all five to restore',
    e.neglectCleaning && e.neglectedLeadIds.length === 5, JSON.stringify(e))

  const closing = sweep.map((t) => ({ ...t, fromStatus: 'negotiation', toStatus: 'closed', contactCount: 4 }))
  const c = detectBulkStatusEvent(closing, 'ali@x.ae', { now: min(4) })
  check('a manager closing five deals is flagged for the seed but is NOT neglect-cleaning',
    c.flagged && !c.neglectCleaning && c.neglectedLeadIds.length === 0, JSON.stringify(c))

  const half = [tr('a', min(0)), tr('b', min(1)), tr('c', min(2), { contactCount: 3 }), tr('d', min(3), { contactCount: 1 }), tr('e', min(4), { toStatus: 'qualified' })]
  const h = detectBulkStatusEvent(half, 'ali@x.ae', { now: min(4) })
  check('two of five neglected is under half → flagged, not neglect-cleaning', h.flagged && !h.neglectCleaning && h.neglectedLeadIds.length === 2, JSON.stringify(h))
  const three = [tr('a', min(0)), tr('b', min(1)), tr('c', min(2)), tr('d', min(3), { contactCount: 1 }), tr('e', min(4), { toStatus: 'qualified' })]
  const t = detectBulkStatusEvent(three, 'ali@x.ae', { now: min(4) })
  check('three of five (at least half) → neglect-cleaning, exactly those three restored', t.neglectCleaning && t.neglectedLeadIds.join() === 'a,b,c', JSON.stringify(t))
}

console.log('\n── the wiring: the gate acts, and the seed listens ──')
{
  const db = stripComments(read('lib/freehold/lead-rate-db.ts'))
  check('the gate reads the actor\'s history inside the window', db.includes('FROM freehold_site_lead_status_history h') && db.includes('BULK_STATUS_WINDOW_MINUTES'))
  check('…quarantines every lead in the event', db.includes('SET seed_quarantined_at = now()'))
  check('…writes each quarantine to the authority log', db.includes("action: 'lead.quarantine'"))
  check('…tells management', /kind: 'bulk_status'/.test(db))
  check('…restores the swept status and redistributes on neglect-cleaning', db.includes("restoreStatus: restoreFrom.get(id) || 'new'"))
  check('…and only for a broker clearing their own queue', /actorRole === 'broker' \|\| actorRole === 'team_leader'/.test(db))
  check('redistribution forces the performance strategy, ignoring working hours',
    db.includes("strategy: 'performance'") && db.includes('respectWorkingHours: false'))
  check('…and never hands the lead back to the actor it came from', db.includes('brokers.filter((b) => b && b !== from)'))
  const evidence = stripComments(read('lib/freehold/lead-evidence.ts'))
  check('the seed read excludes quarantined leads', evidence.includes('seed_quarantined_at IS NULL'))
  const log = read('app/freehold-intelligence/team/log/page.tsx')
  check('the authority log screen can filter the two new actions', log.includes("'lead.quarantine', 'lead.redistribute'"))
  const authority = read('lib/freehold/authority.ts')
  check('the two gates are reasons the log can translate', authority.includes("'neglect_gate'") && authority.includes("'anomaly_gate'"))
}

if (failures > 0) {
  console.error(`\n${failures} anomaly-gate rule(s) broken.`)
  process.exit(1)
}
console.log('\nA burst of status changes is quarantined, logged and — when it threw leads away — undone.\n')
