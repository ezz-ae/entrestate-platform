# Final Production Checklist

Use this checklist before announcing production launch.

## 1) Environment variables

- [ ] `DATABASE_URL` set (production)
- [ ] `DATABASE_URL_UNPOOLED` set (production)
- [ ] `NEON_AUTH_BASE_URL` set (production)
- [ ] `NEON_AUTH_COOKIE_SECRET` set (production, 32+ chars)
- [ ] At least one LLM provider key set in production (`GEMINI_KEY` or `AI_GATEWAY_API_KEY` or `OPENAI_API_KEY`)
- [ ] `RESEND_API_KEY` set where email flows are expected

## 2) Database migration

- [ ] `pnpm prisma generate`
- [ ] `pnpm prisma migrate deploy`
- [ ] `pnpm prisma migrate status` reports healthy state

## 3) Core endpoint health checks

- [ ] `GET /api/health/db` returns `ok: true`
- [ ] `GET /api/auth/get-session` is healthy (no `501`)
- [ ] `POST /api/chat` returns `200` + evidence payload
- [ ] `POST /api/copilot` returns stream response successfully

## 4) Route checks (no 500s)

- [ ] `/`
- [ ] `/chat`
- [ ] `/docs`
- [ ] `/docs/documentation`
- [ ] `/docs/articles`
- [ ] `/reports/library`
- [ ] `/partners`
- [ ] `/apis`
- [ ] `/industry`
- [ ] `/careers`
- [ ] `/intern`
- [ ] `/investors-relations`

## 5) Validation commands

- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] `pnpm smoke --url <deployment-url>`

## 6) Data readiness gate

- [ ] P0 data package actively tracked and owned (`docs/MISSING_DATA_ORDER.md`)
- [ ] Source-of-truth registry references all published KPIs
- [ ] Investor metrics include evidence links for latest period

## 7) Launch comms package

- [ ] Release notes finalized (`docs/launch/v1.0.0-release-notes.md`)
- [ ] Investor update finalized (`docs/launch/investor-update.md`)
- [ ] Partner one-pager finalized (`docs/launch/partner-one-pager.md`)

## 8) Sign-off

- [ ] Engineering sign-off
- [ ] Product sign-off
- [ ] Data sign-off
- [ ] Founder final approval

When all sections are complete, launch is green.
