# Entrestate Decision Infrastructure — Comprehensive Docs Map

This section is the canonical documentation map for the **Entrestate Decision Infrastructure**.

## How to use this map

- Start here for architecture-level understanding.
- Use each linked document as a deep-dive domain spec.
- Treat each node in the map as a first-class product/system topic.

## Documentation topology

### 1) Decision Tunnel (Workflow)

- [Decision Tunnel Overview](./decision-tunnel.md)
  - Stage 1: Intent
  - Stage 2: Evidence
  - Stage 3: Judgment
  - Stage 4: Action

### 2) Evidence Stack Hierarchy

- [Evidence Stack Hierarchy](./evidence-stack-hierarchy.md)
  - L1: Canonical (Static Truths/Audited)
  - L2: Derived (Calculated Truths)
  - L3: Dynamic (Living States/Inventory)
  - L4: External (Market Sensors/RERA/DLD)
  - L5: Raw (Unprocessed Extraction)

### 3) Market Scoring Signals

- [Market Scoring Signals](./market-scoring-signals.md)
  - Timing Signals (Entry/Exit Windows)
  - Stress Resilience (Grade A-F)
  - Verified Gross Yield
  - Data Confidence Level

### 4) Broker Dashboard Features

- [Broker Dashboard Features](./broker-dashboard-features.md)
  - AI Assistant (Gemini 1.5)
  - Brochure-to-Listing Automation
  - AI Lead Scoring (Hot/Warm/Cold)
  - Sales Communication Coach
  - Market Intelligence Analytics

### 5) Core Data Objects

- [Core Data Objects](./core-data-objects.md)
  - Time Table (Atomic Intelligence Unit)
  - TableSpec (Query Blueprint)
  - Decision Objects (Outcome Artifacts)
  - Profile Intelligence (User Preferences)

## Authoring standard for each topic

Each deep-dive should cover:

1. Purpose and business outcome
2. Inputs, outputs, and contracts
3. Data lineage and evidence traceability
4. Scoring/logic rules and edge cases
5. UI/API integration points
6. Monitoring, QA, and failure modes
7. Security and governance considerations

