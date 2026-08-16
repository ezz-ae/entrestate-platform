# Entrestate Intelligent Platform: Build Blueprint

This document synthesizes the key designs, architectures, and operating logic discussed in the decision-engine walkthrough and profile intelligence plan. It serves as a comprehensive guide for building Entrestate into a scalable, trusted, and personalized real estate intelligence platform.

## 1. Vision and Philosophy

Entrestate aims to become the default operating substrate for real-estate decisions. It hides data complexity behind narrative notes and decision objects, guiding users through a Decision Tunnel that moves from intent to evidence, judgment, and action. Progressive disclosure and behavioral intelligence ensure that complexity is revealed only when needed, preventing cognitive overload while providing deep analytical power on demand.

### Guiding principles

- Outcome-first: Users ask for answers (e.g., "JVC ROI analysis"), not data. They receive client-ready reports, memos, decks, or widgets, not spreadsheets.
- Progressive disclosure: The platform surfaces ready reports and note views first; advanced tables and columns are available only when a user chooses to customize.
- Behavioral intelligence: The system observes how users interact with lenses, time ranges, and outputs to infer preferences and personalize future suggestions.
- Evidence and trust: Each decision object carries a transparent evidence drawer showing sources, filters, and assumptions.
- Vertical axis of time: Time is the organizing axis for all data views, supporting both market snapshots and project lifecycle analyses.

## 2. Core Data and Intelligence Infrastructure

### 2.1 Canonical Graph and Data Plane

- Ingestion and normalization: Pull transactions, listings, developer pipelines, risk metrics, and market scores into a canonical graph. Resolve entities (projects, buildings, units) via unique IDs.
- Time dimension: Store data in a time-indexed way to support both daily/weekly/monthly snapshots and lifecycle milestones (launch -> construction -> handover). Maintain versioning and provenance for auditability.
- Exclusion policy: Implement a central filter to remove anomalies (distressed sales, internal transfers, duplicates, incomplete records). This ensures clean inputs for the intelligence engine.

### 2.2 Intelligence Plane

- TableSpec compiler: Translate natural-language intent into a structured TableSpec, specifying row grain (project, asset, transaction), scope (areas/projects), time grain (monthly, lifecycle), and signals (price, yield, risk, liquidity). Validate and compile it into SQL queries.
- Time Table: Represent each dataset as a time-indexed table with metadata and a unique hash. The table remains hidden by default but drives all outputs.
- Scoring engine: Apply personalized weightings (e.g., 65% market score, 35% match score) based on the user's risk profile and time horizon. Generate ranked options and capture computed metrics like risk bands, liquidity bands, and match scores.
- Behavioral inference: Track user selections, omissions, and interactions to infer their risk appetite, yield vs. safety bias, preferred horizons, and markets of interest. Store these attributes in a User Profile with timestamps and decay rules. Use this profile to personalize defaults and suggestions.

## 3. Experience Plane

### 3.1 Ask, Search and Visualize

- Ask: One input box where users phrase questions in natural language. The system returns a narrative note and ready reports, with the option to dive deeper via note editing.
- Search: Structured filters for price, beds, handover status, risk bands, etc., allowing users to create datasets without using natural language. Results are presented as note previews.
- Visualize: A map view that lets users explore pricing heatmaps, supply clusters, and liquidity scores geospatially.

### 3.2 Notes and Reports

- Market Note: The primary user-facing document combining narrative insights with evidence. It hides the table but is powered by it. Notes are editable and saved in a user's workspace.
- Ready Reports: Pre-formatted investor and liquidity analyses generated in seconds. They carry the user's brand and can be shared directly.
- PDF and presentation exports: Generate PDF memos and slide decks from notes for institutional archiving or board presentations.
- Widgets and sites: Produce embeddable tables/charts and auto-generated landing pages that update automatically. Brand settings (logos, colors, typography, tone) propagate to all outputs.
- Agents: Create expert chat agents bound to a note's table. The agent can answer client questions, generate follow-up reports, or respond on WhatsApp using only the note's data.

## 4. Distribution and Review Plane

### Market Files

Every report or note becomes a Market File with creator and reviewers. Public files can be cited by other users, building a community knowledge base. Reviewer metadata (who reviewed, accuracy rating, last update) creates a reputation layer.

### Distribution Tables

For outreach, convert notes into sequences of messages (WhatsApp, Instagram DM), campaigns, or ad creatives. Track status and responses. Use risk dials to adjust outreach (e.g., early vs. late intent leads).

## 5. Profile-Level Intelligence

Implement a User Profile with attributes such as risk appetite, time horizon, yield/safety bias, markets of interest, and saved reports. These are updated via behavioral signals. Use the profile to:

- Pre-select lenses and time ranges for new queries.
- Prioritize ready reports and templates that match the user's persona (investor vs. broker).
- Personalize LLM prompts for narrative tone and level of detail.
- Suggest overlooked dimensions (e.g., liquidity risk to yield-focused users).
- Govern what data depth (time range, column tier) is available under the user's subscription.

## 6. Governance and Trust

- Evidence Drawer: All outputs include a checklist of sources, filters, assumptions, and risk weighting formulae. This fosters transparency and auditability.
- Privacy and controls: Users can view and edit their profile, adjust data sharing, and opt out. Logs are pseudonymized and aggregated for analytics. Enterprise clients get team-level permissions and audit logs.
- Accuracy and QA: For contract drafting, ensure legal templates and jurisdiction logic are robust before exposing the feature. Run automated tests and human reviews on generated outputs.

## 7. Monetization and Tiers

- Free: Limited time depth (e.g., 90 days), a few ready notes, no exports or embeds.
- Pro: Up to 2 years of history, custom notes and PDF exports, simple embeds (iframe). Basic profile personalization.
- Business: 5 years history, advanced columns and charts, branding, widget scripts, site generation, note agents, limited distribution tables.
- Enterprise: Full history, premium columns and forecasts, API access, team and permissions, automated distribution, contract drafting, white-label domains, and advanced profile controls.

## 8. Build Roadmap

- Spine: Implement the TableSpec compiler, Time Table object, and note/report generation. Launch with a small set of ready reports.
- Profile and behavior: Add user profile schema and basic behavioral inference. Personalize default lenses and outputs.
- Distribution and review: Introduce Market Files, public notes, and reviewer metadata. Add simple distribution (share links, WhatsApp replies).
- Agents and widgets: Enable table-bound chat agents and advanced embed options. Allow note cloning and versioning.
- Enterprise add-ons: Offer contract generation, private API endpoints, corporate branding, and integration with CRMs or broker tools.
- Network and marketplace: Build a marketplace of verified public reports and a reputation system for creators and reviewers.

## 9. Conclusion

Entrestate is not just a data platform; it is an intelligence compiler that produces decision objects tailored to each user's profile. By hiding complexity behind notes and progressive disclosure, leveraging behavioral inference to personalize the experience, and ensuring every output is backed by auditable evidence, Entrestate delivers institutional-grade insights to brokers and investors. The roadmap outlines how to build this system incrementally, ensuring that each layer - from data ingestion to distribution - adds value without overwhelming the user.
