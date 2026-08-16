# Profile-Level Intelligence Plan for Entrestate

## Overview

The **profile-level intelligence** layer personalises the Entrestate experience based on each user's behaviour, preferences and organisational role.  It leverages the behavioural inference framework outlined in the blueprint but focuses specifically on **capturing user actions**, **inferring intent**, and **adapting the system's responses** for brokers, analysts, investors and other stakeholders.  This plan defines how profiles are built, maintained and used to deliver high-impact suggestions and protect users from blind spots.

### Why profile intelligence matters

- **Reduce friction.**  Users should receive relevant reports, tables, prompts and actions without manual configuration.  By learning their risk appetite, preferred time horizons or favourite lenses, Entrestate can suggest the right objects immediately.
- **Surface overlooked dimensions.**  Watching what a user does *not* explore is as important as what they do.  Profile intelligence can gently introduce high-impact metrics (e.g., liquidity band or exit timing risk) when it detects bias.
- **Enable progressive disclosure.**  Profiles store a user's depth tolerance.  New users see simple outputs; as their profile grows, the system reveals advanced columns, cross-market comparisons and other powerful features.
- **Drive retention and revenue.**  Personalised experiences convert more users to higher tiers.  By understanding who values deeper history, more saved notes or advanced columns, Entrestate can upsell appropriately.

## Core components

### 1. **User Profile Schema**

Each user (or team, for shared workspaces) has a profile document that stores:

- **Identifier** - user ID and workspace ID.
- **Role** - broker, investor, analyst, developer, etc.  Can be inferred from email domain or explicitly set.
- **Behavioural features** - auto-generated signals derived from interactions:
  - **Lens selections**: which ready reports, notes or lenses they frequently choose and which they ignore.
  - **Time depth usage**: typical time horizons selected (e.g., always last 6 months vs. 5 years).
  - **Column appetite**: preference for simple metrics (price/yield) vs. advanced ones (risk bands, timeline risk).
  - **Action patterns**: frequency of downloads, report generation, embed usage, distribution table creation and contract drafting.
  - **Response style**: preference for narrative vs. charts vs. tables; heavy use of the LLM agent vs. structured search.
  - **Risk/yield bias**: inferred from the ratio of risk-oriented vs. yield-oriented queries.
  - **Decision horizon**: short-term vs. long-term based on how far into the future they ask for forecasted returns.
- **Explicit preferences** - optional user-set flags like favourite markets/areas, default currency and preferred report templates.
- **Tier entitlements** - current subscription tier (free, pro, business, enterprise) and associated limits.
- **Privacy & consent flags** - controls for data retention, behavioural tracking and marketing communications to respect user autonomy.

Profiles are stored in the **experience plane** (see blueprint) and updated on every significant interaction.  They are versioned for auditability and can be exported or deleted on request (privacy compliance).

### 2. **Behavioural Inference Engine**

This engine transforms raw events into the features listed above.  It operates as a low-latency service that listens to:

- **View events** - which notes, reports, charts or map layers a user opens.
- **Selection events** - which lenses or columns they choose from offered lists and which they skip.
- **Search and chat queries** - natural language requests parsed via LLM; detect keywords (risk, yield, liquidity) and contextual cues (compare, top 10, trend, reasons).
- **Action events** - downloads, exports, site generation, agent creation, contract drafting, distribution table operations.
- **Time and session patterns** - session length, frequency, time of day or week; cross-device usage.

For each event, the engine updates the behavioural features using Bayesian or reinforcement learning methods.  For example, if a user repeatedly ignores risk bands when available, the engine reduces the weight of risk-heavy suggestions until a certain threshold is met, then surfaces risk once with a high-impact message.

### 3. **Recommendation & Personalisation Layer**

This layer sits between the user interface and the intelligence plane.  It uses profile signals to tailor:

1. **Default objects** - The first note, report or map overlay shown when a user logs in or selects a market.  For a risk-averse broker, show liquidity and risk bands.  For a yield-focused investor, show yield distribution and ROI.
2. **Suggested actions** - Offer to "compare with area Y," "extend time to 5 years," or "generate investor memo" based on previous behaviour.
3. **Lens ordering** - Reorder lens suggestions in the 12-lens panel so the most relevant options appear first; hide advanced lenses until the user is ready.
4. **Alerts and nudges** - Notify users when a high-impact metric changes in a profile they care about (e.g., supply pressure rising in their watchlist area).  Suggest exploring overlooked dimensions at the right time.
5. **Tier upsell triggers** - If a user hits time depth limits frequently, suggest upgrading to a plan with deeper history.  If they try to download more tables than allowed, explain the benefits of the next tier.

### 4. **Profile-aware LLM Orchestration**

The LLM agent uses profile signals to shape responses:

- **Language and tone** - Brokers may prefer concise bullet points; analysts may prefer detailed explanations.  The agent adapts accordingly.
- **Clarifying questions** - Ask minimal clarifying questions based on prior context.  If a user often ignores risk metrics, avoid pushing risk prematurely.  If they are unfamiliar with liquidity terms, include definitions.
- **Missing dimension suggestions** - When a user's pattern indicates a blind spot (e.g., ignoring exit timing risk), the LLM can interject: "You haven't considered exit timing yet; would you like to see how that affects ROI?"  This matches the "coin flip" moment described earlier.

### 5. **Privacy, Trust and Governance**

Profile intelligence must operate transparently and ethically:

1. **Explainability** - Users can view why specific suggestions are made and adjust their preferences.  Provide a profile dashboard showing inferred features and allow edits.
2. **Opt-in/opt-out** - Offer clear controls to disable behavioural tracking or limit data retention.  Free tier users can opt out entirely; enterprise clients can customise retention policies.
3. **Data minimisation** - Store only necessary behavioural signals.  Use aggregated rather than raw event logs to power recommendations.
4. **Security & compliance** - Ensure profile data is encrypted in transit and at rest.  Apply row-level permissions to prevent cross-workspace leaks.  Align with data protection laws (GDPR, etc.).

## Example user journeys

### **Broker Amelia (Pro tier)**

- Logs in and selects "Dubai Marina".  Entrestate automatically loads a note titled "Dubai Marina Insights - Amelia" showing ROI, yield, and supply pressure (from her profile preferences).  A side-panel lists options like "Compare with JBR" and "Generate client report."  A subtle nudge at the bottom says, "Exit timing risk for ready units is increasing - see why."
- She clicks "Generate client report."  The system uses her preferred template (short narrative with charts) and auto-fills it with the latest data.  Her profile signals she often ignores risk, so the report emphasises ROI and yield first but still includes a risk chart with a footnote.
- She exports the report.  Her profile increments the "report downloads" counter.  Next time she logs in, the system suggests upgrading to Business tier because she's near the download limit.

### **Analyst Omar (Enterprise)**

- Enters a complex query: "Compare absorption rates for ready vs. off-plan units in Abu Dhabi from 2018 to 2024, adjusting for seasonality."  The LLM uses his profile to avoid clarifying questions (he often asks multi-factor queries).  It directly compiles a table, charts and a presentation view.  In the note editor, he sees all columns (risk, liquidity, timeline risk).  His profile indicates deep engagement with risk metrics, so risk bands are highlighted.
- Omar edits the note, adding a computed column for adjusted absorption per 100 units.  The behavioural engine notes he added a custom column and tags his profile as "advanced user".  Future suggestions will include more advanced lenses.
- He publishes the note as a public market file.  It lists him as creator (Omar - Al Ain Capital) and invites reviewers.  His profile gains reputation points.  A broker sees this market file and uses it to talk to clients.

### **Investor Sara (Free tier)**

- Searches "2BR under AED 2M yield".  The system surfaces a ready report "Top yield projects under AED 2M" based on her previous queries.  She downloads two notes.  Her profile shows she hits the download limit often, so she sees an upsell prompt: "Upgrade to Pro to access longer history and more downloads."

## Integration with existing blueprint

- **Data plane:** User events and profile documents are stored alongside core data.  Each event references a canonical entity (market, project, area) and a note ID.
- **Intelligence plane:** Profile signals are inputs into the behavioural inference engine and adjust TableSpec defaults.  LLM prompts include profile context.
- **Experience plane:** The UI layers (Ask, Search, Visualise, Reports) call the personalisation layer to order suggestions, hide or show advanced features and decide what to ask the LLM.
- **Distribution & review:** When a user creates or reviews a market file, profile updates adjust the user's reputation.  Reputation can later influence the ranking of public files.
- **Governance & trust:** Comply with data retention and user consent; maintain audit logs for profile updates; provide transparency dashboards.

## Implementation roadmap

1. **Define profile schema and event taxonomy.**  Start with minimal features (lens selections, time depth, action counts) and add complexity over time.
2. **Implement behavioural inference service.**  Build functions to update features in near-real time.  Begin with simple counters; add Bayesian or reinforcement models later.
3. **Create personalisation API.**  Expose endpoints to fetch top lens suggestions, default TableSpec parameters and targeted actions given a profile and context.
4. **Integrate with LLM layer.**  Augment prompt construction with profile features.  Ensure the LLM uses the user's vocabulary (e.g., "ROI" vs. "yield") and suggests missing dimensions smartly.
5. **Build profile dashboard and controls.**  Allow users to view and edit their inferred features, opt out of tracking, and set explicit preferences.
6. **Add tier-based entitlements.**  Align profile limits with subscription tiers (time depth, saved notes, downloads).  Personalised upsell triggers can draw on profile signals.
7. **Expand behavioural signals.**  Add more signals (e.g., time of day, device type) to refine recommendations; incorporate team-level patterns for enterprise.
8. **Introduce reputation weighting.**  Attach reviewer badges and citation counts to profiles; use reputation to rank public files and suggestions.

## Conclusion

The profile-level intelligence layer transforms Entrestate from a powerful data engine into a personalised, adaptive companion for brokers, analysts, developers and investors.  By observing user behaviour, inferring intent and gently guiding them through missing dimensions, Entrestate delivers *better decisions* rather than just more data.  Profiles remain transparent and under user control, balancing personalisation with trust and privacy.  Implemented correctly, this layer will increase engagement, reduce churn, and unlock new monetisation avenues while staying aligned with the platform's core principles of progressive disclosure, hidden complexity and outcome-first design.