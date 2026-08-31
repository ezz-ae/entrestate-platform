# System Architecture Blueprint

**Version**: 8.0.0  
**Status**: ACTIVE PRODUCTION (Governing decision infrastructure, live CRM performance, and automated Google Ads search arbitrage) [36, 67]  
**Host Environment**: `freeholdproperty.ae` (Running private white-label workspace at `/freehold-intelligence`) [67]  
**Primary Repositories**: `ezz-ae/Entrestate_os` & `ezz-ae/entrestate-platform` [67]

---

## 1. Executive Summary & Architectural Core
The real estate technology sector is traditionally fragmented across disconnected point solutions—using separate platforms for market research, advertising, lead routing, and accounting [2, 3]. Because these databases are isolated, valuable operational data is lost [3]. A transaction closes, but that outcome does not retrain audience targeting parameters, modify inventory priority, or adjust active spend budgets [3].

**Entrestate is a closed-loop operating and intelligence system that turns commercial activity into a learning system.** [1, 4]

By running all operations on a **single, unified Neon PostgreSQL database and one AI layer**, Entrestate connects market data, inventory scoring, audience construction, marketing acquisition, CRM pipeline velocity, and transactional outcomes into a self-sharpening feedback loop [15, 67]. The outcome of one cycle programmatically becomes the intelligence that drives the next [2].

---

## 2. Core Architecture: The Three-Tier System

Entrestate organizes its 12 Core Engines across three distinct structural layers [4, 5]:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      THE THREE-TIER ARCHITECTURE                       │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ I. THE ANALYTICAL LAYER (Predictive Underwriting)                      │
│ - Engine 01 (Market Intelligence): Normalizes DLD transaction database │
│ - Engine 02 (Inventory): Scores property stock across 10-vectors       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Fit, Scored Inventory
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ II. THE COMMERCIAL EXECUTION LAYER (Pipeline Acceleration)             │
│ - Engine 03 (Audience): Dynamic lookalike seeds & cohort segmentation │
│ - Engine 04 (Creative): Dynamic trilingual Listing-to-Landing pages   │
│ - Engine 05 (Acquisition): Google Ads Machine & Meta spend governor   │
│ - Engine 06 (Lead / Rate): 0-to-10 scale control signal               │
│ - Engine 07 (CRM Machine): Unified deduplication & intelligent routing │
│ - Engine 08 (Attribution): Joins closed commissions to marketing spend │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Pipeline Outcomes (Won / Lost / Rates)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ III. THE LEARNING & CONTROL LAYER (System Governance)                 │
│ - Engine 09 (Learning Engine): Calculates performance delta (Δp)       │
│ - Engine 10 (AI & Governance): Enforces Spend Governor & validation    │
│ - Engine 11 (The Cash Engine): Tokenized wallet ledger and ad economy │
│ - Engine 12 (Contextual Chat): Screen-aware, role-sensitive Expert AI  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Structural Specification of the 10 Core Engines

### Layer A: The Analytical Substrate

#### Engine 01 — Market Intelligence Engine
*   **Purpose**: Transform fragmented real-estate market data into structured, inspectable intelligence [5].
*   **Core Logic**: Normalizes DLD transaction records, community pricing, and developer history to establish baseline market trends [5, 6].
*   **Outputs**: Live area yields, comparable pricing maps, and high-integrity transaction evidence [6].

#### Engine 02 — Project & Inventory Intelligence Engine
*   **Purpose**: Determine not simply what property listings exist, but how they should be commercially interpreted and prioritized [7].
*   **Core Logic**: Runs an automated check to score developer reliability, entry pricing, rental yields, and comparable positioning across ten analytical vectors [7, 53].
*   **Decision Verdicts**: Programmatically flags listings as **BUY**, **HOLD**, **WAIT**, or **AVOID** [7].

---

### Layer B: The Commercial Execution Layer

#### Engine 03 — Audience Intelligence & Construction Engine
*   **Purpose**: Treat target audiences as dynamic, self-sharpening data structures rather than static ad-network demographic settings [8, 9].
*   **Core Logic**: Compiles multi-variable profiles linking CRM outcomes (Engine 07) directly to ad targeting [9].
*   **Dynamic Cohorts**:
    *   **The "Copy" Cohort (`Rate >= 4`)**: Integrates high-intent leads to act as lookalike training seeds [74].
    *   **The "Avoid" Cohort (`Rates 1-3`)**: Gathers disqualified and "junk" records to programmatically exclude from active targeting [36, 74].

#### Engine 04 — Creative Intelligence Engine
*   **Purpose**: Turn inventory, audience, and campaign parameters into executable commercial creative assets [9].
*   **Core Logic**: Hooks into Google Vertex AI models to dynamically compile trilingual, right-to-left mirrored landing pages (**"Listing-to-Landing"**) and ad creatives [9, 36, 57].
*   **Two-Way Behavioral Telemetry**: Orchestrates parallel event tracking on landing pages, separating active mouse movements (`active_telemetry`) from idle tab/backgrounding states (`idle_telemetry`) to capture high-resolution, noise-filtered buyer intent on the fly.
*   **Purpose**: Turn inventory, audience, and campaign parameters into executable commercial creative assets [9].
*   **Core Logic**: Hooks into Google Vertex AI models to dynamically compile trilingual, right-to-left mirrored landing pages (**"Listing-to-Landing"**) and ad creatives [9, 36, 57]. Incorporates client-side micro-behavioral telemetry (mouse movements, active hovers) and choice-engineered forms for implicit profiling.

#### Engine 05 — Acquisition Engine
*   **Purpose**: Deploy marketing capital across ad networks via deterministic control systems [10].
*   **Core Logic**: Syncs campaign assets and budgets directly to Meta Graph and Google Ads APIs. Features the **Google Ads Search Machine** to automate search campaigns and landing page compilation in minutes based on active query intent [94].
*   **Governing Rules**: Enforces the *Spend Governor* (`spend-authority.ts`) to block campaign creation if matched inventory is marked "AVOID" or crosses spend boundaries [29, 35].

#### Engine 06 — Lead Intelligence / Rate Engine
*   **Purpose**: Qualify and grade captured leads instantly, turning the conversion "Rate" from a reporting metric into an active control signal [12, 13, 79].
*   **The 0-to-10 Scale**:
    *   **Rates 1–8**: Open lead progression (Rate 8 is the absolute peak unclosed qualification level) [74].
    *   **Rate 9**: Won transaction (instantly triggers downstream lookalike audience retraining) [15, 31, 74].
    *   **Rate 10**: Institutional Master Lead (repeat HNW investor) [74].

#### Engine 07 — CRM Machine
*   **Purpose**: Enforce database sovereignty, eliminate duplicate leads, and distribute opportunities based on historical close success [14].
*   **Core Logic**: Norms incoming contacts on database-level constraints. Evaluates duplicate submissions using the **Intent Convergence Index (ICI)**. If the duplicate shows focused geographical and asset intent ($ICI \ge 0.5$, e.g., JVC apartments), the lead is boosted to **`Rate 8`** and routed as a Convergent Buyer under the **15-Minute Neglect redistribution rule** [14]. Scattered browsing profiles ($ICI < 0.5$) bypass high-priority escalation to shield brokers from noise. Enforces **Temporal Anomaly Gates** to neutralize manual status-gaming by brokers [18].

#### Engine 08 — Commercial Outcome & Attribution Engine
*   **Purpose**: Connect marketing activity and specific spend lines directly to closed commissions [15].
*   **Core Logic**: Performs complex, multi-table database joins to reconcile gross revenue with original campaign creatives, pixels, and spend histories [15, 16].

---

### Layer C: The Learning & Control Layer

#### Engine 09 — Learning Engine
*   **Purpose**: Convert historical outcomes into future operating intelligence [16].
*   **Core Logic**: When a lead transitions to Won (Rate 9), Engine 09 calculates the **Performance Delta ($\Delta_p$)** and automatically triggers the Audience Engine (Engine 03) to update network lookalike seeds [17, 31].

#### Engine 10 — AI, Automation & Governance Layer
*   **Purpose**: Enforce institutional safety, budget boundaries, and codebase stability [18].
*   **Core Logic**: Enforces pre-deployment validation checks (`pnpm typecheck`, `pnpm i18n` trilingual checks) and monitors the Spend Governor to prevent programmatic overspend [36, 70].

#### Engine 11 — The Cash & Token Utility Engine
*   **Purpose**: Decouple ad-spend budgets for individual agents, and eliminate subscription friction for multi-tenant organizations via a dual-mode wallet substrate [29, 33].
*   **Core Logic**: 
    *   *Single-Tenant (Agency Wallet)*: Governs intra-system cash transfers and campaign burns (`1 Cash = 1 AED`), routing agent-funded leads exclusively to that agent's account [33].
    *   *Multi-Tenant SaaS (Account Wallet)*: Implements a 100% subscription-free, pay-as-you-go token model [33]. Users pay strictly for system actions—such as compiling Listing-to-Landing pages, executing Google search ad injections, or streaming CAPI telemetry [33].
*   **Outputs**: Wallet balances, transaction tables, and compliance overhead margin adjustments [62].

#### Engine 12 — Contextual Chat Engine
*   **Purpose**: Provide zero-obfuscation relational integrity across roles while using role-sensitive perception filters to tailor Expert AI intelligence [71].
*   **Core Logic**: Docked Expert AI chat intercepts scroll coordinates and user roles, serving project-pitch counters to agents and financial leaks to administrators.
*   **Outputs**: Screen-aware, role-bound intelligence summaries [71].

---

## 4. Key Database Schema & Integrity Rules
*   **Single Unified Database**: All engines share a Neon PostgreSQL instance, ensuring instant state synchronization and preventing data fragmentation [67].
*   **Precision Standard**: Price fields are mapped strictly as **`DOUBLE PRECISION`** to prevent rounding errors in financial attribution and comparable analyses [62].
*   **Temporal Logging**: Status transitions are logged with precise millisecond `TIMESTAMPS` to power anti-gaming telemetry.

---

## 5. Codebase Verification Gauntlet
Every code change must pass through the automated CI pipeline before deployment:
1.  **`pnpm typecheck`**: Strict TypeScript compilation with zero errors [70].
2.  **`pnpm i18n`**: Audits all dictionary keys across English, Arabic, and Russian to ensure layout parity and RTL mirroring [36, 70].
3.  **`db-contract-nightly.yml`**: Nightly Postgres schema verification against the live database mapping [62].
