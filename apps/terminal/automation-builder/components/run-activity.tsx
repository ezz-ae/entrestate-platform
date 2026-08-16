"use client"

import type { AgentDefinition, AgentRun } from "@/automation-builder/lib/automation-types"
import { Button } from "@/automation-builder/components/ui/button"
import { Badge } from "@/automation-builder/components/ui/badge"
import { Card } from "@/automation-builder/components/ui/card"
import { Activity, Bot, CheckCircle2, Clock3, PlayCircle, XCircle } from "lucide-react"

type RunActivityProps = {
  agents: AgentDefinition[]
  runs: AgentRun[]
  onOpenAgent?: (agentId: string) => void
}

type RunOutputSnapshot = {
  summary?: string
  classification?: string
  outputs?: Record<string, string>
}

function formatTimestamp(value?: string) {
  if (!value) return "No runs yet"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatRole(role: AgentDefinition["role"]) {
  return role.split("_").join(" ")
}

function getRunOutput(run: AgentRun): RunOutputSnapshot {
  if (!run.output || typeof run.output !== "object") return {}

  const summary = typeof run.output.summary === "string" ? run.output.summary : undefined
  const classification = typeof run.output.classification === "string" ? run.output.classification : undefined
  const outputs =
    run.output.outputs && typeof run.output.outputs === "object"
      ? Object.fromEntries(
          Object.entries(run.output.outputs).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
        )
      : undefined

  return { summary, classification, outputs }
}

export function RunActivity({ agents, runs, onOpenAgent }: RunActivityProps) {
  const sortedRuns = [...runs].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const completedRuns = sortedRuns.filter((run) => run.status === "completed")
  const failedRuns = sortedRuns.filter((run) => run.status === "failed")
  const latestRun = sortedRuns[0]
  const completionRate = sortedRuns.length > 0 ? Math.round((completedRuns.length / sortedRuns.length) * 100) : 0
  const agentById = new Map(agents.map((agent) => [agent.id, agent]))

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Executed runs</p>
            <PlayCircle className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{sortedRuns.length}</p>
          <p className="mt-2 text-sm text-slate-400">Every test run and published execution lands here.</p>
        </Card>
        <Card className="border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Completion rate</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{completionRate}%</p>
          <p className="mt-2 text-sm text-slate-400">{failedRuns.length} failed runs across the current team state.</p>
        </Card>
        <Card className="border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Latest execution</p>
            <Clock3 className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-4 text-xl font-semibold text-white">{formatTimestamp(latestRun?.createdAt)}</p>
          <p className="mt-2 text-sm text-slate-400">
            {latestRun ? agentById.get(latestRun.agentId)?.name || "Unknown agent" : "Run a test from Builder to create activity."}
          </p>
        </Card>
        <Card className="border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Agents with activity</p>
            <Activity className="h-4 w-4 text-cyan-300" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{new Set(sortedRuns.map((run) => run.agentId)).size}</p>
          <p className="mt-2 text-sm text-slate-400">Connected to {agents.length} configured agents in the library.</p>
        </Card>
      </div>

      <Card className="border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Run log</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Recent execution activity</h2>
            <p className="mt-2 text-sm text-slate-400">This is live history from the builder API, not placeholder telemetry.</p>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            {completedRuns.length} completed
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {sortedRuns.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
              No runs yet. Open Builder, test an agent, and this panel will populate with real output summaries.
            </div>
          )}

          {sortedRuns.map((run) => {
            const agent = agentById.get(run.agentId)
            const output = getRunOutput(run)
            const outputCount = output.outputs ? Object.keys(output.outputs).length : 0

            return (
              <div
                key={run.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 transition-colors hover:border-slate-700"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-slate-700 bg-slate-900 text-[11px] uppercase tracking-[0.2em] text-slate-300"
                      >
                        {run.status}
                      </Badge>
                      {output.classification && (
                        <Badge className="bg-blue-500/10 text-blue-200 hover:bg-blue-500/10">{output.classification}</Badge>
                      )}
                      <span className="text-xs text-slate-500">{formatTimestamp(run.createdAt)}</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{agent?.name || run.agentId}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {agent ? `${formatRole(agent.role)} · v${run.version}` : "Agent definition unavailable"}
                      </p>
                    </div>
                    <p className="max-w-3xl text-sm leading-6 text-slate-300">
                      {output.summary || "Run completed without a preview summary."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Inputs</p>
                        <p className="mt-1 font-medium text-white">{Object.keys(run.input || {}).length}</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Outputs</p>
                        <p className="mt-1 font-medium text-white">{outputCount}</p>
                      </div>
                    </div>
                    {agent && onOpenAgent && (
                      <Button variant="outline" size="sm" onClick={() => onOpenAgent(agent.id)}>
                        <Bot className="mr-2 h-4 w-4" />
                        Open agent
                      </Button>
                    )}
                  </div>
                </div>
                {run.error && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    <XCircle className="h-4 w-4" />
                    {run.error}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
