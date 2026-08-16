import { Prisma } from "@prisma/client"
import type { AutomationRuntimeRunInput, OverrideFlags } from "@/lib/automation-runtime/types"
import { buildExclusionSql } from "@/lib/inventory-policy"

function buildRuntimeColumns(options: {
  ranked: boolean
  matchScore?: Prisma.Sql
  finalRank?: Prisma.Sql
}): Prisma.Sql {
  const matchScore = options.ranked
    ? options.matchScore ?? Prisma.sql`match_score`
    : Prisma.sql`NULL::double precision AS match_score`
  const finalRank = options.ranked
    ? options.finalRank ?? Prisma.sql`final_rank`
    : Prisma.sql`NULL::double precision AS final_rank`

  return Prisma.join(
    [
      Prisma.sql`asset_id::text AS asset_id`,
      Prisma.sql`name`,
      Prisma.sql`developer`,
      Prisma.sql`city`,
      Prisma.sql`area`,
      Prisma.sql`status_band`,
      Prisma.sql`price_aed`,
      Prisma.sql`beds`,
      Prisma.sql`score_0_100`,
      matchScore,
      finalRank,
      Prisma.sql`safety_band`,
      Prisma.sql`classification`,
      Prisma.sql`roi_band`,
      Prisma.sql`liquidity_band`,
      Prisma.sql`timeline_risk_band`,
      Prisma.sql`drivers`,
      Prisma.sql`reason_codes`,
      Prisma.sql`risk_flags`,
    ],
    ", ",
  )
}

function buildOverrideWhere(flags: OverrideFlags): Prisma.Sql | null {
  const clauses: Prisma.Sql[] = []
  if (flags.allow2030Plus) {
    clauses.push(Prisma.sql`status_band = '2030+'`)
  }
  if (flags.allowSpeculative) {
    clauses.push(Prisma.sql`safety_band = 'Speculative'`)
  }
  if (clauses.length === 0) return null
  return Prisma.sql`${Prisma.join(clauses, " OR ")}`
}

function buildRankedOverrideSelect(input: AutomationRuntimeRunInput, whereSql: Prisma.Sql): Prisma.Sql {
  const matchScore = Prisma.sql`compute_match_score(asset_id, ${input.budgetAed}, ${input.preferredArea}, ${input.bedsPref}, ${input.intent})`
  const innerColumns = buildRuntimeColumns({
    ranked: true,
    matchScore: Prisma.sql`${matchScore} AS match_score`,
    finalRank: Prisma.sql`NULL::double precision AS final_rank`,
  })

  return Prisma.sql`
    SELECT
      asset_id,
      name,
      developer,
      city,
      area,
      status_band,
      price_aed,
      beds,
      score_0_100,
      match_score,
      (score_0_100 * 0.65 + match_score * 0.35) AS final_rank,
      safety_band,
      classification,
      roi_band,
      liquidity_band,
      timeline_risk_band,
      drivers,
      reason_codes,
      risk_flags
    FROM (
      SELECT ${innerColumns}
      FROM automation_inventory_view_v1
      WHERE ${whereSql}
    ) AS override_base
  `
}

function buildUnrankedOverrideSelect(whereSql: Prisma.Sql): Prisma.Sql {
  const columns = buildRuntimeColumns({ ranked: false })
  return Prisma.sql`SELECT ${columns} FROM automation_inventory_view_v1 WHERE ${whereSql}`
}


export function buildRunQuery(input: AutomationRuntimeRunInput): Prisma.Sql {
  const overrideWhere = input.overrideActive ? buildOverrideWhere(input.overrideFlags) : null
  const baseColumns = buildRuntimeColumns({ ranked: input.ranked })
  const baseSql = input.ranked
    ? Prisma.sql`SELECT ${baseColumns} FROM automation_ranked_for_investor_v1(${input.riskProfile}, ${input.horizon}, ${input.budgetAed}, ${input.preferredArea}, ${input.bedsPref}, ${input.intent})`
    : Prisma.sql`SELECT ${baseColumns} FROM automation_inventory_for_investor_v1(${input.riskProfile}, ${input.horizon})`

  const combinedSql = overrideWhere
    ? Prisma.sql`${baseSql} UNION ${input.ranked ? buildRankedOverrideSelect(input, overrideWhere) : buildUnrankedOverrideSelect(overrideWhere)}`
    : baseSql

  const exclusionSql = buildExclusionSql()
  const whereClause = exclusionSql ? Prisma.sql`WHERE ${exclusionSql}` : Prisma.empty

  const orderSql = input.ranked
    ? Prisma.sql`ORDER BY final_rank DESC NULLS LAST, score_0_100 DESC NULLS LAST`
    : Prisma.sql`ORDER BY score_0_100 DESC NULLS LAST`

  return Prisma.sql`
    SELECT *
    FROM (${combinedSql}) AS inventory
    ${whereClause}
    ${orderSql}
    LIMIT 10
  `
}

export function getOverrideType(flags: OverrideFlags) {
  if (flags.allow2030Plus && flags.allowSpeculative) return "allow_2030_plus_and_speculative"
  if (flags.allow2030Plus) return "allow_2030_plus"
  if (flags.allowSpeculative) return "allow_speculative"
  return "none"
}
