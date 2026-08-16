# ENTRESTATE.COM — COMPLETE SITE TRANSFORMATION CODEX PROMPT
# From current state → AI-native Decision Infrastructure
# Generated from live site crawl + Neon Decision Infrastructure

## DATABASE: Neon PostgreSQL
Connection: DATABASE_URL env var
Primary spine: inventory_full (7,015 projects × 180 columns)
Content tables: entrestate_top_data, entrestate_homepage, entrestate_api_content

---

## CURRENT SITE MAP (24 live pages)

### PAGES TO TRANSFORM (exist but need new content/data wiring)

#### 1. / (Homepage) — TRANSFORM
Current: "Study markets. Operate decisions." + 4 pillars
Target: Decision Infrastructure hero + 3 surfaces + intent routing + trust bar + pricing
Data source: `SELECT * FROM entrestate_homepage ORDER BY display_order`
Sections:
- Hero: "UAE Real Estate Decision Copilot" | 7,015 projects | 180 data points | 593 HIGH confidence
- Three Surfaces: Decision Tunnel (chat) | Time Table Builder | Spatial Trust Map
- Golden Path Shortcuts: 5 high-value action buttons
- Intent Routing: 7 outcome cards (yield_seeking, golden_visa, capital_growth, first_time_buyer, trophy_asset, conservative, general)
- Trust Bar: "Verify the Math" | 5-layer methodology | evidence drawer preview
- Pricing: Free → $299 → $999 → $4,000

#### 2. /top-data — TRANSFORM
Current: "Live market signals" with pulse, safety, portfolio, areas, inventory sections
Target: Full intelligence dashboard from entrestate_top_data
Data source: `SELECT * FROM entrestate_top_data WHERE is_live = true ORDER BY display_order`
10 sections: market-pulse, timing-signals, stress-grades, affordability, outcome-intents,
top-projects, area-intelligence, developer-reliability, golden-visa, trust-bar
Each section shows: confidence badge + last updated + data visualization

#### 3. /market-score — TRANSFORM
Current: "See which projects are safe, steady, or high-risk" + compare areas + project list
Target: Full Deal Screener powered by Decision Infrastructure
Data source: inventory_full with L1-L3 columns
Features:
- Filter: area, budget, beds, timing signal, stress grade, affordability tier, golden visa
- Sort: god_metric, price, yield, developer_reliability
- Each project card: name, area, developer, price, yield, stress grade, timing, god metric, confidence
- Compare mode: side-by-side with evidence drawer
- SQL: `SELECT name, area, developer, l1_canonical_price, l1_canonical_yield, l2_stress_test_grade, l3_timing_signal, engine_god_metric, l1_confidence FROM inventory_full WHERE [filters] ORDER BY engine_god_metric DESC`

#### 4. /markets — TRANSFORM
Current: "Markets" explorer (nearly empty)
Target: Area Intelligence Map
Data source: inventory_full grouped by area
Features:
- Interactive map with supply pressure heatmap
- Area cards: projects, avg price, avg yield, efficiency, buy signals
- Click area → area detail page
- SQL: `SELECT COALESCE(final_area, area), COUNT(*), AVG(l1_canonical_price), AVG(l1_canonical_yield::numeric), AVG(engine_god_metric::numeric), AVG(l3_supply_pressure::numeric) FROM inventory_full GROUP BY 1 HAVING COUNT(*) >= 3`

#### 5. /workspace — TRANSFORM
Current: "Choose your next focus" with core workstations
Target: Authenticated dashboard with saved screens, watchlists, recent reports
Features:
- Saved deal screens (from /market-score filters)
- Watchlist projects with change alerts
- Generated reports history
- Usage metering (chats, reports, exports per billing period)

#### 6. /apps — TRANSFORM
Current: "Choose the surface for the decision" with app tiles
Target: Keep existing apps + add Decision Infrastructure tools
New apps to add:
- Deal Screener (→ /market-score)
- Golden Visa Qualifier (→ /golden-visa) [NEW]
- Stress Test Engine (→ /tools/stress-test) [NEW]
- Investor Memo Generator (→ /tools/memo) [NEW]
- Evidence Drawer (→ /tools/evidence) [NEW]
- Portfolio Builder (→ /tools/portfolio) [NEW]

#### 7. /agent-runtime — TRANSFORM
Current: "Investor Match Desk" with client profile form (Conservative/Balanced/Aggressive)
Target: Wire to real data — when user selects profile, query inventory_full by outcome_intent + l2_affordability_tier + l2_stress_test_grade
SQL: `SELECT * FROM inventory_full WHERE outcome_intent @> ARRAY['conservative'] AND l1_canonical_price > 0 ORDER BY engine_god_metric DESC LIMIT 20`

#### 8. /library — KEEP + EXTEND
Current: Market reports, sample tables, contracts explained
Target: Add auto-generated reports from Decision Infrastructure:
- "Dubai Ready Inventory Pulse" → real data from inventory_full
- "Area Yield Comparison" → from area intelligence
- "Developer Reliability Report" → from developer rankings
- Each report shows: methodology, confidence, evidence sources

#### 9. /blog — KEEP + EXTEND
Current: 6 blog posts (Strategy, Operations, Systems, Economics)
Target: Keep existing + auto-generate weekly Market Pulse posts from database
New post types: Weekly Market Pulse, Area Spotlight, Developer Deep Dive
Data: entrestate_top_data market-pulse section → rendered as blog post

#### 10. /about — MINOR UPDATE
Current: "A real estate market technology firm"
Target: Update to emphasize Decision Infrastructure positioning:
- "We don't aggregate listings. We adjudicate belief."
- 5-Layer Truth Hierarchy explanation
- 4 Intelligence Engines overview
- "Every number is auditable" trust message

#### 11. /contact — KEEP
Current: "Request a walkthrough" form
Target: Keep as-is, maybe add: "or start with the Decision Tunnel →"

#### 12. /changelog — KEEP
Current: Product updates
Target: Keep, add Decision Infrastructure launch entry

#### 13. /roadmap — KEEP
Current: "What we are building next"
Target: Keep, update with copilot/tool milestones

#### 14. /status — KEEP
Current: "Market health" with data snapshot
Target: Wire to real inventory_full freshness: last updated, confidence distribution, source coverage

#### 15. /login, /signup, /forgot-password — KEEP
Current: Auth pages
Target: Keep as-is

#### 16. /privacy, /terms — KEEP
Current: Legal pages
Target: Keep as-is

#### 17. /support — KEEP
Current: Email, hotline, docs
Target: Keep, add link to Evidence Drawer docs

#### 18. /account — KEEP
Current: Org profile, team access, apps, billing, security
Target: Keep, wire billing to PayPal with entitlements from entrestate_api_content tiers

### PAGES TO BUILD (currently 404)

#### 19. /properties — BUILD
Purpose: Browse all 7,015 projects with Decision Infrastructure data
Data: inventory_full
Features:
- Grid/list view with project cards
- Each card: name, area, developer, price, yield, stress grade, timing signal, confidence badge
- Filters: area, developer, price range, beds, timing, stress grade, affordability tier
- Sort: god_metric, price, yield, reliability
- Pagination: 20 per page
- Click → /properties/[slug] detail page

#### 20. /properties/[slug] — BUILD
Purpose: Project detail page with full Decision Infrastructure
Data: inventory_full WHERE name = [slug]
Sections:
- Hero: name, area, developer, hero image, price, yield
- Metrics bar: stress grade, timing signal, god metric, confidence
- Evidence Drawer panel (collapsible): sources used, exclusions, assumptions, calculation steps
- Payment Plan: structured milestones from payment_plan_structured
- Units: from JSONB units array
- Area context: area stats from neighbor projects
- Developer profile: reliability score, project count, areas
- Similar projects: top 5 by god_metric in same area

#### 21. /areas — BUILD
Purpose: Browse 64 area profiles
Data: gc_area_profiles + inventory_full aggregated by area
Features:
- Grid of area cards with image, name, project count, avg yield, avg price
- Click → /areas/[slug]

#### 22. /areas/[slug] — BUILD
Purpose: Area detail page
Data: gc_area_profiles + inventory_full WHERE area = [slug]
Sections:
- Hero: area image, name, type, city
- Stats: projects, avg price, avg yield, supply pressure, buy signals
- Projects in area: scrollable grid
- Developer presence: which developers are active here
- Price trend (from L3 data)

#### 23. /developers — BUILD
Purpose: Browse 58 developer profiles
Data: gc_developer_profiles
Features:
- Grid with logo, name, reliability score, project count
- Click → /developers/[slug]

#### 24. /developers/[slug] — BUILD
Purpose: Developer detail page
Data: gc_developer_profiles + inventory_full WHERE developer = [slug]
Sections:
- Hero: logo, name, founded, HQ
- Reliability metrics: score, footprint, continuity
- Projects: all projects by this developer
- Area presence: which areas they operate in
- Price positioning: tier distribution

#### 25. /pricing — BUILD
Purpose: Pricing page (currently linked from homepage)
Data: entrestate_homepage pricing section
Tiers: Starter (Free) | Pro ($299/mo) | Team ($999/mo) | Institutional ($4,000/mo)
Wire to PayPal Checkout

#### 26. /chat — BUILD (or /copilot)
Purpose: Decision Tunnel — LLM copilot with tool-calling
Architecture: See CODEX_COPILOT.md for full spec
Features:
- Chat interface with streaming responses
- 5 tools: deal_screener, price_reality_check, area_risk_brief, developer_due_diligence, generate_investor_memo
- Evidence Drawer sidebar: shows sources for every answer
- Save to watchlist / Generate memo CTAs
- Guardrails: no invented numbers, confidence flagging
- Tier gating: 3 chats/day free, unlimited for Pro+

#### 27. /golden-visa — BUILD
Purpose: Golden Visa qualifier tool
Data: `SELECT * FROM inventory_full WHERE l1_canonical_price >= 2000000 AND l1_confidence IN ('HIGH','MEDIUM') ORDER BY engine_god_metric DESC`
Features:
- Filter by area, developer, stress grade
- Each card shows: price, yield, stress grade, timing, GV eligibility badge
- "Generate Golden Visa Pack" → investor memo

#### 28. /tools/stress-test — BUILD
Purpose: Stress test any project or portfolio
Data: engine_stress_test JSONB column
Features:
- Select project(s)
- Show: grade, rate hike survival, vacancy spike survival, price correction survival
- Portfolio mode: aggregate stress across multiple projects

#### 29. /tools/memo — BUILD
Purpose: Generate investor-grade due diligence memos
Data: All Decision Infrastructure columns
Flow: Select project → choose sections (price reality, area risk, developer DD, stress test) → generate PDF
Output: HTML → PDF with methodology footnotes, confidence badges, evidence citations

#### 30. /dashboard — BUILD
Purpose: Authenticated user dashboard (redirect from /workspace or replace it)
Features:
- Market Pulse widget (from entrestate_top_data)
- Watchlist widget
- Recent activity
- Usage metering
- Quick actions: New screen, New chat, Generate report

---

## API ROUTES TO BUILD

### Public (no auth)
- GET /api/top-data → entrestate_top_data
- GET /api/market-pulse → inventory_full aggregates
- GET /api/areas → gc_area_profiles
- GET /api/developers → gc_developer_profiles

### Pro tier (auth required)
- POST /api/deal-screener → inventory_full with filters
- GET /api/properties/[name] → inventory_full detail + evidence
- GET /api/price-reality/[name] → L1 + L4 comparison
- GET /api/stress-test/[name] → engine_stress_test
- GET /api/developer-reliability/[name] → L2 metrics
- GET /api/evidence-drawer/[name] → full audit trail
- POST /api/copilot/thread → LLM chat with tool-calling
- POST /api/copilot/thread/[id]/message → continue chat

### Team tier
- POST /api/reports/generate → investor memo PDF
- GET /api/reports/[id]/download → PDF download
- POST /api/watchlists → create watchlist
- POST /api/watchlists/[id]/items → add to watchlist
- GET /api/export/csv → CSV export of screen results

### Institutional tier
- GET /api/daas/listing-feed → full project feed
- GET /api/daas/market-analysis → area + developer analytics
- POST /api/portfolio-stress → multi-asset stress modeling

---

## IMPLEMENTATION ORDER (by priority)

### Week 1: Core data pages
1. /properties (browse) + /properties/[slug] (detail)
2. /areas + /areas/[slug]
3. /developers + /developers/[slug]
4. Wire /market-score to real inventory_full data

### Week 2: Decision tools
5. /chat (LLM copilot with 5 tools)
6. /golden-visa qualifier
7. /tools/stress-test
8. /pricing + PayPal integration

### Week 3: Homepage + content
9. / homepage transformation (6 sections from entrestate_homepage)
10. /top-data transformation (10 sections from entrestate_top_data)
11. /tools/memo (investor memo generator)
12. /dashboard (authenticated workspace)

### Week 4: Polish + monetization
13. Tier gating middleware on all API routes
14. Usage metering (chats/day, reports/month)
15. Watchlist + alerts
16. /status wired to real data freshness
17. SEO: meta tags, OG images, structured data for all pages

---

## DESIGN SYSTEM
- Keep existing dark theme
- Signal colors: BUY = green, HOLD = amber, WAIT = red
- Grades: A = dark green, B = green, C = amber, D = orange, F = red
- Confidence: HIGH = green badge, MEDIUM = amber, LOW = gray
- Numbers: AED 1,234,567 | 6.5% yield | Score 82.3
- Evidence Drawer: slide-out panel, always accessible
- Trust Bar: subtle bar at bottom of every data section

## SHARED COMPONENTS
- ProjectCard: name, area, dev, price, yield, grade, timing, confidence
- AreaCard: image, name, projects, yield, price
- DeveloperCard: logo, name, reliability, projects
- EvidenceDrawer: sources, exclusions, assumptions, steps
- TrustBar: verified rows, confidence dist, refresh time
- IntentCard: icon, label, count, description
- StressGradeBadge: A-F with color
- TimingSignalBadge: BUY/HOLD/WAIT with color
- ConfidenceBadge: HIGH/MEDIUM/LOW with color
- PricingTier: name, price, features, CTA

## TOTAL PAGES TO SHIP: 30
- 18 existing (keep/transform)
- 12 new (build from scratch)
