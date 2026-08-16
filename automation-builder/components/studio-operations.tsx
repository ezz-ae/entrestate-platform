"use client"

import type { AgentDefinition, AgentRun, AgentTemplate } from "@/automation-builder/lib/automation-types"
import { Button } from "@/automation-builder/components/ui/button"
import { Badge } from "@/automation-builder/components/ui/badge"
import { Card } from "@/automation-builder/components/ui/card"
import { Blocks, Bot, Cable, ChevronRight, Database, GitBranch, ShieldCheck } from "lucide-react"

type StudioOperationsProps = {
  templates: AgentTemplate[]
  agents: AgentDefinition[]
  runs: AgentRun[]
  onOpenAgent?: (agentId: string) => void
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split("_")
    .join(" ")
    .toLowerCase()
}

export function StudioOperations({ templates, agents, runs, onOpenAgent }: StudioOperationsProps) {
  const sortedAgents = [...agents].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  const activeAgents = sortedAgents.filter((agent) => agent.status === "active")
  const crmConnectedAgents = sortedAgents.filter((agent) => agent.connectors.crm)
  const sharedAgents = sortedAgents.filter((agent) => Boolean(agent.shareId))
  const totalConnectors = sortedAgents.reduce(
    (sum, agent) => sum + Object.values(agent.connectors).filter(Boolean).length,
    0,
  )

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Template base</p>
            <Blocks className="h-4 w-4 text-cyan-300" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{templates.length}</p>
          <p className="mt-2 text-sm text-slate-400">Lead, buyer, and investor flows ready to configure.</p>
        </Card>
        <Card className="border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Published agents</p>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{activeAgents.length}</p>
          <p className="mt-2 text-sm text-slate-400">Agents your team can actually deploy right now.</p>
        </Card>
        <Card className="border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">CRM-connected</p>
            <Cable className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{crmConnectedAgents.length}</p>
          <p className="mt-2 text-sm text-slate-400">{totalConnectors} connector switches enabled across the library.</p>
        </Card>
        <Card className="border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Shared builds</p>
            <GitBranch className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{sharedAgents.length}</p>
          <p className="mt-2 text-sm text-slate-400">{runs.length} live runs recorded against the current team state.</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Agent inventory</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Configured agents</h2>
            </div>
            <div className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              {sortedAgents.length} total
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {sortedAgents.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
                No configured agents yet. Start from a template in Builder and save the first draft.
              </div>
            )}

            {sortedAgents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 transition-colors hover:border-slate-700"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={agent.status === "active" ? "default" : "secondary"}
                        className={
                          agent.status === "active"
                            ? "bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/10"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-800"
                        }
                      >
                        {agent.status}
                      </Badge>
                      <span className="text-xs text-slate-500">v{agent.version}</span>
                      {agent.shareId && <span className="text-xs text-slate-500">share enabled</span>}
                    </div>

                    <div>
                      <p className="text-lg font-semibold text-white">{agent.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatLabel(agent.role)} · {agent.companyType} · {agent.market}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {agent.outputs.channels.map((channel) => (
                        <span
                          key={channel}
                          className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-slate-300"
                        >
                          {formatLabel(channel)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 lg:text-right">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Updated</p>
                      <p className="mt-1 text-sm font-medium text-white">{formatTimestamp(agent.updatedAt)}</p>
                    </div>
                    {onOpenAgent && (
                      <Button variant="outline" size="sm" onClick={() => onOpenAgent(agent.id)}>
                        <Bot className="mr-2 h-4 w-4" />
                        Edit in builder
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {Object.entries(agent.connectors).map(([key, enabled]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-400">{formatLabel(key)}</span>
                      <span className={enabled ? "text-emerald-300" : "text-slate-600"}>
                        {enabled ? "Connected" : "Off"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-blue-300" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Template pack</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Starting points</h3>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{template.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{template.description}</p>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-slate-800 bg-slate-900/40 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">What this page now does</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                Configure inputs, rule gates, connectors, and delivery channels in one workspace.
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                Test against live builder execution and capture run summaries immediately.
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                Publish versions and manage the live agent library without leaving the page.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
