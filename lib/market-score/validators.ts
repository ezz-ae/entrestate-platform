import { z } from "zod"

export const routingSchema = z.object({
  riskProfile: z.string().optional(),
  horizon: z.string().optional(),
  ranked: z.boolean().optional(),
  budgetAed: z.number().optional(),
  preferredArea: z.string().optional(),
  bedsPref: z.string().optional(),
  intent: z.string().optional(),
})

export const filtersSchema = z.object({
  cities: z.array(z.string()),
  areas: z.array(z.string()),
  statusBands: z.array(z.string()),
  priceTiers: z.array(z.string()),
  safetyBands: z.array(z.string()),
})

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
})

export const overrideBodySchema = z.object({
  risk_profile: z.string().optional(),
  horizon: z.string().optional(),
  override_flags: z.object({
    allow_2030_plus: z.boolean(),
    allow_speculative: z.boolean(),
  }),
  reason: z.string().min(1),
  selected_asset_id: z.string().min(1),
})

export const rankedRequirementsSchema = z.object({
  riskProfile: z.string(),
  horizon: z.string(),
  budgetAed: z.number(),
  preferredArea: z.string().optional(),
  bedsPref: z.string().optional(),
  intent: z.string().optional(),
})
