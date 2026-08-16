# Core Data Objects

Core Data Objects are the shared contracts that carry intent, evidence, judgment, and outcomes across the system.

## Time Table (Atomic Intelligence Unit)

### Purpose

The primary container for decision-ready slices of market intelligence.

### Responsibilities

- Store rows, metrics, and explanatory context
- Support refresh, comparison, and export workflows
- Preserve lineage back to evidence sources

## TableSpec (Query Blueprint)

### Purpose

Deterministic query contract compiled from user intent.

### Responsibilities

- Define scope, filters, grouping, and time grain
- Enforce validation constraints and defaults
- Produce reproducible query behavior

## Decision Objects (Outcome Artifacts)

### Purpose

Artifacts generated from evaluated Time Tables for communication and execution.

### Responsibilities

- Render reports, memos, decks, and briefs
- Attach evidence drawers and assumptions
- Support collaboration and approvals

## Profile Intelligence (User Preferences)

### Purpose

Encode a user’s risk/return preferences, goals, and interaction history to personalize decisions.

### Responsibilities

- Maintain explicit preferences and inferred signals
- Adjust ranking and communication style
- Explain personalization impact in outputs

## Data contract checklist

- Stable identifiers and versioned schemas
- Required lineage/provenance fields
- Confidence/freshness metadata for each object
- Backward compatibility strategy for API consumers

