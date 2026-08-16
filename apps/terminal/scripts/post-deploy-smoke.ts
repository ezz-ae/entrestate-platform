#!/usr/bin/env tsx

import { parseArgs } from "node:util"
import { performance } from "node:perf_hooks"

type JsonRecord = Record<string, unknown>

type SmokeResult = {
  name: string
  passed: boolean
  durationMs: number
  detail?: string
}

const { values } = parseArgs({
  options: {
    url: { type: "string" },
    prod: { type: "boolean", default: false },
  },
  allowPositionals: true,
  strict: false,
})

const rawArgs = process.argv.slice(2)

function readStringArg(name: string): string | undefined {
  const index = rawArgs.findIndex((arg) => arg === name)
  if (index === -1) return undefined
  const value = rawArgs[index + 1]
  if (!value || value.startsWith("-")) return undefined
  return value
}

const baseUrl = (
  values.url ??
  readStringArg("--url") ??
  (values.prod ? process.env.PRODUCTION_URL : process.env.STAGING_URL) ??
  ""
)
  .trim()
  .replace(/\/$/, "")
const bypassHeader = process.env.SMOKE_BYPASS_HEADER?.trim() || "x-vercel-protection-bypass"
const bypassToken = process.env.VERCEL_BYPASS_TOKEN?.trim() || ""
const minAreas = Number.parseInt(process.env.SMOKE_MIN_AREAS ?? "1", 10)
const minDevelopers = Number.parseInt(process.env.SMOKE_MIN_DEVELOPERS ?? "1", 10)
const minInventoryTotal = Number.parseInt(process.env.SMOKE_MIN_INVENTORY_TOTAL ?? "1", 10)
const requestTimeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? "10000", 10)

if (!baseUrl) {
  console.error("Missing base URL. Use --url https://... or set STAGING_URL / PRODUCTION_URL.")
  process.exit(2)
}

function assertRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Response is not a JSON object")
  }
  return value as JsonRecord
}

async function getJson(path: string): Promise<{ status: number; json: JsonRecord; durationMs: number }> {
  const headers: Record<string, string> = { Accept: "application/json" }
  if (bypassToken) {
    headers[bypassHeader] = bypassToken
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)
  const startedAt = performance.now()

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers,
      signal: controller.signal,
      cache: "no-store",
    })

    const durationMs = Math.round(performance.now() - startedAt)
    const payload = await response.json().catch(() => null)
    const json = assertRecord(payload)

    return {
      status: response.status,
      json,
      durationMs,
    }
  } finally {
    clearTimeout(timeout)
  }
}

function toInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

async function runSmoke(): Promise<SmokeResult[]> {
  const results: SmokeResult[] = []

  const health = await getJson("/api/health/db")
  results.push({
    name: "GET /api/health/db",
    passed: health.status === 200 && health.json.ok === true,
    durationMs: health.durationMs,
    detail: `status=${health.status} ok=${String(health.json.ok)}`,
  })

  const developers = await getJson("/api/developers")
  const developersCount = Array.isArray(developers.json.developers) ? developers.json.developers.length : 0
  results.push({
    name: "GET /api/developers",
    passed: developers.status === 200 && developersCount >= minDevelopers,
    durationMs: developers.durationMs,
    detail: `status=${developers.status} developers=${developersCount}`,
  })

  const areas = await getJson("/api/areas")
  const areasCount = Array.isArray(areas.json.areas) ? areas.json.areas.length : 0
  results.push({
    name: "GET /api/areas",
    passed: areas.status === 200 && areasCount >= minAreas,
    durationMs: areas.durationMs,
    detail: `status=${areas.status} areas=${areasCount}`,
  })

  const inventory = await getJson("/api/market-score/inventory?page=1&pageSize=5")
  const rowsCount = Array.isArray(inventory.json.rows) ? inventory.json.rows.length : 0
  const totalCount = toInt(inventory.json.total)
  results.push({
    name: "GET /api/market-score/inventory",
    passed: inventory.status === 200 && rowsCount > 0 && totalCount >= minInventoryTotal,
    durationMs: inventory.durationMs,
    detail: `status=${inventory.status} rows=${rowsCount} total=${totalCount}`,
  })

  return results
}

async function main() {
  console.log(`Running post-deploy smoke against ${baseUrl}`)
  const results = await runSmoke()
  let failed = 0

  for (const result of results) {
    const icon = result.passed ? "✅" : "❌"
    console.log(`${icon} ${result.name} (${result.durationMs}ms)${result.detail ? ` — ${result.detail}` : ""}`)
    if (!result.passed) failed += 1
  }

  if (failed > 0) {
    console.error(`Smoke failed: ${failed}/${results.length} checks did not pass.`)
    process.exit(1)
  }

  console.log(`Smoke passed: ${results.length}/${results.length} checks.`)
}

void main().catch((error) => {
  console.error("Smoke runner crashed:", error)
  process.exit(1)
})
