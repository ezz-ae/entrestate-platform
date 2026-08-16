# Entrestate — Complete System Documentation

## Overview

Entrestate is a **separated data platform** for UAE real estate intelligence, with two product layers:

1. **Entrestate Intelligence OS** — The truth layer: inventory spine, decision signals, investor scoring
2. **Entrestate Transaction Layer** — The execution layer: folder-based rental transaction system, white-labeled for B2B enterprise

---

## Part 1: Entrestate Intelligence OS

### Data Architecture (Separated Platform)

| Schema | Purpose | Key Tables |
|---|---|---|
| `raw` | Unprocessed source data | `inventory_full` (7,015 projects), `bayut_listings` (41,381), `dld_transactions` |
| `canonical` | Cleaned, scored, single source of truth | `inventory_clean` (2,813 projects), `bayut_area_benchmarks` (275 areas) |
| `api` | Read-optimized views for frontend/API | `entrestate_inventory`, `entrestate_developers_api`, `entrestate_areas_api` |
| `entrestate_tx` | Transaction workspace layer | 40 tables, 9 functions, 9 API views |

### Data Sources

| Source | Records | What It Provides |
|---|---|---|
| PropertyFinder | 2,813 projects | Prices, images, developers, unit configs, amenities |
| Bayut | 41,381 listings | Sale listings across 7 UAE cities, lat/lng, building data |
| DLD (Dubai Land Dept) | 0 transactions | Real transaction prices, volume, velocity |
| Bayut Benchmarks | 275 areas | Median prices and rents by area |

### Signal Engine (V1 Scores)

Every project in `inventory_clean` has computed scores:

| Signal | What It Measures | Range |
|---|---|---|
| `quality_score` | Overall investment quality | 0-100 |
| `stress_grade` | Market stress level | A-F |
| `timing_label` | Entry timing signal | Early Entry / Growth Phase / Peak / Late Cycle |
| `market_signal` | Buy/Hold/Wait recommendation | Based on multi-factor analysis |
| `evidence_level` | Data confidence | High / Medium / Low |
| `yield_score` | Rental yield attractiveness | 0-100 |
| `timing_score` | Market timing score | 0-100 |
| `investor_score_v1` | Composite investor score | 0-100 |

### Developer Registry

- 75 active developers with profiles, logos, tier classifications
- Stored in `canonical.developer_registry` with PF-verified data
- Tiers: Mega, Major, Mid, Emerging, Boutique

### API Views (Production)

| View | What It Serves |
|---|---|
| `entrestate_inventory` | Full project data for frontend |
| `entrestate_developers_api` | Developer profiles + stats |
| `entrestate_areas_api` | Area profiles with benchmarks |
| `entrestate_top_data` | Homepage sections + market pulse |

---

## Part 2: Entrestate Transaction Layer — Folder-Based Transaction System

### What It Is

A folder-based residential rental/sales operating system. Every listing is a **folder** — a controlled workspace containing media, pricing, compliance, negotiation history, contact consent state, agreement generation, and payment activation.

### Core Principles

1. **Authority-before-import** — Imported data never silently overrides authoritative property identity
2. **Delta-first onboarding** — Ask only for what's missing, stale, or conflicting
3. **Structured state mutation only** — Important actions through explicit buttons/forms, never raw text
4. **Tenant-safe trust model** — Contact details protected until mutual overlap consent
5. **Liquidity protection** — Holds must not let one weak lead freeze inventory
6. **WhatsApp as action rail** — Intent-to-button routing, state mutations require confirmation

### Database — 40 Tables

| Category | Tables |
|---|---|
| **Folder lifecycle** | `folders`, `listing_imports`, `folder_field_values`, `folder_anomalies`, `checklist_items` |
| **Hold & queue** | `folder_holds`, `hold_events`, `folder_queue_entries`, `tenant_folder_restrictions` |
| **Trust & consent** | `contact_consents`, `contact_reveal_events`, `deal_chats`, `agreements` |
| **WhatsApp** | `whatsapp_inbound_messages`, `whatsapp_action_prompts`, `whatsapp_intent_config` |
| **Verification & payments** | `tenant_verifications`, `ledger_accounts`, `ledger_events` |
| **Infrastructure** | `folder_state_transitions`, `sybil_telemetry`, `audit_log` |
| **Planning** | `sprint_plan`, `service_registry`, `frontend_screens`, `component_registry` |
| **White-label** | `white_label_rebrand`, `enterprise_api_surface`, `enterprise_roi_model`, `tracer_bullet_demo` |

### Business Logic — 9 PL/pgSQL Functions

| Function | Purpose |
|---|---|
| `validate_folder_transition` | Enforces 22 valid state machine paths |
| `check_hold_extension_eligibility` | Max 2 extensions, milestone-gated |
| `compute_consent_overlap` | Intersection-based channel reveal |
| `get_next_queue_candidate` | Verified-priority, cooldown-aware queue promotion |
| `worker_expire_holds` | Auto-expire → cooldown → promote → republish |
| `worker_yield_decision` | Pause promotion when queue is deep |
| `worker_cleanup_stale_prompts` | WhatsApp prompt hygiene |
| `worker_recompute_readiness` | Auto-promote review_needed → ready |
| `log_audit` | Universal audit trail |

### State Machine — 22 Transitions

```
draft → review_needed (anomalies detected)
draft → ready (no blockers)
review_needed → ready (checklist resolved)
ready → published (publish action)
published → held_primary (hold granted)
held_primary → published (hold expired, no queue)
held_primary → pending_yield_decision (hold expired, deep queue)
held_primary → in_negotiation (deal chat active)
in_negotiation → in_contact_consent (terms aligned)
in_contact_consent → in_contract (overlap revealed)
in_contract → signed (signatures complete)
signed → deposit_pending (deposit requested)
deposit_pending → rented (ledger activated)
[any active] → closed_not_renting (deal dropped)
rented → archived (lease ended)
```

### Live Data

| Metric | Count |
|---|---|
| Total folders | 7,217 |
| Sources | PropertyFinder + Bayut |
| Listing imports | 5,358 |
| State transitions | 22 |
| API views | 9 |
| Backend services | 13 (27 endpoints) |
| Sprint tasks | 45 across 12 sprints |
| Frontend screens | 20 |
| React components | 17 |

---

## Part 3: White-Label Enterprise Transformation

### The Strategic Pivot

Based on external critique, the system was repackaged from a enterprise infrastructure (Entrestate Transaction Layer) to a **white-labeled enterprise infrastructure layer** (Entrestate Transaction Layer).

### Rebrand Map

| Consumer Name | Enterprise Name | Module |
|---|---|---|
| Entrestate Transaction Layer | Entrestate Transaction Layer | Core Platform |
| Entrestate Discovery | Decision Engine | Discovery Engine |
| Folder | Execution Engine | Deal Engine |
| Entrestate Assist | Onboarding Engine | Supply Ingestion |
| Sybil Firewall | Collision Engine | Trust Layer |
| Contact Consent | Trust Protocol | Trust Layer |
| Timed Holds | Transaction Engine hold protocol | Liquidity Engine |
| Queue + Soft Bounce | Recovery Engine | Liquidity Engine |
| Mapped City Vector | Evidence Layer | Intelligence Layer |

### Enterprise API — 15 Endpoints, 6 Modules

| Module | Endpoints | Key Capability |
|---|---|---|
| Supply Ingestion | 3 | URL ingest, portfolio API, spine match |
| Trust Layer | 3 | Collision test, Sybil check, consent overlap |
| Liquidity Engine | 4 | Hold request, extend, queue promote, soft-bounce |
| Deal Engine | 2 | Full workspace, state transitions |
| Intelligence Layer | 2 | Vector search, algorithmic underwriting |
| Communication Layer | 1 | WhatsApp intent classification |

### ROI Model — 7 Quantified Pain Points

| Pain Point | Savings |
|---|---|
| Fake/duplicate listing moderation | AED 3.6M-9M/yr (replaces 20-50 FTE) |
| Leaked intent from bounced leads | AED 25M-50M recovered revenue |
| Agent data entry time | 90% reduction (6,750 hours/month) |
| Inventory freeze from weak leads | 40% reduction in freeze time |
| Agreement generation | 80% faster close time |
| Privacy violations | Risk elimination by architecture |
| Unstructured state mutations | 100% structured, full audit trail |

---

## Part 4: Gemini Bridge — MCP Integration

### Architecture

```
Terminal / Frontend
      ↓
  client.ts (Gemini Bridge)
      ↓ MCP Protocol
  index.ts (MCP Server)
      ↓ SQL
  Neon Postgres (entrestate_tx schema)
```

### 7 MCP Tools

| Tool | What It Does |
|---|---|
| `search_mapped_city` | Vector-style search across published folders |
| `request_primary_hold` | Hold grant or queue entry with verification priority |
| `attempt_publish` | Sybil Firewall + publish gating |
| `get_folder_detail` | Full folder with computed fields |
| `check_consent_overlap` | Intersection-based channel reveal |
| `get_queue_status` | Queue positions with verification scores |
| `classify_whatsapp_intent` | Intent-to-button routing (8 intents) |

### Invisible Instruction Pattern

When a tool returns JSON with an `instruction` field, Gemini silently follows it:
- Sybil block → "Upload your Title Deed" (never reveals duplicate detection)
- Cooldown → "Suggest similar available units" (never reveals restriction)
- No consent overlap → "Choose one common method" (never reveals other party's choices)

---

## Part 5: Tracer Bullet Demo

8-step, <0.5 second live demo against real data:

| # | Step | Time | Proves |
|---|---|---|---|
| 1 | Paste URL → Workspace | <0.1s | Zero manual entry |
| 2 | Sybil Firewall | <0.05s | Zero human moderation |
| 3 | Tenant Discovery | <0.02s | Not a chatbot wrapper |
| 4 | Hold + Queue | <0.07s | No inventory freeze |
| 5 | Soft-Bounce Recovery | <0.02s | Zero leaked intent |
| 6 | Contact Protocol | <0.05s | Privacy by architecture |
| 7 | WhatsApp Intent | <0.05s | Controlled communication |
| 8 | State Machine | <0.05s | No edge cases |

---

## Part 6: Sprint Plan

| Phase | Sprints | Tasks | Days | Focus |
|---|---|---|---|---|
| Phase 0: Base Platform | 1-2 | 8 | 22 | Auth, folders, spine, vault |
| Phase 1: Correctness | 3-4 | 8 | 25 | Authority engine, anomalies, publish gating |
| Phase 2: Liquidity | 5-6 | 8 | 23 | Holds, queue, extensions, cooldowns |
| Phase 3: Trust & Close | 7-8 | 8 | 26 | Consent, deal rooms, agreements |
| Phase 4: Leverage | 9-10 | 7 | 18 | Verification, yield, priority |
| Phase 5: External Rails | 11-12 | 6 | 23 | WhatsApp, payments, enterprise API |
| **Total** | **12** | **45** | **137** | **~26 weeks** |

---

## Generated Artifacts (stored in Neon)

All code and documentation is stored in `entrestate_tx.generated_artifacts`:

| Artifact | Type | Purpose |
|---|---|---|
| `mcp_index_ts` | TypeScript | MCP server with 7 database tools |
| `gemini_client_ts` | TypeScript | Gemini Bridge with Entrestate personality |
| `package_json` | JSON | Dependencies |
| `tsconfig_json` | JSON | TypeScript config |
| `env_template` | Config | Environment variables |
| `service_interfaces` | TypeScript | All 13 service interfaces |
| `pitch_ceo_onepager` | Markdown | CEO brief |
| `pitch_cto_architecture` | Markdown | CTO architecture doc |
| `pitch_cfo_roi` | Markdown | CFO ROI calculator |


---

## Related Documents

- **FULL_WORK.md** — This file. Complete Entrestate system documentation.
- **LEASING_INFRASTRUCTURE.md** — Deep dive into the leasing execution layer (formerly Roomentrestate).
- **DEMO_PAGE.md** — Build guide for the 8-step tracer bullet demo page.
- **Pitch Deck** — CEO one-pager, CTO architecture doc, CFO ROI calculator (stored in Neon).
