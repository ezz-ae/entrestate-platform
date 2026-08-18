/**
 * THE CALL LIBRARY, LOCKED — scripts, capture fields, hours and the consent gate.
 *
 * A call script is data that nobody reviews twice. It is written once, read
 * aloud a thousand times to strangers, and every defect in it is invisible to
 * the person who shipped it:
 *
 *  1. A CAPTURE FIELD NAMING A COLUMN THAT DOES NOT EXIST. The call goes well,
 *     the lead gives a budget and a date, the write is a 42703, and the answer
 *     is gone. So every field either names a column from LEAD_COLUMNS — the
 *     real shape of freehold_site_leads — or says out loud that it is derived
 *     and where it goes instead.
 *
 *  2. A NUMBER OR AN UNFILLED TOKEN IN A SCRIPT. Ad copy has this guard
 *     already (scripts/ad-copy-placeholder-test.ts, after "Starting at AED TBD"
 *     ran as a paid ad). On the phone it is worse: "we spoke about {project}"
 *     read out loud cannot be paused and edited, and a price invented mid-call
 *     is an offer the brokerage did not agree to. So: no digits anywhere in a
 *     script, and every {token} is one the dialler knows how to fill.
 *
 *  3. A CALL THAT SHOULD NOT HAVE BEEN PLACED. UAE outbound marketing is
 *     regulated, and the gate is the whole point of the module. This asserts
 *     the property that matters — a lead who fails the gate cannot be called
 *     by ANY template at ANY hour — including after a hostile call, where the
 *     ending itself must write the flag that makes the gate refuse forever.
 *
 * Pure — no network, no database, no clock. Every instant is passed in.
 * Runs in `pnpm guards`.
 */
import {
  CALL_TYPES, CALL_BRANCHES, CALL_TEMPLATES, CALL_REFUSALS, CALL_WINDOWS,
  CALL_KEY_PREFIX, LEAD_COLUMNS, LEAD_STATUSES, SCRIPT_TOKENS, REFUSAL_SENTENCES,
  VOICES, MAX_VOICES, CONSENT_STALE_DAYS, MIN_HOURS_BETWEEN_CALLS,
  templateFor, planCall, consentGate, windowVerdict, voiceFor,
  type CallableLead, type CallTemplate, type CaptureField,
} from '../lib/freehold/call-templates'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const COLUMNS = new Set<string>(LEAD_COLUMNS)
const STATUSES = new Set<string>(LEAD_STATUSES)
const TOKENS = new Set<string>(SCRIPT_TOKENS)

/** Every word said out loud in a template, script by script. */
function spokenLines(t: CallTemplate): string[] {
  return [
    t.opening,
    t.consentLine,
    ...t.capture.map((c) => c.question),
    ...CALL_BRANCHES.map((b) => t.branches[b]),
    ...CALL_BRANCHES.map((b) => t.close[b].say),
  ]
}

console.log('\n── seven call types, and the array is the source of truth ──')
{
  check('seven types', CALL_TYPES.length === 7, String(CALL_TYPES.length))
  check('no duplicate type ids', new Set(CALL_TYPES).size === CALL_TYPES.length)
  check('a template for every type, in the same order',
    CALL_TEMPLATES.length === CALL_TYPES.length
    && CALL_TEMPLATES.every((t, i) => t.id === CALL_TYPES[i]),
    CALL_TEMPLATES.map((t) => t.id).join(','))
  check('the seven are the ones the product sells',
    ['reengagement', 'first_contact', 'follow_up', 'invitation',
      'general_interest', 'qualification', 'launch_announcement']
      .every((id) => (CALL_TYPES as readonly string[]).includes(id)),
    CALL_TYPES.join(','))
  check('templateFor() returns the template that owns the id',
    CALL_TYPES.every((id) => templateFor(id).id === id))
  // The screens render the label through a computed key, which `pnpm i18n`
  // cannot see. Mechanical keys mean the dynamic-keys guard can walk the array.
  check('every label key is the family prefix plus the id',
    CALL_TEMPLATES.every((t) => t.labelKey === `${CALL_KEY_PREFIX.type}${t.id}`),
    CALL_TEMPLATES.map((t) => t.labelKey).join(' '))
}

console.log('\n── every call has words in it ──')
{
  const empty = (s: unknown) => typeof s !== 'string' || s.trim() === ''
  for (const t of CALL_TEMPLATES) {
    check(`${t.id}: opening, objective and consent line are all there`,
      !empty(t.opening) && !empty(t.objective) && !empty(t.consentLine))
    // Two sentences, and the reason for the call is in them. A one-sentence
    // opening is a name and no reason, which is the cold call this library
    // exists to replace.
    check(`${t.id}: the opening is more than one sentence`,
      (t.opening.match(/[.?!]/g) ?? []).length >= 2, t.opening)
    check(`${t.id}: the opening names the caller and the brokerage`,
      t.opening.includes('{caller}') && t.opening.includes('{brokerage}'), t.opening)
    check(`${t.id}: all five branches say something`,
      CALL_BRANCHES.every((b) => !empty(t.branches[b])))
    check(`${t.id}: all five branches end the call in words`,
      CALL_BRANCHES.every((b) => !empty(t.close[b].say)))
    check(`${t.id}: every ending writes a next action to the CRM`,
      CALL_BRANCHES.every((b) => !empty(t.close[b].crm.next)))
    check(`${t.id}: the consent line discloses the recording`,
      /record/i.test(t.consentLine), t.consentLine)
    check(`${t.id}: the consent line offers a way out`,
      /stop|person|transfer/i.test(t.consentLine), t.consentLine)
    // The standing instruction, and it is the sentence that tells a Dubai
    // buyer they are on a list.
    check(`${t.id}: nobody asks how they are today`,
      !spokenLines(t).some((s) => /how are you/i.test(s)))
  }
}

console.log('\n── no number and no unfilled token reaches a call ──')
{
  for (const t of CALL_TEMPLATES) {
    const lines = spokenLines(t)
    const withDigits = lines.filter((s) => /\d/.test(s))
    // Every price, plan and floor count comes from the listing record through
    // a token. A digit typed into a script is a number nobody sourced.
    check(`${t.id}: no digits in anything said out loud`,
      withDigits.length === 0, withDigits.join(' | '))

    const unknown = lines
      .flatMap((s) => s.match(/\{[^}]*\}/g) ?? [])
      .filter((tok) => !TOKENS.has(tok))
    check(`${t.id}: every token is one the dialler can fill`,
      unknown.length === 0, unknown.join(' '))
  }
  const usedSomewhere = new Set(
    CALL_TEMPLATES.flatMap((t) => spokenLines(t).flatMap((s) => s.match(/\{[^}]*\}/g) ?? [])),
  )
  // A declared token nobody says is a field the dialler resolves for nothing.
  check('every declared token is actually used by a script',
    SCRIPT_TOKENS.every((tok) => usedSomewhere.has(tok)),
    SCRIPT_TOKENS.filter((tok) => !usedSomewhere.has(tok)).join(' '))
}

console.log('\n── every capture field can actually be written ──')
{
  for (const t of CALL_TEMPLATES) {
    check(`${t.id}: the call comes back with something`, t.capture.length > 0)
    check(`${t.id}: at least one field is required`,
      t.capture.some((c) => c.required), '')
    check(`${t.id}: no duplicate field ids`,
      new Set(t.capture.map((c) => c.field)).size === t.capture.length,
      t.capture.map((c) => c.field).join(','))
    check(`${t.id}: every field is asked in words`,
      t.capture.every((c) => c.question.trim() !== ''))

    const bad = t.capture.filter((c: CaptureField) =>
      'column' in c.writeTo
        ? !COLUMNS.has(c.writeTo.column)
        // Derived is allowed, but it has to say where the answer goes. A bare
        // flag is how an answer ends up nowhere.
        : c.writeTo.derived.trim().length < 20)
    check(`${t.id}: every field names a real column or says why it is derived`,
      bad.length === 0, bad.map((c) => c.field).join(','))
  }

  // The one column the phone must never overwrite: buyer_intent is derived
  // from what the visitor DID on the landing page (app/api/leads/route.ts),
  // and a spoken answer may only fill it when it is empty.
  const intent = CALL_TEMPLATES.flatMap((t) => t.capture)
    .filter((c) => 'column' in c.writeTo && c.writeTo.column === 'buyer_intent')
  check('buyer_intent is only ever filled when empty, never overwritten',
    intent.length > 0 && intent.every((c) => 'column' in c.writeTo && c.writeTo.onlyWhenEmpty === true),
    `${intent.length} field(s)`)
}

console.log('\n── every ending writes something the CRM accepts ──')
{
  for (const t of CALL_TEMPLATES) {
    for (const b of CALL_BRANCHES) {
      const { crm } = t.close[b]
      const badCols = crm.columns.filter((c) => !COLUMNS.has(c))
      check(`${t.id}/${b}: writes only columns that exist`, badCols.length === 0, badCols.join(','))
      check(`${t.id}/${b}: the status is one the pipeline allows`,
        crm.status === null || STATUSES.has(crm.status), String(crm.status))
      // A status change that does not declare the column is a write nobody
      // can audit from the template.
      check(`${t.id}/${b}: a status change declares the status column`,
        crm.status === null || crm.columns.includes('status'), crm.columns.join(','))
      // Six months out is not a plan, it is a lead nobody wants to close.
      check(`${t.id}/${b}: the call-back is absent or inside six months`,
        crm.callBackInDays === null
        || (Number.isInteger(crm.callBackInDays) && crm.callBackInDays > 0 && crm.callBackInDays <= 180),
        String(crm.callBackInDays))
      check(`${t.id}/${b}: an ending that stops the calling schedules no call-back`,
        !crm.stopCalling || crm.callBackInDays === null, String(crm.callBackInDays))
    }
    check(`${t.id}: the hostile ending stops the calling for good`,
      t.close.hostile.crm.stopCalling && t.close.hostile.crm.status === 'lost')
    check(`${t.id}: the wrong-number ending stops the calling for good`,
      t.close.wrongPerson.crm.stopCalling)
    check(`${t.id}: the interested ending moves the lead down the pipeline`,
      t.close.interested.crm.status !== null && t.close.interested.crm.status !== 'lost',
      String(t.close.interested.crm.status))
  }
}

console.log('\n── every call has a cap, and the cap has a reason ──')
{
  // The band: under two minutes is a robocall, over fifteen is a meeting the
  // caller is holding instead of booking.
  const MIN = 120
  const MAX = 900
  for (const t of CALL_TEMPLATES) {
    check(`${t.id}: cap of ${t.maxDurationSec}s is inside the band`,
      Number.isInteger(t.maxDurationSec) && t.maxDurationSec >= MIN && t.maxDurationSec <= MAX,
      String(t.maxDurationSec))
    check(`${t.id}: the cap states its why`, t.why.trim().length > 40, t.why)
  }
  // The money conversation is the long one and the announcement is the short
  // one. If that ever inverts, somebody has moved a number without reading it.
  check('qualification has the longest cap',
    CALL_TEMPLATES.every((t) => t.maxDurationSec <= templateFor('qualification').maxDurationSec))
  check('the invitation is the shortest — it is one question',
    CALL_TEMPLATES.every((t) => t.maxDurationSec >= templateFor('invitation').maxDurationSec))
}

console.log('\n── four voices, and the fifth is a decision ──')
{
  check(`at most ${MAX_VOICES} voices`, VOICES.length <= MAX_VOICES, String(VOICES.length))
  check('no duplicate voice ids', new Set(VOICES.map((v) => v.id)).size === VOICES.length)
  check('every voice says when to use it', VOICES.every((v) => v.use.trim().length > 20))
  check('every voice speaks at least one language', VOICES.every((v) => v.languages.length > 0))
  // Three languages everywhere is the house rule; a language with no voice is
  // a language the service cannot call in.
  for (const lang of ['en', 'ar', 'ru'] as const) {
    check(`${lang} has a voice`, voiceFor(lang) !== null)
  }
  // The second voice exists so a re-engagement call does not sound like the
  // call the lead already refused.
  const first = voiceFor('en')
  check('English has a second voice for the second call',
    first !== null && voiceFor('en', first.id)?.id !== first.id,
    String(first?.id))
}

console.log('\n── the calling window refuses, it does not queue ──')
{
  const at = (iso: string) => new Date(iso)
  check('ten in the morning Dubai is open', windowVerdict(at('2026-08-19T10:00:00+04:00')).allowed)
  check('seven in the evening Dubai is open', windowVerdict(at('2026-08-19T19:00:00+04:00')).allowed)
  check('one minute before ten is refused',
    windowVerdict(at('2026-08-19T09:59:00+04:00')).refusal === 'outsideHours')
  check('eight in the evening is the edge, and the edge is closed',
    windowVerdict(at('2026-08-19T20:00:00+04:00')).refusal === 'outsideHours')
  check('three in the morning is refused',
    windowVerdict(at('2026-08-19T03:00:00+04:00')).refusal === 'outsideHours')
  // Saturday and Sunday are the UAE weekend and the days viewings happen. A
  // rule that bans weekend calls bans the job.
  check('Saturday is a working day for a broker',
    windowVerdict(at('2026-08-22T11:00:00+04:00')).allowed)
  check('Friday before the prayer is open',
    windowVerdict(at('2026-08-21T11:00:00+04:00')).allowed)
  check('Friday midday is the prayer break, and it says so',
    windowVerdict(at('2026-08-21T12:30:00+04:00')).refusal === 'prayerBreak')
  check('Friday afternoon is open again',
    windowVerdict(at('2026-08-21T14:30:00+04:00')).allowed)
  check('a window exists for all seven days', CALL_WINDOWS.length === 7)
  check('every window has hours in it',
    CALL_WINDOWS.every((w) => w.segments.length > 0
      && w.segments.every((s) => s.toMin > s.fromMin)))

  // REFUSED, NOT QUEUED. A refusal that carries a retry time is a queue with
  // extra steps, and a queue fires unattended — at three in the morning after
  // a clock bug, at a lead who withdrew consent overnight.
  const lead: CallableLead = {
    id: 'l1', phone: '+971500000000',
    marketing_consent_at: '2026-08-01T09:00:00Z',
  }
  const refused = planCall(lead, 'first_contact', at('2026-08-19T03:00:00+04:00'))
  check('a call outside the window is refused', refused.go === false)
  check('the refusal carries no retry handle and no queue slot',
    Object.keys(refused).every((k) => ['go', 'refusal', 'sentence'].includes(k)),
    Object.keys(refused).join(','))
  check('every refusal reason has words a broker can read',
    CALL_REFUSALS.every((r) => (REFUSAL_SENTENCES[r] ?? '').trim().length > 10))
}

console.log('\n── a lead that fails the gate can never be called ──')
{
  const NOW = new Date('2026-08-19T14:00:00+04:00')   // Wednesday, mid-window
  const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString()
  const hoursAgo = (n: number) => new Date(NOW.getTime() - n * 3_600_000).toISOString()
  const daysAhead = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString()

  const lead = (o: Partial<CallableLead> = {}): CallableLead => ({
    id: 'lead_1',
    phone: '+971500000000',
    marketing_consent_at: daysAgo(30),
    ...o,
  })

  check('a consenting, reachable lead inside the window is callable',
    consentGate(lead(), NOW).allowed && planCall(lead(), 'first_contact', NOW).go === true)

  const blocked: readonly (readonly [string, CallableLead])[] = [
    ['do-not-call', lead({ do_not_call: true })],
    ['blocked on the record', lead({ blocked: true })],
    ['archived', lead({ archived: true })],
    ['no consent record at all', lead({ marketing_consent_at: null })],
    ['consent field never written', lead({ marketing_consent_at: undefined })],
    ['consent that is not a date', lead({ marketing_consent_at: 'yes, verbally' })],
    ['consent older than the stale window', lead({ marketing_consent_at: daysAgo(CONSENT_STALE_DAYS + 1) })],
    ['consent stamped in the future', lead({ marketing_consent_at: daysAhead(2) })],
    ['muted by the desk', lead({ muted_until: daysAhead(3) })],
    ['muted with an unreadable date', lead({ muted_until: 'later' })],
    ['snoozed to a date the lead named', lead({ snooze_until: daysAhead(30) })],
    ['no phone number', lead({ phone: null })],
    ['a blank phone number', lead({ phone: '   ' })],
    ['rung an hour ago', lead({ last_contact_at: hoursAgo(1) })],
    ['rung inside the minimum gap', lead({ last_contact_at: hoursAgo(MIN_HOURS_BETWEEN_CALLS - 1) })],
  ]

  for (const [why, l] of blocked) {
    const gate = consentGate(l, NOW)
    check(`refused: ${why}`, !gate.allowed && gate.refusal !== null, gate.sentence)
    // The property that matters: not one template, ANY template — and the gate
    // is checked before the script is chosen, so no call type can slip past it.
    const anyCallable = CALL_TYPES.some((type) => planCall(l, type, NOW).go === true)
    check(`refused: ${why} — for all seven call types`, !anyCallable, why)
  }

  // Every refusal the gate can produce is one of the enumerated reasons, so
  // the CRM always has a word for it.
  const reasons = new Set(blocked.map(([, l]) => consentGate(l, NOW).refusal))
  check('every refusal produced is an enumerated one',
    [...reasons].every((r) => r !== null && (CALL_REFUSALS as readonly string[]).includes(r)),
    [...reasons].join(','))

  // A hostile call must close the lead to calling for good — not by a note a
  // human has to read, but by the flag the gate itself refuses on.
  for (const t of CALL_TEMPLATES) {
    const write = t.close.hostile.crm
    const after = lead({ blocked: write.columns.includes('blocked') ? true : undefined })
    check(`${t.id}: after a hostile ending the gate refuses this lead`,
      !consentGate(after, NOW).allowed
      && CALL_TYPES.every((type) => planCall(after, type, NOW).go === false),
      write.columns.join(','))
  }

  // Consent is checked before the clock: the permanent refusal is the one the
  // operator should see on the card, not "outside hours".
  const night = new Date('2026-08-19T03:00:00+04:00')
  check('a do-not-call lead reads as do-not-call even at three in the morning',
    planCall(lead({ do_not_call: true }), 'reengagement', night).go === false
    && (planCall(lead({ do_not_call: true }), 'reengagement', night) as { refusal: string }).refusal === 'doNotCall')
}

if (failures > 0) {
  console.error(`\n${failures} call-template rule(s) broken.`)
  process.exit(1)
}
console.log('\nAll call-template rules hold.\n')
