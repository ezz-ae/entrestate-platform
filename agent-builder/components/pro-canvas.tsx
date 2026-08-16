"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  MiniMap,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/automation-builder/components/ui/button"
import { Save, Upload, Play, Menu, X, ShieldCheck } from "lucide-react"
import TextModelNode from "@/automation-builder/components/nodes/text-model-node"
import EmbeddingModelNode from "@/automation-builder/components/nodes/embedding-model-node"
import ToolNode from "@/automation-builder/components/nodes/tool-node"
import StructuredOutputNode from "@/automation-builder/components/nodes/structured-output-node"
import PromptNode from "@/automation-builder/components/nodes/prompt-node"
import ImageGenerationNode from "@/automation-builder/components/nodes/image-generation-node"
import AudioNode from "@/automation-builder/components/nodes/audio-node"
import JavaScriptNode from "@/automation-builder/components/nodes/javascript-node"
import StartNode from "@/automation-builder/components/nodes/start-node"
import EndNode from "@/automation-builder/components/nodes/end-node"
import ConditionalNode from "@/automation-builder/components/nodes/conditional-node"
import HttpRequestNode from "@/automation-builder/components/nodes/http-request-node"

import { NodePalette } from "@/automation-builder/components/node-palette"
import { NodeConfigPanel } from "@/automation-builder/components/node-config-panel"
import { ExecutionPanel } from "@/automation-builder/components/execution-panel"
import { AgentRole, CompanyType } from '@prisma/client';

const STORAGE_KEY = "agent-builder-pro-workflow"

const nodeTypes: NodeTypes = {
  textModel: TextModelNode,
  embeddingModel: EmbeddingModelNode,
  tool: ToolNode,
  structuredOutput: StructuredOutputNode,
  prompt: PromptNode,
  imageGeneration: ImageGenerationNode,
  audio: AudioNode,
  javascript: JavaScriptNode,
  start: StartNode,
  end: EndNode,
  conditional: ConditionalNode,
  httpRequest: HttpRequestNode,
}

const initialNodes: Node[] = [
  {
    id: "1",
    type: "start",
    position: { x: 50, y: 260 },
    data: {},
  },
  {
    id: "2",
    type: "prompt",
    position: { x: 320, y: 260 },
    data: { content: "Qualify the lead, gather missing details, and summarize next steps." },
  },
  {
    id: "3",
    type: "textModel",
    position: { x: 760, y: 260 },
    data: { model: "standard", temperature: 0.6, maxTokens: 500 },
  },
  {
    id: "4",
    type: "end",
    position: { x: 1180, y: 260 },
    data: {},
  },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
]

const getDefaultNodeData = (type: string) => {
  switch (type) {
    case "textModel":
      return { model: "standard", temperature: 0.6, maxTokens: 500 }
    case "embeddingModel":
      return { model: "indexer", dimensions: 1536 }
    case "tool":
      return { name: "actionStep", description: "Custom action step" }
    case "structuredOutput":
      return { schemaName: "Summary", mode: "object" }
    case "prompt":
      return { content: "Add a clear instruction for the agent." }
    case "imageGeneration":
      return { model: "media", aspectRatio: "1:1", outputFormat: "png" }
    case "audio":
      return { model: "voice", voice: "neutral", speed: 1.0 }
    case "javascript":
      return { code: "Managed by your team." }
    case "start":
      return {}
    case "end":
      return {}
    case "conditional":
      return { condition: "route = ready" }
    case "httpRequest":
      return { url: "connector:listings", method: "GET" }
    default:
      return {}
  }
}

type ProCanvasProps = {
  editable: boolean
  onToggleEdit: () => void
}

export function ProCanvas({ editable, onToggleEdit }: ProCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [showExecution, setShowExecution] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const nodeIdCounter = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false)
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("palette-collapsed")
    if (saved !== null) {
      setIsPaletteCollapsed(saved === "true")
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("palette-collapsed", isPaletteCollapsed.toString())
  }, [isPaletteCollapsed])

  useEffect(() => {
    const fetchInitialAgent = async () => {
      try {
        const listResponse = await fetch("/api/automation-builder/list");
        if (!listResponse.ok) {
          throw new Error("Failed to fetch agent list");
        }
        const agents = await listResponse.json();

        if (agents && agents.length > 0) {
          const firstAgentId = agents[0].id;
          const agentResponse = await fetch(`/api/automation-builder/${firstAgentId}`);
          if (!agentResponse.ok) {
            throw new Error(`Failed to fetch agent ${firstAgentId}`);
          }
          const agent = await agentResponse.json();

          if (agent?.workflowGraph?.nodes && agent?.workflowGraph?.edges) {
            setNodes(agent.workflowGraph.nodes);
            setEdges(agent.workflowGraph.edges);
            setCurrentAgentId(agent.id);
          } else {
            console.warn("First agent found but no workflowGraph data.");
          }
        } else {
          console.log("No agents found, starting with initial workflow.");
          setNodes(initialNodes);
          setEdges(initialEdges);
        }
      } catch (error) {
        console.error("Error fetching initial agent workflow:", error);
        // Fallback to initial nodes if API fails
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    };
    fetchInitialAgent();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const maxId = Math.max(...nodes.map((n) => Number.parseInt(n.id) || 0), 0)
    nodeIdCounter.current = maxId + 1
  }, [nodes])

  const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [])

  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [])

  const onConnect: OnConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (!editable) return
    setSelectedNode(node)
    setShowExecution(false)
    setIsPaletteOpen(false)
  }, [editable])

  const onAddNode = useCallback(
    (type: string) => {
      if (!reactFlowInstance) return

      const newNode: Node = {
        id: `${Date.now()}-${nodeIdCounter.current++}`,
        type,
        position: reactFlowInstance.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        }),
        data: getDefaultNodeData(type),
      }

      setNodes((nds) => [...nds, newNode])
    },
    [reactFlowInstance],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current || !reactFlowInstance) return

      const type = event.dataTransfer.getData("application/reactflow")
      if (!type) return

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: `${Date.now()}-${nodeIdCounter.current++}`,
        type,
        position,
        data: getDefaultNodeData(type),
      }

      setNodes((nds) => [...nds, newNode])
    },
    [reactFlowInstance],
  )

  const onUpdateNode = useCallback((nodeId: string, data: any) => {
    setNodes((nds) => nds.map((node) => (node.id === nodeId ? { ...node, data } : node)))
    setSelectedNode((node) => (node?.id === nodeId ? { ...node, data } : node))
  }, [])

  const handleExportWorkflow = useCallback(async () => {
    const agentName = window.prompt("Enter a name for your agent:");
    if (!agentName) return;

    // TODO: Dynamically get teamId, role, market, companyType from user context or configuration
    const teamId = "clx1s5e3900003b6w5q3r8f9h"; // Placeholder teamId - REPLACE WITH ACTUAL TEAM ID
    const agentRole = AgentRole.lead_qualifier; // Placeholder role
    const agentMarket = "Dubai"; // Placeholder market
    const agentCompanyType = CompanyType.broker; // Placeholder company type

    const workflowPayload = {
      name: agentName,
      teamId,
      role: agentRole,
      market: agentMarket,
      companyType: agentCompanyType,
      inputs: {}, // Placeholder
      rules: {}, // Placeholder
      outputs: {}, // Placeholder
      connectors: {}, // Placeholder
      nodes,
      edges,
    };

    try {
      const response = await fetch("/api/automation-builder/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workflowPayload),
      });

      if (response.ok) {
        const savedAgent = await response.json();
        console.log("Agent workflow saved successfully:", savedAgent);
        alert(`Agent '${agentName}' saved!`);
        // TODO: Update currentAgentId state if needed for further operations (e.g., update)
      } else {
        const errorData = await response.json();
        console.error("Failed to save agent workflow:", errorData);
        alert(`Failed to save agent: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error("Error saving agent workflow:", error);
      alert("An unexpected error occurred while saving the agent.");
    }
  }, [nodes, edges]);

  const handleImportWorkflow = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const workflow = JSON.parse(content)

        if (workflow.nodes && workflow.edges) {
          setNodes(workflow.nodes)
          setEdges(workflow.edges)
        }
      } catch {
        // ignore
      }
    }
    reader.readAsText(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleRun = useCallback(() => {
    setShowExecution(true)
    setTimeout(() => {
      const executeButton = document.querySelector("[data-execute-workflow]") as HTMLButtonElement
      if (executeButton) {
        executeButton.click()
      }
    }, 100)
  }, [])

  return (
    <div className="flex h-full flex-col border border-border bg-background rounded-xl overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            aria-label="Toggle palette"
            disabled={!editable}
          >
            {isPaletteOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground md:text-xl">Advanced canvas</h1>
            <p className="text-xs text-muted-foreground md:text-sm">View the agent flow behind the wizard.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Button variant="outline" size="sm" onClick={onToggleEdit}>
            {editable ? "Lock edits" : "Enable edits"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportWorkflow}
            className="hidden"
            aria-label="Load flow"
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={!editable}>
            <Upload className="mr-2 h-4 w-4" />
            Load flow
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportWorkflow}>
            <Save className="mr-2 h-4 w-4" />
            Save flow
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleRun}>
            <Play className="mr-2 h-4 w-4" />
            Test flow
          </Button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {editable && (
          <>
            <div
              className={`${isPaletteOpen ? "fixed inset-0 z-40 bg-black/50 md:hidden" : "hidden"}`}
              onClick={() => setIsPaletteOpen(false)}
              aria-hidden="true"
            />
            <div
              className={`${
                isPaletteOpen ? "fixed left-0 top-[73px] z-50 h-[calc(100vh-73px)]" : "hidden"
              } md:relative md:top-0 md:z-auto md:h-auto`}
            >
              <NodePalette
                onAddNode={onAddNode}
                onClose={() => setIsPaletteOpen(false)}
                isCollapsed={isPaletteCollapsed}
                onToggleCollapse={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
              />
            </div>
          </>
        )}

        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={editable ? onNodesChange : undefined}
            onEdgesChange={editable ? onEdgesChange : undefined}
            onConnect={editable ? onConnect : undefined}
            onNodeClick={onNodeClick}
            onInit={setReactFlowInstance}
            onDrop={editable ? onDrop : undefined}
            onDragOver={editable ? onDragOver : undefined}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={editable}
            nodesConnectable={editable}
            elementsSelectable={editable}
            className="bg-background"
          >
            <Background className="bg-background" gap={16} size={1} />
            <MiniMap
              pannable
              zoomable
              className="bg-card border border-border"
              maskColor="rgb(0, 0, 0, 0.6)"
            />
          </ReactFlow>
        </div>

        {selectedNode && editable && !showExecution && (
          <NodeConfigPanel node={selectedNode} onClose={() => setSelectedNode(null)} onUpdate={onUpdateNode} />
        )}

        {showExecution && (
          <ExecutionPanel
            nodes={nodes}
            edges={edges}
            onClose={() => setShowExecution(false)}
          />
        )}
      </div>
    </div>
  )
}
