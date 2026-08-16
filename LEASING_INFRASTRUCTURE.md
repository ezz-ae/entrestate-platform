# Technical Specification: Entrestate Transaction Layer Infrastructure

## 1. Enterprise System Vision and Architectural Lexicon

The residential leasing market is currently plagued by fragmented workflows where high-intent traffic from legacy portals dissipates into unstructured, unmonitored communication channels. The Entrestate Transaction Layer represents a strategic architectural shift, moving away from B2C marketplace models to provide a white-labeled, B2B infrastructure layer. This invisible transaction layer allows legacy portals to convert unstructured traffic into verified, deterministic workspaces. By integrating this layer, institutional parties can manage the entire leasing lifecycle from initial intent to contract execution within a controlled environment that eliminates fraud and accelerates transaction velocity.

To maintain enterprise-grade rigor, the following nomenclature standardization is mandatory across all system components and documentation.

### Nomenclature Standardization

| Legacy Consumer Concept | Enterprise Lexicon | Functional Definition |
|---|---|---|
| Consumer app branding | Entrestate Transaction Layer | White-labeled API infrastructure underpinning the transaction. |
| Listing object | Structured Deal Record (SDR) | Deterministic workspace for transaction lifecycle execution. |
| Intent discovery | Semantic Query Engine | Vector-based intent matching for supply and demand. |
| Onboarding assistant | Workflow Orchestrator | Automated delta extraction and checklist enforcement. |
| Legal assistant | Compliance & Contract Engine | KYC gating and deterministic agreement generation. |
| Agentic firewall | MCP Orchestration Protocol | MCP routing reasoning to database functions. |

The architecture is built upon two core pillars: Decision Infrastructure (the Brain) and Execution Infrastructure (the Hands). The Decision Infrastructure utilizes the Inventory Spine and the Sybil Firewall to mathematically eliminate duplicate and fraudulent inventory at ingestion. The Execution Infrastructure manages the state machine and algorithmic yield engines, including timed holds and backup queues, which stabilize market liquidity and provide institutional-grade trust.

---

## 2. The Structured Deal Record (SDR): The Central Data Object

The Structured Deal Record (SDR) is the fundamental, deterministic workspace where the rental lifecycle executes. Unlike a static listing, an SDR is a dynamic data object that evolves from initial supply ingestion to legal closure, maintaining a single source of truth for all stakeholders.

### SDR Components

- Media Assets: A governed repository of verified images and videos, tagged with provenance data to ensure authenticity.
- Pricing Cards: Structured data defining rent, deposit, and currency, synchronized with the Inventory Spine for market accuracy.
- Availability Cards: Real-time status indicators (Available, Held, In-Contract, Rented) that govern the SDR visibility to the Semantic Query Engine.
- Compliance Documents: A secure section for NOCs, ownership proofs, and ID documents managed via the Document Vault.
- Activity Timelines: An immutable, audit-safe log of all state transitions, document uploads, and milestone achievements.

### The Entrestate Sync Model

The infrastructure utilizes a delta-first onboarding logic to minimize institutional friction. The system executes a strict sequence to ensure data efficiency:

1. Inventory Spine Match: Ingested property data is matched against the Inventory Spine and the Unit Registry.
2. Context Pre-fill: Verified data, including building identity, geospatial data, baseline pricing, and reusable contract templates, is automatically pulled from the Document Vault.
3. Delta Identification: The Workflow Orchestrator compares the existing truth against required publish standards to identify gaps.
4. Targeted Request: The system only requests the delta, missing or stale information such as current availability confirmation or unit-specific media.

---

## 3. Lifecycle Orchestration: SDR State Machine and Transitions

Data integrity and institutional trust are maintained through a rigorous state machine. Each phase of the leasing process is governed by a strict state, with transitions enforced by logic-gate transition guards.

### SDR Primary States

- Draft: Initial creation phase.
  - Guard: [Auth_Service.Status == VERIFIED] && [SDR_Commerce.Credits > 0]
- Review_Needed: Triggered when the Workflow Orchestrator identifies missing or stale data.
  - Guard: [Delta_Engine.Missing_Items > 0] || [Document_Vault.Stale_Docs == TRUE]
- Ready: SDR is structurally complete.
  - Guard: [Workflow_Orchestrator.Checklist_Status == COMPLETED] && [Inventory_Spine.Verified == TRUE]
- Published: SDR is live and discoverable.
  - Guard: [Owner_Verification == TRUE] && [Pricing_Card.Status == CONFIRMED]
- Held_Primary: A tenant has secured an exclusive timed window.
  - Guard: [Deal_Chat.Status == OPEN] && [Hold_Service.Active == TRUE]
- In_Contract: Parties are reviewing the generated agreement.
  - Guard: [Compliance_Engine.Draft_Status == ACCEPTED] && [Mutual_Consent == TRUE]
- Rented: Transaction successfully closed.
  - Guard: [Agreement_Service.Final_Execution == TRUE]
- Archived: SDR is withdrawn or deactivated.
  - Guard: [Manual_Withdrawal == TRUE] || [Hold_Expiry_Worker.TTL_Expired == TRUE]

---

## 4. Backend Service Map and Orchestration Logic

The Entrestate architecture distinguishes between Brain (Decision) and Hands (Execution) services to ensure modularity and reasoning accuracy.

### Decision Services (the Brain)

- Semantic Query Engine: Implements a pgvector database storing a five-dimensional genetic array (Transit, Luxury, Age, Price, Walkability) for every project to enable precise substitution logic.
- Sybil Firewall: A four-pillar telemetry trap (Network, Location, Device, Address) that mathematically eliminates duplicate and fake inventory at the point of ingestion.
- MCP Orchestration Protocol: An isolated reasoning engine that reads SDR deltas and executes database state changes without the risk of LLM hallucinations.
- Compliance & Contract Engine: Logic layer for KYC gating, identity verification, and agreement term validation.
- Inventory Sync Service: Coordinates matching with the Inventory Spine and Unit Registry.

### Execution Services (the Hands)

- SDR Service: Manages the lifecycle and data integrity of the Structured Deal Record.
- Liquidity Manager: The primary yield engine, coordinating the Hold Service and Queue Service to maximize portal throughput.
- Transactional Communication Service: Orchestrates private deal chats and event-driven notifications.
- Workflow Orchestrator: Enforces checklist completion and manages the Review_Needed state transitions.
- Document Vault: Secure storage and retrieval of reusable institutional compliance documents.
- WhatsApp Action Service: Executes structured external continuity via button-driven action sessions.

### External Listing Import Flow

1. Fetch: The Import Service ingests an external URL from a legacy portal.
2. Parse: The engine extracts raw HTML, parsing titles, pricing, and media.
3. Normalize: Fragmented fields are normalized to Entrestate schema standards.
4. Map: The normalized payload is mapped into a Draft SDR.
5. Sync: The Inventory Sync Service matches the import to the Inventory Spine to identify pre-filled truths and remaining deltas.

---

## 5. Liquidity Management: Timed Holds and Backup Queues

Entrestate utilizes a soft-bounce recovery strategy to protect landlord liquidity. By replacing indefinite listing locks with timed windows, the system provides tenant focus while ensuring assets do not remain frozen by inactive leads.

### Hold Type Duration Standards

| Hold Type | Default Expiry | Context / Trigger |
|---|---|---|
| Inquiry | 2 Hours | Opening of the primary Deal Chat. |
| Viewing | 12 Hours | Scheduling of a viewing event. |
| Decision | 24 Hours | Post-viewing deliberation period. |
| Contract | 48 Hours | Legal agreement drafting and review. |

### The Queue Service and Promotion Logic

The Liquidity Manager allows landlords to configure SDRs with three negotiation modes: Serial Only, Serial + Queue (default), and Limited Parallel. When a primary hold expires via the hold_expiry_worker, the promotion logic triggers: the next ranked tenant in the queue is automatically promoted, a new primary deal chat is generated, and a fresh Inquiry hold is initiated.

---

## 6. Trust Protocols: Mutual Contact Reveal and Compliance Gating

Entrestate operates on a double-blind privacy model, treating contact information as an outcome of mutual intent rather than a lead generation starting point.

### Mutual Contact Reveal Protocol

Contact details are strictly hidden within the SDR until both parties explicitly approve a reveal. The protocol supports three scopes: Phone, Email, and Full Contact. A reveal event is only triggered when the system detects that both parties have approved the exact same scope, preventing unilateral data leakage.

### Compliance Gating

During the In_Contract phase, the Compliance & Contract Engine serves as a deterministic assistant. It pulls verified data from the Document Vault (for example, ownership proofs) and the SDR structured pricing cards to generate agreement drafts. This prevents reasoning errors and ensures the final agreement is grounded entirely in the SDR verified data.

---

## 7. External Continuity: Structured WhatsApp Orchestration

WhatsApp is utilized exclusively as a structured continuity layer to prevent transaction data from escaping into unmonitored, unstructured channels.

### Internal Guards and Action Sessions

The system enforces a no unstructured mutation guard: free-form text negotiation is forbidden from changing core system states (for example, rent amounts). Any inbound unstructured text that attempts to bypass SDR logic triggers an automated, safe redirect back to the platform.

The WhatsApp Action Service utilizes action sessions to facilitate workflow progress via structured buttons:

1. Confirm Availability: Resolves a delta-check for the landlord.
2. Extend Hold: Allows a tenant to request a duration extension.
3. Upload NOC: Prompts for missing compliance documentation.
4. Confirm Price: Validates imported pricing from legacy portals.

This deterministic, SDR-based infrastructure creates a technical moat by ensuring every rental transaction is captured, structured, and verified within a high-trust enterprise environment. By controlling supply onboarding, state-based holds, and automated legal generation, the Entrestate Transaction Layer provides the essential machinery for the modern residential leasing market.
