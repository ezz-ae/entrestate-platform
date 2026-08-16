# Entrestate OS Scaffold

This document captures the scaffolding added for the Entrestate Intelligence OS modules.

## Core modules

- TableSpec validation: `lib/tablespec/validation.ts` enforces allowed signals/filters and entitlements.
- LLM compiler: `lib/tablespec/llm.ts` provides an optional LLM-backed TableSpec compiler with strict validation and fallback behavior.
- Time Table: `lib/time-table/time-table.ts` computes signal scores and supports pagination.
- Scoring engine: `lib/scoring` computes Market + Match scores and re-ranks rows.
- Artifacts: `lib/artifacts` generates PDF, PPTX stubs, HTML widgets, and contract drafts with evidence drawers.
- Profiles: `lib/profile` infers bias adjustments from user behavior signals.
- Governance: `lib/governance` provides hashing, immutable sealing, RBAC, sessions, audit log, and kill switch helpers.
- Distribution: `lib/distribution` builds embed snippets and tracks referrals (in-memory).
- Ingestion: `lib/ingestion` maps source records to canonical entities + versioned snapshots.

## API routes

- `POST /api/time-table/compile` - compile intent/golden path into TableSpec (supports `useLLM` flag for LLM-backed compilation).
- `POST /api/time-table/preview` - preview Time Table rows (supports `useLLM` flag for LLM-backed compilation).
- `POST /api/time-table/summary` - generate notebook narrative highlights from a TableSpec or intent.
- `POST /api/time-table/artifacts` - generate reports, decks, social content, offers, investment plans, brochures, and widgets.
- `POST /api/time-table/underwrite` - golden path underwriting report + PDF artifact.
- `POST /api/scoring/recalculate` - recompute Market/Match scores for a TableSpec (supports `useLLM` flag when compiling from intent).
- `POST /api/profile/infer` - infer profile adjustments from behavioral signals.
- `POST /api/distribution/embed` - generate widget embed snippet.
- `POST /api/distribution/referral` - record referral sign-ups.

## ETL scripts

Sample ETL scripts live in `scripts/etl` and call the ingestion pipeline:

- `ingest-dld.ts`
- `ingest-listings.ts`
- `ingest-developers.ts`
- `ingest-risk-metrics.ts`
- `ingest-all.ts`

## Governance switches

Set `ENTRESTATE_KILL_SWITCH=true` to block the API paths listed in `middleware.ts`. Use `ENTRESTATE_SESSION_SECRET` to sign sessions in `lib/governance/session.ts`. Use `TABLESPEC_LLM_ENABLED=true` to enable the LLM-backed TableSpec compiler and `TABLESPEC_LLM_MODEL` to override the default model (e.g. `huggingface/moonshotai/Kimi-K2.5`). Media Creator prompt flows can be overridden with `MEDIA_TEXT_MODEL` and `MEDIA_VISION_MODEL` (e.g. `huggingface/zai-org/GLM-4.7-Flash` for text tasks). Data-scientist insights can be routed to KoboldAI by setting `KOBOLDAI_BASE_URL` or `KOBOLDAI_CHAT_URL`.
