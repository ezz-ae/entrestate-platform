# Environment Variables

This repo uses a mix of runtime env vars (for the app), CI/CD secrets (GitHub Actions), and Hex export env vars (for `Entrestate.yaml`).

## Local runtime (.env.local)
Use `.env.example` as a template and set real values in `.env.local` (do not commit `.env.local`).

Required in most dev setups:
- `DATABASE_URL` (Postgres / Neon connection string)

If you are using the Hex export or scripts that reference Neon by name:
- `NEON_DATABASE_URL` (same as `DATABASE_URL` or a non-pooled Neon URL)
- `NEON_HOST` (host only, used for redacted display in docs)

Optional:
- `PRISMA_ACCELERATE_URL` (if using Prisma Accelerate)
- `OPENAI_API_KEY`, `GEMINI_API_KEY` (LLM features)
- `SANITY_TOKEN`, `DRIVEN_APP_TOKEN`, `TWILIO_AUTH_TOKEN` (data sources)
- `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` (auth helpers)

## GitHub Actions secrets/vars
Workflows reference these:
- `NEON_PROJECT_ID` (vars)
- `NEON_API_KEY` (secrets)
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_TEAM_ID`, `VERCEL_PROTECTION_BYPASS` (secrets)

## Hex export (Entrestate.yaml)
The exported Hex project now uses env vars instead of hardcoded secrets:
- `NEON_DATABASE_URL`
- `PRISMA_ACCELERATE_URL`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `SANITY_TOKEN`
- `DRIVEN_APP_TOKEN`
- `TWILIO_AUTH_TOKEN`

If you do not use a service, leave the env var unset.
