# The 12-Engine Specifications — and what the code actually holds

The owner's spec-set (NotebookLM Studio, Aug 2026) describes Entrestate as
twelve engines in three layers. The technical documents live here, next to
the code they describe; the award / jury kit (submission v16, the PDF binder,
executive Q&A v14, pitch memo v14, jury outline & script v9) stays outside
the repo — it is presentation material, not code truth.

**Why this index exists.** The owner's own words about this phase: "المشروع
مليان وكبير وضخم — التنظيم يا هيدفن حاجات مهمة يا هينظم ويطلّع المهم يبان".
A spec that says *OPERATIONS ACTIVE* about a feature the code does not have
is the most expensive kind of buried thing: it becomes a claim in a
submission the jury will read. So every claim below carries its status
**as verified against this repository on 2026-08-31** (Engine 06/07 rows updated the same day, after the build), with the file that
proves it or the absence that disproves it. Update the table when the code
moves; never the other way round.

Legend: **IMPLEMENTED** — working code, named file · **PARTIAL** — part of the
claim exists, the named part does not · **SPEC-ONLY** — no code yet ·
**MISMATCH** — the code does something different from the claim.

---

## Engine 11 — The Cash & Token Utility Engine (`engine-11-cash-v4.md`)

| Claim | Status | Evidence |
|---|---|---|
| Double-entry wallet with MINT / TRANSFER / BURN (`1 Cash = 1 AED`) | **IMPLEMENTED** | `lib/freehold/wallet.ts` (Ads Coin: treasury issue/burn, two postings per transfer, `conservationError`), tables `freehold_wallets`, `freehold_wallet_postings`, `freehold_wallet_requests`; UI `app/freehold-intelligence/finance/wallets` |
| Broker credits with confirmed top-ups | **IMPLEMENTED** | `lib/freehold/credits-db.ts`, `lib/freehold/credit-topups.ts`; tables `broker_credit_accounts`, `credit_ledger`, `credit_topup_requests` |
| Lead-by-lead marketplace ledger (`/ctrl`) | **IMPLEMENTED** | `lib/ctrl/wallet.ts` (append-only, fils, idempotent on `ref`, debit transactional with delivery), `lib/ctrl/marketplace.ts`, table `ctrl_wallet_entries` |
| One `wallet_transactions` table | **MISMATCH** | No such table. THREE ledgers exist (above). Ruling in `docs/ACCOUNT-FOUNDATION.md`: Ads Coin is the account wallet; the other two become feeders. |
| Marketplace price = cost × **1.25** (25 % arbitrage) | **IMPLEMENTED (by ruling)** | The owner chose the submission's number (2026-08-31, "اعتمد التقديم"): `lib/ctrl/pricing.ts` `DEFAULT_RULE.multiplier = 1.25`, price = round(cost × 1.25) with no clamp; the 150 AED floor prices only a lead whose cost is unmeasurable; per-tenant `fixed_fils` still wins when set. Pinned in `scripts/ctrl-marketplace-test.ts`. |
| Spend Governor halts over-CPL agent campaigns | **IMPLEMENTED** | `lib/meta/spend-authority.ts` (+ `lib/freehold/ads-machine*.ts`) |
| Surcharge & Margin Index (≈5 % AI overhead burn) | **PARTIAL** | surcharge/margin logic exists in `lib/freehold/bundle.ts`, `ads-machine-engine.ts`, `creative-explore.ts`; no "SMI" as a named index |
| "100 % subscription-free" SaaS mode | **MISMATCH (by decision)** | The owner's model (2026-08-30): each app has its own economics — tokens **or** subscription **or** included; `lib/freehold/app-store.ts` carries `plans`. Say "pay for what works, no seat fee", never "subscription-free". And never "free" (owner's word ban — `scripts/store-bridge-test.ts`). |

## Engine 12 — Contextual Chat Engine (`engine-12-contextual-chat.md`)

| Claim | Status | Evidence |
|---|---|---|
| Docked Expert chat, screen-aware | **IMPLEMENTED** | `components/freehold/expert-chat.tsx`, `app/api/freehold/expert/` |
| Role-sensitive tools/answers | **IMPLEMENTED** | `lib/freehold/coordinator-tools.ts` — `CoordinatorRole`, `OPERATORS`, `ADS_READERS`; tools role-gated server-side |
| Five named perspectives (Agent / Admin / Marketer / Accountant / Developer) | **PARTIAL** | roles exist; the five-perspective answer filter as described is not a distinct module |
| ONE chat across the product | **PARTIAL** | This engine is the *workspace* chat. The public Terminal runs a second advisor brain (`Entrestate_os` copilot — one chat across its own surfaces since OS PR #8). Organizing item: one brain, two doors. |

## Engine 07 — CRM Machine (`engine-07-crm-v6.md`)

| Claim | Status | Evidence |
|---|---|---|
| Normalization + de-duplication of inbound leads, duplicate = intent signal, silent merge | **IMPLEMENTED** (2026-08-31) | `lib/freehold/inbound-touch.ts` — `registerInboundTouch` (the second inquiry lands on the existing lead's timeline with its campaign/ad attribution), `mergeInboundDuplicate` (a second row from the Meta sync / bio link / PDF door folds into the older open lead, archived with a pointer). Doors: `app/api/leads/route.ts` (`findExistingLead` now finds lost leads too, past buyers get a fresh card), `lib/freehold/meta-lead-sync.ts`, `app/api/ai/chat/route.ts`, `app/api/freehold/public/agent/[handle]/lead/route.ts`, `app/api/pdf/project/route.ts` |
| Intent Convergence Index (ICI ≥ 0.5 → Rate 8, 15-minute neglect trigger) | **IMPLEMENTED** | `lib/freehold/intent-convergence.ts` — `ICI = 0.5·match(type) + 0.5·match(area)`, trilingual area/asset vocabulary, unknown ≠ match; `armNeglectClock` / `acknowledgeLead` / `sweepNeglectDeadlines` in `lib/freehold/lead-rate-db.ts` (`NEGLECT_WINDOW_MINUTES = 15`); the owner opening the card or logging a contact stops the clock; the cron `app/api/cron/lead-rate` (every 15 min) and the CRM list GET settle overdue clocks by redistributing to a top performer. Guard `scripts/intent-convergence-test.ts` |
| Lost lead re-engages → revived to New | **IMPLEMENTED** | `registerInboundTouch` (status → `new`, transition recorded, rate recomputed, inbox emailed) |
| Temporal Anomaly Gate (≥5 leads in 10 min → quarantine + ledger + management + redistribution on neglect-cleaning) | **IMPLEMENTED** | `lib/freehold/anomaly-gate.ts` (pure: `detectBulkStatusEvent`, `isNeglectTransition`, `BULK_STATUS_THRESHOLD = 5`, `BULK_STATUS_WINDOW_MINUTES = 10`), `evaluateActorBurst` in `lead-rate-db.ts` runs after every status write (`app/api/freehold/crm/leads/[id]/route.ts`, `app/api/leads/activity/route.ts`); `seed_quarantined_at` is honoured by `lib/freehold/lead-evidence.ts` (no quarantined lead reaches any audience); actions land in `freehold_site_authority_log` as `lead.quarantine` / `lead.redistribute` with reason `anomaly_gate`; the read-side twin that already existed is `lib/freehold/training-integrity.ts` (retrospective burst subtraction). Guard `scripts/anomaly-gate-test.ts` |
| Temporal status logs (`lead_status_history`) | **IMPLEMENTED** | table `freehold_site_lead_status_history` (lead, actor, actor_role, from, to, exact second) — insert-only, written by `recordStatusTransition` |
| Success-based lookalike-to-agent routing | **PARTIAL** | `lib/automation/distribution.ts` strategy `performance` (top closers first) is what both gates route with; `lib/freehold/visual-sales-routing.ts`, `lib/freehold/agent-router.ts` route by other rules; the per-audience `wins` query as written is not present |
| Claimed files `components/freehold/crm-table.tsx`, `app/api/freehold/leads/rate` | **IMPLEMENTED (real names)** | the CRM table is `app/freehold-intelligence/crm/page.tsx` (rows render `LeadRateBadge` from `components/freehold/lead-rate.tsx`); `app/api/freehold/leads/rate/route.ts` exists (GET the rate + ledger, POST re-evaluate / master flag) |

## Engine 06 — Lead Intelligence / Rate Engine (`engine-06-lead-rate-v6.md`)

| Claim | Status | Evidence |
|---|---|---|
| 0-to-10 Rate on every lead (1–3 inbound, 4–7 engaged, 8 open cap, 9 won, 10 master) as a control signal | **IMPLEMENTED** (2026-08-31) | `lib/freehold/lead-rate.ts` — pure `computeLeadRate`, `RATE_OPEN_CAP = 8`, `RATE_WON = 9`, `RATE_MASTER = 10`, decay one point per 14 idle days (floor 1; won/master/blocked never decay); columns `rate`, `rate_reason`, `rate_updated_at`, `rate_checked_at`, `master_lead` on `freehold_site_leads`; ledger `freehold_site_lead_rate_ledger` (every change, every ICI evaluation, with coefficients); written by `recomputeLeadRate` (`lib/freehold/lead-rate-db.ts`) from the CRM PATCH, every activity route, the calendar (viewing), the deal approval (`lib/deals.ts`) and all eight inbound doors. Guard `scripts/lead-rate-test.ts` |
| Human-in-the-loop cap: 9 and 10 never set autonomously | **IMPLEMENTED** | 9 requires a won status or an approved deal record; 10 requires `master_lead`, settable only by management through `app/api/freehold/leads/rate` (POST `masterLead`) or the CRM PATCH; pinned by the guard ("everything at once is still 8") |
| No fake ratings | **IMPLEMENTED** | a never-evaluated lead carries `rate = NULL` and renders "New"; the baseline (1–3) is computed from facts on the row (dialable phone, valid email, clean UTM, investor intent, deep read, off-hours) |
| Behaviour-based scoring inputs | **IMPLEMENTED** | `behaviour_score` ≥ 60 (a deep read, `DEEP_READ_SCORE`) lifts the inbound baseline to 3; `buyer_intent`, `click_intent` and the enquiry text (استثمار / invest / инвест…) are read in `ingestRate` |
| Rate 9 → Learning Engine → audience reseed | **IMPLEMENTED** | `lib/freehold/learning-loop.ts` — `triggerLearningLoop` fires once when the rate crosses into 9 (`recomputeLeadRate`), refreshes the seed / avoid audiences through `syncRatingAudiences` (hashed, weighted, append-only), debounced 10 minutes, receipt on the lead timeline (`learning_loop`) |
| Copy / Avoid / Unrated cohorts | **IMPLEMENTED (pre-existing)** | `lib/freehold/seed-cohort.ts` `splitCohorts`, fed by `lib/freehold/lead-evidence.ts` — now also refusing quarantined rows |
| Sorted "worst first" with badges in the CRM | **IMPLEMENTED** | `app/freehold-intelligence/crm/page.tsx` — the "worst first" rank sorts by Rate then value rating; `LeadRateBadge` on every row with the 15-minute clock; `LeadRateCard` on `app/freehold-intelligence/crm/leads/[id]/page.tsx` with the reason, the band, the master toggle (management) and the quarantine note; words in `lib/i18n/dictionaries/crm.ts` (`crm.rate.*`, three languages, families pinned in `scripts/dynamic-keys-test.ts`) |
| Rate 8 cluster → Spend Governor budget authorization | **PARTIAL** | `lib/meta/spend-authority.ts` governs spend; it does not yet read `rate` per ad set. Next: a `rate ≥ 8` count per `meta_adset_id` as an input to the authorization limit |
| Claimed file `components/freehold/crm-table.tsx` | **IMPLEMENTED (real name)** | `components/freehold/lead-rate.tsx` + the CRM page above |

## Engine 04 — Creative Intelligence Engine (`engine-04-creative-v3.md`)

| Claim | Status | Evidence |
|---|---|---|
| Trilingual Listing-to-Landing pages with layout flipping | **IMPLEMENTED** | `lib/landing-theme.ts`, `lib/landing-blocks.ts`, `lib/landing-pages.ts`, `lib/freehold/front-layout.ts`, `components/front/*`, guards `scripts/lp-*-test.ts`; i18n `lib/i18n/dictionaries/*` |
| Drag-and-drop page builder | **IMPLEMENTED** (buried) | `app/freehold-intelligence/ai-manager/builder/page.tsx` — mounted only inside the client-workspace path; surfacing it as the Web Designer app is task #90 |
| Active/idle micro-behavioral telemetry (`active_telemetry`, `idle_telemetry`, `useBehavioralTelemetry`) | **IMPLEMENTED** (2026-08-31) | Tables `freehold_site_active_telemetry` / `freehold_site_idle_telemetry`; hook `lib/freehold/use-behavioral-telemetry.ts` mounted in `app/lp/[slug]/_tracker.tsx` on the analytics session id; public door `app/api/lp-telemetry` (clamped, budgeted; on `proxy.ts` allowlist); server `lib/freehold/behavioral-telemetry.ts`. One deliberate departure from the guide: the browser never sends a leadId — rows are session-keyed and `/api/leads` makes the link server-side. Premium hovers (`payment-plan`, `roi`, ≥ 15 s) and focus-after-idle feed Engine 06's ingest rate (`ingest_intent`) and Engine 07's ICI ledger. Guard `scripts/behavioral-telemetry-test.ts` |
| OS routes `/storyboard`, `/image-playground`, `/timeline` | **RETIRED (by ruling)** | The owner, 2026-08-31: with the automation studio running fully integrated these routes are not wanted — the Terminal CONNECTS to the studio and the time-table instead ("نربط التريمنال بالأتوموشن استديو والتايم تيبل"), which is heavier for the platform than duplicating creative surfaces. The studio lives in the workspace (`app/freehold-intelligence/creative-studio`, `ai-manager`); the time-table already serves the Terminal (`Entrestate_os/app/api/time-table/*`). The connection rides the account foundation (`docs/ACCOUNT-FOUNDATION.md`, phases 2→5). |
| Spend rules `lib/meta/spend-authority.ts`, CI gauntlet `.github/workflows/ci.yml` | **IMPLEMENTED** | both exist |

## The blueprint (`system-architecture-blueprint-v14.md`)

Its header still says *Host Environment: freeholdproperty.ae* and *version
8.0.0*. That is the pre-separation framing: the client's deployment is the
client's (see `CLAUDE.md`, "THIS REPO IS NOT FREEHOLD"); Entrestate's own
hosts are `entrestate.com` (business) and `terminal.entrestate.com`
(Terminal). Read the blueprint as the intended shape of the system, and this
table as where the shape currently is.

---

## Before the jury reads the submission (v16)

Claims in `dubai-it-submission-v16.md` measured against this repository:
1. ICI, the Temporal Anomaly Gate, and the active/idle telemetry — **now
   operating** (2026-08-31, this table's Engine 04/06/07 rows, with the
   guards that pin them).
2. "25 % arbitrage markup" — **now true** (2026-08-31): the owner ruled for
   the submission's number and the default became exactly cost × 1.25
   (`lib/ctrl/pricing.ts`, guarded).
3. "100 % subscription-free" — the App Store sells apps on their own terms
   (tokens, subscription, or included).

An unexaggerated submission is the owner's own requirement; the table above
is what may be claimed today, with the file that proves each line.
