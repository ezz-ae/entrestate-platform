# ADR 0001 — One product, two repositories (and when that should change)

**Status**: Recommended · awaiting the owner's word before anything moves
**Date**: 2026-09-01
**Question, as the owner asked it**: "هل هندمج في ريبو واحدة بدون ما نضيع
الكوميتس ولا هنعمل إيه؟"

## The short answer

Keep the two repositories, for three reasons that are about money and
clients rather than taste — and if a merge is ever wanted, the recipe below
does it **without losing a single commit**. Nothing in this decision is
irreversible; the recipe stays valid whenever it is invoked.

## What the two repositories actually are

| | `Entrestate_os` | `entrestate-platform` |
|---|---|---|
| Product | The Terminal — public market discovery, the account's front door | The business — workspace, CRM, ads machines, wallet, App Store |
| Host | terminal.entrestate.com | entrestate.com + `*.entrestate.com` tenants |
| Vercel project | `entrestate-os` | `entrestate` |
| History | 96 commits | 108 commits (began at the client/vendor separation) |
| Special relationship | — | **The client's live deployment (`ezz-ae/ORE`, freeholdproperty.ae) takes changes from this repo as upstream merges, on the client's own schedule.** |

They already behave as one product where it matters: one account (the
shared `.entrestate.com` session, `docs/ACCOUNT-FOUNDATION.md`), one
catalog served from one file, one summary API the Terminal renders. That
was the deliberate alternative to a code merge: **served APIs instead of
shared source**, so nothing is vendored and nothing drifts.

## Why not merge now — the three real costs

1. **The client's upstream path breaks.** `ezz-ae/ORE` merges from
   `entrestate-platform` because the trees still correspond
   file-for-file. A monorepo move (everything under `apps/platform/…`)
   rewrites every path; from that day the client's `git merge upstream`
   becomes a wall of rename conflicts, forever. The one repository with an
   external consumer of its *shape* is the one that must not change shape
   while that consumer is live.
2. **Deploy blast radius.** Today a Terminal merge cannot break the
   workspace product that serves paying tenants, and vice versa: separate
   builds, separate gauntlets (the platform's 120+ guard suites vs the
   Terminal's vitest + guardian), separate rollbacks. A monorepo makes
   every merge a two-product event unless CI is rebuilt with path filters —
   work that buys nothing the served APIs don't already give.
3. **The gauntlets disagree on purpose.** pnpm versions, build modes
   (`--webpack` on the OS), i18n systems (next-intl vs the platform's
   dictionaries) and test runners differ. Unifying them is real work with
   real risk, and it is not on the path to clients.

## The no-commit-lost recipe, for the day it is wanted

Both histories survive verbatim; `git log --follow` works across the move;
every SHA remains reachable.

```bash
# In a fresh clone of entrestate-platform (the surviving repo):
git checkout -b monorepo
mkdir -p apps/platform && git mv $(ls -A | grep -v -E '^(\.git|apps)$') apps/platform/
git commit -m "platform moves under apps/platform (tree move, one commit)"

git remote add os https://github.com/ezz-ae/Entrestate_os.git
git fetch os
git merge os/main --allow-unrelated-histories -m "the Terminal joins as apps/terminal"
mkdir -p apps/terminal && git mv $(ls -A | grep -v -E '^(\.git|apps)$') apps/terminal/
git commit -m "terminal tree moves under apps/terminal"
```

Then: two Vercel projects keep existing, each pointed at its `apps/*` Root
Directory; CI gains path filters; and — the expensive part — the client is
told their upstream is frozen at the pre-merge SHA unless they adopt the
same layout. That last sentence is why this waits.

## When the answer flips

Merge becomes right when (a) the client relationship no longer consumes
this repo's shape (contract ends, or they pin permanently), **and** (b) a
real need appears that served APIs cannot meet — shared components edited
in one place, one design system enforced by one build, atomic cross-product
changes. Both conditions, not either. Until then: two repositories, one
account, served APIs — and this file is the standing answer.
