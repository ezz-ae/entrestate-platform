# Data Requirements for Entrestate OS

This document lists the data-side requirements needed to operate Entrestate OS as an institutional-grade Decision Infrastructure platform.

## 1) Core Database Objects (required)

### Views / Tables
- inventory_clean (or inventory_spine): must include at least
  - id (primary key), name, developer, developer_ar, area, area_ar, city
  - price_from_aed (DOUBLE PRECISION), price_source, price_confidence (TEXT: HIGH/MEDIUM/LOW)
  - investor_score_v1, stress_grade_v1, timing_label, decision_label_v1, evidence_label_v1, yield_label
  - score_version = 'v1.0'
- market_scores_v1: must include at least
  - asset_id, score, score_0_100, classification, safety_band, roi_band, timeline_risk_band, liquidity_band
- area_roi_summary: must include at least
  - area, projects, avg_price, avg_yield, efficiency
- developer_performance: must include at least
  - developer, projects, reliability, efficiency, avg_price
- automation_inventory_view_v1 (or automation_inventory_for_investor_v1): must include at least
  - asset_id, name, developer, city, area, status_band
  - price_aed (DOUBLE PRECISION for automation runtime)
  - beds, score_0_100, safety_band, classification, roi_band, liquidity_band, timeline_risk_band
  - drivers, reason_codes, risk_flags
- latest_provenance: returns exactly 1 row after each pipeline run
- entrestate_developers_api: must include at least
  - name, name_ar, project_count, avg_score, avg_price, logo, tier

### Functions
- rank_investors()
- refresh_market_scores()
- get_area_absorption()
- automation_inventory_for_investor_v1()
- automation_ranked_for_investor_v1()
- compute_match_score()
- generate_override_disclosure()

## 2) Column Registry (signals + tier gating)
- Central registry must list all columns used by TableSpec and APIs.
- Each column must include:
  - id, label, group, dataType, source, tier, evidence layer (L1-L5), nullable
- Tier gating requirements:
  - free tier must allow price_from_aed
  - free tier must block ghost_portfolio_flag

## 3) Price Integrity Standard
- price_from_aed is the canonical price field in the Decision Infrastructure layer.
- price_from_aed must be DOUBLE PRECISION end-to-end.
- Any pricing aliases must map to price_from_aed in the query layer.

## 4) Provenance and Evidence
- Every notebook/pipeline run must publish provenance with:
  - run_id, snapshot_ts, sources_used, column_registry_version, exclusion_policy_version
- API responses must include provenance metadata where applicable.
- Evidence drawer must surface run_id and snapshot_ts.

## 5) Source-of-Truth Registry (data/source-of-truth-registry.csv)
Required fields:
- metric_name
- source_system
- query_or_method
- owner
- last_refresh_at
- confidence_rule
- audit_link

## 6) Investor Metrics Audit Trail (data/investor-metrics-audit.csv)
Required fields:
- metric
- value
- period
- definition
- calculation
- evidence_link

## 7) Governance Policy (L1-L5)
Required policy fields:
- layer
- acceptance_criteria
- fallback_behavior
- freshness_sla
- override_rule
- approver

## 8) Decision Score Transparency Pack
Required fields:
- signal
- weight
- min/max
- normalization
- profile_modifier
- example_output

## 9) API Data Contracts (external + internal)
Each endpoint must define:
- endpoint
- auth_scope
- rate_limit
- request_schema
- response_schema
- error_codes
- deprecation_policy

## 10) Data Quality Rules
- No exclusion filters for legacy sources (lelwa/mashroi) at ingestion.
- Any display-layer filtering must be explicit and documented.
- All numeric metrics must remain numeric in DB and in API output.

## 11) Environment / Runtime Requirements
- DATABASE_URL / DATABASE_URL_UNPOOLED or NEON_DATABASE_URL / NEON_DATABASE_URL_UNPOOLED
- NEON_READONLY_URL for db-contract tests
- Provenance runner must update latest_provenance after each pipeline run
