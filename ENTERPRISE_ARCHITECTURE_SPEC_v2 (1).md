# Entrestate — Enterprise Real Estate Decision Infrastructure
## Architectural Specification v2.0 | 2026-04-08

> **One-line pitch:** Entrestate is a unified real estate decision and execution infrastructure layer built on one truth system, proper API boundaries, and deterministic workflow control.

> **Audience:** CTO / Head of Engineering at regional portals (Dubizzle, Bayut, PropertyFinder)

> **What this is:** Invisible infrastructure. Not a infrastructure platform. Not a enterprise infrastructure. A licensable decision engine that plugs into your existing portal via API.

---

## 1. System Invariants

These five rules are inviolable. Every component, every endpoint, every data flow in this system obeys them.

| # | Invariant | Enforcement |
|---|-----------|-------------|
| 1 | **Single Spine Rule** | Every property, transaction, and entity traces to exactly one canonical record in the inventory spine. No shadow tables, no orphan references. |
| 2 | **Double Precision Financials** | All monetary fields are NUMERIC(15,2). No floats. No integer truncation. AED values stored at fils precision. |
| 3 | **Strict Traceability** | Every derived score, signal, and recommendation carries a price_source, evidence_level, and confidence field back to its origin data. |
| 4 | **Deterministic Outputs** | The LLM never writes SQL. The LLM never accesses the database. Intent extraction and data retrieval are architecturally separated (see §2). |
| 5 | **Zero Consumer Surface** | No end-user UI, no tenant accounts, no consumer branding. All interaction via typed API endpoints consumed by the licensee's frontend. |

---

## 2. The Hallucination Boundary — Core Trust Architecture

This is the answer to the single biggest question every CTO asks about AI integration: *"How do I know the LLM won't hallucinate a property that doesn't exist?"*

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT REQUEST                     │
│         "3BR in Dubai Marina under 2M AED"           │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │    LAYER 1: LLM INTENT   │
          │    EXTRACTION (Gemini)    │
          │                          │
          │  Extracts strictly typed  │
          │  parameters:              │
          │  · bedrooms: 3           │
          │  · area: "Dubai Marina"  │
          │  · price_max: 2000000    │
          │  · currency: "AED"       │
          │                          │
          │  ⚠ CANNOT write SQL      │
          │  ⚠ CANNOT access DB      │
          │  ⚠ CANNOT invent data    │
          └────────────┬────────────┘
                       │
          ═════════════╪═════════════  ← HALLUCINATION BOUNDARY
                       │
          ┌────────────▼────────────┐
          │   LAYER 2: DETERMINISTIC │
          │   SQL EXECUTION ENGINE   │
          │                          │
          │  Parameterized queries   │
          │  against PostgreSQL.     │
          │  100% factual results.   │
          │  Zero hallucination risk.│
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │   EVIDENCE DRAWER        │
          │                          │
          │  Every result includes:  │
          │  · source_authority      │
          │  · confidence (0-1)      │
          │  · evidence_level (A-D)  │
          │  · data_sources[]        │
          │  · last_verified_at      │
          └──────────────────────────┘
```

**Key guarantee:** The LLM is limited to intent extraction — converting messy human language into typed parameters. It never touches the database. Layer 2 executes pre-built parameterized queries against verified data. The result is **zero hallucination risk** with full natural language flexibility.

### MCP Orchestration Protocol

The Model Context Protocol (MCP) standardizes the interface between the LLM and the execution engine:

| MCP Tool | Input | Output |
|----------|-------|--------|
| search_mapped_city | Intent parameters | Ranked project list with evidence |
| get_folder_detail | SDR ID | Full deal room state + audit trail |
| request_primary_hold | Tenant + Unit | Hold confirmation or collision alert |
| check_consent_overlap | Tenant ID | Consent graph with Sybil score |
| classify_whatsapp_intent | Raw message text | Typed intent + confidence score |
| attempt_publish | Folder ID | Publication result or guard failure |
| get_queue_status | Folder ID | Queue position + ETA |
| request_anomaly_evidence | Dispute ID | Evidence packet for collision resolution |

---

## 3. The Decision Tunnel — End-to-End Pipeline

Every query flows through six deterministic stages:

```
SENSOR NETWORK → INTENT EXTRACTION → TABLE SPEC → ENGINE ROOM → VERDICT → EVIDENCE STORE
```

### Stage 1: Sensor Network (Data Ingestion)
- **2,813 PF-verified projects** in the canonical spine
- **41,381 Bayut listings** with 100% geocoverage (lat/lng)
- **36,841 DLD transactions** (Dubai Land Department — real sales data)
- **481 developers** in a tiered registry with logos, project counts, reliability scores
- **275 area benchmarks** from Bayut market data

### Stage 2: Intent Extraction
The LLM (Gemini) parses the user's natural language query into a typed IntentSpec:

```typescript
interface IntentSpec {
  bedrooms?: number;
  area?: string;
  city?: "Dubai" | "Abu Dhabi" | "RAK";
  price_min?: number;
  price_max?: number;
  property_type?: "apartment" | "villa" | "townhouse";
  intent?: "buy" | "hold" | "compare" | "screen";
  golden_visa?: boolean;
}
```

### Stage 3: Table Spec Generation
The intent maps to a pre-defined query template. No dynamic SQL generation. The system selects from a registry of parameterized queries based on the intent type.

### Stage 4: Engine Room — V1 Signal Engine
Four independent scoring dimensions, each computed from real data:

| Score | Range | Sources | What It Measures |
|-------|-------|---------|-----------------|
| **Timing** | 0–100 | DLD velocity, completion dates, sales phase | Is now the right time to buy? |
| **Stress** | A–F grade | Price-to-income, vacancy, supply pipeline | How resilient is this investment? |
| **Yield** | 0–100 | Rental benchmarks, area medians, vacancy adjustment | What's the real return? |
| **Evidence** | 0–100 | Source count, data freshness, cross-referencing | How trustworthy is this score? |

**Coverage: 100% of the canonical spine.** Every project has all four scores computed.

### Stage 5: Verdict
The engine produces a deterministic recommendation:

```
BUY  — Score >= 70, Stress <= C, Evidence >= 60
HOLD — Score 50-69 OR Stress = D
WAIT — Score < 50 OR Stress >= E OR Evidence < 40
```

### Stage 6: Evidence Store
Every verdict is stored with full provenance:

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
  "computed_at": "2026-04-08T00:00:00Z"
}
```

---

## 4. Sybil Firewall — Transaction Integrity

### Problem
In real estate markets, bad actors create fake broker accounts to flood listings, manipulate pricing signals, and spoof demand data.

### Solution
The Sybil Firewall is a telemetry-based anomaly detection layer that protects the integrity of Structured Deal Rooms (SDRs):

| Detection Method | Signal | Action |
|-----------------|--------|--------|
| **Genome Similarity** | pgvector cosine distance < 0.15 between SDR profiles | Flag as potential duplicate |
| **Velocity Anomaly** | > 5 holds from same IP/device in 1 hour | Rate limit + evidence request |
| **Consent Graph** | Circular consent patterns across SDRs | Auto-escalate to collision_disputed state |
| **Network Hash** | Device fingerprint + behavioral telemetry | Sybil confidence score (0-1) |

### Self-Serve Dispute Resolution
No human moderator required:

1. System flags collision via genome similarity
2. Affected party receives collision_disputed state notification
3. Party invokes request_anomaly_evidence MCP tool
4. System provides evidence packet (genome vectors, consent graph, timing data)
5. 72-hour auto-expire if no resolution action taken

---

## 5. Structured Deal Room (SDR) — Execution Layer

The SDR is the transactional primitive. It replaces static listing management with a cryptographically auditable deal execution environment.

### State Machine

```
DRAFT -> REVIEW_NEEDED -> READY -> PUBLISHED -> HELD -> RENTED | CANCELLED
                                      |
                              COLLISION_DISPUTED -> RESOLVED | EXPIRED
```

### Transition Guards
Six formal guard expressions enforce business rules at state boundaries:

| Transition | Guard Expression |
|-----------|-----------------|
| DRAFT -> REVIEW_NEEDED | has_minimum_fields AND price_within_range |
| READY -> PUBLISHED | all_required_docs AND landlord_consent |
| PUBLISHED -> HELD | no_active_hold AND tenant_verified |
| HELD -> RENTED | hold_not_expired AND deposit_confirmed |
| * -> COLLISION_DISPUTED | sybil_score > 0.7 OR manual_flag |
| COLLISION_DISPUTED -> RESOLVED | evidence_reviewed AND resolution_action_taken |

### Hold Type Configuration

| Hold Type | Duration | Auto-Expire | Extension Limit |
|-----------|----------|-------------|-----------------|
| Inquiry | 2 hours | Yes | 0 |
| Viewing | 12 hours | Yes | 1 |
| Decision | 24 hours | Yes | 2 |
| Contract | 48 hours | Yes | 1 |

### Yield Nudge System
Per-SDR opt-in yield optimization, RERA-compliant:

- **Strategies:** price, lease_term, payment_method, deposit
- **Boundary:** RERA rent index cap enforced via evaluate_yield_nudge() function
- **Telemetry:** All nudge evaluations logged to audit trail

---

## 6. pgvector Genome Engine — Semantic Intelligence

Every property is encoded as a 5-dimensional genome vector:

| Dimension | Source | Range |
|-----------|--------|-------|
| Transit | Distance to metro/bus | 0-1 |
| Luxury | Amenity density, developer tier | 0-1 |
| Age | Years since/until completion | 0-1 |
| Price | Normalized against area median | 0-1 |
| Walkability | POI density, street connectivity | 0-1 |

### Capabilities

| Operation | Method | Latency Target |
|-----------|--------|----------------|
| **Similarity Search** | Cosine distance on IVFFlat index | < 50ms |
| **Soft-Bounce Recovery** | Find alternatives when target is unavailable | < 100ms |
| **Collision Detection** | Identify near-duplicate SDRs | < 50ms |
| **Portfolio Clustering** | K-means on genome vectors | Batch (nightly) |

---

## 7. Enterprise API Surface

### 7.1 Decision API

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/decision/screen | POST | Screen properties by intent parameters |
| /api/decision/project/:id | GET | Full project intelligence with evidence |
| /api/decision/compare | POST | Side-by-side comparison with delta analysis |
| /api/decision/area/:slug | GET | Area intelligence with benchmarks |
| /api/decision/memo | POST | Generate investment memo for a project |

### 7.2 Execution API

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/execution/sdr/create | POST | Initialize a Structured Deal Room |
| /api/execution/sdr/:id | GET | Full SDR state + audit trail |
| /api/execution/hold | POST | Request a hold (with guard validation) |
| /api/execution/publish | POST | Publish an SDR (with guard validation) |
| /api/execution/queue/:id | GET | Queue position and ETA |

### 7.3 Market Data API

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/market/dld/feed | GET | DLD transaction notification feed |
| /api/market/pulse | GET | Real-time market pulse (velocity, volume) |
| /api/market/benchmarks/:area | GET | Area-level price and yield benchmarks |

### 7.4 Intelligence API

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/intel/developers | GET | Developer registry with reliability tiers |
| /api/intel/areas | GET | Area profiles with investment signals |
| /api/intel/genome/similar/:id | GET | Genome-similar properties |

---

## 8. Separated Data Platform

### Schema Architecture

| Schema | Purpose | Key Assets |
|--------|---------|------------|
| raw | Unprocessed ingestion | Bayut listings, DLD transactions, media enrichment |
| canonical | Single source of truth | inventory_clean, developer_registry, area_benchmarks |
| api | Materialized views for API consumption | 11 pre-computed API views |
| roomdood | Execution layer (SDR engine) | 44 tables, 11 PL/pgSQL functions |

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

## 9. Enterprise Modules

| Module | Status | Description |
|--------|--------|-------------|
| **Truth Layer** | Production | Single-spine data architecture with full provenance |
| **Decision Engine** | Production | V1 Signal Engine (4 scores, 100% coverage) |
| **Onboarding Engine** | Production | Developer + project ingestion pipeline |
| **Collision Engine** | Production | Sybil firewall + self-serve dispute resolution |
| **Transaction Engine** | Production | SDR state machine with 25 transitions |
| **Contract Engine** | Production | Hold types, consent management, yield nudges |
| **Execution API** | Production | 15 endpoints across 6 modules |
| **Evidence Layer** | Production | Evidence drawer with source attribution |
| **Recovery Engine** | Production | Soft-bounce via pgvector genome similarity |
| **Trust Protocol** | Production | Hallucination boundary + MCP orchestration |
| **SDR Service** | Production | Full deal room lifecycle management |
| **Liquidity Manager** | Production | Yield optimization with RERA compliance |

---

## 10. Integration Architecture

### For the Licensee CTO

```
YOUR PORTAL (Dubizzle/Bayut/PF)
    |
    +-- Your Frontend (unchanged)
    +-- Your Auth System (unchanged)
    +-- Your User Database (unchanged)
    |
    +-- Entrestate API Layer  <-- NEW
         |
         +-- Decision endpoints (screen, compare, memo)
         +-- Execution endpoints (SDR lifecycle)
         +-- Market data endpoints (DLD feed, pulse)
         +-- Intelligence endpoints (genome search, benchmarks)
```

**What changes for you:** Nothing on the frontend. You add API calls to Entrestate endpoints where you currently have manual processes or no intelligence layer.

**What you get:**
- Institutional-grade investment scoring on every listing
- DLD-backed transaction intelligence
- Automated deal room management with audit trails
- Sybil-protected transaction integrity
- RERA-compliant yield optimization

---

## 11. Phase 2 Roadmap — Enterprise Readiness

| Milestone | Target | Description |
|-----------|--------|-------------|
| SOC 2 Certification | Q3 2026 | Type II audit in progress |
| Peer-Gating Middleware | Q2 2026 | Rate limiting + API key management per licensee |
| Search Index Optimization | Q2 2026 | Sub-10ms response on full inventory queries |
| Multi-Tenant Isolation | Q3 2026 | Schema-level data separation per licensee |
| Inventory Spine Reconciliation | Q2 2026 | Automated parity checks between raw and canonical layers |
| Abu Dhabi + RAK Expansion | Q2 2026 | Full coverage beyond Dubai |

---

## 12. ROI Model

| Pain Point (Current State) | Entrestate Solution | Estimated Annual Impact |
|---------------------------|--------------------|-----------------------|
| Manual listing verification | Automated truth layer | -60% ops cost |
| No investment intelligence | V1 Signal Engine on every listing | +15% premium user engagement |
| Fraud/duplicate listings | Sybil firewall + genome dedup | -40% fraud incidents |
| No DLD integration | Real-time transaction feed | New revenue stream (data licensing) |
| Manual deal management | SDR state machine | -70% transaction ops time |
| No yield optimization | RERA-compliant nudge engine | +8% avg. yield per unit |
| Hallucination risk from AI | Architectural boundary | Zero hallucination incidents |

---

## Appendix A: Database Schema Registry

*Full column registries, table definitions, and index specifications are available in the Technical Appendix (separate document). This section provides summary counts only.*

| Layer | Tables | Total Columns | Indexes |
|-------|--------|---------------|---------|
| Raw | 8 | ~180 | 12 |
| Canonical | 5 | ~155 | 18 |
| API Views | 11 | ~90 | -- |
| Execution (SDR) | 44 | ~320 | 35 |
| **Total** | **68** | **~745** | **65** |

## Appendix B: Sprint Plan Summary

12 sprints across 6 phases. 45 tasks. 137 engineer-days estimated.

*Detailed sprint breakdown available in the Technical Appendix.*

## Appendix C: Pitch Materials

- CEO One-Pager: Business case and market positioning
- CTO Architecture Doc: This document
- CFO ROI Calculator: Quantified pain-point resolution model

*All three documents available on request.*

---

*This specification describes the current production state of the Entrestate Decision Infrastructure. All data counts are live figures from the Neon PostgreSQL deployment. All scores are computed, not projected.*
