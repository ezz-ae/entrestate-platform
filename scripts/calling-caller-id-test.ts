/**
 * CALLER ID, LOCKED — the number a lead sees when the phone rings.
 *
 * The prohibition in lib/calling/caller-id.ts is not a preference: presenting
 * a number you have not proven you control is caller-ID spoofing, it is
 * illegal in the UAE, the UK and the US, and the provider terminates the
 * shared account on the first complaint — which takes every other tenant on
 * that account down with it. A rule that severe cannot live only in a comment.
 *
 * The failure this suite is built to catch is a QUIET one. Nothing throws when
 * an unverified number is used; the call simply goes out wearing somebody
 * else's identity and nobody notices until the complaint. So the assertions
 * below are written against the refusals themselves — the exact codes the
 * route maps to HTTP statuses and the screen renders as a badge — rather than
 * against the shape of the return value:
 *
 *  · a claimed-but-unlisted number REFUSES, and refuses as `unverified` not
 *    `unknown` — the two send a broker to two different places, and telling
 *    somebody to "add your number" when they already added it is how a real
 *    verification step gets skipped in frustration.
 *  · a tenant with only unverified numbers gets `caller_id_none`, never a
 *    silent fall-through to the vendor's line.
 *  · the platform number is never reached WITHOUT the opt-in flag, because a
 *    lead who calls the vendor's number back has been given the wrong number
 *    by us, not by the brokerage.
 *  · a number that will not normalise never becomes a caller id at all.
 *
 * `describeCallWindows` is here too, for a smaller reason with the same shape:
 * it is the sentence the integrations screen prints about when calls may go
 * out, and if it drifts from CALL_WINDOWS the screen lies about the gate that
 * is actually running.
 *
 * Pure — no network, no database, no clock. Runs in `pnpm guards`.
 */
import {
  normaliseE164, sameNumber, usableAsCallerId, resolveCallerId, mergeCallerIds,
  CALLER_ID_REFUSALS, type CallerId, type PendingCallerId,
} from '../lib/calling/caller-id'
import { describeCallWindows, RAIL_REFUSALS, RAIL_REFUSAL_SENTENCES } from '../lib/calling/gates'
import { CALL_WINDOWS } from '../lib/freehold/call-templates'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const VERIFIED = '2026-08-18T09:00:00.000Z'

/** A number the provider holds and we have seen it hold. */
const verified = (e164: string, origin: CallerId['origin'] = 'tenant_verified'): CallerId => ({
  e164, origin, providerNumberId: `pn_${e164.replace(/\D/g, '')}`, verifiedAt: VERIFIED, label: null,
})
/** A number a brokerage typed in and the provider has never confirmed. */
const claimed = (e164: string): CallerId => ({
  e164, origin: 'tenant_verified', providerNumberId: null, verifiedAt: null, label: 'Sales line',
})

console.log('\n── one spelling of a number ──')
{
  check('spaces, dashes and brackets all normalise to the same number',
    normaliseE164('+971 50 123 4567') === '+971501234567' &&
    normaliseE164('+971-50-123-4567') === '+971501234567' &&
    normaliseE164('(+971) 50 1234567') === '+971501234567',
    String(normaliseE164('+971 50 123 4567')))

  // Not guessed: a local-format number with a country code invented for it is
  // a call to a stranger who shares those digits somewhere else in the world.
  check('a number with no + is refused rather than given a country code',
    normaliseE164('0501234567') === null && normaliseE164('971501234567') === null)
  check('too short and too long are both refused',
    normaliseE164('+9715012') === null && normaliseE164('+9715012345678901') === null)
  check('a leading zero after the + is refused', normaliseE164('+0715012345') === null)
  check('empty and junk are refused',
    normaliseE164('') === null && normaliseE164('not a phone') === null)

  check('the same phone typed two ways compares equal',
    sameNumber('+971 50 123 4567', '+971501234567'))
  check('two different phones do not', !sameNumber('+971501234567', '+971501234568'))
  // Both sides must normalise: an unusable string matching another unusable
  // string is not a match, it is two unknowns.
  check('an unusable string never equals anything, including itself',
    !sameNumber('0501234567', '0501234567'))
}

console.log('\n── the prohibition, as a predicate ──')
{
  check('a number the provider holds and we have confirmed is usable',
    usableAsCallerId(verified('+971501234567')))
  check('a claim the provider does not hold is NOT usable',
    !usableAsCallerId(claimed('+971501234567')))
  // Both halves, because one without the other means our table and the
  // provider disagree about who owns a phone number.
  check('a provider id with no confirmation is NOT usable',
    !usableAsCallerId({ ...verified('+971501234567'), verifiedAt: null }))
  check('a confirmation with no provider id is NOT usable',
    !usableAsCallerId({ ...verified('+971501234567'), providerNumberId: null }))
  check('null and undefined are not usable',
    !usableAsCallerId(null) && !usableAsCallerId(undefined))
}

console.log('\n── resolving the number a call goes out from ──')
{
  const own = verified('+971501234567')
  const vendor = verified('+97144000000', 'platform')

  check('with a verified number of their own, that is the number',
    resolveCallerId({ available: [own, vendor] }).ok === true)
  {
    const r = resolveCallerId({ available: [own, vendor] })
    check('…and it is theirs, not the vendor’s, even when both are verified',
      r.ok && r.callerId.e164 === own.e164, r.ok ? r.callerId.e164 : r.refusal)
  }

  {
    // THE CASE THE WHOLE MODULE EXISTS FOR.
    const r = resolveCallerId({ available: [claimed('+971501234567')] })
    check('a claimed-but-unlisted number is refused, never dialled from',
      r.ok === false)
    check('…and asking for it by name says UNVERIFIED, not unknown',
      (() => {
        const named = resolveCallerId({ requested: '+971501234567', available: [claimed('+971501234567')] })
        return !named.ok && named.refusal === 'caller_id_unverified'
      })(), 'the broker must be told to verify, not told to add it again')
  }

  {
    const r = resolveCallerId({ requested: '+97155000000', available: [verified('+971501234567')] })
    check('a number that is not on the account at all says UNKNOWN',
      !r.ok && r.refusal === 'caller_id_unknown')
  }

  {
    const r = resolveCallerId({ available: [claimed('+971501234567')] })
    check('a tenant whose only numbers are unverified gets caller_id_none',
      !r.ok && r.refusal === 'caller_id_none')
  }

  {
    // The silent fall-through is the dangerous one: the brokerage never chose
    // the vendor's number and finds out from a lead who called it back.
    const r = resolveCallerId({ available: [verified('+97144000000', 'platform')] })
    check('the vendor number is NOT reached without the opt-in flag',
      !r.ok && r.refusal === 'caller_id_none')
    const opted = resolveCallerId({
      available: [verified('+97144000000', 'platform')], allowPlatformFallback: true,
    })
    check('…and IS reached with it', opted.ok === true)
  }

  {
    // Naming it is a person choosing it on purpose, which stays allowed.
    const r = resolveCallerId({
      requested: '+97144000000', available: [verified('+97144000000', 'platform')],
    })
    check('naming the vendor number explicitly is allowed without the flag', r.ok === true)
  }

  check('an empty account refuses rather than throwing',
    resolveCallerId({ available: [] }).ok === false)

  {
    const codes = new Set<string>()
    for (const args of [
      { available: [] },
      { available: [claimed('+971501234567')] },
      { requested: '+97155000000', available: [verified('+971501234567')] },
      { requested: '+971501234567', available: [claimed('+971501234567')] },
    ]) {
      const r = resolveCallerId(args)
      if (!r.ok) codes.add(r.refusal)
    }
    check('every refusal produced is one of the enumerated ones',
      [...codes].every((c) => (CALLER_ID_REFUSALS as readonly string[]).includes(c)),
      [...codes].join(', '))
  }
}

console.log('\n── merging what the provider holds with what the tenant claimed ──')
{
  const claims: PendingCallerId[] = [
    { e164: '+971 50 123 4567', label: 'Sales line', claimedBy: 'ops@example.com', claimedAt: VERIFIED },
    { e164: '+97155 999 8888', label: 'Leasing', claimedBy: 'ops@example.com', claimedAt: VERIFIED },
  ]
  const merged = mergeCallerIds({
    providerNumbers: [{ id: 'pn_1', e164: '+971501234567', label: null, verified: true }],
    claims,
    platformIds: new Set<string>(),
    now: VERIFIED,
  })

  check('a claim the provider confirms comes back verified',
    merged.some((c) => c.e164 === '+971501234567' && usableAsCallerId(c)))
  // Dropping it would look to the tenant like the number they added was lost,
  // and they would add it again instead of finishing verification.
  check('a claim the provider does not list stays in the list, unverified',
    merged.some((c) => c.e164 === '+971559998888' && !usableAsCallerId(c)))
  check('…and it is not counted twice',
    merged.filter((c) => c.e164 === '+971501234567').length === 1)
  check('the tenant’s own label survives the merge',
    merged.find((c) => c.e164 === '+971501234567')?.label === 'Sales line')

  const withPlatform = mergeCallerIds({
    providerNumbers: [{ id: 'pn_vendor', e164: '+97144000000', label: null, verified: true }],
    claims: [],
    platformIds: new Set(['pn_vendor']),
    now: VERIFIED,
  })
  check('a number on the vendor list is marked platform, not the tenant’s own',
    withPlatform[0]?.origin === 'platform', withPlatform[0]?.origin)

  const inherited = mergeCallerIds({
    providerNumbers: [{ id: 'pn_someone_else', e164: '+97144000000', label: null, verified: true }],
    claims: [],
    platformIds: new Set<string>(),   // CALLING_PLATFORM_NUMBER_IDS unset
    now: VERIFIED,
  })
  // It reads as tenant_verified, which is why resolveCallerId is not the only
  // gate: the route also refuses when the tenant claimed nothing. Asserted so
  // the consequence of leaving the env var unset is written down.
  check('with no platform ids configured, a provider number is not treated as the vendor’s',
    inherited[0]?.origin === 'tenant_verified')

  const junk = mergeCallerIds({
    providerNumbers: [{ id: 'pn_bad', e164: '0501234567', label: null, verified: true }],
    claims: [{ e164: 'not a phone', label: null, claimedBy: 'x', claimedAt: VERIFIED }],
    platformIds: new Set<string>(),
    now: VERIFIED,
  })
  check('numbers that will not normalise are dropped from both sides',
    junk.length === 0, JSON.stringify(junk))

  const unverifiedProvider = mergeCallerIds({
    providerNumbers: [{ id: 'pn_2', e164: '+971501234567', label: null, verified: false }],
    claims: [],
    platformIds: new Set<string>(),
    now: VERIFIED,
  })
  check('a number the provider lists but has NOT verified is not usable',
    !usableAsCallerId(unverifiedProvider[0]))
}

console.log('\n── the hours sentence matches the hours ──')
{
  const said = describeCallWindows()
  const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  const everySegment = CALL_WINDOWS.flatMap((w) => w.segments.map((s) => `${hhmm(s.fromMin)}–${hhmm(s.toMin)}`))
  const missing = [...new Set(everySegment)].filter((seg) => !said.includes(seg))
  check('every segment in CALL_WINDOWS appears in the sentence the screen prints',
    missing.length === 0, missing.join(', '))
  // The Friday gap is the one that marks a caller as somebody who works here.
  check('…including the Friday prayer gap', said.includes('11:30') && said.includes('14:00'), said)
}

console.log('\n── every rail refusal has a sentence ──')
{
  const silent = RAIL_REFUSALS.filter((r) => !RAIL_REFUSAL_SENTENCES[r]?.trim())
  check('no rail refusal returns a bare code with no words behind it',
    silent.length === 0, silent.join(', '))
  // "Call blocked" is useless: these two have different people who fix them.
  check('the two caller-id refusals do not say the same thing',
    RAIL_REFUSAL_SENTENCES.callerIdUnverified !== RAIL_REFUSAL_SENTENCES.callerIdNone)
}

if (failures > 0) {
  console.error(`\n${failures} caller-id rule(s) broken.`)
  process.exit(1)
}
console.log('\nA number nobody proved they own never shows on a lead’s screen.\n')
