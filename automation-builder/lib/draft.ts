import type { AutomationDefinition, AutomationTemplate } from "./automation-types"

export type AutomationDraft = Omit<
  AutomationDefinition,
  "id" | "teamId" | "createdAt" | "updatedAt" | "version" | "status" | "shareId"
> & { status?: AutomationDefinition["status"] }
export type AgentDraft = AutomationDraft

export function buildDraftFromTemplate(template: AutomationTemplate): AutomationDraft {
  return {
    name: template.name,
    role: template.role,
    market: template.defaultDefinition.market,
    companyType: template.defaultDefinition.companyType,
    inputs: template.defaultDefinition.inputs,
    rules: template.defaultDefinition.rules,
    outputs: template.defaultDefinition.outputs,
    connectors: template.defaultDefinition.connectors,
    status: "draft",
  }
}
