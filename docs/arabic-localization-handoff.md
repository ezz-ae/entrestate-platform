# Arabic Localization Handoff

## Goal

Ship full bilingual `en` / `ar` support across Entrestate without changing the scoring engine, database tables, or V1 decision logic.

Arabic should cover:

- UI copy
- navigation and calls to action
- chat intake and response chrome
- RTL layout behavior
- number, currency, and date formatting
- SEO metadata and locale-aware routing

The decision engine remains unchanged. Only the presentation, formatting, and language layers change.

## Current Repo Findings

### No i18n framework exists yet

- `app/layout.tsx` hardcodes `<html lang="en">`
- there is no locale middleware
- there is no `messages/`, `locales/`, or translation dictionary structure
- there is no `dir="rtl"` support at the app shell level

### Major hardcoded English surfaces

- `components/navbar.tsx`
- `components/footer.tsx`
- `components/homepage/hero-section.tsx`
- `components/ChatInterface.tsx`
- many pages under `app/`

### Formatting is English-first today

- example explicit locale formatting exists in `components/dld/transaction-notification.tsx`
- many values still use raw `toLocaleString()` or hardcoded `AED` strings, including chat formatting in `components/ChatInterface.tsx`

### Chat is language-rigid today

- system prompt is English-only in `lib/copilot/tools.ts`
- terminal fallback blocks are English-only in `app/api/chat/route.ts` and `app/api/copilot/route.ts`
- chat examples and UI prompts are English-only in `components/ChatInterface.tsx`

## Recommended Architecture

Use **bilingual locale routing** with **RTL-aware rendering**.

### Recommendation

Adopt `next-intl` for App Router localization.

Why:

- large surface area
- many server-rendered pages
- metadata support matters
- easier message organization than ad hoc dictionaries
- cleaner long-term maintenance for `en` + `ar`

### Target structure

```text
app/
  [locale]/
    layout.tsx
    page.tsx
    chat/page.tsx
    overview/page.tsx
    developers/page.tsx
    properties/page.tsx
    top-data/page.tsx
messages/
  en.json
  ar.json
i18n/
  request.ts
  routing.ts
  locale.ts
proxy.ts
```

### Locale rules

- supported locales: `en`, `ar`
- default locale: `en`
- Arabic pages render with:
  - `lang="ar"`
  - `dir="rtl"`
- English pages render with:
  - `lang="en"`
  - `dir="ltr"`

### URL strategy

- `/en/...`
- `/ar/...`

Optional later:

- redirect `/` to last-used locale via cookie
- keep canonical English default if preferred for SEO

## Implementation Plan

### Phase 1 — Core locale infrastructure

Implement first.

Files to add/update:

- `app/layout.tsx`
- `proxy.ts`
- `package.json`
- `messages/en.json`
- `messages/ar.json`
- `i18n/request.ts`
- `i18n/routing.ts`
- `i18n/locale.ts`

Tasks:

- add `next-intl`
- create locale config
- wrap app with locale provider
- move root layout behavior into locale-aware layout
- set `lang` and `dir` from locale
- add locale switcher component

Acceptance:

- `/en` and `/ar` both render
- HTML direction changes correctly
- locale persists between pages

### Phase 2 — Shell, navigation, and global UI

Convert shared chrome first.

Files:

- `components/navbar.tsx`
- `components/footer.tsx`
- `components/account-menu.tsx`
- `components/homepage/hero-section.tsx`
- `components/copilot-provider.tsx`
- `app/layout.tsx`

Tasks:

- extract all labels into translation keys
- add locale switcher in navbar or account menu
- flip menu alignment and drawer behavior for RTL
- replace directional spacing assumptions with logical styling where needed

Acceptance:

- navbar, footer, and homepage hero work in Arabic
- mobile menu opens correctly in RTL
- icons and arrows do not look reversed incorrectly

### Phase 3 — Formatting and shared utilities

Centralize formatting before translating deeper pages.

Add shared helpers:

- `lib/format/locale.ts`
- `lib/format/currency.ts`
- `lib/format/number.ts`
- `lib/format/date.ts`

Tasks:

- replace raw `toLocaleString()` usage with locale-aware helpers
- replace hardcoded `AED ${...}` patterns with formatter helpers
- support:
  - English numerals for `en`
  - Arabic numerals or product-approved numeral style for `ar`
- standardize date formatting for `en-AE` and `ar-AE`

Hotspots already identified:

- `components/ChatInterface.tsx`
- `components/dld/transaction-notification.tsx`
- `components/homepage/hero-section.tsx`
- cards and list UIs under `components/decision/`

Decision required:

- whether Arabic uses Arabic-Indic digits or Western digits

Recommended default:

- Arabic UI text with **Western digits** for financial readability unless product explicitly wants Arabic-Indic digits

### Phase 4 — Chat and copilot localization

This is the most sensitive layer.

Files:

- `lib/copilot/tools.ts`
- `app/api/chat/route.ts`
- `app/api/copilot/route.ts`
- `components/ChatInterface.tsx`
- `components/llm-search/sidebar.tsx`

Tasks:

- add locale-aware system prompt selection
- keep command semantics in English internally:
  - `SCREEN`, `PROJECT`, `AREA`, `COMPARE`, `RISK`, `MEMO`, `PULSE`
- allow Arabic user input to map into the same internal commands
- localize:
  - chat placeholders
  - empty states
  - error messages
  - onboarding chips
  - fallback command guide
- decide whether final chat output should be:
  - fully Arabic
  - or Arabic prose with English signal labels

Recommended decision:

- Arabic explanatory text
- keep core signal labels bilingual or canonical where trust matters:
  - `STRONG_BUY`
  - `BUY`
  - `HOLD`
  - `WAIT`
  - `AVOID`

Reason:

- keeps the decision engine canonical
- avoids ambiguity in investor workflows
- preserves consistency across exports and screenshots

Example Arabic output style:

```text
مارينا فيستا — دبي هاربور
────────────────────────────
السعر:        AED 2,482,299
العائد:       2.67%
الضغط:        C (74)
التوقيت:      WAIT (54)
الأدلة:       L4 (87)
النتيجة:      60

القرار:       HOLD
المطور:       إعمار العقارية
```

### Phase 5 — Core product pages

Translate the highest-value pages next.

Priority pages:

- `app/page.tsx`
- `app/chat/page.tsx`
- `app/overview/page.tsx`
- `app/properties/page.tsx`
- `app/properties/[slug]/page.tsx`
- `app/developers/page.tsx`
- `app/developers/[slug]/page.tsx`
- `app/top-data/page.tsx`
- `app/areas/page.tsx`
- `app/areas/[slug]/page.tsx`
- `app/market-score/page.tsx`

Tasks:

- replace hardcoded headings and subtitles
- ensure tables/cards work in RTL
- keep database-backed values unchanged
- localize labels only, not identifiers

### Phase 6 — SEO and metadata

Files:

- `app/layout.tsx`
- page-level metadata generators
- `lib/seo.ts`
- `app/sitemap.ts`

Tasks:

- emit locale-aware titles and descriptions
- add `hreflang` alternates for `en` and `ar`
- localize Open Graph titles/descriptions where appropriate
- ensure canonical handling is correct

Acceptance:

- `/ar/...` pages have Arabic metadata
- alternates link Arabic and English equivalents

## RTL Engineering Notes

### Must verify carefully

- sidebars and slide-over drawers
- table overflow and horizontal scrolling
- input paddings with icons
- breadcrumb arrows and chevrons
- chart legends and axis label alignment
- carousel direction
- sticky headers and filter bars

### Preferred styling guidance

Avoid assuming left/right in component logic.

Prefer:

- `text-start`, `text-end`
- `ms-*`, `me-*` if available
- direction-aware flex layouts
- conditional icon mirroring only where semantically needed

Do not blindly reverse:

- financial tables
- sparkline directions
- score badges

## Content and Data-Agent Deliverables

The data agent should own the **Arabic content system**, not database schema changes.

### Deliverables needed from the data agent

1. Translation glossary

Must define approved Arabic for:

- timing labels
- stress grades
- evidence levels
- yield labels
- decision labels
- CTA vocabulary
- navigation terms

2. Bilingual entity policy

Decide for each category whether to keep English, Arabic, or bilingual display:

- developer names
- project names
- area names
- tower/community names

Recommended default:

- keep canonical entity name in English if that is the market-standard identity
- optionally add Arabic alias where verified

3. Arabic chat prompt set

Provide Arabic examples for:

- market pulse request
- project analysis request
- screening request
- area intelligence request
- developer due diligence request

4. Arabic UI copy pack

Provide translated values for:

- nav
- footer
- homepage hero
- chat empty state
- top-data headings
- properties filters
- developers filters

5. QA matrix

Validate:

- financial terminology consistency
- no mistranslation of investment signals
- no accidental translation of canonical labels that should remain fixed

## Non-Goals

Do not change:

- database schema
- V1 score columns
- signal logic
- decision thresholds
- API contracts unless adding locale support

Do not translate internal identifiers such as:

- `stress_grade_v1`
- `investor_score_v1`
- `decision_label_v1`
- `timing_label`

These stay internal and canonical.

## Suggested Build Order

1. locale infrastructure
2. navbar + footer + homepage hero
3. chat shell + chat fallbacks
4. shared formatters
5. overview + properties + developers + top-data
6. metadata + SEO
7. broad QA pass on RTL and mobile

## Acceptance Criteria

Arabic launch is ready when:

- `/ar` renders with RTL correctly
- homepage, chat, overview, properties, developers, and top-data are translated
- chat accepts Arabic input and responds in Arabic presentation style
- core signal labels remain trustworthy and consistent
- currency, dates, and counts are locale aware
- no broken layout on mobile or desktop RTL
- English still works unchanged

## Immediate Next Step

Frontend agent:

- create locale architecture and wire `en` / `ar`

Data agent:

- produce translation glossary + Arabic copy pack + bilingual entity policy
