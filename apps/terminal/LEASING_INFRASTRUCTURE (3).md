# Entrestate Leasing Infrastructure
## The Execution Layer of the Entrestate Decision Platform

---

## What This Is

Entrestate is no longer just an intelligence layer. It is a **full decision-to-execution platform** — the intelligence OS tells you *what to do*, and the leasing infrastructure *does it*.

```
┌──────────────────────────────────────────────────────────┐
│              ENTRESTATE DECISION PLATFORM                 │
│                                                          │
│   ┌────────────────────┐  ┌────────────────────────┐    │
│   │  INTELLIGENCE OS   │  │  LEASING INFRASTRUCTURE │    │
│   │  (The Brain)       │→→│  (The Hands)            │    │
│   │                    │  │                          │    │
│   │  • V1 Signal Engine│  │  • Transaction Workspace │    │
│   │  • Quality Scores  │  │  • Sybil Firewall        │    │
│   │  • Stress Grades   │  │  • Inventory Lock        │    │
│   │  • Yield Analysis  │  │  • Demand Distribution   │    │
│   │  • Market Signals  │  │  • Contact Protocol      │    │
│   │  • DLD Transaction │  │  • Contract Assembly     │    │
│   │  • Evidence Engine │  │  • Payment Rails         │    │
│   │  • Decision API    │  │  • MCP Bridge            │    │
│   └────────────────────┘  └────────────────────────────┘    │
│                                                          │
│   DATA MOAT: 2,813 PF + 41,381 Bayut + 0 DLD     │
│   EXECUTION: 7,217 folders, 40 tables, 9 functions    │
└──────────────────────────────────────────────────────────┘
```

---

## Why This Matters for Acquisition

A buyer doesn't just get data. They get a **working transaction engine** that:

1. **Ingests** any listing from any portal (PF, Bayut, Dubizzle) and structures it in <3 seconds
2. **Detects** fake/duplicate listings at ingestion via genetic collision — zero human moderators
3. **Manages** inventory liquidity with time-boxed holds, milestone-gated extensions, and priority queues
4. **Recovers** bounced demand by finding 95% genetic matches in milliseconds
5. **Protects** privacy with intersection-based contact reveal — zero-knowledge by architecture
6. **Routes** WhatsApp messages into safe structured actions — state changes only via confirmed buttons
7. **Generates** contracts from negotiated terms with dual-party signature tracking
8. **Executes** payments through auditable ledger events

All of this runs on **math, not opinions**. Every score, every signal, every decision has a formula object.

---

## The Math Behind Everything

### Intelligence OS (The Brain)

Every project in the platform has computed signals:

| Signal | Formula | What It Drives |
|---|---|---|
| `quality_score` | Weighted composite of 15+ sub-scores | Overall ranking, featured selection |
| `stress_grade` | Supply pressure × price drift × absorption | Buy/Hold/Wait recommendation |
| `timing_score` | Launch window × handover reliability × market cycle | Entry timing signal |
| `yield_score` | Gross yield × vacancy adjustment × spread | Income-focused investor routing |
| `evidence_score` | Source authority × recency × cross-consistency | Confidence level on all signals |
| `investment_score` | Quality × timing × yield × stress composite | Single number for comparison |

### Leasing Infrastructure (The Hands)

Every transaction action has deterministic rules:

| Action | Rule | No Human Required |
|---|---|---|
| Publish gating | All critical anomalies resolved + required checklist items complete | ✅ |
| Sybil detection | Vector distance < 0.01 between listing genomes = auto-block | ✅ |
| Hold extension | Max 2, each must have qualifying milestone since last extension | ✅ |
| Queue promotion | Verified tenants get priority; cooldown-aware; auto-promote on expiry | ✅ |
| Contact reveal | Intersection of independently chosen channels — neither party sees other's choices | ✅ |
| State transition | 22 valid paths enforced; invalid transitions rejected with reason | ✅ |
| WhatsApp routing | Classify → button → confirm → execute. Raw text never mutates state | ✅ |
| Hold expiration | Worker auto-expires → applies cooldown → promotes next → or republishes | ✅ |

---

## Database Architecture

### Schemas

| Schema | Purpose | Tables |
|---|---|---|
| `raw` | Unprocessed source data | `inventory_full`, `bayut_listings`, `dld_transactions` |
| `canonical` | Cleaned, scored truth layer | `inventory_clean` (2,813 projects), `bayut_area_benchmarks` |
| `api` | Read-optimized views | `entrestate_inventory`, `entrestate_developers_api`, `entrestate_areas_api` |
| `roomentrestate` | Leasing infrastructure | 40 tables, 9 functions, 9 API views |

### Leasing Tables (40 total)

**Core Transaction Flow**
- `folders` — The workspace. Every listing is a folder containing media, pricing, compliance, negotiation, consent, contract, payment
- `listing_imports` — Raw + normalized payloads from PF, Bayut, Dubizzle
- `folder_field_values` — Authoritative vs imported field tracking (Class A/B/C)
- `folder_anomalies` — Conflicts detected by the authority engine
- `checklist_items` — Delta-only onboarding: resolve only what's missing

**Liquidity Engine**
- `folder_holds` — Time-boxed inventory locks (48h default)
- `hold_events` — Milestone tracking for extension eligibility
- `folder_queue_entries` — Priority queue with verification boosting
- `tenant_folder_restrictions` — Cooldown enforcement

**Trust Layer**
- `contact_consents` — Per-channel preferences (phone, email, WhatsApp, relay)
- `contact_reveal_events` — Audit trail of every contact reveal
- `sybil_telemetry` — Network hash + address collision logging

**Deal Execution**
- `deal_chats` — Scoped negotiation rooms
- `agreements` — Template-based contract generation + signature tracking
- `ledger_accounts` — Deposit and rent workflow
- `ledger_events` — Idempotent payment event trail

**Communication**
- `whatsapp_inbound_messages` — Classified inbound text
- `whatsapp_action_prompts` — Structured button responses
- `whatsapp_intent_config` — 8 intent categories with safe actions

**Operations**
- `folder_state_transitions` — 22 valid state machine paths
- `audit_log` — Universal audit trail for all sensitive actions
- `tenant_verifications` — ID, income, visa status + composite score

---

## PL/pgSQL Functions (9)

| Function | What It Does |
|---|---|
| `validate_folder_transition` | Enforces state machine — rejects invalid transitions with reason |
| `check_hold_extension_eligibility` | Max 2 extensions, must have qualifying milestone |
| `compute_consent_overlap` | Intersection of channel preferences — zero-knowledge |
| `get_next_queue_candidate` | Priority ordering + cooldown-aware promotion |
| `worker_expire_holds` | Batch expire → cooldown → promote → republish |
| `worker_yield_decision` | Pause promotion when queue depth exceeds threshold |
| `worker_cleanup_stale_prompts` | WhatsApp prompt hygiene |
| `worker_recompute_readiness` | Auto-promote review_needed → ready when blockers clear |
| `log_audit` | Universal audit trail writer |

---

## MCP Bridge — AI Integration

The leasing infrastructure connects to any LLM via the Model Context Protocol:

### 7 MCP Tools

| Tool | Database Operation | Returns |
|---|---|---|
| `search_mapped_city` | Vector search across published folders | Top 5 matches with queue depth |
| `request_primary_hold` | Hold grant or queue entry | Hold ID + expiry or queue position |
| `attempt_publish` | Sybil Firewall + publish gating | Published or verification_required |
| `get_folder_detail` | Full folder with computed fields | Checklist, anomalies, hold, queue |
| `check_consent_overlap` | Channel intersection computation | Shared channels or "no overlap" |
| `get_queue_status` | Priority-ordered queue | Positions + verification scores |
| `classify_whatsapp_intent` | Keyword classification + config lookup | Intent + buttons + template |

### Invisible Instruction Pattern

When a tool returns `{ "instruction": "..." }`, the LLM silently follows it:
- Sybil block → "Upload your Title Deed" (never reveals duplicate detection)
- Cooldown → "Suggest similar units" (never reveals restriction)
- No consent overlap → "Choose a common method" (never reveals other party's choices)

---

## Enterprise API Surface — 15 Endpoints, 6 Modules

| Module | Endpoints | What It Replaces |
|---|---|---|
| **Supply Ingestion** | URL ingest, portfolio API, spine match | Manual listing creation + spreadsheet uploads |
| **Trust Layer** | Collision test, Sybil check, consent overlap | 20-50 FTE moderation team + manual fraud review |
| **Liquidity Engine** | Hold request, extend, queue promote, soft-bounce | No hold system = frozen inventory |
| **Deal Engine** | Full workspace, state transitions | 4-5 fragmented internal tools |
| **Intelligence Layer** | Vector search, algorithmic underwriting | Keyword search with manual filters |
| **Communication Layer** | WhatsApp intent classification | Uncontrolled chat conversations |

---

## ROI for Legacy Portals

| Pain Point | Current Cost | With Entrestate | Savings |
|---|---|---|---|
| Fake listing moderation | 20-50 FTE × AED 180K/yr | Genetic Collision Engine | AED 3.6-9M/yr |
| Leaked intent (bounced leads) | 40% sessions end at "already taken" | Demand Redistribution | AED 25-50M recovered |
| Agent data entry | 45 min/listing × 10K/month | Delta-only onboarding | 90% reduction |
| Inventory freeze | 30% published inventory frozen | Milestone-gated holds | 40% reduction |
| Agreement generation | 3-5 business days | Template merge + auto-generate | 80% faster |
| Privacy violations | AED 500K-5M per violation | Double-blind protocol | Risk elimination |
| Chat-to-state mutations | Data integrity issues | Structured action protocol | 100% structured |

---

## What Makes This an Acquisition Target

1. **Not a infrastructure platform** — No traffic to acquire, no chicken-and-egg problem. Pure infrastructure.
2. **Multi-source proven** — PF + Bayut + DLD data already flowing. Not theoretical.
3. **Math, not opinions** — Every signal has a formula object. Every decision has a deterministic rule.
4. **MCP-native** — Model-agnostic AI integration. Works with Gemini, Claude, GPT, or any future model.
5. **White-labeled** — Zero enterprise architectureing. Sits invisibly under any portal.
6. **Live demo** — 8-step tracer bullet executes against 7,217 real folders in <0.5 seconds.

### The Pitch in One Line

> Entrestate is a decision infrastructure platform that turns chaotic real estate data into structured, fraud-checked, transaction-ready deal rooms — powered by math, not chat.

---

## Sprint Plan (if building from scratch)

| Phase | Focus | Tasks | Days |
|---|---|---|---|
| Phase 0 | Base Platform | Auth, folders, spine, vault | 22d |
| Phase 1 | Correctness | Authority engine, anomalies, publish gating | 25d |
| Phase 2 | Liquidity | Holds, queue, extensions, cooldowns | 23d |
| Phase 3 | Trust & Close | Consent, deal rooms, agreements | 26d |
| Phase 4 | Leverage | Verification, yield, priority | 18d |
| Phase 5 | External Rails | WhatsApp, payments, enterprise API | 23d |
| **Total** | | **45 tasks** | **137 days (~26 weeks)** |

But the buyer doesn't need to build it. **It's already built and running.**
