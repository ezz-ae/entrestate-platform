# The documentation map

Every document this repository keeps, what it is for, and which one to
trust when two seem to disagree. The rule that orders all of it, in the
owner's words: "المشروع مليان وكبير وضخم — التنظيم يا هيدفن حاجات مهمة يا
هينظم ويطلّع المهم يبان." **Living** references sit in this folder;
**completed / historical** plans, audits and handovers live in
[`archive/`](archive/), clearly marked, kept for context.

New here? Start with the root [`../CLAUDE.md`](../CLAUDE.md) — the
client/vendor separation, the gauntlet, commit style — then the map below.

## Where truth lives, in order

1. **The code and its guards** (`scripts/*-test.ts`; `tests/` on the
   Terminal). 120+ pure suites run on every merge; a rule that matters is
   written as a runnable assertion, with its why in the adjacent header.
2. **[`spec/README.md`](spec/README.md)** — the per-engine truth table:
   every claim the spec-set makes, with its verified status and the file
   that proves it. Updated when the code moves, never the other way round.
3. **[`award/README.md`](award/README.md)** — the award/investor kit
   verified claim by claim, with the exact wording fixes the kit still needs.
4. The living references below — each owning one question.

## The account and the two repositories

| Doc | The one question it answers |
| --- | --- |
| [`ACCOUNT-FOUNDATION.md`](ACCOUNT-FOUNDATION.md) | The account model: one identity (the Terminal's sign-in) → one business account → one wallet → app economics → re-pointed surfaces. All five phases delivered, each with its evidence. |
| [`spec/`](spec/README.md) | The owner's 12-engine specification set, and the truth table over it. |
| [`award/`](award/README.md) | The Dubai-it submission kit, versioned, with its verification page. |
| [`adr/0001-two-repositories.md`](adr/0001-two-repositories.md) | Why the Terminal and the platform are two repositories, what merging them would take without losing a commit, and the standing recommendation. |

`Entrestate_os` is the **Terminal** — terminal.entrestate.com, the public
market-discovery product every account starts with. `entrestate-platform`
is the **business** — entrestate.com, the workspace product (CRM, ads
machines, landing engine, wallet) sold through the App Store, serving the
vendor's hosts and every `{customer}.entrestate.com` tenant. One account
spans both (the shared `.entrestate.com` session), and they speak through
served APIs — the catalog (`/api/store/catalog`), the account summary
(`/api/account/summary`), the Terminal session verifier — never through
copied code.

## Living reference

| Doc | What it covers |
| --- | --- |
| [`ADS-RULES.md`](ADS-RULES.md) | How a lead finds its campaign, when a number is withheld, what the machine may change unattended, and the permit gate. Every rule names the guard suite that enforces it. |
| [`../DEPLOYMENT.md`](../DEPLOYMENT.md) | Private white-label deployment playbook — one isolated deployment per client (Vercel + Neon + domain + credentials), no multi-tenancy. (Kept at repo root; code references it.) |
| [`WHITE-LABEL.md`](WHITE-LABEL.md) | Operator runbook for the **branded demo mode** — extract → deploy (`NEXT_PUBLIC_WHITE_LABEL=1`) → `pnpm seed:demo` → mint keys (`/wl-admin`) → prospect activates at `/activate`. |
| [`INTEGRATIONS-SETUP.md`](INTEGRATIONS-SETUP.md) | Connecting the external services: Meta Ads, Google Ads, AI/Vertex, tracking, database. |
| [`OPERATIONS-RUNBOOK.md`](OPERATIONS-RUNBOOK.md) | Day-to-day operational procedures and incident handling. |
| [`CAMPAIGN-LAUNCH-RUNBOOK.md`](CAMPAIGN-LAUNCH-RUNBOOK.md) | Step-by-step for taking a project from inventory to a live ad campaign. |
| [`USER-GUIDE.md`](USER-GUIDE.md) | End-user guide to the private app (workspaces, CRM, Lead Machine, Expert). |
| [`AI_AGENTS.md`](AI_AGENTS.md) | The AI agents (the Expert, ads/coordinator tools) and how they're scoped. |
| [`ACCESS-MATRIX.md`](ACCESS-MATRIX.md) | Role → capability matrix (who can see/do what). |
| [`route-auth-matrix.md`](route-auth-matrix.md) | Route-level auth: which paths are public vs. gated, and by which role. |
| [`coach-marks.md`](coach-marks.md) | The in-app coach-mark / guided-tour system. |

## Archive

[`archive/`](archive/) holds finished work — finalization checklists, the
beta master plan, dated system audits, session handovers, and the original
implementation blueprints. Read its [`README.md`](archive/README.md) for
the index. These are **not** the current source of truth; the code and the
living docs above are.
