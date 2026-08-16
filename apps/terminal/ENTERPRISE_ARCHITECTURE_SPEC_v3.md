# Entrestate — Enterprise Real Estate Decision Infrastructure
## Architectural Specification v3.0 | 2026-04-09

> **One-line pitch:** Entrestate is a unified real estate decision and execution infrastructure layer built on one truth system, proper API boundaries, and deterministic workflow control.

> **Audience:** CTO / Head of Engineering at regional portals (Dubizzle, Bayut, PropertyFinder)

> **What this is:** Invisible, headless infrastructure. Not a infrastructure platform. Not a enterprise infrastructure. A licensable decision engine that plugs into your existing portal via typed API endpoints. Zero UI opinions. Your frontend, our brain.

---

## 1. System Invariants

These five rules are inviolable. Every component, every endpoint, every data flow in this system obeys them.

| # | Invariant | Enforcement |
|---|-----------|-------------|
| 1 | **Single Spine Rule** | Every property, transaction, and entity traces to exactly one canonical record in the inventory spine. No shadow tables, no orphan references. |
| 2 | **Double Precision Financials** | All monetary fields are NUMERIC(15,2). No floats. No integer truncation. AED values stored at fils precision. |
| 3 | **Strict Traceability** | Every derived score, signal, and recommendation carries a price_source, evidence_level, and confidence field back to origin data. |
| 4 | **Deterministic Outputs** | The LLM never writes SQL. The LLM never accesses the database. Intent extraction and data retrieval are architecturally separated (see §2). |
| 5 | **Headless by Design** | No end-user UI, no consumer branding, no presentation logic. All interaction via typed JSON API endpoints. The licensee owns their pixels entirely. |

---

## 2. TableSpec JSON — The Zero-Hallucination Contract

This is the answer to the single biggest question every CTO asks about AI integration: *"How do I know the LLM won't hallucinate a property that doesn't exist?"*

### The Problem

LLMs are probabilistic text generators. They predict the next likely token. They don't inherently care about factual accuracy. In real estate, a hallucinated property at the wrong price point can trigger million-dollar decisions based on data that doesn't exist.

### The Solution: Strict Schema Constraint

Instead of allowing the LLM to generate raw SQL or free-text responses, Entrestate forces all AI output through a **TableSpec JSON schema** — a strictly typed contract that defines exactly which columns, types, and ranges the AI is permitted to reference.

```typescript
// The AI's ONLY permitted output format
interface TableSpec {
  intent: "screen" | "compare" | "memo" | "area_intel";
  parameters: {
    bedrooms?: number;
    area?: string;
    city?: "Dubai" | "Abu Dhabi" | "RAK";
    price_min?: number;
    price_max?: number;
    property_type?: "apartment" | "villa" | "townhouse";
    golden_visa?: boolean;
  };
  requested_columns: string[];  // Must exist in column registry
  sort_by?: string;             // Must exist in column registry
  limit?: number;               // Max 100
}
```

**Why this matters:**
- The AI **cannot invent columns** — every requested_column is validated against the column registry
- The AI **cannot write SQL** — parameters are passed to pre-built parameterized queries
- The AI **cannot fabricate data** — results come exclusively from the verified PostgreSQL spine
- The AI **cannot join arbitrary tables** — query templates are pre-defined and audited

### The Hallucination Boundary

```
CLIENT QUERY (natural language)
        │
        ▼
┌──────────────────────┐
│  LAYER 1: LLM INTENT  │
│  EXTRACTION (Gemini)   │
│                        │
│  Output: TableSpec     │
│  JSON only.            │
│                        │
│  ⚠ CANNOT write SQL    │
│  ⚠ CANNOT access DB    │
│  ⚠ CANNOT invent data  │
└──────────┬─────────────┘
           │
═══════════╪═══════════  ← HALLUCINATION BOUNDARY
           │
┌──────────▼─────────────┐
│  LAYER 2: DETERMINISTIC │
│  SQL EXECUTION ENGINE    │
│                          │
│  Validates TableSpec     │
│  against column registry.│
│  Executes parameterized  │
│  query. Returns facts.   │
└──────────┬───────────────┘
           │
┌──────────▼─────────────┐
│  EVIDENCE DRAWER        │
│                         │
│  Every result includes: │
│  · source_authority     │
│  · confidence (0-1)     │
│  · evidence_level (A-D) │
│  · data_sources[]       │
│  · last_verified_at     │
└─────────────────────────┘
```

**Key guarantee:** The LLM is limited to producing a structured TableSpec. It never touches the database. Layer 2 validates the spec, executes a pre-built query, and returns 100% factual results with full provenance.

### MCP Orchestration Protocol

The Model Context Protocol (MCP) standardizes the interface between the LLM and the execution engine. Each tool accepts typed parameters and returns deterministic results:

| MCP Tool | Input Parameters | Output |
|----------|-----------------|--------|
| search_mapped_city | TableSpec JSON | Ranked project list with evidence |
| get_sdr_detail | SDR ID (UUID) | Full deal room state + audit trail |
| request_primary_hold | tenant_id, unit_id, duration | Hold confirmation or collision alert |
| check_consent_overlap | tenant_id | Consent graph with Sybil score |
| classify_intent | raw_text (string) | Typed intent + confidence score |
| attempt_publish | sdr_id | Publication result or guard failure |
| get_queue_status | sdr_id | Queue position + ETA |
| request_anomaly_evidence | dispute_id | Evidence packet for collision resolution |

---

## 3. The Decision Tunnel — End-to-End Pipeline

Every query flows through six deterministic stages:

```
SENSOR NETWORK → INTENT EXTRACTION → TABLE SPEC → ENGINE ROOM → VERDICT → EVIDENCE STORE
```

### Stage 1: Sensor Network (Data Ingestion)
Multi-source ingestion from UAE real estate authorities and portals:

| Source | Records | Purpose |
|--------|---------|---------|
| PropertyFinder | 2,813 verified projects | Canonical inventory spine |
| Bayut | 41,381 listings (100% geocoded) | Rental benchmarks + coverage |
| Dubai Land Department | 36,841 transactions | Sales velocity + price truth |
| Developer Registry | 481 developers | Reliability scoring + tier classification |
| Area Benchmarks | 275 area profiles | Yield + stress baselines |

### Stage 2: Intent Extraction
The LLM parses natural language into a TableSpec JSON (see §2). No SQL generation. No database access.

### Stage 3: Table Spec Validation
The execution engine validates every field in the TableSpec against the column registry. Invalid columns, impossible ranges, or unauthorized fields are rejected before any query executes.

### Stage 4: Engine Room — V1 Signal Engine
Four independent scoring dimensions, each computed from real data:

| Score | Range | Sources | What It Measures |
|-------|-------|---------|-----------------|
| **Timing** | 0-100 | DLD velocity, completion dates, sales phase | Is now the right time to act? |
| **Stress** | A-F grade | Price-to-income, vacancy, supply pipeline | How resilient is this asset? |
| **Yield** | 0-100 | Rental benchmarks, area medians, vacancy adjustment | What's the real return? |
| **Evidence** | 0-100 | Source count, data freshness, cross-referencing | How trustworthy is this score? |

**Coverage: 100% of the canonical spine.** Every project has all four scores.

### Stage 5: Verdict
Deterministic recommendation logic:

```
BUY  — Score >= 70, Stress <= C, Evidence >= 60
HOLD — Score 50-69 OR Stress = D
WAIT — Score < 50 OR Stress >= E OR Evidence < 40
```

### Stage 6: Evidence Store
Every verdict is persisted with full provenance:

```json
{
  "verdict": "BUY",
  "confidence": 0.84,
  "evidence_level": "A",
  "sources": ["DLD", "PF", "Bayut"],
  "timing_score": 78,
  "stress_grade": "B",
  "yield_score": 72,
  "evidence_score": 91,
  "drivers": {
    "positive": ["Strong DLD velocity (+23% QoQ)", "Below area median price"],
    "negative": ["Developer tier: B (not A)"]
  },
  "computed_at": "2026-04-09T00:00:00Z"
}
```

---

## 4. Sybil Firewall — Transaction Integrity

### Problem
Bad actors create fake broker accounts to flood listings, manipulate pricing signals, and spoof demand data. This is endemic in UAE real estate.

### Solution
Telemetry-based anomaly detection protecting the integrity of all Structured Deal Rooms:

| Detection Method | Signal | Automated Action |
|-----------------|--------|-----------------|
| **Genome Similarity** | pgvector cosine distance < 0.15 | Flag as potential duplicate |
| **Velocity Anomaly** | > 5 holds from same device fingerprint in 1h | Rate limit + evidence request |
| **Consent Graph** | Circular consent patterns across SDRs | Auto-escalate to collision_disputed |
| **Network Hash** | Behavioral telemetry + device fingerprint | Sybil confidence score (0-1) |

### Self-Serve Dispute Resolution (No Human Moderator)

```
POST /api/execution/dispute/evidence
  Input:  { dispute_id: UUID }
  Output: { genome_vectors, consent_graph, timing_data, sybil_score }

POST /api/execution/dispute/resolve
  Input:  { dispute_id: UUID, resolution: "accept" | "reject", justification: string }
  Output: { new_state, audit_trail_entry }
```

72-hour auto-expire if no resolution action taken. Zero human intervention in the critical path.

---

## 5. Structured Deal Room (SDR) — Execution Layer

The SDR is the transactional primitive. A cryptographically auditable deal execution environment with deterministic state transitions. **This is a backend state machine, not a user interface.**

### State Machine (Database-Level)

```
DRAFT -> REVIEW_NEEDED -> READY -> PUBLISHED -> HELD -> RENTED | CANCELLED
                                      |
                              COLLISION_DISPUTED -> RESOLVED | EXPIRED
```

25 total state transitions, each enforced by Transition Guard expressions evaluated at the database level.

### Transition Guards (6 Formal Expressions)

| Transition | Guard Expression | Enforcement |
|-----------|-----------------|-------------|
| DRAFT -> REVIEW_NEEDED | has_minimum_fields AND price_within_range | Row-level check |
| READY -> PUBLISHED | all_required_docs AND landlord_consent | Foreign key constraint |
| PUBLISHED -> HELD | no_active_hold AND tenant_verified | Exclusive row lock |
| HELD -> RENTED | hold_not_expired AND deposit_confirmed | Temporal constraint |
| * -> COLLISION_DISPUTED | sybil_score > 0.7 OR manual_flag | Telemetry trigger |
| COLLISION_DISPUTED -> RESOLVED | evidence_reviewed AND resolution_action_taken | Audit trail required |

### Hold Mechanism (Headless API)

```
POST /api/execution/hold
  Input: {
    sdr_id: UUID,
    tenant_id: UUID,
    hold_type: "inquiry" | "viewing" | "decision" | "contract",
    // Duration is determined by hold_type configuration, not by the client
  }
  Output: {
    hold_id: UUID,
    expires_at: ISO8601,
    queue_position: number | null,
    // No UI components. No carousels. No visual elements.
  }
```

| Hold Type | Duration | Auto-Expire | Extension Limit |
|-----------|----------|-------------|-----------------|
| Inquiry | 2 hours | Yes | 0 |
| Viewing | 12 hours | Yes | 1 |
| Decision | 24 hours | Yes | 2 |
| Contract | 48 hours | Yes | 1 |

The licensee decides how to present hold status to their users. Entrestate enforces timing, exclusivity, and queue ranking at the database level using row-level locks.

### Contact Reveal (Permission-Based Handshake Protocol)

```
POST /api/execution/consent/reveal
  Input: {
    sdr_id: UUID,
    requesting_party: UUID,
    scope: "phone" | "email" | "full_contact"
  }
  Output: {
    granted: boolean,
    contact_data: { ... } | null,
    consent_token: UUID,        // Audit trail reference
    expires_at: ISO8601
  }
```

The reveal mechanism is a **cryptographic consent handshake**, not a API endpoint click. Both parties must have active consent tokens. The API manages verification, token exchange, and audit logging. No visual flow is prescribed.

### Yield Nudge System

```
POST /api/execution/yield/evaluate
  Input: {
    sdr_id: UUID,
    strategy: "price" | "lease_term" | "payment_method" | "deposit"
  }
  Output: {
    recommended_adjustment: number,
    rera_cap: number,          // RERA rent index ceiling
    confidence: number,
    rationale: string
  }
```

Per-SDR opt-in. RERA-compliant. All evaluations logged to the audit trail.

---

## 6. pgvector Genome Engine — Semantic Intelligence

Every property is encoded as a 5-dimensional genome vector, enabling similarity search that goes beyond keyword matching:

| Dimension | Source | Range |
|-----------|--------|-------|
| Transit | Distance to metro/bus | 0-1 |
| Luxury | Amenity density, developer tier | 0-1 |
| Age | Years since/until completion | 0-1 |
| Price | Normalized against area median | 0-1 |
| Walkability | POI density, street connectivity | 0-1 |

### Headless Capabilities

| Operation | Endpoint | Latency Target |
|-----------|----------|----------------|
| **Similarity Search** | GET /api/intel/genome/similar/:id | < 50ms |
| **Soft-Bounce Recovery** | GET /api/intel/genome/alternatives/:id | < 100ms |
| **Collision Detection** | POST /api/intel/genome/detect-collision | < 50ms |
| **Portfolio Clustering** | POST /api/intel/genome/cluster | Batch (nightly) |

All results returned as JSON arrays with genome vectors and cosine distances. No visual components. The licensee builds their own comparison UI, recommendation cards, or portfolio views using raw genome data.

---

## 7. Enterprise API Surface — Complete Endpoint Registry

### 7.1 Decision API

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| /api/decision/screen | POST | TableSpec JSON | Ranked projects + evidence |
| /api/decision/project/:id | GET | Project UUID | Full intelligence package |
| /api/decision/compare | POST | Array of project UUIDs | Delta analysis matrix |
| /api/decision/area/:slug | GET | Area slug | Area intelligence + benchmarks |
| /api/decision/memo | POST | Project UUID + investor profile | Investment memo (structured JSON) |

### 7.2 Execution API

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| /api/execution/sdr/create | POST | Property + landlord params | SDR UUID + initial state |
| /api/execution/sdr/:id | GET | SDR UUID | Full state + audit trail |
| /api/execution/hold | POST | SDR + tenant + hold_type | Hold confirmation + queue position |
| /api/execution/publish | POST | SDR UUID | State transition result |
| /api/execution/consent/reveal | POST | SDR + party + scope | Contact data or rejection |
| /api/execution/yield/evaluate | POST | SDR + strategy | RERA-compliant recommendation |
| /api/execution/dispute/evidence | POST | Dispute UUID | Evidence packet |

### 7.3 Market Data API

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| /api/market/dld/feed | GET | date_from, area (optional) | DLD transaction feed |
| /api/market/pulse | GET | area (optional) | Velocity, volume, trend signals |
| /api/market/benchmarks/:area | GET | Area slug | Price + yield + stress baselines |

### 7.4 Intelligence API

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| /api/intel/developers | GET | tier, area (optional) | Developer registry with scores |
| /api/intel/areas | GET | city (optional) | Area profiles with signals |
| /api/intel/genome/similar/:id | GET | Project UUID | Genome-similar properties |

### 7.5 Configuration API (Licensee-Controlled)

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| /api/config/prompt | PUT | System prompt JSON | Updated AI behavior params |
| /api/config/hold-types | PUT | Duration + extension config | Updated hold type rules |
| /api/config/brand | PUT | Brand voice parameters | Updated configurable tone |

The Configuration API allows the licensee to inject their own brand voice, adjust hold durations, and customize AI behavior through structured JSON payloads — without modifying Entrestate core code.

---

## 8. Separated Data Platform

### Schema Architecture

| Schema | Purpose | Key Assets |
|--------|---------|------------|
| raw | Unprocessed ingestion | Bayut listings, DLD transactions, media |
| canonical | Single source of truth | inventory_clean, developer_registry |
| api | Materialized views for endpoints | 11 pre-computed API views |
| execution | SDR state machine + workflow | 44 tables, 11 PL/pgSQL functions |

### Data Lineage

```
RAW SOURCES                    CANONICAL SPINE              API VIEWS
PropertyFinder (2,813) --+
Bayut (41,381)     ------+---> inventory_clean ----------> projects_api
DLD (36,841)       ------+     developer_registry -------> developers_api
Developer CDN      ------+     area_benchmarks ----------> areas_api
                               dld_transactions ---------> market_pulse_api
```

---

## 9. Product Architecture — Two Distinct Lines

Entrestate ships as two complementary but independently documented product lines:

### 9.1 Entrestate Core Infrastructure (This Document)

The headless decision and execution engine. Target buyer: CTO / Head of Engineering.

| Module | Status | Description |
|--------|--------|-------------|
| **Truth Layer** | Production | Single-spine data architecture with full provenance |
| **Decision Engine** | Production | V1 Signal Engine (4 scores, 100% coverage) |
| **Collision Engine** | Production | Sybil firewall + self-serve dispute resolution |
| **Transaction Engine** | Production | SDR state machine with 25 transitions |
| **Contract Engine** | Production | Hold types, consent protocol, yield optimization |
| **Execution API** | Production | 15+ endpoints across 5 modules |
| **Evidence Layer** | Production | Evidence drawer with source attribution |
| **Recovery Engine** | Production | Soft-bounce via pgvector genome similarity |
| **Trust Protocol** | Production | Hallucination boundary + TableSpec + MCP orchestration |
| **Genome Engine** | Production | pgvector similarity search + collision detection |
| **Liquidity Manager** | Production | RERA-compliant yield optimization |

### 9.2 Entrestate Professional Suite (Separate Document)

Micro-SaaS tools for individual brokers and analysts. Target buyer: individual contributor.

**Strategic function: Decentralized Sensor Network.** Thousands of brokers using Professional Suite tools continuously validate data schemas, train AI models, and refine TableSpec outputs. This is why Core Infrastructure data is so reliable — it's constantly battle-tested by real market participants.

| Tool | Price | Sensor Function |
|------|-------|-----------------|
| Report Builder | AED 49/mo | Validates scoring accuracy via broker feedback loops |
| Market Screener | AED 99/mo | Tests TableSpec query coverage against real search patterns |
| Ads Creator | AED 149/mo | Validates media + listing data completeness |
| Excel Builder | AED 199/mo | Stress-tests column registry via custom data exports |
| Portfolio Tracker | AED 499/mo | Validates genome similarity via real portfolio behavior |
| Investment Memo | AED 999/mo | End-to-end Decision Tunnel validation |

**For the enterprise buyer:** Your data quality guarantee comes from this sensor network. These aren't consumer toys — they're distributed QA agents generating millions of validation events per month against the same infrastructure you're licensing.

*Professional Suite documentation is maintained as a separate specification and is not included in this document.*

---

## 10. Integration Architecture

### For the Licensee CTO

```
YOUR PORTAL (Dubizzle / Bayut / PropertyFinder)
    |
    +-- Your Frontend (UNCHANGED — you own every pixel)
    +-- Your Auth System (UNCHANGED)
    +-- Your User Database (UNCHANGED)
    +-- Your A/B Testing (UNCHANGED)
    +-- Your Analytics (UNCHANGED)
    |
    +-- Entrestate API Layer  <-- NEW (headless, JSON only)
         |
         +-- Decision endpoints (screen, compare, memo)
         +-- Execution endpoints (SDR lifecycle, holds, consent)
         +-- Market data endpoints (DLD feed, pulse, benchmarks)
         +-- Intelligence endpoints (genome search, developer registry)
         +-- Configuration endpoints (brand voice, hold rules, AI params)
```

**What changes for you:** Nothing on the frontend. Nothing in your user flows. Nothing in your analytics stack. You add API calls to Entrestate endpoints where you currently have manual processes or no intelligence layer.

**What you get:**
- Institutional-grade investment scoring on every listing
- DLD-backed transaction intelligence
- Deterministic deal room management with audit trails
- Sybil-protected transaction integrity
- RERA-compliant yield optimization
- Full control over presentation, delivery channels, and user experience

**What you DON'T get (by design):**
- No pre-built UI components
- No embedded widgets
- No opinionated design patterns
- No delivery channel assumptions (WhatsApp, email, push — your choice)

---

## 11. Reference Implementations (Supplementary)

The following delivery integrations are available as optional reference implementations. They demonstrate how to connect Entrestate API endpoints to specific channels. **They are not part of the core specification.**

| Integration | Type | Location |
|-------------|------|----------|
| WhatsApp Action Sessions | Webhook adapter | /docs/reference/whatsapp-adapter |
| Email Notification Bridge | Event subscriber | /docs/reference/email-bridge |
| Push Notification Relay | Event subscriber | /docs/reference/push-relay |
| Slack / Teams Bot | MCP client | /docs/reference/chat-bot-adapter |

Each reference implementation consumes standard Entrestate API endpoints. The licensee can use them as-is, modify them, or build entirely custom delivery mechanisms.

---

## 12. Phase 2 Roadmap — Enterprise Readiness

| Milestone | Target | Description |
|-----------|--------|-------------|
| SOC 2 Certification | Q3 2026 | Type II audit in progress |
| Peer-Gating Middleware | Q2 2026 | Rate limiting + API key management per licensee |
| Search Index Optimization | Q2 2026 | Sub-10ms response on full inventory queries |
| Multi-Tenant Isolation | Q3 2026 | Schema-level data separation per licensee |
| Inventory Spine Reconciliation | Q2 2026 | Automated parity checks between raw and canonical layers |
| Abu Dhabi + RAK Expansion | Q2 2026 | Full geographic coverage beyond Dubai |
| Professional Suite v2 | Q3 2026 | Enhanced sensor network with automated QA pipelines |

---

## 13. ROI Model

| Pain Point (Current State) | Entrestate Solution | Estimated Annual Impact |
|---------------------------|--------------------|-----------------------|
| Manual listing verification | Automated truth layer | -60% ops cost |
| No investment intelligence | V1 Signal Engine on every listing | +15% premium user engagement |
| Fraud/duplicate listings | Sybil firewall + genome dedup | -40% fraud incidents |
| No DLD integration | Real-time transaction feed | New revenue stream (data licensing) |
| Manual deal management | SDR state machine | -70% transaction ops time |
| No yield optimization | RERA-compliant nudge engine | +8% avg. yield per unit |
| Hallucination risk from AI | TableSpec + hallucination boundary | Zero hallucination incidents |
| Custom UI development | Headless API (zero UI opinions) | -100% frontend rework cost |

---

## Appendix A: Database Schema Registry

*Full column registries and table definitions are maintained in the Technical Appendix (separate document). Summary counts:*

| Layer | Tables | Total Columns | Indexes |
|-------|--------|---------------|---------|
| Raw | 8 | ~180 | 12 |
| Canonical | 5 | ~155 | 18 |
| API Views | 11 | ~90 | -- |
| Execution (SDR) | 44 | ~320 | 35 |
| **Total** | **68** | **~745** | **65** |

## Appendix B: Sprint Plan Summary

12 sprints across 6 phases. 45 tasks. 137 engineer-days estimated.

## Appendix C: Pitch Materials

- CEO One-Pager: Business case and market positioning
- CTO Architecture Doc: This document
- CFO ROI Calculator: Quantified pain-point resolution model

---

*This specification describes the current production state of the Entrestate Decision Infrastructure. All data counts are live figures from the Neon PostgreSQL deployment. All scores are computed, not projected. No consumer workflows, UI components, or presentation logic are included in this system.*
