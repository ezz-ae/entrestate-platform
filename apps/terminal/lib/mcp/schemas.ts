import { z } from "zod"

export const mcpQueryInputSchema = z
  .object({
    sql: z.string().trim().min(1).max(2000),
    params: z.array(z.unknown()).optional(),
    limit: z.number().int().min(1).max(100).default(50),
  })
  .strict()

export type McpQueryInput = z.infer<typeof mcpQueryInputSchema>

export const mcpDescribeTableInputSchema = z
  .object({
    table_name: z.string().trim().min(1),
  })
  .strict()

export type McpDescribeTableInput = z.infer<typeof mcpDescribeTableInputSchema>

export const mcpSampleDataInputSchema = z
  .object({
    table_name: z.string().trim().min(1),
    limit: z.number().int().min(1).max(20).default(5),
  })
  .strict()

export type McpSampleDataInput = z.infer<typeof mcpSampleDataInputSchema>

export const mcpCrossReferenceInputSchema = z
  .object({
    type: z.enum(["price_vs_dld", "developer_portfolio", "area_intelligence", "golden_visa_opportunities", "stress_test_report"]),
    filter: z.string().trim().min(1).optional(),
    limit: z.number().int().min(1).max(50).default(20),
  })
  .strict()

export type McpCrossReferenceInput = z.infer<typeof mcpCrossReferenceInputSchema>

export const mcpTriggerScraperInputSchema = z
  .object({
    source: z.enum(["arvo_dld", "pf_developers"]),
  })
  .strict()

export type McpTriggerScraperInput = z.infer<typeof mcpTriggerScraperInputSchema>
