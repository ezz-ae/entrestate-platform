# Automation Builder Isolation Plan

## Goal
Keep the Automation Builder in the repo for now, but prevent production exposure until it is
ready for real tenants, persistent storage, and audited identity.

## Current safeguards
- Production kill-switch via `middleware.ts`
- Enabled only when `NEXT_PUBLIC_ENABLE_AUTOMATION_BUILDER=true`

## Short-term (now)
1. Keep `NEXT_PUBLIC_ENABLE_AUTOMATION_BUILDER=false` in production.
2. Use preview deployments to validate UI changes.
3. Treat header-based identity as non-production only.

## Mid-term (split)
Option A: Separate Vercel project
- Copy `automation-builder/` and `app/apps/automation-builder/` into a dedicated repo.
- Replace in-memory stores with Postgres tables.
- Enforce auth via Neon Auth session, not headers.

Option B: Monorepo package
- Convert to `packages/automation-builder` using pnpm workspaces.
- Add a feature-flag guard in the main app to load it only when enabled.

## Long-term (production hardening)
- Real auth: Neon Auth session + role-based access.
- Persistent storage for agents, runs, and audit logs.
- Rate limits and quotas per tenant.
- Separate runtime/worker for execution.
