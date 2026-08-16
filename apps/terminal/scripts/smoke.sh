#!/bin/bash
# Entrestate OS Smoke Test v1.0
# Verifies the "Golden Path" for Decision Infrastructure deployments.

set -e

BASE_URL=${1:-"http://localhost:3000"}
BYPASS_HEADER="x-smoke-test: true"

echo "🚀 Starting Entrestate OS Smoke Tests for: ${BASE_URL}"

# 1. Landing Page Health
echo "--- [1/4] Checking Landing Page ---"
curl -s -f -H "${BYPASS_HEADER}" "${BASE_URL}" > /dev/null
echo "✅ Landing Page OK"

# 2. Chat API Health
echo "--- [2/4] Checking Chat API ---"
curl -s -f -X POST -H "${BYPASS_HEADER}" \
  -H "Content-Type: application/json" \
  -d '{"message": "PULSE"}' \
  "${BASE_URL}/api/chat" > /dev/null
echo "✅ Chat API (PULSE) OK"

# 3. Decision Screening
echo "--- [3/4] Checking Decision Screening ---"
curl -s -f -X POST -H "${BYPASS_HEADER}" \
  -H "Content-Type: application/json" \
  -d '{"message": "SCREEN projects under AED 2M"}' \
  "${BASE_URL}/api/chat" | grep -q "price_from_aed" || (echo "❌ MISSING price_from_aed in results" && exit 1)
echo "✅ Decision Screening (price_from_aed integrity) OK"

# 4. Market Pulse Summary
echo "--- [4/4] Checking Market Pulse API ---"
curl -s -f -H "${BYPASS_HEADER}" "${BASE_URL}/api/market-score/summary" > /dev/null
echo "✅ Market Pulse API OK"

echo "✨ ALL SMOKE TESTS PASSED"
