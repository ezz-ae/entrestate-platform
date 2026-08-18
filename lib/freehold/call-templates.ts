/**
 * CALL TEMPLATE LIBRARY — the words, the fields the call must come back with,
 * and the calls that are refused before the phone rings.
 *
 * This is the product behind Lead Calling. There is no UI here, no dialler and
 * no network: a call script is data, and the parts of it that can be wrong are
 * the parts a person cannot see while the line is ringing.
 *
 * Three things this file exists to stop, all of them seen on real desks:
 *
 *  1. THE CALL THAT COMES BACK WITH NOTHING. A caller talks for nine minutes,
 *     the lead is "interested", and the CRM row is unchanged — no budget, no
 *     timeline, no date. The next broker starts from zero. So every template
 *     declares its `capture` fields, and every capture field declares the
 *     column it writes to or says out loud that it is derived. A field that
 *     names a column which does not exist is a 42703 at the end of a call that
 *     went well, which is why the column list below is the real one.
 *
 *  2. THE CALL WITH NO REASON. "Hi, how are you today" is the sentence that
 *     tells a Dubai buyer they are on a list. Every opening here names the
 *     caller, names the brokerage, and gives the reason for the call in the
 *     first two sentences. If the desk has no reason — no released floor, no
 *     resale under the launch price, no promise to keep — then the answer is
 *     not a softer opening, it is no call.
 *
 *  3. THE CALL THAT SHOULD NOT HAVE HAPPENED. Outbound marketing calls in the
 *     UAE are regulated (TDRA). The gate at the bottom of this file is a
 *     COMPLIANCE GATE, not a preference: a lead with no dated consent record,
 *     or a do-not-call flag, or a hostile ending on file, cannot be dialled by
 *     any template at any hour. It is written here, before the dialler exists,
 *     because a consent check retrofitted into a working dialler is a check
 *     somebody disables on a busy Thursday. The exact statutory duties belong
 *     in the compliance file the brokerage signs; what this module guarantees
 *     is the refusal.
 *
 * NUMBERS. No script in this file contains a digit. Every price, yield, floor
 * count and payment split reaches a call through a token filled from the
 * listing record, and a number the desk cannot source is not said out loud —
 * same rule as the ad copy (lib/freehold/min-evidence.ts, and the placeholder
 * scan in scripts/ad-copy-placeholder-test.ts). A caller who invents a number
 * on the phone has made the brokerage an offer it did not agree to.
 *
 * LANGUAGE. The text here is the English master. Arabic and Russian are voiced
 * from the same structure by the voices below, and the screens render the type
 * through `labelKey` — a computed-key family, so when the Lead Calling screen
 * lands, `CALL_TYPES` must be registered in `scripts/dynamic-keys-test.ts`
 * against all three dictionaries the way `PLACEMENT_VERDICTS` is.
 *
 * Pure — no I/O, no database, no clock of its own. The instant is passed in.
 */

// ── the seven calls ─────────────────────────────────────────────────────────

/**
 * EVERY CALL TYPE, ENUMERATED.
 *
 * Same pattern, same reason as `PLACEMENT_VERDICTS` in placement-audit.ts: the
 * screen renders these through a computed key, `pnpm i18n` can only audit
 * literal `t()` calls, and a union cannot be walked at runtime. The type is
 * derived FROM this array, so a new call type cannot be added without
 * appearing here for the dictionary guard to find.
 */
export const CALL_TYPES = [
  'reengagement',
  'first_contact',
  'follow_up',
  'invitation',
  'general_interest',
  'qualification',
  'launch_announcement',
] as const

type CallTypeDoc =
  /** An old lead, dormant, with a new fact about inventory to justify the call. */
  | 'reengagement'
  /** The first human voice after an enquiry, while the ad is still in memory. */
  | 'first_contact'
  /** A promise made on the last call, kept on this one. */
  | 'follow_up'
  /** A named event at a named time — viewing day, launch morning, site visit. */
  | 'invitation'
  /** Registered for "Dubai property" and nothing narrower. */
  | 'general_interest'
  /** The money conversation, before a broker spends a Saturday. */
  | 'qualification'
  /** A release opens; the people who asked to be told are told. */
  | 'launch_announcement'

export type CallType = (typeof CALL_TYPES)[number]
// The doc-comment union above and the array must describe the same set.
type _TypesAgree = CallTypeDoc extends CallType
  ? CallType extends CallTypeDoc ? true : never
  : never
const _typesAgree: _TypesAgree = true
void _typesAgree

/**
 * The five ways a call actually goes. Not a mood scale — each one has a
 * different sentence, a different ending and a different CRM write, and a
 * caller who cannot tell them apart writes "no answer" on all five.
 */
export const CALL_BRANCHES = [
  'interested',
  'notNow',
  'wrongPerson',
  'hostile',
  'priceTooHigh',
] as const
export type CallBranch = (typeof CALL_BRANCHES)[number]

/** i18n families for the screens that will render this. Literal prefixes so a
 *  grep finds every key the code can compute. */
export const CALL_KEY_PREFIX = {
  type: 'lm.call.type.',
  branch: 'lm.call.branch.',
  refusal: 'lm.call.refusal.',
} as const

// ── what a call may write ───────────────────────────────────────────────────

/**
 * COLUMNS THAT EXIST ON `freehold_site_leads` TODAY.
 *
 * Source of truth: the CREATE TABLE and the `ADD COLUMN IF NOT EXISTS` blocks
 * in `lib/data.ts` (ensureLeadsTable), plus `value_rating`
 * (app/api/freehold/crm/leads/route.ts) and `buyer_intent`
 * (app/api/leads/route.ts) which their own routes add.
 *
 * A capture field that wants to store something not on this list must declare
 * itself derived. The alternative is discovering at the end of a good call
 * that the write was a 42703 and the answer is gone.
 */
export const LEAD_COLUMNS = [
  'name',
  'phone',
  'email',
  'status',
  'priority',
  'interest',
  'message',
  'project_slug',
  'budget_aed',
  'buyer_intent',
  'country',
  'value_rating',
  'last_contact_at',
  'snooze_until',
  'muted_until',
  'blocked',
  'archived',
  'assigned_broker_id',
  'source',
  'landing_slug',
] as const
export type LeadColumn = (typeof LEAD_COLUMNS)[number]

/**
 * The CRM pipeline vocabulary, mirroring the check constraint in lib/data.ts
 * (`freehold_leads_status_check`). A call that writes a status outside this
 * set is rejected by Postgres, so the set lives in the type.
 */
export const LEAD_STATUSES = [
  'new', 'contacted', 'qualified', 'viewing', 'negotiation', 'converted', 'closed', 'lost',
] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

/**
 * TOKENS THE DIALLER FILLS.
 *
 * A token it cannot fill is read out loud as itself — "we spoke about {project}
 * back in {when}" is the phone equivalent of an ad reading "Starting at AED
 * TBD". Anything the caller says that is not in this list is a fact the desk
 * has to have sourced, and there is no token for a price on purpose.
 */
export const SCRIPT_TOKENS = [
  '{lead}',      // the person's first name, as they gave it
  '{caller}',    // the human or voice making the call, by name
  '{brokerage}', // the brokerage, by name — never "we at the agency"
  '{project}',   // the project as it appears in our own listing record
  '{area}',      // the community, the way a Dubai buyer says it
  '{when}',      // the month, the day, or the promised time
  '{reason}',    // the fact that justifies this call — from the desk, not invented
  '{unitType}',  // one-bed, two-bed, townhouse
] as const
export type ScriptToken = (typeof SCRIPT_TOKENS)[number]

/** Where a captured answer goes when the line drops. */
export type CaptureWrite =
  /** A real column on freehold_site_leads. */
  | { readonly column: LeadColumn; readonly onlyWhenEmpty?: boolean }
  /** No column for it. The string says where it goes instead, and why. */
  | { readonly derived: string }

export interface CaptureField {
  /** Internal id — stable, used by the call summary and the tests. */
  readonly field: string
  /** The words the caller says to get it. */
  readonly question: string
  /** Required means: the call has failed its objective without this answer. */
  readonly required: boolean
  readonly writeTo: CaptureWrite
  /** Anything the writer needs to know that the write itself does not say. */
  readonly note?: string
}

/** What the CRM gets when the call ends this way. */
export interface CrmWrite {
  /** New pipeline status, or null to leave it where the desk put it. */
  readonly status: LeadStatus | null
  /** Every column this ending touches, status included. */
  readonly columns: readonly LeadColumn[]
  /** The next action, in the words a broker would read in the activity feed. */
  readonly next: string
  /** Days until this lead may be rung again; null when no call is scheduled. */
  readonly callBackInDays: number | null
  /** True when this ending closes the lead to calling for good. */
  readonly stopCalling: boolean
}

export interface BranchClose {
  /** The last thing the caller says on this branch. */
  readonly say: string
  readonly crm: CrmWrite
}

export interface CallTemplate {
  readonly id: CallType
  /** Computed-key family: CALL_KEY_PREFIX.type + id. */
  readonly labelKey: string
  /** The first two sentences. Named caller, named brokerage, the reason. */
  readonly opening: string
  /** The ONE thing this call exists to achieve. */
  readonly objective: string
  readonly capture: readonly CaptureField[]
  /** What the caller SAYS when the call turns this way. */
  readonly branches: Readonly<Record<CallBranch, string>>
  /** How the call ENDS on that branch, and what the CRM gets. */
  readonly close: Readonly<Record<CallBranch, BranchClose>>
  /** Hard cap on the call. */
  readonly maxDurationSec: number
  /** Why that cap and not another. */
  readonly why: string
  /** The recording / automated-caller disclosure, said before the first question. */
  readonly consentLine: string
}

// ── the two endings that are never a creative decision ──────────────────────

/**
 * WRONG PERSON. Identical in every template on purpose. The person on the line
 * enquired about nothing, and naming the lead or the project to them hands a
 * stranger somebody else's private business — the one mistake on this list
 * that harms a person who never dealt with us. Apologise, stop, hang up.
 *
 * `blocked` is set because the number is what we dial. Finding another number
 * for the lead is a desk job, not a redial.
 */
const WRONG_PERSON_SAY =
  "Apologies, I have the wrong number. I'll take it off our list now."

const WRONG_PERSON_CLOSE: BranchClose = {
  say: "Sorry for the interruption. Have a good day.",
  crm: {
    status: 'lost',
    columns: ['status', 'blocked', 'last_contact_at'],
    next: 'Wrong number — do not redial. The lead needs a new number before any call is queued again.',
    callBackInDays: null,
    stopCalling: true,
  },
}

/**
 * HOSTILE. Also identical everywhere, for the opposite reason: this is the
 * moment the brokerage is being judged, and there is exactly one right answer.
 * No second question, no "just before you go", no transfer to a closer. One
 * sentence, off the phone, do-not-call on the record — and the gate below then
 * refuses every later attempt on this lead, from every template.
 */
const HOSTILE_SAY =
  "Understood, I'll stop there. I'm taking you off our list now and you won't get another call from us."

const HOSTILE_CLOSE: BranchClose = {
  say: "Sorry to have bothered you. Goodbye.",
  crm: {
    status: 'lost',
    columns: ['status', 'blocked', 'last_contact_at'],
    next: 'Do-not-call set from the call. Closed to calling permanently — the consent gate refuses every later attempt.',
    callBackInDays: null,
    stopCalling: true,
  },
}

// ── the templates ───────────────────────────────────────────────────────────

const TEMPLATES: Readonly<Record<CallType, CallTemplate>> = {
  reengagement: {
    id: 'reengagement',
    labelKey: 'lm.call.type.reengagement',
    opening:
      "{lead}, it's {caller} from {brokerage} — we spoke about {project} back in {when}, and you asked me to call when something moved. Something moved: {reason}.",
    objective:
      "Find out whether this person is still buying in Dubai, and if they are, put a viewing in the diary.",
    capture: [
      {
        field: 'still_buying',
        question: "Are you still looking in Dubai, or have you bought already?",
        required: true,
        writeTo: { column: 'status' },
        note: "Bought elsewhere is 'lost' and it is a good outcome for the desk — it stops six months of calls to a person who owns a flat.",
      },
      {
        field: 'budget_band',
        question: "Is the number we talked about still your number, or has it moved?",
        required: true,
        writeTo: { column: 'budget_aed' },
        note: "Write the BOTTOM of the band the lead states, never the middle and never the top. Pipeline value is summed from this column, and a midpoint invents money that nobody said out loud.",
      },
      {
        field: 'timeline',
        question: "If the right unit came up this month, would you book it, or is this a next-year plan?",
        required: true,
        writeTo: { column: 'priority' },
        note: "This month is high priority, this quarter is normal, next year is low. The words map to the priority column; there is no timeline column.",
      },
      {
        field: 'area_interest',
        question: "Still {area}, or are you open to other buildings now?",
        required: false,
        writeTo: { column: 'interest' },
      },
      {
        field: 'viewed_elsewhere',
        question: "Have you seen anything in person since we spoke — with us or with anyone else?",
        required: false,
        writeTo: {
          derived: "No column for prior viewings. Goes in the call note, because a lead who has already viewed with another broker is a different conversation and the next caller has to read it, not sort by it.",
        },
      },
    ],
    branches: {
      interested:
        "Then let's put a day on it. I'm at the building Saturday and Sunday — which one suits you?",
      notNow:
        "Fine. I'm not going to ring you every month — give me a month that makes sense and I'll call once, then.",
      wrongPerson: WRONG_PERSON_SAY,
      hostile: HOSTILE_SAY,
      priceTooHigh:
        "That's the honest number for {project} today. At what you want to spend, the building I'd actually send you to is in {area} — do you want those, or shall I call only if a resale lands under your ceiling?",
    },
    close: {
      interested: {
        say: "I'll send the location and my number on WhatsApp now.",
        crm: {
          status: 'viewing',
          columns: ['status', 'interest', 'last_contact_at'],
          next: 'Viewing booked. Send location on WhatsApp. The confirmation call runs off the viewing date in the calendar, not off this call.',
          callBackInDays: null,
          stopCalling: false,
        },
      },
      notNow: {
        say: "Right — I'll call you in {when} and not before. My number is in your WhatsApp if something changes.",
        crm: {
          status: 'contacted',
          columns: ['status', 'snooze_until', 'last_contact_at'],
          next: 'Snoozed to the month the lead named. One call then, not a monthly drip.',
          // A quarter is the shortest gap that does not read as harassment to
          // somebody who has just said not now, and it is the fallback only —
          // a month the lead named always wins.
          callBackInDays: 90,
          stopCalling: false,
        },
      },
      wrongPerson: WRONG_PERSON_CLOSE,
      hostile: HOSTILE_CLOSE,
      priceTooHigh: {
        say: "I'll send you what exists at your number in {area}, and nothing above it.",
        crm: {
          status: 'contacted',
          columns: ['status', 'budget_aed', 'interest', 'last_contact_at'],
          next: 'Ceiling on file. Send stock at or under it only — anything above is why this lead stops answering.',
          callBackInDays: 30,
          stopCalling: false,
        },
      },
    },
    maxDurationSec: 240,
    why: "Nobody asked for this call. Four minutes covers the reason, three questions and a date; past that the caller is negotiating with a person who never agreed to a negotiation, and the recording of it reads badly.",
    consentLine:
      "Before anything else: you gave us this number when you enquired about {project}, this call is recorded, and you're speaking to an automated caller from {brokerage}. Ask for a person and I'll put you through; tell me to stop and I stop.",
  },

  first_contact: {
    id: 'first_contact',
    labelKey: 'lm.call.type.first_contact',
    opening:
      "{lead}, {caller} from {brokerage} — you asked about {project} on our site {when}. I've got the price list and the payment plan open in front of me, so this is quick and you'll know if it's worth your Saturday.",
    objective:
      "Book the viewing while the lead still remembers the ad they clicked.",
    capture: [
      {
        field: 'name_confirm',
        question: "Am I saying your name right — {lead}?",
        required: true,
        writeTo: { column: 'name' },
        note: "Forms are typed on phones. The spelling on the record is whatever the person says it is.",
      },
      {
        field: 'project',
        question: "It was {project} you were looking at — is that the one, or were you comparing a few?",
        required: true,
        writeTo: { column: 'project_slug' },
      },
      {
        field: 'budget_band',
        question: "What's the ceiling you're comfortable with for this one?",
        required: true,
        writeTo: { column: 'budget_aed' },
        note: "Bottom of the stated band, same rule as everywhere else in this file.",
      },
      {
        field: 'purpose',
        question: "Is this one to live in, or is it for the return?",
        required: true,
        writeTo: { column: 'buyer_intent', onlyWhenEmpty: true },
        note: "buyer_intent is derived from what the visitor DID on the landing page (app/api/leads/route.ts). A spoken answer fills it when it is empty and never overwrites the behavioural read — same COALESCE rule the lead route uses.",
      },
      {
        field: 'timeline',
        question: "And when are you looking to have this done by?",
        required: true,
        writeTo: { column: 'priority' },
      },
      {
        field: 'payment',
        question: "Cash, or are you taking the developer's plan?",
        required: false,
        writeTo: {
          derived: "No payment column. Goes in the call note and decides which price sheet is sent — cash and plan are different prices for the same unit, and sending the wrong one costs the meeting.",
        },
      },
      {
        field: 'reachable_on',
        question: "Is this number on WhatsApp, and is evening better than daytime for you?",
        required: false,
        writeTo: {
          derived: "No column for contact preference. Call note. It decides the hour of the next call inside the window below, never outside it.",
        },
      },
    ],
    branches: {
      interested:
        "Good. I have viewing slots the back half of the week — do you want a morning or an evening?",
      notNow:
        "No problem. Rather than chase you, tell me when this becomes real and I'll call once, then.",
      wrongPerson: WRONG_PERSON_SAY,
      hostile: HOSTILE_SAY,
      priceTooHigh:
        "Then {project} isn't your building, and I'm not going to pretend it is. Tell me your number and I'll send you what's actually available at it, in {area} or next to it.",
    },
    close: {
      interested: {
        say: "Booked. I'll send the location, my number and the floor plan on WhatsApp now.",
        crm: {
          status: 'viewing',
          columns: ['status', 'project_slug', 'budget_aed', 'buyer_intent', 'priority', 'last_contact_at'],
          next: 'Viewing booked on the first call. Send location, plan and price sheet on WhatsApp within the hour.',
          callBackInDays: null,
          stopCalling: false,
        },
      },
      notNow: {
        say: "Understood — I'll send the plan and the price sheet so you have them, and I'll leave you to it.",
        crm: {
          status: 'contacted',
          columns: ['status', 'snooze_until', 'budget_aed', 'priority', 'last_contact_at'],
          next: 'Materials sent, snoozed to the date the lead named.',
          callBackInDays: 14,
          stopCalling: false,
        },
      },
      wrongPerson: WRONG_PERSON_CLOSE,
      hostile: HOSTILE_CLOSE,
      priceTooHigh: {
        say: "I'll send three at your number today, and nothing over it.",
        crm: {
          status: 'contacted',
          columns: ['status', 'budget_aed', 'interest', 'last_contact_at'],
          next: 'Wrong project, right buyer. Requalify against stock at the stated ceiling before the next call.',
          callBackInDays: 3,
          stopCalling: false,
        },
      },
    },
    maxDurationSec: 420,
    why: "The lead enquired minutes ago and will talk, so the cap is generous — but seven minutes is where a first call stops booking a viewing and starts becoming the viewing. The unit is sold in person.",
    consentLine:
      "Quick disclosure: you asked us to call about {project} {when}, this call is recorded, and I'm {brokerage}'s automated caller. Ask for a person at any point and I'll transfer you.",
  },

  follow_up: {
    id: 'follow_up',
    labelKey: 'lm.call.type.follow_up',
    opening:
      "{lead}, {caller} from {brokerage} — I said I'd come back to you with {reason}, so here it is. I need two minutes and one decision from you.",
    objective:
      "Get the decision the last call was waiting on, and move the lead one stage either way.",
    capture: [
      {
        field: 'decision',
        question: "So where have you landed — do we go ahead, or is it a no?",
        required: true,
        writeTo: { column: 'status' },
      },
      {
        field: 'objection',
        question: "What's the part that's still holding it up?",
        required: true,
        writeTo: {
          derived: "No objection column. Call note, in the lead's own words — the paraphrase is what loses the deal on the next call.",
        },
      },
      {
        field: 'budget_change',
        question: "Is your number still where it was?",
        required: false,
        writeTo: { column: 'budget_aed' },
      },
      {
        field: 'other_agent',
        question: "Are you seeing anything with anyone else this week?",
        required: false,
        writeTo: {
          derived: "Call note. It changes the urgency of the desk's next move and it is not something to sort or score people by.",
        },
      },
    ],
    branches: {
      interested:
        "Then let's get it moving — I'll have the reservation form and the plan with you today, and I'll walk you through it on the phone.",
      notNow:
        "Fair enough. I'll stop calling about this one — tell me when to come back and that's when I'll come back.",
      wrongPerson: WRONG_PERSON_SAY,
      hostile: HOSTILE_SAY,
      priceTooHigh:
        "Then that unit is off the table and I won't push it. What's the number you'd sign at today? I'd rather work from your number than argue about theirs.",
    },
    close: {
      interested: {
        say: "I'll send the form now and call you back once you've read it.",
        crm: {
          status: 'negotiation',
          columns: ['status', 'last_contact_at'],
          next: 'Reservation form sent. Call back once the lead has read it.',
          callBackInDays: 2,
          stopCalling: false,
        },
      },
      notNow: {
        say: "Right — I'll leave it with you and call in {when}.",
        crm: {
          status: 'contacted',
          columns: ['status', 'snooze_until', 'last_contact_at'],
          next: 'Snoozed to the date the lead gave. The promise was one call, so it is one call.',
          callBackInDays: 21,
          stopCalling: false,
        },
      },
      wrongPerson: WRONG_PERSON_CLOSE,
      hostile: HOSTILE_CLOSE,
      priceTooHigh: {
        say: "Understood. I'll come back only when something lands at your number.",
        crm: {
          status: 'contacted',
          columns: ['status', 'budget_aed', 'last_contact_at'],
          next: 'Ceiling restated on the follow-up. Match against stock before ringing again.',
          callBackInDays: 30,
          stopCalling: false,
        },
      },
    },
    maxDurationSec: 300,
    why: "Everything factual was said on the previous call. Five minutes is a decision and a next step; a long follow-up is a first call being repeated, and repeating it teaches the lead the calls carry nothing new.",
    consentLine:
      "Same as last time — recorded call, automated caller from {brokerage}. Say stop and it stops.",
  },

  invitation: {
    id: 'invitation',
    labelKey: 'lm.call.type.invitation',
    opening:
      "{lead}, {caller} from {brokerage} — we're showing {project} in {area} on {when}, and I've held two slots for the people who registered early. You're one of them, so do you want the morning or the afternoon?",
    objective:
      "A named person on a named slot who will actually turn up.",
    capture: [
      {
        field: 'attending',
        question: "So can I put you down for it?",
        required: true,
        writeTo: { column: 'status' },
      },
      {
        field: 'slot',
        question: "Morning or afternoon — which works better?",
        required: true,
        writeTo: {
          derived: "The slot lives on the calendar, not on the lead row. Call note carries it so the CRM card and the diary agree.",
        },
      },
      {
        field: 'party',
        question: "Is anyone coming with you — partner, family, anyone who'll be signing?",
        required: false,
        writeTo: {
          derived: "Call note. It tells the broker how many chairs and whether the real decision maker is in the room.",
        },
      },
      {
        field: 'getting_there',
        question: "Do you know the building, or shall I send the pin and meet you at the gate?",
        required: false,
        writeTo: {
          derived: "Call note. Half the no-shows in Dubai are people who could not find the sales centre and would not call to ask.",
        },
      },
    ],
    branches: {
      interested:
        "Done, you're on the list. I'll send the pin now and I'll call you the morning of, to confirm you're still coming.",
      notNow:
        "No problem — the release doesn't wait, but I'll tell you what went and at what price after the day, so you can judge it yourself.",
      wrongPerson: WRONG_PERSON_SAY,
      hostile: HOSTILE_SAY,
      priceTooHigh:
        "Then this one isn't worth your Saturday, and I'd rather say so now. There's a launch in {area} closer to your number — shall I keep your slot for that one instead?",
    },
    close: {
      interested: {
        say: "You're booked. Pin on WhatsApp now, and I'll call the morning of.",
        crm: {
          status: 'viewing',
          columns: ['status', 'project_slug', 'last_contact_at'],
          next: 'Attending, slot named. Send the pin. Confirmation call on the morning of the event.',
          callBackInDays: null,
          stopCalling: false,
        },
      },
      notNow: {
        say: "Understood. I'll send you what sold and at what price after the day.",
        crm: {
          status: 'contacted',
          columns: ['status', 'last_contact_at'],
          next: 'Declined the event. Send the post-event result, then leave it a week before anything else.',
          callBackInDays: 7,
          stopCalling: false,
        },
      },
      wrongPerson: WRONG_PERSON_CLOSE,
      hostile: HOSTILE_CLOSE,
      priceTooHigh: {
        say: "I'll hold you for the {area} launch instead and send the details.",
        crm: {
          status: 'contacted',
          columns: ['status', 'budget_aed', 'interest', 'last_contact_at'],
          next: 'Wrong event for the budget. Move to the launch list that matches the stated ceiling.',
          callBackInDays: 14,
          stopCalling: false,
        },
      },
    },
    maxDurationSec: 180,
    why: "One question — are you coming — with a day and a time attached. Three minutes is long enough to answer it; a longer invitation call turns into a viewing over the phone, and then the person does not come.",
    consentLine:
      "Quick note: you left this number for {project} updates, this call is recorded, and I'm an automated caller from {brokerage}. Tell me to stop and I stop.",
  },

  general_interest: {
    id: 'general_interest',
    labelKey: 'lm.call.type.general_interest',
    opening:
      "{lead}, {caller} from {brokerage} — you registered with us for Dubai property but didn't name a building, so I'm calling instead of sending you a catalogue. Four questions and I'll send you a shortlist that actually fits.",
    objective:
      "Turn 'Dubai property' into a shortlist the desk can send the same day.",
    capture: [
      {
        field: 'budget_band',
        question: "What are you looking to spend — give me a range and I'll work inside it.",
        required: true,
        writeTo: { column: 'budget_aed' },
        note: "Bottom of the band. The pipeline is summed from this column.",
      },
      {
        field: 'purpose',
        question: "Is this to live in, or is it money you want working?",
        required: true,
        writeTo: { column: 'buyer_intent', onlyWhenEmpty: true },
      },
      {
        field: 'area_interest',
        question: "Which parts of Dubai do you already know — anywhere you've stayed, or somewhere you keep hearing about?",
        required: true,
        writeTo: { column: 'interest' },
      },
      {
        field: 'ready_or_offplan',
        question: "Do you want keys this year, or are you happy to wait for a handover?",
        required: true,
        writeTo: {
          derived: "No column for ready-versus-off-plan. Call note, and it halves the shortlist before anything is sent.",
        },
      },
      {
        field: 'unit_type',
        question: "And how much space — {unitType}, or bigger?",
        required: false,
        writeTo: { column: 'interest' },
        note: "Appended to interest, not overwriting it. Area and size are one sentence to a broker reading the card.",
      },
      {
        field: 'located_where',
        question: "Are you in Dubai at the moment, or calling from outside?",
        required: false,
        writeTo: { column: 'country' },
        note: "Captured for logistics only — whether a viewing is in person or on video, and which hour of the window to ring. Never used to target or to narrow an audience; that rule and its history live in lib/freehold/audience-pattern.ts.",
      },
    ],
    branches: {
      interested:
        "Good, that's enough to work with. I'll send three that fit and one that's slightly above, so you can see what the extra buys.",
      notNow:
        "Fine — I'll send the shortlist anyway so you've got a picture of the market, and I'll leave you alone until you come back to me.",
      wrongPerson: WRONG_PERSON_SAY,
      hostile: HOSTILE_SAY,
      priceTooHigh:
        "At that number in {area} there's nothing honest I can show you. There is at your number in the communities next to it, or in {area} for a smaller unit — which of those do you want to see?",
    },
    close: {
      interested: {
        say: "Shortlist with you today, and I'll call after you've had a look.",
        crm: {
          status: 'qualified',
          columns: ['status', 'budget_aed', 'buyer_intent', 'interest', 'country', 'last_contact_at'],
          next: 'Qualified from cold. Send the shortlist today, call after the lead has seen it.',
          callBackInDays: 3,
          stopCalling: false,
        },
      },
      notNow: {
        say: "I'll send the shortlist and step back.",
        crm: {
          status: 'contacted',
          columns: ['status', 'interest', 'budget_aed', 'snooze_until', 'last_contact_at'],
          next: 'Shortlist sent, no appetite for a call. Nothing further until the lead replies.',
          callBackInDays: 45,
          stopCalling: false,
        },
      },
      wrongPerson: WRONG_PERSON_CLOSE,
      hostile: HOSTILE_CLOSE,
      priceTooHigh: {
        say: "I'll send what exists at your number, in the areas next to the one you named.",
        crm: {
          status: 'contacted',
          columns: ['status', 'budget_aed', 'interest', 'last_contact_at'],
          next: 'Expectation and budget do not meet in the named area. Shortlist from the neighbouring communities instead.',
          callBackInDays: 10,
          stopCalling: false,
        },
      },
    },
    maxDurationSec: 480,
    why: "This is the call with the most to ask and the least to go on, so it gets the second-longest cap. Eight minutes is four questions with room for the answers; longer and the lead has been interviewed rather than helped.",
    consentLine:
      "Before I start: you registered on our site, this call is recorded, and you're speaking to an automated caller from {brokerage}. Ask for a person and I'll transfer you; ask me to stop and I stop.",
  },

  qualification: {
    id: 'qualification',
    labelKey: 'lm.call.type.qualification',
    opening:
      "{lead}, {caller} from {brokerage} — before I put you in front of the developer for {project}, I need to confirm three things on my side. Budget, timing, and how you're paying — then I can hold a unit for you instead of a viewing slot.",
    objective:
      "Decide whether this lead is worth a broker's Saturday, and write down the reason either way.",
    capture: [
      {
        field: 'budget_band',
        question: "What's the most you'd put into this, all in?",
        required: true,
        writeTo: { column: 'budget_aed' },
        note: "Bottom of the band. Fees and the transfer charge are not in the lead's number unless the lead says they are — ask.",
      },
      {
        field: 'timeline',
        question: "If we found the right unit this week, when could you sign?",
        required: true,
        writeTo: { column: 'priority' },
      },
      {
        field: 'payment',
        question: "Is this cash, a developer plan, or are you going to the bank?",
        required: true,
        writeTo: {
          derived: "No payment column. Call note. It decides which units are even offerable — a mortgage buyer cannot take most off-plan plans, and finding that out at the reservation desk is the expensive way.",
        },
      },
      {
        field: 'funds_ready',
        question: "And the deposit — is that sitting ready, or does it need to move from somewhere?",
        required: true,
        writeTo: {
          derived: "Call note. Money that has to arrive from another country has a timeline of its own, and it is the reason bookings collapse in the last week.",
        },
      },
      {
        field: 'decision_maker',
        question: "Is anyone else signing with you?",
        required: false,
        writeTo: {
          derived: "Call note. If the person who signs is not on this call, the qualification is provisional and the desk should know that before it clears a Saturday.",
        },
      },
      {
        field: 'value_rating',
        question: "Not asked. The caller rates the lead on the CRM's own zero-to-ten scale after hanging up.",
        required: true,
        writeTo: { column: 'value_rating' },
        note: "The rating is a human read on a call that happened, which is what the CRM audiences and the write-back to Meta are built on (lib/freehold/lead-writeback.ts). An unrated qualification call is an unfinished one.",
      },
    ],
    branches: {
      interested:
        "That all works. I'll hold a unit in your name until the end of the week and send you the plan and the payment schedule now.",
      notNow:
        "Then let's not book anything yet. Tell me the month you'd be ready and I'll come back then, with what's left.",
      wrongPerson: WRONG_PERSON_SAY,
      hostile: HOSTILE_SAY,
      priceTooHigh:
        "Then this line isn't for you and I'm not going to stretch you into it. I'd rather show you what you can buy comfortably — do you want that list?",
    },
    close: {
      interested: {
        say: "Held in your name until the end of the week. Plan and schedule on WhatsApp now.",
        crm: {
          status: 'qualified',
          columns: ['status', 'budget_aed', 'priority', 'value_rating', 'last_contact_at'],
          next: 'Qualified with money, timing and method on the record. Unit held to the end of the week — chase before it releases.',
          callBackInDays: 2,
          stopCalling: false,
        },
      },
      notNow: {
        say: "Understood. I'll come back in {when} and not before.",
        crm: {
          status: 'contacted',
          columns: ['status', 'priority', 'value_rating', 'snooze_until', 'last_contact_at'],
          next: 'Qualified but not ready. Snoozed to the month the lead named, rating on file so the desk can rank it.',
          callBackInDays: 60,
          stopCalling: false,
        },
      },
      wrongPerson: WRONG_PERSON_CLOSE,
      hostile: HOSTILE_CLOSE,
      priceTooHigh: {
        say: "I'll send the list at your number today.",
        crm: {
          status: 'contacted',
          columns: ['status', 'budget_aed', 'value_rating', 'last_contact_at'],
          next: 'Out of range for this project, in range for others. Requalify against the stated ceiling.',
          callBackInDays: 7,
          stopCalling: false,
        },
      },
    },
    maxDurationSec: 600,
    why: "The longest cap in the library, because this is the money conversation and rushing it produces answers the desk cannot rely on. Ten minutes is also the point where a qualification call has become a sales call, and the sale belongs to the broker who meets them.",
    consentLine:
      "One disclosure before we go into it: this call is recorded, I'm {brokerage}'s automated caller, and your answers go on your file with us. Ask for a person and I'll transfer you; ask me to stop and I stop.",
  },

  launch_announcement: {
    id: 'launch_announcement',
    labelKey: 'lm.call.type.launch_announcement',
    opening:
      "{lead}, {caller} from {brokerage} — {project} in {area} opens for booking on {when}, and the first release is the one where you still choose the floor and the view. You asked to be told when this came up, so this is the call.",
    objective:
      "Get the lead onto the launch list with a unit type against their name, before the release opens.",
    capture: [
      {
        field: 'wants_in',
        question: "Do you want me to put your name on it?",
        required: true,
        writeTo: { column: 'status' },
      },
      {
        field: 'unit_type',
        question: "Which size are we going for — {unitType}, or something bigger?",
        required: true,
        writeTo: { column: 'interest' },
      },
      {
        field: 'budget_band',
        question: "And the ceiling I should book inside?",
        required: true,
        writeTo: { column: 'budget_aed' },
        note: "Bottom of the band. On launch day the desk books against this number without ringing back.",
      },
      {
        field: 'deposit_ready',
        question: "Bookings are first come on the day — will you have the deposit ready that morning?",
        required: true,
        writeTo: {
          derived: "Call note. A name on the launch list without a deposit behind it is a unit held off the market for nobody.",
        },
      },
      {
        field: 'plan_preference',
        question: "Do you want the units on the longer payment plan, or the ones priced for cash?",
        required: false,
        writeTo: {
          derived: "Call note. It decides which release the name goes against — the plans are separate inventory on the day.",
        },
      },
    ],
    branches: {
      interested:
        "Right, you're on the list. I'll send the floor plans and the payment schedule today, and I'll call you the morning it opens.",
      notNow:
        "Understood. I'll take you off this one so you don't get chased about it, and I'll call you on the next launch that matches what you're after.",
      wrongPerson: WRONG_PERSON_SAY,
      hostile: HOSTILE_SAY,
      priceTooHigh:
        "Then not this release. There's a launch in {area} sitting at your number — do you want to be on that list instead of this one?",
    },
    close: {
      interested: {
        say: "You're on the list. Plans today, and I ring you the morning it opens.",
        crm: {
          status: 'qualified',
          columns: ['status', 'project_slug', 'interest', 'budget_aed', 'last_contact_at'],
          next: 'On the launch list with a unit type and a ceiling. Send plans today; call on launch morning.',
          callBackInDays: null,
          stopCalling: false,
        },
      },
      notNow: {
        say: "Off this one, then. I'll call you on the next launch that fits.",
        crm: {
          status: 'contacted',
          columns: ['status', 'interest', 'last_contact_at'],
          next: 'Declined this launch. Do not call again about this project — the next call is a different release.',
          callBackInDays: 30,
          stopCalling: false,
        },
      },
      wrongPerson: WRONG_PERSON_CLOSE,
      hostile: HOSTILE_CLOSE,
      priceTooHigh: {
        say: "I'll move you to the {area} list and send those plans instead.",
        crm: {
          status: 'contacted',
          columns: ['status', 'budget_aed', 'interest', 'last_contact_at'],
          next: 'Moved to the launch list that matches the ceiling. Nothing further about this project.',
          callBackInDays: 14,
          stopCalling: false,
        },
      },
    },
    maxDurationSec: 210,
    why: "An announcement with a yes or no on the end of it. Three and a half minutes is a fact, a unit type and a ceiling; a launch call that runs long is a qualification call wearing a launch as an excuse, and qualification has its own template and its own consent line.",
    consentLine:
      "Before I go on: you asked us to tell you when {project} opened, this call is recorded, and I'm an automated caller from {brokerage}. Say the word and I'll stop or put you to a person.",
  },
}

/** Walkable, in the order of CALL_TYPES — the array the screens and the guard read. */
export const CALL_TEMPLATES: readonly CallTemplate[] = CALL_TYPES.map((id) => TEMPLATES[id])

export function templateFor(id: CallType): CallTemplate {
  return TEMPLATES[id]
}

// ── voices ──────────────────────────────────────────────────────────────────

export type CallLanguage = 'en' | 'ar' | 'ru'

export interface Voice {
  readonly id: string
  /** Languages this voice actually holds a conversation in — not languages it
   *  can pronounce a word of. */
  readonly languages: readonly CallLanguage[]
  /** The one line that says when to use it. */
  readonly use: string
}

/**
 * FOUR VOICES, AND THE FIFTH IS A DECISION.
 *
 * A voice is not a config row. It is a recording session, a pass over all
 * seven templates in the languages it claims, and a person on the desk who can
 * tell you which calls it made when a lead complains about one. Two mediocre
 * voices cost more than one good one and buy nothing, so the type below allows
 * FOUR and no more: adding a fifth is a type error until somebody widens
 * `UpToFour`, which is the point — the discussion happens in a pull request
 * instead of in a dropdown.
 */
export const MAX_VOICES = 4

type UpToFour<T> =
  | readonly [T]
  | readonly [T, T]
  | readonly [T, T, T]
  | readonly [T, T, T, T]

const VOICE_LIST = [
  {
    id: 'sara_en',
    languages: ['en'],
    use: "The default. Gulf-neutral English, which is the English this market actually hears on the phone all day.",
  },
  {
    id: 'khalid_ar',
    languages: ['ar', 'en'],
    use: "Any lead who wrote to us in Arabic or came from an Arabic ad — and it switches to English mid-call without the voice changing, which is how the conversation really goes here.",
  },
  {
    id: 'marina_ru',
    languages: ['ru', 'en'],
    use: "Russian-language leads, same mid-call switch to English.",
  },
  {
    id: 'omar_en_ar',
    languages: ['en', 'ar'],
    use: "The second voice, for the second call: a lead who turned down Sara three months ago should not hear Sara open the re-engagement. Same script, different person on the line.",
  },
] as const satisfies UpToFour<Voice>

export const VOICES: UpToFour<Voice> = VOICE_LIST
export type VoiceId = (typeof VOICE_LIST)[number]['id']

/**
 * Pick a voice for a language, optionally avoiding one that has already been
 * used on this lead. Returns null when no voice speaks the language — the
 * caller then has a human make the call, rather than a voice reading Russian
 * out of an English mouth.
 */
export function voiceFor(language: CallLanguage, avoid?: string): Voice | null {
  const speaks = VOICES.filter((v) => v.languages.includes(language))
  return speaks.find((v) => v.id !== avoid) ?? speaks[0] ?? null
}

// ── when a call may be placed ───────────────────────────────────────────────

/** Sunday-first, matching JS `getUTCDay()` so the mapping needs no table. */
export const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
export type Weekday = (typeof WEEKDAYS)[number]

/**
 * Asia/Dubai is UTC+4 with no DST, so a fixed offset is exact all year — the
 * same fact permit-schedule.ts leans on for ad end times.
 */
export const DUBAI_OFFSET_MIN = 4 * 60

const h = (hour: number, minute = 0) => hour * 60 + minute

export interface CallWindowSegment {
  readonly fromMin: number
  readonly toMin: number
}
export interface CallWindow {
  readonly day: Weekday
  readonly segments: readonly CallWindowSegment[]
}

/**
 * PERMITTED CALLING HOURS, DUBAI LOCAL.
 *
 * Ten in the morning to eight at night, every day.
 *
 *  · Not nine: at nine a Dubai lead is in traffic or dropping children at
 *    school, and a call taken in traffic is a call that ends in ten seconds.
 *  · Not later than eight: after that it is somebody's dinner, and an
 *    automated voice at nine at night is the complaint that ends the service.
 *  · Every day including Saturday and Sunday, which are the UAE weekend and
 *    also the days viewings actually happen. A rule that bans weekend calls
 *    bans the job.
 *  · Friday has a gap over the midday prayer. It is the one real gap in the
 *    week here, and calling through it is the mistake that marks the caller as
 *    somebody who does not work in this city.
 *
 * The hours are narrower than any regulator's, deliberately, so the hours are
 * never the thing being argued about after a complaint.
 */
export const CALL_WINDOWS: readonly CallWindow[] = [
  { day: 'sun', segments: [{ fromMin: h(10), toMin: h(20) }] },
  { day: 'mon', segments: [{ fromMin: h(10), toMin: h(20) }] },
  { day: 'tue', segments: [{ fromMin: h(10), toMin: h(20) }] },
  { day: 'wed', segments: [{ fromMin: h(10), toMin: h(20) }] },
  { day: 'thu', segments: [{ fromMin: h(10), toMin: h(20) }] },
  { day: 'fri', segments: [{ fromMin: h(10), toMin: h(11, 30) }, { fromMin: h(14), toMin: h(20) }] },
  { day: 'sat', segments: [{ fromMin: h(10), toMin: h(20) }] },
]

/** The local weekday and minute-of-day in Dubai for an absolute instant. */
export function dubaiLocal(at: Date): { day: Weekday; minute: number } {
  const shifted = new Date(at.getTime() + DUBAI_OFFSET_MIN * 60_000)
  return {
    day: WEEKDAYS[shifted.getUTCDay()],
    minute: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  }
}

// ── the gate ────────────────────────────────────────────────────────────────

/**
 * EVERY REASON A CALL IS REFUSED.
 *
 * Enumerated for the same reason as the verdicts: the CRM renders the refusal
 * through a computed key, and a refusal with no words in Arabic prints its own
 * key to a broker.
 */
export const CALL_REFUSALS = [
  'doNotCall',
  'blocked',
  'archived',
  'consentMissing',
  'consentStale',
  'muted',
  'snoozed',
  'noPhone',
  'tooSoon',
  'outsideHours',
  'prayerBreak',
] as const
export type CallRefusal = (typeof CALL_REFUSALS)[number]

/**
 * A consent record older than a year is not consent to be rung today. The
 * person who ticked a box on a landing page last summer does not remember
 * doing it, and "but they opted in" is not a sentence that survives being said
 * out loud to a regulator. Past this, the desk re-permissions in writing —
 * WhatsApp or email, where there is a record — before any call is queued.
 *
 * This bites the re-engagement template hardest, which is correct: that is the
 * template pointed at the oldest leads in the database.
 */
export const CONSENT_STALE_DAYS = 365

/**
 * A lead rung twice inside a day stops answering the brokerage, not the
 * caller. Twenty hours rather than twenty-four so a daily rhythm does not
 * drift later and later through the window until it hits the evening edge.
 */
export const MIN_HOURS_BETWEEN_CALLS = 20

/**
 * What the gate needs to know about a lead. Field names are the CRM column
 * names on `freehold_site_leads` where a column exists.
 */
export interface CallableLead {
  readonly id: string
  /** freehold_site_leads.phone */
  readonly phone: string | null
  /** freehold_site_leads.blocked — set by the hostile and wrong-number endings. */
  readonly blocked?: boolean | null
  /** freehold_site_leads.archived */
  readonly archived?: boolean | null
  /** freehold_site_leads.muted_until (ISO) */
  readonly muted_until?: string | null
  /** freehold_site_leads.snooze_until (ISO) */
  readonly snooze_until?: string | null
  /** freehold_site_leads.last_contact_at (ISO) */
  readonly last_contact_at?: string | null
  /**
   * When this person agreed to be contacted, as an ISO timestamp.
   *
   * There is no such column on freehold_site_leads yet — which is exactly why
   * this is a required field of the gate's input rather than an optional one:
   * the dialler cannot be built until somebody decides where the consent
   * record lives and puts a date in it. Undefined is refused, not assumed.
   */
  readonly marketing_consent_at: string | null | undefined
  /** An explicit do-not-call, from a complaint, a request, or a hostile call. */
  readonly do_not_call?: boolean | null
}

export interface CallVerdict {
  readonly allowed: boolean
  readonly refusal: CallRefusal | null
  /** One line a broker reads on the lead card. */
  readonly sentence: string
}

export const REFUSAL_SENTENCES: Readonly<Record<CallRefusal, string>> = {
  doNotCall: 'On the do-not-call list. No template, no hour, no exception.',
  blocked: 'Blocked on the lead record — a previous call ended badly or the number is not theirs.',
  archived: 'Archived. Nobody is working this lead, so nobody calls it.',
  consentMissing: 'No dated consent record on file. Compliance gate: the call is refused until there is one.',
  consentStale: 'The consent on file is over a year old. Re-permission in writing before calling.',
  muted: 'Muted by the desk until the date on the record.',
  snoozed: 'Snoozed. The lead named a date and we said we would wait for it.',
  noPhone: 'No phone number on the record.',
  tooSoon: 'Called too recently. A second call the same day costs the number.',
  outsideHours: 'Outside calling hours in Dubai. Refused, not queued — ring inside the window.',
  prayerBreak: 'Friday prayer. Refused, not queued — ring after the break.',
}

/**
 * IS THIS LEAD CALLABLE AT ALL?
 *
 * Order matters, and it is worst-first rather than cheapest-first: a lead who
 * is both blocked and has no phone should read as blocked on the card, because
 * the missing number is a data problem somebody will try to fix and the block
 * is a decision nobody may undo by finding a second number.
 *
 * Fail-closed throughout. An unparseable date is treated as still in force,
 * and an absent consent record is treated as no consent, because every other
 * reading of "we are not sure" ends with a call being placed.
 */
export function consentGate(lead: CallableLead, now: Date): CallVerdict {
  const refuse = (r: CallRefusal): CallVerdict =>
    ({ allowed: false, refusal: r, sentence: REFUSAL_SENTENCES[r] })

  if (lead.do_not_call === true) return refuse('doNotCall')
  if (lead.blocked === true) return refuse('blocked')
  if (lead.archived === true) return refuse('archived')

  const consentAt = parseInstant(lead.marketing_consent_at)
  if (consentAt === null) return refuse('consentMissing')
  const ageDays = (now.getTime() - consentAt) / 86_400_000
  // A consent stamped in the future is a broken write, not a licence.
  if (ageDays < 0 || ageDays > CONSENT_STALE_DAYS) return refuse('consentStale')

  if (stillInForce(lead.muted_until, now)) return refuse('muted')
  if (stillInForce(lead.snooze_until, now)) return refuse('snoozed')

  if (!lead.phone || lead.phone.trim() === '') return refuse('noPhone')

  const last = parseInstant(lead.last_contact_at)
  if (last !== null && now.getTime() - last < MIN_HOURS_BETWEEN_CALLS * 3_600_000) {
    return refuse('tooSoon')
  }

  return { allowed: true, refusal: null, sentence: 'Callable.' }
}

/** Milliseconds, or null when there is no usable date. */
function parseInstant(raw: string | null | undefined): number | null {
  if (!raw) return null
  const t = Date.parse(raw)
  return Number.isFinite(t) ? t : null
}

/** A hold with an unreadable date is still a hold — see fail-closed, above. */
function stillInForce(until: string | null | undefined, now: Date): boolean {
  if (!until) return false
  const t = Date.parse(until)
  if (!Number.isFinite(t)) return true
  return t > now.getTime()
}

/**
 * Is this instant inside the calling window?
 *
 * REFUSED, NOT QUEUED. The verdict carries no retry handle and no next-open
 * timestamp on purpose. A queued call fires unattended: at best against a lead
 * who withdrew consent overnight, at worst at three in the morning after a
 * clock or timezone bug, and the person on the other end has no way of knowing
 * which of those happened. The window is a question the dialler asks again
 * when it is next awake; the hours are public in CALL_WINDOWS for any screen
 * that wants to say when it opens.
 */
export function windowVerdict(at: Date): CallVerdict {
  const { day, minute } = dubaiLocal(at)
  const window = CALL_WINDOWS.find((w) => w.day === day)
  if (!window) return { allowed: false, refusal: 'outsideHours', sentence: REFUSAL_SENTENCES.outsideHours }

  const open = window.segments.some((s) => minute >= s.fromMin && minute < s.toMin)
  if (open) return { allowed: true, refusal: null, sentence: 'Inside calling hours.' }

  // Between two segments on a Friday is the prayer break, and it deserves its
  // own words: "outside calling hours" at midday on a Friday reads like a bug.
  const inGap = window.segments.length > 1
    && minute >= window.segments[0].toMin
    && minute < window.segments[window.segments.length - 1].fromMin
  const refusal: CallRefusal = inGap ? 'prayerBreak' : 'outsideHours'
  return { allowed: false, refusal, sentence: REFUSAL_SENTENCES[refusal] }
}

export type CallPlan =
  | { readonly go: false; readonly refusal: CallRefusal; readonly sentence: string }
  | { readonly go: true; readonly template: CallTemplate; readonly maxDurationSec: number }

/**
 * THE ONE ENTRY POINT. Everything that dials goes through here.
 *
 * The gate does not take the call type, and that is deliberate: a lead who
 * cannot be called cannot be called for any reason anybody has thought of.
 * Consent is checked before the clock, because a consent refusal is permanent
 * and an hours refusal is not — the operator should see the one that matters.
 */
export function planCall(lead: CallableLead, type: CallType, at: Date): CallPlan {
  const consent = consentGate(lead, at)
  if (!consent.allowed) {
    return { go: false, refusal: consent.refusal as CallRefusal, sentence: consent.sentence }
  }
  const hours = windowVerdict(at)
  if (!hours.allowed) {
    return { go: false, refusal: hours.refusal as CallRefusal, sentence: hours.sentence }
  }
  const template = templateFor(type)
  return { go: true, template, maxDurationSec: template.maxDurationSec }
}
