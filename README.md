# Entrestate Intelligence OS

Decision infrastructure for real estate operators. This repo powers the Entrestate platform, now refactored into the Intelligence OS: market intelligence, Time Table compiler, decision object factory, and automation studio.

## Vision

Entrestate is not a dashboard or a marketing tool; it is **decision infrastructure** for real-estate operators. Its goal is to become the default operating substrate for real-estate intelligence by hiding data complexity and exposing only the outcomes that matter - reports, memos, contracts and deployable content.

## Core Architecture (The Decision Tunnel)

Entrestate guides every user through a *Decision Tunnel* with four stages:

| Stage        | Purpose | Key Concepts |
|--------------|---------|-------------|
| **Intent**   | Translate a natural-language goal into a structured `TableSpec` (scope, time grain, signals) that defines what data to pull from the "Data Universe". | Each user query is analysed to extract hidden parameters such as budget, location, property type, status and priority. |
| **Evidence** | Collect the relevant records from the canonical graph of transactions, pipelines and pricing. Apply a strict **Exclusion Policy** to filter out distressed sales, internal transfers, duplicates and incomplete projects. | This data hygiene ensures that only high-integrity inputs feed the investment model. |
| **Judgment** | Apply the user's personal **Decision Lens** to rank candidates. A **Match Score** is calculated using a 65/35 weighting: 65 % Market Score (the asset's objective quality within the market) and 35 % Match Score (how well it fits the user's risk/return profile and time horizon). | Profiles range from conservative (safety & capital preservation) to balanced (yield optimisation). |
| **Action**   | Generate branded, shareable **Decision Objects** based on the evaluated table. These include ready reports, PDF memos, presentation decks and web widgets. Each artifact is accompanied by an **Evidence Drawer** listing sources, filters and assumptions. | The final outputs enable the user to communicate the decision with full transparency and defend it before stakeholders. |

## What's inside (New Structure)
- **Time Table**: The atomic unit of intelligence. Buildable, saveable, refreshable, exportable, embeddable, auditable.
- **TableSpec Compiler**: Converts user intent (chat or golden path) into a deterministic `TableSpec` JSON.
- **Decision Objects**: Reports, presentations, memos, widgets, contracts, and automations, all grounded on a `TimeTable`.
- **Automation Studio**: Workflow builder (formerly Agent Builder) with persistent state.
- **Profile Intelligence**: Learns user preferences and provides explicit suggestions.
- **API Endpoints**: `/api/timetables`, `/api/artifacts`, `/api/profile`, `/api/automations` for programmatic access.

## Key Routes
- `/` — Homepage with Chat, Search, Map entry points and Golden Path buttons.
- `/chat` — Notebook OS interface for intent-driven Time Table generation.
- `/search` — Structured data builder for analysts.
- `/map` — Geospatial visualization of market data.
- `/t/:id` — Individual Time Table page with Table/Chart/Presentation views and actions.
- `/automations` — Automation Studio landing page.

## Tech stack
- Next.js (App Router)
- Tailwind CSS v4
- TypeScript
- Prisma (raw SQL via `prisma.$queryRaw`)
- Neon Postgres

## Getting started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Testing the TableSpec compiler

```bash
pnpm test -- tablespec-compiler.test.ts
```

Run the full suite with:

```bash
pnpm test
```

## Environment variables

Create `.env.local` with:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
NEON_AUTH_BASE_URL=https://your-neon-auth-url.neon.tech
NEON_AUTH_COOKIE_SECRET=your-secret-at-least-32-characters-long
NEON_AUTH_ADMIN_EMAILS=admin@entrestate.com,ops@entrestate.com
NEXT_PUBLIC_ADMIN_MODE=false
NEXT_PUBLIC_ENABLE_AUTOMATION_BUILDER=false
UPSTASH_REDIS_REST_URL=https://your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
TABLESPEC_LLM_ENABLED=false
TABLESPEC_LLM_MODEL=openai/gpt-4o-mini
MEDIA_TEXT_MODEL=google/gemini-2.5-flash
MEDIA_VISION_MODEL=google/gemini-3-pro-image
DATA_SCIENTIST_LLM_MODEL=openai/gpt-4o-mini
KOBOLDAI_BASE_URL=http://localhost:5001
KOBOLDAI_CHAT_URL=
KOBOLDAI_API_KEY=
KOBOLDAI_AUTH_HEADER=Authorization
KOBOLDAI_AUTH_PREFIX=Bearer
KOBOLDAI_MODEL=
```

- `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are required for Neon-backed features.
- `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` enable Neon Auth session handling.
- `NEON_AUTH_ADMIN_EMAILS` is optional for server-side admin gating.
- `NEXT_PUBLIC_ADMIN_MODE=true` enables override controls on Market Score and Automation Runtime (non-production only).
- `NEXT_PUBLIC_ENABLE_AUTOMATION_BUILDER=true` enables Automation Builder routes in production.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` enable shared rate limiting (optional but recommended).
- `TABLESPEC_LLM_ENABLED=true` enables the LLM-backed TableSpec compiler (optional).
- `TABLESPEC_LLM_MODEL` overrides the default LLM model for TableSpec compilation (e.g. `huggingface/moonshotai/Kimi-K2.5`).
- `MEDIA_TEXT_MODEL` overrides the prompt enhancement model for Media Creator text tasks (e.g. `huggingface/zai-org/GLM-4.7-Flash`).
- `MEDIA_VISION_MODEL` overrides the vision-capable model for storyboard analysis and prompt extraction.
- `DATA_SCIENTIST_LLM_MODEL` overrides the fallback model used for data-scientist insights when KoboldAI is not configured.
- `KOBOLDAI_BASE_URL` points to your KoboldAI host (uses `/api/chat` by default).
- `KOBOLDAI_CHAT_URL` overrides the full KoboldAI chat endpoint URL.
- `KOBOLDAI_API_KEY` enables authenticated KoboldAI calls if required.
- `KOBOLDAI_AUTH_HEADER` and `KOBOLDAI_AUTH_PREFIX` control the auth header format.
- `KOBOLDAI_MODEL` optionally pins a KoboldAI model name.

## Key routes

### Platform
- `/markets` — live inventory search
- `/top-data` — curated signals + live chat
- `/library` — research library
- `/workspace` — data + decision tools
- `/os` — Decision OS cockpit (preview)
- `/market-score` — scoring validation
- `/automation-runtime` — investor match desk

### Media Creator
- `/automations` — studio landing
- `/storyboard` — storyboard builder
- `/image-playground` — visual builder
- `/timeline` — video timeline

### Apps
- `/apps` — app catalog
- `/apps/automation-builder` — Automation‑First Builder
- `/apps/lead-automation` — Insta DM lead automation kit
- `/apps/coldcalling` — cold calling workflows

## Data map
- `docs/neon-data-map.md` — data tables, functions, and usage map
- `site-map.md` — full route catalog + implementation status

## Decision OS (experimental)
- `/os` — Decision OS cockpit (TableSpec + Time Table)
- `/api/time-table/compile` — compile a TableSpec from intent or golden path
- `/api/time-table/preview` — preview a Time Table with sample rows
- `/api/time-table/summary` — generate notebook narrative highlights
- `/api/time-table/artifacts` — generate reports, decks, social posts, offers, investment plans, brochures, widgets
- `/api/time-table/underwrite` — underwriting report + PDF artifact

The `/os` notebook UI simulates a free tier 30-row cap; switch the plan selector to test larger limits.

## Documentation
- `docs/decision-infrastructure/README.md` — canonical docs map for the full Decision Infrastructure
- `docs/decision-infrastructure/decision-tunnel.md` — Stage 1–4 workflow deep-dive
- `docs/decision-infrastructure/evidence-stack-hierarchy.md` — L1–L5 evidence model and trust boundaries
- `docs/decision-infrastructure/market-scoring-signals.md` — scoring signal definitions and governance
- `docs/decision-infrastructure/broker-dashboard-features.md` — broker-facing intelligence features
- `docs/decision-infrastructure/core-data-objects.md` — core data contracts (Time Table, TableSpec, Decision Objects, Profile Intelligence)
- `docs/platform-summary.md` — high-level platform overview
- `docs/build-final.md` — complete blueprint and build plan
- `docs/blueprint-summary.md` — consolidated blueprint and architecture
- `docs/decision-engine-summary.md` — Decision Tunnel and scoring logic
- `docs/profile-intelligence.md` — profile-driven personalization spec
- `docs/update-plan.md` — update plan from the latest feedback round
- `docs/codex-prompt.md` — Codex prompt for scaffolding

## Notes
- Price fields are **DOUBLE PRECISION** end‑to‑end.
- Override flows are logged to `investor_override_audit`.
- Automation Builder audio/embedding/structured output nodes run in **preview** mode.

## CI
- DB contract tests run via `.github/workflows/db-contract-nightly.yml`.
- Set `NEON_READONLY_URL` as a GitHub Actions secret for the nightly run.
- Apply `prisma/sql/2026-03-08_intelligence_distribution_finalize.sql` before expecting the nightly DB contract to pass on provenance, attribution, and unit-sample objects.
- `FINALIZATION.md` is the stable root handoff file; the full notebook-exported checklist lives in `lib/FINALIZATION (3).md`.
- See `docs/smoke-finalization-guide.md` for the hardened preview smoke and promotion workflow that protects production SSO.

## License
- Proprietary. See `LICENSE.md` and `NOTICE.md`.
