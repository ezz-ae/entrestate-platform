import type {
  AgentDefinition,
  AgentRun,
  OutputChannel,
  RuleToggle,
} from "@/automation-builder/lib/automation-types"
import { getConnectorByType } from "@/automation-builder/lib/connectors/registry"
import type { ConnectorQuery } from "@/automation-builder/lib/connectors/types"
import { nanoid } from "nanoid"

type RunInput = {
  message?: string
  inputs?: Record<string, string>
}

type RunOutput = {
  followUpQuestions: string[]
  classification: string
  summary: string
  outputs: Record<OutputChannel, string>
  dataNotes: string[]
}

const OUTPUT_LABELS: Record<OutputChannel, string> = {
  whatsapp: "WhatsApp reply",
  call_script: "Call script",
  investor_memo: "Investor memo",
  crm_summary: "CRM summary",
}

function resolveMissingInputs(definition: AgentDefinition, inputs: Record<string, string>) {
  return definition.inputs.fields.filter((field) => field.required && !inputs[field.id])
}

function sanitizeInputs(inputs: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(inputs).map(([key, value]) => [
      key,
      typeof value === "string" ? value.replace(/[^\x20-\x7E]/g, "").slice(0, 500).trim() : value,
    ]),
  ) as Record<string, string>
}

function ruleEnabled(toggles: RuleToggle[], constraint: RuleToggle["constraint"]) {
  return toggles.find((toggle) => toggle.constraint === constraint)?.enabled ?? false
}

function buildFollowUps(definition: AgentDefinition, inputs: Record<string, string>) {
  const missing = resolveMissingInputs(definition, inputs)
  const followUps = missing.map((field) => field.question)
  if (ruleEnabled(definition.rules.toggles, "consent_required")) {
    if (!inputs.contact_consent) {
      followUps.push("Do we have your permission to follow up by phone or WhatsApp?")
    }
  }
  return followUps
}

function buildClassification(definition: AgentDefinition, inputs: Record<string, string>) {
  if (definition.role === "lead_qualifier") {
    return inputs.timeline?.includes("0-3") ? "Ready" : "Warming"
  }
  if (definition.role === "buyer_matcher") {
    return inputs.ready?.includes("Ready") ? "Ready" : "Exploring"
  }
  return inputs.risk_tolerance ? `${inputs.risk_tolerance} investor` : "Investor"
}

function buildSummary(definition: AgentDefinition, inputs: Record<string, string>) {
  const keyPoints = definition.inputs.fields
    .map((field) => (inputs[field.id] ? `${field.label}: ${inputs[field.id]}` : null))
    .filter(Boolean)
    .slice(0, 4)

  return keyPoints.length > 0 ? keyPoints.join(" · ") : "Key details pending."
}

function formatOutput(definition: AgentDefinition, base: string, output: OutputChannel) {
  switch (output) {
    case "whatsapp":
      return `${base} Let me know if anything should be adjusted.`
    case "call_script":
      return `Opening: ${base}\nNext: Confirm timeline and preferred community.\nClose: Offer two verified options.`
    case "investor_memo":
      return `Executive Summary\n${base}\n\nStrategy\nFocus on verified inventory with stable pricing.\n\nRisks\nMonitor delivery delays and price pressure.`
    case "crm_summary":
      return `Summary: ${base}\nNext step: confirm missing details and schedule follow-up.`
  }
}

export async function executeAgentRun(definition: AgentDefinition, input: RunInput): Promise<AgentRun & RunOutput> {
  const inputs = sanitizeInputs(input.inputs ?? {})
  const followUps = buildFollowUps(definition, inputs)
  const classification = buildClassification(definition, inputs)
  const summary = buildSummary(definition, inputs)

  const strictMode = definition.rules.strictMode
  const dataNotes: string[] = []

  const connectorQuery: ConnectorQuery = {
    market: definition.market,
    city: inputs.preferred_area || inputs.area || inputs.city,
    budget: inputs.budget_range ? Number(inputs.budget_range) : inputs.budget ? Number(inputs.budget) : undefined,
    bedrooms: inputs.bedrooms,
    timeline: inputs.timeline || inputs.ready,
    riskTolerance: inputs.risk_tolerance,
  }

  if (definition.connectors.listings) {
    const connector = getConnectorByType("listings")
    if (connector) {
      const result = await connector.query(connectorQuery, { teamId: definition.teamId, strictMode })
      dataNotes.push(result.summary)
    }
  }

  if (definition.connectors.marketIntel) {
    const connector = getConnectorByType("market_intel")
    if (connector) {
      const result = await connector.query(connectorQuery, { teamId: definition.teamId, strictMode })
      dataNotes.push(result.summary)
    }
  }

  if (strictMode && ruleEnabled(definition.rules.toggles, "strict_inventory_only") && dataNotes.length === 0) {
    followUps.push("I need a few more details to match verified inventory.")
  }

  const base = followUps.length > 0
    ? `${summary}. I need a bit more detail: ${followUps.join(" ")}`
    : `${summary}. ${classification} lead based on the current details.`

  const outputs = definition.outputs.channels.reduce((acc, channel) => {
    acc[channel] = formatOutput(definition, base, channel)
    return acc
  }, {} as Record<OutputChannel, string>)

  const now = new Date().toISOString()

  return {
    id: `run_${nanoid(8)}`,
    agentId: definition.id,
    version: definition.version,
    status: "completed",
    input: input as Record<string, unknown>,
    output: { outputs, summary, classification, followUps, dataNotes },
    createdAt: now,
    completedAt: now,
    followUpQuestions: followUps,
    classification,
    summary,
    outputs,
    dataNotes,
  }
}
