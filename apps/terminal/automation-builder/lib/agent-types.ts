import { z } from "zod"

export const AutomationRoleEnum = z.enum(["lead_qualifier", "buyer_matcher", "investor_advisor"])
export type AutomationRole = z.infer<typeof AutomationRoleEnum>
export const AgentRoleEnum = AutomationRoleEnum
export type AgentRole = AutomationRole

export const CompanyTypeEnum = z.enum(["broker", "developer", "investment"])
export type CompanyType = z.infer<typeof CompanyTypeEnum>

export const OutputChannelEnum = z.enum(["whatsapp", "call_script", "investor_memo", "crm_summary"])
export type OutputChannel = z.infer<typeof OutputChannelEnum>

export const TonePresetEnum = z.enum(["calm", "direct", "premium", "friendly", "executive"])
export type TonePreset = z.infer<typeof TonePresetEnum>

export const InputFieldTypeEnum = z.enum(["text", "number", "select", "phone", "email", "currency"])
export type InputFieldType = z.infer<typeof InputFieldTypeEnum>

export const RuleConstraintEnum = z.enum([
  "require_budget",
  "require_timeline",
  "strict_inventory_only",
  "ask_missing_contact",
  "prioritize_ready",
  "avoid_speculative",
  "consent_required",
])
export type RuleConstraint = z.infer<typeof RuleConstraintEnum>

export const InputFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: InputFieldTypeEnum,
  required: z.boolean().default(false),
  question: z.string(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
})
export type InputField = z.infer<typeof InputFieldSchema>

export const RuleToggleSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  enabled: z.boolean().default(false),
  constraint: RuleConstraintEnum,
})
export type RuleToggle = z.infer<typeof RuleToggleSchema>

export const OutputPresetSchema = z.object({
  channels: z.array(OutputChannelEnum).min(1),
  tone: TonePresetEnum,
  summaryStyle: z.enum(["short", "balanced", "detailed"]).default("balanced"),
})
export type OutputPreset = z.infer<typeof OutputPresetSchema>

export const AgentDefinitionSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  name: z.string(),
  role: AgentRoleEnum,
  market: z.string(),
  companyType: CompanyTypeEnum,
  inputs: z.object({
    fields: z.array(InputFieldSchema),
  }),
  rules: z.object({
    strictMode: z.boolean().default(true),
    toggles: z.array(RuleToggleSchema),
  }),
  outputs: OutputPresetSchema,
  connectors: z.object({
    listings: z.boolean().default(true),
    projects: z.boolean().default(true),
    marketIntel: z.boolean().default(true),
    crm: z.boolean().default(false),
  }),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().default(1),
  shareId: z.string().optional(),
})
export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>

export const AgentTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  role: AgentRoleEnum,
  defaultDefinition: z.object({
    market: z.string(),
    companyType: CompanyTypeEnum,
    inputs: z.object({
      fields: z.array(InputFieldSchema),
    }),
    rules: z.object({
      strictMode: z.boolean(),
      toggles: z.array(RuleToggleSchema),
    }),
    outputs: OutputPresetSchema,
    connectors: z.object({
      listings: z.boolean(),
      projects: z.boolean(),
      marketIntel: z.boolean(),
      crm: z.boolean(),
    }),
  }),
  sampleConversation: z.array(z.object({ role: z.enum(["user", "agent"]), message: z.string() })),
  sampleOutput: z.record(z.string(), z.string()),
})
export type AgentTemplate = z.infer<typeof AgentTemplateSchema>

export const AgentVersionSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  version: z.number(),
  definition: AgentDefinitionSchema,
  createdAt: z.string(),
  createdBy: z.string(),
})
export type AgentVersion = z.infer<typeof AgentVersionSchema>

export const AgentRunSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  version: z.number(),
  status: z.enum(["queued", "running", "completed", "failed"]),
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
})
export type AgentRun = z.infer<typeof AgentRunSchema>

export const AgentMessageSchema = z.object({
  id: z.string(),
  runId: z.string(),
  role: z.enum(["user", "agent", "system"]),
  content: z.string(),
  createdAt: z.string(),
})
export type AgentMessage = z.infer<typeof AgentMessageSchema>

export const ConnectorSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["listings", "projects", "market_intel", "crm"]),
  description: z.string(),
  enabled: z.boolean().default(true),
})
export type Connector = z.infer<typeof ConnectorSchema>

export const ConnectorCredentialSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  connectorId: z.string(),
  status: z.enum(["active", "inactive"]),
  config: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
})
export type ConnectorCredential = z.infer<typeof ConnectorCredentialSchema>

export const KnowledgeSourceSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  name: z.string(),
  type: z.enum(["url", "document", "manual"]),
  config: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
})
export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>

export const RuleSetSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  strictMode: z.boolean(),
  toggles: z.array(RuleToggleSchema),
})
export type RuleSet = z.infer<typeof RuleSetSchema>
