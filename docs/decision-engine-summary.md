# Entrestate Decision Engine Summary

This document summarizes the **Logic of Decision** that powers Entrestate's investment engine.  The engine is designed to transform broad questions into precise, auditable actions while shielding users from data complexity until deeper detail is needed.  It applies progressive disclosure, mathematical scoring, and evidence-backed outputs to give professional investors and brokers confidence in their decisions.

## The Decision Tunnel

Entrestate guides every user through a *Decision Tunnel* with four stages:

| Stage        | Purpose | Key Concepts |
|--------------|---------|-------------|
| **Intent**   | Translate a natural-language goal into a structured `TableSpec` (scope, time grain, signals) that defines what data to pull from the "Data Universe". | Each user query is analysed to extract hidden parameters such as budget, location, property type, status and priority. |
| **Evidence** | Collect the relevant records from the canonical graph of transactions, pipelines and pricing. Apply a strict **Exclusion Policy** to filter out distressed sales, internal transfers, duplicates and incomplete projects. | This data hygiene ensures that only high-integrity inputs feed the investment model. |
| **Judgment** | Apply the user's personal **Decision Lens** to rank candidates. A **Match Score** is calculated using a 65/35 weighting: 65 % Market Score (the asset's objective quality within the market) and 35 % Match Score (how well it fits the user's risk/return profile and horizon). | Profiles range from conservative (safety & capital preservation) to balanced (yield optimisation). |
| **Action**   | Generate branded, shareable **Decision Objects** based on the evaluated table. These include ready reports, PDF memos, presentation decks and web widgets. Each artifact is accompanied by an **Evidence Drawer** listing sources, filters and assumptions. | The final outputs enable the user to communicate the decision with full transparency and defend it before stakeholders. |

This structured tunnel turns a simple question into an auditable, high-confidence recommendation.

## Capturing Intent via the Intelligence Core

The user interacts with an **"Ask" interface** that acts as a real-estate compiler: natural language is parsed into a formal `TableSpec`.  For example:

- *"Find me a high-yield 2BR in JVC"* is decomposed into parameters: JVC location, 2BR unit type, yield optimisation, budget at market rates.
- *"Show me the safest ready projects in Dubai Marina under 2 M AED"* extracts budget, location, status and prioritises safety.

This step sets the search domain and filters applied in later stages.

## Evidence Compilation and Policy Filtering

Once a `TableSpec` is defined, the compiler gathers data from the canonical graph (transactions, listings, pipelines, risk metrics).  To preserve accuracy, Entrestate applies an **Exclusion Policy** that removes:

| Noise trigger | Benefit |
|---------------|---------|
| Distress/forced sales | Protects against forced liquidation prices skewing valuation. |
| Internal family transfers | Removes non-arm's-length transactions that distort real pricing. |
| Duplicate listings | Prevents supply inflation. |
| Incomplete project records | Filters out incomplete data that can't support risk analysis. |

This curated dataset feeds the scoring engine.

## Judgment - Scoring for Risk and Horizon

Entrestate computes a **Match Score** tailored to the user's profile.  Example profiles:

| Feature             | Conservative | Balanced |
|---------------------|-------------|----------|
| Primary priority    | Safety & capital preservation | ROI/yield optimisation |
| Risk tolerance      | Low - established areas | Moderate - emerging markets |
| Typical horizon     | Long-term (5+ yr) | Medium-term (1 - 3 yr) |

The final ranking uses the **Magic Number** formula:

```text
Rank = 0.65 x Market Score + 0.35 x Match Score
```

This prioritises objective market quality while still customising for user goals and constraints.

## Action - Producing Decision Objects

The output stage wraps the analytic result into tangible artifacts:

- **Ready Reports** - Instant ROI/liquidity analyses.
- **PDF Memos** - Formal briefs for institutional records.
- **Presentation Views/Decks** - Slides for board meetings.
- **Web Widgets** - Embeddable tables that update automatically on external sites.
- **Market Notes** - Narrative "notes" that surface storylines rather than raw data.

Each artifact includes an **Evidence Drawer** with checkboxes for sources, filters and assumptions so that the decision is transparent and defensible.  This fosters trust among stakeholders.

## Vertical Axis of Time

Entrestate's moat is its treatment of **time as the vertical axis**.  Rather than static snapshots, the platform tracks how signals evolve:

- **Market Mode** - Time-series snapshots of pricing, yield, risk and liquidity.
- **Lifecycle Mode** - A project's evolution from launch through construction to handover.

This allows investors to understand trajectory and timing risk, not just cross-sectional comparisons.

## Summary

The Entrestate Investment Engine is designed to be an **operating substrate** for real-estate decisions.  It captures user intent, compiles evidence from clean data, applies profile-aware scoring, and generates trusted, branded decision artifacts.  The system's vertical time axis and evidence transparency ensure that recommendations can be defended and audited.  By hiding complexity behind progressive disclosure and emphasising outcomes, Entrestate transforms a simple question into an institutional-grade recommendation.
