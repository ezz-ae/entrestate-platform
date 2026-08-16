# Smoke Finalization Guide

This guide locks in automated smoke testing while keeping production SSO intact and the CI/CD pipeline clean. Use previews as your primary validation stage, only resorting to production bypass tokens when promotion flows are infeasible.

## Quick Commands
- Post-deploy endpoint smoke (developers, areas, market-score inventory, DB health):
  - `pnpm run smoke:postdeploy -- --url https://your-deployment.vercel.app`
- Enterprise write-path validation (seed + verify + cleanup):
  - `pnpm run smoke:enterprise`
- Run both in sequence:
  - `pnpm run smoke:full -- --url https://your-deployment.vercel.app`

Optional environment variables:
- `VERCEL_BYPASS_TOKEN` and `SMOKE_BYPASS_HEADER` for protected deployments.
- `SMOKE_MIN_DEVELOPERS`, `SMOKE_MIN_AREAS`, `SMOKE_MIN_INVENTORY_TOTAL` for threshold tuning.

## Options Matrix
### Option 1: Dedicated staging environment without SSO
- **Pros:** Stable CI target and full isolation from production changes.
- **Cons:** Requires another project to maintain and introduces drift risk.
- **Security:** Production remains untouched; staging needs access controls.
- **Setup:** Medium.
- **Ops:** Medium.

### Option 2: Vercel Protection Bypass token for automation on production
- **Pros:** Tests run against real production builds with minimal infra changes.
- **Cons:** The bypass token is sensitive and the feature may depend on your Vercel plan.
- **Security:** Production keeps SSO, but CI holds a scoped bypass credential.
- **Setup:** Low.
- **Ops:** Low-to-medium (rotation required).

### Option 3: Preview deployments + checks + promote to production
- **Pros:** Validates the exact build before it reaches production with no permanent bypass configuration.
- **Cons:** Requires a promote step (either via `vercel promote` or a production branch flow) and ensuring previews are accessible for automation.
- **Security:** Production remains unchanged; previews can be public or protected as needed.
- **Setup:** Medium.
- **Ops:** Low.

### Option 4: Run smoke tests inside an SSO session or browser automation
- **Pros:** No deployment or Vercel config changes.
- **Cons:** Brittle automation, slower execution, and risky cookie/token handling.
- **Security:** Storing SSO tokens in CI is a high-risk surface.
- **Setup:** High.
- **Ops:** High.

## Recommended Path
- **Primary:** Option 3 (Preview + checks + promote). Keeps production SSO live, exercises the exact build before promotion, and keeps CI tidy for a small team.
- **Fallback:** Option 2 (Protection Bypass) when implementing a promotion flow is infeasible or if you absolutely must exercise production directly. Keep the bypass token scoped to Preview where possible, store it only in CI secrets, and rotate it regularly.

## Vercel Setup Steps (Primary Path)
1. **Environment separation:** In Vercel → Settings → Git, set the production branch to `release` (or another production alias) so pushes to `main` spawn Preview deployments. If adjusting the branch is impossible, target an unused branch for production and rely on `vercel promote`.
2. **Deployment protection:** Under Settings → Deployment Protection, enable Vercel Authentication (SSO) for Production. Leave Preview unprotected (public) or password-protected as needed. If these options are missing, verify your plan tier under Settings → Deployment Protection.
3. **Optional stable staging URL:** Add `staging.example.com` (or similar) in Settings → Domains and point it at Preview deployments so automation hits a predictable base URL.
4. **Optional Preview bypass token:** Create a Protection Bypass token scoped to Preview (if supported). Never store it as a runtime Vercel env var; keep it solely in CI secrets.
5. **Secrets placement:**
   - Vercel env vars (`NEON_DATABASE_URL`, `NEXT_PUBLIC_*`, etc.) should be scoped to Preview + Production.
   - GitHub Actions secrets must cover `VERCEL_TOKEN`, `VERCEL_ORG_ID`/`VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`, and `VERCEL_PROTECTION_BYPASS` (if Preview protection is enabled).
6. **Promotion step:** When smoke checks pass, promote the Preview deployment with `npx vercel promote <url> --token $VERCEL_TOKEN --scope $VERCEL_ORG_ID` or merge into the production branch if your flow uses `main` as prod.
7. **Verification:** Before wiring CI, manually hit the Preview URL (and add the bypass header when required) to confirm health checks succeed.

## GitHub Actions Pipeline Plan
### Deploy → Wait → Smoke (Preview)
```yaml
name: Deploy Preview and Smoke
on:
  push:
    branches: [main]

jobs:
  deploy_preview:
    runs-on: ubuntu-latest
    outputs:
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx vercel build --token ${{ secrets.VERCEL_TOKEN }}
      - id: deploy
        run: |
          url=$(npx vercel deploy --prebuilt \
            --token ${{ secrets.VERCEL_TOKEN }} \
            --scope ${{ secrets.VERCEL_ORG_ID }} \
            --confirm)
          echo "url=$url" >> "$GITHUB_OUTPUT"
      # Option B: resolve URL via API
      # - id: deploy
      #   run: |
      #     url=$(curl -s -H "Authorization: Bearer ${{ secrets.VERCEL_TOKEN }}" \
      #       "https://api.vercel.com/v13/deployments?projectId=${{ secrets.VERCEL_PROJECT_ID }}&meta-gitSha=${GITHUB_SHA}" \
      #       | jq -r '.deployments[0].url')
      #     echo "url=$url" >> "$GITHUB_OUTPUT"

  smoke:
    needs: deploy_preview
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Wait for deployment
        run: |
          base_url="https://${{ needs.deploy_preview.outputs.url }}"
          for i in $(seq 1 10); do
            code=$(curl -sS -o /dev/null -w "%{http_code}" "$base_url/api/markets?limit=1")
            if [ "$code" -ge 200 ] && [ "$code" -lt 500 ]; then exit 0; fi
            sleep 10
          done
          echo "Deployment not ready" >&2
          exit 1
      - name: Run smoke
        env:
          BASE_URL: https://${{ needs.deploy_preview.outputs.url }}
          BYPASS_HEADER: x-vercel-protection-bypass
          BYPASS_TOKEN: ${{ secrets.VERCEL_PROTECTION_BYPASS }}
        run: bash scripts/smoke.sh

  promote:
    needs: smoke
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Promote to production
        run: npx vercel promote "https://${{ needs.deploy_preview.outputs.url }}" \
          --token ${{ secrets.VERCEL_TOKEN }} \
          --scope ${{ secrets.VERCEL_ORG_ID }}
```

### Nightly DB Contract (existing behavior)
```yaml
name: Nightly DB Contract
on:
  schedule:
    - cron: "0 3 * * *"
  workflow_dispatch:

jobs:
  db_contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - env:
          NEON_DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
        run: npm test -- tests/db-contract.test.ts
```

### Manual Smoke Run
```yaml
name: Run Smoke
on:
  workflow_dispatch:
    inputs:
      base_url:
        description: "Base URL including https://"
        required: true

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - env:
          BASE_URL: ${{ inputs.base_url }}
          BYPASS_HEADER: x-vercel-protection-bypass
          BYPASS_TOKEN: ${{ secrets.VERCEL_PROTECTION_BYPASS }}
        run: bash scripts/smoke.sh
```

## Smoke Suite Hardening (`scripts/smoke.sh`)
```bash
#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-}"
BYPASS_HEADER="${BYPASS_HEADER:-x-vercel-protection-bypass}"
BYPASS_TOKEN="${BYPASS_TOKEN:-}"
REQUIRED_MARKET_FIELDS="${REQUIRED_MARKET_FIELDS:-id,name}"
ERROR_LEAK_PATTERN="${ERROR_LEAK_PATTERN:-prisma|sql|stack|postgres}"

if [ -z "$BASE_URL" ]; then
  echo "BASE_URL is required (include https://)" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"

TOTAL=0
PASS=0
FAIL=0

summary() {
  echo "Summary: base_url=$BASE_URL total=$TOTAL pass=$PASS fail=$FAIL"
}
trap summary EXIT

RESP_BODY_FILE=""
RESP_HEADERS_FILE=""
RESP_STATUS=""

cleanup_resp() {
  if [ -n "${RESP_BODY_FILE:-}" ]; then rm -f "$RESP_BODY_FILE"; fi
  if [ -n "${RESP_HEADERS_FILE:-}" ]; then rm -f "$RESP_HEADERS_FILE"; fi
}

request() {
  local url="$1"
  local method="${2:-GET}"
  local data="${3:-}"

  RESP_BODY_FILE=$(mktemp)
  RESP_HEADERS_FILE=$(mktemp)

  local args=(-sS -D "$RESP_HEADERS_FILE" -o "$RESP_BODY_FILE" -w "%{http_code}" -H "Accept: application/json")
  if [ -n "$BYPASS_TOKEN" ]; then
    args+=(-H "$BYPASS_HEADER: $BYPASS_TOKEN")
  fi
  if [ -n "$data" ]; then
    args+=(-H "Content-Type: application/json" --data "$data")
  fi

  RESP_STATUS=$(curl "${args[@]}" -X "$method" "$url")
}

request_id() {
  local id=""
  id=$(jq -r '.requestId // empty' "$RESP_BODY_FILE" 2>/dev/null || true)
  if [ -z "$id" ]; then
    id=$(awk 'BEGIN{IGNORECASE=1} $1=="x-request-id:"{print $2}' "$RESP_HEADERS_FILE" | tr -d '\r' | head -n1)
  fi
  echo "$id"
}

fail() {
  local msg="$1"
  FAIL=$((FAIL + 1))
  local id
  id=$(request_id)
  if [ -n "$id" ]; then
    echo "requestId=$id" >&2
  fi
  echo "FAIL: $msg" >&2
  if [ -f "$RESP_BODY_FILE" ]; then
    cat "$RESP_BODY_FILE" >&2
  fi
  cleanup_resp
  exit 1
}

pass() {
  local msg="$1"
  PASS=$((PASS + 1))
  echo "PASS: $msg"
  cleanup_resp
}

auth_guard() {
  if [ "$RESP_STATUS" -eq 401 ] || [ "$RESP_STATUS" -eq 403 ]; then
    echo "Blocked by auth (status $RESP_STATUS). Provide BYPASS_HEADER/BYPASS_TOKEN or use Preview/Staging." >&2
    cleanup_resp
    exit 10
  fi
}

assert_status_in() {
  local expected="$1"
  local ok=0
  for code in $expected; do
    if [ "$RESP_STATUS" -eq "$code" ]; then
      ok=1
      break
    fi
  done
  if [ "$ok" -ne 1 ]; then
    fail "unexpected status $RESP_STATUS (expected $expected)"
  fi
}

assert_json() {
  jq -e . "$RESP_BODY_FILE" >/dev/null 2>&1 || fail "invalid JSON"
}

assert_error_shape_no_leak() {
  jq -e '.error and .requestId' "$RESP_BODY_FILE" >/dev/null 2>&1 || fail "missing error or requestId"
  local err_text
  err_text=$(jq -r '.error // ""' "$RESP_BODY_FILE")
  if echo "$err_text" | grep -E -i "$ERROR_LEAK_PATTERN" >/dev/null 2>&1; then
    fail "error leak detected ($ERROR_LEAK_PATTERN)"
  fi
}

assert_markets_response() {
  jq -e '(.markets // .data // .) | type == "array"' "$RESP_BODY_FILE" >/dev/null 2>&1 || fail "markets is not an array"
  local count
  count=$(jq -r '(.markets // .data // .) | length' "$RESP_BODY_FILE")
  if [ "$count" -gt 3 ]; then
    fail "markets length $count exceeds limit"
  fi

  IFS=',' read -r -a fields <<< "$REQUIRED_MARKET_FIELDS"
  for f in "${fields[@]}"; do
    f=$(echo "$f" | xargs)
    if [ -n "$f" ]; then
      jq -e "(.markets // .data // .) | all(.[]; has(\"$f\"))" "$RESP_BODY_FILE" >/dev/null 2>&1 \
        || fail "market items missing field: $f"
    fi
  done
}

assert_market_score_summary() {
  local total
  total=$(jq -r '(.totalAssets // .summary.totalAssets // 0) | tonumber' "$RESP_BODY_FILE" 2>/dev/null || echo 0)
  if [ "$total" -le 0 ]; then
    fail "totalAssets must be > 0"
  fi
  jq -e '(.distributions // .summary.distributions) != null' "$RESP_BODY_FILE" >/dev/null 2>&1 \
    || fail "missing distributions"
}

assert_chat_response() {
  jq -e '.matches and (.matches|type=="array") and .cards and (.cards|type=="array")' "$RESP_BODY_FILE" >/dev/null 2>&1 \
    || fail "missing matches/cards"
}

if [ -z "${CHAT_PAYLOAD:-}" ]; then
  CHAT_PAYLOAD=$(jq -nc --arg q "smoke test" '{q:$q, features:["markets"], limit:3}')
fi

if [ -z "${CHAT_PAYLOAD_OVERSIZED:-}" ]; then
  big=$(printf 'a%.0s' {1..5000})
  CHAT_PAYLOAD_OVERSIZED=$(jq -nc --arg q "$big" '{q:$q, features:["markets"], limit:3}')
fi

TOTAL=$((TOTAL + 1))
request "$BASE_URL/api/markets?limit=3"
auth_guard
assert_status_in "200"
assert_json
assert_markets_response
pass "markets limit=3"

TOTAL=$((TOTAL + 1))
request "$BASE_URL/api/markets?limit=99999"
auth_guard
assert_status_in "400 422"
assert_json
assert_error_shape_no_leak
pass "markets limit too large"

TOTAL=$((TOTAL + 1))
request "$BASE_URL/api/market-score/summary"
auth_guard
assert_status_in "200"
assert_json
assert_market_score_summary
pass "market score summary"

TOTAL=$((TOTAL + 1))
request "$BASE_URL/api/chat" "POST" "$CHAT_PAYLOAD"
auth_guard
assert_status_in "200"
assert_json
assert_chat_response
pass "chat normal"

TOTAL=$((TOTAL + 1))
request "$BASE_URL/api/chat" "POST" "$CHAT_PAYLOAD_OVERSIZED"
auth_guard
assert_status_in "400 422"
assert_json
assert_error_shape_no_leak
pass "chat oversized"
```

## Security Posture Guarantee
- Production SSO and Vercel Authentication stay enabled; no permanent bypasses or public tunnels are introduced.
- Any bypass token is scoped to Preview when the UI allows it, stored only in CI secrets, rotated on a regular cadence, and never baked into runtime env vars.
- Preview/staging access is controlled (public, password-protected, or via a limited domain) with minimal data exposure.
- CI uses deliberate credentials (tokens, org/project IDs, bypass tokens) that are auditable and rotated quarterly; log rotation events in your security tracker.

## Definition of Done
1. Nightly DB contract tests run against Neon through `tests/db-contract.test.ts`.
2. Smoke tests execute on every Preview (or staging) deployment and fail fast before promotion if they fail.
3. Production stays guarded by Vercel Authentication (SSO) at all times.
4. Smoke failures include clear `requestId` metadata and never leak internal error text.
5. Documentation (README or `docs/`) describes the deployment, smoke, and promotion flow.

## Suggested Next Steps
1. Confirm whether Preview-as-staging with `vercel promote` is acceptable or if a dedicated staging project is needed.
2. Decide whether previews should be public or gated via a bypass token.
3. Wire the GitHub Actions workflows above and add the hardened `scripts/smoke.sh`.
