import { z } from "zod"

const tableSpecFilterOpSchema = z.enum(["eq", "neq", "lt", "lte", "gt", "gte", "in", "contains"])

const tableSpecScopeSchema = z.object({
  cities: z.array(z.string()).optional(),
  areas: z.array(z.string()).optional(),
  developers: z.array(z.string()).optional(),
  projects: z.array(z.string()).optional(),
})

const tableSpecTimeRangeSchema = z.object({
  mode: z.enum(["relative", "absolute"]),
  last: z.number().int().positive().optional(),
  unit: z.enum(["days", "months", "years"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

const tableSpecFilterSchema = z.object({
  field: z.string(),
  op: tableSpecFilterOpSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]),
})

const tableSpecSortSchema = z.object({
  field: z.string(),
  direction: z.enum(["asc", "desc"]),
})

export const tableSpecEntitlementsSchema = z.object({
  currentTier: z.enum(["free", "pro", "team", "institutional", "business", "enterprise"]).optional(),
  allowedRowGrains: z.array(z.enum(["project", "asset", "transaction"])).optional(),
  allowedSignals: z.array(z.string()).optional(),
  allowedFilters: z.array(z.string()).optional(),
  allowedSorts: z.array(z.string()).optional(),
  allowedScopeKeys: z.array(z.enum(["cities", "areas", "developers", "projects"])).optional(),
  maxLimit: z.number().int().positive().optional(),
})

export const tableSpecSchema = z.object({
  version: z.literal("v1"),
  intent: z.string(),
  row_grain: z.enum(["project", "asset", "transaction"]),
  scope: tableSpecScopeSchema,
  time_grain: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly", "lifecycle"]),
  time_range: tableSpecTimeRangeSchema,
  signals: z.array(z.string()).min(1),
  filters: z.array(tableSpecFilterSchema),
  sort: tableSpecSortSchema.optional(),
  limit: z.number().int().positive().optional(),
  reasoning: z.string().optional(),
  dataSource: z.string().optional(),
})

export type TableSpecSchema = z.infer<typeof tableSpecSchema>
