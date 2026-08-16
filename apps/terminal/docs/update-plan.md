# Entrestate Strategic Update Plan

This plan incorporates the critical feedback presented in the recent transcription and proposes concrete changes to align the platform's user experience, messaging and monetisation with enterprise expectations.  It is intended to augment the existing blueprint and focus on user trust, reliability, onboarding and growth.

## 1. Reinforce Trust Through Visibility

### 1.1 Elevate the Table View

- **Parallel verification layer**: Treat the raw Time Table not as a hidden feature but as an equal partner to the narrative note. Default to a *split-screen* layout for analyst personas - left side shows the generated note, right side displays the Time Table.
- **Interactive citations**: Make narrative text elements clickable. When a user clicks a statistic (e.g., "rental yields compressed by 20 bp"), automatically highlight the specific rows in the Time Table that underpin that figure.
- **Evidence drawer**: Keep the existing evidence drawer, but emphasise it in the UI for analysts. Clearly list sources, filters and assumptions alongside the split view.

### 1.2 Respect Different Personas

- **Analyst persona**: Default to split view with full table visibility and interactive citations. Allow quick toggling of filters and columns directly from the table.
- **Broker persona**: Default to narrative note. Provide a simple "Show data" button that expands to the split view.

## 2. Align Messaging With Technical Reality

### 2.1 Rebrand Agent Features

- **Rename agents to automations/workflows**: Until the automation builder is persistent and stateful, call these features `automations` or `workflows` to set the expectation that they follow a script, not a sentient agent.
- **Market responsibly**: Advertise WhatsApp and DM features as *autoresponders* or *smart templates*, not as fully autonomous agents.

### 2.2 Fix Persistence Before Expansion

- **Migrate automation builder state to Postgres**: Replace in-memory maps with a durable data store. This ensures context is retained across deployments and makes automations reliable.
- **Pause new chat features**: Halt any expansion of the Ask interface or new chat modalities until the persistence layer is complete. Stability before new semantics.

## 3. Improve Onboarding With Guided Workflows

### 3.1 Introduce Golden Path Buttons

- **Action buttons**: Place three static action buttons below the Ask bar to handle high-value workflows directly. Examples:
  - *Underwrite development site* - builds a table with price, yield, GFA, completion date and generates a developer report.
  - *Compare area yields* - compares yields across selected districts and returns a note with a chart and table.
  - *Draft SPA contract* - creates a baseline sale and purchase agreement (SPA) contract from a selected project and buyer criteria.
- **Pre-validated schemas**: Each button maps to a predefined TableSpec and report template. This guarantees a successful, relevant first result and reduces hallucination risk.

### 3.2 Contextual Prompts

- **Adaptive suggestions**: After a user finishes a golden path workflow, show a secondary layer of prompts relevant to the next step (e.g. "Create investor memo" or "Send via WhatsApp").
- **Reduce blank-page syndrome**: Replace the free-form chat bubble with a concise explanation of what users can ask, paired with the golden path options.

## 4. Reframe Deploy and Monetisation

### 4.1 Make Embeds a Free Growth Lever

- **Viral loops over paywalls**: Move embedding widgets and basic data cards to the free tier. Let every user, including free users, create live market cards and tables for their own websites.
- **Powered by Entrestate**: For free embeds, include visible, clickable branding so visitors know the data comes from Entrestate. Encourage sign-ups through these embeds.
- **Track referral metrics**: Update monetisation KPIs to measure the viral coefficient - how many sign-ups originate from embedded widgets. Use this to measure growth, not just revenue.

### 4.2 Paid Upgrades for Branding and Automation

- **Pro tier**: Remove branding from embeds, unlock PDF/PPT exports and increase saved note limits.
- **Business tier**: Offer site generator and custom styling. Provide manual distribution tables (WhatsApp, DM). Introduce custom report templates.
- **Enterprise tier**: Unlock automated distribution with approvals, full API access and whitelabelling.

## 5. Summary of Action Items

| Area | Action | Priority |
|-----|-------|---------|
| Trust & Data | Implement split-screen note + table view; interactive citations; evidence drawer prominence | **High** |
| Messaging & Agents | Rename agents to automations; migrate state to Postgres; pause chat feature expansion | **High** |
| Onboarding | Add golden path buttons (Underwrite, Compare, Draft Contract) with pre-validated TableSpecs | **Medium** |
| Growth & Monetisation | Shift basic embedding features to free tier with "Powered by Entrestate" branding; measure viral coefficient | **Medium** |
| Stability | Finish persistence layer; add tests for data hygiene and note - table linking | **High** |

## Conclusion

The Entrestate engine contains strong foundations - its TableSpec compiler, canonical graph and risk matching are robust. To become a trusted enterprise operating system, the focus must now shift to transparency, reliability and guided workflows. By elevating data visibility, aligning product promises with actual technical capabilities, clarifying onboarding paths and leveraging free distribution for growth, Entrestate can build lasting trust with institutional users and accelerate market adoption.
