"use client"

import { useMemo, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Loader2, Save, PlayCircle, BarChart3 } from "lucide-react"
import { ProjectCard } from "@/components/decision/project-card"
import { getSimulatedProjects } from "@/lib/profile/simulation"
import {
  DEFAULT_COMPREHENSIVE_PROFILE,
  getComprehensiveProfileFromSignals,
  withComprehensiveProfile,
} from "@/lib/profile/comprehensive"
import type {
  ComprehensiveProfile,
  ComprehensiveProfileCapabilityKey,
  ComprehensiveProfileIntegrationKey,
  ComprehensiveProfileOutputKey,
  ComprehensiveProfileReportAudience,
  UserProfile,
} from "@/lib/profile/types"

const capabilityOptions: Array<{ key: ComprehensiveProfileCapabilityKey; label: string }> = [
  { key: "reportExtraction", label: "Report extraction" },
  { key: "apiFeeding", label: "User API feeding" },
  { key: "clientMemory", label: "Client memory" },
  { key: "clientSpecificReport", label: "Client-specific reports" },
  { key: "socialNetworkReport", label: "Social network reports" },
  { key: "highLevelInsights", label: "High-level insights" },
]

const integrationOptions: Array<{ key: ComprehensiveProfileIntegrationKey; label: string }> = [
  { key: "chatgpt", label: "ChatGPT" },
  { key: "gemini", label: "Gemini" },
  { key: "googleDrive", label: "Google Drive" },
  { key: "customGpts", label: "Custom GPTs" },
  { key: "notebookLM", label: "NotebookLM" },
]

const outputOptions: Array<{ key: ComprehensiveProfileOutputKey; label: string }> = [
  { key: "json", label: "JSON" },
  { key: "pdf", label: "PDF" },
  { key: "brandedFiles", label: "Branded files" },
]

const clientTypeOptions = ["Investors", "Brokers", "Developers", "Family Offices", "Agencies"]
const reportAudienceOptions: ComprehensiveProfileReportAudience[] = ["client", "social", "investor", "executive"]

export default function StrategicProfileEditor({ initialProfile, disabled }: { initialProfile: UserProfile; disabled?: boolean }) {
  const [profile, setProfile] = useState<UserProfile>({
    userId: initialProfile.userId ?? "",
    riskBias: typeof initialProfile.riskBias === "number" ? initialProfile.riskBias : 0.65,
    yieldVsSafety: typeof initialProfile.yieldVsSafety === "number" ? initialProfile.yieldVsSafety : 0.5,
    horizon: initialProfile.horizon ?? "Ready",
    preferredMarkets: Array.isArray(initialProfile.preferredMarkets) ? initialProfile.preferredMarkets : [],
    inferredSignals: initialProfile.inferredSignals ?? null,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [simulationMode, setSimulationMode] = useState(false)

  const comprehensiveProfile = useMemo(
    () => getComprehensiveProfileFromSignals(profile.inferredSignals),
    [profile.inferredSignals],
  )

  const simulatedProjects = useMemo(() => getSimulatedProjects(profile), [profile])

  const updateComprehensiveProfile = (next: ComprehensiveProfile) => {
    setProfile((prev) => ({
      ...prev,
      inferredSignals: withComprehensiveProfile(prev.inferredSignals, next),
    }))
  }

  const toggleCapability = (key: ComprehensiveProfileCapabilityKey) => {
    updateComprehensiveProfile({
      ...comprehensiveProfile,
      capabilities: {
        ...comprehensiveProfile.capabilities,
        [key]: !comprehensiveProfile.capabilities[key],
      },
    })
  }

  const toggleIntegration = (key: ComprehensiveProfileIntegrationKey) => {
    updateComprehensiveProfile({
      ...comprehensiveProfile,
      integrations: {
        ...comprehensiveProfile.integrations,
        [key]: !comprehensiveProfile.integrations[key],
      },
    })
  }

  const toggleOutput = (key: ComprehensiveProfileOutputKey) => {
    updateComprehensiveProfile({
      ...comprehensiveProfile,
      outputs: {
        ...comprehensiveProfile.outputs,
        [key]: !comprehensiveProfile.outputs[key],
      },
    })
  }

  const toggleClientType = (clientType: string) => {
    const isSelected = comprehensiveProfile.preferredClientTypes.includes(clientType)
    const nextTypes = isSelected
      ? comprehensiveProfile.preferredClientTypes.filter((item) => item !== clientType)
      : [...comprehensiveProfile.preferredClientTypes, clientType]

    updateComprehensiveProfile({
      ...comprehensiveProfile,
      preferredClientTypes: nextTypes,
    })
  }

  const addMemoryEntry = () => {
    updateComprehensiveProfile({
      ...comprehensiveProfile,
      memoryEntries: [
        ...comprehensiveProfile.memoryEntries,
        {
          id: crypto.randomUUID(),
          clientName: "",
          contextNotes: "",
          tags: [],
        },
      ],
    })
  }

  const updateMemoryEntry = (entryId: string, field: "clientName" | "contextNotes" | "tags", value: string) => {
    updateComprehensiveProfile({
      ...comprehensiveProfile,
      memoryEntries: comprehensiveProfile.memoryEntries.map((entry) => {
        if (entry.id !== entryId) {
          return entry
        }

        if (field === "tags") {
          return {
            ...entry,
            tags: value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          }
        }

        return {
          ...entry,
          [field]: value,
        }
      }),
    })
  }

  const removeMemoryEntry = (entryId: string) => {
    updateComprehensiveProfile({
      ...comprehensiveProfile,
      memoryEntries: comprehensiveProfile.memoryEntries.filter((entry) => entry.id !== entryId),
    })
  }

  const addReportTemplate = () => {
    updateComprehensiveProfile({
      ...comprehensiveProfile,
      reportTemplates: [
        ...comprehensiveProfile.reportTemplates,
        {
          id: crypto.randomUUID(),
          name: "",
          audience: "client",
          outline: "",
        },
      ],
    })
  }

  const updateReportTemplate = (
    templateId: string,
    field: "name" | "audience" | "outline",
    value: string,
  ) => {
    updateComprehensiveProfile({
      ...comprehensiveProfile,
      reportTemplates: comprehensiveProfile.reportTemplates.map((template) => {
        if (template.id !== templateId) {
          return template
        }

        if (field === "audience") {
          return {
            ...template,
            audience: value as ComprehensiveProfileReportAudience,
          }
        }

        return {
          ...template,
          [field]: value,
        }
      }),
    })
  }

  const removeReportTemplate = (templateId: string) => {
    updateComprehensiveProfile({
      ...comprehensiveProfile,
      reportTemplates: comprehensiveProfile.reportTemplates.filter((template) => template.id !== templateId),
    })
  }

  const handleSave = async () => {
    if (disabled) return
    setLoading(true)
    try {
      const comprehensiveForSave = {
        ...comprehensiveProfile,
        memoryEntries: comprehensiveProfile.memoryEntries.filter((entry) => entry.clientName.trim().length > 0),
        reportTemplates: comprehensiveProfile.reportTemplates.filter((template) => template.name.trim().length > 0),
      }

      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskBias: profile.riskBias,
          yieldVsSafety: profile.yieldVsSafety,
          horizon: profile.horizon,
          preferredMarkets: profile.preferredMarkets,
          comprehensiveProfile: comprehensiveForSave || DEFAULT_COMPREHENSIVE_PROFILE,
        }),
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error("Failed to save strategic profile:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">Risk Bias</Label>
            <Badge variant="outline" className="text-xs text-blue-400">
              {Math.round(profile.riskBias * 100)}% Market Weight
            </Badge>
          </div>
          <Slider
            value={[profile.riskBias * 100]}
            max={100}
            step={1}
            disabled={disabled}
            onValueChange={(val) => setProfile({ ...profile, riskBias: val[0] / 100 })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Aggressive (Data Density Priority)</span>
            <span>Conservative (Reliability Priority)</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground">Yield vs. Safety Bias</Label>
            <Badge variant="outline" className="text-xs text-emerald-400">
              {profile.yieldVsSafety > 0.5 ? "Yield Seeker" : "Safety Seeker"}
            </Badge>
          </div>
          <Slider
            value={[profile.yieldVsSafety * 100]}
            max={100}
            step={1}
            disabled={disabled}
            onValueChange={(val) => setProfile({ ...profile, yieldVsSafety: val[0] / 100 })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Capital Safety Priority</span>
            <span>Yield & Appreciation Priority</span>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-semibold text-foreground">Investment Horizon</Label>
          <div className="flex flex-wrap gap-2">
            {["Ready", "1-2yr", "3-5yr", "10yr+"].map((h) => (
              <button
                key={h}
                disabled={disabled}
                onClick={() => setProfile({ ...profile, horizon: h })}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                  profile.horizon === h
                    ? "border-accent bg-accent/10 text-accent shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:bg-secondary"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 rounded-xl border border-border bg-secondary/15 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label className="text-sm font-semibold text-foreground">Comprehensive Assistant Profile</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Configure team-level memory, report generation modes, integrations, and export behavior.
              </p>
            </div>
            <Badge className="bg-indigo-500/10 text-indigo-400" variant="secondary">
              Team scope only
            </Badge>
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Client focus</Label>
            <div className="flex flex-wrap gap-2">
              {clientTypeOptions.map((clientType) => {
                const active = comprehensiveProfile.preferredClientTypes.includes(clientType)
                return (
                  <button
                    key={clientType}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleClientType(clientType)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {clientType}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Core capabilities</Label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {capabilityOptions.map((option) => {
                const active = comprehensiveProfile.capabilities[option.key]
                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleCapability(option.key)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                      active
                        ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-400"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Integrations</Label>
              <div className="space-y-2">
                {integrationOptions.map((option) => {
                  const active = comprehensiveProfile.integrations[option.key]
                  return (
                    <button
                      key={option.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleIntegration(option.key)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        active
                          ? "border-blue-400/50 bg-blue-500/10 text-blue-400"
                          : "border-border bg-background text-muted-foreground hover:bg-secondary"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {option.label}
                      <span>{active ? "On" : "Off"}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Output formats</Label>
              <div className="space-y-2">
                {outputOptions.map((option) => {
                  const active = comprehensiveProfile.outputs[option.key]
                  return (
                    <button
                      key={option.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleOutput(option.key)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        active
                          ? "border-violet-400/50 bg-violet-500/10 text-violet-400"
                          : "border-border bg-background text-muted-foreground hover:bg-secondary"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {option.label}
                      <span>{active ? "On" : "Off"}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Brand profile: company name</Label>
              <Input
                disabled={disabled}
                value={comprehensiveProfile.branding.companyName}
                onChange={(event) =>
                  updateComprehensiveProfile({
                    ...comprehensiveProfile,
                    branding: {
                      ...comprehensiveProfile.branding,
                      companyName: event.target.value,
                    },
                  })
                }
                placeholder="Enter brand / team name"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Brand accent color</Label>
              <div className="flex items-center gap-2">
                <Input
                  disabled={disabled}
                  type="color"
                  value={comprehensiveProfile.branding.accentColor}
                  onChange={(event) =>
                    updateComprehensiveProfile({
                      ...comprehensiveProfile,
                      branding: {
                        ...comprehensiveProfile.branding,
                        accentColor: event.target.value,
                      },
                    })
                  }
                  className="h-9 w-14 p-1"
                />
                <Input
                  disabled={disabled}
                  value={comprehensiveProfile.branding.accentColor}
                  onChange={(event) =>
                    updateComprehensiveProfile({
                      ...comprehensiveProfile,
                      branding: {
                        ...comprehensiveProfile.branding,
                        accentColor: event.target.value,
                      },
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Client memory records</Label>
              <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={addMemoryEntry}>
                Add record
              </Button>
            </div>
            {comprehensiveProfile.memoryEntries.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                No client memory records yet. Add key clients to preserve context for report generation.
              </p>
            ) : (
              <div className="space-y-3">
                {comprehensiveProfile.memoryEntries.map((entry) => (
                  <div key={entry.id} className="space-y-2 rounded-lg border border-border bg-background/70 p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        disabled={disabled}
                        value={entry.clientName}
                        onChange={(event) => updateMemoryEntry(entry.id, "clientName", event.target.value)}
                        placeholder="Client name"
                        className="h-8 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={disabled}
                        onClick={() => removeMemoryEntry(entry.id)}
                      >
                        Remove
                      </Button>
                    </div>
                    <Textarea
                      disabled={disabled}
                      value={entry.contextNotes}
                      onChange={(event) => updateMemoryEntry(entry.id, "contextNotes", event.target.value)}
                      placeholder="Client context, tone, priorities"
                      className="min-h-20 text-xs"
                    />
                    <Input
                      disabled={disabled}
                      value={entry.tags.join(", ")}
                      onChange={(event) => updateMemoryEntry(entry.id, "tags", event.target.value)}
                      placeholder="Tags separated by comma"
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Report templates</Label>
              <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={addReportTemplate}>
                Add template
              </Button>
            </div>
            {comprehensiveProfile.reportTemplates.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                No templates configured yet. Add reusable report blueprints per audience.
              </p>
            ) : (
              <div className="space-y-3">
                {comprehensiveProfile.reportTemplates.map((template) => (
                  <div key={template.id} className="space-y-2 rounded-lg border border-border bg-background/70 p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        disabled={disabled}
                        value={template.name}
                        onChange={(event) => updateReportTemplate(template.id, "name", event.target.value)}
                        placeholder="Template name"
                        className="h-8 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={disabled}
                        onClick={() => removeReportTemplate(template.id)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {reportAudienceOptions.map((audience) => (
                        <button
                          key={audience}
                          type="button"
                          disabled={disabled}
                          onClick={() => updateReportTemplate(template.id, "audience", audience)}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                            template.audience === audience
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border bg-background text-muted-foreground hover:bg-secondary"
                          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {audience}
                        </button>
                      ))}
                    </div>
                    <Textarea
                      disabled={disabled}
                      value={template.outline}
                      onChange={(event) => updateReportTemplate(template.id, "outline", event.target.value)}
                      placeholder="Template outline (sections, tone, KPIs)"
                      className="min-h-20 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Client memory notes</Label>
            <Textarea
              disabled={disabled}
              value={comprehensiveProfile.clientMemoryNotes}
              onChange={(event) =>
                updateComprehensiveProfile({
                  ...comprehensiveProfile,
                  clientMemoryNotes: event.target.value,
                })
              }
              placeholder="Examples: preferred report tone, board format, recurring KPIs, branding instructions"
              className="min-h-24 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 border-t border-border pt-8">
        <Button
          onClick={handleSave}
          disabled={loading || disabled}
          className="flex h-10 min-w-32 items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Strategy
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => setSimulationMode(!simulationMode)}
          disabled={disabled}
          className="flex h-10 items-center gap-2"
        >
          {simulationMode ? <BarChart3 className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
          {simulationMode ? "Hide Simulation" : "Simulate Impact"}
        </Button>
        {saved && (
          <span className="text-xs font-medium text-emerald-500 animate-in fade-in slide-in-from-left-2">
            Strategic profile updated and synchronized.
          </span>
        )}
      </div>

      {simulationMode && (
        <div className="rounded-xl border border-border bg-secondary/20 p-6 animate-in fade-in slide-in-from-top-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-accent" />
              Live Match Simulation
            </h3>
            <span className="text-xs text-muted-foreground">
              See how your settings rank real-world project archetypes
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {simulatedProjects.map((project) => (
              <div key={project.slug} className="relative">
                <div className="absolute -top-3 right-4 z-10 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  Match: {project.match_score}%
                </div>
                <ProjectCard {...project} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
