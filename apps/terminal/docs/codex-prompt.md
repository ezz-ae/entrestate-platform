# Entrestate OS Codex Prompt (Final)

You are an expert full-stack engineer and architect. Your task is to scaffold the Entrestate Intelligence OS: a real-estate decision infrastructure that converts user intent into deterministic, auditable decisions and generates branded artifacts.

## System overview

- The platform uses a Time Table primitive for data: immutable, time-indexed, versioned tables compiled from a canonical data graph.
- User intent is captured through natural-language queries or golden path actions and compiled into a deterministic TableSpec JSON.
- Never allow arbitrary SQL or model output to directly generate data. Always validate TableSpec against allowed columns and user entitlements.
- The Decision Tunnel has four stages: intent, evidence, judgment, action. Chat, Search, and Map are UI lenses into the same data graph.
- Progressive disclosure hides complexity until needed. Analysts require a split view: narrative on the left, raw table on the right with click-through citations.
- The OS must generate Decision Objects: investor memos, underwriting reports, comparison notes, contracts, and embeddable widgets. Each artifact references a Time Table hash, includes an evidence drawer listing sources, filters, and assumptions, and supports branded output (colors, logos). These objects are versioned and immutable once shared.
- Behavioral inference learns from lens selection to personalize defaults (risk vs yield weighting) and must expose adjustments to the user. No hidden tuning.
- Distribution is a free growth lever: embed live widgets with a "Powered by Entrestate" badge. Revenue comes from history depth, advanced columns, automation features, and API access.

## Required modules and structure

1. Data ingestion and canonical graph
   - Write ETL scripts to ingest DLD transactions, listings, developer pipelines, and risk metrics into Postgres.
   - Map entities to stable IDs and store versioned snapshots.
2. TableSpec compiler
   - Implement a function that converts a natural-language intent or golden path action into a TableSpec.
   - Validate against allowed schemas and enforce structure with Zod or JSON Schema.
   - Add an optional LLM-backed compiler path for intent that returns JSON only, then enforce entitlements and fall back to deterministic parsing on failure.
3. Time Table model
   - Create a class for Time Table with metadata (owner, created_at, TableSpec, refresh schedule, visibility).
   - Methods: materialize data, compute signals (risk, liquidity, yield), paginate results.
4. Scoring engine
   - Implement Market Score (objective quality) and Match Score (user-profile alignment) with adjustable weightings.
   - Expose the ability to recalculate rankings when profiles change.
5. Artifact generator
   - Build utilities to convert Time Tables into PDF reports, PPTX decks, HTML widgets, and contract drafts.
   - Always link artifacts back to their origin and include evidence drawers.
6. User profile and behavioral inference
   - Define a schema for risk appetite, horizon, yield vs safety bias.
   - Use user actions (selected lenses, ignored suggestions) to infer preferences and update profiles.
   - Allow users to override suggestions.
7. Distribution layer
   - Implement APIs and embed generators to serve widgets and reports on external websites with mandatory branding on free tier.
   - Track referral sign-ups.
8. Governance and versioning
   - Enforce that all artifacts, scripts, and tables are versioned and immutable once cited.
   - Implement audit logs, kill-switch middleware, role-based access control, and signed sessions.

## Coding guidelines

- Use TypeScript and Node.js for server components; Prisma for database access; Next.js for UI; Tailwind CSS for styling.
- Use PostgreSQL as the primary database.
- Write modular, documented functions. Include unit tests for each module.
- Use async/await for asynchronous operations.
- Do not implement chat agents or prompt engineering beyond the TableSpec compiler; focus on deterministic execution and verification.

## Deliverables

When scaffolding the repository:
1. Create directories /lib, /models, /api, /components, /pages/app, /pages/api, /scripts.
2. Implement the modules described above with sample data and minimal implementations. Focus on the data model and API endpoints, not the final UI.
3. Provide sample TableSpec definitions and a simple golden path route for "Underwrite Development Site" that returns a Time Table and PDF report.
4. Include README instructions for running the dev server and testing the compiler.

You may assume there is an existing README.md and docs directory to add extended documentation.
