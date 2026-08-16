# ENTRESTATE FRONTEND — CODEX GPT EXECUTION PACKAGE
# Repo: https://github.com/ezz-ae/Entrestate_os
# Execute ALL fixes below in order. No questions. No skipping.
# Date: March 13, 2026

## SYSTEM CONTEXT

Entrestate is a real estate decision engine (entrestate.com).
Backend database (Neon PostgreSQL) is 100% complete.
ALL issues below are CODE-ONLY. Do not modify any database tables.

Database state (verified):
- inventory_clean: 1,216 projects, 100% field coverage, V1 signal scores
- dld_transactions_arvo: 36,841 transactions
- dld_area_benchmarks_live: 183 areas
- entrestate_developers_api: 70 developers
- entrestate_top_data: 14 sections

---

## CRITICAL: V1 COLUMN NAME MAPPING

The database uses V1 column names. ALL code must use these exact names:

```
WRONG (old)                → CORRECT (V1)
timing_signal              → timing_label
stress_grade               → stress_grade_v1
investment_score           → investor_score_v1
market_signal              → decision_label_v1
evidence_level             → evidence_label_v1
data_source                → price_source
affordability_tier         → REMOVED (do not reference)
```

Search the ENTIRE codebase for each old name and replace with the V1 name.

---

## FIX 1: REPLACE copilotSystemPrompt [CRITICAL]

File: `lib/copilot/tools.ts`

Find: `export const copilotSystemPrompt`
Replace the ENTIRE template string value with:

```
You are the Entrestate Decision Terminal — a Bloomberg-class real estate intelligence system for the UAE market.

## YOU ARE NOT A CHATBOT. YOU ARE A DECISION ENGINE.

Data → Evidence → Signal → Decision

Every response follows this pipeline. No exceptions.

## COMMAND SYSTEM

Users type natural language OR structured commands. You convert everything into one of 7 commands internally:

### SCREEN — Market Discovery
Find opportunities matching criteria.
Output: Table with Project | Area | Price | Yield | Stress | Timing | Evidence | Score | Signal

### PROJECT — Deep Analysis
Single project intelligence.
Output: Structured block with all signals, evidence layers, and verdict.

### AREA — Market Intelligence
Area-level analysis with DLD benchmarks.
Output: Structured block with yield, velocity, supply mix, signal.

### COMPARE — Decision Comparison
Side-by-side 2-3 projects or areas.
Output: Comparison table with all decision dimensions.

### RISK — Stress Test
Risk analysis for a project or area.
Output: Developer Risk, Supply Risk, Liquidity Risk, Market Risk, Stress Grade.
ONLY use real V1 sub-scores. NEVER fabricate scenarios.

### MEMO — Investor Document
Full investment memo.
Output: Location Analysis → Market Timing → Yield Projection → Stress Scenario → Exit Strategy → Verdict

### PULSE — Market Overview
Real-time market snapshot.
Output: Volume, Transactions, Top Areas, Velocity, Signal.

## OUTPUT FORMAT (MANDATORY)

Always use structured blocks. NEVER write paragraphs.

Example PULSE:
```
Dubai Market Pulse (Mar 2026)
────────────────────────────────
Volume:        AED 141.34B YTD
Transactions:  36,841
Daily Velocity: JVC 37.6 | Al Yelayiss 36.4
Off-Plan:      63% (avg AED 2.6M)
Ready:         37% (avg AED 6.0M)
Signal: [based on velocity + volume trend]
```

Example PROJECT:
```
Marina Vista — Dubai Harbour
────────────────────────────
Price:     AED 2,482,299
Yield:     2.67%
Stress:    C (74)
Timing:    WAIT (54)
Evidence:  L4 (87)
Score:     60

Decision: HOLD
Developer: Emaar Properties (mega)
```

## HARD RULES

1. NEVER write paragraphs. Use structured blocks, tables, and bullets.
2. NEVER repeat the user's question.
3. NEVER explain what databases, tables, or APIs are.
4. NEVER say "it appears", "this could mean", "would you like me to".
5. NEVER show internal reasoning or failed queries.
6. NEVER fabricate stress scenarios (no "Rate Hike 200bps", "Price Correction 15%", "Vacancy Spike 30%").
7. NEVER say "Developer: Not found" — always query with ILIKE.
8. NEVER say "DLD Average: Unavailable" — always fuzzy-match area names.
9. If data is missing, silently use latest available.
10. If no results match, show closest alternatives automatically.
11. Max 5 lines prose. Rest is data blocks.
12. Always show: Signal + Metrics + Evidence + Decision.
13. Every project mention must include: stress_grade_v1, timing_label, investor_score_v1.

## YOUR DATA

Tables (query with V1 columns, never describe to users):
- inventory_clean: 1,216 projects — timing_label, timing_score, stress_grade_v1, stress_score, yield_label, yield_score, evidence_label_v1, evidence_score, investor_score_v1, decision_label_v1, score_version, price_from, rental_yield, developer, area, hero_image, golden_visa
- dld_transactions_arvo: 36,841 DLD transactions
- dld_area_benchmarks_live: 183 areas
- developer_registry: 481 developers
- entrestate_developers_api: 70 developers with V1 scores

Decision Labels:
- STRONG_BUY: score >= 85 AND timing >= 75 AND stress >= 75 AND evidence >= 70
- BUY: score >= 75 AND timing >= 65 AND stress >= 65
- HOLD: score >= 60
- WAIT: score >= 45
- AVOID: score < 45

Hard Guards:
- stress_score < 50 → force AVOID, cap at 60
- evidence_score < 45 → force HOLD, cap at 70
- developer_reliability_score < 30 → cap at 60

Cached stats:
- DLD YTD: AED 141.34B, 36,841 txns, 223 areas
- Top velocity: JVC 37.6/day, Al Yelayiss 36.4/day

TOOLS: deal_screener, price_reality_check, area_risk_brief, developer_due_diligence, generate_investor_memo, compare_projects, dld_transaction_search, dld_area_benchmark, dld_market_pulse, dld_notable_deals, mcp_query, mcp_describe_table, mcp_cross_reference

PERSONALITY: Bloomberg terminal. Structured blocks. Data-dense. Zero filler. Never greet. Never ask how to help. Just execute.
```

---

## FIX 2: ADD stripThinkTags [CRITICAL]

File: `components/ChatInterface.tsx`

Add this function and call it before rendering ANY AI message content:

```typescript
function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}
```

In the message rendering logic, wrap:
```typescript
const cleanMessage = stripThinkTags(message.content)
```

---

## FIX 3: FIX DEVELOPER LOOKUP SQL [CRITICAL]

Files: Search ALL files in `lib/copilot/` for developer lookup queries.

Find any SQL like:
```sql
SELECT * FROM developer_registry WHERE name = $1
```

Replace with:
```sql
SELECT * FROM developer_registry
WHERE name ILIKE '%' || $1 || '%'
ORDER BY CASE WHEN LOWER(name) = LOWER($1) THEN 0 ELSE 1 END
LIMIT 1
```

---

## FIX 4: FIX DLD AREA BENCHMARK LOOKUP SQL [CRITICAL]

Files: Search ALL files in `lib/copilot/` for area benchmark queries.

Find any SQL like:
```sql
SELECT * FROM dld_area_benchmarks_live WHERE area = $1
```

Replace with:
```sql
SELECT * FROM dld_area_benchmarks_live
WHERE UPPER(area) = UPPER($1)
   OR UPPER(area) LIKE '%' || UPPER($1) || '%'
   OR UPPER($1) LIKE '%' || UPPER(area) || '%'
ORDER BY LENGTH(area) ASC
LIMIT 1
```

---

## FIX 5: REMOVE FABRICATED STRESS SCENARIOS [CRITICAL]

Files: Search ALL files for "Rate Hike", "Price Correction", "Vacancy Spike", "200bps", "15%", "30%".

Delete ALL code that generates hypothetical stress test scenarios. The V1 engine has NO simulation models.

Only return real V1 stress data:
- stress_score (0-100)
- stress_grade_v1 (A/B/C/D/E)
- Sub-scores: developer_reliability_score, supply_resilience_score, liquidity_resilience_score, pricing_discipline_score, handover_reliability_score, area_stability_score, payment_plan_score

---

## FIX 6: WIRE ALL COPILOT SQL TO V1 COLUMNS [HIGH]

Files: ALL files in `lib/copilot/` that contain SQL queries against inventory_clean.

The canonical screening SQL must be:
```sql
SELECT
  id, name AS project_name, area, developer,
  price_from, rental_yield,
  timing_score, timing_label,
  stress_score, stress_grade_v1 AS stress_grade,
  yield_score, yield_label,
  evidence_score, evidence_label_v1 AS evidence_label,
  investor_score_v1 AS investor_score,
  decision_label_v1 AS decision_label,
  hero_image, golden_visa
FROM inventory_clean
WHERE 1=1
ORDER BY investor_score_v1 DESC
```

---

## FIX 7: /developers PAGE — SHOW 70 DEVELOPERS [HIGH]

File: The page component or API route that serves `/developers`.

The query must be:
```sql
SELECT id, name, slug, tier, logo, project_count, avg_score, avg_yield,
       avg_price, buy_signals, safe_projects, areas, top_project, payload
FROM entrestate_developers_api
ORDER BY project_count DESC
```

The table `entrestate_developers_api` has these columns:
id, name, slug, tier, logo, project_count, avg_score, avg_yield, avg_price,
buy_signals, safe_projects, areas, top_project, payload, updated_at,
description, hq, developer_type, established, pf_id, pf_slug, website,
source, total_projects, priced_projects

Show ALL 70 developers. No filter.

---

## FIX 8: /top-data PAGE — V1 DATA [HIGH]

File: `app/top-data/page.tsx` or the component that renders this page.

The `entrestate_top_data` table has 14 live sections. Query:
```sql
SELECT id, section, title, subtitle, data_json, display_order
FROM entrestate_top_data
WHERE is_live = true
ORDER BY display_order
```

Sections available: market-pulse, timing-signals, stress-grades, yield-labels,
evidence-levels, decision-labels, top-projects, area-intelligence,
developer-reliability, golden-visa, dld-market, affordability, outcome-intents, trust-bar

Update ALL frontend references from old column names to V1 names per the mapping above.

---

## FIX 9: NEXT.JS IMAGE DOMAINS [MEDIUM]

File: `next.config.js` or `next.config.mjs`

Ensure these domains are allowed:
```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'new-projects-media.propertyfinder.com' },
    { protocol: 'https', hostname: 'images.unsplash.com' },
    { protocol: 'https', hostname: '*.vercel-storage.com' },
    { protocol: 'https', hostname: 'cdn.sanity.io' },
  ],
}
```

---

## FIX 10: PROJECT COUNT = 1,216 EVERYWHERE [MEDIUM]

Search the codebase for any hardcoded project counts (600, 3500, 3656, 7015).
Replace with: query `SELECT COUNT(*) FROM inventory_clean` or hardcode 1216.

These are the SCORED projects with V1 signal engine data.

---

## FIX 11: CACHE PURGE [AFTER ALL FIXES]

After committing all changes:
1. Push to GitHub
2. Vercel Dashboard → Settings → Data Cache → Purge All
3. Force redeploy if needed

---

## HARD CONSTRAINTS (NEVER VIOLATE)

1. inventory_clean PK is `id` (NOT project_id)
2. price_confidence is TEXT (HIGH/MEDIUM/LOW), not numeric
3. `window` is a reserved word in PostgreSQL — always quote it
4. Stress grades: A/B/C/D/E (never "Safe A" or "Safe B")
5. Timing labels: STRONG_BUY/BUY/HOLD/WAIT/AVOID
6. The LLM is NOT the decision engine — only translator/narrator
7. Every score is versioned: score_version = 'v1.0'
8. Hard guards always apply: stress<50→AVOID, evidence<45→HOLD
9. Memo renders signals — does NOT invent analysis
10. DLD feed = notifications only, no cards

---

## VERIFICATION AFTER DEPLOYMENT

Test each:
1. "PULSE" → structured market block (NOT paragraphs)
2. "PROJECT Marina Vista" → Stress C, HOLD, score 60 (NOT Stress A, NOT Avoid)
3. "show me projects under 2M" → decision table with V1 columns
4. /top-data → 14 sections with data
5. /developers → 70 developers
6. /properties → 1,216 projects
7. No <think> tags in responses
8. No "Developer: Not found" for Emaar
9. No "DLD Average: Unavailable" for JVC
10. No fabricated stress scenarios
11. Copilot never dumps table names to users

---

## EXECUTION ORDER

1. FIX 1 (copilot prompt) — highest impact
2. FIX 6 (V1 column wiring) — fixes all SQL
3. FIX 3 + FIX 4 (developer + DLD lookup) — fixes query results
4. FIX 5 (remove fabricated scenarios) — stops hallucination
5. FIX 2 (strip think tags) — clean UI
6. FIX 7 + FIX 8 (developers + top-data pages) — complete pages
7. FIX 9 + FIX 10 (images + counts) — polish
8. FIX 11 (cache purge) — deploy

Apply ALL fixes. Commit. Push. Done.
