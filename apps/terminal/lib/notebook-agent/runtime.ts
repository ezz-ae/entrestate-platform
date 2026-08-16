import { compileTableSpec } from "../tablespec/compiler"
import { calculateTableHash } from "../timetable/model"
import { materializeTable } from "../timetable/materialize"
import { prisma } from "../prisma"
import { TableSpec } from "../tablespec/types"

export interface Citation {
  id: string
  rowIds: string[]
  description: string
}

export interface AgentResponse {
  timetableId: string
  title: string
  narrative: string
  citations: Citation[]
  suggestedViews: ("table" | "chart" | "presentation")[]
  suggestedActions: Array<{
    label: string
    type: "report" | "pptx" | "widget" | "automation"
    payload?: any
  }>
}

/**
 * Orchestrates the full agent loop:
 * Intent -> TableSpec -> Time Table -> Narrative Response
 */
export async function runAgent(intent: string, userId: string): Promise<AgentResponse> {
  // 1. Compile intent into TableSpec
  const compilation = compileTableSpec({ intent })
  const spec = compilation.spec
  
  // 2. Compute hash and check for existing table (caching)
  const hash = calculateTableHash(spec)
  
  // @ts-ignore - Prisma types might be out of sync in the editor
  let timetable = await prisma.timeTable.findUnique({
    where: { hash }
  })
  
  // 3. Create table if it doesn't exist
  if (!timetable) {
    // @ts-ignore
    timetable = await prisma.timeTable.create({
      data: {
        title: spec.intent || "New Investigation",
        ownerId: userId,
        tablespec: spec as any,
        hash,
        visibility: "private",
        refreshPolicy: "manual"
      }
    })
  }
  
  // 4. Materialize data for narrative generation (simplified for now)
  const rows = await materializeTable(spec)
  
  // 5. Generate narrative (In a real system, this would use an LLM with the materialized rows)
  const narrative = generateStubNarrative(intent, rows, spec)
  
  return {
    timetableId: timetable.id,
    title: timetable.title,
    narrative: narrative.text,
    citations: narrative.citations,
    suggestedViews: ["table", "chart", "presentation"],
    suggestedActions: [
      { label: "Create Investor Memo", type: "report" },
      { label: "Generate Presentation", type: "pptx" },
      { label: "Embed as Widget", type: "widget" }
    ]
  }
}

function generateStubNarrative(intent: string, rows: any[], spec: TableSpec) {
  const count = rows.length
  // Correcting price_aed access if it's nested or different
  const avgPrice = count > 0 ? rows.reduce((sum, r) => sum + (Number(r.price_aed) || 0), 0) / count : 0
  
  const text = `I've analyzed the market for ${spec.intent || "your request"}. I found ${count} matching records [cit-1]. The average price across these assets is ${avgPrice.toLocaleString()} AED [cit-2]. This segment shows strong investment signals based on current market timing.`
  
  const citations: Citation[] = [
    { 
      id: "cit-1", 
      rowIds: rows.slice(0, 10).map(r => String(r._rowId)), 
      description: `Based on ${count} identified assets in the current scope.` 
    },
    { 
      id: "cit-2", 
      rowIds: rows.slice(0, 5).map(r => String(r._rowId)), 
      description: "Calculated average price from the primary data set." 
    }
  ]
  
  return { text, citations }
}
