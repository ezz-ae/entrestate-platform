import type { AgentDefinition, AgentTemplate, AgentRun } from "./automation-types"

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return res.json() as Promise<T>
}

export async function fetchTemplates() {
  return getJson<{ templates: AgentTemplate[] }>("/api/automation-builder/templates")
}

export async function fetchAgents() {
  return getJson<{ agents: AgentDefinition[] }>("/api/automation-builder/agents")
}

export async function fetchRuns(agentId?: string) {
  const search = agentId ? `?agentId=${encodeURIComponent(agentId)}` : ""
  return getJson<{ runs: AgentRun[] }>(`/api/automation-builder/runs${search}`)
}

export async function createAgent(payload: Omit<AgentDefinition, "id" | "teamId" | "createdAt" | "updatedAt" | "version">) {
  return getJson<{ agent: AgentDefinition }>("/api/automation-builder/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function updateAgent(id: string, payload: Partial<AgentDefinition>) {
  return getJson<{ agent: AgentDefinition }>(`/api/automation-builder/agents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function cloneAgent(id: string) {
  return getJson<{ agent: AgentDefinition }>(`/api/automation-builder/agents/${id}/clone`, { method: "POST" })
}

export async function shareAgent(id: string) {
  return getJson<{ shareId: string }>(`/api/automation-builder/agents/${id}/share`, { method: "POST" })
}

export async function publishAgent(id: string) {
  return getJson<{ agent: AgentDefinition }>(`/api/automation-builder/agents/${id}/publish`, { method: "POST" })
}

export async function createVersion(id: string) {
  return getJson<{ version: { id: string } }>(`/api/automation-builder/agents/${id}/versions`, { method: "POST" })
}

export async function createRun(agentId: string, input: Record<string, string>) {
  return getJson<{ run: AgentRun }>("/api/automation-builder/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, input }),
  })
}
