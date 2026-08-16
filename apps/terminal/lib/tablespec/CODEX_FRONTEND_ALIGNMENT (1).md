# CODEX: Frontend Copy Transformation — entrestate.com
## Generated 2026-04-10 | All 3 Critiques Applied

---

## THE ONE RULE

> Sell the penthouse view first. The engineering blueprints go in the appendix.

Every section below translates a technical feature into a business outcome.
The CTO gets the architecture proof AFTER the executive gets the pain relief.

---

## HERO SECTION — Above the Fold

### KILL (current)
> "One truth system, proper API boundaries, and deterministic workflow control"

### BUILD (new)
> **Stop making billion-dirham decisions on fragmented, unverified data.**
>
> Entrestate unifies 36,841 DLD transactions, 41,381 verified listings, and 2,813 scored projects
> into one auditable decision infrastructure — so every investment verdict traces back to canonical truth.
>
> *Powered by strict API boundaries and a zero-hallucination AI architecture.*

**Why:** The business outcome (eliminating catastrophic decisions from bad data) leads.
The technical mechanism (API boundaries) follows as proof. Executive reads line 1, engineer reads line 3.

---

## DECISION PIPELINE — Progressive Disclosure (Miller's Law Fix)

### KILL (current)
Three separate frameworks presented as independent lists:
- 4-stage pipeline (Intent → Evidence → Judgment → Action)
- 5-layer evidence stack (L5 sparse → L1 canonical)
- 6 infrastructure surfaces

Total: 15 distinct items. Cognitive overload.

### BUILD (new)
One continuous story — each framework nested inside the previous:

**Stage 1: INTENT** — "What does the investor want?"
- Natural language → TableSpec JSON (strictly typed, zero hallucination)

**Stage 2: EVIDENCE** — "Is the data trustworthy?"
- *Zoom in:* Every data point is filtered through the 5-Layer Evidence Stack:
  - L5: Sparse/scraped data (lowest confidence)
  - L4: Bayut benchmarks (area-level validation)
  - L3: DLD transactions (government-verified sales)
  - L2: Cross-referenced multi-source (2+ independent confirmations)
  - L1: Canonical truth (DLD + PF + Bayut aligned, fully auditable)
- *Result:* Only L1-L2 data feeds the decision engine. Sparse data never reaches a verdict.

**Stage 3: JUDGMENT** — "What should the investor do?"
- V1 Signal Engine: Timing (0-100), Stress (A-F), Yield (0-100), Evidence (0-100)
- Deterministic verdict: BUY / HOLD / WAIT with full driver attribution

**Stage 4: ACTION** — "How do they execute?"
- *Zoom in:* Six infrastructure surfaces for different outcomes:
  - Screen: Find matching properties
  - Compare: Side-by-side delta analysis
  - Memo: Generate investment memo
  - Monitor: DLD transaction feed
  - Execute: Structured Deal Room lifecycle
  - Recover: Soft-bounce via genome similarity

**Why:** The reader follows ONE story. The 5 layers and 6 surfaces are discovered
inside stages they already understand. Zero new mental models to memorize.

---

## EVIDENCE DRAWER — "Verify the Math"

### KILL (current)
Buried on page scrolls, presented as a technical feature.

### BUILD (new)
Position as the **trust anchor** — the #1 answer to "how do I know this is real?"

> **Every verdict comes with receipts.**
>
> Click any score to see the exact DLD transactions, Bayut benchmarks,
> and cross-reference sources that produced it. Full SQL lineage.
> No black boxes. No "trust us."

Link to: `/evidence/:project_id` (the Evidence Drawer route — currently missing, needs to be built)

---

## AUTOMATION ENGINE — Language Elevation

### KILL (current)
> "Visual node-based builder for high-end market pipelines"
> "Create thousands of custom PDF briefs or social assets"

### BUILD (new)
> **Deploy autonomous agents that monitor DLD transactions and Bayut listings 24/7,
> executing the moment market conditions align with your investment parameters.**
>
> Transform live canonical data into thousands of investor-grade briefs —
> each one backed by the same 5-layer evidence stack that powers the Decision Engine.
> Scale your institutional reach without adding headcount.

### Specific rewrites:

| Kill | Build |
|------|-------|
| "Visual node-based builder" | "Deploy autonomous market agents" |
| "Custom PDF briefs" | "Investor-grade briefs backed by canonical data" |
| "Social assets" | "Institutional distribution at scale" |
| "Create thousands of..." | "Transform live market data into..." |
| "Personalized content" | "Evidence-backed intelligence, personalized by archetype" |

**Why:** "Mass PDF generation" sounds like a spam engine. "Autonomous agents
distributing canonical intelligence" sounds like institutional infrastructure.
The antidote to AI hallucination fear is always: anchor outputs to the truth layer.

---

## API PREVIEW — For the Engineer Who Scrolls

### Current state
The JSON payload example exists but lacks business context.

### Rewrite

> **This is the exact JSON payload your systems receive** — delivering canonical L1 DLD records
> directly to your operators. Application-grade security. Zero hallucination.

```json
{
  "project": "Marina Vista",
  "verdict": "BUY",
  "confidence": 0.84,
  "evidence_level": "A",
  "sources": ["DLD", "PropertyFinder", "Bayut"],
  "timing_score": 78,
  "stress_grade": "B",
  "yield_score": 72,
  "drivers": {
    "positive": ["Strong DLD velocity (+23% QoQ)", "Below area median"],
    "negative": ["Developer tier B"]
  }
}
```

> Every field traces to auditable source data. Zero estimated values.

**Why:** The JSON is now framed as "enterprise-secure canonical delivery"
not just "here's what the API returns."

---

## PAGE-BY-PAGE COPY FIXES

### Homepage (/)
| Section | Kill | Build |
|---------|------|-------|
| Hero headline | "unified truth system" | "Stop making decisions on fragmented data" |
| Hero subline | "API boundaries" | "36,841 DLD transactions. 2,813 scored projects. One truth." |
| CTA button | generic | "See the Decision Engine" |
| Featured projects | just cards | Cards + verdict badge (BUY/HOLD/WAIT) + evidence score |

### Properties (/properties)
| Section | Kill | Build |
|---------|------|-------|
| Card layout | price only | Price + 4 scores + verdict badge + evidence level |
| Filter bar | basic | Add: verdict filter, stress grade, golden visa, evidence level |
| Sort default | unclear | sort_score DESC (quality-first, not cheapest-first) |

### Developers (/developers)
| Section | Kill | Build |
|---------|------|-------|
| Card content | name + tier | Name + tier + project count + avg score + reliability indicator |
| Missing data | 94% no logos | Generate SVG initials as placeholder until real logos obtained |
| Description | 2% filled | Now 100% (generated from project data — done in P1 fixes) |

### Areas (/areas)
| Section | Kill | Build |
|---------|------|-------|
| Layout | flat list | City tabs (Dubai / Abu Dhabi / RAK) + Best Value badge |
| Card content | basic stats | Avg price + avg yield + project count + market signal |
| Arabic | partial | 92% translated (47 areas still need manual AR names) |

### Top Data (/top-data)
| Section | Kill | Build |
|---------|------|-------|
| Framing | "top data" | "Market Intelligence Terminal" |
| DLD section | hidden | Real-time DLD feed with velocity indicators |
| Stress section | basic | Stress distribution chart with grade breakdown |
| Missing | no DLD feed | Wire `api.notifications_v1` (500 entries ready) |

### Chat/Copilot (/chat)
| Section | Kill | Build |
|---------|------|-------|
| System prompt | may have consumer language | Enterprise-only: "You are the Entrestate Decision Terminal" |
| Response format | prose | Structured: verdict + evidence + drivers + next action |
| Arabic | 0 AED rendering | Fix i18n price formatter |

---

## ARABIC FIXES (Critical)

| Issue | Fix |
|-------|-----|
| /ar shows 0 AED prices | i18n price formatter not passing locale to number format |
| /ar/chat shows 0 AED | Same formatter issue in copilot responses |
| 47 areas untranslated | Manual Arabic translations needed for remaining areas |

Arabic data availability in DB:
- Area AR: 92% (2,598/2,813)
- Developer AR: 98% (2,775/2,813)
- Area names: 47 still English-only

---

## SEO + META — Enterprise Positioning

### Homepage meta
- Title: "Entrestate — Real Estate Decision Infrastructure | UAE"
- Description: "Unifying DLD transactions, market intelligence, and execution into one auditable platform. 36,841 verified transactions. Zero hallucination AI."

### Properties meta
- Title: "UAE Property Intelligence — 2,813 Scored Projects | Entrestate"
- Description: "Every project scored by Timing, Stress, Yield, and Evidence. BUY/HOLD/WAIT verdicts backed by DLD + PropertyFinder + Bayut data."

---

## DATA GAPS — What Still Shows Blanks

| Field | Coverage | User Impact | Fix |
|-------|----------|-------------|-----|
| Developer logos | 6% | Blank avatars on /developers | SVG initials or placeholder |
| Lat/Lng | 33% | No map view for 2/3 of projects | Geocoding API needed |
| Arabic prices | 0% on /ar homepage | Major i18n bug | Fix number formatter |
| Developer avg_score | 15% in API view | Blank metrics on dev cards | View rebuilt (74/481 have projects) |

---

## VERIFICATION CHECKLIST (Post-Implementation)

- [ ] Hero section leads with business pain, not API jargon
- [ ] Decision Pipeline is ONE progressive story, not 3 separate lists
- [ ] Evidence Drawer has its own route (/evidence/:id)
- [ ] Automation language uses "deploy agents" not "build workflows"
- [ ] JSON preview framed as "canonical L1 delivery" with business context
- [ ] BUY/HOLD/WAIT verdict badges visible on all project cards
- [ ] Evidence scores visible on all project cards
- [ ] Arabic pages render AED prices correctly
- [ ] /top-data reframed as "Market Intelligence Terminal"
- [ ] Copilot system prompt is enterprise-only (zero consumer language)
- [ ] Developer cards show SVG initials when logo missing
- [ ] City tabs working on /areas (Dubai / Abu Dhabi / RAK)
- [ ] sort_score DESC is default sort on /properties

---

*This codex combines all 3 podcast critiques:*
*Critique 1: Enterprise lexicon, front-loaded trust architecture, sanitized roadmap*
*Critique 2: TableSpec as hero, bifurcated product lines, headless API framing*
*Critique 3: Business-first copy, progressive disclosure, automation language elevation*

*Generated from Entrestate Decision Infrastructure — Enterprise Architecture Spec v3*
