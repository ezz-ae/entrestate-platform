"use client"

import type { AgentDefinition } from "@/automation-builder/lib/automation-types"
import { Button } from "@/automation-builder/components/ui/button"
import { Card } from "@/automation-builder/components/ui/card"
import { Badge } from "@/automation-builder/components/ui/badge"
import { Copy, Share2, CheckCircle2 } from "lucide-react"

type AgentLibraryProps = {
  agents: AgentDefinition[]
  selectedAgentId: string | null
  onSelect: (agent: AgentDefinition) => void
  onCreate: () => void
  onClone: (agentId: string) => void
  onShare: (agentId: string) => void
  onPublish: (agentId: string) => void
}

export function AgentLibrary({
  agents,
  selectedAgentId,
  onSelect,
  onCreate,
  onClone,
  onShare,
  onPublish,
}: AgentLibraryProps) {
  return (
    <Card className="border border-border bg-card/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Agent library</p>
          <p className="text-sm text-foreground">Manage your agents</p>
        </div>
        <Button size="sm" onClick={onCreate}>
          New agent
        </Button>
      </div>

      <div className="space-y-3">
        {agents.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No agents yet. Create one from the wizard.
          </div>
        )}
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className={`border p-4 transition ${
              selectedAgentId === agent.id ? "border-primary bg-primary/5" : "border-border bg-background/60"
            }`}
          >
            <button onClick={() => onSelect(agent)} className="w-full text-left">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {agent.role.split("_").join(" ")} · {agent.market} · v{agent.version}
                  </p>
                </div>
                <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
              </div>
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => onClone(agent.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Clone
              </Button>
              <Button variant="outline" size="sm" onClick={() => onShare(agent.id)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => onPublish(agent.id)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Publish
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
}
