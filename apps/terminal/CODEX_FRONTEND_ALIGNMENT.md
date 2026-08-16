# CODEX: Frontend Alignment with Enterprise Architecture v3
## Generated 2026-04-09 — Entrestate Decision Infrastructure

---

## CRITICAL CONTEXT

This document tells Codex EXACTLY what to build, change, and delete on the frontend
to achieve 100% alignment with the enterprise architecture spec v3.

The backend is complete. The database has:
- 2,813 verified projects in `canonical.inventory_clean` (100% V1 Signal Engine coverage)
- 481 developers in `canonical.developer_registry`
- 41,381 Bayut listings in `raw.bayut_listings`
- 36,841 DLD transactions in `api.dld_transactions_v1`
- 7,217 SDR folders in `roomdood.folders`
- 18 enterprise API endpoints defined
- 11 API views serving data
- 5 system invariants enforced
- 8 headless contracts (all UI_OPINION = NONE)
- Zero consumer language anywhere in the database

The frontend must now match this reality.

---

## SYSTEM INVARIANTS (Non-Negotiable)

1. **Single Spine Rule** — Every entity traces to one canonical record. No shadow tables.
2. **Double Precision Financials** — All monetary fields NUMERIC(15,2). No floats.
3. **Strict Traceability** — Every score carries price_source, evidence_level, confidence.
4. **Deterministic Outputs** — LLM never writes SQL. Intent extraction separated from data retrieval.
5. **Headless by Design** — No UI, no consumer branding, no presentation logic. JSON API only.

**Frontend implication:** Every page, every component, every API call must respect these invariants.
Invariant #5 (Headless by Design) means: the frontend is YOUR implementation on top of our API.
There are zero prescribed UI patterns. You own every pixel.

---

## PART 1: LANGUAGE PURGE — Zero Consumer Language

### What to DELETE (search entire codebase)

Remove ALL instances of:
- "Roomdood", "Room Dude", "Dood", "dood" (any casing)
- "friendly persona", "warm tone", "concierge", "mascot"
- "tenant journey", "landlord creates", "Flow A", "Flow B"
- "consumer app", "marketplace", "rental app"
- "Dood Discover", "Dood Assist"
- Any UI-specific language in API descriptions

### What to REPLACE WITH

| Old Term | New Term |
|----------|----------|
| Roomdood / Room Dude / Dood | Entrestate |
| folder | Structured Deal Room (SDR) |
| tenant journey | end-user API flow |
| friendly persona | configurable system prompt |
| concierge | orchestration layer |
| marketplace | infrastructure platform |
| consumer app | enterprise infrastructure |
| WhatsApp carousel | structured message payload |
| double-blind privacy | cryptographic consent handshake |

### Files to check (at minimum)
- All `*.ts`, `*.tsx`, `*.js`, `*.jsx` files
- `package.json` (name, description)
- `next.config.js` / `next.config.ts`
- All markdown/documentation files
- Environment variable names and comments
- API route comments and JSDoc
- Component prop names and CSS class names
- Test files and fixtures

---

## PART 2: API SURFACE — What the Frontend Consumes

### Existing API Views (Neon PostgreSQL via Supabase)

These views are live and populated:
- `api.area_intelligence_v1`
- `api.areas_v1`
- `api.compare_v1`
- `api.developer_leaderboard_v1`
- `api.developers_v1`
- `api.dld_transactions_v1`
- `api.listings_feed`
- `api.market_pulse_v1`
- `api.notifications_v1`
- `api.projects_v1`
- `api.search_index`

### Enterprise API Endpoints (Target Architecture)

| Method | Endpoint | Description |
|--------|----------|-------------|

### Communication Layer
| `POST` | `/api/v1/messaging/classify` | Classify inbound text → return safe action buttons |

### Deal Engine
| `GET` | `/api/v1/workspace/{id}` | Full transaction workspace: media, pricing, compliance, negotiation, contract |
| `POST` | `/api/v1/workspace/{id}/transition` | State machine transition with validation (22 valid paths) |

### Genome Engine
| `GET` | `/api/intel/genome/alternatives/:id` | Soft-bounce recovery |
| `POST` | `/api/intel/genome/detect-collision` | Near-duplicate SDR detection |

### Intelligence Layer
| `POST` | `/api/v1/market/underwrite` | Algorithmic underwriting using property genome + DLD transaction data |
| `POST` | `/api/v1/search/vector` | Multi-dimensional property search using genome vectors |

### Liquidity Engine
| `POST` | `/api/v1/holds/extend` | Extend hold only if qualifying milestone occurred since last extension |
| `POST` | `/api/v1/holds/request` | Request inventory lock with automatic queue fallback |
| `POST` | `/api/v1/queue/promote` | Promote next queue candidate. Verified tenants get priority |
| `POST` | `/api/v1/recovery/soft-bounce` | Find 95% genetic match when primary choice is locked |

### Supply Ingestion
| `POST` | `/api/v1/ingest/portfolio` | Bulk ingest from mega-landlord portfolio API (enterprise tier) |
| `POST` | `/api/v1/ingest/url` | Submit external listing URL → returns structured workspace with delta checklist |
| `POST` | `/api/v1/spine/match` | Match imported listing against authoritative property spine |

### Transaction Engine
| `POST` | `/api/execution/dispute/resolve` | Self-serve dispute resolution |

### Trust Layer
| `GET` | `/api/v1/consent/compute-overlap` | Compute intersection of contact channel preferences between parties |
| `POST` | `/api/v1/trust/collision-test` | Genetic collision test — submit listing vector, get duplicate probability |
| `POST` | `/api/v1/trust/sybil-check` | Network fingerprint + address collision check before publish |

### Current Supabase Wiring

The frontend currently reads from Supabase (which proxies to Neon). The API views above
are the source of truth. Ensure every frontend query maps to one of these views.

**Key routes that must work:**
- `/api/areas` → reads from `api.areas_v1` (167 areas)
- `/api/developers` → reads from `api.developers_v1` (481 developers)
- `/api/search` → reads from `api.search_index` (2,813 projects)
- `/en/properties` → project listing from `api.projects_v1`
- `/en/developers` → developer cards from `api.developers_v1`
- `/en/areas` → area profiles from `api.areas_v1`
- `/en/top-data` → reads from `api.market_pulse_v1` + `api.area_intelligence_v1`
- `/en/chat` → Gemini copilot with MCP tool bridge
- `/ar/*` → Arabic translations from `inventory_clean.area_ar`, `developer_ar` columns

---

## PART 3: HEADLESS CONTRACTS — How to Build Each Feature

Every feature below has been documented as a headless API contract.
The "Old" framing is what may still exist in the codebase. Kill it.
The "New" framing is what to build.

### AI Persona / Dood Modes
- **Old (KILL):** Friendly warm brand-forward Dood chatbot character with Discover/Assist modes
- **New (BUILD):** Configurable system prompt params via JSON; licensee injects own brand voice
- **Endpoint:** `/api/config/prompt`
- **UI Opinion:** NONE — licensee owns all personality

### Collision Dispute
- **Old (KILL):** Moderator reviews case manually, contacts both parties by phone
- **New (BUILD):** Self-serve evidence API; 72h auto-expire; zero human moderator
- **Endpoint:** `/api/execution/dispute/evidence`
- **UI Opinion:** NONE — licensee builds dispute flow

### Contact Reveal
- **Old (KILL):** Double-blind UI step, two users click approve button
- **New (BUILD):** Cryptographic consent handshake; token verification; audit-logged unlock
- **Endpoint:** `/api/execution/consent/reveal`
- **UI Opinion:** NONE — licensee implements reveal UX

### Investment Screening
- **Old (KILL):** Consumer search page with filters, cards, and sort options
- **New (BUILD):** TableSpec JSON input; deterministic SQL execution; evidence-backed scoring
- **Endpoint:** `/api/decision/screen`
- **UI Opinion:** NONE — licensee owns search UI

### Similarity Search
- **Old (KILL):** Property cards showing similar listings with photos and carousels
- **New (BUILD):** Raw genome vectors + cosine distances; zero visual components
- **Endpoint:** `/api/intel/genome/similar/:id`
- **UI Opinion:** NONE — licensee renders results

### Timed Hold
- **Old (KILL):** Tenant says yes in chat, gets 2-hour inquiry hold visual
- **New (BUILD):** POST endpoint with typed params; duration from hold_type config; row-level lock prevents double-booking
- **Endpoint:** `/api/execution/hold`
- **UI Opinion:** NONE — licensee decides hold presentation

### WhatsApp Actions
- **Old (KILL):** Step-by-step WhatsApp carousel messaging flow
- **New (BUILD):** Reference implementation only — webhook adapter consuming standard API endpoints
- **Endpoint:** `/docs/reference/whatsapp-adapter`
- **UI Opinion:** Reference impl only — not core spec

### Yield Optimization
- **Old (KILL):** Yield nudge with user-facing recommendation cards
- **New (BUILD):** RERA-compliant evaluation endpoint; numeric adjustment + confidence; no visuals
- **Endpoint:** `/api/execution/yield/evaluate`
- **UI Opinion:** NONE — licensee builds nudge UI


---

## PART 4: PAGES — What Each Route Must Show

### `/en` (Homepage)
- Hero: Enterprise pitch — "Real Estate Decision Infrastructure"
- Featured projects: Top 20 by `sort_score` from `api.projects_v1`
- Market pulse: DLD velocity + volume from `api.market_pulse_v1`
- Developer showcase: Top developers by project count
- Zero consumer CTAs ("Sign up free", "Start your journey")
- API preview badge on every data card (shows this is infrastructure)

### `/en/properties`
- Grid of project cards from `api.projects_v1`
- Each card shows: name, area, price_from, developer, V1 scores (timing, yield, stress, evidence)
- Verdict badge: BUY / HOLD / WAIT based on `decision_label_v1`
- Filter by: area, price range, bedrooms, golden_visa, developer
- Sort by: sort_score (default), price, yield, timing

### `/en/developers`
- Developer cards from `api.developers_v1`
- Show: name, tier, logo, project_count, avg_score, avg_yield
- Link to developer detail with project list
- Arabic name from `developer_ar` column

### `/en/areas`
- Area profiles from `api.areas_v1` / `api.area_intelligence_v1`
- Show: name, city, project_count, avg_price, median_price, avg_yield
- City tabs: Dubai, Abu Dhabi, RAK
- Best Value badge for area with best yield-to-price ratio
- Arabic name from `area_ar` column

### `/en/top-data`
- Market intelligence dashboard
- Sections: Market Pulse, Timing Signals, Stress Test, Yield Analysis, Evidence Layer
- DLD transaction feed from `api.dld_transactions_v1`
- Developer reliability rankings
- Golden Visa eligible projects
- All data from `entrestate_top_data` view

### `/en/chat`
- Gemini copilot with MCP tool bridge
- System prompt: enterprise, no consumer language
- Tools: search_mapped_city, get_sdr_detail, request_primary_hold, etc.
- TableSpec JSON output constraint (see §2 of v3 spec)
- Zero "friendly Dood" personality — configurable system prompt
- Evidence drawer on every response

### `/ar/*`
- Full Arabic RTL support
- `dir="rtl"` on root element
- Arabic area names, developer names, UI labels
- Same data, same API views, different presentation language

---

## PART 5: CONFIGURATION API — What Licensees Can Control

The v3 spec defines a Configuration API that lets licensees customize:

### `PUT /api/config/prompt`
- `voice`: string — brand voice description
- `constraints`: array — behavioral constraints
- `temperature`: number — LLM creativity dial
- `language`: string — default language

### `PUT /api/config/hold-types`
- Custom hold durations per licensee
- Override default inquiry/viewing/decision/contract timings

### `PUT /api/config/brand`
- `brand_name`: string — licensee brand
- `tone`: string — formal/casual/technical
- `language`: string — default UI language

**Frontend implication:** The chat/copilot system prompt should read from a config
table, not be hardcoded. When a licensee deploys, they inject their own brand via API.

---

## PART 6: REFERENCE IMPLEMENTATIONS (Supplementary Only)

These are NOT part of the core product. They are optional delivery adapters:

- **Email Notification Bridge** (Event subscriber) → `/docs/reference/email-bridge` — NOT core spec, supplementary only
- **Push Notification Relay** (Event subscriber) → `/docs/reference/push-relay` — NOT core spec, supplementary only
- **Slack/Teams Bot** (MCP client) → `/docs/reference/chat-bot-adapter` — NOT core spec, supplementary only
- **WhatsApp Action Sessions** (Webhook adapter) → `/docs/reference/whatsapp-adapter` — NOT core spec, supplementary only

**Frontend implication:** WhatsApp flows, email notifications, push notifications
are NOT in the core spec. If they exist in the codebase, they should be clearly
separated into a `/lib/reference-implementations/` directory, not mixed with core code.

---

## PART 7: WHAT TO DELETE

### Files/Components to Remove or Refactor
1. **Any "Dood" persona components** — chatbot character UI, mood selectors, tone pickers
2. **Consumer onboarding flows** — "Sign up free", tenant registration, landlord wizard
3. **B2C pricing pages** — if any micro-SaaS pricing ($49-$999) is visible to enterprise buyers
4. **WhatsApp carousel renderers** — move to reference implementations, not core
5. **Double-blind reveal UI** — replace with consent API call pattern
6. **Folder terminology** — rename all "folder" references to "SDR" in user-facing text
7. **Legacy schema references** — `dude_conversations`, `tenant_intents`, etc.

### Environment Variables to Check
- Remove any `DOOD_*`, `ROOMDOOD_*`, `TENANT_*` prefixed env vars
- Ensure `NEXT_PUBLIC_*` vars don't expose consumer branding
- Database connection should point to Neon (via `NEON_DATABASE_URL`)

---

## PART 8: WHAT TO BUILD (if not already present)

### Missing Components
1. **Evidence Drawer** — every project/area/developer card should show source attribution
2. **Verdict Badge** — BUY/HOLD/WAIT visual based on `decision_label_v1`
3. **API Preview** — on every data card, show a small "API" badge that reveals the JSON payload
4. **Genome Similarity** — "Similar Projects" section using pgvector cosine distance
5. **DLD Transaction Feed** — real-time notification feed from `api.notifications_v1`
6. **Market Pulse Widget** — velocity + volume + trend signals
7. **Investment Memo Generator** — POST to `/api/decision/memo` and render structured result
8. **Configuration Panel** — for licensee customization (brand, prompt, hold types)

### Required npm Packages (verify installed)
- `@supabase/supabase-js` — database client
- `@google/generative-ai` — Gemini for copilot
- `next` — framework
- `next-intl` or equivalent — i18n for Arabic

---

## PART 9: VERIFICATION CHECKLIST

After implementing all changes, verify:

- [ ] Zero instances of "Roomdood", "Dood", "dood" in codebase
- [ ] Zero instances of "friendly persona", "warm tone", "concierge"
- [ ] Zero instances of "marketplace", "consumer app", "rental app"
- [ ] All "folder" references in user-facing text replaced with "SDR"
- [ ] `/api/areas` returns 167 areas
- [ ] `/api/developers` returns developers (not empty)
- [ ] `/api/search` returns projects with V1 scores
- [ ] `/en/chat` copilot uses enterprise system prompt (no Dood personality)
- [ ] `/ar/*` pages render RTL with Arabic translations
- [ ] Evidence drawer visible on project detail pages
- [ ] Verdict badges (BUY/HOLD/WAIT) visible on project cards
- [ ] DLD transaction feed accessible
- [ ] WhatsApp flows (if any) in separate reference-implementations directory
- [ ] No hardcoded brand voice — reads from config
- [ ] `package.json` name/description = enterprise language
- [ ] All API routes documented with JSDoc using enterprise terminology

---

## PART 10: THE ONE RULE

> The frontend is a demo environment for the infrastructure.
> It is NOT a consumer marketplace.
> Every page should make a CTO think "I want this powering MY portal"
> not "this is a competitor to my portal."

**Zero consumer language. Zero competing CTAs. Pure infrastructure demo.**

If a CTO visits entrestate.com, they should see:
1. How the Decision Engine scores properties
2. How the DLD feed provides real-time transaction intelligence
3. How the Sybil Firewall protects transaction integrity
4. How the pgvector Genome Engine finds similar properties
5. How all of this is available via typed JSON API endpoints

That's it. That's the entire frontend job.

---

*Generated from Entrestate Decision Infrastructure — Enterprise Architecture Spec v3*
*Database: Neon PostgreSQL | 2,813 projects | 36,841 DLD transactions | 18 API endpoints*
