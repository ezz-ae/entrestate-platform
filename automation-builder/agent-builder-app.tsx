"use client"

import { useEffect, useMemo, useState } from "react"
import { AgentWizard } from "@/automation-builder/components/agent-wizard"
import { AgentLibrary } from "@/automation-builder/components/agent-library"
import { AgentPreview } from "@/automation-builder/components/agent-preview"
import { AgentTestPanel } from "@/automation-builder/components/agent-test-panel"
import { ProCanvas } from "@/automation-builder/components/pro-canvas"
import { RunActivity } from "@/automation-builder/components/run-activity"
import { StudioOperations } from "@/automation-builder/components/studio-operations"
import { Button } from "@/automation-builder/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/automation-builder/components/ui/tabs"
import { Separator } from "@/automation-builder/components/ui/separator"
import {
  Activity,
  Blocks,
  Bot,
  ChevronRight,
  LayoutDashboard,
  Lock,
  Network,
  ShieldCheck,
} from "lucide-react"
import type { AgentDefinition, AgentRun, AgentTemplate } from "@/automation-builder/lib/automation-types"
import type { AgentDraft } from "@/automation-builder/lib/draft"
import { buildDraftFromTemplate } from "@/automation-builder/lib/draft"
import {
  cloneAgent,
  createAgent,
  createVersion,
  fetchAgents,
  fetchRuns,
  fetchTemplates,
  publishAgent,
  shareAgent,
  updateAgent,
} from "@/automation-builder/lib/client"

const emptyDraft: AgentDraft = {
  name: "New agent",
  role: "lead_qualifier",
  market: "UAE",
  companyType: "broker",
  inputs: { fields: [] },
  rules: { strictMode: true, toggles: [] },
  outputs: { channels: ["whatsapp"], tone: "friendly", summaryStyle: "balanced" },
  connectors: { listings: true, projects: true, marketIntel: true, crm: false },
}

export default function AgentBuilderApp() {
  const [activeTab, setActiveTab] = useState("builder")
  const [mode, setMode] = useState<"easy" | "pro">("easy")
  const [editablePro, setEditablePro] = useState(false)
  const [step, setStep] = useState(1)
  const [templates, setTemplates] = useState<AgentTemplate[]>([])
  const [agents, setAgents] = useState<AgentDefinition[]>([])
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [draft, setDraft] = useState<AgentDraft>(emptyDraft)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [templateResponse, agentResponse, runResponse] = await Promise.all([
        fetchTemplates(),
        fetchAgents(),
        fetchRuns(),
      ])

      if (cancelled) return

      setTemplates(templateResponse.templates)
      setAgents(agentResponse.agents)
      setRuns(runResponse.runs)

      if (templateResponse.templates[0]) {
        const template = templateResponse.templates[0]
        setSelectedTemplateId(template.id)
        setDraft(buildDraftFromTemplate(template))
      }
    }

    load().catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) ||
      templates.find((template) => template.role === draft.role) ||
      null,
    [draft.role, selectedTemplateId, templates],
  )

  const activeAgents = useMemo(() => agents.filter((agent) => agent.status === "active"), [agents])
  const enabledConnectorCount = useMemo(
    () => agents.reduce((sum, agent) => sum + Object.values(agent.connectors).filter(Boolean).length, 0),
    [agents],
  )

  const handleSelectTemplate = (template: AgentTemplate) => {
    setActiveTab("builder")
    setSelectedTemplateId(template.id)
    setDraft(buildDraftFromTemplate(template))
    setStep(2)
    setActiveAgentId(null)
  }

  const handleSelectAgent = (agent: AgentDefinition) => {
    setActiveTab("builder")
    setStep(2)
    setActiveAgentId(agent.id)
    setSelectedTemplateId(templates.find((template) => template.role === agent.role)?.id || null)
    setDraft({
      name: agent.name,
      role: agent.role,
      market: agent.market,
      companyType: agent.companyType,
      inputs: agent.inputs,
      rules: agent.rules,
      outputs: agent.outputs,
      connectors: agent.connectors,
      status: agent.status,
    })
  }

  const refreshAgents = async () => {
    const agentResponse = await fetchAgents()
    setAgents(agentResponse.agents)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (activeAgentId) {
        const response = await updateAgent(activeAgentId, draft)
        setActiveAgentId(response.agent.id)
        await createVersion(response.agent.id)
      } else {
        const response = await createAgent({
          ...draft,
          status: "draft",
        })
        setActiveAgentId(response.agent.id)
      }
      await refreshAgents()
    } finally {
      setIsSaving(false)
    }
  }

  const handleEnsureAgent = async () => {
    if (activeAgentId) return activeAgentId
    const response = await createAgent({
      ...draft,
      status: "draft",
    })
    setActiveAgentId(response.agent.id)
    await refreshAgents()
    return response.agent.id
  }

  const handleRunComplete = (run: AgentRun) => {
    setRuns((current) => [run, ...current.filter((existingRun) => existingRun.id !== run.id)])
  }

  const openAgentInBuilder = (agentId: string) => {
    const agent = agents.find((item) => item.id === agentId)
    if (!agent) return
    handleSelectAgent(agent)
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#020617] text-slate-50 selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[35%] w-[35%] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] h-[30%] w-[30%] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-slate-800 bg-slate-950/70 px-8 py-6 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="max-w-2xl">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-blue-300">
                  <Lock className="h-3 w-3" />
                  Agent Builder
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">Build working real estate agents</h1>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Start from a live template, set rule gates, test against connected data, and publish a version your
                  team can actually use.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Templates</p>
                <p className="mt-2 text-2xl font-semibold text-white">{templates.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Configured agents</p>
                <p className="mt-2 text-2xl font-semibold text-white">{agents.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Executed runs</p>
                <p className="mt-2 text-2xl font-semibold text-white">{runs.length}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-12 rounded-xl border border-slate-800 bg-slate-950/60 p-1">
                <TabsTrigger
                  value="builder"
                  className="gap-2 px-6 text-[10px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Builder
                </TabsTrigger>
                <TabsTrigger
                  value="runs"
                  className="gap-2 px-6 text-[10px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                >
                  <Activity className="h-3.5 w-3.5" />
                  Runs
                </TabsTrigger>
                <TabsTrigger
                  value="operations"
                  className="gap-2 px-6 text-[10px] font-bold uppercase tracking-[0.2em] data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                >
                  <Network className="h-3.5 w-3.5" />
                  Operations
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-950/60 px-4 py-2 text-xs text-slate-400">
                <Bot className="h-4 w-4 text-slate-500" />
                <span>{activeAgents.length} published</span>
                <Separator orientation="vertical" className="h-4 bg-slate-800" />
                <span>{enabledConnectorCount} connectors enabled</span>
              </div>

              {activeTab === "builder" && (
                <Tabs value={mode} onValueChange={(value) => setMode(value as "easy" | "pro")}>
                  <TabsList className="rounded-lg border border-slate-800 bg-slate-950/40 p-1">
                    <TabsTrigger value="easy" className="px-4 text-[10px] font-bold uppercase tracking-widest">
                      Guided
                    </TabsTrigger>
                    <TabsTrigger value="pro" className="px-4 text-[10px] font-bold uppercase tracking-widest">
                      Canvas
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-8 py-12">
        {activeTab === "builder" &&
          (mode === "easy" ? (
            <div className="grid grid-cols-1 gap-12 xl:grid-cols-[1.4fr_0.6fr]">
              <div className="space-y-12">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 backdrop-blur-xl">
                  <AgentWizard
                    step={step}
                    onStepChange={setStep}
                    templates={templates}
                    selectedTemplateId={selectedTemplateId}
                    draft={draft}
                    onDraftChange={setDraft}
                    onSelectTemplate={handleSelectTemplate}
                  />
                </div>

                <div className="flex items-center gap-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 backdrop-blur-xl">
                  <div className="rounded-2xl bg-emerald-500/20 p-3">
                    <Blocks className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-white">Builder state is ready</p>
                    <p className="text-sm text-slate-400">
                      Save this agent, then publish from the library once the run output matches your operating rules.
                    </p>
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex h-12 items-center gap-2 rounded-xl bg-emerald-500 px-8 font-bold text-slate-950 transition-all hover:bg-emerald-600"
                  >
                    {isSaving ? "Saving..." : activeAgentId ? "Save changes" : "Save draft"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-10">
                <AgentLibrary
                  agents={agents}
                  selectedAgentId={activeAgentId}
                  onSelect={handleSelectAgent}
                  onCreate={() => {
                    setActiveTab("builder")
                    setStep(1)
                    if (templates[0]) {
                      handleSelectTemplate(templates[0])
                    } else {
                      setDraft(emptyDraft)
                    }
                    setActiveAgentId(null)
                  }}
                  onClone={async (id) => {
                    await cloneAgent(id)
                    await refreshAgents()
                  }}
                  onShare={async (id) => {
                    await shareAgent(id)
                    await refreshAgents()
                  }}
                  onPublish={async (id) => {
                    await publishAgent(id)
                    await refreshAgents()
                  }}
                />
                <AgentPreview draft={draft} />
                <AgentTestPanel
                  draft={draft}
                  activeAutomationId={activeAgentId}
                  template={selectedTemplate}
                  onEnsureAutomation={handleEnsureAgent}
                  onRunComplete={handleRunComplete}
                />
              </div>
            </div>
          ) : (
            <ProCanvas editable={editablePro} onToggleEdit={() => setEditablePro((prev) => !prev)} />
          ))}

        {activeTab === "runs" && <RunActivity agents={agents} runs={runs} onOpenAgent={openAgentInBuilder} />}
        {activeTab === "operations" && (
          <StudioOperations
            templates={templates}
            agents={agents}
            runs={runs}
            onOpenAgent={openAgentInBuilder}
          />
        )}
      </main>
    </div>
  )
}
