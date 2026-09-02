# The award kit, verified against the code — claim by claim

The five documents in this folder are the owner's award/investor kit
(NotebookLM Studio, Aug 2026): the Dubai-it submission v16, the executive
Q&A v14, the pitch memo v14, and the jury outline & script v9. They used to
live outside the repo as "presentation material, not code truth". That
stance is retired for a better one: **the kit is versioned here, next to a
page that says exactly which of its sentences the code backs** — because a
submission the jury can check is worth more than one nobody can.

Verified against `ezz-ae/entrestate-platform` and `ezz-ae/Entrestate_os`
on **2026-09-01**, after the engine builds of 2026-08-31. Companion:
`docs/spec/README.md` (the per-engine truth table).

## What the code now backs, sentence for sentence

| Kit claim | Status | Where it lives |
|---|---|---|
| Intent Convergence Index — `ICI = 0.5·type + 0.5·area`, convergent ≥ 0.5 → Rate 8, top of queue, 15-minute neglect redistribution; scattered profiles merge silently and never escalate | **TRUE** | `lib/freehold/intent-convergence.ts`, `lib/freehold/inbound-touch.ts`, `sweepNeglectDeadlines` in `lib/freehold/lead-rate-db.ts`; guard `scripts/intent-convergence-test.ts` |
| Temporal Anomaly Gate — ≥ 5 leads by one actor in 10 minutes → seed quarantine, management ledger + alert, redistribution of neglect-cleaning | **TRUE** | `lib/freehold/anomaly-gate.ts`, `evaluateActorBurst`; read-side twin `lib/freehold/training-integrity.ts`; guard `scripts/anomaly-gate-test.ts` |
| 0-to-10 Rate as a control signal — 8 the open cap, 9 won (human act) firing the learning loop, 10 master; Copy / Avoid / Unrated cohorts to Meta | **TRUE** | `lib/freehold/lead-rate.ts`, `learning-loop.ts`, `seed-cohort.ts`, `rating-audiences.ts`; guard `scripts/lead-rate-test.ts` |
| Active/idle telemetry — `active_telemetry` + `idle_telemetry`, hover durations over premium tables, focus-after-idle as verified intent | **TRUE** (with one wording fix, below) | `lib/freehold/behavioral-telemetry.ts`, `use-behavioral-telemetry.ts`, `/api/lp-telemetry`; guard `scripts/behavioral-telemetry-test.ts` |
| Marketplace lead price = C_gen × 1.25 (25 % arbitrage) | **TRUE** (owner's ruling 2026-08-31) | `lib/ctrl/pricing.ts`; guard pins in `scripts/ctrl-marketplace-test.ts` |
| `/ctrl` lead-by-lead marketplace, masked previews, token burn on purchase, zero brand leakage | **TRUE** | `lib/ctrl/*`, guard `scripts/ctrl-marketplace-test.ts` |
| Spend Governor — the AI proposes, spend rules cap and pause | **TRUE** | `lib/meta/spend-authority.ts` (+ ads-machine gates) |
| Dual-mode wallet, `1 Cash = 1 AED`, double-entry with treasury and conservation audit | **TRUE** | `lib/freehold/wallet.ts`, `wallet-db.ts`; the account wallet `lib/account-wallet.ts` |
| Role-sensitive Expert chat on a zero-obfuscation database | **TRUE** (roles gate tools server-side; the five named "perspectives" are roles, not a separate module) | `components/freehold/expert-chat.tsx`, `lib/freehold/coordinator-tools.ts` |
| Evidence-table path `app/api/freehold/leads/rate` | **TRUE** | exists since the Engine 06 build |
| CI gauntlet — typecheck, trilingual parity, guards | **TRUE** | `.github/workflows/ci.yml`, `pnpm typecheck · i18n · guards` (120+ suites) |
| Lookalike-to-agent routing by performance | **PARTIAL** | routing by top closers exists (`lib/automation/distribution.ts` 'performance', both Engine-07 gates use it); the per-audience `wins` query as written is not present |

## The five wording fixes — APPLIED to the kit on 2026-09-02

These are no longer a to-do list. Each fix below has been made in the kit
files in this folder; the text is kept so a reader can see what changed and
why, and so the same sentence is not written again.

1. **"free" is banned on every selling surface — including this kit's own
   sentences.** Q&A Q7.1 says "completely for free" three times; the pitch
   memo says "100 % subscription-free". The owner's own word ban (بلاش
   نستخدم فري) and his app-economics ruling (each app: included / coin /
   subscription — `BillingMode` in `lib/freehold/app-store.ts`) replace
   both: *"Market discovery comes with the account. Apps carry their own
   economics — some come with the account, some run on coin, some
   subscribe. Pay for what works — no seat fee."*
2. **Idle re-focus alone does not make a Rate 8** (Q&A Q5.2 implies it
   does). What ships: focus-after-idle is a verified intent signal — it
   lifts the inbound baseline and is recorded as evidence on every ICI
   escalation. The 8 comes from convergence or the broker's own 5-star
   call. Say it that way; it is also more defensible.
3. **Name the real files.** `components/freehold/crm-table.tsx` does not
   exist; the CRM table is `app/freehold-intelligence/crm/page.tsx` with
   `components/freehold/lead-rate.tsx` rendering the Rate. The claimed
   `db-contract-nightly.yml` **does** exist — in `ezz-ae/Entrestate_os`
   (`.github/workflows/db-contract-nightly.yml`, nightly against a read-only
   branch), not in this repository, whose CI is `.github/workflows/ci.yml`.
   Cite each against the right repository. (Corrected 2026-09-02: the first
   pass of this page checked only one repository and wrongly called the file
   missing.)
4. **The commit count — the kit was right and this page was wrong.**
   Counted against GitHub on 2026-09-02: `entrestate-platform` **1,175** and
   `Entrestate_os` **236**, so **1,411 commits** across the two. The kit's
   "1,115" understates it and can simply be raised.

   The first version of this page called that figure wrong and told the owner
   to write "204" instead. That correction was produced by counting `git
   rev-list` inside **shallow clones**, which hold a truncated history and
   will answer confidently with a number that is not the history. The lesson
   is worth more than the number: a count taken from a working copy is a
   count of that working copy. Verify totals against the remote.
5. **"Cryptographic signature" → "recorded human approval."** The spend
   path requires a human decision written to the ledger; no cryptographic
   signing ships. The honest sentence is just as strong.

## What these repositories cannot verify (and that is fine)

The campaign telemetry — AED 52,944.33 / 342 leads / AED 30,000 / 175
comment leads / CPL figures / 842 live leads / the `entertainmeal`
cold-start — is the **client deployment's operational record**
(`ezz-ae/ORE` and the Meta report PDFs). It lives in the
owner's records and Meta's own exports, not in this code, and the
submission correctly cites those as its evidence. The same goes for
`app/api/freehold/leads/comment-webhook`: that route ran in the client's
runtime; it is not part of this repository, and the kit should cite it as
client-runtime evidence. AIMAS and the Investor-Score bid gate remain
DESIGN & SPEC — the submission's own evidence table already says so; the
jury outline's narration should match it.


## The kit is checked by the same guard as everything else

`scripts/docs-map-test.ts` scans these five documents on every merge and
fails the build if the banned pricing word returns to a selling sentence, if
`cryptographic signature` reappears on the spend path, or if the retired
`components/freehold/crm-table.tsx` is cited again. A verification page that
is only read is a verification page that rots; this one is executed.
