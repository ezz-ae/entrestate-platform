# Commercial vision

**This document is the argument, not the record.** It states what Entrestate
is for, who it is sold to, and where it is going. Nothing here should be read
as a description of shipped code.

For what the code actually holds today, with a status against every claim:
[`README.md`](README.md) and [`docs/spec/README.md`](docs/spec/README.md).
Those two are the ground truth and they win any disagreement with this page.

---

## The problem

A brokerage's revenue passes through a chain — stock, page, campaign, lead,
call, viewing, deal — and each link runs in a different tool. Marketing lives
in an ad manager, leads land in a CRM, follow-ups happen in a phone, money is
reconciled in a spreadsheet. The tools do not share a database, so the chain
loses its own memory: a deal closes and nothing upstream learns from it. The
ad account keeps spending on the audience that produced nothing, because
nothing told it otherwise.

The cost is not only the wasted spend. It is that every number a manager acts
on has been through a human's estimate, and no one can trace it back.

## The thesis

**Activity produces data; data should produce intelligence; intelligence
should execute decisions that learn from their own outcomes.**

One database and one AI layer under the whole chain, so that closing a deal is
an event the marketing engine can read — not a row someone re-types into a
spreadsheet next month.

Three consequences are what we actually sell:

1. **Lead quality becomes a control signal rather than an opinion.** A rating
   is not a report; it routes, escalates, redistributes and retrains.
2. **Autonomous spend is governed rather than trusted.** The machine proposes;
   deterministic rules cap and pause; a human approval is recorded before
   money moves.
3. **A published number is defensible.** The bound facing its threshold, or a
   stated *Withheld* — never a point estimate a sample of four produced.

## Who it is for

- **Brokerages** who want the whole chain in one system rather than five.
- **Independent brokers and small agencies** priced out of per-seat software,
  who should pay for outcomes rather than for chairs.
- **Brokers who do not want to run advertising at all** — served by the
  lead marketplace, where leads are bought one at a time.

## How it is paid for

There is no seat licence. Market discovery comes with the account. Each app in
the store states its own economics: some come with the account, some run on
coin, some subscribe — the mode is a required field on every catalog entry
(`BillingMode` in `lib/freehold/app-store.ts`), so the store cannot describe an
app without saying how it is paid for.

Revenue scales with what the client actually deploys — campaigns run, pages
compiled, leads bought — which aligns our income with their transaction
velocity instead of with their headcount.

## Where it is going

Stated as intent, not as shipped code. The status of each of these in the
current codebase is in [`README.md`](README.md); several are **SPEC-ONLY**
today and are marked so there.

- **Commission-yield bid arbitrage (AIMAS).** A max-CPC ceiling derived from
  the expected commission of the matched asset, so search bidding cannot
  outrun the margin it is buying.
- **Deeper audience learning.** Per-audience win queries feeding routing, not
  just top-closer ordering.
- **One design system across both products**, so the Terminal and the
  workspace stop looking like two companies.

## A note on how we talk about this

Two rules govern every selling surface, and they exist because breaking them
costs trust that is expensive to rebuild:

- **No fake data.** A surface shows real data or an honest empty state. Never
  an invented number, a placeholder price, or a "connected" badge that is not.
- **The pricing word ban.** Selling surfaces do not use the word that promises
  something costs nothing; each app states its actual economics instead.
