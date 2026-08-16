"use client"

import { useMemo, useState } from "react"
import type { AgentRun, AutomationTemplate } from "@/automation-builder/lib/automation-types"
import type { AutomationDraft } from "@/automation-builder/lib/draft"
import { Button } from "@/automation-builder/components/ui/button"
import { Card } from "@/automation-builder/components/ui/card"
import { Input } from "@/automation-builder/components/ui/input"
import { Textarea } from "@/automation-builder/components/ui/textarea"
import { createRun } from "@/automation-builder/lib/client"

type AutomationTestPanelProps = {
  draft: AutomationDraft
  activeAutomationId: string | null
  template: AutomationTemplate | null
  onEnsureAutomation: () => Promise<string | null>
  onRunComplete?: (run: AgentRun) => void
}

export function AutomationTestPanel({
  draft,
  activeAutomationId,
  template,
  onEnsureAutomation,
  onRunComplete,
}: AutomationTestPanelProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [output, setOutput] = useState<Record<string, string> | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [followUps, setFollowUps] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const sampleMessage = useMemo(() => template?.sampleConversation?.[0]?.message || "", [template])

  const handleInputChange = (id: string, value: string) => {
    setInputs((prev) => ({ ...prev, [id]: value }))
  }

  const handleTest = async () => {
    setIsRunning(true)
    try {
      const automationId = activeAutomationId || (await onEnsureAutomation())
      if (!automationId) {
        setIsRunning(false)
        return
      }
      const { run } = await createRun(automationId, inputs)
      setOutput((run.output?.outputs as Record<string, string>) || null)
      setSummary((run.output?.summary as string) || null)
      setFollowUps((run.output?.followUps as string[]) || [])
      onRunComplete?.(run)
    } catch (error) {
      setOutput({ error: "Unable to test the agent right now." })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="border border-border bg-card/60 p-5 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Test automation</p>
        <p className="text-sm text-foreground">Try a sample conversation and preview the output.</p>
      </div>

      <div className="space-y-3">
        {draft.inputs.fields.slice(0, 4).map((field) => (
          <div key={field.id}>
            <label className="text-xs text-muted-foreground">{field.label}</label>
            <Input
              value={inputs[field.id] || ""}
              onChange={(event) => handleInputChange(field.id, event.target.value)}
              placeholder={field.question}
            />
          </div>
        ))}
        {sampleMessage && (
          <div>
            <label className="text-xs text-muted-foreground">Sample lead message</label>
            <Textarea value={sampleMessage} rows={2} readOnly />
          </div>
        )}
        <Button onClick={handleTest} disabled={isRunning} className="w-full">
          {isRunning ? "Testing..." : "Test automation"}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Output preview</p>
        {!output && (
          <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            Run a test to see output formats.
          </div>
        )}
        {summary && (
          <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
            Summary: {summary}
          </div>
        )}
        {followUps.length > 0 && (
          <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
            Follow-ups: {followUps.join(" ")}
          </div>
        )}
        {output && (
          <div className="space-y-2">
            {Object.entries(output).map(([key, value]) => (
              <div key={key} className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
                <span className="uppercase tracking-wider text-[10px]">{key.replace("_", " ")}</span>
                <p className="mt-1 text-foreground">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

export const AgentTestPanel = AutomationTestPanel
