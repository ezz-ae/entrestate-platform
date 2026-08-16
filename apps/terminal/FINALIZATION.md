# Entrestate Finalization

This file anchors release finalization at the repo root.

## Canonical Checklists

- Hex-generated enterprise checklist: `lib/FINALIZATION (3).md`
- Historical snapshots: `FINALIZATION (1).md`, `FULL_WORK (3).md`

## Required Verification

- `pnpm run guardian`
- `pnpm run lint`
- `pnpm run test`
- `pnpm run build`
- `pnpm run smoke -- --url https://<preview-url>`
- `pnpm run test:db-contract` against `NEON_READONLY_URL`

## Notes

- The root path exists so CI, docs, and handoff material can reference a stable `FINALIZATION.md`.
- The detailed notebook-derived checklist remains in `lib/FINALIZATION (3).md` until the notebook export is renamed at source.

## Completed In This Pass

- API envelopes normalized across `app/api/chat/route.ts`, `app/api/copilot/route.ts`, `app/api/markets/route.ts`, and `app/api/market-score/summary/route.ts`.
- Landing flow aligned around `app/page.tsx`, `app/chat/page.tsx`, `app/onboarding/page.tsx`, and `components/ChatInterface.tsx`.
- Evidence Drawer surfaced in chat with request IDs, provenance, calculation steps, and run metadata.
- Trust language system added in `lib/copy/trust.ts`, `lib/copy/upgrade.ts`, `components/ConfidenceBadge.tsx`, `components/ScoreExplainer.tsx`, and `components/EvidenceDrawer.tsx`.
- Embed SDK hardened in `packages/embed/src/index.ts` and `app/api/embed/route.ts` for overlay mode, locked free-tier branding, rate limits, cache headers, and widget attribution hooks.
- Attribution plumbing added in `app/api/attribution/route.ts`, `lib/attribution/events.ts`, `lib/attribution/viral-coefficient.ts`, and `app/api/signup/route.ts`.
- DB contract coverage expanded in `tests/db-contract.test.ts`, with additional route contract coverage in `tests/api-route-contracts.test.ts` and trust copy coverage in `tests/trust-copy.test.ts`.
- Operational scripts and docs aligned in `scripts/smoke.ts`, `README.md`, `.github/workflows/ci.yml`, and `.github/workflows/db-contract-nightly.yml`.
- Landing information architecture strengthened in `app/page.tsx` with public-proof counters, richer schema metadata, and clearer adoption pathways.
- Search and Map now have dedicated SEO metadata in `app/search/layout.tsx` and `app/map/layout.tsx`, plus cross-links that tie screening, spatial reading, and verdict flow together.
- `app/map/page.tsx` now localizes layer controls and legend copy for Arabic instead of leaving those navigation surfaces partially English.
- `app/status/page.tsx` now exposes governance and reliance routes directly to privacy, terms, architecture docs, and the CTO review.
- `app/sitemap.ts` now includes the core `/chat` and `/map` product surfaces so discovery matches the primary platform entry points.
- Search, Areas, and Map now expose explicit data-coverage summaries, source-view visibility, fallback detection, and request correlation IDs via `lib/data-coverage.ts`, `app/api/search/route.ts`, `app/api/areas/route.ts`, `app/search/page.tsx`, `app/map/page.tsx`, and `app/areas/page.tsx`.
- Route and unit coverage for these data-quality contracts now live in `tests/api-route-contracts.test.ts` and `tests/data-coverage.test.ts`.
- `/search` now includes a real Time Table Builder shell via `components/search/time-table-builder.tsx`, backed by `/api/time-table/preview` and `/api/time-table/summary`, with analyst-mode narrative, clickable citations, and row-highlighting.
- Time Table previews now guarantee `_rowId` and `_timestamp` metadata from `lib/time-table/time-table.ts`, and summary responses now return deterministic citations, evidence, and fallback notebook text via `lib/time-table/presentation.ts`.

## Verification Status

- ✅ `pnpm run guardian`
- ✅ `pnpm run lint`
- ✅ `pnpm test`
- ✅ `pnpm run build`
- ⏳ `pnpm run smoke -- --url https://<preview-url>` pending preview URL
- ⏳ `pnpm run test:db-contract` against `NEON_READONLY_URL` pending live readonly database

## Remaining Gaps

- Widget attribution persistence still depends on the live `attribution_events` and `widgets` tables being present in Neon.
- Signup and upgrade attribution windows are wired at the API boundary, but full 7-day and 90-day attribution logic still depends on production event history.
