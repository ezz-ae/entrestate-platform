import "server-only"
import { z } from "zod"

const promptConfigSchema = z.object({
  voice: z.string().trim().min(1).max(300),
  constraints: z.array(z.string().trim().min(1).max(200)).max(20),
  temperature: z.number().min(0).max(1),
  language: z.string().trim().min(2).max(12),
})

const holdTypesConfigSchema = z.object({
  inquiryMinutes: z.number().int().min(5).max(1440),
  viewingMinutes: z.number().int().min(5).max(1440),
  decisionMinutes: z.number().int().min(5).max(1440),
  contractMinutes: z.number().int().min(5).max(1440),
})

const brandConfigSchema = z.object({
  brand_name: z.string().trim().min(1).max(120),
  tone: z.string().trim().min(1).max(120),
  language: z.string().trim().min(2).max(12),
})

const enterpriseConfigSchema = z.object({
  prompt: promptConfigSchema,
  holdTypes: holdTypesConfigSchema,
  brand: brandConfigSchema,
  updatedAt: z.string(),
})

export type EnterprisePromptConfig = z.infer<typeof promptConfigSchema>
export type EnterpriseHoldTypesConfig = z.infer<typeof holdTypesConfigSchema>
export type EnterpriseBrandConfig = z.infer<typeof brandConfigSchema>
export type EnterpriseConfig = z.infer<typeof enterpriseConfigSchema>

const DEFAULT_ENTERPRISE_CONFIG: EnterpriseConfig = {
  prompt: {
    voice: "Institutional, analytical, execution-focused",
    constraints: [
      "Never invent numbers.",
      "Always include confidence + evidence context.",
      "Prefer deterministic tool output over prose.",
      "Use enterprise terminology only.",
    ],
    temperature: 0.2,
    language: "en",
  },
  holdTypes: {
    inquiryMinutes: 120,
    viewingMinutes: 240,
    decisionMinutes: 720,
    contractMinutes: 1440,
  },
  brand: {
    brand_name: "Entrestate",
    tone: "technical",
    language: "en",
  },
  updatedAt: new Date().toISOString(),
}

let cachedConfig: EnterpriseConfig = { ...DEFAULT_ENTERPRISE_CONFIG }
let initializedFromEnv = false

function parseEnvConfig() {
  const raw = process.env.ENTRESTATE_ENTERPRISE_CONFIG_JSON
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    const validated = enterpriseConfigSchema.parse(parsed)
    return validated
  } catch {
    return null
  }
}

function ensureInitialized() {
  if (initializedFromEnv) return
  initializedFromEnv = true

  const envConfig = parseEnvConfig()
  if (envConfig) {
    cachedConfig = envConfig
  }
}

function withUpdatedAt(config: EnterpriseConfig): EnterpriseConfig {
  return {
    ...config,
    updatedAt: new Date().toISOString(),
  }
}

export async function getEnterpriseConfig(): Promise<EnterpriseConfig> {
  ensureInitialized()
  return cachedConfig
}

export async function updateEnterprisePromptConfig(
  partial: Partial<EnterprisePromptConfig>,
): Promise<EnterprisePromptConfig> {
  ensureInitialized()

  const nextPrompt = promptConfigSchema.parse({
    ...cachedConfig.prompt,
    ...partial,
    constraints: partial.constraints ?? cachedConfig.prompt.constraints,
  })

  cachedConfig = withUpdatedAt({
    ...cachedConfig,
    prompt: nextPrompt,
  })

  return cachedConfig.prompt
}

export async function updateEnterpriseHoldTypesConfig(
  partial: Partial<EnterpriseHoldTypesConfig>,
): Promise<EnterpriseHoldTypesConfig> {
  ensureInitialized()

  const nextHoldTypes = holdTypesConfigSchema.parse({
    ...cachedConfig.holdTypes,
    ...partial,
  })

  cachedConfig = withUpdatedAt({
    ...cachedConfig,
    holdTypes: nextHoldTypes,
  })

  return cachedConfig.holdTypes
}

export async function updateEnterpriseBrandConfig(
  partial: Partial<EnterpriseBrandConfig>,
): Promise<EnterpriseBrandConfig> {
  ensureInitialized()

  const nextBrand = brandConfigSchema.parse({
    ...cachedConfig.brand,
    ...partial,
  })

  cachedConfig = withUpdatedAt({
    ...cachedConfig,
    brand: nextBrand,
  })

  return cachedConfig.brand
}
