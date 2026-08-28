/**
 * THE ANSWER IS CHECKED BEFORE IT IS SHOWN.
 *
 * A live transcript, in a product a business runs money through:
 *
 *   "Show me the automation rules for the Zada Tower campaign"
 *   "There are currently no automation rules for the Zada Tower campaign.
 *    This is why it's continued to spend despite the low lead quality score
 *    of 45… 50 leads this month… Starting from AED 699,999."
 *
 * There is no Zada Tower. Not in the ad account, not in the inventory, not
 * anywhere in this codebase. The campaign, the quality score, the lead count,
 * the ad copy and the price were all produced by the model, in confident
 * business prose, with buttons under them.
 *
 * The system prompt already forbade every one of those, in capital letters,
 * as "the single worst failure you can commit". IT WAS IGNORED. That is the
 * lesson this codebase keeps relearning in other forms: a rule whose only
 * enforcement is a sentence is a rule that gets broken. Prompts are a
 * request. This module is a check.
 *
 * ONE REVIEWER, NOT TWO. The number half of this module was the ORIGINAL
 * tripwire, and lib/freehold/evidence.ts says in its own header that it
 * "replaces it": the old test blocked a reply only when NONE of its figures
 * were grounded, so a reply quoting one real spend and inventing nine others
 * passed untouched. Both then existed — one wired, one exported with a green
 * guard suite and called by nothing. That is worse than dead code: an audit
 * of "how many nets check our numbers" answered two, the answer was one, and
 * the loose net was the one a future engineer would most plausibly wire in,
 * DOWNGRADING the check while believing they had added one.
 *
 * So the weak figure path is gone and verifyAnswer() now composes the LIVE
 * auditor. There is one review, it is named, and any door — the chat panel,
 * the MCP bridge, an employee handing over work — asks the same question.
 *
 * WHAT IT VERIFIES, and deliberately nothing more:
 *
 *  1. NUMBERS, via auditFigures() in evidence.ts: per-figure provenance
 *     against this turn's sources, with derived figures (a CPL computed from
 *     a real spend and a real lead count) recognised rather than accused.
 *
 *  2. NAMED CAMPAIGNS. A phrase of the shape "<Name> campaign" must match a
 *     campaign this workspace actually has. Narrow on purpose: it is the
 *     exact shape of the failure above, and a narrow pattern that never
 *     misfires is worth more than a broad one nobody trusts.
 *
 * WHAT IT DOES NOT VERIFY, stated so nobody mistakes this for a truth oracle:
 * single-digit numbers (a model may legitimately say "two ad sets", and
 * enforcing those produces false alarms that train people to ignore the real
 * ones), prose claims with no figure in them, and names of anything other
 * than a campaign. This catches the expensive lie, not every lie.
 *
 * Pure — no I/O, no model. Runs in `pnpm guards`.
 */

import { auditFigures, type EvidenceReport } from './evidence'

export function campaignNamesClaimed(answer: string): string[] {
  const out: string[] = []
  const src = String(answer ?? '')
  // "the Zada Tower campaign", "Zada Tower campaign is…" — one to four
  // capitalised words directly before the word campaign.
  for (const m of src.matchAll(/\b((?:[A-Z][\w'’-]*\s+){1,4})campaign\b/g)) {
    const name = m[1].trim()
    // Leading articles and possessives are not part of a name.
    const cleaned = name.replace(/^(The|This|That|Your|Our|A|An)\s+/i, '').trim()
    if (cleaned) out.push(cleaned)
  }
  return [...new Set(out)]
}

const loose = (s: string) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')

/**
 * Names the answer claims that the workspace does not have.
 *
 * Matched loosely — punctuation and spacing differ constantly between a
 * campaign called "cash offer | new audiences" and how anyone writes it — and
 * either direction counts as a match, because a model naming "Sea Legend" for
 * a campaign called "Sea Legend One — Quick" is abbreviating, not inventing.
 */
export function unknownCampaigns(answer: string, knownNames: string[]): string[] {
  const known = knownNames.map(loose).filter(Boolean)
  if (known.length === 0) return []   // nothing to check against; claim nothing
  return campaignNamesClaimed(answer).filter((claim) => {
    const c = loose(claim)
    return !known.some((k) => k.includes(c) || c.includes(k))
  })
}

/** Walkable — each renders a sentence in the replacement answer. */
export const GROUNDING_FAULTS = ['number', 'campaign'] as const
export type GroundingFault = (typeof GROUNDING_FAULTS)[number]

export interface GroundingVerdict {
  ok: boolean
  faults: GroundingFault[]
  /** Figures that could not be traced to this turn's sources. Server log and
   *  the correction sentence — never a raw diagnostic dumped on the user. */
  numbers: string[]
  campaigns: string[]
  /** The figure auditor's own verdict, so a caller can tell "every number was
   *  invented" from "one of nine was" and correct in different words. */
  figures: EvidenceReport | null
}

/**
 * The check itself.
 *
 * A VERDICT, NOT A REWRITE: what to DO about a failed answer is the caller's
 * decision, and it is a different question in a chat panel than in an MCP
 * bridge. This says only whether the answer can be stood behind.
 *
 * `sources` is everything this turn actually looked at — tool results and the
 * live context. Passing an empty list means nothing can be traced, so every
 * figure reads as ungrounded; that is the honest result, not a bug.
 */
export function verifyAnswer(params: {
  answer: string
  /** Tool results and live context for this turn. */
  sources: string[]
  knownCampaigns: string[]
}): GroundingVerdict {
  const figures = auditFigures(params.answer, params.sources)
  const numbers = figures.figures.filter((f) => f.status === 'ungrounded').map((f) => f.value)
  const campaigns = unknownCampaigns(params.answer, params.knownCampaigns)
  const faults: GroundingFault[] = []
  // 'no_figures' and 'clean' are both fine; only a reply carrying figures it
  // cannot trace is a fault.
  if (figures.verdict === 'fabricated' || figures.verdict === 'tainted') faults.push('number')
  if (campaigns.length > 0) faults.push('campaign')
  return { ok: faults.length === 0, faults, numbers, campaigns, figures }
}
