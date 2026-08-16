import { TimeTableRow } from "@/lib/timetable/model"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type TimeTableViewProps = {
  rows: TimeTableRow[]
  columns: { key: string; label: string }[]
  highlightedRowIds?: string[]
}

export function TimeTableView({ rows, columns, highlightedRowIds = [] }: TimeTableViewProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => <TableHead key={col.key}>{col.label}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => {
            const isHighlighted = highlightedRowIds.includes(row._rowId)
            return (
              <TableRow 
                key={row._rowId}
                className={isHighlighted ? "bg-primary/20 hover:bg-primary/30 transition-colors" : ""}
              >
                {columns.map(col => (
                  <TableCell key={col.key}>
                    {String(row[col.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
