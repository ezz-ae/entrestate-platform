# Engine 11 — The Cash Engine Specification

**Document Version**: 2.0.0  
**Parent System**: Entrestate Intelligence OS  
**Status**: INTEGRATED / OPERATIONS ACTIVE (Governing real-time tokenized ad-payment distributions and ledger accounting)  
**Core Thesis**: *The agency ad-dependency model is broken. Decoupling ad-spend capital from centralized agency decisions allows agents to function as self-funded, highly optimized marketing nodes.*  

---

## 1. Executive Purpose & Architectural Thesis
In traditional real estate brokerages, the company controls the entire marketing budget. Because running ad campaigns on Meta and Google is complex and requires specialized media buyers, the firm chooses which listings to advertise centrally. This creates two critical operational pathologies:
1. **The "Project Monopoly" Trap**: Agents are forced to pitch and sell only the specific off-plan projects that the company is currently advertising—limiting the agents' flexibility and misaligning with client needs.
2. **Structural Agency Friction**: High-performing brokers are forced to wait for centralized marketing queues to launch landing pages and campaigns, missing rapid market-movement windows.

**Engine 11 (The Cash & Token Utility Engine) eliminates these barriers through a Sovereign Dual-Mode Wallet substrate.**

The engine is designed to operate under two distinct structural environments depending on the deployment scope:

### A. Single-Tenant Mode: Agency-Level Decentralization (e.g., Freehold Property)
On a private brokerage deployment, the wallet operates as an **Internal Agent-Delegated Economy** where **`1 Cash = 1 AED`**. The company's administrators mint and distribute Cash directly to individual agent accounts as performance incentives, quotas, or commission advances. Armed with internal tokens, the agent programmatically deploys Listing-to-Landing campaigns with "full marketing agency power." Leads generated from these campaigns automatically bypass standard CRM distribution and land directly in that specific agent's account, creating a self-funded, highly optimized agent node.

### B. Multi-Tenant SaaS Mode: Zero-Subscription Pay-As-You-Go Platform (e.g., Entrestate Platform)
On the parent platform (Entrestate.com), the wallet establishes an **Account-Level Token Economy** that completely removes the barrier of traditional monthly SaaS subscriptions and upfront contract fees [33]. Instead, the platform is **100% pay-as-you-go**, where account seats are free and all operational actions are funded through direct token consumption:
*   **Listing-to-Landing Compilations**: Compiling custom, standalone conversion pages consumes tokens [33, 44].
*   **Google Ads Search Machine Injections**: Executing real-time search queries and bidding matches consumes tokens [94].
*   **Micro-Behavioral Telemetry Events**: Real-time event tracking and client-side mouse velocity logs consume tokens.
*   **CAPI Server-Side Tracking**: Server-side Conversions API data streams consume tokens [97].
This pay-as-you-go token model allows small-to-midsize brokerages to deploy the system with **zero upfront cost**, scaling token consumption in direct proportion to active transactional success and lead volume.

---

## 2. Mathematical Ledgers & Transaction Lifecycle
To ensure absolute institutional auditability across the private Neon PostgreSQL database, the Cash Engine enforces standard ledger accounting rules:

```
  [Brokerage Treasury] ────(Mint: Cash = AED)────► [Master System Account]
                                                         │
                                               (Transfer: Lead Credits)
                                                         ▼
                                                [Agent Active Wallet]
                                                         │
                                             (Burn: Ad Launch/Surcharges)
                                                         ▼
                                             [Meta Graph & Google APIs]
```

Every balance adjustment is written to a transaction ledger (`wallet_transactions`) utilizing three atomic transaction actions:
*   **MINT**: Capital injection from physical bank deposit or developer allocation. Real AED is converted to system Cash (`1 Cash = 1 AED`).
*   **TRANSFER**: Brokerage admins distribute Cash to individual agent wallets based on performance, project quotas, or commission advances.
*   **BURN**: Triggered programmatically when an agent launches a campaign. Tokens are burned in real time to cover external ad-network spend and system-level overhead adjustments.

---

## 3. Intelligent Agent Campaign Execution
When an agent funds a campaign using their internal Cash balance, the system coordinates three engines to maintain decentralized operational safety:

### 3.1 Structural Data Flow
1.  **Sovereign Ad Injection (Engine 05)**: The agent selects a scored listing and allocates a budget in Cash. Engine 05 converts these tokens to raw currency parameters and deploys the campaigns directly via ad network APIs.
2.  **Autonomous CRM Isolation & Routing (Engine 07)**: All campaigns generated by agent-funded accounts are automatically tagged with the agent's unique `owner_id`. When a webhook lands (Meta pixel, search lead, or comment-trigger), Engine 07 skips standard lookalike assignment and **routes the lead directly and exclusively into that agent's active CRM inbox**.
3.  **The Spend Governor Check (`spend-authority.ts`)**: Campaigns launched by agents are bound to the same non-negotiable rules as executive campaigns. If an agent-funded ad set crosses its programmatic Cost Per Lead (CPL) cap, the Spend Governor immediately halts the campaign and returns the remaining unspent Cash balance to the agent's wallet.

### 3.2 Dynamic AI Overhead and Margin Adjustments (Engine 10)
Allowing non-marketing personnel to run active campaigns introduces regulatory, brand, and financial risks. To offset this, Engine 10 acts as an automated campaign compliance auditor:
*   **The Compliance Check**: The AI parses the agent's submitted creatives, localized keywords, and budget settings.
*   **Overhead Calculation**: If the campaign contains complex trilingual localization or targets highly competitive areas, the system dynamically calculates a **Surcharges and Margin Index (SMI)**.
*   **Programmatic Surcharge**: The AI applies a nominal surcharge (e.g., burning an extra 5% of tokens to cover system-level review and deployment overhead), ensuring that the "extra work" and platform resources are programmatically priced into the agent's campaign execution cost.

---




## 5. Multi-Tenant SaaS App Store & Monetization Structure
The parent platform (`entrestate.com`) rejects traditional per-seat licensing friction [27, 33]. Every onboarded agent receives the Core CRM, the Automation Studio, and the DLD Decision Terminal for 100% free under their own branded colors and domain. 

Monetization only begins when they activate high-velocity execution modules from the **App Store**:
*   **Meta for Realtors (The Audience Factory)**: Automatically synchronizes CRM outcomes to Meta Custom Audiences.
*   **Leadformer (Conversational qualifying app)**: A conversational form that chats and qualifies leads on the landing pages.
*   **Google Ads Machine**: Automates dynamic Listing-to-Landing creation and search intent CPC bidding.

---

## 6. The `/ctrl` Partner Plane & Lead-by-Lead Marketplace (The Ultimate Scaling Desk)
Siloed inside the private administrative route **`/ctrl`**, the platform features a highly optimized **Partner Control Plane** designed to capture massive commercial market share once the platform reaches critical mass (e.g., 1,000+ active brokers onboarded).

### 6.1 The B2B Lifecycle Evolution
The platform's business model is engineered around a three-tier lifecycle:
1.  **Frictionless Adoption (Free CRM)**: Onboards thousands of independent brokers with free, fully white-labeled software (the Entrestate branding completely disappears past the login screen).
2.  **App Store Scaling (SaaS Utility)**: Active agents configure their own pixels and run campaigns using pay-as-you-go tokens.
3.  **The Lead-by-Lead Marketplace (Liquid Yield)**: For brokers who do not want to manage ad accounts, design landing pages, or navigate Meta's setup, the platform opens the central **Lead Marketplace**.

```
    [Ad Spend on Master /ctrl Accounts]
                   │
                   ▼
       [Unified Lead Generation]
                   │
                   ▼
     [Real-Time Cost Calculation]
                   │
                   ▼
    [Apply 25% Arbitrage Markup (M_m)]
                   │
                   ▼
     [Liquid Lead-by-Lead Marketplace]  ◄── Brokers buy individual leads instantly
                   │
                   ▼
     [Sovereign Pipeline Injection]     ──► Leads land directly in broker inbox
```

### 6.2 Relational Arbitrage Formulation
When campaigns are executed centrally through Entrestate's master ad accounts within the `/ctrl` space, the system tracks the exact cost of acquisition. When a lead is listed in the marketplace, its buy-it-now token price ($P_{lead}$) is computed using a programmatic **25% Arbitrage Margin** ($M_m = 0.25$):

$$P_{lead} = C_{gen} \cdot (1 + M_m) = \left( \frac{Spend_{ad}}{Leads_{captured}} \right) \cdot 1.25$$

*Where:*
*   $C_{gen}$ is the actual real-time generation cost of the specific audience segment.
*   The **25% premium** represents a high-margin revenue stream for the platform while remaining incredibly cost-effective for brokers, who get guaranteed high-intent leads without ad-manager overhead, pixel warming, or testing risk.

### 6.3 Programmatic Lead Ingestion & Handover
1.  **Central Webhook Capture**: Leads are generated through master campaigns and land in the `/ctrl` admin dashboard.
2.  **Marketplace Listing**: The system programmatically categorizes leads by project area (Engine 02) and behavioral intent (Engine 06).
3.  **Instant Ownership Handover**: The moment a broker purchases a lead, the transaction is logged to `wallet_transactions` (burning the corresponding tokens from their wallet).
4.  **Inbox Injection**: The lead's database relation `owner_id` is updated to the purchasing broker, instantly injecting the contact card and its entire micro-behavioral telemetry heatmap straight into their private CRM dashboard with **zero brand leakage**.

---
