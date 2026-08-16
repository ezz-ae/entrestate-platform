"use client"

import { useEffect, useState } from "react"
import { TimeTableData } from "@/lib/timetable/model"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, Share, PlusCircle, LayoutPanelLeft, Table2 } from "lucide-react"
import { TimeTableView } from "@/components/timetable/table-view"
import { AnalystView } from "./analyst-view"

type TimeTableDisplayProps = {
  id: string
  citations?: any[]
  narrative?: string
}

export function TimeTableDisplay({ id, citations = [], narrative }: TimeTableDisplayProps) {
  const [data, setData] = useState<TimeTableData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"standard" | "analyst">(narrative ? "analyst" : "standard")

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/timetables/${id}/data`)
        if (!res.ok) {
          throw new Error("Failed to fetch TimeTable data")
        }
        const tableData = await res.json()
        
        // A bit of a hack: fetch metadata separately to combine
        const metaRes = await fetch(`/api/timetables/${id}`)
        if(!metaRes.ok) throw new Error("Failed to fetch metadata")
        const metadata = await metaRes.json()

        setData({
            metadata: metadata,
            rows: tableData.rows,
            columns: Object.keys(tableData.rows[0] || {}).filter(k => !k.startsWith('_')).map(key => ({key, label: key, type: "string"}))
        })

      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (isLoading) {
    return <div>Loading TimeTable...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  if (!data) {
    return <div>No data available for this TimeTable.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{data.metadata.title}</h1>
          <p className="text-sm text-muted-foreground">
            ID: {data.metadata.id} · Refreshed: {data.metadata.lastRefreshAt ? new Date(data.metadata.lastRefreshAt).toLocaleTimeString() : "Never"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setViewMode(viewMode === "standard" ? "analyst" : "standard")}
          >
            {viewMode === "standard" ? (
              <><LayoutPanelLeft className="mr-2 h-4 w-4" /> Analyst Mode</>
            ) : (
              <><Table2 className="mr-2 h-4 w-4" /> Standard Mode</>
            )}
          </Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button variant="outline"><Share className="mr-2 h-4 w-4" /> Share</Button>
          <Button><PlusCircle className="mr-2 h-4 w-4"/> Create Automation</Button>
        </div>
      </div>
      
      {viewMode === "analyst" ? (
        <AnalystView 
          narrative={narrative || data.metadata.spec.intent || "No narrative available."} 
          citations={citations} 
          rows={data.rows}
          columns={data.columns}
          evidence={(data.metadata as any).evidence}
        />
      ) : (
        <Tabs defaultValue="table">
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="presentation">Presentation</TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <TimeTableView rows={data.rows} columns={data.columns} />
          </TabsContent>
          <TabsContent value="chart">
            <div className="p-4 border rounded-md">Chart view (not implemented)</div>
          </TabsContent>
          <TabsContent value="presentation">
            <div className="p-4 border rounded-md">Presentation view (not implemented)</div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
