# ENTRESTATE FRONTEND CODEX — Enterprise Demo Through Your Own Site
## Turn entrestate.com into the sales weapon. They buy what they can try.

---

## The Positioning Problem (and Solution)

**Problem:** If entrestate.com looks like a consumer portal, Dubizzle/Bayut sees a competitor.
**Solution:** Make entrestate.com look like an **enterprise demo environment** — a sandbox where a CTO can see the infrastructure working on real data, not a portal competing for traffic.

### What To Change on entrestate.com

| Current (Consumer) | Change To (Enterprise) | Why |
|---|---|---|
| "Find your next home" | "Real Estate Decision Infrastructure — Live Demo" | Signals infrastructure, not infrastructure platform |
| Property cards with "Contact Agent" | Property cards with "API Response Preview" | Shows this is an API layer |
| Chat with AI assistant | "Decision Terminal — Try the Query Engine" | Enterprise language |
| Search bar | "Structured Query API — Live" | Shows the engine, not the wrapper |
| Areas/Developers pages | "Data Coverage — 2,813 Projects, 41,381 Listings, 36,841 DLD Transactions" | Shows data moat |
| Pricing/signup | "Integration Guide + API Keys" | B2B not B2C |
| Footer: social links | Footer: "Contact Enterprise Sales" | B2B funnel |

### What To Keep

- All project data, images, scores — this IS the demo
- Search functionality — proves the Decision Engine works
- Areas + Developers pages — proves data coverage
- Arabic support — proves localization depth
- DLD integration — proves transaction data access

### The Key Psychological Trick

> **When a Dubizzle CTO sees entrestate.com, they should think "I want this running under my site" — not "this is trying to steal my users."**

This means:
1. No consumer onboarding flow
2. No "create account" for tenants
3. No property inquiries or lead capture
4. Instead: "See how this API structures your data" at every touchpoint

---

## Current Live State

### Working Pages (all 200 OK)
- `/en` — Homepage (RSC, 112KB)
- `/en/properties` — Project listings (RSC, 82KB)
- `/en/developers` — Developer profiles (39KB)
- `/en/areas` — Area intelligence (1.1MB — rich data)
- `/en/top-data` — Market signals + intelligence sections
- `/en/chat` — Decision Terminal (Gemini copilot)
- `/ar` — Arabic mirror (RTL working)

### Working API Endpoints
- `GET /api/areas` — Returns 167 areas with benchmarks
- `GET /api/search` — Returns projects with pagination

### Database (11 API views)
| View | Rows | Powers |
|---|---|---|
| `api.projects_v1` | 2,813 | /properties page |
| `api.developers_v1` | 481 | /developers page |
| `api.areas_v1` | 167 | /areas page |
| `api.search_index` | 2,813 | Search + Decision Terminal |
| `api.dld_transactions_v1` | 36,841 | Market intelligence |
| `api.market_pulse_v1` | 183 | /top-data sections |
| `api.compare_v1` | 2,813 | Side-by-side comparison |
| `api.developer_leaderboard_v1` | 45 | Developer rankings |
| `api.area_intelligence_v1` | 167 | Area deep-dive |
| `api.listings_feed` | 2,813 | Real-time feed |
| `api.notifications_v1` | 500 | Alert engine |

### Leasing Infrastructure (in DB, not yet on frontend)
| Table | Rows | Ready For Demo |
|---|---|---|
| `roomentrestate.folders` | 7,217 | Transaction workspace API |
| `roomentrestate.listing_imports` | 5,358 | Multi-source ingestion |
| `roomentrestate.folder_holds` | active | Inventory Lock Protocol |
| `roomentrestate.folder_queue_entries` | active | Queue management |
| `roomentrestate.contact_consents` | active | Trust Protocol |
| `roomentrestate.whatsapp_intent_config` | 8 intents | Structured Action Protocol |

---

## Frontend Changes — File by File

### 1. Homepage (`/en` → `/en`)

**Current:** Consumer landing page
**Change to:** Enterprise demo landing

```tsx
// app/[locale]/page.tsx — Replace hero section

<section className="hero">
  <h1>Entrestate Decision & Execution Infrastructure</h1>
  <p className="subtitle">
    One truth layer. Proper API boundaries. Real estate decision and execution, unified.
  </p>
  <p className="stats">
    {ic:,} PF-verified projects · 41,381 Bayut listings · 36,841 DLD transactions · 167 areas · 481 developers
  </p>
  <div className="cta-row">
    <a href="/en/properties" className="btn-primary">Explore the Data</a>
    <a href="/en/chat" className="btn-secondary">Try the Decision Terminal</a>
    <a href="#api" className="btn-ghost">View API Docs</a>
  </div>
</section>
```

### 2. Properties Page (`/en/properties`)

**Current:** Property listing cards
**Add:** API response preview panel

```tsx
// For each property card, add a toggle:
<button onClick={() => setShowApi(!showApi)}>
  {showApi ? "Card View" : "API Response"}
</button>

// When toggled, show the raw API response:
<pre className="api-preview">
  {JSON.stringify(project, null, 2)}
</pre>
```

This lets a CTO see: "This is what my frontend gets from the API."

### 3. Decision Terminal (`/en/chat`)

**Current:** Chat with AI
**Rebrand:** "Decision Terminal — Structured Query Engine"

```tsx
// Replace placeholder text:
placeholder="Try: 'Show me A-grade projects in Marina under 5M with >6% yield'"

// Add system instruction badge:
<div className="terminal-badge">
  Decision Engine · Deterministic SQL · Zero Hallucination · MCP Protocol
</div>

// After each response, show the tool calls:
<div className="tool-trace">
  [Decision Engine → Structured Query → {resultCount} results in {queryTime}ms]
</div>
```

### 4. Areas Page (`/en/areas`)

**Current:** Area profiles
**Add:** Data coverage metrics

```tsx
// Add header:
<h2>Data Coverage: 167 Areas</h2>
<p>Cross-referenced: PropertyFinder · Bayut · DLD · Entrestate Spine</p>

// For each area card, show source count:
<span className="source-badge">
  {area.sourceCount} sources · {area.confidence} confidence
</span>
```

### 5. Top Data Page (`/en/top-data`)

**Current:** Market intelligence sections
**Rebrand:** "Signal Engine V1 — Live"

```tsx
// Add header:
<div className="engine-badge">
  Signal Engine V1 · 4 Score Dimensions · Evidence-Backed · Formula Objects
</div>
```

### 6. NEW: `/en/enterprise` — The Pitch Page

Create a new page that serves as the sales pitch:

```tsx
// app/[locale]/enterprise/page.tsx

export default function EnterprisePage() {
  return (
    <main>
      <h1>Enterprise Integration</h1>
      
      <section id="modules">
        <h2>10 Infrastructure Modules</h2>
        {/* Truth Layer, Decision Engine, Onboarding Engine, Collision Engine,
            Transaction Engine, Contract Engine, Execution API, Evidence Layer,
            Recovery Engine, Trust Protocol */}
      </section>
      
      <section id="api">
        <h2>API Surface — 34 Endpoints</h2>
        <h3>Intelligence API (12 endpoints)</h3>
        {/* /api/intel/* endpoints */}
        <h3>Leasing API (15 endpoints)</h3>
        {/* /api/tx/* endpoints */}
        <h3>MCP Bridge (7 tools)</h3>
        {/* MCP tool descriptions */}
      </section>
      
      <section id="roi">
        <h2>ROI Calculator</h2>
        {/* Interactive: input your moderator headcount, get savings estimate */}
      </section>
      
      <section id="demo">
        <h2>Live Demo</h2>
        <p>Everything you see on this site runs on the Entrestate API.</p>
        <p>The same API layer can sit invisibly under your portal.</p>
        <a href="/en/properties">See the Data →</a>
        <a href="/en/chat">Try the Decision Terminal →</a>
      </section>
      
      <section id="contact">
        <h2>Enterprise Sales</h2>
        <p>Contact: enterprise@entrestate.com</p>
      </section>
    </main>
  );
}
```

---

## The "Not a Competitor" Checklist

Before any Dubizzle/Bayut meeting, ensure:

| Check | Status |
|---|---|
| No "list your property" CTA anywhere | ☐ |
| No tenant signup/login flow | ☐ |
| No "contact agent" buttons | ☐ |
| No lead capture forms on property pages | ☐ |
| No "download app" prompts | ☐ |
| Enterprise sales CTA on every page | ☐ |
| API response preview on property cards | ☐ |
| "Powered by Entrestate API" footer badge | ☐ |
| /enterprise page with integration guide | ☐ |
| Decision Terminal branded as "Query Engine" | ☐ |

### The One-Liner for the Meeting

> "This site is our demo environment. Everything you see here — the data, the search, the scores, the intelligence — runs on an API that sits invisibly under your existing portal. You don't change your frontend. You plug in our backend."

---

## Environment Variables Needed

```env
# Already configured
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...

# Add for leasing demo
DATABASE_URL=postgresql://...@neon.tech/neondb
```

---

## Deploy Checklist

1. ☐ Update homepage hero copy (enterprise language)
2. ☐ Add API response toggle to property cards
3. ☐ Rebrand /chat as "Decision Terminal"
4. ☐ Add source badges to area cards
5. ☐ Add "Signal Engine V1" badge to /top-data
6. ☐ Create /enterprise page
7. ☐ Remove all consumer CTAs
8. ☐ Add "Powered by Entrestate API" footer
9. ☐ Wire leasing endpoints (/api/tx/*)
10. ☐ Add integration guide to /enterprise

---

## What This Achieves

A Dubizzle CTO visits entrestate.com and sees:
1. **Real data** — their own market, their own buildings, real prices
2. **Working search** — structured queries returning project intelligence
3. **Decision Terminal** — AI reasoning over real database
4. **API preview** — exactly what their frontend would receive
5. **No competition** — no consumer features, no lead capture, no app

They think: **"I want this running under my site."**

That's the close.
