# Entrestate Intelligence Platform - Final Concept

## Vision

Entrestate is positioned as a **decision infrastructure for real-estate operators**.  Rather than providing yet another dashboard or a simple data feed, the platform is designed to become the *place where market decisions are born, validated, executed and audited*.  The public face of Entrestate already communicates a clear outcome-oriented vision - "Study markets.  Operate decisions." - and the platform's internal architecture should reflect that promise.

At its core, Entrestate merges high-quality real-estate data with a reasoning layer powered by LLMs to give operators, brokers, investors and developers a single surface for asking questions, building structured intelligence and turning it into tangible outputs (reports, presentations, widgets, contracts, etc.).  The system hides complexity (data schemas, query languages, pipeline code) and instead offers guided workflows that respect how non-technical users think.

## Core Components

### Data ingestion & universe
* **Comprehensive data sources:** The platform ingests official transaction records, project registries, developer pipelines, listing feeds and derived metrics.  It resolves these sources into a canonical entity graph (projects, buildings, developers, areas) to ensure that different feeds refer to the same objects.
* **Event ledger:** All changes (new transactions, price updates, status changes, pipeline milestones) are recorded as events.  This ledger enables time-series analysis and "what changed" views.
* **Data provenance:** Each metric carries its source and timestamp so that reports can show when and how numbers were computed.  This is critical for enterprise trust.

### The Time Table object (the hidden engine)
* **Internal representation:** Every insight is ultimately derived from a *Time Table* - a canonical, time-indexed dataset keyed by a chosen entity (project, area, segment) and enriched with columns (price, yield, risk bands, liquidity, supply pressure, etc.).
* **TableSpec & compiler:** When a user asks a question ("ROI analysis for JVC area"), the system doesn't run an arbitrary query.  An LLM generates a strict `TableSpec` (scope, time grain, columns, filters).  A compiler validates the spec, runs the necessary SQL against the data universe and materializes the Time Table.  This separation allows natural-language flexibility without risking SQL injection or inconsistent results.
* **Behavioural inference:** If a user repeatedly selects certain columns or ignores others, the system infers their priorities (e.g., yield-centric, risk-averse) and surfaces overlooked lenses proactively, creating a personalised decision pathway.

### Visible notes, not data tables
* **Notes vs. data:** Realtors and investors don't ask for tables; they ask for *ROI analyses*, *risk memos* or *pricing comparisons*.  In the UI the raw data table is hidden; users interact with a "Market Note" that shows narratives and charts.  Behind the scenes, the note is powered by a Time Table.
* **Structured editing:** Advanced users can reveal the underlying data note and add or remove metrics without writing queries.  This gives them "power over output with zero math", matching the creator's experience of building notebooks with LLMs.

### Outputs & conversion
From a single Time Table (hidden behind a note), the platform generates multiple outputs:

| Output              | Description |
|---------------------|------------|
| **Table view**      | For analysts who want to inspect rows and columns.  Pagination, sorting and column definitions are provided. |
| **Chart view**      | Default charts (line, bar, scatter, heatmap) are suggested based on column types and time grain.  Users can save charts to notes. |
| **Presentation view** | Auto-generated deck (ppt/pdf) summarising the table: title slide, executive summary, key charts and insights.  Ready for investor or board meetings. |
| **Report builder**  | Templates for investor memos, broker packs, developer analysis.  Users can generate a ready report instantly or customise sections before exporting. |
| **Landing pages & widgets** | One-click generation of branded landing pages or embeddable widgets that display live metrics.  Embeds update automatically when the underlying data changes. |
| **Agents**          | Bounded chat agents that answer questions only using the note's Time Table.  Agents can also draft client emails or WhatsApp responses grounded in data. |
| **Contracts**       | The system can draft rent/sale contracts using context (unit, project, jurisdiction) and ensure legal correctness.  Once users experience a correct contract drafted in one minute they are unlikely to return to manual methods. |

### Distribution & review
* **Market Files (records):** When a report or note is published, it becomes a *market file* with metadata: creator, organisation, reviewers, last updated, accuracy score and the "using Entrestate" stamp.  Files can be private, workspace-only or public.  Public files accrue views, citations and become part of the market's institutional memory.
* **Reviewer system:** External experts or peer organisations can review a file.  Reviews affect the file's trust score.  Over time, a network of reviewed files forms a transparent knowledge base.
* **Distribution tables:** For outreach, brokers can use distribution tables that orchestrate messaging across WhatsApp, email, CRM or ad platforms.  Each row is a lead and columns show the status of the message, response and next action.  The platform doesn't promise "safe leads"; instead it provides risk dials and visibility into conversion probabilities.

## Monetisation & tiers
The business model is aligned to depth and outputs rather than AI hype:

* **Free tier:** Limited time range (e.g., last 90 days), a few saved notes, preview-only reports, and basic embeds with Entrestate branding.
* **Pro (builder) tier:** Longer history (2 years), dozens of saved notes, full CSV/XLSX exports, basic report templates, and branded decks.  Customisation requires no coding, appealing to non-technical operators.
* **Business (deploy) tier:** Five-year history, hundreds of notes, advanced column unlocks, report builder and presentation generator, branded embeds and landing pages, lead capture forms, basic distribution tables (manual send), and table-bounded agents.
* **Enterprise (infrastructure) tier:** Unlimited history, unlimited notes, premium metrics (lookalike signals, advanced risk models), streaming refresh, API access for embedding live tables into external sites, multi-team permissions, audit logs, automated distribution with approvals and custom domains.

Columns themselves are grouped by tier (core -> standard -> advanced -> premium) to reflect compute cost and proprietary logic.  Time depth and number of saved notes scale with price.  Outputs like contracts, AI agents and distribution automation unlock at higher tiers.

## Positioning & marketing

Entrestate does **not** sell AI hype.  It sells outcomes:

* **Ready intelligence:** Users can type a query ("ROI analysis for JVC area") and immediately receive a branded report.  They don't need to mention AI.  The LLM and data spec systems work silently behind the scenes.
* **Adaptive intelligence:** The platform learns from what users explore and what they ignore, surfacing overlooked lenses and risk dimensions.  This behaves like a trusted adviser rather than a search engine.
* **Credibility and transparency:** Every number comes with sources and timestamps; every file has creators and reviewers; every contract is tied to the underlying data.  This builds trust essential for enterprise adoption.
* **Distribution instead of marketing:** Rather than promising "intelligent marketing", Entrestate provides distribution tools that treat leads as probabilistic signals.  Brokers control risk exposure and see the drawdown.  The platform emphasises visibility over false safety.

## Governance & trust

* **Controlled reveals:** The complexity of data tables is hidden by default.  Users interact with notes and reports.  Advanced users can reveal and edit the underlying structure, but only after they have built confidence through guided flows.
* **Adaptive permissioning:** Tables/notes can be private, shared within a team or published publicly.  Public files become part of the market's knowledge base and can be cited by others.  Reviewers strengthen trust.  Verified organisations can endorse files.  Audit logs record all modifications.
* **Error handling:** The platform never promises 100 % correctness; it exposes confidence levels and encourages users to see drawdowns.  It uses the ledger to roll back to previous versions.  If a contract is generated, the system surfaces jurisdiction rules and assumptions.  This honesty is integral to trust.

## Roadmap highlights

1. **Implement the core Time Table / TableSpec compiler** (internal engine).  Provide API endpoints for compile and fetch.  Create base columns and risk models.
2. **Build the note/report UI** with default chart and presentation views.  Add guided flows for common analyses (ROI, liquidity, price trends).  Hide complexity behind notes.
3. **Develop output generators** for reports (PDF), decks (PPTX) and contract drafting.  Introduce the brand profile system so all outputs inherit client logos, colours and tone.
4. **Introduce distribution tables** for manual send (Business tier).  Add integration with WhatsApp Web for AI-drafted responses and emphasise the drawdown philosophy.
5. **Add reviewer & file metadata** to create the Market File network.  Public files accrue trust through reviews, citations and accurate updates.
6. **Expose API & automation** for enterprise customers: live table endpoints, scheduled refresh, lead distribution automation, CRM and calendar integrations.

## Conclusion

Entrestate's mission is not to dazzle users with AI or to replace real-estate professionals.  Its mission is to create a **calm interface with massive intelligence behind it**.  Users ask questions and receive decision-ready artefacts; as they engage, the system quietly observes and adapts their lenses; when they overlook critical dimensions it nudges them.  Data tables, LLMs and compilers remain invisible - yet the user experiences the power of building their own notes, reports and contracts without writing a line of code or formula.  With structured governance, reviewer networks and tier-based monetisation, Entrestate has the potential to become the **default operating system for real-estate decision making**.
