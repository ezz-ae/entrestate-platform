# Entrestate Notebook Master Brief

This single file is the full handoff for the notebook agent. It includes the data sync checklist, Neon data map, sitemap, and current data refinements/requests.

---

## A) Data Sync Checklist (Notebook → Neon → App)

This is the operational checklist for refreshing Entrestate’s live data. Use it before each run and log results in the notebook agent.

### 1) Inputs (Notebook Outputs)
- Inventory master snapshot (full market coverage).
- Media assets pack (images, plans, amenities).
- Deterministic scoring output (Market Score engine).

### 2) Sync Rules (Hard)
- Do not exclude rows containing `lelwa` or `mashroi`; keep data and filter only in the UI.
- Keep `price_aed` numeric (DOUBLE PRECISION in Neon).
- Do not change Neon schema or functions.

### 3) Target Mapping
| Source | Neon Target | Notes | Used By |
| --- | --- | --- | --- |
| Inventory master | `entrestate_master` | Replace/refresh full table | `/api/daas`, `/api/data-scientist/dataset/entrestate` |
| Media assets | `media_enrichment` | Refresh with same asset ids | `/api/seq/project-library` → Media Creator |
| Scoring engine | `market_scores_v1` | Recompute after inventory | Used via `agent_inventory_view_v1` |
  - Joined view | `automation_inventory_view_v1` | View auto-updates after tables | `/api/markets`, `/api/chat`, `/api/market-score/*`, `/api/automation-runtime/run` |
| Match profile config | `investor_profiles_v1` | Seed/maintain as config | Matching functions |
| Overrides | `investor_override_audit` | App writes only | Audit trail |
| Health | `system_healthcheck` | Write after sync | Trust strip |

### 4) Sync Steps (Order)
1) **Prepare inventory snapshot**  
   - Do not apply `lelwa/mashroi` exclusions before pushing; keep data intact.
2) **Push `entrestate_master`**  
   - Full replace refresh.
3) **Push `media_enrichment`**  
   - Ensure `asset_id`/`project_id` matches inventory.
4) **Recompute `market_scores_v1`**  
   - Must use latest inventory data.
5) **Verify `agent_inventory_view_v1`**  
   - View should reflect the latest scores + inventory automatically.
6) **Write `system_healthcheck`**  
   - Store row count checks + pass/fail for key validations.

### 5) Validation Queries (Quick)
```sql
SELECT COUNT(*) FROM entrestate_master;
SELECT COUNT(*) FROM media_enrichment;
SELECT COUNT(*) FROM market_scores_v1;
SELECT COUNT(*) FROM automation_inventory_view_v1;

SELECT COUNT(*) FROM automation_inventory_view_v1
WHERE safety_band = 'Speculative' AND classification = 'Conservative';
```

### 6) App Health Checks (Quick)
- `GET /api/market-score/summary`
- `GET /api/market-score/healthcheck`
- `GET /api/markets?limit=12`
- `POST /api/daas` with product `dashboard`
- `GET /api/seq/project-library`

### 7) Failure Handling
- If any query fails or counts look wrong, **halt** and re-run the notebook sync.
- Do not push partial tables; always refresh as a complete snapshot.

### 8) Ownership
- Notebook agent owns the sync.
- App consumes only what Neon exposes via the targets above.

---

## B) Neon Data Map (What the App Uses)

This is the concise map of the Neon schema used by the app today. It focuses on the live tables, views, and functions we call, plus the data feed routes and UI surfaces that consume them.

### Connection
- **Prisma client:** `lib/prisma.ts`
- **Env:** `DATABASE_URL` in `.env.local`
- **Query style:** raw SQL via `prisma.$queryRaw` (no schema changes here)

### High-level data flow
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
  └─ media_enrichment                 ─→ /api/seq/project-library → /agents (Media Creator)
```

### Tables / Views / Functions
**Inventory + scoring spine**
- **market_scores_v1** (table)  
  Deterministic scoring per asset: `score_0_100`, `classification`, `safety_band`, `roi_band`, `timeline_risk_band`, `liquidity_band`, `drivers`, `reason_codes`, `risk_flags`.  
  Not queried directly in the app; used through `agent_inventory_view_v1`.

- **agent_inventory_view_v1** (view)  
  Joined inventory + scoring.  
Used by: `app/api/markets/route.ts`, `lib/market-score/queries.ts`, `lib/automation-runtime/queries.ts`.

- **agent_inventory_for_investor_v1(risk_profile, horizon)** (function)  
  Matched candidate set with hard gates.  
  Used by: `lib/market-score/queries.ts`, `lib/agent-runtime/queries.ts`.

- **agent_ranked_for_investor_v1(risk_profile, horizon, budget_aed, preferred_area, beds_pref, intent)** (function)  
  Matched + ranked inventory with `match_score` and `final_rank`.  
  Used by: `lib/market-score/queries.ts`, `lib/agent-runtime/queries.ts`.

- **compute_match_score(asset_id, budget_aed, preferred_area, beds_pref, intent)** (function)  
  - Used by `lib/automation-runtime/queries.ts` when ranking override additions.

**Override safety + audit**
- **investor_override_audit** (table)  
  Logs admin overrides.  
  Used by: `app/api/market-score/override/route.ts`, `app/api/agent-runtime/override/route.ts`.

- **generate_override_disclosure(asset_id, override_type, profile)** (function)  
  Deterministic disclosure payload.  
  Used by: `app/api/market-score/override-disclosure/route.ts`, `app/api/agent-runtime/override-disclosure/route.ts`.

**Trust + system checks**
- **system_healthcheck** (table)  
  Latest health snapshot.  
  Used by: `app/api/market-score/healthcheck/route.ts`, `/market-score`, `/agent-runtime`.

**Data products**
- **entrestate_master** (table)  
  Canonical market snapshot.  
  Used by: `lib/daas/data.ts` → `app/api/daas/route.ts`, and `app/api/data-scientist/dataset/entrestate/route.ts`.

**Media assets**
- **media_enrichment** (table)  
  Media asset enrichment per project.  
  Used by: `app/api/seq/project-library/route.ts` → Media Creator surfaces.

### Data feed endpoints → UI pages
- `/api/markets` → `/markets`
- `/api/market-score/*` → `/market-score`
- `/api/agent-runtime/*` → `/automation-runtime`
- `/api/daas` → `/workspace/daas`
- `/api/data-scientist/dataset/entrestate` → `/workspace/data-scientist`
- `/api/seq/project-library` → `/agents` (Media Creator)

### Notes
- `price_aed` is DOUBLE PRECISION end-to-end and must stay numeric.
- Override paths are admin-only and logged to `investor_override_audit`.
- All matching results are server-limited (top 10 in Agent Runtime, pagination in Market Score).

---

## C) Site Map (Routes + Status)

This is the operational map for the platform, including content intent and implementation status.

### Legend
- **Live**: Connected to Neon or active data feeds.
- **Hybrid**: Live data + curated content.
- **UI Only**: Layout/UX complete, no live backend dependency.
- **Preview**: Feature is in demo mode or uses fixed demo output.

### Public Marketing
| Route | Purpose | Status |
| --- | --- | --- |
| `/` | Main platform overview | UI Only |
| `/about` | Company narrative + values | UI Only |
| `/contact` | Contact flow | UI Only |
| `/support` | Support hub | UI Only |
| `/status` | Ops status | UI Only |
| `/roadmap` | Product roadmap | UI Only |
| `/changelog` | Release log | UI Only |
| `/privacy` | Policy | UI Only |
| `/terms` | Terms | UI Only |

### Media Creator (Marketing Studio)
| Route | Purpose | Status |
| --- | --- | --- |
| `/agents` | Media Creator landing | Hybrid (live project library) |
| `/storyboard` | Storyboard builder | Hybrid (live project library) |
| `/image-playground` | Visual asset builder | Hybrid (live project library) |
| `/timeline` | Video timeline builder | Hybrid (live project library) |

### Workspace (Data + Decisions)
| Route | Purpose | Status |
| --- | --- | --- |
| `/workspace` | Workspace entry | UI Only |
| `/workspace/data-scientist` | Market Intelligence Desk (activate / explore / briefs) | Live (Neon data) |
| `/workspace/data-scientist/explore` | Market explorer | Live (Neon data) |
| `/workspace/data-scientist/notebook` | Market notebook | UI Only |
| `/workspace/daas` | Market Data Integration | Live (Neon data) |
| `/workspace/dashboards` | Dashboard launcher | UI Only |
| `/workspace/search` | Search hub | UI Only |
| `/workspace/saved-searches` | Saved search list | UI Only |
| `/workspace/comparisons` | Scenario comparisons | UI Only |
| `/workspace/imports` | Data source management | UI Only |
| `/workspace/math-tools` | Calculators | UI Only |
| `/market-score` | Deterministic scoring + matching validation | Live (Neon) |
| `/agent-runtime` | Investor Match Desk | Live (Neon) |

### Apps
| Route | Purpose | Status |
| --- | --- | --- |
| `/apps` | App catalog | UI Only |
| `/apps/agent-builder` | Agent‑First Builder | Hybrid (preview execution) |
| `/apps/lead-agent` | Insta DM lead agent kit | UI Only |
| `/apps/coldcalling` | Cold calling scripts + ops | UI Only |
| `/apps/docs/*` | App documentation | UI Only |

### Data‑Driven Intelligence
| Route | Purpose | Status |
| --- | --- | --- |
| `/markets` | Explorer search + ready questions | Live (Neon) |
| `/top-data` | Live market signals + matched answers | Live (Neon + chat) |
| `/library` | Research library | UI Only |
| `/library/reports` | Reports index | UI Only |
| `/library/insights` | Insights index | UI Only |
| `/library/contracts-explained` | Contracts explained | UI Only |

### Account
| Route | Purpose | Status |
| --- | --- | --- |
| `/account` | Account overview | Hybrid (Neon Auth session) |
| `/login` | Login | Live (Neon Auth) |
| `/signup` | Signup | Live (Neon Auth) |
| `/forgot-password` | Password reset | Live (Neon Auth) |

### Data Feeds (Neon)
| Route | Purpose | Status |
| --- | --- | --- |
| `/api/markets` | Live inventory search | Live |
| `/api/markets/search` | Quick search | Live |
| `/api/chat` | Market chat (rule-based) | Live |
| `/api/market-score/*` | Market score KPIs, inventory, overrides | Live |
| `/api/agent-runtime/*` | Investor matching + overrides | Live |
| `/api/daas` | Data export | Live |
| `/api/data-scientist/dataset/entrestate` | Market snapshot export | Live |
| `/api/seq/project-library` | Media library | Live |

### Notes
- Admin overrides are gated by `NEXT_PUBLIC_ADMIN_MODE=true`.
- The Agent‑First Builder execution endpoints are in preview mode for audio/embedding/structured output.

---

## D) Data Requests + Refinements

These are the active requirements the notebook agent must respect.

1) **Exclude sources**  
   - Do not ignore records containing `lelwa` or `mashroi`.

2) **Numeric integrity**  
   - Keep `price_aed` as DOUBLE PRECISION (no text casts).

3) **Deterministic spine**  
   - `market_scores_v1` and `agent_inventory_view_v1` must be refreshed after every inventory update.
   - No schema or function changes without explicit approval.

4) **Media coverage**  
   - `media_enrichment` must match inventory IDs for Media Creator apps.

5) **Trust signals**  
   - Always update `system_healthcheck` after a successful run.

---

## E) Quick Handoff Summary (for Notebook Agent)
- Refresh `entrestate_master` + `media_enrichment` every run.
- Recompute `market_scores_v1`, validate `agent_inventory_view_v1`.
- Do not exclude `lelwa` and `mashroi` at source.
- Update `system_healthcheck` with counts and pass/fail checks.
