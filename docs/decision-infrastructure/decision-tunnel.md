# Decision Tunnel (Workflow)

The Decision Tunnel is the core operating workflow that transforms user goals into defensible actions.

## Stage 1: Intent

### Purpose

Convert natural-language goals into a deterministic `TableSpec` with explicit scope, time horizon, constraints, and output format.

### Inputs

- User prompt/query
- User profile and preferences
- Session context (filters, prior tables, saved views)

### Outputs

- `TableSpec` JSON contract
- Clarification questions when required
- Initial confidence score for intent understanding

### Deep-dive topics

- Intent parsing strategy and fallback behavior
- Entity extraction (location, budget, property type, risk)
- Constraint normalization and validation rules

## Stage 2: Evidence

### Purpose

Collect and normalize candidate records from the Evidence Stack while enforcing data quality and exclusion policies.

### Inputs

- `TableSpec`
- Evidence layer adapters and data connectors
- Exclusion policy rules

### Outputs

- Evidence bundle with lineage metadata
- Rejected records with rejection reasons
- Source-level confidence and freshness signals

### Deep-dive topics

- Source selection and ranking
- Deduplication and canonicalization
- Data freshness and staleness handling

## Stage 3: Judgment

### Purpose

Score and rank options using market quality signals and profile fit to produce defendable recommendations.

### Inputs

- Evidence bundle
- Market scoring signals
- Profile intelligence (user preferences)

### Outputs

- Ranked candidates
- Composite score breakdowns
- Sensitivity and stress notes

### Deep-dive topics

- Score architecture and weighting policy
- Thresholding, tie-breaking, and confidence controls
- Explainability format for each recommendation

## Stage 4: Action

### Purpose

Generate decision-ready artifacts and operational next steps for execution.

### Inputs

- Ranked outcomes
- Evidence drawer and assumptions
- Artifact templates and channel targets

### Outputs

- Decision Objects (reports, memos, decks, exports)
- Recommended actions and follow-up tasks
- Audit trail and evidence bundle references

### Deep-dive topics

- Artifact generation workflow
- Approval, handoff, and collaboration flow
- Post-decision monitoring and feedback loop

