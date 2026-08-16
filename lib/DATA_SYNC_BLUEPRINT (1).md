# DATA SYNC BLUEPRINT — Entrestate Decision Infrastructure
## Generated 2026-04-09 18:34 UTC | Live Crawl + DB Audit

---

## DEPLOYMENT STATUS

All 12 pages return HTTP 200. All 3 API endpoints return data.
RSC rendering (no __NEXT_DATA__). Arabic RTL active.

### Issues Found: 28

### P0-API (3 issues)
- **/api/areas**: Zero/null fields: area_ar, source_count, confidence, supply_pressure, buy_signals
- **/api/developers**: Zero/null fields: logo, description, hq, developer_type, total_projects
- **/api/search?q=dubai**: Zero/null fields: developer_ar, area_ar, rental_yield, developer_reliability_score, timing_label

### P0-FRONTEND (3 issues)
- **/ar**: NO AED PRICES in Arabic
- **/en/areas**: LOW ARABIC TEXT (0 chars)
- **/ar/chat**: NO AED PRICES in Arabic

### P1-DATA (5 issues)
- **inventory_clean.Latitude**: 33% coverage
- **inventory_clean.PF URL**: 33% coverage
- **developer_registry.Logo**: 6% coverage
- **developer_registry.Description**: 2% coverage
- **developer_registry.Website**: 2% coverage

### P2-DATA (17 issues)
- **inventory_clean.Area AR**: 91% coverage
- **api.compare_v1.dld_txn_count**: dld_txn_count(31%)
- **api.developers_v1.logo**: logo(93%)
- **api.developers_v1.website**: website(97%)
- **api.developers_v1.established**: established(98%)
- **api.developers_v1.description**: description(97%)
- **api.developers_v1.avg_score**: avg_score(84%)
- **api.developers_v1.avg_price**: avg_price(84%)
- **api.dld_transactions_v1.nearest_metro**: nearest_metro(50%)
- **api.dld_transactions_v1.nearest_mall**: nearest_mall(52%)
- **api.dld_transactions_v1.nearest_landmark**: nearest_landmark(39%)
- **api.listings_feed.lat**: lat(66%)
- **api.listings_feed.lng**: lng(66%)
- **api.listings_feed.pf_url**: pf_url(66%)
- **api.projects_v1.pf_url**: pf_url(66%)
- **api.projects_v1.lat**: lat(66%)
- **api.projects_v1.lng**: lng(66%)

---

## ROUTE → DATA SOURCE MAP

| Route | Primary Source | Rows | Status |
|-------|---------------|------|--------|
| /en | api.projects_v1 | 2,813 | ✅ |
| /en/properties | api.projects_v1 | 2,813 | ✅ |
| /en/developers | api.developers_v1 | 481 | ✅ |
| /en/areas | api.areas_v1 | 167 | ✅ |
| /en/top-data | api.market_pulse_v1 | 183 | ✅ |
| /en/chat | Gemini + MCP | N/A | ✅ |
| /api/areas | api.areas_v1 | 167 | ✅ |
| /api/developers | api.developers_v1 | 481 | ✅ |
| /api/search | api.search_index | 2,813 | ✅ |

---

## CANONICAL DATA COVERAGE

| Field | Coverage | Action |
|-------|----------|--------|
| Name | 100% (2813/2813) | ✅ Complete |
| Area | 100% (2813/2813) | ✅ Complete |
| Area AR | 91% (2569/2813) | ⚠️ Fill 244 missing |
| Developer | 100% (2813/2813) | ✅ Complete |
| Developer AR | 98% (2775/2813) | ✅ Complete |
| Price | 100% (2813/2813) | ✅ Complete |
| Hero Image | 100% (2813/2813) | ✅ Complete |
| Timing | 100% (2813/2813) | ✅ Complete |
| Yield | 100% (2813/2813) | ✅ Complete |
| Stress | 100% (2813/2813) | ✅ Complete |
| Evidence | 100% (2813/2813) | ✅ Complete |
| Investor Score | 100% (2813/2813) | ✅ Complete |
| Decision Label | 100% (2813/2813) | ✅ Complete |
| Genome | 100% (2813/2813) | ✅ Complete |
| Latitude | 33% (954/2813) | ⚠️ Fill 1859 missing |
| PF URL | 33% (954/2813) | ⚠️ Fill 1859 missing |
| Slug | 100% (2813/2813) | ✅ Complete |
| Golden Visa | 100% (2813/2813) | ✅ Complete |
| Market Signal | 100% (2813/2813) | ✅ Complete |

---

## DEVELOPER REGISTRY GAPS

| Field | Coverage | Action |
|-------|----------|--------|
| Logo | 30/481 (6%) | Scrape PF/developer websites for logos |
| Description | 14/481 (2%) | Generate from project data + PF info |
| Website | 10/481 (2%) | Scrape PF developer pages |

---

## ARABIC RENDERING ISSUES

Arabic pages load with RTL but show 0 AED prices on:
- /ar (Homepage)
- /ar/top-data
- /ar/chat

**Root cause:** Frontend likely not passing Arabic locale to price formatter, OR API doesn't return `price_from` in AR responses.

**Fix:** Ensure Next.js i18n renders AED prices identically in both locales. The DB has Arabic translations for 91% of areas and 98% of developers.

---

## API VIEW NULL FIELDS

These fields have >30% null values in API views, meaning frontend cards may show blanks:

- `api.compare_v1.dld_txn_count`: dld_txn_count(31%)
- `api.developers_v1.logo`: logo(93%)
- `api.developers_v1.website`: website(97%)
- `api.developers_v1.established`: established(98%)
- `api.developers_v1.description`: description(97%)
- `api.developers_v1.avg_score`: avg_score(84%)
- `api.developers_v1.avg_price`: avg_price(84%)
- `api.dld_transactions_v1.nearest_metro`: nearest_metro(50%)
- `api.dld_transactions_v1.nearest_mall`: nearest_mall(52%)
- `api.dld_transactions_v1.nearest_landmark`: nearest_landmark(39%)
- `api.listings_feed.lat`: lat(66%)
- `api.listings_feed.lng`: lng(66%)
- `api.listings_feed.pf_url`: pf_url(66%)
- `api.projects_v1.pf_url`: pf_url(66%)
- `api.projects_v1.lat`: lat(66%)
- `api.projects_v1.lng`: lng(66%)


---

## EXECUTION LAYER

All 10 SDR tables populated. Enterprise infrastructure (6 tables) complete.
System invariants, headless contracts, product lines, ROI model all present.

---

## PRIORITY ACTION LIST

### P0 — Frontend (Codex must fix)
1. Arabic pages not rendering AED prices — fix i18n price formatter
2. Zero/null fields showing on API responses — add null coalescing in components

### P1 — Data Gaps (Data agent must fill)
1. Developer logos: only 30/481 — scrape PF + developer CDNs
2. Developer descriptions: only 14/481 — generate from project data
3. Developer websites: only 10/481 — scrape PF
4. Latitude/longitude: only 33% — geocode from area names
5. PF URLs: only 100% — match against PF data

### P2 — View Optimization
1. Fill null fields in api.developers_v1 (avg_score, avg_price 84% null)
2. Fill null geo fields in api.projects_v1/listings_feed

---

*Live data from entrestate.com + Neon PostgreSQL. 2026-04-09 18:34 UTC*
