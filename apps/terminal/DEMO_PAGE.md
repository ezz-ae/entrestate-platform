# Entrestate Transaction Layer — Demo Page Build Guide

## What This Demo Proves

A 35-second live demonstration that executes 8 steps against **real Dubai data** — 2,813 projects + 7,217 leasing folders + 36,841 DLD transactions across 167 areas from 75 developers.

**This is not a prototype. This is live infrastructure querying real data in <0.5 seconds.**

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  DEMO FRONTEND (React / Next.js)                │
│  Single page, 8 interactive steps               │
│  Each step = one API call → animated result      │
├─────────────────────────────────────────────────┤
│  GEMINI BRIDGE (client.ts)                      │
│  Model Context Protocol client                  │
│  Maps 7 tools to Gemini function declarations   │
├─────────────────────────────────────────────────┤
│  MCP SERVER (index.ts)                          │
│  7 database tools, Sybil Firewall               │
│  Keyword intent classification                  │
├─────────────────────────────────────────────────┤
│  NEON POSTGRES                                  │
│  entrestate_tx schema: 40 tables, 9 functions      │
│  7,217 leasing folders from live intake        │
│  9 API views, 22 state transitions              │
└─────────────────────────────────────────────────┘
```

---

## Demo Steps (build each as a card/section on the page)

### Step 1: Paste Live URL → Structured Deal Record (SDR)
- **Input**: Text field for a legacy portal URL
- **Action**: `POST /api/demo/ingest` → parses URL, matches spine, returns delta checklist
- **Display**: Split view — raw payload left, SDR right, deltas highlighted in amber
- **Proves**: Zero manual data entry. Authority-before-import in action.

### Step 2: Sybil Firewall — Genetic Collision Detection
- **Input**: "Publish" button on the ingested folder
- **Action**: `POST /api/demo/publish` → runs address collision + network hash check
- **Display**: If collision → red shield icon + "Upload Title Deed to verify ownership"
- **Display**: If clean → green checkmark + "Published to Entrestate Transaction Layer"
- **Proves**: Automated fraud detection. User never sees the reason. Replaces 20-50 FTE moderators.

### Step 3: Tenant Discovery — Autonomous Query Engine
- **Input**: Chat-style text input: "I need a 2BR in Marina under 3M"
- **Action**: `POST /api/demo/search` → vector-style search across 7,217 leasing folders
- **Display**: 5 property cards with name, price, area, queue depth badge
- **Proves**: Not a chatbot wrapper. Deterministic SQL. Zero hallucination.

### Step 4: Hold + Queue Mechanics
- **Input**: "Hold This Unit" button on a search result
- **Action**: `POST /api/demo/hold` → grants 48h hold or queues with priority
- **Display**: Hold timer (48:00:00 countdown) OR queue position with priority badge
- **Proves**: Liquidity management. No inventory freeze. Automatic queue.

### Step 5: Soft-Bounce Recovery — Zero Leaked Intent
- **Input**: Automatic — triggered when hold expires or unit is taken
- **Action**: `POST /api/demo/recover` → finds 95% genetic match
- **Display**: Side-by-side: original unit vs. recovered match with similarity score
- **Proves**: Zero leaked intent. This is the AED 25-50M/yr value proposition.

### Step 6: Trust Protocol
- **Input**: Two channel selection forms (Party A and Party B)
- **Action**: `POST /api/demo/consent` → computes intersection
- **Display**: "Shared channel unlocked: Email" or "No shared channel yet"
- **Proves**: Privacy-first by architecture. Not policy.

### Step 7: WhatsApp Intent-to-Button Routing
- **Input**: Text field simulating WhatsApp message
- **Action**: `POST /api/demo/classify` → classifies intent, returns buttons
- **Display**: Intent card with confidence bar + safe action buttons
- **Proves**: Controlled communication. State changes only via button taps.

### Step 8: State Machine Visualization
- **Input**: Interactive state graph (nodes = statuses, edges = transitions)
- **Action**: Click any transition to attempt it → validated in real-time
- **Display**: Green flash for valid, red flash + reason for invalid
- **Proves**: 22 deterministic transitions. No edge cases. No surprises.

---

## API Routes (Next.js /api/demo/)

| Route | Method | MCP Tool | Returns |
|---|---|---|---|
| `/api/demo/ingest` | POST | — (direct SQL) | Structured workspace + deltas |
| `/api/demo/publish` | POST | `attempt_publish` | Published or verification_required |
| `/api/demo/search` | POST | `search_mapped_city` | Top 5 matching folders |
| `/api/demo/hold` | POST | `request_primary_hold` | Hold granted or queue position |
| `/api/demo/recover` | POST | — (direct SQL) | 3 genetic matches |
| `/api/demo/consent` | POST | `check_consent_overlap` | Shared channels |
| `/api/demo/classify` | POST | `classify_whatsapp_intent` | Intent + buttons |
| `/api/demo/transitions` | GET | — (direct SQL) | All 22 valid transitions |

---

## Environment Variables

```env
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
GEMINI_API_KEY=your_key_here
```

---

## Dependencies

```json
{
  "@google/generative-ai": "^0.21.0",
  "@modelcontextprotocol/sdk": "^1.0.0",
  "pg": "^8.13.0",
  "dotenv": "^16.4.0"
}
```

---

## Design Notes

- **No consumer UI**. This is the Entrestate Transaction Layer demo, not a marketplace.
- Every step shows the **execution time** in the bottom-right corner.
- The closing screen: *"This is not a marketplace. This is an invisible transaction layer that sits under YOUR portal and turns YOUR chaotic traffic into structured, fraud-checked, transaction-ready deal rooms."*
- Data is real: 2,813 projects + 7,217 leasing folders + 36,841 DLD transactions. When the CTO sees live inventory structured in real time, that's the close.
