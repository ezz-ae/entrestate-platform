/**
 * ENGINE 06 — THE LEAD RATE, locked rung by rung.
 *
 * The spec (docs/spec/engine-06-lead-rate-v6.md) describes a 0–10 control
 * signal that the submission presented as operating. It was not in the code
 * at all: the pipeline was a status set and the only number on a lead was
 * the broker's own value rating. This suite pins the ladder that now exists,
 * and the two rules a future "improvement" is most likely to break:
 *
 *   · 9 and 10 come only from a human act (a won status, a closed deal
 *     record, a manager's master flag). No overlay, no convergence, no
 *     behaviour score reaches past 8.
 *   · An unevaluated lead earns exactly what its facts say — no estimates.
 *
 * Then the wiring: the PATCH route records the transition and re-rates, the
 * doors rate on arrival, the seed read refuses quarantined rows, the cron is
 * scheduled, and the screen renders the badge. A rate nobody writes is a
 * comment (see scripts/no-orphan-modules-test.ts for how that ends).
 *
 * Pure — no DB, no network. Runs in `pnpm guards`.
 */
import fs from 'node:fs'
import path from 'node:path'
import {
  computeLeadRate, bandOf, isOffHours, declaresInvestmentIntent,
  RATE_BLOCKED, RATE_JUNK, RATE_OPEN_CAP, RATE_WON, RATE_MASTER, RATE_DECAY_DAYS, RATE_DECAY_FLOOR,
  RATE_REASONS, RATE_BANDS, type RateFacts,
} from '../lib/freehold/lead-rate'
import { RATE_TRIGGERS, NEGLECT_WINDOW_MINUTES } from '../lib/freehold/lead-rate-db'
import { BULK_STATUS_THRESHOLD, BULK_STATUS_WINDOW_MINUTES } from '../lib/freehold/anomaly-gate'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// A weekday noon in Dubai, so nothing here is off-hours by accident.
const NOON = Date.parse('2026-08-31T08:00:00Z') // 12:00 Asia/Dubai
const base = (over: Partial<RateFacts> = {}): RateFacts => ({
  status: 'new', blocked: false, masterLead: false, dealClosed: false,
  valueRating: null, behaviourScore: null, buyerIntent: null, clickIntent: null,
  interest: null, message: null, phone: '+971501234567', email: 'a@b.ae', utmSource: 'meta',
  budgetAed: null, contactCount: 0, viewingScheduled: false, viewingHeld: false, offerMade: false,
  convergentAt: null, lastTouchAt: null, createdAt: new Date(NOON).toISOString(), now: NOON,
  ...over,
})
const rate = (over: Partial<RateFacts> = {}) => computeLeadRate(base(over))

console.log('\n── the scale is the spec\'s scale ──')
{
  check('0 blocked, 1 junk, 8 open cap, 9 won, 10 master',
    RATE_BLOCKED === 0 && RATE_JUNK === 1 && RATE_OPEN_CAP === 8 && RATE_WON === 9 && RATE_MASTER === 10)
  check('decay is a point a fortnight, never below 1', RATE_DECAY_DAYS === 14 && RATE_DECAY_FLOOR === 1)
  check('every band the badge can colour is enumerable', RATE_BANDS.length === 7)
  for (const r of [0, 1, 2, 3, 4, 7, 8, 9, 10]) {
    const b = bandOf(r)
    check(`bandOf(${r}) → ${b}`, b !== null)
  }
  check('bandOf(null) is null — unevaluated is a state, not a band', bandOf(null) === null)
}

console.log('\n── rates 1–3: what the inbound facts alone earn ──')
{
  const thin = rate({ phone: '12345', email: null })
  check('a thin contact enters at 1 (ingest_thin)', thin.rate === 1 && thin.reason === 'ingest_thin', JSON.stringify(thin))
  const verified = rate()
  check('verified phone + email + clean UTM → 2', verified.rate === 2 && verified.reason === 'ingest_verified', JSON.stringify(verified))
  const junkUtm = rate({ utmSource: 'meta{{placement}} <script>' })
  check('a pasted-junk UTM source holds the lead at 1', junkUtm.rate === 1, JSON.stringify(junkUtm))
  const investor = rate({ buyerIntent: 'investor' })
  check('an investor profile enters at 3 (ingest_intent)', investor.rate === 3 && investor.reason === 'ingest_intent', JSON.stringify(investor))
  const arabic = rate({ interest: 'شقة للاستثمار في JVC' })
  check('"استثمار" in the enquiry is declared intent → 3', arabic.rate === 3, JSON.stringify(arabic))
  const deepRead = rate({ behaviourScore: 75 })
  check('a deep read of the landing page → 3', deepRead.rate === 3, JSON.stringify(deepRead))
  const night = rate({ createdAt: '2026-08-30T22:47:00Z' }) // 02:47 Asia/Dubai — the spec's example
  check('a 2:47 AM registration is off-hours → 3', night.rate === 3 && isOffHours('2026-08-30T22:47:00Z'), JSON.stringify(night))
  check('noon is not off-hours', !isOffHours(new Date(NOON).toISOString()))
  check('intent terms cover the three languages',
    declaresInvestmentIntent('rental yield') && declaresInvestmentIntent('عائد') && declaresInvestmentIntent('инвестиции'))
  check('…and an ordinary message declares none', !declaresInvestmentIntent('call me tomorrow please'))
}

console.log('\n── rates 4–7: the pipeline and the logged work ──')
{
  check('contacted → 4', rate({ status: 'contacted' }).rate === 4)
  const documented = rate({ status: 'contacted', budgetAed: 1_500_000, interest: '2BR in Marina' })
  check('contacted with budget and interest documented → 5', documented.rate === 5 && documented.reason === 'contacted_documented', JSON.stringify(documented))
  check('qualified → 5', rate({ status: 'qualified' }).rate === 5)
  check('qualified with a viewing booked → 6', rate({ status: 'qualified', viewingScheduled: true }).rate === 6)
  check('viewing → 6', rate({ status: 'viewing' }).rate === 6)
  check('viewing held → 7', rate({ status: 'viewing', viewingHeld: true }).rate === 7)
  check('an offer made → 7', rate({ status: 'viewing', offerMade: true }).rate === 7)
  check('negotiation → 7', rate({ status: 'negotiation' }).rate === 7)
  check('nothing on the open ladder exceeds the cap',
    [rate({ status: 'negotiation', viewingHeld: true, offerMade: true, budgetAed: 9e6 })].every((r) => r.rate <= RATE_OPEN_CAP))
}

console.log('\n── the human overlays ──')
{
  const five = rate({ status: 'contacted', valueRating: 8 })
  check('the broker\'s 8+ is the 5-star call → 8 peak_rated', five.rate === 8 && five.reason === 'peak_rated', JSON.stringify(five))
  const good = rate({ status: 'new', valueRating: 6 })
  check('a 6–7 rating lifts a new lead to the qualified rung (5)', good.rate === 5 && good.reason === 'qualified', JSON.stringify(good))
  const kept = rate({ status: 'negotiation', valueRating: 6 })
  check('…but never pulls a deeper stage down', kept.rate === 7, JSON.stringify(kept))
  const junk = rate({ status: 'negotiation', valueRating: 2 })
  check('a 0–2 rating is "stop buying this" → 1 whatever the stage', junk.rate === 1 && junk.reason === 'avoid_rated', JSON.stringify(junk))
  check('a middling rating (3–5) changes nothing', rate({ status: 'contacted', valueRating: 4 }).rate === 4)
}

console.log('\n── engine 07 lifts, never past the cap ──')
{
  const conv = rate({ status: 'new', convergentAt: new Date(NOON).toISOString() })
  check('a convergent second inquiry → 8 peak_convergent', conv.rate === 8 && conv.reason === 'peak_convergent', JSON.stringify(conv))
  const still = rate({ status: 'negotiation', valueRating: 9, convergentAt: new Date(NOON).toISOString(), behaviourScore: 100, offerMade: true })
  check('everything at once is still 8 — nothing automatic reaches 9', still.rate === RATE_OPEN_CAP, JSON.stringify(still))
}

console.log('\n── 9 and 10 are human acts; 0 is the person\'s own ──')
{
  const won = rate({ status: 'closed' })
  check('closed → 9', won.rate === 9 && won.reason === 'won', JSON.stringify(won))
  check('converted → 9 (the legacy spelling of the same fact)', rate({ status: 'converted' }).rate === 9)
  const deal = rate({ status: 'contacted', dealClosed: true })
  check('an approved deal record → 9 even if the card never moved', deal.rate === 9, JSON.stringify(deal))
  const master = rate({ status: 'closed', masterLead: true })
  check('the master flag → 10', master.rate === 10 && master.reason === 'master', JSON.stringify(master))
  const blocked = rate({ status: 'closed', masterLead: true, blocked: true })
  check('blocked → 0, outranking even master', blocked.rate === 0 && blocked.reason === 'blocked', JSON.stringify(blocked))
  const lost = rate({ status: 'lost', valueRating: 9 })
  check('lost → 1, whatever the broker once rated', lost.rate === 1 && lost.reason === 'lost', JSON.stringify(lost))
  check('the rating never makes a 10: a ten is the seed\'s rung, not the rate\'s',
    rate({ status: 'contacted', valueRating: 10 }).rate === 8)
}

console.log('\n── decay ──')
{
  const day = 86_400_000
  const fresh = rate({ status: 'negotiation', lastTouchAt: new Date(NOON - 13 * day).toISOString() })
  check('13 idle days: no decay yet', fresh.rate === 7 && fresh.decayedBy === 0, JSON.stringify(fresh))
  const two = rate({ status: 'negotiation', lastTouchAt: new Date(NOON - 29 * day).toISOString() })
  check('29 idle days: two points off', two.rate === 5 && two.decayedBy === 2, JSON.stringify(two))
  const floor = rate({ status: 'contacted', lastTouchAt: new Date(NOON - 400 * day).toISOString() })
  check('a year of silence stops at the floor', floor.rate === RATE_DECAY_FLOOR, JSON.stringify(floor))
  const peak = rate({ status: 'contacted', valueRating: 9, lastTouchAt: new Date(NOON - 15 * day).toISOString() })
  check('a peak lead nobody touched for a fortnight is not a peak lead', peak.rate === 7 && peak.decayedBy === 1, JSON.stringify(peak))
  const won = rate({ status: 'closed', lastTouchAt: new Date(NOON - 400 * day).toISOString() })
  check('won never decays', won.rate === 9)
  check('master never decays', rate({ masterLead: true, lastTouchAt: new Date(NOON - 400 * day).toISOString() }).rate === 10)
  check('blocked never decays (nothing below it)', rate({ blocked: true, lastTouchAt: new Date(NOON - 400 * day).toISOString() }).rate === 0)
  const untouched = rate({ status: 'new', createdAt: new Date(NOON - 15 * day).toISOString() })
  check('with no touch at all, decay counts from arrival', untouched.rate === 1 && untouched.decayedBy === 1, JSON.stringify(untouched))
}

console.log('\n── every reason and trigger is a word, not a code ──')
{
  const seen = new Set<string>()
  const cases: Partial<RateFacts>[] = [
    { blocked: true }, { masterLead: true }, { status: 'closed' }, { status: 'lost' }, { valueRating: 1 },
    { phone: '123', email: null }, {}, { buyerIntent: 'investor' },
    { status: 'contacted' }, { status: 'contacted', budgetAed: 1, interest: 'x' },
    { status: 'qualified' }, { status: 'qualified', viewingScheduled: true },
    { status: 'viewing' }, { status: 'viewing', viewingHeld: true }, { status: 'negotiation' },
    { valueRating: 8 }, { convergentAt: new Date(NOON).toISOString() },
  ]
  for (const c of cases) seen.add(rate(c).reason)
  const unreachable = RATE_REASONS.filter((r) => !seen.has(r))
  check('every declared reason is produced by some set of facts', unreachable.length === 0, unreachable.join(', '))
  const undeclared = [...seen].filter((r) => !(RATE_REASONS as readonly string[]).includes(r))
  check('…and no produced reason is undeclared', undeclared.length === 0, undeclared.join(', '))
  check('triggers are enumerable for the ledger', RATE_TRIGGERS.includes('crm_patch') && RATE_TRIGGERS.includes('decay_sweep'))
}

console.log('\n── the wiring: a rate nobody writes is a comment ──')
{
  const patch = stripComments(read('app/api/freehold/crm/leads/[id]/route.ts'))
  check('the CRM PATCH records the status transition with the from-status',
    patch.includes('recordStatusTransition({') && patch.includes('fromStatus: current.status'))
  check('…runs the anomaly gate for the actor', patch.includes('evaluateActorBurst(user.email, user.role)'))
  check('…re-rates the lead after every write', patch.includes("recomputeLeadRate(id, 'crm_patch'"))
  check('…and a logged contact stops the neglect clock', patch.includes('acknowledgeLead(id, null)'))
  check('the master flag is management-only in the PATCH', patch.includes("'Only management may mark a master lead'"))

  const second = stripComments(read('app/api/leads/activity/route.ts'))
  check('the second status door records history and runs the gate too',
    second.includes('recordStatusTransition({') && second.includes('evaluateActorBurst('))

  const doors: Array<[string, string]> = [
    ['app/api/leads/route.ts', 'recomputeLeadRate(leadId, "ingest")'],
    ['lib/freehold/meta-lead-sync.ts', "recomputeLeadRate(inserted[0].id, 'ingest')"],
    ['app/api/freehold/crm/leads/route.ts', "recomputeLeadRate(id, 'ingest'"],
    ['app/api/freehold/public/agent/[handle]/lead/route.ts', "recomputeLeadRate(id, 'ingest')"],
    ['app/api/freehold/crm/leads/import/route.ts', "recomputeLeadRates(res.map((r) => r.id), 'ingest')"],
    ['app/api/freehold/integrations/hubspot/sync/route.ts', "recomputeLeadRate(hubspotLeadId, 'ingest')"],
    ['app/api/ai/chat/route.ts', 'recomputeLeadRate(leadId, "ingest")'],
    ['app/api/pdf/project/route.ts', 'recomputeLeadRate(leadId, "ingest")'],
  ]
  for (const [rel, needle] of doors) {
    check(`${rel} rates on arrival`, stripComments(read(rel)).includes(needle), needle)
  }
  const deals = stripComments(read('lib/deals.ts'))
  check('an approved deal record re-rates the lead (the spec\'s lib/deals.ts closure check)',
    deals.includes('recomputeLeadRate(deal.leadId, "deal"'))

  const evidence = stripComments(read('lib/freehold/lead-evidence.ts'))
  check('the seed read refuses quarantined leads', evidence.includes('seed_quarantined_at IS NULL'))

  const cron = read('vercel.json')
  check('the neglect/decay sweep is on the schedule every 15 minutes',
    cron.includes('"/api/cron/lead-rate"') && cron.includes('"*/15 * * * *"'))
  check('the sweep matches the gate\'s own window', NEGLECT_WINDOW_MINUTES === 15)
  const cronRoute = read('app/api/cron/lead-rate/route.ts')
  check('the cron fails closed on CRON_SECRET', /if \(!cronSecret \|\| authHeader !== `Bearer \$\{cronSecret\}`\)/.test(cronRoute))

  const list = stripComments(read('app/freehold-intelligence/crm/page.tsx'))
  check('the CRM list renders the Rate badge on every row', list.includes('<LeadRateBadge rate={lead.rate ?? null}'))
  check('…and "worst first" sorts by the Rate before the value judgment', list.includes('(a.rate ?? 99) - (b.rate ?? 99)'))
  const detail = stripComments(read('app/freehold-intelligence/crm/leads/[id]/page.tsx'))
  check('the lead page renders the Rate card', detail.includes('<LeadRateCard'))
  check('…and the owner opening it acknowledges the neglect clock', detail.includes('acknowledgeLead(lead.id, ownerKeys)'))
  const api = read('app/api/freehold/leads/rate/route.ts')
  check('the spec\'s claimed path app/api/freehold/leads/rate exists and gates the master flag',
    api.includes('MANAGEMENT_ROLES.includes(auth.user.role)'))
  const listApi = stripComments(read('app/api/freehold/crm/leads/route.ts'))
  check('the CRM list settles overdue neglect deadlines when opened', listApi.includes('await sweepNeglectDeadlines()'))
  check('the two gates agree on the burst window and floor', BULK_STATUS_THRESHOLD === 5 && BULK_STATUS_WINDOW_MINUTES === 10)
}

if (failures > 0) {
  console.error(`\n${failures} lead-rate rule(s) broken.`)
  process.exit(1)
}
console.log('\nThe Rate is one rule, written on the row, read by every screen and every seed.\n')
