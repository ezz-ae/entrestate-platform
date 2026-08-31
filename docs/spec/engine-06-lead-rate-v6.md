# Engine 06 — Lead Intelligence / Rate Engine Specification

**Document Version**: 3.0.0  
**Parent System**: Entrestate Intelligence OS [1, 94]  
**Status**: INTEGRATED / INTELLIGENT (Exposing active lead scoring and rating indicators under live production conditions) [32, 67]

---

## 1. Executive Purpose & Architectural Thesis

The **Lead Intelligence / Rate Engine (Engine 06)** resolves the structural blind spot of traditional real estate sales pipelines. In conventional brokerages, marketing departments optimize campaigns for raw click-throughs or Cost Per Lead (CPL) [2, 3], while sales departments operate on disconnected CRM systems that view leads as flat contact rows [14, 95]. Because these layers are isolated, the system cannot programmatically tell which marketing spend actually yielded high-value commercial engagement [3].

**Engine 06 bridges this gap by turning the lead rating into a dynamic, system-wide control signal.** [79]

Rather than functioning as a passive, backward-looking key performance indicator (KPI) on a static dashboard [12, 13], the **"Rate"** is an active numerical parameter stored in the database [79]. It represents the exact commercial value and conversion velocity of each opportunity [13, 79]. 

By establishing a strict **0-to-10 decimal scale**, Engine 06 programmatically communicates a lead's status directly to the **Learning Engine (Engine 09)**, dynamically adjusting the prioritization of active campaigns, ad-spend allocations, and target audience segments [13, 79].

---

## 2. The 0-to-10 Dynamic Rating Scale

Under live production conditions (as deployed on **`freeholdproperty.ae`** and managed via the **`ezz-ae/ORE`** repository [67]), the system-wide Rate is modeled as a standardized integer scale from `0` to `10` [74]:

```
   [Inbound Ingest] ──────► [Rates 1 - 3: Initial Contact & Inbound Verification]
                                  │
                                  ▼
                            [Rates 4 - 7: Active Sales Qualification & Engagement]
                                  │
                                  ▼
                            [Rate 8: PEAK ACTIVE LEAD (Highest Unclosed Intent)]
                                  │
                                  ▼
                            [Rate 9: WON DEAL / CLOSED OUTCOME (Triggers Learning Loop)]
                                  │
                                  ▼
                            [Rate 10: MASTER LEAD / REPEAT INSTITUTIONAL VIP]
```

### 2.1 Rates 1 to 8: The Open Lead Spectrum
*   **Definition**: Represents the continuous spectrum of lead quality, responsiveness, and buying intent prior to contract finalization.
*   **The Cap (Rate 8)**: **`8` is the absolute maximum rate for an open lead that has not yet closed** [74]. It indicates a peak-quality, highly qualified prospect who has completed property viewings, verified their purchasing power, and is in active contract negotiation (e.g., premium prospects like Humaid, Talal, Mina Mouris, or Suleiman in the active CRM [74]). 

### 2.2 Rate 9: Won Deal / Closed Transaction
*   **Definition**: Indicates a completed, closed transaction where a contract is signed and commission is reconciled [15].
*   **Loop Closure Trigger**: When an agent transitions an opportunity to **Won** in the CRM, the rate is programmatically set to **`9`** [32, 74]. This state change automatically registers the contact as a successful acquisition seed, commanding the **Learning Engine (Engine 09)** to push updated customer definitions straight to Meta and Google marketing APIs to adjust campaign lookalikes [17, 31, 42].

### 2.3 Rate 10: The Master Lead / VIP Investor
*   **Definition**: The highest-tier classification, reserved for **Master Leads** [74].
*   **Strategic Role**: Representing repeat high-net-worth buyers, institutional investors, or long-term developer partners who act as permanent structural anchors in the database [74]. Rate 10 records are protected from standard lead decay and carry maximum statistical weight when training downstream target-profile matching models.

### 2.4 Programmatic Cohort Routing (Copy / Avoid / Unrated)
To execute closed-loop marketing, the Rate calculated by Engine 06 is used by the Audience Engine (Engine 03) to automatically segment all live leads in the database into active cohorts [74]:

*   **The "Copy" Cohort (`Rate >= 4`)**: Combines all qualified engagement into lookalike seed files [74]. Under live conditions (AED 52,944.33 spend yielding 342 leads), this cohort contains:
    *   **`bought` (Rate 9/10)**: **`1 Lead`** (closed transaction) [74].
    *   **`qualified` (Rates 4-8)**: **`122 Leads`** [74].
        *   **`perfect` (Rate 8)**: **`75 Leads`** (highest-quality active unclosed prospects like Humaid, Talal, Mina, Suleiman) [74].
        *   **`good` (Rates 4-7)**: **`47 Leads`** (active, responsive qualified leads) [74].
    *   *Ad-Network Status*: Programmatically resolved and matched to **`114 Matched Records`** synced directly to Meta and Google Custom Audiences as **`Build / In campaigns / Running`** [74].
*   **The "Avoid" Cohort (`Rates 1-3`)**: Automatically segments all **`118 junk`** or disqualified contacts [74]. These are pushed directly to ad-network exclusion lists, ensuring no active marketing budget is wasted on historically cold or bad-data targets [74].
*   **The "Unrated" Cohort (`Rate = null`)**: Isolates **`1 unrated lead`** awaiting manual broker classification [74]. It is strictly quarantined to prevent seed pollution [74].

---

## 3. Integrated Inputs Matrix

To calculate and adjust a lead's dynamic rate, Engine 06 continuously ingests and parses structured parameters from the database [12, 56, 69]:

| Input Attribute | Source Table / API | Data Type | Analytical Role in Rate Calculation |
| :--- | :--- | :--- | :--- |
| **Lead Context** | `leads` [14, 56] | JSON / Record | Captures language preference (EN, AR, RU) [36], geography, and response latency. |
| **Campaign Origin** | `leads.campaignId` [32] | UUID | Maps the lead back to the specific active campaign and creative template [10]. |
| **Audience Segment** | `leads.audienceId` [14] | UUID | Cross-references the targeted lookalike profile to evaluate segment accuracy [9]. |
| **Target Inventory** | `leads.projectId` [14] | UUID | Links the buyer's query directly to the scored fitness rating of the listing [7]. |
| **Behavioral Logs** | Frontend analytics | JSON | Tracks scroll depth, time on landing pages, and language-flipping on the site [36]. |
| **Sales Interaction** | `interaction_logs` [14] | Sub-table | Ingests the frequency of WhatsApp messages sent/received and call durations [34]. |
| **Human Agent Rating** | CRM UI slider [74] | Integer (1-5 Stars) | Incorporates direct, qualitative human evaluations from active brokers [74]. |
| **Attributed Spend** | Meta & Google Ads | `DOUBLE PRECISION` | Factors in the active Cost Per Lead (CPL) to weigh marketing efficiency [10, 62]. |

---

## 4. Processing Logic & State Transitions

The progression of a lead's Rate is governed by deterministic system rules integrated across the database:

### 2.4 Deduplication Urgency & The Intent Convergence Index (ICI)
Under live operational conditions, when a lead executes a duplicate submission (submitting their details again or commenting a high-intent phrase like **"استثمار"** on a secondary campaign), Engine 06 does not blindly treat all duplicates equally. It runs a comparative intent analysis to protect broker capacity from noise while isolating high-velocity buyers:

*   **The Intent Convergence Index (ICI)**: When a duplicate payload lands, Engine 06 programmatically compares the target properties and metadata of the first submission ($S_1$) and the second submission ($S_2$):
    $$ICI = w_{type} \cdot S_{match}(Type(S_1), Type(S_2)) + w_{area} \cdot S_{match}(Area(S_1), Area(S_2))$$
    Where weights $w_{type} = 0.5$ and $w_{area} = 0.5$.
    *   **Convergent Focus ($ICI \ge 0.5$)**: If a buyer registers for **two apartments in the same area** (e.g., JVC to JVC), their intent is highly focused and geographically targeted. They are classified as an **Active Convergent Buyer**.
    *   **Divergent Focus ($ICI < 0.5$)**: If a buyer registers for a **villa and then an apartment in different areas**, they are classified as a **Scattered Browsing Profile** (simply browsing across diverse asset classes).
*   **Programmatic Action Policy**:
    *   **Active Convergent Buyers**: Engine 06 instantly injects a dynamic **Urgency Multiplier**, boosting the lead's status directly to **`Rate 8`** (Peak Active Lead with highest unclosed intent). This triggers the immediate owner priority escalation and activates Engine 07's strict **15-Minute Neglect Redistribution Gate**.
    *   **Scattered Browsing Profiles**: The lead remains at its baseline rate (e.g., Rate 3 or 4) and follows the normal routing queue. No automatic Rate 8 escalation is triggered, and the 15-minute neglect gate is bypassed. This protects the sales floor from "browse spam" and prevents agent burnout on scattered leads.
*   **The Escalation Event**: Every ICI calculation and resulting rate shift is stamped in an immutable audit ledger with the exact second of ingestion, the calculated coefficients, and the routing trigger sent to Engine 07's handlers.

### Phase 4.1: Programmatic Ingest Scoring (Rates 1 to 3)
Upon initial webhook capture or form submission, the system runs an automated check to assign a baseline rating:
*   **Behavioral Telemetry Ingestion**: Ingests Engine 04's micro-behavioral landing page telemetry (such as scroll-depth patterns and hover durations on pricing tables) [12]. If a user spent >45 seconds actively inspecting the DLD comparative transaction graph, the baseline score is instantly boosted.
*   **Implicit Choice Decoding**: The choice answers from the landing form are parsed against the profile classifier. A profile mapped to "resale growth" or "high rental yield" is assigned an immediate start of **Rate 3** due to verified high investment intent, without having to wait for a broker's manual assessment.
*   **Verification Check**: If the phone number is verified, the email is structurally valid, and UTM parameters are clean, the lead enters at **Rate 1** or **Rate 2** [32].
Upon initial webhook capture, the system runs an automated check to assign a baseline rating:
*   **Verification Check**: If the phone number is verified, the email is structurally valid, and UTM parameters are clean, the lead enters at **Rate 1** or **Rate 2** [32].
*   **Intent Multiplier**: If the lead submits an inquiry during off-hours or engages via premium landing assets (e.g., an Arabic late-night WhatsApp ping at 2:47 AM [28]), the platform assigns an immediate start of **Rate 3**, flagging the record for rapid routing [34].

### Phase 4.2: Engagement & Qualification Scoring (Rates 4 to 7)
As the assigned agent records active follow-up events inside the CRM [14]:
*   **Active Contact (Rate 4 - 5)**: Achieved once the agent logs a successful call, confirms the buyer's target budget, and documents preferred property characteristics [14].
*   **Scheduled viewing (Rate 6 - 7)**: Triggered programmatically when a viewing appointment is logged in the calendar (e.g., "معاينة الخميس ٤ عصراً أو السبت ١١ صباحاً" [28]).

### Phase 4.3: Peak Lead Scoring (Rate 8)
*   **The Active Cap**: Assigned when the agent rates the lead as a **"5-Star/Hot"** opportunity with verified purchase capability [32, 74]. This remains capped at **Rate 8** as long as the opportunity is active but unclosed, signaling that this lead represents the highest priority in the agent's work-queue [34, 74].

### Phase 4.4: Loop Closure Transition (Rate 9)
*   **Automated Promotion**: Triggered instantly when the agent drags the lead's status to `Won` inside the pipeline [32]. The system writes:
    ```typescript
    // Programmatic closure check in lib/deals.ts
    if (opportunity.stage === 'WON') {
      await db.lead.update({
        where: { id: leadId },
        data: { rate: 9 } // Transition to Closed Deal status
      });
      await triggerLearningLoop(leadId); // Reseed Meta Lookalikes
    }
    ```

---

## 5. Outputs & Downstream System Behavior

Calculating the Rate is only half of the loop; the output must actively control downstream engines:

1.  **To CRM Priority Engine (Engine 07)**: Inbound leads are sorted **"worst first" by default** based on decay risk and value [34]. Leads carrying a high Rate (e.g., Rate 8) are prioritized with immediate visual badges to prevent valuable commercial leakage [34, 74].
2.  **To Spend Governor (Engine 05)**: If a specific ad set produces a cluster of Rate 8 leads, the system increases its budget authorization limit inside `spend-authority.ts`, shifting capital away from campaigns yielding low-rate leads [29].
3.  **To Target Audience Refinement (Engine 03)**: Transitioning to Rate 9 triggers a server-side webhook that sends hashed customer profiles directly to marketing APIs to expand your custom audience seeds [31, 42].

---

## 6. System-Wide Guardrails & Governance

To ensure the integrity of the database, Engine 06 adheres to strict structural limits [35]:
*   **The Human-in-the-Loop Cap**: The transition to **Rate 9 (Deal)** or **Rate 10 (Master Lead)** can never be performed autonomously by an AI model. It requires a manual pipeline update signed by an authorized agent or CRM administrator [35, 72].
*   **"No Fake Ratings" Constraint**: The system forbids placeholder scores or estimated rates [35]. If a lead has not been evaluated or lacks communication logs, it displays its exact raw rating (such as "New" or a baseline Rate 1) rather than a fabricated estimation [35].

---

## 7. Evidence & Codebase Verification Drawer

Every claim regarding the Lead Intelligence / Rate Engine is anchored to physical assets in the codebase and active database schemas [24, 70]:

| Claimed Capability | Documented Evidence [24] | Codebase Implementation Path [71] |
| :--- | :--- | :--- |
| **Standardized 1-10 Ratings** | Visual CRM lead rating indicator [74] | `components/freehold/crm-table.tsx` / `(Rate)` |
| **Instant Language Capture** | Sub-minute webhook ingestion and language assignment [28] | `app/api/freehold/leads` & `lib/freehold/coordinator-tools.ts` |
| **Dynamic Rate Transition** | Transitioning opportunity to Won updating the Rate [32] | `lib/deals.ts` & CRM Pipeline workspace |
| **Automated Reseeding** | Triggering custom audience list pushes on Meta/Google APIs [31, 42] | `lib/meta/spend-authority.ts` & `lib/google/` |

---
