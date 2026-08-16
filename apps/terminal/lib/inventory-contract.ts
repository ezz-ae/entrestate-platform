import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export type InventoryContract = {
  viewName: string
  unrankedFn: string
  rankedFn: string
}

type DbClient = {
  $queryRaw<T>(query: unknown): Promise<T>
}

const AUTOMATION_CONTRACT: InventoryContract = {
  viewName: "automation_inventory_view_v1",
  unrankedFn: "automation_inventory_for_investor_v1",
  rankedFn: "automation_ranked_for_investor_v1",
}

const AGENT_CONTRACT: InventoryContract = {
  viewName: "agent_inventory_view_v1",
  unrankedFn: "agent_inventory_for_investor_v1",
  rankedFn: "agent_ranked_for_investor_v1",
}

export const DEFAULT_INVENTORY_CONTRACT = AUTOMATION_CONTRACT

export async function resolveInventoryContract(db: DbClient = prisma): Promise<InventoryContract> {
  const viewRows = await db.$queryRaw<{ table_name: string }[]>(Prisma.sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (${Prisma.join([AUTOMATION_CONTRACT.viewName, AGENT_CONTRACT.viewName])})
  `)

  const views = new Set(viewRows.map((row) => row.table_name))
  if (views.has(AUTOMATION_CONTRACT.viewName)) return AUTOMATION_CONTRACT
  if (views.has(AGENT_CONTRACT.viewName)) return AGENT_CONTRACT

  const functionRows = await db.$queryRaw<{ proname: string }[]>(Prisma.sql`
    SELECT proname
    FROM pg_proc
    JOIN pg_namespace n ON n.oid = pg_proc.pronamespace
    WHERE n.nspname = 'public'
      AND proname IN (${Prisma.join([
        AUTOMATION_CONTRACT.unrankedFn,
        AUTOMATION_CONTRACT.rankedFn,
        AGENT_CONTRACT.unrankedFn,
        AGENT_CONTRACT.rankedFn,
      ])})
  `)

  const functions = new Set(functionRows.map((row) => row.proname))
  if (functions.has(AUTOMATION_CONTRACT.unrankedFn) || functions.has(AUTOMATION_CONTRACT.rankedFn)) {
    return AUTOMATION_CONTRACT
  }
  if (functions.has(AGENT_CONTRACT.unrankedFn) || functions.has(AGENT_CONTRACT.rankedFn)) {
    return AGENT_CONTRACT
  }

  return AUTOMATION_CONTRACT
}
