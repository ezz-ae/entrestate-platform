/**
 * THE ANSWER IS CHECKED BEFORE IT IS SHOWN — locked.
 *
 * The transcript this exists for, from a live workspace:
 *
 *   "There are currently no automation rules for the Zada Tower campaign.
 *    This is why it's continued to spend despite the low lead quality score
 *    of 45… 50 leads this month… Starting from AED 699,999."
 *
 * There is no Zada Tower. The campaign, the score, the lead count and the
 * price were all produced by the model, in confident business prose, with
 * buttons under them — while the system prompt forbade every one of those in
 * capital letters.
 *
 * So these assertions are about two properties, and the second matters as much
 * as the first: the check CATCHES that transcript, and it does not fire on
 * honest answers. A verifier that cries wolf is switched off in a week, and
 * then the real lie ships.
 *
 * Pure — no model, no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  campaignNamesClaimed, unknownCampaigns, verifyAnswer, GROUNDING_FAULTS,
} from '../lib/freehold/answer-grounding'
import { significantFigures } from '../lib/freehold/evidence'

/** This turn's sources, the way the route assembles them: the live context,
 *  the results of the tools called, and the user's own message. */
const sources = (parts: { context?: unknown; toolResults?: unknown; userMessage?: string }): string[] =>
  [
    parts.context === undefined ? '' : JSON.stringify(parts.context),
    parts.toolResults === undefined ? '' : JSON.stringify(parts.toolResults),
    parts.userMessage ?? '',
  ].filter(Boolean)

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

// The real workspace, as the live account actually holds it.
const KNOWN = ['cash offer new audiences', 'Sea Legend One — Quick', 'Cash offer', 'R. Hills — Lead Gen']
const CONTEXT = {
  campaigns: [
    { name: 'cash offer new audiences', spend: 501, leads: 2, impressions: 27433 },
    { name: 'Sea Legend One — Quick', spend: 0, leads: 0 },
  ],
}

console.log('\n── the transcript that produced this module ──')
{
  const answer = `There are currently no automation rules set up for the Zada Tower campaign. `
    + `This is why it's continued to spend the budget despite the low lead quality score of 45. `
    + `Starting from AED 699,999. Book your viewing today.`
  const src = sources({ context: CONTEXT, userMessage: 'Show me the automation rules for the Zada Tower campaign' })
  const v = verifyAnswer({ answer, sources: src, knownCampaigns: KNOWN })

  check('the answer is refused', !v.ok, JSON.stringify(v))
  check('…because it names a campaign this workspace does not have',
    v.campaigns.includes('Zada Tower'), v.campaigns.join(','))
  check('…and because the quality score came from nowhere',
    v.numbers.includes('45'), v.numbers.join(','))
  check('…and so did the price', v.numbers.includes('699999'), v.numbers.join(','))
  check('both faults are reported, not just the first',
    v.faults.length === 2, v.faults.join(','))

  // The second half of the same transcript.
  const fifty = verifyAnswer({
    answer: 'I have searched the CRM and found 50 leads associated with the Zada Tower project.',
    sources: src, knownCampaigns: KNOWN,
  })
  check('an invented lead count is caught', fifty.numbers.includes('50'), fifty.numbers.join(','))
}

console.log('\n── and it does not cry wolf ──')
{
  const src = sources({ context: CONTEXT, userMessage: 'how is cash offer doing' })
  const honest = verifyAnswer({
    answer: 'cash offer new audiences has spent AED 501 and brought 2 leads from 27,433 impressions.',
    sources: src, knownCampaigns: KNOWN,
  })
  check('an answer quoting the real numbers passes', honest.ok, JSON.stringify(honest))

  const traced = (answer: string, context: unknown) =>
    verifyAnswer({ answer, sources: sources({ context }), knownCampaigns: KNOWN }).numbers.length === 0
  check('a thousands separator is the same number as without one', traced('27,433 impressions', { n: 27433 }))
  check('a currency prefix does not make a number new', traced('AED 501 spent', { spend: 501 }))
  check('a percent sign does not make a number new', traced('45% of spend', { pct: 45 }))

  check('the honest refusal passes, because it contains no figures at all',
    verifyAnswer({
      answer: "I don't have live data for that. Connect Meta Ads under Integrations and it will appear here.",
      sources: src, knownCampaigns: KNOWN,
    }).ok)

  // A user who puts a number in the question has put it in the conversation.
  check('a number quoted back from the USER\'s own question is grounded',
    verifyAnswer({
      answer: 'I cannot filter to the last 24 hours.',
      sources: sources({ context: {}, userMessage: 'leads in the last 24 hours?' }),
      knownCampaigns: KNOWN,
    }).ok)

  check('a tool result grounds the numbers it returned',
    verifyAnswer({
      answer: 'That ad set has spent AED 93 for 946 impressions.',
      sources: sources({ context: {}, toolResults: [{ spend: 93, impressions: 946 }] }),
      knownCampaigns: KNOWN,
    }).ok)
}

console.log('\n── small numbers are reasoning, not claims ──')
{
  // Enforcing these produces false alarms that train people to ignore the real
  // ones. Every fabricated figure in the live transcript was two digits or more.
  // These are now the LIVE auditor's rules, so they are asserted against it —
  // the point of unifying was that there is nothing else to assert them against.
  check('single digits are not audited',
    significantFigures('two ad sets, 3 designs, 1 form').length === 0,
    significantFigures('two ad sets, 3 designs, 1 form').join(','))
  check('…and a two-digit metric is',
    significantFigures('45 leads').length > 0, significantFigures('45 leads').join(','))
  check('an answer with only small numbers raises no fault',
    verifyAnswer({ answer: 'I built two ad sets and 3 designs.', sources: [], knownCampaigns: KNOWN }).ok)
}

console.log('\n── the campaign pattern is narrow on purpose ──')
{
  check('"the Zada Tower campaign" names Zada Tower',
    campaignNamesClaimed('the Zada Tower campaign is spending').join(',') === 'Zada Tower')
  check('the article is not part of the name',
    !campaignNamesClaimed('Your Marina Views campaign').join(',').startsWith('Your'))
  check('a lower-case mention is not a claimed name',
    campaignNamesClaimed('every campaign in the account').length === 0,
    campaignNamesClaimed('every campaign in the account').join(','))

  // Abbreviating a real campaign is not inventing one.
  check('an abbreviated real name passes',
    unknownCampaigns('the Sea Legend campaign is paused', KNOWN).length === 0,
    unknownCampaigns('the Sea Legend campaign is paused', KNOWN).join(','))
  check('…and so does a longer form of it',
    unknownCampaigns('the Cash Offer New Audiences campaign', KNOWN).length === 0)
  check('punctuation and case never decide it',
    unknownCampaigns('the "cash-offer new audiences" campaign', KNOWN).length === 0)

  // With no workspace list to check against, claim nothing rather than
  // flagging every name — an empty known-list must not fail every answer.
  check('an empty workspace list makes NO accusation',
    unknownCampaigns('the Zada Tower campaign', []).length === 0)
}

console.log('\n── the verdict is a verdict, not a rewrite ──')
{
  const v = verifyAnswer({
    answer: 'The Zada Tower campaign has 45 leads.',
    sources: sources({ context: CONTEXT }),
    knownCampaigns: KNOWN,
  })
  check('it reports what was wrong so the server can log it',
    v.numbers.length > 0 && v.campaigns.length > 0, JSON.stringify(v))
  check('every fault it can raise is named, or the replacement renders a blank',
    v.faults.every((f) => (GROUNDING_FAULTS as readonly string[]).includes(f)), v.faults.join(','))
  check('a clean answer reports no faults at all',
    verifyAnswer({ answer: 'Nothing to report.', sources: [], knownCampaigns: KNOWN }).faults.length === 0)
  check('it carries the auditor\'s own verdict for the caller to word a correction from',
    v.figures !== null && typeof v.figures.verdict === 'string', String(v.figures?.verdict))
}

console.log('\n── one reviewer, not two ──')
{
  const src = readFileSync(join(process.cwd(), 'lib/freehold/answer-grounding.ts'), 'utf8')
  // evidence.ts says in its own header that it REPLACES the original tripwire.
  // Both existed for a while — one wired, one exported with a green suite and
  // called by nothing. The loose one was the one a future engineer would most
  // plausibly wire in, downgrading the check while believing they added one.
  check('the superseded figure path is gone',
    !/export function (numbersIn|groundingCorpus|ungroundedNumbers)\b/.test(src))
  check('…and its threshold constant with it', !/MIN_CHECKED_DIGITS/.test(src))
  check('the live auditor is the one that runs', /auditFigures\(/.test(src))
  check('the entity check stayed, because it was never superseded',
    /export function unknownCampaigns/.test(src))
}

if (failures > 0) {
  console.error(`\n${failures} answer-grounding rule(s) broken.`)
  process.exit(1)
}
console.log('\nNo figure and no campaign name reaches a screen unless it came from the data.\n')
