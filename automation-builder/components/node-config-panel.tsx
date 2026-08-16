"use client"

import type { Node } from "@xyflow/react"
import { X } from "lucide-react"
import { Button } from "@/automation-builder/components/ui/button"
import { Input } from "@/automation-builder/components/ui/input"
import { Label } from "@/automation-builder/components/ui/label"
import { Textarea } from "@/automation-builder/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/automation-builder/components/ui/select"
import { Switch } from "@/automation-builder/components/ui/switch"

type NodeConfigPanelProps = {
  node: Node | null
  onClose: () => void
  onUpdate: (nodeId: string, data: any) => void
}

export function NodeConfigPanel({ node, onClose, onUpdate }: NodeConfigPanelProps) {
  if (!node) return null

  const handleUpdate = (field: string, value: any) => {
    onUpdate(node.id, { ...node.data, [field]: value })
  }

  const renderConfig = () => {
    switch (node.type) {
      case "start":
        return <p className="text-sm text-muted-foreground">Start of the agent flow.</p>

      case "end":
        return <p className="text-sm text-muted-foreground">Final response delivered to the client.</p>

      case "conditional":
        return (
          <div className="space-y-4">
            <Label htmlFor="route">Decision rule</Label>
            <Select
              value={node.data.route || "ready"}
              onValueChange={(value) => handleUpdate("route", value)}
            >
              <SelectTrigger id="route">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ready">Ready buyer</SelectItem>
                <SelectItem value="warming">Warming lead</SelectItem>
                <SelectItem value="needs_info">Needs more info</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Routes the flow based on lead readiness.</p>
          </div>
        )

      case "httpRequest":
        return (
          <div className="space-y-4">
            <Label htmlFor="connector">Connector</Label>
            <Select
              value={node.data.connector || "listings"}
              onValueChange={(value) => handleUpdate("connector", value)}
            >
              <SelectTrigger id="connector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="listings">Listings</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="market_intel">Market intelligence</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Pulls verified data from your sources.</p>
          </div>
        )

      case "textModel":
        return (
          <div className="space-y-4">
            <Label htmlFor="depth">Response depth</Label>
            <Select
              value={node.data.depth || "balanced"}
              onValueChange={(value) => handleUpdate("depth", value)}
            >
              <SelectTrigger id="depth">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="deep">Deep</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between">
              <Label htmlFor="structured">Structured summary</Label>
              <Switch
                id="structured"
                checked={node.data.structuredOutput || false}
                onCheckedChange={(checked) => handleUpdate("structuredOutput", checked)}
              />
            </div>
          </div>
        )

      case "embeddingModel":
        return <p className="text-sm text-muted-foreground">Signal index depth is managed by the system.</p>

      case "imageGeneration":
        return (
          <div className="space-y-4">
            <Label htmlFor="ratio">Media size</Label>
            <Select
              value={node.data.aspectRatio || "1:1"}
              onValueChange={(value) => handleUpdate("aspectRatio", value)}
            >
              <SelectTrigger id="ratio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">Square</SelectItem>
                <SelectItem value="16:9">Landscape</SelectItem>
                <SelectItem value="9:16">Portrait</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )

      case "audio":
        return (
          <div className="space-y-4">
            <Label htmlFor="voice">Voice style</Label>
            <Select value={node.data.voice || "neutral"} onValueChange={(value) => handleUpdate("voice", value)}>
              <SelectTrigger id="voice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )

      case "tool":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Action name</Label>
              <Input
                id="name"
                value={node.data.name || ""}
                onChange={(e) => handleUpdate("name", e.target.value)}
                placeholder="e.g., Assign to sales desk"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Action summary</Label>
              <Textarea
                id="description"
                value={node.data.description || ""}
                onChange={(e) => handleUpdate("description", e.target.value)}
                placeholder="Describe the action outcome."
                rows={3}
              />
            </div>
          </div>
        )

      case "structuredOutput":
        return (
          <div className="space-y-4">
            <Label htmlFor="schemaName">Summary label</Label>
            <Input
              id="schemaName"
              value={node.data.schemaName || ""}
              onChange={(e) => handleUpdate("schemaName", e.target.value)}
              placeholder="Client Summary"
            />
          </div>
        )

      case "prompt":
        return (
          <div className="space-y-4">
            <Label htmlFor="content">Instruction</Label>
            <Textarea
              id="content"
              value={node.data.content || ""}
              onChange={(e) => handleUpdate("content", e.target.value)}
              placeholder="Enter your instruction..."
              rows={6}
            />
          </div>
        )

      case "javascript":
        return <p className="text-sm text-muted-foreground">Logic steps are managed by your operations team.</p>

      default:
        return <p className="text-sm text-muted-foreground">No configuration available.</p>
    }
  }

  return (
    <aside className="absolute right-0 top-0 z-10 h-full w-full border-l border-border bg-card md:relative md:w-80">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Element settings</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="overflow-y-auto p-4" style={{ height: "calc(100% - 57px)" }}>
        {renderConfig()}
      </div>
    </aside>
  )
}
