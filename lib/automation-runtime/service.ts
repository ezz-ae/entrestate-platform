import { prisma } from "@/lib/prisma"
import type { AutomationRuntimeResponse, AutomationRuntimeRunInput } from "@/lib/automation-runtime/types"
import { buildRunQuery } from "@/lib/automation-runtime/queries"

type DbClient = {
  $queryRaw<T>(query: unknown): Promise<T>
}

export async function runAutomationRuntime(
  input: AutomationRuntimeRunInput,
  db: DbClient = prisma,
): Promise<AutomationRuntimeResponse> {
  const rows = await db.$queryRaw<any[]>(buildRunQuery(input))
  return {
    rows,
    returnedCount: rows.length,
    mode: input.ranked ? "ranked" : "routed",
    overrideActive: input.overrideActive,
  }
}
