# Source of Truth Registry

This registry is the operational implementation of P0 item #1 from `docs/MISSING_DATA_ORDER.md`.

## Files

- `data/source-of-truth-registry.schema.json`
- `data/source-of-truth-registry.csv`

## Required fields

Each row must include:

- `metric_name`
- `source_system`
- `query_or_method`
- `owner`
- `last_refresh_at`
- `confidence_rule`
- `audit_link`

## Row quality standard

- `metric_name` must match the name used in docs/reports/UI.
- `source_system` must point to the actual table/feed/service of origin.
- `query_or_method` must be deterministic and reproducible.
- `owner` must be a team/function that can approve or reject publication.
- `last_refresh_at` must be updated whenever source data is refreshed.
- `confidence_rule` must define clear pass/fail publish criteria.
- `audit_link` must resolve to a repo path or URL with evidence.

## Update workflow

1. Add or update the metric row in `data/source-of-truth-registry.csv`.
2. Ensure field names still comply with `data/source-of-truth-registry.schema.json`.
3. Refresh `last_refresh_at` for any modified metric.
4. Verify `audit_link` points to a real artifact (doc, query spec, or route).
5. Reference the metric row in any new investor/partner page before publishing.

## Suggested next step

Promote this CSV into a database-backed registry table and add a CI check that fails when required metrics used in docs have no registry entry.

