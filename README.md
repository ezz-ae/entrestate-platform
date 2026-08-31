# Entrestate — the business platform

> Internal README for the team. This is a **private** system, not an
> open-source project — the audience here is a teammate joining the codebase,
> not an external downloader.

**What it is.** The business half of Entrestate: a real-estate operating
system sold as **four products on one system** — Lead Machine, Mega Brokerage
Platform, Landing Pages (ships inside Lead Machine) and Meta for Realtors —
with **two faces on one database and one AI layer**:

- **Public storefront** — the business site (`/business/*`): products,
  pricing, the App Store, docs; plus the project catalogue, area/developer
  pages and the landing pages that capture leads.
- **The workspace** (`/freehold-intelligence/*` — a historic path name, see
  the note below) — where a brokerage runs the business: CRM & Lead 360, the
  Lead Machine (inventory → landing → ads → leads), the Expert AI, finance,
  analytics and settings.

The sibling repository `ezz-ae/Entrestate_os` is the **Terminal**
(terminal.entrestate.com) — public market discovery, the account's front
door. One account spans both (the shared `.entrestate.com` session), and the
two speak through served APIs, never copied code — the why is written in
[`docs/adr/0001-two-repositories.md`](docs/adr/0001-two-repositories.md).

**Deployment model.** One vendor deployment serves entrestate.com and every
customer instance at `{customer}.entrestate.com`, isolated schema-per-tenant
(`lib/tenancy/*`). Separately, a client company can get its **own private
white-label deployment** (own Vercel project, own Postgres, own domain) —
that playbook is [`DEPLOYMENT.md`](DEPLOYMENT.md).

**A note on names.** The `freehold` path segments (`lib/freehold/*`,
`/freehold-intelligence/*`, `/api/freehold/*`), the `freehold_site_*` table
prefixes, the `fh_session` cookie and `FH_*` env prefixes are **frozen
historic identifiers** from the deployment this platform separated from.
Users never see them; every user-visible brand string reads from
`lib/freehold/brand.ts`, whose defaults name **Entrestate**. They stay
unrenamed deliberately: a downstream deployment consumes this repository's
shape file-for-file, so a rename would break its upstream path (again:
[`docs/adr/0001-two-repositories.md`](docs/adr/0001-two-repositories.md)).
Read the root [`CLAUDE.md`](CLAUDE.md) **before your first command** — the
client/vendor separation rules live there.

---

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** (strict) · **Tailwind**
- **Neon PostgreSQL** (accessed via `lib/db.ts` `query()`; tables self-create with
  `CREATE TABLE IF NOT EXISTS` — no migration tool)
- **AI:** Google Vertex / Gemini (the Expert, ad generation, notebook, ingest)
- **Ads:** Meta Graph API + Google Ads API
- **Hosting:** Vercel · **Package manager:** pnpm · **Node 22**
- Edge request handling lives in **`proxy.ts`** (Next 16 renamed `middleware.ts` →
  `proxy.ts`) — auth gating, the public-API allowlist, and short-domain rewrites.

## Run it

```bash
pnpm install
cp .env.example .env.local   # fill in Neon + AI + ads credentials
pnpm dev                     # http://localhost:3000
```

## The verification gauntlet (run before every merge)

CI (`.github/workflows/ci.yml`, the `verify` check) runs the same four:

```bash
pnpm typecheck   # tsc --noEmit — must be clean
pnpm i18n        # EN/AR/RU parity: every used key resolves in all 3 locales
pnpm guards      # 120+ pure test suites in scripts/*-test.ts — the rulebook
pnpm build       # production build must succeed
```

`pnpm smoke` runs a lightweight end-to-end smoke pass. Every hard rule in the
codebase is restated as a runnable assertion in a guard suite; when adding a
rule, add its guard ([`CLAUDE.md`](CLAUDE.md) has the conventions).

## Repo layout

| Path | What lives there |
| --- | --- |
| `app/` | All routes — public site, `/business/*` storefront, `/freehold-intelligence/*` workspace, `/ctrl/*` control plane, and `app/api/*` route handlers |
| `components/` | Shared React components (`components/freehold/*` is the workspace UI) |
| `lib/` | Server + shared logic — `lib/db.ts`, `lib/freehold/*` (domain), `lib/ctrl/*` (marketplace), `lib/meta/*`, `lib/google/*`, `lib/tenancy/*`, `lib/i18n/*` |
| `src/features/` | Feature modules (e.g. inventory intelligence) |
| `hooks/`, `styles/`, `types/`, `public/` | Hooks, global styles, shared types, static assets |
| `scripts/` | The guard suites (`*-test.ts`), `i18n-audit.ts`, `smoke.ts`, and data/marketing agents |
| `docs/` | Living documentation — start at the map, [`docs/README.md`](docs/README.md); `docs/archive/` holds completed/historical plans |

## Key domains (where to look)

- **The account** — one identity → one business account → one wallet → app
  economics: [`docs/ACCOUNT-FOUNDATION.md`](docs/ACCOUNT-FOUNDATION.md);
  `lib/terminal-account.ts`, `lib/account-wallet.ts`, `lib/freehold/app-store.ts`.
- **The Expert** — the docked, screen-aware AI (open with the gold button or
  **Cmd/Ctrl-J**). UI: `components/freehold/expert-chat.tsx`; server:
  `app/api/freehold/expert/*`; tools: `lib/freehold/coordinator-tools.ts`.
- **Lead Machine / Ads** — `app/freehold-intelligence/ads` (hub), `.../lead-machine/*`.
  The Machine (live optimiser + gated actions) is `.../campaigns/optimize`.
- **Spend Governor** — the deterministic autonomous-spend rule engine:
  `lib/meta/spend-authority.ts` (+ `spend-rules.ts`, `app/api/freehold/ads/spend-rules`).
- **CRM & Lead 360** — `app/freehold-intelligence/crm/*`, `lib/deals.ts`; the
  0–10 lead Rate and its gates: `lib/freehold/lead-rate.ts`,
  `intent-convergence.ts`, `anomaly-gate.ts`, `behavioral-telemetry.ts`.
- **The lead marketplace** — `/ctrl/*` control plane and the client portal:
  `lib/ctrl/*` (pricing carries the 25 % margin rule).
- **Connect AI (MCP)** — drive the system from your own Claude/GPT/Gemini:
  `app/api/mcp/route.ts`, `lib/freehold/api-tokens.ts`, settings → Connect AI.
- **i18n** — `lib/i18n/dictionaries/*`; every user-facing string is a key,
  enforced trilingual by `pnpm i18n`.

## House rules (non-negotiable)

- **No fake data.** Surfaces show real DB data or an honest empty state — never
  invented numbers, statuses, or "connected" badges.
- **Numbers are evidence-gated.** A user-facing number is the bound facing its
  threshold or a stated Withheld — never a bare point estimate
  (`lib/freehold/min-evidence.ts`).
- **The word ban.** Selling surfaces never say the F-word of pricing (بلاش
  نستخدم فري) — each app states its own economics: comes with the account,
  runs on coin, or subscribes (`BillingMode` in `lib/freehold/app-store.ts`).
- **Trilingual.** New user-facing text is an i18n key present in EN/AR/RU; RTL-safe.
- **Honest AI boundaries.** The AI proposes; a human applies. Money-moving and
  external writes are gated (roles + the Spend Governor) and logged.
- **Verify before merge.** typecheck + i18n + guards + build must pass.

## Docs

- **[`docs/README.md`](docs/README.md)** — the documentation map: where truth
  lives, in order.
- **[`CLAUDE.md`](CLAUDE.md)** — working conventions and the client/vendor
  separation rules. Read first.
- **[`DEPLOYMENT.md`](DEPLOYMENT.md)** — private white-label deployment playbook.
- **[`CHANGELOG.md`](CHANGELOG.md)** — client-facing feature history (mirrors the
  in-app *What's new*).
