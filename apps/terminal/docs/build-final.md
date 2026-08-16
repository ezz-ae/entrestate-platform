# Entrestate Build Finalization Guide

This document outlines the final steps to stabilize the Entrestate Intelligence OS and ensure all systems are production-ready.

## 1. Persistence Verification
- [ ] Verify `timetables` table correctly stores TableSpec JSON.
- [ ] Ensure `user_profiles` correctly captures behavioral adjustments.
- [ ] Confirm `automations` survive deployment and correctly reference TimeTable IDs.
- [ ] Check `audit_events` for full actor/action traceability.

## 2. API Health & Contracts
- [ ] Run `pnpm test tests/db-contract.test.ts` to ensure all views/functions are present in Neon.
- [ ] Verify all OS endpoints (`/api/timetables`, `/api/artifacts`, etc.) return `{ error, requestId }` on failure.
- [ ] Confirm rate limiting is active for intent-to-TableSpec compilation.

## 3. UI & UX Refinements
- [ ] Ensure "Analyst Mode" split-screen layout handles large datasets gracefully.
- [ ] Verify citation-click highlighting correctly maps narrative to table rows.
- [ ] Test "Golden Path" buttons for deterministic TableSpec generation.
- [ ] Confirm mobile responsiveness for the simplified 3-surface navigation.

## 4. Artifact & Distribution
- [ ] Test PDF/PPTX generation for a variety of TimeTable scopes.
- [ ] Verify embed widgets work on external domains with the provided public token.
- [ ] Ensure free tier branding ("Powered by Entrestate") is visible on widgets.

## 5. Security & Governance
- [ ] Confirm `ENTRESTATE_KILL_SWITCH` effectively disables sensitive routes.
- [ ] Verify signed sessions are required for all profile and automation writes.
- [ ] Ensure no internal database errors or stack traces leak to the client in production mode.

## 2. Core Data & Intelligence Infrastructure

### 2.1 Canonical Graph & Data Plane

- **Ingestion & Normalisation**: Pull transactions, listings, developer pipelines, risk metrics and market scores into a canonical graph.  Resolve entities (projects, buildings, units) via unique IDs.
- **Time dimension**: Store data in a time-indexed way to support both daily/weekly/ monthly snapshots and lifecycle milestones (launch -> construction -> handover).  Maintain versioning and provenance for auditability.
- **Exclusion Policy**: Implement a central filter to remove anomalies (distressed sales, internal transfers, duplicates, incomplete records).  This ensures "clean inputs" for the intelligence engine.

### 2.2 Intelligence Plane

- **TableSpec Compiler**: Translate natural-language intent into a structured `TableSpec`, specifying row grain (project, asset, transaction), scope (areas/projects), time grain (monthly, lifecycle) and signals (price, yield, risk, liquidity).  Validate and compile it into SQL queries.
- **Time Table**: Represent each dataset as a time-indexed table with metadata and a unique hash.  The table remains hidden by default but drives all outputs.
- **Scoring Engine**: Apply personalised weightings (e.g. 65 % market score, 35 % match score) based on the user's risk profile and time horizon.  Generate ranked options and capture computed metrics like risk bands, liquidity bands and match scores.
- **Behavioural Inference**: Track user selections, omissions and interactions to infer their risk appetite, yield vs. safety bias, preferred horizons and markets of interest.  Store these attributes in a **User Profile** with timestamps and decay rules.  Use this profile to personalise defaults and suggestions.

## 3. Experience Plane

### 3.1 Ask, Search & Visualise

- **Ask**: One input box where users phrase questions in natural language.  The system returns a narrative note and ready reports, with the option to dive deeper via note editing.
- **Search**: Structured filters for price, beds, handover status, risk bands, etc., allowing users to create datasets without using natural language.  Results are presented as note previews.
- **Visualise**: A map view that lets users explore pricing heatmaps, supply clusters and liquidity scores geospatially.

### 3.2 Notes & Reports

- **Market Note**: The primary user-facing document combining narrative insights with evidence.  It hides the table but is powered by it.  Notes are editable and saved in a user's workspace.
- **Ready Reports**: Pre-formatted investor and liquidity analyses generated in seconds.  They carry the user's brand and can be shared directly.
- **PDF & Presentation Exports**: Generate PDF memos and slide decks from notes for institutional archiving or board presentations.
- **Widgets & Sites**: Produce embeddable tables/charts and auto-generated landing pages that update automatically.  Brand settings (logos, colours, typography, tone) propagate to all outputs.
- **Agents**: Create expert chat agents bound to a note's table.  The agent can answer client questions, generate follow-up reports or respond on WhatsApp using only the note's data.

## 4. Distribution & Review Plane

- **Market Files**: Every report or note becomes a "Market File" with creator and reviewers.  Public files can be cited by other users, building a community knowledge base.  Reviewer metadata (who reviewed, accuracy rating, last update) creates a reputation layer.
- **Distribution Tables**: For outreach, convert notes into sequences of messages (WhatsApp, IG DM), campaigns or ad creatives.  Track status and responses.  Use risk dials to adjust outreach (e.g. early vs. late intent leads).

## 5. Profile-Level Intelligence

Implement a **User Profile** with attributes such as risk appetite, time horizon, yield/safety bias, markets of interest and saved reports.  These are updated via behavioural signals.  Use the profile to:

- Pre-select lenses and time ranges for new queries.
- Prioritise ready reports and templates that match the user's persona (investor vs. broker).
- Personalise LLM prompts for narrative tone and level of detail.
- Suggest overlooked dimensions (e.g. liquidity risk to yield-focused users).
- Govern what data depth (time range, column tier) is available under the user's subscription.

## 6. Governance & Trust

- **Evidence Drawer**: All outputs include a checklist of sources, filters, assumptions and risk weighting formulae.  This fosters transparency and auditability.
- **Privacy & Controls**: Users can view and edit their profile, adjust data sharing and opt out.  Logs are pseudonymised and aggregated for analytics.  Enterprise clients get team-level permissions and audit logs.
- **Accuracy & QA**: For contract drafting, ensure legal templates and jurisdiction logic are robust before exposing the feature.  Run automated tests and human reviews on generated outputs.

## 7. Monetisation & Tiers

- **Free**: Limited time depth (e.g. 90 days), a few ready notes, no exports or embeds.
- **Pro**: Up to 2 years of history, custom notes and PDF exports, simple embeds (iframe).  Basic profile personalization.
- **Business**: 5 years history, advanced columns and charts, branding, widget scripts, site generation, note agents, limited distribution tables.
- **Enterprise**: Full history, premium columns and forecasts, API access, team & permissions, automated distribution, contract drafting, white-label domains, and advanced profile controls.

## 8. Build Roadmap

1. **Spine**: Implement the TableSpec compiler, Time Table object, and note/report generation.  Launch with a small set of ready reports.
2. **Profile & Behaviour**: Add user profile schema and basic behavioural inference.  Personalise default lenses and outputs.
3. **Distribution & Review**: Introduce Market Files, public notes and reviewer metadata.  Add simple distribution (share links, WhatsApp replies).
4. **Agents & Widgets**: Enable table-bound chat agents, and advanced embed options.  Allow note cloning and versioning.
5. **Enterprise Add-ons**: Offer contract generation, private API endpoints, corporate branding, and integration with CRMs or broker tools.
6. **Network & Marketplace**: Build a marketplace of verified public reports and a reputation system for creators and reviewers.

## 9. Conclusion

Entrestate is not just a data platform - it is an intelligence compiler that produces decision objects tailored to each user's profile.  By hiding complexity behind notes and progressive disclosure, leveraging behavioural inference to personalise the experience, and ensuring every output is backed by auditable evidence, Entrestate delivers institutional-grade insights to brokers and investors.  The roadmap outlines how to build this system incrementally, ensuring that each layer - from data ingestion to distribution - adds value without overwhelming the user.
