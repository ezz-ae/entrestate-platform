# Evidence Stack Hierarchy

The Evidence Stack defines trust levels and processing responsibility from raw extraction to canonical truth.

## L1: Canonical (Static Truths/Audited)

### Role

Authoritative records used as the highest-trust reference in scoring and reporting.

### Typical contents

- Audited transactions
- Verified ownership and legal records
- Canonical dimensions and identity maps

## L2: Derived (Calculated Truths)

### Role

Deterministic calculations produced from canonical or high-confidence inputs.

### Typical contents

- Yield calculations
- Price-per-sqft aggregates
- Normalized trend indexes

## L3: Dynamic (Living States/Inventory)

### Role

Fast-moving operational state representing current listings, availability, and market activity.

### Typical contents

- Active inventory state
- Pipeline status transitions
- Availability and velocity indicators

## L4: External (Market Sensors/RERA/DLD)

### Role

Supplemental market intelligence from external providers and public registries.

### Typical contents

- Regulatory and municipal feeds
- External benchmark data
- Macro and local demand/supply signals

## L5: Raw (Unprocessed Extraction)

### Role

Landing zone for ingestion before normalization, validation, and reconciliation.

### Typical contents

- Scraped/unstructured records
- OCR and parser outputs
- Source payload snapshots

## Cross-layer contracts

- Every upward transition must preserve lineage.
- Lower-trust layers cannot overwrite higher-trust truths.
- Any derived metric must be reproducible from source evidence.
- Confidence, freshness, and provenance must be explicit fields.

