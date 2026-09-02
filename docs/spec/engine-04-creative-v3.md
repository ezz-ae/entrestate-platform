# Engine 04 — Creative Intelligence Engine Technical Specification
**Version:** 1.1.0  
**Document type:** DESIGN SPECIFICATION — graded against the code in §8.  
**Parent System:** Entrestate (Dubai, United Arab Emirates)  
**Root paths:** `lib/freehold/` (landing engine, telemetry, gif encoding) in
`ezz-ae/entrestate-platform`; `app/api/time-table/artifacts` in
`ezz-ae/Entrestate_os`.

> The creative workspace routes `/storyboard`, `/image-playground` and
> `/timeline` were **retired from the claim set on 2026-08-31** by the owner's
> ruling — the Terminal connects to the workspace automation studio and the
> time-table rather than duplicating creative surfaces. They are no longer part
> of this specification. Section 8 grades every remaining claim.

---

## 1. Purpose & Structural Thesis
Traditional real estate organizations treat marketing creative as an isolated design function where agencies or internal designers manually build assets based on static briefs [2, 82]. This disconnected approach detaches creative outputs from real-time inventory realities and target audience parameters [2, 3].

**Engine 04 (Creative Intelligence)** redefines creative as a **programmatic execution layer for intelligence** [10]. It sits directly between **Inventory Intelligence (Engine 02)**, **Audience Intelligence (Engine 03)**, and the **Acquisition Engine (Engine 05)** [10]. 

```
[Engine 02: Inventory Intelligence] 
              ↓ (Clean, Scored Listings)
[Engine 03: Audience Intelligence]  →  [ENGINE 04: Creative Intelligence]  →  [Engine 05: Acquisition]
              ↑ (Dynamic Target Vectors)               ↓
                                       [Dynamic Landing Pages & Ad Sets] [10]
```

By programmatically translating raw, structured inventory metrics and buyer profiles into tailored ad sets, reels, presentation decks, and web assets, the engine ensures that what is advertised is strictly synchronized with what is fit to sell [9, 10, 34].

---

## 2. Integrated Inputs Matrix
The Creative Intelligence Engine does not allow manually injected "creative guesses" that bypass database standards [35, 72]. Every generated asset is compiled directly from upstream data models [9, 10]:

| Input Source | Parameter Name | Schema / Data Type | Role in Creative Generation |
| :--- | :--- | :--- | :--- |
| **Engine 01 (Market)** [4] | `area_profile_id` | `UUID` / `ForeignKey` | Injects localized transaction evidence (e.g., historical yields, area growth) into brochures and landing pages [6, 7]. |
| **Engine 02 (Inventory)** [4] | `project_score` | `DECIMAL(3, 2)` | Controls the branding level and prominence of status tags (e.g., highly-scored assets get priority treatment) [7]. |
| **Engine 02 (Inventory)** [4] | `price_double` | `DOUBLE PRECISION` [62] | The non-negotiable price displayed on all landing assets. Must never read "AED TBD" or be fabricated [66, 72]. |
| **Engine 03 (Audience)** [4] | `target_vector` | `JSONB` | Injects semantic buyer preferences (e.g., "yield-optimizer" vs. "capital-preservation") to guide tone-of-voice selection [8, 54]. |
| **Commercial Layer** [5] | `campaign_objective` | `VARCHAR(50)` | Defines the asset layout orientation (e.g., lead generation vs. brand awareness vs. direct booking) [9, 10]. |
| **Global System Config** [18] | `brand_constraints` | `JSONB` | Strict canvas constraints including color schemes, typography guides, and white-label agency configurations [9, 68]. |

---

## 3. Programmatic Processing Logic

```
   [Upstream Data Ingest]
             │
             ▼
┌──────────────────────────┐
│  Listing Fitness Gate    │ ──(Fails)──> [Block Launch & Log Override] [35]
└──────────────────────────┘
             │ (Passes)
             ▼
┌──────────────────────────┐
│   Trilingual Layout      │ ──(Arabic)──> [Horizontal Axis Flip (RTL)] [36, 47]
│   & Canvas Builder       │
└──────────────────────────┘
             │
             ▼
┌──────────────────────────┐
│    Multimodal Model      │ ──(Gemini)──> [Generate Copy, Enhanced Prompts, Reels] [57, 58, 66]
└──────────────────────────┘
```

The compilation of raw inventory and audience profiles into ready-to-deploy visual assets follows a strict programmatic sequence:

### A. Listing Fitness Verification (The Creative Gate)
Before any campaign asset can be generated, the engine executes a non-negotiable **Listing Fitness Check** [35, 46]. The script inspects the target database record:
1. **Empty Field Scan**: If vital fields—specifically location, unit specifications, or developer credentials—are missing, the listing is flagged as weak [35].
2. **"Honest Data" Price Check**: If the price is empty, Null, or set to a placeholder, the system blocks the asset pipeline entirely to prevent publishing "AED TBD" or broken pricing signals [66, 72].
3. **Execution Block**: Any attempt to override this gate and advertise a weak page throws a validation exception and pauses the acquisition run [35, 46].

### B. Trilingual Canvas Compilation & Layout Flipping
The platform enforces programmatic layout rules across its primary languages: English, العربية (Arabic), and Русский (Russian) [36, 47].
1. **Dynamic Dictionary Substitution**: Labels and pricing parameters are mapped using keys from `lib/i18n/dictionaries/*` [70, 71].
2. **Arabic Layout Flip (RTL)**: When the selected locale is `AR` (Arabic), the browser rendering and graphic canvas APIs automatically mirror their horizontal axes (`X`-axis values are flipped) [36, 47].
3. **Typography Scaling**: Font size adjustments are applied programmatically depending on the linguistic character density to prevent text overlap [36, 47].

### C. Creative Generation & Multimodal Prompt Engineering
The system utilizes server-side model overrides from `.env.local` to orchestrate asset design [57, 58]:
1. **Text Copywriting (`MEDIA_TEXT_MODEL` / Gemini 2.5 Flash)** [57]: Accepts the target audience vector and inventory scoring context to generate trilingual ad copy, headlines, and call-to-actions [36, 57].
2. **Visual Assessment (`MEDIA_VISION_MODEL` / Gemini 3 Pro Image)** [57]: Used to inspect uploaded property photography, perform aesthetic quality grading, and extract high-yield semantic prompts for the dynamic image engine [57, 59].
3. **Animated Reel Synthesis**: To maintain standard social network engagement, static property renderings are merged with programmatic transaction graphics to compile animated `.gif` loop reels [66].

---

### D. Micro-Behavioral Telemetry Tracking (The "Activity" Radar)
To eliminate blind spots in conversion psychology, Engine 04's landing pages run low-overhead, client-side scripts that capture mouse movement coordinates, active hover durations, and scroll velocities over specific content blocks:
1. **Interactive Hover Analysis**: Programmatic event listeners measure the exact seconds a user hovers over the Comparable pricing matrices, floor plans, or ROI calculators. Long hovers indicate active comparison behavior [12].
2. **Scroll-Depth Velocity**: The script logs if a user scrolls rapidly past images but spends several minutes on the DLD transaction history sections, registering a high-intent "buyer looking for evidence" profile [12, 54].
3. **Behavioral Telemetry Payload**: This micro-engagement data is batched and securely transmitted back to the server as a lightweight JSON payload to feed Engine 06's rating calculations [12].

### E. Implicit Choice-Architecture Lead Forms
The landing pages employ choice-engineered web forms designed to extract profile indicators *without asking a single direct demographic or personal question*:
1. **Implicit Profiling**: Instead of asking blunt, conversion-killing questions like "Are you a premium high-net-worth investor?", the form presents choice matrices such as "Preferred Capital Target" ("Maximize immediate rental yield" vs. "5-year resale optimization").
2. **Dynamic Risk-Mapping**: Each chosen parameter maps directly to user risk/return categories (Conservative vs. Balanced vs. Growth) under the hood [54].
3. **Zero-Friction Submission**: The lead's investment profile is pre-categorized in the database before they even complete contact registration, eliminating manual input friction while generating pre-structured CRM lead cards [12, 14].

### F. Two-Way Programmatic Behavior Analysis & Dedicated Idle State Table
To resolve the noise inherent in real-world web browsing (such as users leaving tabs open while walking away or accidental mouse shakes), Engine 04 deploys a **Two-Way Programmatic Behavior Analysis** framework:
1. **The Parallel Logging Paths**: 
   * **Active Session Table (`active_telemetry`)**: Records highly focused, non-idle frontend micro-interactions (mouse coordinates, active scroll velocity, precise section hovers).
   * **Dedicated Idle State Table (`idle_telemetry`)**: Runs completely raw, unfiltered logging of "idle" states. Rather than relying on rigid frontend filters that risk throwing away valuable user context, the system logs every instance of tab backgrounding, browser blurring, tab focusing, and periods of prolonged mouse stillness (>60 seconds) into this separate table.
2. **Idlation as a Active Capture Signal**: The transition into an idle state, and more importantly, the *refocusing* event after an idle period, is treated as a highly measured behavioral trigger. 
3. **Repeated Behavior Profiling**: If a user leaves a tab open, goes idle, and returns multiple times over a 24-hour window, this repeated refocusing behavior is computed as a powerful indicator of recurring buyer interest, instantly differentiating them from accidental clickers and triggering downstream rate escalations.

## 4. Downstream Outputs
Engine 04 compiles and publishes structured, multi-tenant compatible files to permanent storage [10, 67]:
*   **Dynamic Landing Pages**: Light-weight, fast-loading, single-property pages deployed under the client's own domain address [27, 33].
*   **Programmatic Ad Sets**: Complete campaign metadata payloads ready to be pushed to Meta Graph and Google Ads API endpoints [10, 69].
*   **Social Assets & Reels**: Ready-to-deploy vertical videos and looping animated `.gif` files formatted for Instagram and Facebook [10, 66].
*   **Structured Decision Objects**: Fully compiled presentation decks (`.pptx` files) and formatted PDF memos for offline investor briefings [54, 55, 60].
*   **Web Widgets**: Dynamic, database-driven iframe elements displaying real-time market averages, yields, and area trends [54, 55, 60].

---

## 5. System-Wide Dependencies
*   **Upstream Dependencies**:
    *   **Engine 02 (Project & Inventory)**: Must supply a valid, scored listing object before any canvas creation is initialized [9, 34].
    *   **Engine 03 (Audience)**: Must provide the current audience characteristics profile to select appropriate ad themes and layouts [9, 10].
*   **Downstream Dependencies**:
    *   **Engine 05 (Acquisition)**: Consumes the ready-to-deploy ad sets and landing page links to start active ad campaigns [10].

---

## 6. Closed-Loop Feedback Flow ("Creative Retraining")
The performance of every generated creative is measured and returned to the system to optimize subsequent iterations [1, 26]:

```
[Acquisition Engine (Engine 05)] ──(CPL & CTR Metrics)──> [Learning Engine (Engine 09)]
                                                                   │
                                                        (Adjusts Weights) [102]
                                                                   ▼
[Creative Intelligence (Engine 04)] <────────────── [Update Dynamic Templates] [17]
```

1. **Outcome Ingest**: The system-wide **Learning Engine (Engine 09)** collects click-through-rates (CTR) and cost-per-lead (CPL) statistics for each creative format from active ad campaigns [11, 100].
2. **Attribution Weight Update**: Layouts, color palletes, and headline variations that successfully capture verified buyer profiles receive positive scoring weights [17, 102].
3. **Automated Deactivation**: Underperforming creative templates (e.g., formats with high CPL or low engagement) are programmatically ranked lower, and the Acquisition Engine shifts budget limits away from those specific visual components [28, 35].

---

## 7. Governance, AI Safeguards & Human Controls
To ensure absolute corporate safety and regulatory compliance across the UAE, the Creative Intelligence engine operates inside strict guardrails [18, 37]:

*   **"The AI Proposes; A Human Applies"** [72]:
    *   The engine is strictly forbidden from publishing any creative, launching a landing page, or pushing an ad set to live ad managers without manual confirmation [35, 72].
    *   All campaigns are launched in a **Paused** status by default, allowing supervisors to review the trilingual layout, pricing, and visual alignments [35, 46].
*   **Audit Logging**: Every single programmatic asset generation, manual translation change, and administrative override is logged with user and timestamp parameters to a secure system audit table [36].
*   **Privacy by Default**: Creative assets do not hardcode or expose any private owner, buyer, or commission details unless explicitly opened by an authorized manager role [35, 36].

---

## 8. Codebase Evidence & Verification Drawer

Graded with the same four-level legend the repository uses everywhere else —
**IMPLEMENTED** (working code, named file, held by a guard) · **PARTIAL** ·
**SPEC-ONLY** · **RETIRED** (removed from the claim set). The earlier version
of this table used four different words — BUILT, INTEGRATED, INTELLIGENT,
AUTOMATED — which graded nothing, because a reader could not rank them.

| Claimed feature | Verification path | Status |
| :--- | :--- | :--- |
| **Trilingual i18n & RTL** | `lib/i18n/dictionaries/*`, enforced by `pnpm i18n` in CI | **IMPLEMENTED** |
| **Behavioural telemetry — active/idle split** | `lib/freehold/behavioral-telemetry.ts`, `use-behavioral-telemetry.ts`, `/api/lp-telemetry`; guard `scripts/behavioral-telemetry-test.ts` | **IMPLEMENTED** |
| **Intent-driven landing layout** | `app/lp/[slug]/*` — section order follows the click's intent parameters | **IMPLEMENTED** |
| **Animated reels (GIF)** | `lib/freehold/gif-encode.ts` (gifenc, in-thread — chosen over gif.js because a separate worker script fights bundling and the CSP) and `lib/freehold/convert.ts` | **IMPLEMENTED** — the earlier table cited `types/`, which holds only the type declaration |
| **Programmatic asset generation endpoint** | `Entrestate_os`: `app/api/time-table/artifacts` | **IMPLEMENTED** |
| **Spend Governor integration** | `lib/meta/spend-authority.ts` — the AI proposes, deterministic rules cap and pause, a **recorded human approval** gates the write | **IMPLEMENTED** |
| **Continuous verification gauntlet** | `.github/workflows/ci.yml`: `pnpm typecheck · i18n · guards · build` | **IMPLEMENTED** |
| **Model environment configuration** | `MEDIA_TEXT_MODEL`, `MEDIA_VISION_MODEL` read server-side in `Entrestate_os` | **IMPLEMENTED** — variable names only; no values are published |
| **Listing fitness gate** | The landing/campaign readiness checks block a page with no parseable price | **PARTIAL** — the price and empty-field gates exist; a single named `ListingFitness` module does not |
| **Creative workspace UI** | `/storyboard`, `/image-playground`, `/timeline` | **RETIRED** 2026-08-31 — still served from the `app/(marketing)` route group pending removal, but no longer claimed |
