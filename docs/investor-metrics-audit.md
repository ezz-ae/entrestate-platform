# Investor Metrics Audit Trail

This dataset is the operational implementation of P0 item #2 from `docs/MISSING_DATA_ORDER.md`.

## Files

- `data/investor-metrics-audit.schema.json`
- `data/investor-metrics-audit.csv`

## Required fields

Each row must include:

- `metric`
- `value`
- `period` (`YYYY-MM`)
- `definition`
- `calculation`
- `evidence_link`

## Coverage in current seed

Current monthly seed includes:

- ARR
- Pipeline Value
- Retention Rate
- CAC Payback
- Gross Margin
- Runway

Periods seeded: `2025-10` through `2026-03`.

## Data quality standard

- `metric` labels must match investor-facing docs exactly.
- `period` must be monthly and monotonic for each metric.
- `definition` and `calculation` must be stable unless versioned.
- `evidence_link` must point to verifiable source artifacts.
- Changes to historical values must include revision notes in PR description.

## Update workflow

1. Add new month rows for all required metrics.
2. Update changed values only with supporting evidence references.
3. Keep formulas deterministic and comparable month-over-month.
4. Validate required fields before merge.
5. Reflect headline KPI updates on investor-facing pages.

## Next hardening step

Promote this CSV into a database table and add CI validation that blocks merge when required metrics are missing for the latest month.

