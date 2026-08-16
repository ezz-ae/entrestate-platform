
# CODEX PROMPT #2 — LLM Copilot Service
# The chat must use LLM tool-calling, NOT basic answers

You are building the Decision Tunnel copilot for entrestate.com.
The copilot uses OpenAI/Anthropic function calling with deterministic tools.
The LLM NEVER invents numbers — it only quotes from tool outputs.

## ARCHITECTURE
- app/api/copilot/route.ts — main chat endpoint
- lib/copilot/tools.ts — tool definitions (JSON schemas)
- lib/copilot/executor.ts — tool execution (SQL queries against inventory_full)
- lib/copilot/guardrails.ts — confidence checks, hallucination prevention

## DATABASE: inventory_full (7,015 projects × 180 columns)
Key columns for tools:
- L1: l1_canonical_price, l1_canonical_yield, l1_canonical_status, l1_confidence, l1_source_coverage
- L2: l2_investment_score, l2_developer_reliability, l2_affordability_tier, l2_stress_test_grade, l2_market_efficiency, l2_goal_alignment
- L3: l3_timing_signal, l3_supply_pressure, l3_demand_velocity, l3_price_drift_30d
- Engines: engine_god_metric, engine_affordability, engine_stress_test
- Evidence: evidence_sources, evidence_exclusions, evidence_assumptions
- Intent: outcome_intent (array), hotness_factors (JSONB)
- Identity: name, developer, area, final_area

## TOOL DEFINITIONS (5 tools)

### Tool 1: deal_screener
Purpose: Find and rank project candidates
Input schema:
```json
{
  "filters": {
    "area": "string (optional)",
    "budget_max_aed": "number (optional)",
    "beds_min": "number (optional)",
    "beds_max": "number (optional)",
    "golden_visa_required": "boolean (optional)",
    "timing_signal": "BUY|HOLD|WAIT (optional)",
    "stress_grade_min": "A|B|C|D (optional)",
    "affordability_tier": "string (optional)"
  },
  "sort_by": "engine_god_metric|l1_canonical_price|l1_canonical_yield|l2_developer_reliability",
  "limit": "number (default 10)"
}
```
Execution: Build WHERE clause from filters, ORDER BY sort_by DESC, LIMIT
Return: Array of projects with all L1-L3 + engine fields

### Tool 2: price_reality_check
Purpose: Compare listing price vs market reality for a specific project
Input: { "project_name": "string" }
Execution:
```sql
SELECT name, l1_canonical_price, l4_dld_avg_txn_price, l4_portal_price_delta,
       l1_confidence, l1_source_coverage, evidence_sources, evidence_assumptions
FROM inventory_full WHERE LOWER(name) LIKE LOWER('%' || $1 || '%') LIMIT 5;
```

### Tool 3: area_risk_brief
Purpose: Analyze risk and opportunity for an area
Input: { "area_name": "string" }
Execution:
```sql
SELECT COALESCE(final_area, area) as area, COUNT(*) as projects,
       ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) as avg_price,
       ROUND(AVG(l1_canonical_yield::numeric), 1) as avg_yield,
       ROUND(AVG(l3_supply_pressure::numeric), 2) as supply_pressure,
       ROUND(AVG(engine_god_metric::numeric), 1) as efficiency,
       COUNT(CASE WHEN l3_timing_signal = 'BUY' THEN 1 END) as buy_signals,
       COUNT(CASE WHEN l2_stress_test_grade IN ('A','B') THEN 1 END) as safe_projects
FROM inventory_full WHERE LOWER(COALESCE(final_area, area)) LIKE LOWER('%' || $1 || '%')
GROUP BY 1;
```

### Tool 4: developer_due_diligence
Purpose: Score and analyze a developer
Input: { "developer_name": "string" }
Execution:
```sql
SELECT developer, COUNT(*) as projects,
       ROUND(AVG(l2_developer_reliability::numeric), 1) as reliability,
       ROUND(AVG(engine_god_metric::numeric), 1) as efficiency,
       COUNT(CASE WHEN l2_stress_test_grade IN ('A','B') THEN 1 END) as safe_projects,
       ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) as avg_price,
       array_agg(DISTINCT COALESCE(final_area, area)) as areas
FROM inventory_full WHERE LOWER(developer) LIKE LOWER('%' || $1 || '%')
GROUP BY 1;
```

### Tool 5: generate_investor_memo
Purpose: Create structured investment memo for a project
Input: { "project_name": "string", "sections": ["price_reality", "area_risk", "developer", "stress_test"] }
Execution: Runs tools 2-4 for the project, combines into structured memo format
Return: Structured JSON with sections, each containing data + narrative

## SYSTEM PROMPT FOR LLM
```
You are the Entrestate Decision Copilot — a UAE real estate investment analyst.

RULES:
1. NEVER invent numbers. Only quote from tool outputs.
2. If confidence is LOW, say so explicitly: "This project has LOW data confidence (source coverage: X%)"
3. Always show data freshness: "Data as of: [timestamp]"
4. If a tool returns no results, say "No matching projects found" — don't fabricate
5. Every answer must include: source (which tool), confidence level, what would change the conclusion
6. When comparing projects, use the same tool for both to ensure consistency
7. For price questions, always mention the priceSource and whether it's verified
8. Refuse legal/financial guarantees but still provide analysis

PERSONALITY:
- Direct, analytical, institutional-grade language
- Present evidence first, then conclusion
- Use "The data shows..." not "I think..."
- End complex answers with: "Would you like me to stress-test this or generate a full memo?"

TOOLS AVAILABLE:
- deal_screener: Find and rank projects by criteria
- price_reality_check: Verify pricing for a specific project
- area_risk_brief: Analyze area-level risk and opportunity
- developer_due_diligence: Score a developer
- generate_investor_memo: Create full investment memo
```

## GUARDRAILS (lib/copilot/guardrails.ts)
```typescript
function validateToolOutput(output: any): { valid: boolean; warning?: string } {
  // 1. No null prices presented as real
  if (output.l1_canonical_price === null) return { valid: true, warning: "Price data unavailable" };
  // 2. Low confidence flagging
  if (output.l1_confidence === 'LOW') return { valid: true, warning: "LOW confidence — limited data sources" };
  // 3. No fabricated DLD data
  if (output.l4_dld_avg_txn_price === null) return { valid: true, warning: "No DLD transaction overlay available" };
  return { valid: true };
}
```

## IMPLEMENTATION ORDER
1. lib/copilot/tools.ts — 5 tool schemas
2. lib/copilot/executor.ts — SQL execution for each tool
3. lib/copilot/guardrails.ts — validation + warnings
4. app/api/copilot/route.ts — streaming chat endpoint with tool calling
5. components/ChatInterface.tsx — chat UI with evidence drawer sidebar
6. Test: "Find 2BR under 2M with BUY signal" → deal_screener → ranked results
7. Test: "Is Emaar reliable?" → developer_due_diligence → scored output
8. Test: "Generate memo for Marina Vista" → generate_investor_memo → full report
