"use client"

import type React from "react"
import {
  MessageSquare,
  Layers,
  Wrench,
  FileText,
  ImageIcon,
  Code,
  Play,
  Flag,
  GitBranch,
  Globe,
  ChevronLeft,
} from "lucide-react"
import { Card } from "@/automation-builder/components/ui/card"
import { Button } from "@/automation-builder/components/ui/button"

type NodeType = {
  type: string
  label: string
  icon: React.ReactNode
  color: string
  description: string
}

const nodeTypes: NodeType[] = [
  {
    type: "start",
    label: "Start",
    icon: <Play className="h-4 w-4" />,
    color: "bg-green-500",
    description: "Start of the automation flow",
  },
  {
    type: "prompt",
    label: "Instruction",
    icon: <FileText className="h-4 w-4" />,
    color: "bg-chart-5",
    description: "Guidance or question for the automation",
  },
  {
    type: "textModel",
    label: "Reasoning Engine",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "bg-primary",
    description: "Creates the automation response",
  },
  {
    type: "imageGeneration",
    label: "Media Builder",
    icon: <ImageIcon className="h-4 w-4" />,
    color: "bg-chart-1",
    description: "Optional media output",
  },
  {
    type: "httpRequest",
    label: "Data Source",
    icon: <Globe className="h-4 w-4" />,
    color: "bg-blue-500",
    description: "Pulls market data",
  },
  {
    type: "conditional",
    label: "Route",
    icon: <GitBranch className="h-4 w-4" />,
    color: "bg-purple-500",
    description: "Route based on decision",
  },
  {
    type: "javascript",
    label: "Logic Step",
    icon: <Code className="h-4 w-4" />,
    color: "bg-yellow-500",
    description: "Managed logic step",
  },
  {
    type: "embeddingModel",
    label: "Signal Index",
    icon: <Layers className="h-4 w-4" />,
    color: "bg-chart-2",
    description: "Index signals for lookup",
  },
  {
    type: "tool",
    label: "Action Step",
    icon: <Wrench className="h-4 w-4" />,
    color: "bg-chart-4",
    description: "Trigger an action",
  },
  {
    type: "end",
    label: "Automation Response",
    icon: <Flag className="h-4 w-4" />,
    color: "bg-red-500",
    description: "Final response",
  },
]

type NodePaletteProps = {
  onAddNode: (type: string) => void
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function NodePalette({ onAddNode, onClose, isCollapsed = false, onToggleCollapse }: NodePaletteProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  const handleAddNode = (type: string) => {
    onAddNode(type)
    onClose?.()
  }

  return (
    <aside
      className={`relative h-full overflow-y-auto border-r border-border bg-card transition-all duration-300 ${
        isCollapsed ? "w-0 md:w-12" : "w-80 md:w-64"
      } ${isCollapsed ? "p-0" : "p-3 md:p-4"}`}
    >
      {onToggleCollapse && (
        <Button
          variant="ghost"
          size="icon"
          className={`absolute right-0 top-2 z-10 hidden h-8 w-8 md:flex ${isCollapsed ? "rotate-180" : ""}`}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand palette" : "Collapse palette"}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {!isCollapsed && (
        <>
          <h2 className="mb-3 text-sm font-semibold text-foreground md:mb-4">Builder elements</h2>
          <div className="space-y-2">
            {nodeTypes.map((node) => (
              <Card
                key={node.type}
                draggable
                onDragStart={(e) => onDragStart(e, node.type)}
                onClick={() => handleAddNode(node.type)}
                className="cursor-grab border border-border bg-secondary p-2 transition-all hover:border-primary hover:bg-secondary/80 active:cursor-grabbing md:p-3"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-md md:h-8 md:w-8 ${node.color}`}>
                    <div className="text-primary-foreground">{node.icon}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-medium text-foreground md:text-sm">{node.label}</h3>
                    <p className="hidden text-xs text-muted-foreground md:block">{node.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </aside>
  )
}
