# Entrestate — Missing Data Order (Execution Backlog)

Updated: 2026-03-07

This is the ordered list of what is still missing for a partner/investor-grade platform package.

## P0 — Critical (needed first)

1. **Evidence source-of-truth registry**
   - Status: starter implementation created in `data/source-of-truth-registry.csv` with schema `data/source-of-truth-registry.schema.json`.
   - Missing: full production coverage for every KPI shown in docs/reports.
   - Required fields: `metric_name`, `source_system`, `query_or_method`, `owner`, `last_refresh_at`, `confidence_rule`, `audit_link`.

2. **Investor metrics with audit trail**
   - Status: starter implementation created in `data/investor-metrics-audit.csv` with schema `data/investor-metrics-audit.schema.json`.
   - Missing: production evidence links and automated freshness validation.
   - Required fields: `metric`, `value`, `period`, `definition`, `calculation`, `evidence_link`.

3. **Partner/API production contract docs**
   - Missing: complete API contract pages (auth, limits, errors, retries, webhooks, SLAs, version policy).
   - Required fields: `endpoint`, `auth_scope`, `rate_limit`, `request_schema`, `response_schema`, `error_codes`, `deprecation_policy`.

4. **Data governance policy (L1-L5 operationalized)**
   - Missing: enforceable rules for promotion/demotion between layers, conflict resolution, and stale-data handling.
   - Required fields: `layer`, `acceptance_criteria`, `fallback_behavior`, `freshness_sla`, `override_rule`, `approver`.

5. **Decision score transparency pack**
   - Missing: explicit formula cards for 65/35 scoring, weights by profile, and sensitivity outputs.
   - Required fields: `signal`, `weight`, `min/max`, `normalization`, `profile_modifier`, `example_output`.

## P1 — High (next wave)

6. **Mind-map article deep content (all nodes)**
   - Current state: all 44 mind-map nodes now have article routes, but most are concise framework articles.
   - Missing for each article: architecture diagram, real examples, failure modes, governance notes, KPI targets, operational runbook.

7. **Reports metadata schema + indexing**
   - Missing: normalized metadata for report retrieval and investor filtering.
   - Required fields: `public_id`, `title`, `market`, `asset_class`, `date`, `version`, `confidence`, `sources[]`, `author`, `status`.

8. **Industry benchmark dataset**
   - Missing: externally sourced competitor/market benchmarks with citation links and refresh schedule.
   - Required fields: `benchmark_name`, `entity`, `value`, `period`, `source_url`, `collection_method`.

9. **Partner onboarding data pack**
   - Missing: standardized implementation checklist and integration readiness score.
   - Required fields: `partner_type`, `integration_stage`, `required_credentials`, `data_mapping_status`, `go_live_blockers`.

10. **IR diligence room index**
    - Missing: structured map of legal/financial/product/security artifacts for due diligence.
    - Required fields: `artifact`, `version`, `owner`, `updated_at`, `access_level`, `verification_status`.

## P2 — Medium (scale and operations)

11. **Careers & internship operating data**
    - Missing: role scorecards, hiring funnel metrics, intern track outcomes, mentor assignments.

12. **Responsible AI controls register**
    - Missing: prompt controls, red-team findings, hallucination safeguards, fallback policies.

13. **Regional expansion data model**
    - Missing: schema for non-UAE market rollout (new regulators, new feeds, localization rules).

14. **Customer proof layer**
    - Missing: case studies with before/after metrics and verifiable references.

## Recommended collection order (exact sequence)

1. Build source-of-truth registry for existing KPI claims.
2. Populate investor metrics with monthly audit links.
3. Finalize API production contracts (auth/errors/limits/SLA).
4. Publish L1-L5 governance rules and freshness SLAs.
5. Publish scoring formulas and sensitivity examples.
6. Expand each of the 44 mind-map articles to full long-form.
7. Normalize report metadata + filters.
8. Add industry benchmarks with citations.
9. Package partner onboarding + IR diligence index.
10. Add talent/AI/customer-proof operational datasets.

## Acceptance criteria for “fully complete”

- Every KPI in docs has a clickable evidence link.
- Every API section has executable request/response examples.
- Every mind-map node article includes: definition, inputs, outputs, edge cases, and governance owner.
- Investor Relations pages are diligence-ready without manual clarification.
- Reports library can be filtered by confidence/source/date/market.
