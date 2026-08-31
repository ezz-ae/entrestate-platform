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
**as verified against this repository on 2026-08-31**, with the file that
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
| Marketplace price = cost × **1.25** (25 % arbitrage) | **MISMATCH** | `lib/ctrl/pricing.ts`: `DEFAULT_RULE = { multiplier: 1.5, floorFils: 15000 }` — 50 % with a 150 AED floor, or a per-tenant `fixed_fils`. The submission's "25 %" is not what ships. |
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
| Normalization + de-duplication of inbound leads | **PARTIAL** | Meta leads deduped by `meta_lead_id` (`lib/freehold/meta-lead-sync.ts`); phone/email normalization in `lib/freehold/lead-import.ts`; no cross-channel "duplicate = intent signal" merge |
| Intent Convergence Index (ICI ≥ 0.5 → Rate 8, 15-minute neglect trigger) | **SPEC-ONLY** | no ICI anywhere in code |
| Temporal Anomaly Gate (>5 status changes in <10 min → quarantine + redistribution) | **SPEC-ONLY** | no `lead_status_history`, no anomaly detector |
| Success-based lookalike-to-agent routing | **PARTIAL** | `lib/freehold/visual-sales-routing.ts`, `lib/freehold/agent-router.ts` route; the `wins`-per-audience query as written is not present |
| Claimed files `components/freehold/crm-table.tsx`, `app/api/freehold/leads/rate` | **MISSING** | neither path exists (`lib/deals.ts` does) |

## Engine 06 — Lead Intelligence / Rate Engine (`engine-06-lead-rate-v6.md`)

| Claim | Status | Evidence |
|---|---|---|
| 0-to-10 decimal Rate on every lead (1–8 open, 9 won, 10 master) as a control signal | **SPEC-ONLY** | the lead pipeline in code is a status set (`new · contacted · qualified · viewing · negotiation · won · lost`, e.g. `lib/freehold/lead-import.ts`, `lib/deals.ts`); no numeric rate field, no 1–5-star slider, no `interaction_logs` table |
| Behaviour-based scoring inputs | **PARTIAL** | `lib/freehold/behaviour-score.ts` scores behaviour; it does not write a rate |
| Rate 9 → Learning Engine → audience reseed | **SPEC-ONLY** | no won-deal trigger into audience seeds; `lib/meta/spend-authority.ts` and `lib/google/` exist but do not reseed on a rate transition |
| Claimed file `components/freehold/crm-table.tsx` | **MISSING** | (same absence as Engine 07) |

## Engine 04 — Creative Intelligence Engine (`engine-04-creative-v3.md`)

| Claim | Status | Evidence |
|---|---|---|
| Trilingual Listing-to-Landing pages with layout flipping | **IMPLEMENTED** | `lib/landing-theme.ts`, `lib/landing-blocks.ts`, `lib/landing-pages.ts`, `lib/freehold/front-layout.ts`, `components/front/*`, guards `scripts/lp-*-test.ts`; i18n `lib/i18n/dictionaries/*` |
| Drag-and-drop page builder | **IMPLEMENTED** (buried) | `app/freehold-intelligence/ai-manager/builder/page.tsx` — mounted only inside the client-workspace path; surfacing it as the Web Designer app is task #90 |
| Active/idle micro-behavioral telemetry (`active_telemetry`, `idle_telemetry`, `useBehavioralTelemetry`) | **SPEC-ONLY** | `telemetry-implementation-guide.md` is paste-ready code; nothing of it is in the repo |
| OS routes `/storyboard`, `/image-playground`, `/timeline` | **MISSING** | not in `Entrestate_os/app`; `/api/time-table/artifacts` exists |
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

Claims in `dubai-it-submission-v16.md` that this table contradicts today:
1. ICI, Temporal Anomaly Gates, and the active/idle telemetry tables are
   presented as operating features — they are spec-only.
2. "25 % arbitrage markup" — the shipping default is 50 % over cost with a
   150 AED floor, per-tenant configurable.
3. "100 % subscription-free" — the App Store sells apps on their own terms
   (tokens, subscription, or included).

Either build them (ICI and the anomaly gate are two focused modules; the
telemetry guide is ready code) or soften the words. An unexaggerated
submission is the owner's own requirement.
