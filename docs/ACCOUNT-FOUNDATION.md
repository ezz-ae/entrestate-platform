# The Account Foundation

**The owner's decision, 2026-08-30, verbatim intent:** the account everything
builds on is the BUSINESS account — "احنا هنحتاج نخلي الأساس اللي بنبني عليه
هو الأكاونت اللي من البيزنس حتى لو الـ UI بتاع الأكاونت التاني أوضح أو مكتمل
أكتر، فمهم إننا منخسرش الشغل اللي اتعمل" — and the economics run on wallet
logic: "الفكرة قايمة على منطق الوالت بيعملها توب أب وكل أبلكيشن له دنيته مع
نفسه، مش كله بيتحاسب بنفس الطريقة".

This file is the map that decision was made on. The organizing phase either
buries things or surfaces them (his words); this is where nothing gets buried.

---

## Side A — the business account (THIS repo): the foundation

What already exists, found and named:

**Identity & tenancy.** Homegrown scrypt auth (`lib/auth.ts`,
`freehold_site_session` cookie — a live client's sessions ride on it: never
touched). Self-serve onboarding (`lib/tenancy/onboard.ts`): signup on the
apex, short-lived HMAC claim token, session minted on the tenant host,
schema-per-tenant provisioning. Plans: `company` | `realtor`.

**Money — THREE ledgers today, and that is the first thing to organize:**

1. `lib/freehold/wallet.ts` — **Ads Coin**: double-entry, every movement two
   equal-and-opposite postings, coin issued/burned only through the treasury,
   `conservationError` checked. Finance UI at
   `freehold-intelligence/finance/wallets`. Bank-grade. **This is the account
   wallet.**
2. `lib/freehold/credits-db.ts` + `credit-topups.ts` — broker credits:
   balance as a SUM over allocation/spend rows; top-up = request → human
   confirms payment → ledger `allocation`, idempotent at the database.
3. `lib/ctrl/wallet.ts` — the ctrl marketplace ledger: append-only,
   fils-denominated, idempotent on `ref`, debit transactional with lead
   delivery (Ziina intents, pay-per-lead).

Ruling for the foundation: ONE wallet per account — Ads Coin. The other two
do not die (working systems, live money): they become **feeders/adapters**
that settle into the one ledger, on their own schedule, with guards. "كل
أبلكيشن له دنيته" means each app keeps its own PRICING; it never means each
app keeps its own BANK.

**Machinery.** CRM (`app/api/crm`, workspace `crm`), integrations (HubSpot
overview/credentials/sync), and the workspace apps: ads, ads-live, agent,
ai-manager (carrying the page builder — home/about/services/contact as
movable blocks with palette, heading font and publish; engine
`lib/freehold/front-layout.ts`, rendered by `FrontCanvas`), analytics,
calendar, cloud, creative-studio, drive, finance, inventory, lead-machine,
management, milestones, notebook, points, reviews, security, settings,
store, tasks, team.

**The catalog** (`lib/freehold/app-store.ts`) — one source, SERVED to the
Terminal at `/api/store/catalog`, never copied.

## Side B — the Terminal account (Entrestate_os): the surfaces

Identity: Neon Auth (`@neondatabase/auth`), session cookie now on
`.entrestate.com` (shared-subdomain groundwork done; `NEON_AUTH_BASE_URL` +
`NEON_AUTH_COOKIE_SECRET` aligned across both Vercel projects).

Surfaces worth keeping — none of this gets lost:

- `/me` — market pulse, open data, saved areas, listings, the App Store
  section (reads THIS repo's catalog), alerts.
- `/account` — api-keys, notebooks (`book`), reports, profile. (Its old Tap
  billing pages are dormant: the Terminal sells nothing itself.)
- `/workspace` — agent-creator, comparisons, daas, dashboards,
  data-scientist, imports, math-tools, saved-searches, search.
- `/apps` — agent-builder, lead-agent, coldcalling; `/automations`,
  `/agent-runtime`.
- The advisor chat (ONE chat across sidebar, /chat, /markets).

## The wiring — one person, one account, two doors

1. **Identity door = Neon Auth.** The person signs up once on the Terminal
   (discovery is included; the word "free" is banned from selling surfaces).
   The cookie lands on `.entrestate.com`, so the business site can SEE it.
2. **Recognition.** The platform verifies the Neon session server-side
   (shared secret + base URL — env parity already in place) and maps the
   identity to a business account: existing tenant member → their workspace;
   new identity → an account born ready to install apps (the `realtor`-plan
   path already exists in onboarding).
3. **Commerce spine = the business account.** Wallet, installs, entitlements
   live HERE. The Terminal's account surfaces read them through served
   bridges (the store-catalog pattern), never copies.

## Catalog schema, next extension

Per-app economics, from the owner's model:

- `billing: 'included' | 'tokens' | 'subscription'` — tokens debit the Ads
  Coin wallet as the app runs; subscription bills the account per period;
  included costs nothing.
- `includes: ProductId[]` — Web Designer ships with Inventory inside it.
- `installsOn: ProductId[]` — Inventory installs onto Google Lead Machine.
- Install itself can be free while usage is token-billed — the two axes are
  independent.

## Standing rules that govern this work

- The client's name never renders on an Entrestate surface; his server,
  sessions, data, ads and leads are untouchable.
- The catalog (and every account fact) is SERVED from one source, never
  vendored — a vendored copy already swallowed a price guard once.
- Benefit before description, on every surface.
- The word "free" never sells: the included layer is NAMED (market
  discovery). Guards: `scripts/store-bridge-test.ts` here,
  `tests/human-labels.test.ts` on the Terminal.
- Money paths ship with guards in the repo that charges
  (`tests/pricing-money.test.ts` precedent).

## Phases

1. **Session recognition** — platform middleware verifies the shared Neon
   session; the business site greets the Terminal account by name.
2. **Account mapping** — identity → business account (find-or-create), the
   /me App Store section deep-links straight into install flows.
3. **One wallet** — Ads Coin as the settle point; top-up flow surfaced on
   the account; credits/ctrl adapters documented and scheduled.
4. **Catalog economics** — billing/includes/installsOn fields + store UI
   speaking them (guarded).
5. **Terminal surfaces on the foundation** — dashboards/agents/design/social
   read entitlements from the business account; nothing rebuilt, everything
   re-pointed.
