import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const queryRawMock = vi.fn()
const getMarketScoreSummaryMock = vi.fn()
const listSearchIndexMock = vi.fn()
const listAreasMock = vi.fn()
const generateDataScientistTextMock = vi.fn()

vi.mock("@/lib/notebook-provenance", () => ({
  getLatestNotebookProvenance: vi.fn(async () => ({
    run_id: "run-test-123",
    snapshot_ts: "2026-04-10T00:00:00.000Z",
    sources_used: ["inventory_full"],
  })),
}))

vi.mock("@/lib/rate-limit", () => ({
  buildRateLimitKey: vi.fn(() => "markets:test"),
  rateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 119,
    resetAt: Date.now() + 60_000,
  })),
}))

vi.mock("@/lib/inventory-policy", () => ({
  buildExclusionSql: vi.fn(() => null),
}))

vi.mock("@/lib/db-guardrails", () => ({
  withStatementTimeout: vi.fn(async (callback: (tx: { $queryRaw: typeof queryRawMock }) => Promise<unknown>) =>
    callback({ $queryRaw: queryRawMock })),
}))

vi.mock("@/lib/market-score/service", () => ({
  getMarketScoreSummary: (...args: unknown[]) => getMarketScoreSummaryMock(...args),
}))

vi.mock("@/lib/search-index", () => ({
  listSearchIndex: (...args: unknown[]) => listSearchIndexMock(...args),
}))

vi.mock("@/lib/decision-infrastructure", () => ({
  listAreas: (...args: unknown[]) => listAreasMock(...args),
}))

vi.mock("@/lib/llm/data-scientist", () => ({
  generateDataScientistText: (...args: unknown[]) => generateDataScientistTextMock(...args),
}))

vi.mock("@/lib/market-score/filters", () => ({
  parseMarketScoreFilters: vi.fn(() => ({
    filters: { cities: [], areas: [], statusBands: [], priceTiers: [], safetyBands: [] },
    routing: {},
    overrideFlags: { allow2030Plus: false, allowSpeculative: false },
  })),
}))

vi.mock("@/lib/market-score/validators", () => ({
  filtersSchema: { parse: vi.fn((value: unknown) => value) },
  routingSchema: { parse: vi.fn((value: unknown) => value) },
}))

import { GET as marketsGet } from "@/app/api/markets/route"
import { GET as marketScoreSummaryGet } from "@/app/api/market-score/summary/route"
import { GET as searchGet } from "@/app/api/search/route"
import { GET as areasGet } from "@/app/api/areas/route"
import { POST as timeTableSummaryPost } from "@/app/api/time-table/summary/route"

describe("route contracts", () => {
  beforeEach(() => {
    queryRawMock.mockReset()
    getMarketScoreSummaryMock.mockReset()
    listSearchIndexMock.mockReset()
    listAreasMock.mockReset()
    generateDataScientistTextMock.mockReset()
  })

  it("returns a real total count envelope from /api/markets", async () => {
    queryRawMock
      .mockResolvedValueOnce([
        {
          asset_id: "asset-1",
          name: "Marina Vista",
          developer: "Emaar",
          city: "Dubai",
          area: "Dubai Marina",
          status_band: "ready",
          price_aed: 2500000,
          beds: "2",
          score_0_100: 82,
          safety_band: "A",
          classification: "core",
        },
      ])
      .mockResolvedValueOnce([{ count: 42 }])

    const response = await marketsGet(new Request("http://localhost/api/markets?limit=1"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.total).toBe(42)
    expect(body.requestId).toBeTruthy()
    expect(body.request_id).toBe(body.requestId)
    expect(body.provenance?.run_id).toBeTruthy()
    expect(Array.isArray(body.results)).toBe(true)
    expect(response.headers.get("x-request-id")).toBe(body.requestId)
  })

  it("returns request and provenance metadata from /api/market-score/summary", async () => {
    getMarketScoreSummaryMock.mockResolvedValue({
      totalAssets: 10,
      avgScore: 71.5,
      safetyDistribution: [],
      classificationDistribution: [],
      avgScoreByStatus: [],
      avgScoreBySafetyBand: [],
      avgScoreByPriceTier: [],
      conservativeReadyPool: 4,
      balancedDefaultPool: 6,
      available: {
        cities: ["Dubai"],
        areas: ["Dubai Marina"],
        statusBands: ["ready"],
        priceTiers: [],
        safetyBands: ["A"],
      },
      source: "view",
      truthChecks: {
        conservativeReady: [],
        balancedShort: [],
        horizonViolations: 0,
        speculativeLeak: 0,
      },
    })

    const response = await marketScoreSummaryGet(new Request("http://localhost/api/market-score/summary"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.totalAssets).toBe(10)
    expect(body.requestId).toBeTruthy()
    expect(body.request_id).toBe(body.requestId)
    expect(body.run_id).toBe("run-test-123")
    expect(body.provenance).toEqual({
      run_id: "run-test-123",
      snapshot_ts: "2026-04-10T00:00:00.000Z",
      sources_used: ["inventory_full"],
    })
    expect(response.headers.get("x-request-id")).toBe(body.requestId)
  })

  it("returns coverage and request headers from /api/search", async () => {
    listSearchIndexMock.mockResolvedValue({
      data_as_of: "2026-04-12T00:00:00.000Z",
      page: 1,
      pageSize: 24,
      total: 2,
      projects: [{ slug: "marina-vista", developer: "Emaar" }],
      source_view: "api.search_index",
      coverage: {
        total: 1,
        score: 87.5,
        status: "strong",
        fields: [
          { key: "developer", label: "Developer", available: 1, total: 1, pct: 100, status: "strong" },
        ],
      },
    })

    const response = await searchGet(new NextRequest("http://localhost/api/search?q=marina"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.coverage?.score).toBe(87.5)
    expect(body.source_view).toBe("api.search_index")
    expect(body.requestId).toBeTruthy()
    expect(body.request_id).toBe(body.requestId)
    expect(response.headers.get("x-request-id")).toBe(body.requestId)
  })

  it("returns coverage and source visibility from /api/areas", async () => {
    listAreasMock.mockResolvedValue({
      data_as_of: "2026-04-12T00:00:00.000Z",
      source_view: "api.areas_v1",
      areas: [{ slug: "dubai-marina", area: "Dubai Marina" }],
      coverage: {
        total: 1,
        score: 83.3,
        status: "mixed",
        fields: [
          { key: "avg_price", label: "Average price", available: 1, total: 1, pct: 100, status: "strong" },
        ],
      },
    })

    const response = await areasGet(new Request("http://localhost/api/areas"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.coverage?.score).toBe(83.3)
    expect(body.source_view).toBe("api.areas_v1")
    expect(body.requestId).toBeTruthy()
    expect(body.request_id).toBe(body.requestId)
    expect(response.headers.get("x-request-id")).toBe(body.requestId)
  })

  it("returns narrative, citations, and evidence from /api/time-table/summary", async () => {
    generateDataScientistTextMock.mockResolvedValue({
      text: JSON.stringify({
        summary: "Yield leaders are concentrated in the current area comparison.",
        highlights: ["The top rows skew toward higher rental yield.", "Filters remain narrow enough for analyst review."],
        nextActions: ["Export a memo", "Share with investment committee"],
      }),
    })

    const response = await timeTableSummaryPost(
      new Request("http://localhost/api/time-table/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goldenPath: "compare_area_yields", limit: 4 }),
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.summary).toContain("Yield leaders")
    expect(body.narrative).toContain("[cit-1]")
    expect(Array.isArray(body.citations)).toBe(true)
    expect(body.citations[0]?.rowIds?.length).toBeGreaterThan(0)
    expect(Array.isArray(body.evidence?.sources)).toBe(true)
    expect(body.requestId).toBeTruthy()
    expect(body.request_id).toBe(body.requestId)
    expect(response.headers.get("x-request-id")).toBe(body.requestId)
  })
})
