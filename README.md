# Entrestate — the business platform

A real-estate operating system for Dubai brokerages: inventory, landing pages,
advertising, lead intelligence, CRM and money, as one system on one database.

**This is not open-source software and it is not installable.** There are no
setup instructions here by design. Entrestate is a commercial product; access
is by account at [entrestate.com](https://entrestate.com), and each client
company runs on its own isolated deployment provisioned by us. This repository
is public for one reason: so that every claim the product makes about itself
can be checked against the code that implements it. Read it as a
specification with its evidence attached.

---

## What the system is for

A brokerage's revenue passes through a chain — stock, page, campaign, lead,
call, viewing, deal — and at every link the numbers it acts on are usually
somebody's estimate. Which campaign produced the sale, whether this lead is
worth calling first, whether the cost-per-lead figure survives its own sample
size: these are normally answered by opinion and reported with confidence.

Entrestate's premise is that the chain should be one system in which **every
number carries its evidence and every rule is enforced by a test**. Three
consequences, and they are the product:

1. **Lead quality becomes a control signal, not an opinion.** Every lead
   carries a 0–10 Rate derived from what it did, what the broker did, and what
   the deal did — and the machine acts on it: routing, escalation,
   redistribution, and which audiences go back to Meta.
2. **Autonomous spend is governed, not trusted.** The AI proposes; a
   deterministic rule engine caps and pauses; a human decision is written to a
   ledger before money moves.
3. **A published number is defensible.** Numbers shown to users are the bound
   facing their threshold, or a stated *Withheld* — never a bare point
   estimate that a sample of four can produce.

Structurally that is two faces on one database and one AI layer: the public
storefront and landing pages that capture leads, and the workspace where the
brokerage runs the business. It is sold as four products on one system — Lead
Machine, Mega Brokerage Platform, Landing Pages and Meta for Realtors.

*The commercial argument — who this is for, how it is paid for, and where it
is going — is [`COMMERCIAL-VISION.md`](COMMERCIAL-VISION.md), deliberately
kept out of this file. Nothing there describes shipped code; this file and
the truth table do.*

## Specifications, and what the code actually holds

Every capability below carries a **status**, using the same legend as the
per-engine truth table in [`docs/spec/README.md`](docs/spec/README.md) — one
vocabulary across this repository, so a reader never has to reconcile two:

**IMPLEMENTED** — working code, named file, held by a guard ·
**PARTIAL** — part of the claim exists, a named part does not ·
**SPEC-ONLY** — specified, no code yet ·
**CLIENT-RUNTIME** — evidence exists in a client's live deployment, not in
this repository.

A table with nothing but green would be the least trustworthy thing on this
page. The rows that are not green are the reason the rest can be believed.

| Capability | Status | What it does | Implementation |
| --- | --- | --- | --- |
| **Lead Rate (0–10)** | IMPLEMENTED | One control signal per lead. 0 blocked · 1–3 by ingest quality and intent · 4–7 by status and work done · 8 the open cap · 9 won, a human act that fires the learning loop · 10 master. Idle decay with a floor. | `lib/freehold/lead-rate.ts`, `lead-rate-db.ts`; guard `scripts/lead-rate-test.ts` |
| **Intent Convergence** | IMPLEMENTED | A second inquiry is read for what it means: `ICI = 0.5·type + 0.5·area` over ~50 areas in three languages. Convergent profiles escalate; scattered ones merge silently and never escalate. | `lib/freehold/intent-convergence.ts`, `inbound-touch.ts`; guard `scripts/intent-convergence-test.ts` |
| **Neglect gate** | IMPLEMENTED | An escalated lead unacknowledged within 15 minutes is redistributed by performance, with the reason written to the authority log. | `sweepNeglectDeadlines` in `lib/freehold/lead-rate-db.ts` |
| **Temporal Anomaly Gate** | IMPLEMENTED | Five or more leads moved by one actor inside ten minutes is queue-cleaning, not work: the seeds are quarantined out of every training audience, management is alerted, and the leads are redistributed. | `lib/freehold/anomaly-gate.ts`; guard `scripts/anomaly-gate-test.ts` |
| **Behavioural telemetry** | IMPLEMENTED | Hover duration over payment plans and ROI tables, scroll depth, the silence clock, focus-after-idle — as verified intent. Rows are session-keyed; **the browser can never name a lead**, the link is made server-side. | `lib/freehold/behavioral-telemetry.ts`, `/api/lp-telemetry`; guard `scripts/behavioral-telemetry-test.ts` |
| **Spend Governor** | IMPLEMENTED | Deterministic caps and pauses over autonomous ad spend. The AI proposes; the rules decide; a **recorded human approval** gates the write. (No cryptographic signing ships — the ledger entry is the control.) | `lib/meta/spend-authority.ts` |
| **Ads Coin wallet** | IMPLEMENTED | Double-entry ledger, `1 Cash = 1 AED`, equal-and-opposite postings, issue and burn only through the treasury, conservation audited. One wallet per account. | `lib/freehold/wallet.ts`, `lib/account-wallet.ts` |
| **Lead marketplace** | IMPLEMENTED | Lead-by-lead sale with masked previews and no brand leakage. Price is our measured cost × 1.25 — a 25 % margin, frozen onto each lead at arrival. | `lib/ctrl/*`; guard `scripts/ctrl-marketplace-test.ts` |
| **App economics** | IMPLEMENTED | Every app states how it is paid for — comes with the account, runs on coin, or subscribes — and which apps it ships inside or installs onto. A dangling reference fails the build. | `lib/freehold/app-store.ts` |
| **One account across both products** | IMPLEMENTED | One identity (the Terminal sign-in on the shared `.entrestate.com` session) → one business account → one wallet → app installs, rendered on both products through a served API. | [`docs/ACCOUNT-FOUNDATION.md`](docs/ACCOUNT-FOUNDATION.md) |
| **Role-gated AI** | IMPLEMENTED | One docked Expert, screen-aware, with tools gated server-side by role over a database with no obfuscation layer. | `components/freehold/expert-chat.tsx`, `lib/freehold/coordinator-tools.ts` |
| **Trilingual by construction** | IMPLEMENTED | Every user-facing string is a key present in English, العربية and Русский, RTL-safe. Parity is a build gate, not a translation backlog. | `lib/i18n/dictionaries/*`, `pnpm i18n` |
| **Lookalike-to-agent routing** | **PARTIAL** | Routing by top closers exists and both Engine-07 gates use it. The per-audience `wins` query described in the specification is **not** present. | `lib/automation/distribution.ts` (`performance`) |
| **Google Ads search machine** | **PARTIAL** | Keyword planning, theme grouping, search harvesting and the Ads API client exist. Fully autonomous compile-and-bid from live query intent is **not** what ships today. | `lib/google/keyword-plan.ts`, `search-harvest.ts`, `client.ts` |
| **AIMAS — commission-yield bid arbitrage** | **SPEC-ONLY** | A dynamic max-CPC ceiling derived from the matched asset's expected commission, blocking bids above the margin. Designed and specified; **no code in this repository.** | — |
| **Campaign performance record** | **CLIENT-RUNTIME** | Live spend, CPL and lead-volume figures quoted in investor material are a client deployment's operational record, held in their systems and Meta's exports — not in this code. | see [`docs/award/README.md`](docs/award/README.md) |

The sibling repository [`ezz-ae/Entrestate_os`](https://github.com/ezz-ae/Entrestate_os)
is the **Terminal** — public market discovery, the account's front door. One
account spans both; they speak through served APIs, never copied code. The
reasoning is [`docs/adr/0001-two-repositories.md`](docs/adr/0001-two-repositories.md).

## How correctness is enforced

The unusual part of this codebase is not a feature; it is that **the rules are
executable**. Every prohibition, threshold and hardcoded list states its reason
in the adjacent comment, and restates it as a runnable assertion. 120+ pure
suites in `scripts/*-test.ts` run on every merge, alongside a strict
typecheck, trilingual parity and a production build:

```
pnpm typecheck · pnpm i18n · pnpm guards · pnpm build
```

Examples of rules that exist as tests rather than as intentions: a browser may
never write a lead identifier; targeting narrows by language and behaviour and
never by nationality; coin moves only through the finance screen's approval
path; the marketplace margin is exactly 1.25; a catalog entry that references a
product that does not exist fails CI; the database refuses to start against a
deployment that did not claim it.

Two guards are worth naming because they answer real incidents:
`lib/tenancy/db-owner.ts` refuses to run against a populated database another
deployment claimed, and `scripts/db-owner-test.ts` asserts the wiring rather
than the decision — the module decided correctly for weeks while nothing called
it, and a lock nobody turns is a comment.

## Verifying a claim

| Question | Where it is answered |
| --- | --- |
| Does the code do what the specification says? | [`docs/spec/README.md`](docs/spec/README.md) — every claim with its status and the file that proves or disproves it |
| Do the award/investor materials hold up? | [`docs/award/README.md`](docs/award/README.md) — the kit verified claim by claim, including the wording it still gets wrong |
| How does one account span two products? | [`docs/ACCOUNT-FOUNDATION.md`](docs/ACCOUNT-FOUNDATION.md) |
| What does a number on an advertising screen mean? | [`docs/ADS-RULES.md`](docs/ADS-RULES.md) |
| Who can see and do what? | [`docs/ACCESS-MATRIX.md`](docs/ACCESS-MATRIX.md), [`docs/route-auth-matrix.md`](docs/route-auth-matrix.md) |
| Everything else | [`docs/README.md`](docs/README.md) — the documentation map |

## Where the code lives

| Path | What is there |
| --- | --- |
| `app/` | Routes — the `/business/*` storefront, the workspace, the `/ctrl/*` control plane, and `app/api/*` handlers |
| `lib/` | `lib/freehold/*` (domain), `lib/ctrl/*` (marketplace), `lib/meta/*`, `lib/google/*`, `lib/tenancy/*`, `lib/i18n/*` |
| `components/` | Shared UI; `components/freehold/*` is the workspace |
| `scripts/` | The guard suites — the rulebook as code |
| `docs/` | Specifications, decision records, operator documentation |

**A note on names.** The `freehold` path segments (`lib/freehold/*`,
`/freehold-intelligence/*`, `/api/freehold/*`), the `freehold_site_*` table
prefixes and the `FH_*` env prefixes are frozen historic identifiers from the
deployment this platform separated from. Users never see them; every
user-visible brand string reads from `lib/freehold/brand.ts`, whose defaults
name **Entrestate**. They stay unrenamed deliberately — a downstream
deployment consumes this repository's shape file-for-file, and renaming would
break its upstream path.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind · Neon
PostgreSQL · Google Vertex/Gemini · Meta Graph and Google Ads APIs · Vercel.
Edge handling — auth gating, the public-API allowlist, tenant host routing —
is in `proxy.ts`.

## Ownership

Proprietary. All rights reserved. Public visibility of this repository is for
review and verification; it grants no licence to use, copy, deploy or derive
from this software.
