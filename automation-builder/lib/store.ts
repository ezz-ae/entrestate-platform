import { nanoid } from "nanoid"
import type {
  AgentDefinition,
  AgentTemplate,
  AgentVersion,
  AgentRun,
  Connector,
  ConnectorCredential,
} from "./automation-types"
import { agentTemplates } from "./templates"
import { logAuditEvent } from "./audit-log"

type TeamStore = {
  agents: Map<string, AgentDefinition>
  versions: Map<string, AgentVersion[]>
  runs: Map<string, AgentRun>
  credentials: Map<string, ConnectorCredential>
}

const storeByTeam = new Map<string, TeamStore>()

function getTeamStore(teamId: string): TeamStore {
  if (!storeByTeam.has(teamId)) {
    storeByTeam.set(teamId, {
      agents: new Map(),
      versions: new Map(),
      runs: new Map(),
      credentials: new Map(),
    })
  }
  return storeByTeam.get(teamId)!
}

export function listTemplates(): AgentTemplate[] {
  return agentTemplates
}

export function getTemplate(id: string): AgentTemplate | undefined {
  return agentTemplates.find((template) => template.id === id)
}

export function listAgents(teamId: string): AgentDefinition[] {
  return Array.from(getTeamStore(teamId).agents.values())
}

export function getAgent(teamId: string, id: string): AgentDefinition | undefined {
  return getTeamStore(teamId).agents.get(id)
}

export function createAgent(teamId: string, definition: Omit<AgentDefinition, "id" | "teamId" | "createdAt" | "updatedAt" | "version">) {
  const now = new Date().toISOString()
  const agent: AgentDefinition = {
    ...definition,
    id: `agent_${nanoid(8)}`,
    teamId,
    createdAt: now,
    updatedAt: now,
    version: 1,
    status: definition.status || "draft",
  }

  const teamStore = getTeamStore(teamId)
  teamStore.agents.set(agent.id, agent)
  teamStore.versions.set(agent.id, [
    {
      id: `version_${nanoid(8)}`,
      agentId: agent.id,
      version: 1,
      definition: agent,
      createdAt: now,
      createdBy: "system",
    },
  ])

  return agent
}

export function updateAgent(teamId: string, id: string, patch: Partial<AgentDefinition>) {
  const teamStore = getTeamStore(teamId)
  const current = teamStore.agents.get(id)
  if (!current) return undefined

  const updated: AgentDefinition = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  teamStore.agents.set(id, updated)
  return updated
}

export function deleteAgent(teamId: string, id: string) {
  const teamStore = getTeamStore(teamId)
  teamStore.agents.delete(id)
  teamStore.versions.delete(id)
  return true
}

export function createVersion(teamId: string, id: string) {
  const teamStore = getTeamStore(teamId)
  const agent = teamStore.agents.get(id)
  if (!agent) return undefined

  const versions = teamStore.versions.get(id) || []
  const nextVersion = versions.length + 1
  const version: AgentVersion = {
    id: `version_${nanoid(8)}`,
    agentId: id,
    version: nextVersion,
    definition: { ...agent, version: nextVersion },
    createdAt: new Date().toISOString(),
    createdBy: "system",
  }
  teamStore.versions.set(id, [...versions, version])
  teamStore.agents.set(id, { ...agent, version: nextVersion })
  return version
}

export function listVersions(teamId: string, id: string) {
  return getTeamStore(teamId).versions.get(id) || []
}

export function cloneAgent(teamId: string, id: string) {
  const agent = getAgent(teamId, id)
  if (!agent) return undefined
  return createAgent(teamId, {
    ...agent,
    name: `${agent.name} (Copy)`,
    status: "draft",
  })
}

export function shareAgent(teamId: string, id: string) {
  const agent = getAgent(teamId, id)
  if (!agent) return undefined
  const shareId = `share_${nanoid(10)}`
  const updated = updateAgent(teamId, id, { shareId })
  return updated?.shareId
}

export function saveRun(teamId: string, run: AgentRun) {
  const teamStore = getTeamStore(teamId)
  teamStore.runs.set(run.id, run)
  logAuditEvent({
    teamId,
    action: "agent.run.completed",
    agentId: run.agentId,
    runId: run.id,
    metadata: { status: run.status },
  })
  return run
}

export function getRun(teamId: string, id: string) {
  return getTeamStore(teamId).runs.get(id)
}

export function listRuns(teamId: string, agentId?: string) {
  const runs = Array.from(getTeamStore(teamId).runs.values())
  return agentId ? runs.filter((run) => run.agentId === agentId) : runs
}

export function listConnectors(): Connector[] {
  return [
    {
      id: "listings",
      name: "Listings Connector",
      type: "listings",
      description: "Verified inventory feed from Entrestate.",
      enabled: true,
    },
    {
      id: "projects",
      name: "Projects Connector",
      type: "projects",
      description: "Project-level data for off-plan and ready assets.",
      enabled: true,
    },
    {
      id: "market_intel",
      name: "Market Intelligence Connector",
      type: "market_intel",
      description: "Risk, pricing, and delivery confidence signals.",
      enabled: true,
    },
    {
      id: "crm",
      name: "CRM Connector",
      type: "crm",
      description: "Push summaries and notes into your CRM.",
      enabled: true,
    },
  ]
}

export function saveCredential(teamId: string, credential: ConnectorCredential) {
  const teamStore = getTeamStore(teamId)
  teamStore.credentials.set(credential.id, credential)
  return credential
}

export function listCredentials(teamId: string) {
  return Array.from(getTeamStore(teamId).credentials.values())
}
