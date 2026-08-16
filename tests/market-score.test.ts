import { Prisma } from "@prisma/client"
import { describe, expect, it } from "vitest"
import { buildFilterSql, buildInventorySourceSql, buildOverrideInsertQuery } from "@/lib/market-score/queries"
import { buildTruthChecks, getLatestHealthcheck, getMarketScoreSummary } from "@/lib/market-score/service"

function sqlText(sql: unknown) {
  const fragment = sql as { strings?: string[] }
  if (fragment?.strings) return fragment.strings.join("")
  return String(sql)
}

describe("market score queries", () => {
  it("builds filters for city and area", () => {
    const sql = buildFilterSql(
      {
        cities: ["Dubai"],
        areas: ["Marina"],
        statusBands: [],
        priceTiers: [],
        safetyBands: [],
      },
      { includePriceTier: false },
    )
    expect(sqlText(sql)).toContain("city IN")
    expect(sqlText(sql)).toContain("area IN")
  })

  it("routes to investor function when profile + horizon provided", () => {
    const sql = buildInventorySourceSql(
      Prisma.sql`asset_id`,
      { riskProfile: "Conservative", horizon: "Ready" },
      { allow2030Plus: false, allowSpeculative: false },
    )
    expect(sqlText(sql)).toContain("automation_inventory_for_investor_v1")
  })

  it("routes to ranked function when ranked is enabled", () => {
    const sql = buildInventorySourceSql(
      Prisma.sql`asset_id`,
      { riskProfile: "Balanced", horizon: "1-2yr", ranked: true, budgetAed: 1000000 },
      { allow2030Plus: false, allowSpeculative: false },
    )
    expect(sqlText(sql)).toContain("automation_ranked_for_investor_v1")
  })

  it("creates override audit insert", () => {
    const sql = buildOverrideInsertQuery(
      "user-1",
      "Balanced",
      "1-2yr",
      { allow2030Plus: true, allowSpeculative: false },
      "Client approved override",
      "asset-1",
    )
    expect(sqlText(sql)).toContain("investor_override_audit")
  })
})

describe("market score summary", () => {
  it("returns summary data with stubbed db", async () => {
    const responses: unknown[] = [
      [{ table_name: "automation_inventory_view_v1" }],
      [{ exists: false }],
      [{ count: 10 }],
      [{ avg_score: 72.4 }],
      [{ label: "Capital Safe", count: 5 }],
      [{ label: "Balanced", count: 10 }],
      [{ label: "2026", avg_score: 71.2 }],
      [{ label: "Capital Safe", avg_score: 69.1 }],
      [{ value: "Dubai" }],
      [{ value: "Marina" }],
      [{ value: "2026" }],
      [{ value: "Capital Safe" }],
      [{ count: 20 }],
      [{ count: 933 }],
    ]

    const db = {
      $queryRaw: async () => responses.shift(),
    }

    const summary = await getMarketScoreSummary(
      { cities: [], areas: [], statusBands: [], priceTiers: [], safetyBands: [] },
      {},
      { allow2030Plus: false, allowSpeculative: false },
      db,
    )

    expect(summary.totalAssets).toBe(10)
    expect(summary.avgScore).toBeCloseTo(72.4)
    expect(summary.available.cities).toEqual(["Dubai"])
    expect(summary.conservativeReadyPool).toBe(20)
  })
})

describe("truth checks", () => {
  it("returns keys for truth checks", async () => {
    const responses: unknown[] = [
      [{ table_name: "automation_inventory_view_v1" }],
      [{ label: "Capital Safe", count: 3 }],
      [{ label: "Opportunistic", count: 10 }],
      [{ count: 0 }],
      [{ count: 0 }],
    ]

    const db = {
      $queryRaw: async () => responses.shift(),
    }

    const checks = await buildTruthChecks(db)
    expect(checks).toHaveProperty("conservativeReady")
    expect(checks).toHaveProperty("balancedShort")
    expect(checks).toHaveProperty("horizonViolations")
    expect(checks).toHaveProperty("speculativeLeak")
  })
})

describe("healthcheck", () => {
  it("returns latest healthcheck row", async () => {
    const responses: unknown[] = [[{ status: "ok" }]]
    const db = {
      $queryRaw: async () => responses.shift(),
    }
    const row = await getLatestHealthcheck(db)
    expect(row?.status).toBe("ok")
  })
})
