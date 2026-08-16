# Neon Data Map

This is a concise map of the Neon schema used by the app today. It focuses on the live tables, views, and functions we call, plus the API routes and UI surfaces that consume them.

## Connection
- **Prisma client:** `lib/prisma.ts`
- **Env:** `DATABASE_URL` in `.env.local`
- **Query style:** raw SQL via `prisma.$queryRaw` (no schema changes here)

## High-level data flow
```text
Neon
  ├─ agent_inventory_view_v1  ─┬─ /api/markets            ─→ /markets
  │                            ├─ /api/market-score/*     ─→ /market-score
  │                            └─ /api/agent-runtime/run  ─→ /agent-runtime
  ├─ market_scores_v1          ─┘ (joined inside agent_inventory_view_v1)
  ├─ agent_inventory_for_investor_v1 ─→ /api/market-score/* + /api/agent-runtime/run
  ├─ agent_ranked_for_investor_v1    ─→ /api/market-score/* + /api/agent-runtime/run
  ├─ compute_match_score             ─→ /api/agent-runtime/run (override ranking)
  ├─ generate_override_disclosure    ─→ /api/*/override-disclosure
  ├─ investor_override_audit          ─→ /api/*/override
  ├─ system_healthcheck               ─→ /api/market-score/healthcheck
  ├─ entrestate_master                ─→ /api/daas + /api/data-scientist/dataset/entrestate
  ├─ assistant_reports                ─→ /api/reports/generate + /api/reports/[id]/download
  └─ media_enrichment                 ─→ /api/seq/project-library → /agents (Media Creator)
```

## Tables / Views / Functions

### Inventory + scoring spine
- **market_scores_v1** (table)
  - Deterministic scoring per asset: `score_0_100`, `classification`, `safety_band`, `roi_band`, `timeline_risk_band`, `liquidity_band`, `drivers`, `reason_codes`, `risk_flags`.
  - Not queried directly in the app; used through `agent_inventory_view_v1`.

- **agent_inventory_view_v1** (view)
  - Joined inventory + scoring.
  - Used by:
    - `app/api/markets/route.ts` (live markets search)
    - `lib/market-score/queries.ts` (market score dashboard)
    - `lib/agent-runtime/queries.ts` (agent runtime matching)

- **agent_inventory_for_investor_v1(risk_profile, horizon)** (function)
  - Matched candidate set with hard gates.
  - Used by:
    - `lib/market-score/queries.ts` (matched inventory and KPIs)
    - `lib/agent-runtime/queries.ts` (default matching)

- **agent_ranked_for_investor_v1(risk_profile, horizon, budget_aed, preferred_area, beds_pref, intent)** (function)
  - Matched + ranked inventory with `match_score` and `final_rank`.
  - Used by:
    - `lib/market-score/queries.ts` (ranked mode)
    - `lib/agent-runtime/queries.ts` (ranked mode)

- **compute_match_score(asset_id, budget_aed, preferred_area, beds_pref, intent)** (function)
  - Computes match score for a single asset.
  - Used by `lib/agent-runtime/queries.ts` when ranking override additions.

### Override safety + audit
- **investor_override_audit** (table)
  - Logs admin overrides.
  - Used by:
    - `app/api/market-score/override/route.ts`
    - `app/api/agent-runtime/override/route.ts`

- **generate_override_disclosure(asset_id, override_type, profile)** (function)
  - Deterministic disclosure payload.
  - Used by:
    - `app/api/market-score/override-disclosure/route.ts`
    - `app/api/agent-runtime/override-disclosure/route.ts`

### Trust + system checks
- **system_healthcheck** (table)
  - Latest health snapshot.
  - Used by:
    - `app/api/market-score/healthcheck/route.ts`
    - `/market-score` and `/agent-runtime` trust strip

### Data products
- **entrestate_master** (table)
  - Canonical market dataset.
  - Used by:
    - `lib/daas/data.ts` → `app/api/daas/route.ts`
    - `app/api/data-scientist/dataset/entrestate/route.ts`

### Team report persistence
- **assistant_reports** (table)
  - Durable AI-generated report storage (title + payload + owner/team context).
  - Used by:
    - `app/api/reports/generate/route.ts`
    - `app/api/reports/[id]/download/route.ts`

### Media assets
- **media_enrichment** (table)
  - Media asset enrichment per project.
  - Used by:
    - `app/api/seq/project-library/route.ts` → Media Creator surfaces

## Data feed endpoints → UI pages
- `/api/markets` → `/markets`
- `/api/market-score/*` → `/market-score`
- `/api/agent-runtime/*` → `/agent-runtime`
- `/api/daas` → `/workspace/daas`
- `/api/data-scientist/dataset/entrestate` → `/workspace/data-scientist`
- `/api/seq/project-library` → `/agents` (Media Creator)

## Notes
- `price_aed` is **DOUBLE PRECISION** end-to-end and must stay numeric.
- Override paths are admin-only and logged to `investor_override_audit`.
- All matching results are **server-limited** (top 10 in Agent Runtime, pagination in Market Score).
