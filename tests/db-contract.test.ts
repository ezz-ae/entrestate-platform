import { describe, it, expect } from "vitest"
import { PrismaClient } from "@prisma/client"
import { getInventoryTableName } from "@/lib/inventory-table"
import { REQUIRED_FUNCTIONS, REQUIRED_RELATIONS } from "@/lib/db-contract"

const hasDatabaseUrl = Boolean(
  process.env.DATABASE_URL
    || process.env.DATABASE_URL_UNPOOLED
    || process.env.NEON_DATABASE_URL
    || process.env.NEON_DATABASE_URL_UNPOOLED
    || process.env.NEON_READONLY_URL,
)

const prisma = hasDatabaseUrl ? new PrismaClient() : null
const test = hasDatabaseUrl ? it : it.skip

async function getRelationColumns(name: string) {
  return prisma!.$queryRaw<Array<{ column_name: string; data_type: string }>>`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${name}
  `
}

describe("Database Contract Verification", () => {
  test("should expose required relations and columns", async () => {
    const relations = await prisma!.$queryRaw<Array<{ table_name: string; table_type: string }>>`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `

    for (const relation of REQUIRED_RELATIONS) {
      const match = relations.find((entry) => entry.table_name === relation.name)
      expect(match, `Missing relation ${relation.name}`).toBeTruthy()

      const expectedTypes = Array.isArray(relation.type) ? relation.type : [relation.type]
      expect(
        expectedTypes.includes(match!.table_type as typeof expectedTypes[number]),
        `Unexpected relation type for ${relation.name}: ${match!.table_type}`,
      ).toBe(true)

      const columns = await getRelationColumns(relation.name)
      const columnNames = new Set(columns.map((column) => column.column_name))
      for (const requiredColumn of relation.requiredColumns) {
        expect(columnNames.has(requiredColumn), `Missing ${relation.name}.${requiredColumn}`).toBe(true)
      }
    }
  })

  test("should expose required database functions", async () => {
    const functions = await prisma!.$queryRaw<Array<{ routine_name: string }>>`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
    `

    const functionNames = new Set(functions.map((fn) => fn.routine_name))
    for (const requiredFunction of REQUIRED_FUNCTIONS) {
      expect(functionNames.has(requiredFunction), `Missing function ${requiredFunction}()`).toBe(true)
    }
  })

  test("should have inventory view with required columns", async () => {
    const inventoryTable = getInventoryTableName()
    const parts = inventoryTable.split(".")
    const tableSchema = parts.length === 2 ? parts[0] : "public"
    const tableName = parts.length === 2 ? parts[1] : parts[0]

    const columns = await prisma!.$queryRaw<any[]>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = ${tableSchema}
        AND table_name = ${tableName}
    `

    expect(columns.length).toBeGreaterThan(0)

    const columnNames = columns.map((c) => c.column_name)

    // Enterprise mandatory signals
    const hasPrice =
      columnNames.includes("price_from_aed")
      || columnNames.includes("price_from")
    expect(hasPrice).toBe(true)
    expect(columnNames).toContain("investor_score_v1")
    expect(columnNames).toContain("stress_grade_v1")
    expect(columnNames).toContain("timing_label")
    expect(columnNames).toContain("decision_label_v1")
  })

  test("should have market-score inventory view", async () => {
    const columns = await prisma!.$queryRaw<any[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('automation_inventory_view_v1', 'agent_inventory_view_v1')
    `

    expect(columns.length).toBeGreaterThan(0)
  })

  test("should enforce DOUBLE PRECISION for core financial metrics", async () => {
    const inventoryTable = getInventoryTableName()
    const parts = inventoryTable.split(".")
    const tableSchema = parts.length === 2 ? parts[0] : "public"
    const tableName = parts.length === 2 ? parts[1] : parts[0]

    const priceColumn = await prisma!.$queryRaw<any[]>`
      SELECT data_type, column_name
      FROM information_schema.columns 
      WHERE table_schema = ${tableSchema}
        AND table_name = ${tableName}
        AND column_name IN ('price_from_aed', 'price_from')
      ORDER BY CASE column_name WHEN 'price_from_aed' THEN 0 ELSE 1 END
      LIMIT 1
    `

    expect(priceColumn.length).toBeGreaterThan(0)
    // Neon/Postgres numeric types include double precision, numeric, or bigint for integer AED values.
    expect(priceColumn[0].data_type).toMatch(/double precision|numeric|bigint/i)

    const marketScoreColumn = await prisma!.$queryRaw<any[]>`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'market_scores_v1'
        AND column_name = 'score'
      LIMIT 1
    `

    expect(marketScoreColumn.length).toBeGreaterThan(0)
    expect(marketScoreColumn[0].data_type).toMatch(/double precision|numeric|real|bigint/i)
  })
})
