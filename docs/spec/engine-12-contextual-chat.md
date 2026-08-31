# Engine 12 — Contextual Chat Engine Specification

**Document Version**: 1.0.0  
**Parent System**: Entrestate Intelligence OS  
**Status**: INTEGRATED / OPERATIONS ACTIVE (Docked Expert AI chat fully screen-aware across active user sessions)  
**Core Thesis**: *Database security is about write permissions, but system intelligence is about role-sensitive visual perception. The AI must see what the role is meant to see, hiding nothing from the underlying database while enforcing context-rich summaries.*  

---

## 1. Executive Purpose & Architectural Thesis
Traditional enterprise systems handle data security and permissions through rigid database obfuscation. They hide rows, columns, and entire schemas depending on the logged-in user. While this keeps data locked away, it introduces two major structural flaws:
1. **The "Data Silo" Chaos**: Teams lose access to the global context. Agents cannot see comparable developer defaults, marketers cannot see CRM pipeline close velocity, and database performance suffers from constant view filtering.
2. **AI Blindness**: When a docked AI assistant tries to help a user, it lacks the context of what is currently on the screen, their role, and the exact database rows driving their decisions.

**Engine 12 (The Contextual Chat Engine) introduces a Zero-Obfuscation, Role-Sensitive Perception Model.**

In Entrestate, nothing is hidden across the database schemas to preserve perfect, unpooled relational integrity. However, the docked **Expert AI Chat** (`components/freehold/expert-chat.tsx`) is fully aware of every page, content block, active viewport coordinate, and the current user's authenticated role. 

The system does not obscure database records from role to role; instead, **the AI selectively filters its cognitive answers**, ensuring each role sees exactly what they are meant to see to execute their mandate with absolute clarity.

---

## 2. Dynamic Role-Sensitive Perception Filters
When a user opens the Expert Chat via the golden button or **Cmd/Ctrl-J**, the system passes a unified payload containing the current page URL, visible viewport elements, active database ID, and the user's validated role:

```
  [User Role: Agent / Admin] ────► [Expert Chat Opened] ────► Ingests Screen & Role Context
                                                                    │
                                                                    ▼
                                                       [Dynamic Response Filter]
                                                        /                     \
                                            (Agent Perspective)         (Admin Perspective)
                                                    │                               │
                                            - Comparable pitches            - Developer default risk
                                            - Target buyer matches          - Global ledger balance
                                            - Area comparable comps         - Marketing spend leaks
```

The system customizes its cognitive filters based on five key operational perspectives:

### 2.1 The Agent Perspective
*   **The Perception Focus**: Focused strictly on deal conversion and transaction velocity.
*   **The AI Output**: If an agent asks about a scored property listing, the AI highlights sales arguments, local comparable comps, payment plans, and matching lookalike buyers in their active follow-up queue. It suppresses raw corporate ledger balances or adjacent broker performance analytics.

### 2.2 The Administrator / Owner Perspective
*   **The Perception Focus**: Focused on business health, capital allocation, and compliance.
*   **The AI Output**: If an admin asks about the exact same listing, the AI highlights developer default risk, gross ad spend allocations, system-wide comparable margin leakage, and the active token balance of the broker owning the listing.

### 2.3 The Marketer Perspective
*   **The Perception Focus**: Focused on acquisition metrics and pixel optimization.
*   **The AI Output**: Provides campaign metadata, lookalike seed match rates, CPL calculations, and active Google Search keyword bid statistics.

### 2.4 The Accountant Perspective
*   **The Perception Focus**: Focused on financial reconciliations and commission logs.
*   **The AI Output**: Directs the user to unpooled ledger transaction histories, tax-withholding parameters, and cash transfer contracts.

### 2.5 The Developer / Partner Perspective
*   **The Perception Focus**: Focused on inventory status and build velocity.
*   **The AI Output**: Limits view to sales velocity, active viewings logged on their project, and high-level anonymous demographic feedback.

---

## 3. Screen-Aware Context Capture
The Expert Chat achieves sub-second context-awareness through a client-side viewport observer:
*   **Active Viewport Observer**: Extracted via `lib/freehold/coordinator-tools.ts`, the browser observes scroll positions, visible comparable tables, and current map viewports.
*   **Zero-Lag Context Ingestion**: When the user queries the chat, the system does not require a fresh database crawl. It parses the active on-screen DOM nodes and appends them to the LLM's system prompt using the `MEDIA_TEXT_MODEL` (Gemini 2.5 Flash).
*   **Unified Safety Gating**: Write permissions and external API triggers remain strictly governed by the Spend Governor, regardless of what the user and AI discuss in the chat.

---

## 4. Evidence & Codebase Verification Drawer

| Claimed Feature | Documented Evidence | Live Codebase Verification Route |
| :--- | :--- | :--- |
| **Docked Expert Chat UI** | Visible gold chat icon and viewport-docked container | `components/freehold/expert-chat.tsx` |
| **Screen-Aware Ingest** | Webhook handlers capturing active DOM context | `app/api/freehold/expert/` |
| **Role-Sensitive Filters** | Policy files restricting response templates | `lib/freehold/coordinator-tools.ts` |
| **Zero-Obfuscation Schema** | Shared Postgres instances across all roles | `prisma/` & `lib/db.ts` |

---
