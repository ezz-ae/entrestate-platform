# Engine 07 — CRM Machine Specification

**Document Version**: 4.0.0  
**Parent System**: Entrestate Intelligence OS [1, 99]  
**Status**: INTEGRATED / OPERATIONS ACTIVE (Governing real-time lead routing, deduplication, and anomaly guardrails) [32, 67]  
**Core Thesis**: *The CRM is not a static warehouse for contact rows; it is an active operational engine that routes intelligence, enforces database sovereignty, and drives real-time closed-loop feedback.* [14, 15]

---

## 1. Executive Purpose & Architectural Thesis
In traditional real estate brokerages, the CRM is a passive, flat database where agents manually log notes and drag cards across visual pipelines [14, 15]. It sits in isolation, blind to marketing spend, inventory scoring, and audience modeling [2, 3]. Because the database has no relational integrity connected to the acquisition layer, duplicates run rampant, lead distribution is arbitrary, and agents can easily "game" pipeline statuses without accountability [3, 14].

**Engine 07 (The CRM Machine) transforms this by establishing strict Database Sovereignty.** [14, 67]

It operates as an active, state-governed routing and validation system. Sharing a single, unpooled Neon PostgreSQL database and AI layer with the rest of the OS, Engine 07 ensures that every CRM interaction instantly feeds the downstream marketing learning loop, protects data integrity from manual agent corruption, and optimizes client-broker matchups based on historical transaction success. [67, 68]

---

## 2. Dynamic Input Matrix
To drive intelligent routing and maintain data integrity, Engine 07 continuously ingests structured data from multiple pipelines [12, 14]:

| Input Parameter | Data Type | Source Engine / Table | Description |
| :--- | :--- | :--- | :--- |
| **Normalized Contact Info** | `VARCHAR` | Ingest Webhook / API | Cleaned email and phone stripped of spaces, symbols, and country codes. |
| **UTM / Adset Context** | `UUID` / `JSONB` | Engine 05 (Acquisition) | Original ad campaign, ad creative, and keyword intent parameters. [10, 12] |
| **Target Project ID** | `UUID` | Engine 02 (Inventory) | The specific project the buyer engaged with, including its Investor Score. [7, 14] |
| **Agent Performance Profiles**| `JSONB` | CRM Database | Historical conversion metrics, active pipeline velocity, and success rates. [14, 15] |
| **Temporal Status Logs** | `TIMESTAMP` | `lead_status_history` | Exact timestamps of status transitions used to detect gaming anomalies. |

---

## 3. Processing Logic & Core Operational Modules

Engine 07 executes its operational mandate through three primary automated systems:

```
                  [ Inbound Lead Payload ]
                             │
                             ▼
              ┌─────────────────────────────┐
              │ 3.1 Unified Deduplication   │  ◄── Resolves contact duplicates,
              │     & Conflict Resolution   │      protects agent ownership
              └──────────────┬──────────────┘
                             │ (Normalized / Unified)
                             ▼
              ┌─────────────────────────────┐
              │  3.2 Lookalike-to-Agent     │  ◄── Evaluates agent win-rates
              │     Success-Based Routing   │      on specific audience seeds
              └──────────────┬──────────────┘
                             │ (Optimized Allocation)
                             ▼
              ┌─────────────────────────────┐
              │  3.3 Temporal Anomaly Gate  │  ◄── Detects bulk gaming, quarantines
              │     (Anti-Gaming Guardrail) │      seeds, triggers redistribution
              └──────────────┬──────────────┘
                             │
                             ▼
                     [ Clean CRM Desk ]
```

### 3.1 Unified Deduplication & Behavioral Intent Escalation
When a new inquiry lands via Meta webhooks, Google search, or lead forms, Engine 07 runs an instant normalization sweep on phone numbers and emails. However, instead of treating a duplicate submission as a mere administrative cleanup task, Entrestate treats the act of duplication as a **critical, high-urgency behavioral intent signal**, evaluated through our **Two-Way Programmatic Behavior Analysis** framework:

*   **The Parallel Telemetry Validation**: When a duplicate inquiry is ingested, the CRM Machine queries the `idle_telemetry` table. If the contact's browser session has registered repeated "focus-after-idle" events on a specific JVC or Palm Jumeirah property landing page, it mathematically verifies them as a high-intent, active buyer, bypassing standard manual verification delay.
*   **The Psychology of Duplication**: A buyer submits their details a second time, or comments a keyword like **"استثمار"** on a separate active creative, because their urgency is extremely high, they did not trust the speed/integrity of the initial touchpoint, or they couldn't establish an immediate human connection. It is a loud behavioral cry for immediate engagement.
When a new inquiry lands via Meta webhooks, Google search, or lead forms, Engine 07 runs an instant normalization sweep on phone numbers (formatting with international country codes) and emails. However, instead of treating a duplicate submission as a mere administrative cleanup task, Entrestate treats the act of duplication as a **critical, high-urgency behavioral intent signal**:

*   **The Psychology of Duplication**: A buyer submits their details a second time, or comments a keyword like **"استثمار"** on a separate active creative, because their urgency is extremely high, they did not trust the speed/integrity of the initial touchpoint, or they couldn't establish an immediate human connection. It is a loud behavioral cry for immediate engagement.
*   **The Silent Escalation Policy**: The system **never** reveals to the user on the frontend that they are "duplicated," nor does it flag the lead to the broker with a generic "duplicate warning" (which conventionally causes agents to dismiss or de-prioritize the lead as spam). 
*   **The Programmatic Execution Flow**:
    1.  **Silent Merging & Multi-Touch Attribution**: The engine silently merges the new engagement metadata (new UTM parameters, creative ID, comment keywords, or search terms) directly into the existing lead's audit trail, updating multi-touch attribution tables.
    2.  **Comparative Intent Clustering (ICI Analysis)**: Before escalating, the system calls Engine 06's **Intent Convergence Index (ICI)**. It calculates the mathematical focus between the first inquiry ($S_1$) and second inquiry ($S_2$) based on asset class and area parameters.
    3.  **Categorized Escalation Path**:
        *   **For Convergent Buyers ($ICI \ge 0.5$, e.g. same property type & area)**: The system programmatically escalates the lead's status to **`Rate 8`**, placing the lead card at the **absolute top** of the assigned broker's active queue. The system triggers a high-severity, real-time WebSocket alert: *"⚠️ High-Urgency Convergent Buyer: [Lead Name] has submitted a secondary matching inquiry in JVC. Contact within 5 minutes."*
        *   **For Scattered Browsing Profiles ($ICI < 0.5$, e.g. villa first, then apartment in a different area)**: The system bypasses Rate 8 escalation, maintaining standard queue routing to protect the sales floor's attention. The duplicate metadata is silently logged for standard-velocity follow-up, and no automatic high-priority alerts are fired.
    4.  **The Convergent 15-Minute Neglect Trigger**: For verified Convergent Buyers, if the assigned broker fails to open the card or log a Call/WhatsApp contact event within **15 minutes** of the escalation, the system programmatically revokes ownership and redistributes the lead to active, top-performing agents to prevent valuable lead leakage.
*   **Commercial Conflict Resolution**:
    *   If the existing lead is in an **Active Pipeline Stage** (e.g., Contacted, Viewing, Negotiation), the lead remains owned by the original assignee to prevent commission disputes [14]. The owner receives an instant Slack/WhatsApp alert: *"Active lead [Name] has engaged with a new campaign: [Campaign Name]"*.
    *   If the existing lead is marked **"Lost" or "Disqualified"** but has re-engaged with a new asset, the system automatically revives the lead card, resets its status to "New," adjusts its rate control signal, and routes it to the active queue [12, 14].

### 3.2 Lookalike-to-Agent Success-Based Routing
Rather than relying on basic round-robin or manual assignment, Engine 07 queries the unified database to optimize client-broker matching:
1.  **Audience Segment Identification**: The incoming lead is mapped back to its originating lookalike audience profile (Engine 03) and project target (Engine 02) [7, 8].
2.  **Performance Evaluation**: The system runs a real-time query on agent historical close records:
    ```sql
    SELECT owner_id, COUNT(*) as wins
    FROM "Lead"
    WHERE status = 'Won' 
      AND audience_id = $1
    GROUP BY owner_id
    ORDER BY wins DESC LIMIT 1;
    ```
3.  **Intelligent Allocation**: The lead is automatically routed to the broker with the highest success rate for that specific buyer segment and property profile (e.g., matching a Russian-speaking off-plan luxury investor with the agent who has closed the most RU luxury lookalike deals) [36, 70].

### 3.3 Temporal Anomaly Gate (Anti-Gaming & Audience Protection)
To prevent agents from manipulating CRM pipelines to look active or clean up backlogs before management reviews, Engine 07 enforces a strict anti-gaming temporal validator:
*   **The Trigger Event**: If an agent executes status modifications on **multiple leads (e.g., >5 records) within a compressed time window (e.g., <10 minutes)**, the system flags a **Bulk Status Event**.
*   **Programmatic Actions**:
    1.  **Audience Seed Quarantine**: The system immediately isolates those leads. They are strictly **excluded** from Engine 03's downstream lookalike seed compilations, ensuring fabricated CRM movements do not pollute active campaign training models [8, 31].
    2.  **Lead Redistribution Trigger**: If the status change is verified as "neglect-cleaning" (marking active, ignored leads as lost to lower backlog), the platform automatically **revokes ownership** and redistributes those leads to active, high-performing brokers [14, 34].
    3.  **Management Reconciled Ledger Log**: The anomaly, the agent's ID, the affected leads, and the timestamp are logged directly to the administrative ledger and reported instantly to management [36].

---

## 4. System Outputs
*   **Deduplicated Lead Profile**: A unified, multi-touch single customer record containing complete interaction history.
*   **Intelligent Allocation Commands**: Automated routing payloads delivered to agents inside the CRM desk within 54 seconds of ingest [28].
*   **Seed Exclusion Flags**: Hard boolean indicators in the database that block specific leads from training marketing campaigns.
*   **Management Anomaly Alerts**: Live telemetry notifications flagged to administrators regarding suspicious bulk pipeline activity.

---

## 5. Evidence & Verification
| Claimed State | Verification Target / File Path | Proof Method / Test Command |
| :--- | :--- | :--- |
| **BUILT** | `components/freehold/crm-table.tsx` | Verify the deduplication tab is active and visually merges multi-touch inquiries on normalized phone numbers. |
| **INTEGRATED** | `lib/deals.ts` | Verify that status transition timestamp logging captures the exact second of CRM updates to feed the temporal anomaly detector. |
| **AUTOMATED** | `app/api/freehold/leads/rate` | Run end-to-end simulation where bulk status changes trigger lookalike seed quarantine and redistribute active leads. |
