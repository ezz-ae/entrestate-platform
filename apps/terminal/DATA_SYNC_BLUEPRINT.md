# DATA SYNC BLUEPRINT — Entrestate Decision Infrastructure
## Generated 2026-04-09

---

## SITEMAP — All Routes

| Route | Label | Status | Size | Data Points |
|-------|-------|--------|------|-------------|
| /en | Homepage EN | ✅ 200 | 116.2KB | AED:5 RTL:False AR:0 |
| /ar | Homepage AR | ✅ 200 | 114.7KB | AED:0 RTL:True AR:194 |
| /en/properties | Properties EN | ✅ 200 | 169.3KB | AED:27 RTL:False AR:0 |
| /ar/properties | Properties AR | ✅ 200 | 168.6KB | AED:23 RTL:True AR:199 |
| /en/developers | Developers EN | ✅ 200 | 389.0KB | AED:80 RTL:False AR:0 |
| /ar/developers | Developers AR | ✅ 200 | 386.8KB | AED:76 RTL:True AR:199 |
| /en/areas | Areas EN | ✅ 200 | 1354.3KB | AED:338 RTL:False AR:0 |
| /ar/areas | Areas AR | ✅ 200 | 1349.0KB | AED:334 RTL:True AR:199 |
| /en/top-data | Top Data EN | ✅ 200 | 63.4KB | AED:4 RTL:False AR:0 |
| /ar/top-data | Top Data AR | ✅ 200 | 62.5KB | AED:0 RTL:True AR:67 |
| /en/chat | Copilot EN | ✅ 200 | 92.3KB | AED:11 RTL:False AR:0 |
| /ar/chat | Copilot AR | ✅ 200 | 91.0KB | AED:0 RTL:True AR:67 |
| /api/areas | Areas API | ✅ 200 | 167 items | area, area_ar, city, projects |
| /api/developers | Developers API | ✅ 200 | 74 items | id, name, slug, tier |
| /api/search | Search API | ✅ 200 | 25 items | id, name, project_name, developer |


---

## ROUTE → DATA SOURCE MAPPING

### /en (Homepage)
- **Primary:** `api.projects_v1`
- **Secondary:** `api.market_pulse_v1`, `api.developers_v1`, `api.notifications_v1`
- **Note:** Non-view data source (Gemini/MCP)

### /en/properties
- **Primary:** `api.projects_v1`
- **Secondary:** `api.search_index`
- **Note:** Non-view data source (Gemini/MCP)

### /en/developers
- **Primary:** `api.developers_v1`
- **Secondary:** `api.developer_leaderboard_v1`
- **Note:** Non-view data source (Gemini/MCP)

### /en/areas
- **Primary:** `api.areas_v1`
- **Secondary:** `api.area_intelligence_v1`
- **Note:** Non-view data source (Gemini/MCP)

### /en/top-data
- **Primary:** `api.market_pulse_v1`
- **Secondary:** `api.dld_transactions_v1`, `api.area_intelligence_v1`, `api.developer_leaderboard_v1`, `api.notifications_v1`
- **Note:** Non-view data source (Gemini/MCP)

### /en/chat (Copilot)
- **Primary:** `Gemini + MCP Tools`
- **Secondary:** `api.search_index`, `api.projects_v1`, `api.areas_v1`
- **Note:** Non-view data source (Gemini/MCP)

### /api/areas
- **Primary:** `api.areas_v1 or api.area_intelligence_v1`
- **Secondary:** None
- **Note:** Non-view data source (Gemini/MCP)

### /api/developers
- **Primary:** `api.developers_v1`
- **Secondary:** None
- **Note:** Non-view data source (Gemini/MCP)

### /api/search
- **Primary:** `api.search_index`
- **Secondary:** None
- **Note:** Non-view data source (Gemini/MCP)

---

## DATA GAPS — 14 Issues Found

### DEV_GAP (3 issues)
- `developer_registry.logo`: 6% coverage
- `developer_registry.description`: 2% coverage
- `developer_registry.website`: 2% coverage

### NULL_FIELD (8 issues)
- `api.developers_v1.avg_score`: 84% null
- `api.developers_v1.avg_price`: 84% null
- `api.listings_feed.lat`: 66% null
- `api.listings_feed.lng`: 66% null
- `api.listings_feed.pf_url`: 66% null
- `api.projects_v1.pf_url`: 66% null
- `api.projects_v1.lat`: 66% null
- `api.projects_v1.lng`: 66% null

### SPINE_GAP (3 issues)
- `inventory_clean.area_ar`: 91% coverage
- `inventory_clean.latitude`: 33% coverage
- `inventory_clean.pf_url`: 33% coverage

---

## CANONICAL SPINE — inventory_clean (2,813 projects)

| Field | Coverage | Status |
|-------|----------|--------|
| Name | 2,813/2,813 (100%) | ✅ |
| Area | 2,813/2,813 (100%) | ✅ |
| Area AR | 2,569/2,813 (91%) | ⚠️ |
| Developer | 2,813/2,813 (100%) | ✅ |
| Developer AR | 2,775/2,813 (98%) | ✅ |
| Price | 2,813/2,813 (100%) | ✅ |
| Hero Image | 2,813/2,813 (100%) | ✅ |
| Timing Score | 2,813/2,813 (100%) | ✅ |
| Yield Score | 2,813/2,813 (100%) | ✅ |
| Stress Grade | 2,813/2,813 (100%) | ✅ |
| Evidence Score | 2,813/2,813 (100%) | ✅ |
| Investor Score | 2,813/2,813 (100%) | ✅ |
| Decision Label | 2,813/2,813 (100%) | ✅ |
| Market Signal | 2,813/2,813 (100%) | ✅ |
| Genome Vector | 2,813/2,813 (100%) | ✅ |
| Golden Visa | 2,813/2,813 (100%) | ✅ |
| Slug | 2,813/2,813 (100%) | ✅ |
| City | 2,813/2,813 (100%) | ✅ |
| Latitude | 954/2,813 (33%) | ❌ |
| PF URL | 954/2,813 (33%) | ❌ |
| Price Source | 2,813/2,813 (100%) | ✅ |


---

## API VIEWS — Data Availability

| View | Rows | Columns | Status |
|------|------|---------|--------|
| api.area_intelligence_v1 | 167 | 12 | ✅ |
| api.areas_v1 | 167 | 9 | ✅ |
| api.compare_v1 | 2,813 | 25 | ✅ |
| api.developer_leaderboard_v1 | 45 | 10 | ✅ |
| api.developers_v1 | 481 | 10 | ✅ |
| api.dld_transactions_v1 | 36,841 | 14 | ✅ |
| api.listings_feed | 2,813 | 25 | ✅ |
| api.market_pulse_v1 | 183 | 8 | ✅ |
| api.notifications_v1 | 500 | 8 | ✅ |
| api.projects_v1 | 2,813 | 39 | ✅ |
| api.search_index | 2,813 | 9 | ✅ |


---

## EXECUTION LAYER — SDR Tables

| Table | Rows | Status |
|-------|------|--------|
| roomdood.folders | 7,217 | ✅ |
| roomdood.listing_imports | 5,358 | ✅ |
| roomdood.holds | 732 | ✅ |
| roomdood.consent_overlap | 768 | ✅ |
| roomdood.deal_rooms | 384 | ✅ |
| roomdood.whatsapp_messages | 40 | ✅ |
| roomdood.audit_trail | 200 | ✅ |
| roomdood.yield_configs | 30 | ✅ |
| roomdood.sybil_telemetry | 20 | ✅ |
| roomdood.hold_type_config | 4 | ✅ |


---

## SYNC ACTIONS — What Codex Must Wire

### Priority 1: Fix Empty/Broken Data Connections
1. **/en/areas**: Arabic text not rendering — missing translations or RTL

### Priority 2: Fill Null Fields in API Views
- `api.developers_v1.avg_score`: 84% null
- `api.developers_v1.avg_price`: 84% null
- `api.listings_feed.lat`: 66% null
- `api.listings_feed.lng`: 66% null
- `api.listings_feed.pf_url`: 66% null
- `api.projects_v1.pf_url`: 66% null
- `api.projects_v1.lat`: 66% null
- `api.projects_v1.lng`: 66% null

### Priority 3: Fill Spine Gaps
- `inventory_clean.area_ar`: 91% coverage
- `inventory_clean.latitude`: 33% coverage
- `inventory_clean.pf_url`: 33% coverage

### Priority 4: Developer Registry Enrichment
- `developer_registry.logo`: 6% coverage
- `developer_registry.description`: 2% coverage
- `developer_registry.website`: 2% coverage

### Priority 5: Arabic Translation Completion
Arabic translations complete.


---

## SYSTEM TOTALS

| Asset | Count |
|-------|-------|
| Total routes (pages + APIs) | 15 |
| API views | 11 |
| Canonical projects | 2,813 |
| Developers | 481 |
| DLD transactions | 36,841 |
| Bayut listings | 41,381 |
| SDR folders | — |
| Data gaps found | 14 |

---

*Generated from live database + site crawl. All counts are real-time.*
