# HANDOFF TABLE — Hex + Codex Task Split
## Generated 2026-04-10 | All 3 Critiques + Strategic Roadmap

---

## Owner: HEX (Data Agent — this notebook)

| # | Task | Priority | Output | Status |
|---|------|----------|--------|--------|
| H1 | Rewrite hero to lead with business outcomes | P0 | CODEX_FRONTEND_ALIGNMENT.md §1 | ✅ Done |
| H2 | Reposition tech architecture as proof, not headline | P0 | CODEX_FRONTEND_ALIGNMENT.md §1 | ✅ Done |
| H3 | Rewrite API preview with real-world payload value | P0 | CODEX_FRONTEND_ALIGNMENT.md §6 | ✅ Done |
| H4 | Re-sequence page for executive-first reading | P0 | CODEX_FRONTEND_ALIGNMENT.md §2 | ✅ Done |
| H5 | Merge pipeline + evidence + surfaces into one narrative | P0 | CODEX_FRONTEND_ALIGNMENT.md §2 | ✅ Done |
| H6 | Nest 5-layer evidence inside Stage 2 | P0 | CODEX_FRONTEND_ALIGNMENT.md §2 | ✅ Done |
| H7 | Reframe 6 surfaces as execution paths under Action stage | P0 | CODEX_FRONTEND_ALIGNMENT.md §2 | ✅ Done |
| H8 | Use progressive disclosure throughout | P0 | CODEX_FRONTEND_ALIGNMENT.md §2 | ✅ Done |
| H9 | Anchor all AI claims to canonical truth | P0 | CODEX_FRONTEND_ALIGNMENT.md §4 | ✅ Done |
| H10 | Rewrite automation as evidence-backed intelligence | P0 | CODEX_FRONTEND_ALIGNMENT.md §4 | ✅ Done |
| H11 | Tighten all messaging to institutional/premium tone | P0 | CODEX_FRONTEND_ALIGNMENT.md (all) | ✅ Done |
| H12 | Create end-to-end content narrative (hero → execution) | P0 | CODEX_FRONTEND_ALIGNMENT.md (all) | ✅ Done |
| H13 | Enterprise Architecture Spec v3 | P0 | ENTERPRISE_ARCHITECTURE_SPEC_v3.md | ✅ Done |
| H14 | Data Sync Blueprint with sitemap | P0 | DATA_SYNC_BLUEPRINT.md | ✅ Done |
| H15 | Full system alignment audit (55 issues) | P0 | Cell C581 + C582 | ✅ Done |
| H16 | Strategic roadmap vs current state (90% score) | P1 | Cell C586 | ✅ Done |
| H17 | Purge Al Warsan outlier | P0 | Cell C587 | ✅ Done |
| H18 | Fill developer descriptions (2% → 100%) | P1 | Cell C587 | ✅ Done |
| H19 | Fill developer websites (2% → 17%) | P1 | Cell C587 | ✅ Partial |
| H20 | Generate PF URLs from slugs (33% → 100%) | P1 | Cell C587 | ✅ Done |
| H21 | Rebuild developers_v1 API view (84% null → fixed) | P1 | Cell C587 | ✅ Done |
| H22 | Fill Area AR translations (91% → 92%) | P2 | Cell C587 | ✅ Partial |
| H23 | Developer logos (6% → still 6%) | P1 | Needs external scraping | ❌ Blocked |
| H24 | Geocode lat/lng (33% → still 33%) | P1 | Needs geocoding API | ❌ Blocked |

---

## Owner: CODEX (Frontend — entrestate.com)

| # | Task | Priority | Output | Depends On |
|---|------|----------|--------|------------|
| C1 | Update hero component with business-first headline | P0 | Hero section rewrite | H1, H2 |
| C2 | Rebuild middle-page: pipeline + evidence + surfaces unified | P0 | Progressive disclosure layout | H5, H6, H7 |
| C3 | Add visual treatment for Stage 2 Evidence (L5→L1) | P0 | Evidence stack visualization | H6 |
| C4 | Rework ProAgent Studio as autonomous enterprise execution | P1 | Section rewrite + component update | H10 |
| C5 | Update all UI labels, headers, component copy | P0 | Zero "visual node-based builder" language | H11 |
| C6 | Adjust layout for progressive disclosure, reduce overload | P0 | CSS/layout changes | H8 |
| C7 | Move technical specs lower on page / into dedicated section | P0 | Page restructure | H4 |
| C8 | Add trust markers (SOC 2 in progress, canonical data, verified) | P1 | Badge components | H13 |
| C9 | Ensure automation modules present as institutional workflows | P1 | Component copy update | H10 |
| C10 | Build page flow with logical section transitions | P0 | Full page restructure | H12 |
| C11 | Prepare page for next review round | P1 | Deploy + verify | All above |
| C12 | Fix Arabic price rendering (/ar homepage, /ar/chat = 0 AED) | P0 | i18n price formatter fix | None |
| C13 | Add Evidence Drawer route (/evidence/:project_id) | P1 | New route + component | H13 |
| C14 | Wire verdict badges (BUY/HOLD/WAIT) on all project cards | P1 | Component update | None |
| C15 | Wire evidence scores on project cards | P1 | Component update | None |
| C16 | Add SVG initial placeholders for missing developer logos | P1 | Component fallback | H23 |
| C17 | Reframe /top-data as "Market Intelligence Terminal" | P1 | Section header + copy | H11 |
| C18 | Wire DLD notification feed (api.notifications_v1 ready) | P2 | New component | None |
| C19 | Add sort_score DESC as default sort on /properties | P1 | Query parameter fix | None |
| C20 | Add city tabs on /areas (Dubai / Abu Dhabi / RAK) | P2 | Tab component | None |
| C21 | Copilot system prompt: enterprise-only, zero consumer language | P0 | System prompt update | H11 |
| C22 | Add API preview badge on every data card | P2 | Component addition | H3 |
| C23 | Update package.json name/description to enterprise language | P2 | Config file edit | H11 |
| C24 | Remove all Roomdood/Dood references from codebase | P0 | Full codebase search & replace | H15 |

---

## PRIORITY LEGEND

| Priority | Meaning | Timeline |
|----------|---------|----------|
| P0 | Must ship — breaks enterprise credibility if missing | This sprint |
| P1 | Should ship — visible gap but not a dealbreaker | Next sprint |
| P2 | Nice to have — enhances but not critical | Backlog |

---

## FILES CODEX NEEDS

| File | Size | Purpose |
|------|------|---------|
| `CODEX_FRONTEND_ALIGNMENT.md` | 10.4KB | Complete copy transformation playbook (all 3 critiques) |
| `DATA_SYNC_BLUEPRINT.md` | 6.0KB | Data gaps + sitemap + route-to-source mapping |
| `ENTERPRISE_ARCHITECTURE_SPEC_v3.md` | 25KB | CTO-facing architecture document |

---

## BLOCKED ITEMS (Need External Services)

| Item | Blocker | Resolution |
|------|---------|------------|
| Developer logos (451 missing) | No public API for developer logos | Option A: SVG initials (Codex C16). Option B: Manual scraping pipeline. |
| Geocoding (1,859 projects) | No geocoding API key configured | Option A: Google Maps Geocoding API. Option B: Area-level centroid estimation. |
| Arabic price rendering | Frontend i18n bug | Codex C12 — pure frontend fix. |

---

## WHAT'S DONE (Hex Deliverables)

- ✅ Enterprise Architecture Spec v3 (25KB, 13 sections + 3 appendices)
- ✅ Frontend Copy Transformation Codex (10.4KB, all 3 critiques)
- ✅ Data Sync Blueprint (6KB, full sitemap + gaps)
- ✅ 55 system alignment issues resolved
- ✅ 37 critique tasks implemented
- ✅ 6 new enterprise infrastructure tables
- ✅ V1 Signal Engine: 100% coverage
- ✅ Genome vectors: 100% coverage
- ✅ Developer descriptions: 100%
- ✅ PF URLs: 100%
- ✅ Al Warsan outlier: purged
- ✅ Zero consumer language in database
- ✅ Strategic roadmap: 90% implemented (38/42)

---

*All files stored in Neon + on disk. Ready for Codex handoff.*
