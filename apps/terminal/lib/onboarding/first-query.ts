import type { TableSpecGoldenPath } from "@/lib/tablespec/types"

export type FirstQueryPlan = {
  query: string
  goldenPath: TableSpecGoldenPath
}

export function getFirstQuery(selections: {
  objective?: string
  budget?: string
}): FirstQueryPlan {
  const objective = selections.objective?.toLowerCase() ?? ""
  const budgetPhrase = selections.budget ? ` with a ${selections.budget} budget` : ""

  if (objective.includes("yield")) {
    return {
      query: `Compare the strongest rental yield areas in Dubai${budgetPhrase}.`,
      goldenPath: "compare_area_yields",
    }
  }

  if (objective.includes("visa")) {
    return {
      query: `Underwrite Golden Visa eligible projects${budgetPhrase} with resilience and handover context.`,
      goldenPath: "underwrite_development_site",
    }
  }

  return {
    query: `Underwrite the best capital growth projects${budgetPhrase} with resilience, pricing, and developer context.`,
    goldenPath: "underwrite_development_site",
  }
}
