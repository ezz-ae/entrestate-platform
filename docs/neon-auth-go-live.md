# Neon Auth + LLM Go-Live Runbook

Updated: 2026-03-07

This runbook is the production checklist to finalize authentication, database readiness, and LLM availability for the full Entrestate platform.

## 1) Required environment variables

Set these in your deployment environment (and in local `.env.local` for development).

### Core database

- `DATABASE_URL` — pooled Neon connection string.
- `DATABASE_URL_UNPOOLED` — direct/unpooled Neon connection string (used by Prisma migrations and direct access).

### Neon Auth

- `NEON_AUTH_BASE_URL` — Neon Auth endpoint base URL.
- `NEON_AUTH_COOKIE_SECRET` — **minimum 32 characters**.
- `NEON_AUTH_ADMIN_EMAILS` (optional) — comma-separated admin emails.
- `NEXT_PUBLIC_ADMIN_MODE` — keep `false` in production.

### LLM providers (at least one)

- `GEMINI_KEY` (or `GOOGLE_GENERATIVE_AI_API_KEY`)
- `AI_GATEWAY_API_KEY`
- `OPENAI_API_KEY`

## 2) Generate secure cookie secret

```bash
openssl rand -base64 48
```

Use the output as `NEON_AUTH_COOKIE_SECRET`.

## 3) Install and database migration

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma migrate status
```

## 4) Schema sanity checks (chat/auth critical tables)

Run this against the deployed DB (or locally after migrations):

```bash
pnpm prisma db execute --stdin <<'SQL'
SELECT to_regclass('public.chat_sessions')  AS chat_sessions;
SELECT to_regclass('public.chat_messages')  AS chat_messages;
SELECT to_regclass('public.user_profiles')  AS user_profiles;
SQL
```

All results must be non-null table names.

## 5) Start app and verify platform health

```bash
pnpm dev
```

If you see a lock error (`.next/dev/lock`), terminate the previous `next dev` process and restart.

## 6) Verify Neon DB + Auth endpoints

```bash
curl -sS http://localhost:3000/api/health/db
curl -sS -i http://localhost:3000/api/auth/get-session
curl -sS -i http://localhost:3000/api/account/profile
curl -sS -i http://localhost:3000/api/account/entitlement
```

Expected:

- `/api/health/db` returns `{"ok":true,...}`.
- `/api/auth/get-session` does **not** return `501`.
- `/api/account/profile` returns `401` when unauthenticated (not `500`).
- `/api/account/entitlement` returns `200`.

## 7) Verify LLM and chat pipelines

### JSON chat path

```bash
curl -sS -H 'Content-Type: application/json' \
  -H 'x-entrestate-account-key: smoke-runbook' \
  -X POST http://localhost:3000/api/chat \
  -d '{"message":"Show me top areas by yield in Dubai"}'
```

Expected:

- HTTP `200`
- JSON includes `content`, `evidence.sources_used`, and `requestId`.

### Streaming copilot path

```bash
curl -sS -N -H 'Content-Type: application/json' \
  -H 'x-entrestate-account-key: smoke-runbook-copilot' \
  -X POST http://localhost:3000/api/copilot \
  -d '{"id":"smoke-runbook-copilot","messages":[{"id":"m1","role":"user","parts":[{"type":"text","text":"hello"}]}]}'
```

Expected stream includes chunks ending with `type:"finish"` and `[DONE]`.

## 8) Full platform smoke and build gate

```bash
pnpm lint
pnpm build
pnpm smoke --url http://localhost:3000
```

Must pass before release.

## 9) Production release gate (must all be true)

- Neon Auth configured (`/api/auth/get-session` healthy, no `501`).
- DB health endpoint green.
- Chat + Copilot both return valid responses.
- `pnpm smoke` full pass.
- Investor/docs/report surfaces render without 500s.

## 10) Fast rollback levers

- Remove/rotate broken LLM key to force deterministic fallback on `/api/chat`.
- Keep core app online while fixing auth by preserving read-only docs/report routes.
- If DB migrations fail, restore previous deployment and re-run `prisma migrate deploy` on a clean branch.

