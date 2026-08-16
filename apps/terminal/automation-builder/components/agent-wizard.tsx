"use client"

import { useMemo } from "react"
import type { AgentTemplate, InputField, OutputChannel, RuleToggle } from "@/automation-builder/lib/automation-types"
import type { AgentDraft } from "@/automation-builder/lib/draft"
import { Button } from "@/automation-builder/components/ui/button"
import { Card } from "@/automation-builder/components/ui/card"
import { Input } from "@/automation-builder/components/ui/input"
import { Label } from "@/automation-builder/components/ui/label"
import { Textarea } from "@/automation-builder/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/automation-builder/components/ui/select"
import { Switch } from "@/automation-builder/components/ui/switch"
import { Badge } from "@/automation-builder/components/ui/badge"
import { Separator } from "@/automation-builder/components/ui/separator"
import { Plus, Trash2 } from "lucide-react"

type AgentWizardProps = {
  step: number
  onStepChange: (step: number) => void
  templates: AgentTemplate[]
  selectedTemplateId: string | null
  draft: AgentDraft
  onDraftChange: (draft: AgentDraft) => void
  onSelectTemplate: (template: AgentTemplate) => void
}

const stepLabels = [
  "Role",
  "Market",
  "Inputs",
  "Rules",
  "Outputs",
]

const channelLabels: Record<OutputChannel, string> = {
  whatsapp: "WhatsApp reply",
  call_script: "Call script",
  investor_memo: "Investor memo",
  crm_summary: "CRM summary",
}

export function AgentWizard({
  step,
  onStepChange,
  templates,
  selectedTemplateId,
  draft,
  onDraftChange,
  onSelectTemplate,
}: AgentWizardProps) {
  const canNext = step < 5
  const canBack = step > 1

  const steps = useMemo(
    () =>
      stepLabels.map((label, index) => ({
        label,
        index: index + 1,
        active: step === index + 1,
      })),
    [step],
  )

  const updateField = (updated: InputField) => {
    const fields = draft.inputs.fields.map((field) => (field.id === updated.id ? updated : field))
    onDraftChange({ ...draft, inputs: { fields } })
  }

  const updateRule = (updated: RuleToggle) => {
    const toggles = draft.rules.toggles.map((rule) => (rule.id === updated.id ? updated : rule))
    onDraftChange({ ...draft, rules: { ...draft.rules, toggles } })
  }

  const toggleChannel = (channel: OutputChannel) => {
    const exists = draft.outputs.channels.includes(channel)
    const channels = exists
      ? draft.outputs.channels.filter((item) => item !== channel)
      : [...draft.outputs.channels, channel]
    if (channels.length === 0) return
    onDraftChange({ ...draft, outputs: { ...draft.outputs, channels } })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {steps.map((item) => (
            <button
              key={item.label}
              onClick={() => onStepChange(item.index)}
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                item.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="h-4 w-4 rounded-full bg-background/20 flex items-center justify-center text-[10px]">
                {item.index}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Choose the agent role</h2>
            <p className="text-sm text-muted-foreground">
              Pick the role that matches the job. The wizard will load the right defaults.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer border p-4 transition ${
                  selectedTemplateId === template.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card/50 hover:border-primary/40"
                }`}
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                  {selectedTemplateId === template.id && (
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{template.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Market and company type</h2>
            <p className="text-sm text-muted-foreground">Set the market and the business style for this agent.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agent-name">Agent name</Label>
              <Input
                id="agent-name"
                value={draft.name}
                onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
                placeholder="Lead Qualifier - UAE"
              />
            </div>
            <div>
              <Label htmlFor="market">Market</Label>
              <Input
                id="market"
                value={draft.market}
                onChange={(event) => onDraftChange({ ...draft, market: event.target.value })}
                placeholder="UAE"
              />
            </div>
            <div>
              <Label htmlFor="company-type">Company type</Label>
              <Select
                value={draft.companyType}
                onValueChange={(value) => onDraftChange({ ...draft, companyType: value as AgentDraft["companyType"] })}
              >
                <SelectTrigger id="company-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broker">Broker</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Inputs form</h2>
            <p className="text-sm text-muted-foreground">
              Add or adjust the questions the agent must collect before responding.
            </p>
          </div>
          <div className="space-y-4">
            {draft.inputs.fields.map((field) => (
              <Card key={field.id} className="border border-border bg-card/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={field.label}
                    onChange={(event) => updateField({ ...field, label: event.target.value })}
                    placeholder="Field label"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      onDraftChange({
                        ...draft,
                        inputs: {
                          fields: draft.inputs.fields.filter((item) => item.id !== field.id),
                        },
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) => updateField({ ...field, type: value as InputField["type"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="select">Pick list</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Required</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) => updateField({ ...field, required: checked })}
                      />
                      <span className="text-xs text-muted-foreground">
                        {field.required ? "Required" : "Optional"}
                      </span>
                    </div>
                  </div>
                  {field.type === "select" && (
                    <div>
                      <Label>Options (comma separated)</Label>
                      <Input
                        value={field.options?.join(", ") || ""}
                        onChange={(event) =>
                          updateField({
                            ...field,
                            options: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                          })
                        }
                        placeholder="Option 1, Option 2"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Question phrasing</Label>
                  <Textarea
                    value={field.question}
                    onChange={(event) => updateField({ ...field, question: event.target.value })}
                    rows={2}
                  />
                </div>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                onDraftChange({
                  ...draft,
                  inputs: {
                    fields: [
                      ...draft.inputs.fields,
                      {
                        id: `field_${draft.inputs.fields.length + 1}`,
                        label: "New field",
                        type: "text",
                        required: false,
                        question: "Add a question for this field.",
                      },
                    ],
                  },
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add field
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Rules & safeguards</h2>
            <p className="text-sm text-muted-foreground">
              Turn on safeguards to keep the agent accurate and compliant.
            </p>
          </div>
          <div className="space-y-3">
            {draft.rules.toggles.map((rule) => (
              <Card key={rule.id} className="border border-border bg-card/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{rule.label}</p>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                  <Switch checked={rule.enabled} onCheckedChange={(checked) => updateRule({ ...rule, enabled: checked })} />
                </div>
              </Card>
            ))}
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Strict mode</p>
                <p className="text-xs text-muted-foreground">Do not invent listings or facts.</p>
              </div>
              <Switch
                checked={draft.rules.strictMode}
                onCheckedChange={(checked) =>
                  onDraftChange({ ...draft, rules: { ...draft.rules, strictMode: checked } })
                }
              />
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Output format & tone</h2>
            <p className="text-sm text-muted-foreground">
              Choose the output style the agent should return after each conversation.
            </p>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(channelLabels).map(([key, label]) => {
                const channel = key as OutputChannel
                const active = draft.outputs.channels.includes(channel)
                return (
                  <Card
                    key={channel}
                    onClick={() => toggleChannel(channel)}
                    className={`cursor-pointer border p-3 transition ${
                      active ? "border-primary bg-primary/5" : "border-border bg-card/50"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {active ? "Included" : "Click to include"}
                    </p>
                  </Card>
                )
              })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Tone preset</Label>
                <Select
                  value={draft.outputs.tone}
                  onValueChange={(value) => onDraftChange({ ...draft, outputs: { ...draft.outputs, tone: value as AgentDraft["outputs"]["tone"] } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Summary length</Label>
                <Select
                  value={draft.outputs.summaryStyle}
                  onValueChange={(value) =>
                    onDraftChange({ ...draft, outputs: { ...draft.outputs, summaryStyle: value as AgentDraft["outputs"]["summaryStyle"] } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" disabled={!canBack} onClick={() => onStepChange(step - 1)}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">Step {step} of 5</p>
          <Button disabled={!canNext} onClick={() => onStepChange(step + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
