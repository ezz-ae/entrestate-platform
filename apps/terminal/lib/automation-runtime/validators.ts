import { z } from "zod"
import type { AutomationRuntimeRunInput, OverrideFlags } from "@/lib/automation-runtime/types"

const numberFromString = z.preprocess(
  (value) => (typeof value === "string" ? Number(value) : value),
  z.number().positive(),
)

export const runBodySchema = z
  .object({
    risk_profile: z.string().min(1),
    horizon: z.string().min(1),
    ranked: z.boolean().optional().default(false),
    budget_aed: numberFromString.optional(),
    preferred_area: z.string().min(1).optional(),
    beds_pref: z.string().min(1).optional(),
    intent: z.enum(["invest", "live", "rent"]).optional(),
    override_active: z.boolean().optional().default(false),
    override_flags: z
      .object({
        allow_2030_plus: z.boolean(),
        allow_speculative: z.boolean(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ranked) {
      if (data.budget_aed === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Budget is required for ranked mode.", path: ["budget_aed"] })
      }
      if (!data.preferred_area) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Preferred area is required for ranked mode.", path: ["preferred_area"] })
      }
      if (!data.beds_pref) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bed preference is required for ranked mode.", path: ["beds_pref"] })
      }
      if (!data.intent) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Intent is required for ranked mode.", path: ["intent"] })
      }
    }

    if (data.override_active) {
      if (!data.override_flags) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Override flags are required.", path: ["override_flags"] })
      } else if (!data.override_flags.allow_2030_plus && !data.override_flags.allow_speculative) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select at least one override option.", path: ["override_flags"] })
      }
    }
  })

export const overrideBodySchema = z.object({
  risk_profile: z.string().min(1),
  horizon: z.string().min(1),
  override_flags: z.object({
    allow_2030_plus: z.boolean(),
    allow_speculative: z.boolean(),
  }),
  reason: z.string().min(10),
  selected_asset_id: z.string().min(1),
})

export const disclosureSchema = z.object({
  asset_id: z.string().min(1),
  override_type: z.enum(["allow_2030_plus", "allow_speculative", "allow_2030_plus_and_speculative"]),
  profile: z.string().min(1),
})

export function parseRunBody(payload: unknown): AutomationRuntimeRunInput {
  const parsed = runBodySchema.parse(payload)
  const overrideFlags: OverrideFlags = {
    allow2030Plus: parsed.override_flags?.allow_2030_plus ?? false,
    allowSpeculative: parsed.override_flags?.allow_speculative ?? false,
  }

  return {
    riskProfile: parsed.risk_profile as AutomationRuntimeRunInput["riskProfile"],
    horizon: parsed.horizon as AutomationRuntimeRunInput["horizon"],
    ranked: parsed.ranked ?? false,
    budgetAed: parsed.budget_aed,
    preferredArea: parsed.preferred_area,
    bedsPref: parsed.beds_pref,
    intent: parsed.intent,
    overrideActive: parsed.override_active ?? false,
    overrideFlags,
  }
}

export function assertAdmin(isAdmin: boolean) {
  if (!isAdmin) {
    throw new Error("Not authorized.")
  }
}
