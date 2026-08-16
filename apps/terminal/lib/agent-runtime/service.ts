import { prisma } from "@/lib/prisma"
import type { AutomationRuntimeResponse, AutomationRuntimeRunInput } from "@/lib/automation-runtime/types"
import { buildRunQuery } from "@/lib/agent-runtime/queries"

type DbClient = {
  $queryRaw<T>(query: unknown): Promise<T>
}

export async function runAgentRuntime(
  input: AgentRuntimeRunInput,
  db: DbClient = prisma,
): Promise<AgentRuntimeResponse> {
  const rows = await db.$queryRaw<any[]>(buildRunQuery(input))
  return {
    rows,
    returnedCount: rows.length,
    mode: input.ranked ? "ranked" : "routed",
    overrideActive: input.overrideActive,
  }
}
