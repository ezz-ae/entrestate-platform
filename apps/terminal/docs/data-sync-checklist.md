# Data Sync Checklist (Notebook → Neon → App)

This is the operational checklist for refreshing Entrestate’s live data. Use it before each run and log results in the notebook agent.

## 1) Inputs (Notebook Outputs)
- Inventory master snapshot (full market coverage).
- Media assets pack (images, plans, amenities).
- Deterministic scoring output (Market Score engine).

## 2) Sync Rules (Hard)
- Do not exclude rows containing `lelwa` or `mashroi`; keep data and filter only in the UI.
- Keep `price_aed` numeric (DOUBLE PRECISION in Neon).
- Do not change Neon schema or functions.

## 3) Target Mapping
| Source | Neon Target | Notes | Used By |
| --- | --- | --- | --- |
| Inventory master | `entrestate_master` | Replace/refresh full table | `/api/daas`, `/api/data-scientist/dataset/entrestate` |
| Media assets | `media_enrichment` | Refresh with same asset ids | `/api/seq/project-library` → Media Creator |
| Scoring engine | `market_scores_v1` | Recompute after inventory | Used via `agent_inventory_view_v1` |
| Joined view | `agent_inventory_view_v1` | View auto-updates after tables | `/api/markets`, `/api/chat`, `/api/market-score/*`, `/api/agent-runtime/run` |
| Match profile config | `investor_profiles_v1` | Seed/maintain as config | Matching functions |
| Overrides | `investor_override_audit` | App writes only | Audit trail |
| Health | `system_healthcheck` | Write after sync | Trust strip |

## 4) Sync Steps (Order)
1) **Prepare inventory snapshot**  
   - Do not apply `lelwa/mashroi` exclusions before pushing.
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

## 5) Validation Queries (Quick)
```sql
SELECT COUNT(*) FROM entrestate_master;
SELECT COUNT(*) FROM media_enrichment;
SELECT COUNT(*) FROM market_scores_v1;
SELECT COUNT(*) FROM agent_inventory_view_v1;

SELECT COUNT(*) FROM agent_inventory_view_v1
WHERE safety_band = 'Speculative' AND classification = 'Conservative';
```

## 6) App Health Checks (Quick)
- `GET /api/market-score/summary`
- `GET /api/market-score/healthcheck`
- `GET /api/markets?limit=12`
- `POST /api/daas` with product `dashboard`
- `GET /api/seq/project-library`

## 7) Failure Handling
- If any query fails or counts look wrong, **halt** and re-run the notebook sync.
- Do not push partial tables; always refresh as a complete snapshot.

## 8) Ownership
- Notebook agent owns the sync.
- App consumes only what Neon exposes via the targets above.
